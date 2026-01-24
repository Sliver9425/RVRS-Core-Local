import express from 'express';
import morgan from 'morgan';
import { prisma } from '@rvrs/database'; 
import { connectKafka } from './config/kafka';
import complaintRoutes from './routes/complaint.routes';
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import swaggerUi from 'swagger-ui-express';
import { rabbit } from './config/rabbitmq';
import { swaggerSpec } from './config/swagger';

const app = express();
const PORT = process.env.PORT || 3001;


app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));


app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/complaints', complaintRoutes);
app.use('/users', userRoutes);
app.use('/auth', authRoutes);


app.get('/health', async (req, res) => {
  try {
    
    await prisma.$queryRaw`SELECT 1`; 

    res.json({
      status: 'active',
      service: 'Command Service',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Health Check Failed:', error);
    
    res.status(500).json({ 
        status: 'unhealthy', 
        error: 'Database connection failed' 
    });
  }
});


const startServer = async () => {
  try {
    console.log('🚀 Iniciando Command Service (Production Mode)...');

    
    await connectKafka();
    console.log('✅ Kafka Conectado');

    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    await rabbit.connect(rabbitUrl);

    
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`✅ Command Service corriendo en puerto ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Error FATAL al iniciar el servicio:', error);
    
    process.exit(1); 
  }
};

startServer();