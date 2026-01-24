FROM nginx:alpine


RUN rm /etc/nginx/conf.d/default.conf


COPY gateway/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80