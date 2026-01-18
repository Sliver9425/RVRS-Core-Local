import axios from 'axios';

// El Gateway (Nginx) está en el puerto 8080 y redirige el tráfico
const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Instancia para Escritura (Pasa por Gateway -> Command Service)
export const apiCommand = axios.create({
  baseURL: GATEWAY_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia para Lectura (Pasa por Gateway -> Query Service)
export const apiQuery = axios.create({
  baseURL: GATEWAY_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiCommand;