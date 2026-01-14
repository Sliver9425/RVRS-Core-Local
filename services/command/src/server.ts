import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { prisma } from '@rvrs/database';
import { connectKafka } from './config/kafka';
import complaintRoutes from './routes/complaint.routes';
import userRoutes from './routes/user.routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
// import { execSync } from 'child_process'; // Comentado para evitar errores de CLI

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
  // En modo debug, devolvemos OK simple sin intentar tocar la BD
  res.json({
    status: 'OK (DEBUG MODE)',
    service: 'Command Service',
    note: 'Database connection disabled for network testing'
  });
});

// --- Iniciar Servidor ---
const startServer = async () => {
  try {
    console.log('🚧 Starting in DEBUG MODE to test Network Connectivity...');

    // 1. AUTO-MIGRACIÓN DE BASE DE DATOS (COMENTADO TEMPORALMENTE)
    // El execSync falla si no hay red o si Prisma CLI no está en el path exacto
    /* console.log('🛠️ Checking database tables...');
    try {
        execSync('npx prisma db push --schema=../../packages/database/prisma/schema.prisma --accept-data-loss', { 
        stdio: 'inherit' });
        console.log('✅ Database tables are ready!');
    } catch (dbError) {
        console.error('⚠️ Warning: Could not run auto-migration:', dbError);
    }
    */

    // 2. SEED DE USUARIO INICIAL (COMENTADO TEMPORALMENTE)
    // Esto dispara la conexión a Supabase y causa el crash P1001
    /*
    console.log('👤 Checking initial user seed...');
    try {
        const initialUser = await prisma.user.upsert({
            where: { email: 'estudiante@universidad.edu' },
            update: {}, 
            create: {
                email: 'estudiante@universidad.edu',
                fullName: 'Usuario de Prueba',
                password: 'password123', 
                role: 'STUDENT'
            },
        });
        console.log(`✅ User ready! ID para Postman: ${initialUser.id}`);
    } catch (seedError) {
        console.error('⚠️ Warning: Could not seed initial user:', seedError);
    }
    */

    // 3. Conectamos a Kafka (Intentamos, pero no matamos el server si falla)
    try {
        await connectKafka();
    } catch (kafkaError) {
        console.warn("⚠️ Kafka failed to connect, but continuing server startup for debug:", kafkaError);
    }

    // 4. INICIO DEL SERVIDOR (Lo hacemos pase lo que pase)
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Command Service running on port ${PORT} (DEBUG MODE)`);
      console.log(`   Health Check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    // process.exit(1); // <--- COMENTADO: No matar el contenedor, dejarlo vivo para entrar
  }
};

startServer();