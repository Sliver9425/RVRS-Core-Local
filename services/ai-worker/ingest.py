import os
import time
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv

load_dotenv()

def ingest_statute():
    # RUTA ORIGINAL CONFIRMADA
    file_path = "./data/estatuto.txt"
    
    if not os.path.exists(file_path):
        print(f"❌ Error: No se encuentra el archivo '{file_path}'. Verifica que la carpeta 'data' exista.")
        return

    print(f"📚 Cargando estatuto y normativas desde {file_path}...")
    
    try:
        loader = TextLoader(file_path, encoding="utf-8")
        documents = loader.load()
    except Exception as e:
        print(f"❌ Error leyendo el archivo: {e}")
        return
    
    # 1. Partir el texto (AJUSTADO PARA CAPTURAR RESOLUCIONES ENTERAS)
    # Usamos 2500 para que un artículo largo o la resolución completa quepan en un solo vector
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=2500,    
        chunk_overlap=250,   
        separators=["\n\n", "Artículo", "\n", " ", ""] 
    )
    docs = text_splitter.split_documents(documents)
    print(f"🧩 Texto dividido en {len(docs)} fragmentos de alto contexto.")
    
    # 2. Configurar Embeddings
    embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
    
    # 3. Procesamiento por LOTES (Batching para evitar error 429)
    batch_size = 5
    vectorstore = None
    
    print("💎 Generando vectores con Google Gemini (Lento para respetar límites)...")
    
    total_batches = (len(docs) // batch_size) + 1
    
    for i in range(0, len(docs), batch_size):
        batch = docs[i : i + batch_size]
        current_batch = (i // batch_size) + 1
        print(f"   - Procesando lote {current_batch}/{total_batches} ({len(batch)} docs)...")
        
        try:
            if vectorstore is None:
                vectorstore = FAISS.from_documents(batch, embeddings)
            else:
                vectorstore.add_documents(batch)
            
            # Pausa de seguridad
            time.sleep(2) 
            
        except Exception as e:
            print(f"❌ Error en lote {current_batch}: {e}")
            print("   ⏳ Esperando 20 segundos por si es Rate Limit...")
            time.sleep(20) # Espera más larga si falla
            try:
                # Reintento simple
                if vectorstore is None:
                    vectorstore = FAISS.from_documents(batch, embeddings)
                else:
                    vectorstore.add_documents(batch)
            except Exception as e2:
                print(f"   ❌ Falló el reintento. Saltando este lote. Error: {e2}")

    # 4. Guardar
    if vectorstore:
        vectorstore.save_local("faiss_index")
        print("✅ ¡ÉXITO! Base de conocimiento actualizada en 'faiss_index'")
    else:
        print("❌ No se pudo crear el índice.")

if __name__ == "__main__":
    ingest_statute()