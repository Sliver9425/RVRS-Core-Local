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
      
      // Aseguramos que el Exchange exista
      if (this.channel) {
        await this.channel.assertExchange('complaints_events', 'fanout', { durable: true });
      }
    } catch (error) {
      console.error('❌ [RabbitMQ] Error de conexión:', error);
      setTimeout(() => this.connect(url), 5000);
    }
  }

  async publishEvent(routingKey: string, data: any) {
     // ... (Este método ya lo tienes, déjalo igual) ...
     if (!this.channel) return;
     this.channel.publish('complaints_events', routingKey, Buffer.from(JSON.stringify(data)));
  }

  // 🔥 NUEVO MÉTODO: CONSUMIR EVENTOS
  // Este método encapsula la lógica de escuchar
  async consumeEvent(queueName: string, callback: (data: any) => Promise<void>) {
    if (!this.channel) {
        console.error('❌ [RabbitMQ] No se puede consumir: Canal no inicializado');
        return;
    }

    try {
        // 1. Crear la cola si no existe
        await this.channel.assertQueue(queueName, { durable: true });
        
        // 2. Unir la cola al "Exchange" de eventos (para escuchar lo que publica Command Service)
        await this.channel.bindQueue(queueName, 'complaints_events', '');

        console.log(`🐰 [RabbitMQ] Escuchando en cola: ${queueName}`);

        // 3. Empezar a leer mensajes
        this.channel.consume(queueName, async (msg: any) => {
            if (msg) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    // Ejecutar la lógica que nos pasen desde index.ts
                    await callback(content);
                    // Confirmar que se procesó bien
                    this.channel?.ack(msg);
                } catch (err) {
                    console.error('Error procesando mensaje RabbitMQ:', err);
                    // Podrías usar nack() aquí si quieres reintentar
                }
            }
        });

    } catch (error) {
        console.error('Error configurando consumidor:', error);
    }
  }
}

export const rabbit = new RabbitMQClient();