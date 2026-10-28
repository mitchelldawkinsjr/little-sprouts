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
COPY index.html style.css app.js arcade.js lunar.js hoop.js light.js hook.js sky.js planet.js puzzle.js match.js marble.js bridge.js maze.js chase.js hop.js toast.js glide.js aisle.js lily.js mole.js bust.js cube.js stack.js lamp.js trace.js sort.js merge.js crayon.js sidecar.js sidecar-guest.js camera.js logic.mjs speech.js speech-core.mjs speech-worker.js pad.js pad-core.mjs tilt.js touch-core.mjs hold.js sheet.csv /usr/share/nginx/html/
COPY voice /usr/share/nginx/html/voice

EXPOSE 80
