import os
import time
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv

load_dotenv()

def ingest_statute():
    print("📚 Cargando estatuto universitario...")
    
    loader = TextLoader("./data/estatuto.txt", encoding="utf-8")
    documents = loader.load()
    
    # 1. Partir el texto
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100,
        separators=["\n\n", "\n", " ", ""]
    )
    docs = text_splitter.split_documents(documents)
    print(f"🧩 Texto dividido en {len(docs)} fragmentos.")
    
    # 2. Configurar Embeddings (Usamos el modelo más nuevo 004)
    embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
    
    # 3. Procesamiento por LOTES (Batching) para evitar error 429
    # La capa gratuita no soporta enviar todo de golpe.
    batch_size = 5  # Procesar de 5 en 5 fragmentos
    vectorstore = None
    
    print("💎 Generando vectores con Google Gemini (Lento para respetar límites)...")
    
    for i in range(0, len(docs), batch_size):
        batch = docs[i : i + batch_size]
        print(f"   - Procesando lote {i//batch_size + 1}/{(len(docs)//batch_size)+1}...")
        
        try:
            if vectorstore is None:
                # Crear el primer lote
                vectorstore = FAISS.from_documents(batch, embeddings)
            else:
                # Agregar los siguientes lotes al existente
                vectorstore.add_documents(batch)
            
            # ¡IMPORTANTE! Esperar 2 segundos entre lotes para no saturar la API
            time.sleep(2) 
            
        except Exception as e:
            print(f"❌ Error en lote {i}: {e}")
            # Si falla, esperamos un poco más e intentamos seguir (o paramos)
            time.sleep(10)

    # 4. Guardar
    if vectorstore:
        vectorstore.save_local("faiss_index")
        print("✅ Estatuto indexado correctamente en 'faiss_index'")
    else:
        print("❌ No se pudo crear el índice.")

if __name__ == "__main__":
    ingest_statute()