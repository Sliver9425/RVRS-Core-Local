import express from 'express';
import { Kafka } from 'kafkajs';
import { PrismaClient } from '@prisma/client'; 
import { createClient } from 'redis'; 
import dotenv from 'dotenv';

// 1. 🔥 IMPORTAR CLIENTE RABBITMQ
import { rabbit } from './config/rabbitmq';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// --- CONFIGURACIÓN REDIS ---
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

redisClient.on('error', (err) => console.log('❌ Redis Client Error', err));

const prisma = new PrismaClient();

// --- CONFIGURACIÓN DE KAFKA (Se mantiene igual) ---
const kafka = new Kafka({
  clientId: 'query-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'query-service-group' });

// Consumidor de Kafka (IA -> DB)
const runKafkaConsumer = async () => {
  try {
    await consumer.connect();
    console.log('👂 [Kafka] Query Service conectado');
    await consumer.subscribe({ topic: 'complaint.processed', fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;

        const payload = JSON.parse(message.value.toString());
        const { complaintId, analysis } = payload;

        console.log(`\n📥 [KAFKA - RECIBIDO DE IA] ID: ${complaintId}`);
        
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
              console.log(`   ✅ DB actualizada con IA.`);

              // Limpieza de Caché por actualización de IA
              await redisClient.del(`complaint:${complaintId}`);
              await redisClient.del(`user_complaints:${updatedComplaint.userId}`);
              await redisClient.del('all_complaints');
              
            } catch (dbError) {
              console.error(`   ❌ Error guardando IA en DB:`, dbError);
            }
        }
      },
    });
  } catch (error) {
    console.error('❌ Error fatal en Kafka Consumer:', error);
  }
};

// --- 🔥 NUEVO: CONSUMIDOR RABBITMQ (Command -> Cache Invalidation) ---
const runRabbitConsumer = async () => {
    // Usamos el nuevo método de la clase
    await rabbit.consumeEvent('query_service_sync', async (content) => {
        
        console.log(`\n📥 [RABBITMQ] Evento recibido: ${content.title} (ID: ${content.id})`);

        // ESTRATEGIA CQRS: INVALIDACIÓN DE CACHÉ
        try {
            // Borrar lista general
            await redisClient.del('all_complaints');
            
            // Borrar lista del usuario específico
            if (content.userId) {
                await redisClient.del(`user_complaints:${content.userId}`);
                console.log(`   🧹 Caché limpiado para usuario ${content.userId}`);
            }
            
        } catch (err) {
            console.error('Error limpiando caché:', err);
        }
    });
};



// --- ENDPOINTS (LECTURA) ---

app.get('/complaints/user/:userId', async (req: any, res: any) => {
  const { userId } = req.params;
  const cacheKey = `user_complaints:${userId}`;

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log('⚡ Hit de Caché (Lista Usuario)');
      return res.json(JSON.parse(cachedData));
    }

    console.log('🐢 Miss de Caché (Postgres)');
    const complaints = await prisma.complaint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    await redisClient.setEx(cacheKey, 300, JSON.stringify(complaints));
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener denuncias' });
  }
});

app.get('/complaints/:id', async (req: any, res: any) => {
  const { id } = req.params;
  const cacheKey = `complaint:${id}`;

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log('⚡ Hit de Caché (Individual)');
      return res.json(JSON.parse(cachedData));
    }

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) return res.status(404).json({ error: 'No encontrada' });

    await redisClient.setEx(cacheKey, 3600, JSON.stringify(complaint));
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/complaints', async (req: any, res: any) => {
  try {
    const cacheKey = 'all_complaints';
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    const complaints = await prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' }
    });

    await redisClient.setEx(cacheKey, 60, JSON.stringify(complaints));
    
    res.json(complaints);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error obteniendo denuncias' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'active', redis: redisClient.isOpen ? 'Connected' : 'Disconnected' });
});

// --- INICIAR SERVIDOR ---
const startServer = async () => {
    // 1. Conectar Redis
    await redisClient.connect();
    console.log('✅ Redis Conectado');

    // 2. 🔥 Conectar RabbitMQ (Nuevo)
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    await rabbit.connect(rabbitUrl);

    // 3. Iniciar Server Express
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Query Service corriendo en puerto ${PORT}`);
      
      // 4. Arrancar Consumidores en segundo plano
      runKafkaConsumer();  // Para IA
      runRabbitConsumer(); // Para Caché/Sincronización
    });
};

startServer();