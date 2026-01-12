import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { prisma } from '@rvrs/database';
import { connectKafka } from './config/kafka';
import complaintRoutes from './routes/complaint.routes';
import userRoutes from './routes/user.routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { execSync } from 'child_process'; 

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// --- Rutas ---
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/complaints', complaintRoutes);
app.use('/users', userRoutes);

// --- Health Check ---
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
    // 1. AUTO-MIGRACIÓN DE BASE DE DATOS
    console.log('🛠️ Checking database tables...');
    try {
        execSync('npx prisma db push --schema=../../packages/database/prisma/schema.prisma --accept-data-loss', { 
        stdio: 'inherit' });
        console.log('✅ Database tables are ready!');
    } catch (dbError) {
        console.error('⚠️ Warning: Could not run auto-migration:', dbError);
    }

    // 2. SEED DE USUARIO INICIAL (NUEVO)
    // Usamos el cliente prisma directamente para asegurar que exista un usuario para las denuncias
    console.log('👤 Checking initial user seed...');
    try {
        const initialUser = await prisma.user.upsert({
            where: { email: 'estudiante@universidad.edu' },
            update: {}, // No hace nada si ya existe
            create: {
                email: 'estudiante@universidad.edu',
                fullName: 'Usuario de Prueba',
                password: 'password123', // En producción usar hashing
                role: 'STUDENT'
            },
        });
        console.log(`✅ User ready! ID para Postman: ${initialUser.id}`);
    } catch (seedError) {
        console.error('⚠️ Warning: Could not seed initial user:', seedError);
    }

    // 3. Conectamos a Kafka
    await connectKafka();

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Command Service running on port ${PORT}`);
      console.log(`   Health Check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1); 
  }
};

startServer();