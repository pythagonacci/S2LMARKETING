FROM nginx:1.29-alpine

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY index.html styles.css script.js favicon.svg /usr/share/nginx/html/
COPY visuals/ /usr/share/nginx/html/visuals/

ENV PORT=8080
EXPOSE 8080
