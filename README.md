# 🚀 RVRS - Sistema Inteligente de Denuncias Universitarias

RVRS es una plataforma de microservicios diseñada para la gestión, análisis y resolución de denuncias institucionales. Utiliza Inteligencia Artificial para clasificar la severidad de los incidentes basándose en reglamentos reales, implementando una arquitectura de eventos de alta disponibilidad.

---

## 🏗️ Arquitectura del Sistema

El proyecto sigue el patrón **CQRS (Command Query Responsibility Segregation)** y una arquitectura **Event-Driven**, permitiendo escalabilidad independiente para las operaciones de escritura y lectura.



### Componentes Core:
* **Frontend (Next.js):** Interfaz de usuario reactiva para estudiantes y administradores.
* **API Gateway (Nginx):** Orquestador de tráfico que implementa ruteo inteligente.
* **Command Service (Node/Prisma):** Maneja la creación de datos y autenticación (Escritura).
* **Query Service (Node/Redis):** Gestiona consultas optimizadas y caché (Lectura).
* **AI Worker (Python/Gemini):** Motor de análisis con RAG y FAISS para procesar denuncias.
* **Notification Service (Node):** Envío de alertas vía SMTP.
* **MQTT Bridge (Node):** Puente para integración de alertas IoT.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Lenguajes** | TypeScript, Node.js, Python |
| **Infraestructura** | AWS (ECS Fargate, ECR, VPC), Terraform |
| **Bases de Datos** | PostgreSQL (Supabase), Redis, FAISS |
| **Mensajería** | Apache Kafka (KRaft), RabbitMQ |
| **IA** | Google Gemini Pro, LangChain |
| **Almacenamiento** | Backblaze B2 (S3 Compatible) |

---

## 📦 Estructura del Monorepo

```text
.
├── apps/
│   └── frontend/          # Aplicación Next.js
├── services/
│   ├── command/           # Lógica de escritura (API)
│   ├── query/             # Lógica de lectura y caché (API)
│   ├── ai-worker/         # Procesamiento IA (Python)
│   ├── notification/      # Worker de correos
│   ├── mqtt-bridge/       # Puente IoT
│   └── gateway/           # Configuración Nginx
├── packages/
│   └── database/          # Esquema de Prisma compartido
├── infraestructure/       # Código Terraform (IaC)
└── .github/workflows/     # Pipelines de CI/CD (QA & PROD)