# Usamos una imagen ligera de Python
FROM python:3.10-slim

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalar dependencias del sistema (git a veces es necesario para algunas libs)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Copiamos los requisitos primero (para aprovechar el caché de Docker)
COPY requirements.txt .

# Instalamos las librerías
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el resto del código (main.py, logic.py, .env, faiss_index, etc.)
COPY . .

# Comando para iniciar la app (Nótese --host 0.0.0.0 para que Docker lo exponga)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]