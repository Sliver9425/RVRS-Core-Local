import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { prisma } from '@rvrs/database';
import { connectKafka } from './config/kafka';       // <--- Importamos la conexión a Kafka
import complaintRoutes from './routes/complaint.routes'; // <--- Importamos las rutas de denuncias
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// --- Rutas ---
// Aquí montamos el controlador que creamos. 
// Todas las peticiones a /complaints irán a complaint.routes.ts
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/complaints', complaintRoutes);

// --- Health Check (Mantener para verificar estado) ---
app.get('/health', async (req, res) => {
  try {
    const usersCount = await prisma.user.count();
    res.json({
      status: 'OK',
      service: 'Command Service',
      database: 'Connected',
      kafka: 'Ready (Producer)',
      usersInDb: usersCount
    });
  } catch (error) {
    console.error('Health Check Error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: String(error)
    });
  }
});

// --- Iniciar Servidor ---
const startServer = async () => {
  try {
    // 1. Conectamos a Kafka antes de abrir el puerto HTTP
    // Si Kafka falla, el servicio no debería arrancar (Fail Fast)
    await connectKafka();

    console.log('Swagger Docs:', JSON.stringify(swaggerSpec, null, 2));
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Command Service running on port ${PORT}`);
      console.log(`   Health Check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1); // Cerramos el proceso si falla la infraestructura crítica
  }
};

startServer();