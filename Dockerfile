FROM node:24-alpine AS link
WORKDIR /app
COPY server/paint-link.mjs /app/paint-link.mjs
ENV PORT=5180
EXPOSE 5180
CMD ["node", "paint-link.mjs"]

FROM node:24-bookworm AS sidecars
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY tools/build-sidecar.sh /build/tools/build-sidecar.sh
RUN sh /build/tools/build-sidecar.sh /out/sidecars/rally /sidecars/rally/

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=sidecars /out/sidecars /usr/share/nginx/html/sidecars
COPY sidecars/flight /usr/share/nginx/html/sidecars/flight
COPY sidecars/bike /usr/share/nginx/html/sidecars/bike
COPY sidecars/walk /usr/share/nginx/html/sidecars/walk
COPY sidecars/paint /usr/share/nginx/html/sidecars/paint
COPY sidecars/quick-math /usr/share/nginx/html/sidecars/quick-math
COPY sidecars/skybound /usr/share/nginx/html/sidecars/skybound
COPY sidecars/range /usr/share/nginx/html/sidecars/range
COPY sidecars/blocks /usr/share/nginx/html/sidecars/blocks
COPY sidecars/gulp /usr/share/nginx/html/sidecars/gulp
COPY sidecars/roll /usr/share/nginx/html/sidecars/roll
COPY sidecars/grass /usr/share/nginx/html/sidecars/grass
COPY sidecars/glow /usr/share/nginx/html/sidecars/glow
COPY sidecars/dash /usr/share/nginx/html/sidecars/dash
COPY index.html style.css app.js logic.mjs sheet.csv manifest.webmanifest sw.js /usr/share/nginx/html/
COPY icons /usr/share/nginx/html/icons
COPY app /usr/share/nginx/html/app
COPY logic /usr/share/nginx/html/logic
COPY lib /usr/share/nginx/html/lib
COPY games /usr/share/nginx/html/games
COPY voice /usr/share/nginx/html/voice
COPY vendor /usr/share/nginx/html/vendor

# Every shipped file with a version stamp, so the service worker can cache all
# sidecars for offline play and re-fetch only what changed.
RUN cd /usr/share/nginx/html \
 && find sidecars vendor lib app logic games icons -type f \
      ! -name '.*' ! -name '*.md' ! -name '*LICENSE*' ! -name 'NOTICE' ! -name '*.test.*' ! -name '*.map' \
      -exec stat -c '%Y-%s %n' {} + \
  | sort -k2 \
  | awk 'BEGIN { printf "{" } { printf "%s\"./%s\":\"%s\"", (NR > 1 ? "," : ""), $2, $1 } END { print "}" }' \
  > offline-files.json

EXPOSE 80
