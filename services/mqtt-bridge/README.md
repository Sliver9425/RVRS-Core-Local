# 🌉 RVRS MQTT Bridge

Este servicio actúa como un puente de mensajería asíncrona. Su responsabilidad es suscribirse a tópicos de telemetría o alertas mediante el protocolo **MQTT** y retransmitir esos mensajes hacia **RabbitMQ** para que otros microservicios del ecosistema puedan procesarlos.

---

## 🚀 Responsabilidades Principales

* **Suscripción IoT:** Se conecta a un broker MQTT (por defecto HiveMQ) y escucha el tópico de alertas institucionales `rvrs/alerts`.
* **Ingesta de Datos:** Recibe payloads de dispositivos externos o sensores.
* **Protocol Bridging:** Transforma los mensajes de MQTT y los publica en la cola `mqtt_events` de RabbitMQ.
* **Persistencia de Eventos:** Asegura que la cola en RabbitMQ sea `durable`, evitando la pérdida de mensajes si el servicio se reinicia.



---

## 🛠️ Tecnologías

* **Node.js:** Entorno de ejecución.
* **MQTT.js:** Cliente para la conexión con brokers de mensajería IoT.
* **amqplib:** Librería para la integración con RabbitMQ (AMQP).
* **Docker:** Desplegado como parte del clúster de microservicios en AWS ECS.

---

## 📋 Flujo de Trabajo

1. **Escucha:** El puente mantiene una conexión persistente con `mqtt://broker.hivemq.com` (o el broker configurado).
2. **Recepción:** Al llegar un mensaje al tópico `rvrs/alerts`, el servicio loguea el payload.
3. **Puente:** El mensaje se envía inmediatamente a la cola `mqtt_events` de RabbitMQ sin alterar el contenido original.

---

## ⚙️ Variables de Enorno

El servicio utiliza las siguientes variables para localizar los brokers:

| Variable | Descripción | Valor por defecto |
| :--- | :--- | :--- |
| `MQTT_BROKER` | URL del broker MQTT externo | `mqtt://broker.hivemq.com` |
| `RABBITMQ_URL` | URL de conexión a RabbitMQ | `amqp://localhost` |

---

## 🐳 Docker Deployment

Para construir la imagen de este microservicio:

```bash
docker build -t rvrs-mqtt-bridge -f services/mqtt-bridge/Dockerfile .