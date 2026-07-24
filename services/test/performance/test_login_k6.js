import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

export const options = {
  stages: [
    { duration: '10s', target: 10 }, // Calentamiento
    { duration: '30s', target: 50 }, // Pico de Carga (50 VUs)
    { duration: '10s', target: 0 },  // Enfriamiento
  ],
  thresholds: {
    // Ajustado a 1500ms (1.5s) adecuado para pruebas en máquina local / desarrollo
    http_req_duration: ['p(95)<1500'], 
    http_req_failed: ['rate<0.05'],     // Menos del 5% de errores HTTP
  },
};

export default function () {
  const url = 'http://localhost:8080/auth/login';

  const payload = JSON.stringify({
    email: 'dquezada@uce.edu.ec',
    password: 'Password123!',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  const response = http.post(url, payload, params);

  check(response, {
    'Status 200 o 201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(1);
}

// Generación segura del informe HTML en la subcarpeta results/
export function handleSummary(data) {
  return {
    "./results/summary.html": htmlReport(data),
  };
}