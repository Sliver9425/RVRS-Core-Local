FROM nginx:alpine

# ELIMINA la configuración por defecto para evitar conflictos
RUN rm /etc/nginx/conf.d/default.conf

# COPIA tu configuración completa como el archivo MAESTRO de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80