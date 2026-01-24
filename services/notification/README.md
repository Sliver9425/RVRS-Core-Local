# 📧 RVRS Notification Service

Este microservicio se encarga de la comunicación externa del sistema. Su función principal es consumir eventos de denuncias desde **RabbitMQ** y transformar esa información en notificaciones de correo electrónico profesionales utilizando **SMTP**.

---

## 🚀 Responsabilidades Principales

* **Consumo de Eventos:** Escucha de forma persistente el exchange `complaints_events` de RabbitMQ.
* **Procesamiento de Mensajes:** Implementa un patrón **Fanout**, permitiendo que las notificaciones lleguen de forma independiente a otros servicios.
* **Motor de Plantillas:** Genera correos electrónicos en formato HTML con estilos integrados para una visualización profesional en clientes de correo.
* **Envío SMTP:** Utiliza `Nodemailer` para el despacho de correos reales a través de los servidores de Gmail.
* **Confirmación (Acknowledge):** Garantiza que los mensajes solo se eliminen de la cola una vez que el correo ha sido procesado o se ha manejado el error.



---

## 🛠️ Tecnologías

* **Node.js & TypeScript:** Entorno de ejecución y lenguaje.
* **amqplib:** Cliente para la integración con RabbitMQ.
* **Nodemailer:** Librería para el envío de correos electrónicos.
* **Dotenv:** Gestión de variables de entorno y secretos.

---

## 📋 Detalles del Flujo

1. **Exchange:** `complaints_events` (Tipo: `fanout`).
2. **Queue:** `notification_queue` (Durable: `true`).
3. **Trigger:** Cualquier mensaje publicado por el `Command Service` en el exchange de denuncias.
4. **Salida:** Correo electrónico HTML enviado al administrador con los detalles de la denuncia (ID, Título, Descripción, Edificio).

---

## ⚙️ Variables de Entorno

Para que el servicio envíe correos reales, requiere las siguientes credenciales:

| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `RABBITMQ_URL` | URL del servidor de RabbitMQ | `amqp://localhost` |
| `SMTP_USER` | Cuenta de Gmail emisora | `usuario@gmail.com` |
| `SMTP_PASS` | Contraseña de aplicación de Google | `xxxx xxxx xxxx xxxx` |

---

## 🐳 Docker Deployment

Construcción de la imagen:

```bash
docker build -t rvrs-notification-service -f services/notification/Dockerfile .