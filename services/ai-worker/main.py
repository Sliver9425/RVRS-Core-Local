import asyncio
import json
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from dotenv import load_dotenv
from logic import analyze_severity

load_dotenv()

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "127.0.0.1:9092")
CONSUME_TOPIC = os.getenv("KAFKA_TOPIC", "complaint.received") 
PRODUCE_TOPIC = os.getenv("KAFKA_PROCESSED_TOPIC", "complaint.processed")
GROUP_ID = os.getenv("KAFKA_GROUP_ID", "ai-worker-vfinal-kraft")

consumer = None
producer = None

async def process_message(msg):
    try:
        data = json.loads(msg.value.decode('utf-8'))
        complaint_id = data.get('complaintId')
        title = data.get('title')
        description = data.get('description')
        evidence_url = data.get('evidenceUrl')

        print(f"\n🤖 [Procesando] ID: {complaint_id}")
        analysis = await analyze_severity(f"{title}: {description}", evidence_url)
        
        processed_event = {
            "complaintId": complaint_id,
            "analysis": analysis,          
            "originalData": data           
        }

        await producer.send_and_wait(PRODUCE_TOPIC, json.dumps(processed_event).encode('utf-8'))
        print(f"   📨 Resultado enviado a '{PRODUCE_TOPIC}'")
    except Exception as e:
        print(f"❌ Error procesando mensaje: {e}")

async def consume_loop():
    """Bucle infinito con manejo de errores de conexión"""
    print(f"👂 Escuchando en: {CONSUME_TOPIC}")
    while True:
        try:
            async for msg in consumer:
                await process_message(msg)
        except Exception as e:
            print(f"⚠️ Error en el bucle de consumo: {e}. Reintentando...")
            await asyncio.sleep(5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global consumer, producer
    
    
    print("🔗 Conectando Productor...")
    producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS)
    await producer.start()

   
    consumer = AIOKafkaConsumer(
        CONSUME_TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id=GROUP_ID,
        auto_offset_reset='earliest',
        retry_backoff_ms=5000 
    )

    connected = False
    while not connected:
        try:
            print(f"📡 Intentando conectar al tópico '{CONSUME_TOPIC}'...")
            await consumer.start()
            connected = True
            print("✅ Conexión exitosa con Kafka")
        except Exception as e:
            print(f"⏳ Kafka no disponible o tópico inexistente. Reintentando en 5s... ({e})")
            await asyncio.sleep(5)
    
    asyncio.create_task(consume_loop())
    yield
    
    print("🛑 Deteniendo servicios...")
    await consumer.stop()
    await producer.stop()

app = FastAPI(lifespan=lifespan, title="RVRS AI Processor")

@app.get("/health")
async def health_check():
    return {"status": "active"}