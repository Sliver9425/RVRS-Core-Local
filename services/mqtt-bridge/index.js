const mqtt = require('mqtt');
const amqp = require('amqplib');

// Configuración con logs de inicio
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com';
const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE_NAME = 'mqtt_events';

async function init() {
  console.log('🚀 [MQTT-Bridge] Iniciando servicio...');

  try {
    // 1. Conexión a RabbitMQ con reintento simple
    console.log(`📡 [RabbitMQ] Conectando a: ${RABBIT_URL}`);
    const conn = await amqp.connect(RABBIT_URL);
    const channel = await conn.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log(`✅ [RabbitMQ] Conectado. Cola lista: ${QUEUE_NAME}`);

    // 2. Conexión a MQTT
    console.log(`🌐 [MQTT] Conectando a: ${MQTT_BROKER}`);
    const client = mqtt.connect(MQTT_BROKER);

    client.on('connect', () => {
      console.log('✅ [MQTT] Conectado exitosamente');
      client.subscribe('rvrs/alerts', (err) => {
        if (!err) console.log('👂 [MQTT] Suscrito a: rvrs/alerts');
      });
    });

    client.on('message', (topic, message) => {
      const payload = message.toString();
      console.log(`📩 [MQTT] Mensaje en ${topic}: ${payload}`);
      
      // Reenvío a RabbitMQ
      channel.sendToQueue(QUEUE_NAME, Buffer.from(payload));
      console.log(`   ➡️ [RabbitMQ] Enviado a la cola.`);
    });

    client.on('error', (err) => {
      console.error('❌ [MQTT] Error de conexión:', err.message);
    });

  } catch (error) {
    console.error('💥 [FATAL] Error en el arranque:', error.message);
    // IMPORTANTE: En Fargate, si el proceso sale con 1, ECS lo reinicia automáticamente
    process.exit(1);
  }
}

init();