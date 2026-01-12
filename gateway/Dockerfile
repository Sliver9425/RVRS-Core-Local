# Usamos la versión ligera de Nginx
FROM nginx:alpine

# Borramos la configuración por defecto de Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiamos NUESTRA configuración adentro de la imagen
COPY nginx.conf /etc/nginx/conf.d/default.conf