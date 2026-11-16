// Only garden-buddy poses are shared. Town errands, questions, and rewards stay local.
import { makeBuddy, buddyKind, savedLook } from '../../../lib/buddy3d.mjs?v=cabin1';
import { makeWorldFriends, mountWorldFriendControls } from '../../../lib/world-friends.mjs';

const SEND_EVERY = 0.1;
const num = v => typeof v === 'number' && Number.isFinite(v);

export function readMe(msg) {
  if (!Array.isArray(msg?.p) || msg.p.length !== 2 || !msg.p.every(num)) return null;
  const clamp = v => Math.max(-400, Math.min(400, v));
  return { x: clamp(msg.p[0]), z: clamp(msg.p[1]), yaw: num(msg.yaw) ? msg.yaw : 0, run: num(msg.run) ? Math.max(0, Math.min(1, msg.run)) : 0 };
}

export function stationFriends({ THREE, scene, player, ground }) {
  const remotes = new Map();
  const ringGeo = new THREE.RingGeometry(0.55, 0.7, 28);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xf0c050, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide });
  let sendAt = 0, time = 0;
  const lastPos = new THREE.Vector3();
  const wrap = document.createElement('div');
  wrap.id = 'friendWrap';
  wrap.innerHTML = `<style>
#friendWrap{position:fixed;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));z-index:10001;max-width:min(340px,calc(100vw - 28px));font-family:var(--round,system-ui)}
#friendBtn{min-height:44px;padding:8px 14px;border:0;border-radius:14px;background:#fbf8f2ee;color:#33304a;font-weight:800;cursor:pointer}
#friendBox{margin-bottom:8px;padding:10px 12px;border-radius:14px;background:#fbf8f2f2;color:#33304a;font-weight:700;font-size:15px;word-break:break-word;box-shadow:0 4px 12px #3334}
#friendBox p{margin:0 0 8px}#friendBox .row{display:flex;gap:6px;flex-wrap:wrap}
#friendBox button{min-height:40px;padding:6px 12px;border:0;border-radius:12px;background:#1f3a68;color:#fff;font-weight:800;cursor:pointer}
#friendWrap [hidden]{display:none!important}
</style><div id="friendBox" hidden data-pad-menu data-touch-ignore><p id="friendText" role="status"></p><div class="row"></div></div>
<button type="button" id="friendBtn" aria-label="Play with a friend">👫 Friends</button>`;
  document.body.append(wrap);
  wrap.addEventListener('pointerdown', () => { if (document.pointerLockElement) document.exitPointerLock(); });
  const $ = id => wrap.querySelector('#' + id);
  const room = makeWorldFriends({
    game: 'station',
    update: state => paint(state),
    arrived({ id }) {
      const me = savedLook();
      room.send({ t: 'hi', buddy: buddyKind(me.kind), gear: me.kind ? me.gear : '' }, id);
      sendAt = SEND_EVERY;
    },
    departed({ id }) {
      const remote = remotes.get(id);
      if (remote) { scene.remove(remote.body); remote.model.dispose?.(); remotes.delete(id); }
    },
    receive(msg, { id }) {
      let remote = remotes.get(id);
      if (msg.t === 'hi') {
        if (remote) { scene.remove(remote.body); remote.model.dispose?.(); }
        const body = new THREE.Group();
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04;
        const model = makeBuddy(THREE, buddyKind(msg.buddy), { gear: typeof msg.gear === 'string' ? msg.gear.slice(0, 160) : '' });
        body.add(ring, model.group);
        body.visible = false;
        scene.add(body);
        remotes.set(id, { model, body, aim: remote?.aim });
      } else if (msg.t === 'me' && remote) remote.aim = readMe(msg) || remote.aim;
    },
  });
  const paint = mountWorldFriendControls({ room, button: $('friendBtn'), box: $('friendBox'), text: $('friendText'), row: wrap.querySelector('.row') });
  room.fromInvite();

  return {
    update(dt) {
      time += dt;
      sendAt += dt;
      if (room.state.others.length && sendAt >= SEND_EVERY) {
        const moved = Math.hypot(player.pos.x - lastPos.x, player.pos.z - lastPos.z) / sendAt;
        sendAt = 0;
        lastPos.set(player.pos.x, 0, player.pos.z);
        room.send({ t: 'me', p: [+player.pos.x.toFixed(2), +player.pos.z.toFixed(2)], yaw: +player.yaw.toFixed(2), run: +Math.min(1, moved / 5).toFixed(2) });
      }
      for (const { model, body, aim } of remotes.values()) {
        if (!aim) continue;
        if (!body.visible) body.position.set(aim.x, 0, aim.z);
        body.visible = true;
        const k = Math.min(1, dt * 10);
        body.position.x += (aim.x - body.position.x) * k;
        body.position.z += (aim.z - body.position.z) * k;
        body.position.y = ground(body.position.x, body.position.z);
        const turn = aim.yaw + Math.PI - body.rotation.y;
        body.rotation.y += Math.atan2(Math.sin(turn), Math.cos(turn)) * k;
        model.animate(dt, aim.run, time);
      }
    },
  };
}
