import os
import google.generativeai as genai
from dotenv import load_dotenv


load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ Error: No se encontró GOOGLE_API_KEY en el archivo .env")
else:
    print(f"🔑 Clave encontrada: {api_key[:5]}...{api_key[-4:]}")
    try:
        genai.configure(api_key=api_key)
        
        print("\n🔎 Consultando a Google qué modelos puedes usar...")
        print("-" * 40)
        
        found_any = False
        for m in genai.list_models():
            
            if 'generateContent' in m.supported_generation_methods:
                print(f"✅ {m.name}")
                found_any = True
        
        if not found_any:
            print("⚠️ No se encontraron modelos de generación de texto. Revisa tu cuenta de Google Cloud.")
            
    except Exception as e:
        print(f"\n❌ Error fatal conectando con Google: {e}")