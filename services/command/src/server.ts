import express from 'express';
import morgan from 'morgan';
import { prisma } from '@rvrs/database'; // Asumo que esto funciona en tu build
import { connectKafka } from './config/kafka';
import complaintRoutes from './routes/complaint.routes';
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import swaggerUi from 'swagger-ui-express';
import { rabbit } from './config/rabbitmq';
import { swaggerSpec } from './config/swagger';

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares ---
// NOTA: No usamos CORS aquí porque Nginx (Gateway) lo maneja.
// Si lo activas aquí, tendrás error de "Double CORS headers".
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// --- Rutas ---
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/complaints', complaintRoutes);
app.use('/users', userRoutes);
app.use('/auth', authRoutes);

// --- Health Check REAL (Para el Load Balancer) ---
app.get('/health', async (req, res) => {
  try {
    // 1. Verificar conexión real a la BD
    // Esto lanza un error si Supabase no responde
    await prisma.$queryRaw`SELECT 1`; 

    res.json({
      status: 'active',
      service: 'Command Service',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Health Check Failed:', error);
    // Respondemos 500 para que el Load Balancer sepa que este contenedor no sirve
    res.status(500).json({ 
        status: 'unhealthy', 
        error: 'Database connection failed' 
    });
  }
});

// --- Iniciar Servidor ---
const startServer = async () => {
  try {
    console.log('🚀 Iniciando Command Service (Production Mode)...');

    // 1. Conectar a Kafka
    // Si falla, DEBE lanzar error para que el catch final mate el proceso
    await connectKafka();
    console.log('✅ Kafka Conectado');

    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    await rabbit.connect(rabbitUrl);

    // 2. Levantar servidor Express
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`✅ Command Service corriendo en puerto ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Error FATAL al iniciar el servicio:', error);
    // 🔥 CRÍTICO PARA ECS:
    // Salimos con código 1 para que ECS vea que la tarea falló y la reinicie.
    process.exit(1); 
  }
};

startServer();