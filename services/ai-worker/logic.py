import os
import json
import httpx
import google.generativeai as genai
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv

load_dotenv()

# --- CONFIGURACIÓN DIRECTA DE GEMINI (SDK OFICIAL) ---
# Esto evita el error de validación de LangChain
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# --- 1. Cargar la "Memoria" (RAG con LangChain) ---
embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

try:
    vectorstore = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
    print("📚 FAISS cargado correctamente.")
except Exception as e:
    print(f"⚠️ Error cargando FAISS: {e}")
    retriever = None

# --- Funciones Auxiliares ---
def clean_json_string(json_str: str) -> str:
    """Limpia el string si Gemini devuelve markdown (```json ... ```)"""
    if "```json" in json_str:
        json_str = json_str.split("```json")[1].split("```")[0]
    elif "```" in json_str:
        json_str = json_str.split("```")[1].split("```")[0]
    return json_str.strip()

async def download_image(url: str):
    """Descarga la imagen de Backblaze a memoria"""
    if not url or not url.startswith("http"):
        return None
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                return {
                    "mime_type": resp.headers.get("content-type", "image/jpeg"),
                    "data": resp.content
                }
    except Exception as e:
        print(f"   ⚠️ No se pudo descargar la imagen: {e}")
    return None

# --- 2. Función Principal ---
async def analyze_severity(description: str, evidence_url: str = None) -> dict:
    try:
        print(f"   🧠 Consultando a Gemini (SDK Oficial)...")

        # PASO A: Recuperar Contexto Legal (RAG usando LangChain)
        context_text = ""
        if retriever:
            try:
                docs = await retriever.ainvoke(description)
                context_text = "\n\n".join(doc.page_content for doc in docs)
            except Exception as e:
                print(f"   ⚠️ Falló RAG, usando conocimiento general: {e}")

        # PASO B: Preparar Prompt
        prompt_text = f"""
        Actúa como el sistema experto de disciplina de la Universidad Central del Ecuador.
        
        CONTEXTO LEGAL (Estatuto):
        {context_text}

        DENUNCIA:
        "{description}"

        INSTRUCCIONES:
        1. Analiza la imagen (si se proporciona) y el texto.
        2. Busca la infracción en el estatuto (Arts. 114, 115, 116).
        3. Clasifica la gravedad y sanción (Art. 118).
        4. Si la imagen contradice el texto, marca LOW.
        
        Responde SOLAMENTE con un JSON válido con esta estructura:
        {{
            "severity": "HIGH | MEDIUM | LOW",
            "score": 0.0 a 1.0,
            "detected_infraction": "Nombre de la infracción",
            "suggested_sanction": "Sanción sugerida",
            "cited_article": "Artículo infringido",
            "reasoning": "Explicación breve"
        }}
        """

        # PASO C: Preparar Contenido (Multimodal)
        # Usamos el modelo Flash que es rápido y ve imágenes
        model = genai.GenerativeModel('gemini-flash-latest')
        
        content_parts = [prompt_text]
        
        # Descargamos la imagen y la añadimos al prompt
        image_data = await download_image(evidence_url)
        if image_data:
            content_parts.append(image_data)
            print(f"   📸 Imagen descargada y adjuntada ({len(image_data['data'])} bytes)")
        else:
            print("   ⚠️ Analizando solo texto.")

        # PASO D: Generar Respuesta
        # Usamos generate_content_async del SDK oficial
        response = await model.generate_content_async(content_parts)
        
        # PASO E: Parsear JSON
        cleaned_json = clean_json_string(response.text)
        return json.loads(cleaned_json)

    except Exception as e:
        print(f"   ❌ Error en Gemini Logic: {e}")
        return {
            "severity": "UNKNOWN", 
            "reasoning": f"Error del sistema: {str(e)}",
            "suggested_sanction": "Revisión manual",
            "score": 0.0,
            "detected_infraction": "Error",
            "cited_article": "N/A"
        }