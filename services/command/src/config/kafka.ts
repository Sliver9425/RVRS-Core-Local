import { Kafka, Partitioners, Producer } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'command-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'], 
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

const producer: Producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner
});

export const connectKafka = async () => {
  try {
    await producer.connect();
    console.log('✅ Kafka Producer connected');
  } catch (error) {
    console.error('❌ Kafka Connection Error:', error);
  }
};

export const sendEvent = async (topic: string, data: any) => {
  try {
    await producer.send({
      topic,
      messages: [
        { value: JSON.stringify(data) }
      ],
    });
    console.log(`📨 Event sent to topic: ${topic}`);
  } catch (error) {
    console.error(`Error sending event to ${topic}:`, error);
  }
};