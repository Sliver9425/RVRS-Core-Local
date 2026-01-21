FROM nginx:alpine

# ELIMINA la configuración por defecto
RUN rm /etc/nginx/conf.d/default.conf

# COPIA indicando la ruta desde la raíz del proyecto
COPY gateway/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80