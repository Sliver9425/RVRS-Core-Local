# 🔍 RVRS Query Service

Este servicio representa la capa de **Lectura** y **Sincronización** del ecosistema RVRS. Su función principal es servir datos de forma eficiente a los clientes y actuar como el consumidor final de los análisis generados por la Inteligencia Artificial para persistirlos en la base de datos.

---

## 🚀 Responsabilidades Principales

* **Consumo de Análisis (Kafka):** Escucha el tópico `complaint.processed`. Cuando el `AI-Worker` termina, este servicio toma los resultados (severidad, score, sanción) y actualiza el registro en PostgreSQL.
* **Caché de Lectura (Redis):** Implementa una estrategia de caché para las consultas frecuentes de denuncias, reduciendo la carga en la base de datos principal.
* **Sincronización (RabbitMQ):** Escucha el exchange de eventos para invalidar la caché de Redis cuando se detectan nuevas denuncias o cambios de estado, garantizando "Eventual Consistency".
* **API de Consulta:** Expone endpoints optimizados para que el frontend obtenga listas de denuncias por usuario o generales.



---

## 🛠️ Tecnologías

* **Node.js & Express:** Framework del servidor.
* **Redis:** Motor de base de datos en memoria para caché de alta velocidad.
* **Kafka (kafkajs):** Consumidor asíncrono para recibir resultados de la IA.
* **Prisma ORM:** Para la actualización de registros y consultas a PostgreSQL.
* **RabbitMQ:** Para la invalidación de caché basada en eventos.

---

## 📋 Endpoints de Consulta

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/complaints` | Lista todas las denuncias (Orden: Recientes). |
| `GET` | `/complaints/user/:userId` | Denuncias de un usuario específico (con Caché). |
| `GET` | `/health` | Estado de salud (Conectividad Kafka/Redis). |

---

## ⚙️ Variables de Entorno

| Variable | Descripción | Valor por defecto |
| :--- | :--- | :--- |
| `PORT` | Puerto de escucha | `3002` |
| `REDIS_HOST` | Host del servidor Redis | `localhost` |
| `REDIS_PORT` | Puerto del servidor Redis | `6379` |
| `KAFKA_BROKER` | Dirección del cluster Kafka | `localhost:9092` |
| `DATABASE_URL` | Conexión a PostgreSQL | (Requerido) |

---

## 🔄 Estrategia de Consistencia

Para mantener los datos frescos, el servicio sigue este flujo:
1. **Invalidación por Escritura:** Al recibir un análisis de IA vía Kafka, se actualiza la DB y se **borran** las llaves de caché relacionadas en Redis.
2. **Invalidación por Evento:** Escucha la cola `query_service_sync` de RabbitMQ para limpiar la caché cuando otros servicios modifican datos.
3. **TTL (Time To Live):** Los datos en caché tienen una expiración automática de 5 minutos (300 segundos).



---

## 🐳 Docker Deployment

Construcción de la imagen:

```bash
docker build -t rvrs-query-service -f services/query/Dockerfile .