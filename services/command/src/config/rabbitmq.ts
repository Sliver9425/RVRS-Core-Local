
import type { Channel, Connection } from 'amqplib';
const amqp = require('amqplib');

class RabbitMQClient {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private connected: boolean = false;

  async connect(url: string) {
    
    if (this.connected && this.channel) return;

    try {
      console.log(`⌛ [RabbitMQ] Conectando a ${url}...`);

    
      const connection: any = await amqp.connect(url);
      
      
      this.connection = connection;

      
      this.channel = await connection.createChannel();
      
      this.connected = true;
      console.log(`✅ [RabbitMQ] Conectado exitosamente`);

      
      if (this.channel) {
        await this.channel.assertExchange('complaints_events', 'fanout', { durable: true });
      }

    } catch (error) {
      console.error('❌ [RabbitMQ] Error de conexión:', error);
      
      setTimeout(() => this.connect(url), 5000);
    }
  }

  async publishEvent(routingKey: string, data: any) {
    if (!this.channel) {
      console.error('❌ [RabbitMQ] No se puede enviar mensaje: Canal no inicializado');
      return;
    }

    try {
      this.channel.publish(
        'complaints_events',
        routingKey,
        Buffer.from(JSON.stringify(data))
      );
      console.log(`📤 [RabbitMQ] Evento enviado: ${routingKey}`);
    } catch (e) {
      console.error('Error publicando evento:', e);
    }
  }
}

export const rabbit = new RabbitMQClient();