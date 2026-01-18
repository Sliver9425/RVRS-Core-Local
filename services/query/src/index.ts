import express from 'express';
import { Kafka } from 'kafkajs';
import { PrismaClient } from '@prisma/client'; 
import { createClient } from 'redis'; 
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// --- CONFIGURACIÓN REDIS ---
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

redisClient.on('error', (err) => console.log('❌ Redis Client Error', err));

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
      eachMessage: async ({ message }) => {
        if (!message.value) return;

        const payload = JSON.parse(message.value.toString());
        const { complaintId, analysis } = payload;

        console.log(`\n📥 [RECIBIDO DE IA] ID: ${complaintId}`);
        
        if (analysis) {
            try {
              // 1. Actualizar DB con el resultado de Gemini
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

              // 2. LIMPIEZA ESTRATÉGICA DE CACHÉ
              // Borramos el caché de la denuncia individual
              await redisClient.del(`complaint:${complaintId}`);
              
              // Borramos el caché de la LISTA del usuario para que vea el cambio en su historial
              await redisClient.del(`user_complaints:${updatedComplaint.userId}`);
              await redisClient.del('all_complaints');
              
              console.log(`   🧹 Caché invalidado para usuario: ${updatedComplaint.userId}`);

            } catch (dbError) {
              console.error(`   ❌ Error guardando en DB:`, dbError);
            }
        }
      },
    });
  } catch (error) {
    console.error('❌ Error fatal en Kafka Consumer:', error);
  }
};

// --- ENDPOINTS (LECTURA) ---

// Obtener denuncias de un usuario (Dashboard List)
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

// Obtener detalle de una denuncia
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
    // Intentamos buscar en caché primero
    const cacheKey = 'all_complaints';
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Si no está en caché, buscamos en la base de datos
    const complaints = await prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Guardamos en caché por 60 segundos (para no saturar)
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
    await redisClient.connect();
    console.log('✅ Redis Conectado');

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Query Service corriendo en puerto ${PORT}`);
      runConsumer();
    });
};

startServer();