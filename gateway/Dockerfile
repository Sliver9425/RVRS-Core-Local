FROM nginx:alpine

# ELIMINA la configuración por defecto
RUN rm /etc/nginx/conf.d/default.conf

# ✅ CORRECCIÓN: Usamos './nginx.conf' porque Docker ya está dentro de la carpeta gateway
COPY ./nginx.conf /etc/nginx/nginx.conf

EXPOSE 80