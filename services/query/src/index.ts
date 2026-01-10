import express from 'express';
import { Kafka } from 'kafkajs';
import { PrismaClient } from '@prisma/client'; 
import { createClient } from 'redis'; // <--- 1. IMPORTANTE
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// --- CONFIGURACIÓN REDIS ---
const redisClient = createClient({
  // Docker usa el nombre del servicio 'redis', local usa 'localhost'
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

redisClient.on('error', (err) => console.log('❌ Redis Client Error', err));

// Instancia de Prisma
const prisma = new PrismaClient();

// --- CONFIGURACIÓN DE KAFKA ---
const kafka = new Kafka({
  clientId: 'query-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'query-service-group' });

const runConsumer = async () => {
  try {
    await consumer.connect();
    console.log('👂 Query Service conectado a Kafka');

    await consumer.subscribe({ topic: 'complaint.processed', fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return;

        const payload = JSON.parse(message.value.toString());
        const { complaintId, analysis } = payload;

        console.log(`\n📥 [RECIBIDO DE IA] ID: ${complaintId}`);
        
        if (analysis) {
            console.log(`   ⚖️  Veredicto: ${analysis.severity} - ${analysis.suggested_sanction}`);

            try {
              // 1. Actualizar DB
              await prisma.complaint.update({
                where: { id: complaintId },
                data: {
                  aiStatus: 'PROCESSED',
                  aiSeverity: analysis.severity,
                  aiScore: analysis.score,
                  suggestedSanction: analysis.suggested_sanction,
                  analysisJson: analysis as any, 
                }
              });
              console.log(`   ✅ Base de datos actualizada con el juicio de la IA.`);

              // 2. INVALIDAR CACHÉ (REDIS)
              // Borramos el dato viejo para que la próxima lectura traiga el veredicto nuevo
              await redisClient.del(`complaint:${complaintId}`);
              console.log(`   🧹 Caché borrado para obligar actualización.`);

            } catch (dbError) {
              console.error(`   ❌ Error guardando en DB:`, dbError);
            }
        } else {
            console.error("   ⚠️ El mensaje llegó sin análisis.");
        }
      },
    });
  } catch (error) {
    console.error('❌ Error fatal en Kafka Consumer:', error);
  }
};

// --- ENDPOINTS ---

app.get('/complaints/:id', async (req: any, res: any) => {
  const { id } = req.params;
  const cacheKey = `complaint:${id}`;

  try {
    // A. INTENTAR LEER DE REDIS
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log('⚡ Hit de Caché (Redis)'); // <--- ¡AQUI ESTÁ EL LOG!
      return res.json(JSON.parse(cachedData));
    }

    console.log('🐢 Miss de Caché (Postgres)');

    // B. SI NO ESTÁ, LEER DE POSTGRES
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    
    if (!complaint) return res.status(404).json({ error: 'Denuncia no encontrada' });

    // C. GUARDAR EN REDIS (TTL: 1 Hora)
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(complaint));

    res.json(complaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'active', role: 'Reader', redis: redisClient.isOpen ? 'Connected' : 'Disconnected' });
});

// --- INICIAR SERVIDOR ---
const startServer = async () => {
    // Conectamos Redis antes de escuchar peticiones
    await redisClient.connect();
    console.log('✅ Redis Conectado');

    // Escuchamos en 0.0.0.0 para Docker
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Query Service corriendo en puerto ${PORT}`);
      runConsumer();
    });
};

startServer();