import amqp from 'amqplib';
import nodemailer from 'nodemailer'; // 1. Importamos la librería de email
import dotenv from 'dotenv';

// Cargar variables de entorno (.env)
dotenv.config();

const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

// 2. Configurar el "Cartero" (Transporter) de Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER, // Tu correo (desde docker-compose)
    pass: process.env.SMTP_PASS  // Tu contraseña de aplicación (desde docker-compose)
  }
});

async function startNotificationService() {
  try {
    console.log('📧 Notification Service iniciando...');
    
    // Verificar que tengamos credenciales antes de arrancar
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ ADVERTENCIA: Credenciales SMTP no encontradas. Los correos podrían fallar.');
    }

    const connection = await amqp.connect(RABBIT_URL);
    const channel = await connection.createChannel();

    // 1. Asegurar Exchange y Cola
    const exchange = 'complaints_events';
    const queue = 'notification_queue'; 

    await channel.assertExchange(exchange, 'fanout', { durable: true });
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, '');

    console.log('✅ Esperando mensajes para enviar correos REALES...');

    // 2. Procesar mensajes
    // Hacemos la función async para poder usar 'await' al enviar el correo
    channel.consume(queue, async (msg) => {
      if (msg) {
        const content = JSON.parse(msg.content.toString());
        console.log(`\n📥 [RABBITMQ] Procesando evento ID: ${content.id}`);
        
        try {
            // 3. ENVIAR CORREO REAL
            const info = await transporter.sendMail({
                from: `"Sistema de Denuncias RVRS" <${process.env.SMTP_USER}>`, // Remitente
                
                // ⚠️ OJO: Para probar, pon tu correo personal aquí "hardcodeado". 
                // Cuando el sistema esté listo, usarás: content.userEmail
                to: 'damianalejandro.9422@gmail.com', 
                
                subject: `📢 Nueva Denuncia: ${content.title}`, // Asunto dinámico
                
                // Cuerpo del correo en HTML bonito
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #d32f2f; padding: 20px; text-align: center;">
                            <h2 style="color: white; margin: 0;">Nueva Denuncia Registrada</h2>
                        </div>
                        <div style="padding: 20px; background-color: #fafafa;">
                            <p style="font-size: 16px; color: #333;">Hola Admin,</p>
                            <p>Se ha recibido una nueva denuncia en el sistema con los siguientes detalles:</p>
                            
                            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">ID:</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${content.id}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Título:</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${content.title}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Descripción:</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${content.description}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Edificio:</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${content.building || 'N/A'}</td>
                                </tr>
                            </table>

                            <div style="margin-top: 25px; text-align: center;">
                                <a href="http://localhost:3000/dashboard" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver en el Dashboard</a>
                            </div>
                        </div>
                        <div style="background-color: #eee; padding: 10px; text-align: center; font-size: 12px; color: #666;">
                            Sistema de Denuncias RVRS - Notificación Automática
                        </div>
                    </div>
                `
            });

            console.log(`✅ [EMAIL ENVIADO] Message ID: ${info.messageId}`);
            
            // Confirmamos a RabbitMQ SOLO si el correo salió bien
            channel.ack(msg);

        } catch (emailError) {
            console.error('❌ Error enviando el correo:', emailError);
            // IMPORTANTE: Aquí decidimos qué hacer.
            // Si hacemos ack(), perdemos el mensaje.
            // Si no hacemos nada, RabbitMQ lo reenviará eternamente (bucle infinito).
            // Por ahora, para evitar bucles en desarrollo, confirmamos el mensaje aunque falle.
            channel.ack(msg); 
        }
      }
    });

  } catch (error) {
    console.error('❌ Error general en Notification Service:', error);
    setTimeout(startNotificationService, 5000);
  }
}

startNotificationService();