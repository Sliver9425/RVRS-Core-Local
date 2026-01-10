import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RVRS Command Service API',
      version: '1.0.0',
      description: 'API para recibir denuncias y enviarlas a Kafka',
    },
    servers: [
      {
        url: 'http://localhost:3001',
      },
    ],
  },
  // --- AQUÍ ESTÁ LA MAGIA ---
  // __dirname nos da la ubicación actual (src/config)
  // '../routes/*.ts' nos lleva a la carpeta de rutas de forma segura
  apis: [path.join(__dirname, '../routes/*.ts')], 
};

export const swaggerSpec = swaggerJsdoc(options);