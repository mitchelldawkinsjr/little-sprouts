# Deploy and the mitch-cloud pattern

Little Sprouts goes live the same way [WNBA Stat Spot](https://github.com/mitchelldawkinsjr/WNBA-Stat-Spot) does. A push to `main` runs `.github/workflows/deploy-vps.yml`. The workflow copies this repo onto the VPS and rebuilds the container. The public site is https://grow.360web.cloud.

Markdown-only pushes do not deploy. **Run workflow** on the Actions tab deploys the current `main` whenever you need a rebuild.

## What runs in production

The site is static. nginx serves the files in this repo. There is no app server and no database.

```
browser
  → Nginx Proxy Manager (HTTPS for grow.360web.cloud)
    → container little-sprouts-app:80
      → nginx, files from the image
```

`docker-compose.prod.yml` is the production stack:

- The container name is `little-sprouts-app`. The proxy reaches it by that name.
- It joins the external Docker network `360ws-network`.
- Port 80 is also published on the VPS loopback at `127.0.0.1:8032`, for a health check from the host.
- Labels `com.360ws.type=docker-app` and `com.360ws.app=little-sprouts` mark it as one of the client apps.
- The health check requests `http://127.0.0.1/` inside the container.

The image is built from the `Dockerfile`:

1. A first stage clones Backroad rally, builds it, and injects `/sidecar-guest.js` into its page. The rally source is not in this repo. `tools/build-sidecar.sh` is that build. Another self-booting game can reuse the script by passing its repo, destination, and URL base.
2. The nginx stage copies `nginx.conf`, the built rally, the flight, bike, walk, and paint sidecars, and the site files named in the `COPY` line.

Two production habits follow from that image:

- A new top-level file is invisible on the site until its name is added to the `Dockerfile` `COPY` list.
- The proxy can keep an old copy of a script for hours. After changing a script, bump the `?v=` on the tag that loads it (`index.html`, and the matching import in `app.js`). nginx itself sends `no-cache` for `.js` and `.css`. The query string is what makes the proxy fetch the new file.

Player progress, levels, and saved voice lines stay in the browser. A deploy does not touch them.

## What the workflow does

The file matches WNBA Stat Spot's `deploy-vps.yml`.

1. Check out `main` on a GitHub-hosted runner.
2. Load `VPS_SSH_KEY` into an SSH agent and trust `VPS_HOST` with `ssh-keyscan`.
3. `rsync` the repo to `/opt/360ws/clients/docker-app/little-sprouts/`. `--delete` makes the server copy match the repo. `.git`, `.env`, `node_modules`, and `sidecars/rally` stay out. Rally is produced inside the image build.
4. `docker compose -f docker-compose.prod.yml up -d --build`.
5. Wait until the container is `healthy` and `http://127.0.0.1:8032/` answers.
6. If `SLACK_WEBHOOK` is set, post a success or failure note. The deploy still succeeds when that secret is empty.

WNBA Stat Spot does extra Laravel work after the containers are up: a clean rebuild, migrations, and a data import. This app has none of that, so the compose command is `up -d --build`, which keeps Docker's layer cache. The rally clone is the slow part, and the cache skips it when `tools/build-sidecar.sh` did not change.

## Secrets

Set these on the GitHub repo (Settings → Secrets and variables → Actions). They are the same names WNBA Stat Spot uses, and the same key and host.

| Secret | Required | Purpose |
| --- | --- | --- |
| `VPS_HOST` | yes | SSH host of the VPS |
| `VPS_USER` | yes | SSH user |
| `VPS_SSH_KEY` | yes | Private deploy key, the `github_actions_deploy` key |
| `VPS_SSH_PORT` | no | Defaults to 22 |
| `SLACK_WEBHOOK` | no | Incoming webhook for the result message |

The host name and the key stay in secrets. They are not written in this repo.

## Checks before a release

From this folder:

```
node --test logic.test.mjs camera.test.mjs speech.test.mjs pad.test.mjs touch.test.mjs
```

On a phone-sized browser, add `?touch` to the local address to show the tilt button and the rally pad without a touch screen.

## Add another app the same way

Client apps live on the VPS under `/opt/360ws/clients/docker-app/<app>/`. Each one has its own repo, its own `docker-compose.prod.yml`, and a copy of this workflow.

1. Pick a container name, `<app>-app`, and a loopback port that `docker ps` does not already publish. Little Sprouts uses `8032`. The proxy talks to the container name, so the loopback port is only for the health check and for debugging on the server.
2. Write `docker-compose.prod.yml` like this one: build the repo, `restart: unless-stopped`, publish `127.0.0.1:<port>:<container-port>`, join external network `360ws-network`, and set the two `com.360ws` labels. Add a health check that requests a URL inside the container.
3. In Nginx Proxy Manager, add a proxy host for `https://<name>.360web.cloud` that forwards to `http://<app>-app:<container-port>`.
4. Copy `.github/workflows/deploy-vps.yml` into the new repo. Change the directory, the container name, and the Slack text. Keep the secret names.
5. Add `VPS_HOST`, `VPS_USER`, and `VPS_SSH_KEY` to that repo. Use the same values as this repo.
6. Put a `docs/deploy.md` in the new repo that names its public host, its port, and anything the workflow does after `up` (migrations, imports). Point the README at it.
7. Push to `main`, then watch the Actions tab. The first run creates the directory, builds, and starts the container.

An app that keeps data on disk (a database volume, an uploaded `.env`, a storage directory) must exclude those paths in the `rsync` line. `--delete` removes anything on the server that the repo does not contain.
