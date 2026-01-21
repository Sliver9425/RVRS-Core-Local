# 1. Usamos una imagen ligera de Python
FROM python:3.10-slim

# 2. Directorio de trabajo
WORKDIR /app

# 3. Instalar dependencias del sistema
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# 4. Copiamos los requisitos (Ruta relativa desde la RAÍZ del monorepo)
COPY services/ai-worker/requirements.txt .

# 5. Instalamos las librerías
RUN pip install --no-cache-dir -r requirements.txt


COPY services/ai-worker/ .

# 7. Comando para iniciar la app
# Ahora sí encontrará 'main' porque está en el WORKDIR
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]