import express from 'express';
import { Kafka } from 'kafkajs';
import { PrismaClient } from '@prisma/client'; 
import { createClient } from 'redis'; 
import dotenv from 'dotenv';
import { rabbit } from './config/rabbitmq';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// --- ESTADO GLOBAL ---
let isKafkaConnected = false; 

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

redisClient.on('error', (err) => console.log('❌ Redis Client Error', err));

const prisma = new PrismaClient();

const kafka = new Kafka({
  clientId: 'query-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'query-service-group-v3' });

// --- CONSUMIDOR KAFKA CON REINTENTOS ---
const runKafkaConsumer = async () => {
  // Usamos la variable global isKafkaConnected
  while (!isKafkaConnected) {
    try {
      console.log('⌛ [Kafka] Intentando conectar consumidor...');
      await consumer.connect();
      
      // Intentamos suscripción
      await consumer.subscribe({ topic: 'complaint.processed', fromBeginning: false });

      await consumer.run({
        eachMessage: async ({ message }) => {
          if (!message.value) return;
          const payload = JSON.parse(message.value.toString());
          const { complaintId, analysis } = payload;

          console.log(`\n📥 [KAFKA] Recibido análisis para ID: ${complaintId}`);
          
          if (analysis) {
            try {
              const updatedComplaint = await prisma.complaint.update({
                where: { id: complaintId },
                data: {
                  aiStatus: 'PROCESSED',
                  aiSeverity: analysis.severity,
                  aiScore: analysis.score,
                  suggestedSanction: analysis.suggested_sanction,
                  analysisJson: analysis as any, 
                }
              });
              console.log(`   ✅ DB actualizada.`);
              await redisClient.del(`complaint:${complaintId}`);
              await redisClient.del(`user_complaints:${updatedComplaint.userId}`);
              await redisClient.del('all_complaints');
            } catch (dbError) {
              console.error(`   ❌ Error en DB:`, dbError);
            }
          }
        },
      });

      isKafkaConnected = true; // ✅ Actualizamos el estado global
      console.log('✅ [Kafka] Query Service conectado y escuchando');
    } catch (error) {
      console.error('⏳ Kafka no listo o tópico inexistente. Reintentando en 5s...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

const runRabbitConsumer = async () => {
    await rabbit.consumeEvent('query_service_sync', async (content) => {
        console.log(`\n📥 [RABBITMQ] Sincronizando: ${content.title}`);
        try {
            await redisClient.del('all_complaints');
            if (content.userId) {
                await redisClient.del(`user_complaints:${content.userId}`);
            }
        } catch (err) {
            console.error('Error limpieza caché:', err);
        }
    });
};

// --- ENDPOINTS ---
app.get('/health', (req, res) => {
  res.json({ 
    status: 'active', 
    kafka: isKafkaConnected ? 'Connected' : 'Connecting',
    redis: redisClient.isOpen ? 'Connected' : 'Disconnected' 
  });
});

app.get('/complaints/user/:userId', async (req: any, res: any) => {
  const { userId } = req.params;
  const cacheKey = `user_complaints:${userId}`;
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) return res.json(JSON.parse(cachedData));
    const complaints = await prisma.complaint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    await redisClient.setEx(cacheKey, 300, JSON.stringify(complaints));
    res.json(complaints);
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});

app.get('/complaints', async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(complaints);
  } catch (e) { res.status(500).send("Error"); }
});

const startServer = async () => {
    try {
        await redisClient.connect();
        const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
        await rabbit.connect(rabbitUrl);

        app.listen(Number(PORT), '0.0.0.0', () => {
          console.log(`🚀 Query Service en puerto ${PORT}`);
          runKafkaConsumer();  
          runRabbitConsumer(); 
        });
    } catch (error) {
        console.error("❌ Fallo en inicio:", error);
    }
};

startServer();