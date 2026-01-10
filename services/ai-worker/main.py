import asyncio
import json
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from dotenv import load_dotenv
from logic import analyze_severity  # <--- Asegúrate de que logic.py acepte la URL

load_dotenv()

# Configuración
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

# 1. CORRECCIÓN: El tópico debe coincidir con el del Command Service
CONSUME_TOPIC = os.getenv("KAFKA_TOPIC", "complaint.received") 
PRODUCE_TOPIC = os.getenv("KAFKA_PROCESSED_TOPIC", "complaint.processed")

# Variables globales
consumer = None
producer = None

async def process_message(msg):
    """
    Flujo: Recibir -> Analizar con Gemini (Texto + Foto) -> Publicar Veredicto
    """
    try:
        # 1. Leer datos de Kafka
        data = json.loads(msg.value.decode('utf-8'))
        
        complaint_id = data.get('complaintId')
        title = data.get('title')             # <--- Importante para el contexto
        description = data.get('description')
        evidence_url = data.get('evidenceUrl') # <--- CORRECCIÓN: Capturamos la URL de la foto

        print(f"\n🤖 [Procesando] ID: {complaint_id}")
        print(f"   📸 Evidencia: {evidence_url}")

        # 2. Consultar a Gemini (Pasamos también la URL)
        # NOTA: Tu logic.py debe estar preparado para recibir este segundo argumento
        analysis = await analyze_severity(f"{title}: {description}", evidence_url)
        
        print(f"   🧠 Veredicto: {analysis.get('severity')} - {analysis.get('suggested_sanction')}")

        # 3. Empaquetar el resultado
        processed_event = {
            "complaintId": complaint_id,
            "analysis": analysis,          
            "originalData": data           
        }

        # 4. Publicar en el tema de salida
        await producer.send_and_wait(
            PRODUCE_TOPIC, 
            json.dumps(processed_event).encode('utf-8')
        )
        print(f"   📨 Resultado enviado a '{PRODUCE_TOPIC}'")

    except Exception as e:
        print(f"❌ Error procesando mensaje: {e}")

async def consume_loop():
    """Bucle infinito de lectura"""
    print(f"👂 Escuchando activamente en: {CONSUME_TOPIC}")
    async for msg in consumer:
        await process_message(msg)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global consumer, producer
    
    producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS)
    await producer.start()

    consumer = AIOKafkaConsumer(
        CONSUME_TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id="ai-worker-group-vision" # Cambié el grupo para evitar conflictos viejos
    )
    await consumer.start()
    
    task = asyncio.create_task(consume_loop())
    
    yield
    
    print("🛑 Deteniendo servicios...")
    await consumer.stop()
    await producer.stop()

app = FastAPI(lifespan=lifespan, title="RVRS AI Processor")

@app.get("/health")
async def health_check():
    return {"status": "active", "brain": "Gemini 1.5 Flash Vision"}