# 🤖 RVRS AI Worker

Este servicio es el motor de inteligencia del ecosistema RVRS. Se encarga de procesar las denuncias recibidas de forma asíncrona, analizando su severidad y contenido basándose en el reglamento institucional mediante técnicas de **IA Generativa** y **RAG (Retrieval-Augmented Generation)**.

---

## 🚀 Responsabilidades Principales

* **Consumo de Eventos:** Escucha el tópico de Kafka `complaint.received` para detectar nuevas denuncias.
* **Procesamiento con RAG:** Utiliza `LangChain` y `FAISS` para buscar secciones relevantes en el archivo `estatuto.txt` que coincidan con la denuncia.
* **Análisis de IA:** Envía el título, descripción, evidencia y contexto legal a **Google Gemini** para determinar la severidad y el curso de acción.
* **Publicación de Resultados:** Envía el análisis procesado al tópico `complaint.processed` para que el sistema actualice el estado de la denuncia.
* **Resiliencia:** Implementa bucles de reconexión automática para Kafka (ideal para entornos dinámicos como ECS).



---

## 🛠️ Tecnologías

* **Python 3.10:** Base del servicio.
* **FastAPI:** Utilizado principalmente para el ciclo de vida del servicio (`lifespan`) y Health Checks.
* **AIOKafka:** Cliente asíncrono para interactuar con Apache Kafka.
* **LangChain & FAISS:** Para la gestión de documentos, embeddings y búsqueda semántica.
* **Google Gemini API:** Modelo de lenguaje para el análisis de texto e imágenes/video.

---

## 📋 Flujo de Datos (Event-Driven)

| Acción | Tópico Kafka | Formato |
| :--- | :--- | :--- |
| **Entrada (Consumo)** | `complaint.received` | JSON (ID, título, descripción, evidenciaUrl) |
| **Salida (Producción)** | `complaint.processed` | JSON (ID, análisis de severidad, data original) |

---

## ⚙️ Variables de Entorno

El servicio requiere las siguientes variables configuradas en el entorno (o archivo `.env`):

| Variable | Descripción | Valor por defecto |
| :--- | :--- | :--- |
| `KAFKA_BOOTSTRAP_SERVERS` | Dirección del clúster de Kafka | `127.0.0.1:9092` |
| `KAFKA_TOPIC` | Tópico de entrada | `complaint.received` |
| `KAFKA_PROCESSED_TOPIC` | Tópico de salida | `complaint.processed` |
| `KAFKA_GROUP_ID` | Identificador del grupo de consumo | `ai-worker-vfinal-kraft` |
| `GEMINI_API_KEY` | Llave de acceso a Google AI | (Requerido) |

---

## 📂 Estructura de Conocimiento

El trabajador utiliza un archivo de texto plano para alimentar su "criterio":
* **Archivo:** `estatuto.txt`
* **Función:** Contiene el reglamento o estatutos que la IA consulta para justificar la gravedad de una falta.

---

## 🐳 Docker Deployment

Para construir la imagen:

```bash
docker build -t rvrs-ai-worker -f services/ai-worker/Dockerfile .