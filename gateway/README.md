# 🌐 RVRS API Gateway

Este servicio actúa como el punto de entrada único para el ecosistema RVRS. Utiliza **Nginx** para orquestar el tráfico entre el frontend y los microservicios, implementando una lógica de enrutamiento inteligente basada en métodos HTTP.

---

## 🚀 Responsabilidades Principales

* **Enrutamiento Inteligente (CQRS Aware):** El Gateway diferencia automáticamente las peticiones al endpoint `/complaints`.
    * **POST/PUT/DELETE:** Redirige al `Command Service` (Escritura).
    * **GET:** Redirige al `Query Service` (Lectura).
* **Servicio de Frontend:** Gestiona las peticiones de Next.js, incluyendo WebSockets para Hot Module Replacement (`/_next/`) y archivos estáticos.
* **Gestión de Cargas Pesadas:** Configurado para aceptar archivos (evidencia de denuncias) de hasta **50MB**.
* **Abstracción de Microservicios:** Centraliza los servicios de `/auth` y `/users` hacia el Command Service.



---

## 🛠️ Tecnologías

* **Nginx:** Alpine-based para una imagen ligera y segura.
* **Docker:** Orquestado dentro del stack de AWS ECS Fargate.

---

## 📋 Configuración de Enrutamiento

| Path | Método | Destino (Upstream) |
| :--- | :--- | :--- |
| `/complaints` | `GET` | `query_service:3002` |
| `/complaints` | `POST` | `command_service:3001` |
| `/auth` | Cualquiera | `command_service:3001` |
| `/users` | Cualquiera | `command_service:3001` |
| `/_next/` | Cualquiera | `frontend:3000` |
| `/` | Cualquiera | `frontend:3000` |

---

## ⚙️ Variables de Entorno y Red

Este contenedor corre en modo **awsvpc**, comunicándose con los demás servicios vía `127.0.0.1`.

### Parámetros de Nginx
* `worker_connections`: 1024
* `client_max_body_size`: 50M

---

## 🐳 Docker Deployment

Para construir la imagen localmente:

```bash
docker build -t rvrs-gateway -f gateway/Dockerfile .