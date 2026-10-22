FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html style.css app.js camera.js logic.mjs speech.js speech-worker.js sheet.csv /usr/share/nginx/html/

EXPOSE 80
