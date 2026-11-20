FROM node:24-alpine AS link
WORKDIR /app
COPY server/paint-link.mjs server/operations.mjs /app/server/
COPY lib/diagnostic-schema.mjs lib/group-room.mjs /app/lib/
ENV PORT=5180
EXPOSE 5180
CMD ["node", "server/paint-link.mjs"]

FROM node:24-bookworm AS sidecars
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY tools/build-sidecar.sh /build/tools/build-sidecar.sh
RUN sh /build/tools/build-sidecar.sh /out/sidecars/rally /sidecars/rally/

FROM node:24-alpine AS static
WORKDIR /build
COPY tools/build/package.json tools/build/package-lock.json /build/bundle/
RUN npm --prefix /build/bundle ci --no-audit --no-fund
COPY tools/build/bundle.mjs /build/bundle/
COPY tools/static-files.mjs /build/
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
COPY sidecars/pinecone-trail /usr/share/nginx/html/sidecars/pinecone-trail
COPY sidecars/pebble /usr/share/nginx/html/sidecars/pebble
COPY sidecars/boss /usr/share/nginx/html/sidecars/boss
COPY sidecars/ink-trail /usr/share/nginx/html/sidecars/ink-trail
COPY sidecars/moon-swing /usr/share/nginx/html/sidecars/moon-swing
COPY sidecars/garden-tag /usr/share/nginx/html/sidecars/garden-tag
COPY sidecars/cabin /usr/share/nginx/html/sidecars/cabin
COPY sidecars/paint-the-plan /usr/share/nginx/html/sidecars/paint-the-plan
COPY sidecars/station-scout /usr/share/nginx/html/sidecars/station-scout
COPY sidecars/sky-deliveries /usr/share/nginx/html/sidecars/sky-deliveries
COPY sidecars/field-guide-fishing /usr/share/nginx/html/sidecars/field-guide-fishing
COPY sidecars/canyon-pods /usr/share/nginx/html/sidecars/canyon-pods
COPY sidecars/sketchbook /usr/share/nginx/html/sidecars/sketchbook
COPY for-parents /usr/share/nginx/html/for-parents
COPY index.html style.css app.js logic.mjs sheet.csv manifest.webmanifest sw.js /usr/share/nginx/html/
COPY icons /usr/share/nginx/html/icons
COPY app /usr/share/nginx/html/app
COPY logic /usr/share/nginx/html/logic
COPY lib /usr/share/nginx/html/lib
COPY games /usr/share/nginx/html/games
COPY voice /usr/share/nginx/html/voice
COPY vendor /usr/share/nginx/html/vendor

# Stamp original bytes for Cache Storage, then precompress eligible HTTP assets.
RUN node /build/bundle/bundle.mjs /usr/share/nginx/html \
 && node /build/static-files.mjs /usr/share/nginx/html

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=static /usr/share/nginx/html /usr/share/nginx/html
EXPOSE 80
