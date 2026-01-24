# ✍️ RVRS Command Service

Este servicio es el motor de escritura del ecosistema RVRS. Implementa la lógica de negocio para la creación de denuncias, gestión de usuarios y autenticación, siguiendo el patrón **CQRS**. Es el encargado de persistir la verdad en la base de datos relacional y disparar los eventos iniciales hacia el bus de mensajería.

---

## 🚀 Responsabilidades Principales

* **Gestión de Denuncias:** Crea registros de denuncias con estados iniciales (`RECEIVED`).
* **Manejo de Evidencia:** Procesa metadatos de archivos (imágenes/video) almacenados en Backblaze B2.
* **Autenticación (RBAC):** Gestiona el registro y login de usuarios con roles definidos (`STUDENT`, `PROFESSOR`, `ADMIN`).
* **Persistencia con Prisma:** Administra los modelos `User` y `Complaint` en **Supabase (PostgreSQL)**.
* **Orquestación de Eventos:**
    * Publica en **Kafka** para iniciar el análisis del `AI-Worker`.
    * Publica en **RabbitMQ** para notificaciones inmediatas.



---

## 🛠️ Tecnologías

* **Node.js & Express:** Servidor de aplicaciones.
* **Prisma ORM:** Cliente para base de datos PostgreSQL.
* **PostgreSQL (Supabase):** Base de datos relacional.
* **Kafka & RabbitMQ:** Brokers de mensajería asíncrona.
* **Swagger UI:** Documentación de API disponible en `/docs`.

---

## 📊 Modelo de Datos (Prisma)

El servicio gestiona dos entidades principales:

### **User**
* Almacena credenciales y perfiles.
* Roles soportados: `STUDENT`, `PROFESSOR`, `ADMIN`.

### **Complaint**
* Gestiona el ciclo de vida de la denuncia a través de los estados:
    1. `RECEIVED` (Estado inicial)
    2. `ANALYZING` (Procesando por IA)
    3. `INVESTIGATING` (Revisión manual)
    4. `SANCTIONED` / `REJECTED` (Resolución final)
* Almacena resultados de IA: Severidad (`aiSeverity`), Puntaje (`aiScore`) y sugerencia de sanción basada en estatutos.

---

## 📋 Endpoints Clave

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `POST` | `/complaints` | Crea una denuncia y sube evidencia. |
| `POST` | `/auth/login` | Inicia sesión y genera token. |
| `POST` | `/users` | Registra un nuevo usuario (Default: STUDENT). |
| `GET` | `/health` | Verifica conectividad con PostgreSQL. |

---

## ⚙️ Variables de Entorno

| Variable | Descripción |
| :--- | :--- |
| `DATABASE_URL` | String de conexión a PostgreSQL. |
| `PORT` | Puerto de escucha (3001). |
| `KAFKA_BROKER` | Host y puerto de Kafka. |
| `RABBITMQ_URL` | URL con credenciales de RabbitMQ. |
| `B2_*` | Credenciales para almacenamiento en Backblaze B2. |

---

## 🐳 Docker Deployment

El Dockerfile utiliza un build multietapa para optimizar el tamaño de la imagen y generar el cliente de Prisma:

```bash
docker build -t rvrs-command-service -f services/command/Dockerfile .