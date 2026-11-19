// Original, texture-free coachwork, in the stock car's metre-sized coordinates.
// Longitudinal sections shape the shoulders, noses and glass; curved lower edges
// leave room for the existing wheels. Static parts are batched by material so a
// detailed silhouette does not add a draw call for every lamp, pillar or rail.
import { garageVehicle } from './garage.mjs';

const AXLES = [-.787, .864];
const ARCH_RADIUS = .34;
const profiles = {
  suv: [[-1.32, .57, .30], [-1.14, .66, .35], [-.78, .68, .37], [.52, .67, .34], [1.08, .64, .29], [1.32, .55, .22]],
  coupe: [[-1.31, .51, .17], [-1.11, .64, .25], [-.78, .67, .27], [.35, .64, .21], [.87, .65, .19], [1.16, .58, .12], [1.32, .48, .06]],
  wedge: [[-1.35, .57, .23], [-1.09, .69, .25], [-.72, .68, .24], [.35, .65, .18], [.84, .67, .17], [1.15, .59, .05], [1.37, .47, -.01]],
  muscle: [[-1.37, .57, .24], [-1.12, .68, .31], [-.72, .69, .33], [.27, .65, .30], [.84, .66, .29], [1.20, .64, .25], [1.38, .59, .21]],
  buggy: [[-1.14, .28, .07], [-.89, .43, .13], [-.52, .41, .11], [.23, .39, .05], [.67, .43, .15], [1.03, .35, .05], [1.18, .20, -.02]],
  sedan: [[-1.25, .52, .22], [-.91, .62, .27], [.75, .62, .24], [1.25, .51, .14]]
};

function section(rows, z) {
  let i = 0;
  while (i < rows.length - 2 && z > rows[i + 1][0]) i++;
  const a = rows[i], b = rows[i + 1];
  const t = Math.max(0, Math.min(1, (z - a[0]) / (b[0] - a[0])));
  return [z, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function makeGarageBody(T, choice) {
  const vehicle = garageVehicle(choice), kind = vehicle.shape;
  const wheelY = .076574 - .35 * vehicle.suspension;
  const Circle = T.CircleBufferGeometry || T.CircleGeometry;
  const Torus = T.TorusBufferGeometry || T.TorusGeometry;
  const group = new T.Group();
  group.name = 'sprouts-garage-body';
  const paint = new T.MeshStandardMaterial({ color: vehicle.color, roughness: .34, metalness: .24 });
  const inset = paint.clone();
  inset.color.multiplyScalar(.58);
  const glass = new T.MeshStandardMaterial({ color: 0x254657, roughness: .19, metalness: .28 });
  const trim = new T.MeshStandardMaterial({ color: 0x1d2732, roughness: .65, metalness: .12 });
  const metal = new T.MeshStandardMaterial({ color: 0xb2c2c9, roughness: .3, metalness: .6 });
  const headlights = new T.MeshBasicMaterial({ color: 0xfff2d4, side: 2 });
  const taillights = new T.MeshBasicMaterial({ color: 0xf84948, side: 2 });
  const materials = [paint, inset, glass, trim, metal, headlights, taillights];
  const batches = new Map(materials.map(material => [material, { positions: [], normals: [] }]));

  function add(geometry, material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    if (rx) geometry.rotateX(rx);
    if (ry) geometry.rotateY(ry);
    if (rz) geometry.rotateZ(rz);
    geometry.translate(x, y, z);
    const flat = geometry.index ? geometry.toNonIndexed() : geometry;
    const batch = batches.get(material);
    for (const value of flat.attributes.position.array) batch.positions.push(value);
    for (const value of flat.attributes.normal.array) batch.normals.push(value);
    if (flat !== geometry) flat.dispose();
    geometry.dispose();
  }

  function surface(points, indices, material) {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(points.flat(), 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    add(geometry, material);
  }

  function skin(rings, material) {
    const size = rings[0].length, points = rings.flat(), indices = [];
    for (let ring = 0; ring < rings.length - 1; ring++) {
      for (let edge = 0; edge < size; edge++) {
        const a = ring * size + edge, b = ring * size + (edge + 1) % size;
        indices.push(a, b, b + size, a, b + size, a + size);
      }
    }
    const end = (rings.length - 1) * size;
    for (let i = 1; i < size - 1; i++) indices.push(0, i + 1, i, end, end + i, end + i + 1);
    surface(points, indices, material);
  }

  function hull(rows, material, { floor = -.22, arches = false, bevel = .045 } = {}) {
    const samples = rows.map(row => row[0]);
    if (arches) for (const axle of AXLES) {
      for (let i = 0; i <= 14; i++) {
        const z = axle - ARCH_RADIUS + 2 * ARCH_RADIUS * i / 14;
        if (z > rows[0][0] && z < rows.at(-1)[0]) samples.push(z);
      }
    }
    const rings = [...new Set(samples)].sort((a, b) => a - b).map(z => {
      const row = section(rows, z), [, w, top] = row;
      const bottom = typeof floor === 'function' ? floor(row) : floor;
      let cut = bottom + bevel;
      if (arches) for (const axle of AXLES) {
        const distance = Math.abs(z - axle);
        if (distance < ARCH_RADIUS) cut = Math.max(cut, wheelY + Math.sqrt(ARCH_RADIUS ** 2 - distance ** 2));
      }
      cut = Math.min(top - bevel, cut);
      return [[-w * .48, bottom, z], [w * .48, bottom, z], [w, cut, z],
        [w, top - bevel, z], [w - bevel, top, z], [-w + bevel, top, z],
        [-w, top - bevel, z], [-w, cut, z]];
    });
    skin(rings, material);
  }

  function block(w, h, d, x, y, z, material, rx = 0, ry = 0) {
    const b = Math.min(.035, h / 4, w / 8, d / 4);
    // Chamfer the ends as well as the long edges; no stacked cube silhouettes.
    const rings = [[-d / 2, w / 2 - b, h / 2 - b], [-d / 2 + b, w / 2, h / 2],
      [d / 2 - b, w / 2, h / 2], [d / 2, w / 2 - b, h / 2 - b]].map(([dz, half, top]) =>
      [[-half + b, -top, dz], [half - b, -top, dz], [half, -top + b, dz],
        [half, top - b, dz], [half - b, top, dz], [-half + b, top, dz],
        [-half, top - b, dz], [-half, -top + b, dz]]);
    // Use the same section builder, then transform the newly added vertices.
    const batch = batches.get(material), start = batch.positions.length;
    skin(rings, material);
    const cosineX = Math.cos(rx), sineX = Math.sin(rx), cosineY = Math.cos(ry), sineY = Math.sin(ry);
    for (let i = start; i < batch.positions.length; i += 3) {
      const px = batch.positions[i], py = batch.positions[i + 1], pz = batch.positions[i + 2];
      const yy = py * cosineX - pz * sineX, zz = py * sineX + pz * cosineX;
      batch.positions[i] = px * cosineY + zz * sineY + x;
      batch.positions[i + 1] = yy + y;
      batch.positions[i + 2] = -px * sineY + zz * cosineY + z;
      const nx = batch.normals[i], ny = batch.normals[i + 1], nz = batch.normals[i + 2];
      const yn = ny * cosineX - nz * sineX, zn = ny * sineX + nz * cosineX;
      batch.normals[i] = nx * cosineY + zn * sineY;
      batch.normals[i + 1] = yn;
      batch.normals[i + 2] = -nx * sineY + zn * cosineY;
    }
  }

  function tube(a, b, radius, material) {
    const direction = new T.Vector3(...b).sub(new T.Vector3(...a)).normalize();
    const u = new T.Vector3().crossVectors(direction, Math.abs(direction.z) < .9
      ? new T.Vector3(0, 0, 1) : new T.Vector3(0, 1, 0)).normalize();
    const v = new T.Vector3().crossVectors(direction, u);
    const rings = [a, b].map(center => Array.from({ length: 8 }, (_, i) => {
      const angle = i * Math.PI / 4;
      return new T.Vector3(...center).addScaledVector(u, radius * Math.cos(angle))
        .addScaledVector(v, radius * Math.sin(angle)).toArray();
    }));
    skin(rings, material);
  }

  function panel(points, material) {
    const indices = [];
    for (let i = 1; i < points.length - 1; i++) indices.push(0, i, i + 1);
    surface(points, indices, material);
  }

  function cabin(rows, base, roofRows) {
    skin(rows.map(([z, w, top]) => [[-w, base, z], [w, base, z],
      [w * .79, top - .022, z], [w * .73, top, z], [-w * .73, top, z], [-w * .79, top - .022, z]]), glass);
    hull(roofRows, paint, { floor: row => row[2] - .035, bevel: .012 });
    // A/C pillars follow the raked screens instead of boxing off the cabin.
    for (const side of [-1, 1]) {
      for (const [low, high] of [[rows[0], rows[1]], [rows.at(-1), rows.at(-2)]]) {
        tube([side * low[1], base + .01, low[0]], [side * high[1] * .76, high[2], high[0]], .023, paint);
      }
      const middle = roofRows[Math.floor(roofRows.length / 2)];
      tube([side * rows[1][1], base + .015, middle[0]], [side * middle[1], middle[2] - .01, middle[0]], .022, trim);
    }
  }

  const body = profiles[kind];
  hull(body, paint, { arches: kind !== 'buggy' });

  // The curved fender lips match the openings in the body and the stock axles.
  for (const axle of AXLES) for (const side of [-1, 1]) {
    const points = [], indices = [];
    const radius = kind === 'buggy' ? .35 : ARCH_RADIUS;
    const start = kind === 'buggy' ? .24 * Math.PI : Math.asin((-.22 - wheelY) / radius);
    for (let i = 0; i <= 16; i++) {
      const angle = start + (Math.PI - 2 * start) * i / 16;
      const z = axle + Math.cos(angle) * radius, y = wheelY + Math.sin(angle) * radius;
      const width = kind === 'buggy' ? .50 : section(body, z)[1] + .008;
      points.push([side * width, y, z], kind === 'buggy'
        ? [side * (width + .16), y - .015, z]
        : [side * (width + .009), y + .026, z]);
      if (i) { const n = i * 2; indices.push(n - 2, n, n + 1, n - 2, n + 1, n - 1); }
    }
    // Both sides have outward winding, including the mirrored left fender.
    if ((side < 0) !== (kind === 'buggy')) for (let i = 0; i < indices.length; i += 3) [indices[i], indices[i + 2]] = [indices[i + 2], indices[i]];
    surface(points, indices, kind === 'buggy' ? paint : trim);
  }

  if (kind === 'suv') {
    cabin([[-1.02, .59, .40], [-.79, .60, .86], [.16, .60, .88], [.65, .57, .38]], .34,
      [[-.81, .47, .88], [-.12, .49, .91], [.18, .47, .90]]);
    for (const side of [-1, 1]) {
      tube([side * .43, .925, -.76], [side * .43, .94, .12], .023, metal);
      tube([side * .61, .36, -.63], [side * .48, .88, -.63], .023, trim);
      block(.075, .28, .035, side * .56, .18, -1.325, taillights);
      block(.34, .055, .045, side * .41, .21, 1.305, headlights);
      block(.065, .025, .16, side * .677, .28, -.18, metal);
      block(.065, .025, .14, side * .677, .28, -.67, metal);
    }
    block(.68, .19, .045, 0, .095, 1.32, trim);
    for (const x of [-.24, -.12, 0, .12, .24]) block(.025, .13, .012, x, .095, 1.35, metal);
    block(1.08, .07, .09, 0, -.155, -1.3, metal);
  } else if (kind === 'coupe' || kind === 'sedan') {
    cabin([[-.92, .54, .26], [-.49, .57, .68], [.02, .56, .71], [.62, .52, .25]], .23,
      [[-.51, .42, .70], [-.23, .44, .745], [.05, .40, .73]]);
    for (const side of [-1, 1]) {
      block(.31, .045, .035, side * .36, .035, 1.30, headlights, 0, side * -.13);
      block(.07, .027, .17, side * .645, .21, -.22, metal);
      block(.055, .08, .32, side * .645, -.04, -.40, inset, 0, side * .08);
    }
    block(.76, .10, .045, 0, -.09, 1.31, trim);
    block(.92, .033, .035, 0, .15, -1.31, taillights);
    hull([[-1.23, .55, .29], [-1.15, .57, .30]], paint, { floor: .24, bevel: .012 });
  } else if (kind === 'wedge') {
    cabin([[-.86, .54, .25], [-.49, .57, .58], [.04, .55, .62], [.65, .53, .23]], .22,
      [[-.50, .42, .60], [-.24, .43, .65], [.06, .40, .64]]);
    for (const side of [-1, 1]) {
      panel([[side * .27, .11, 1.21], [side * .52, .12, 1.12],
        [side * .47, .065, 1.25], [side * .27, .06, 1.28]], headlights);
      block(.06, .13, .40, side * .672, -.01, -.40, trim, 0, side * -.12);
      block(.33, .045, .04, side * .41, .14, -1.35, taillights);
      tube([side * .38, .21, -1.05], [side * .38, .43, -1.05], .022, trim);
    }
    hull([[-1.17, .57, .46], [-1.03, .62, .44], [-.94, .56, .41]], inset, { floor: .38, bevel: .018 });
    block(.91, .12, .04, 0, .02, -1.36, trim);
    for (const x of [-.28, -.14, 0, .14, .28]) block(.018, .085, .01, x, .02, -1.39, metal);
    block(.9, .06, .07, 0, -.16, 1.30, trim);
  } else if (kind === 'muscle') {
    cabin([[-1.02, .56, .34], [-.64, .59, .76], [-.13, .58, .80], [.41, .54, .33]], .31,
      [[-.66, .43, .78], [-.43, .46, .83], [-.10, .42, .82]]);
    block(1.13, .19, .035, 0, .105, 1.375, trim);
    for (const side of [-1, 1]) {
      for (const x of [.39, .535]) add(new Circle(.064, 14), headlights, side * x, .12, 1.398);
      for (const x of [.36, .425, .49]) block(.036, .12, .035, side * x, .12, -1.37, taillights);
      tube([side * .44, -.16, -1.26], [side * .44, -.16, -1.43], .039, metal);
      panel([[side * .13, .312, .36], [side * .21, .312, .36],
        [side * .21, .261, 1.15], [side * .13, .261, 1.15]], inset);
      block(.06, .025, .18, side * .66, .29, -.32, metal);
    }
    hull([[.40, .13, .35], [.66, .18, .39], [.78, .16, .37]], inset, { floor: .30, bevel: .018 });
    block(.26, .045, .025, 0, .342, .785, trim);
    hull([[-1.29, .55, .35], [-1.14, .61, .33]], paint, { floor: .28, bevel: .018 });
  } else if (kind === 'buggy') {
    block(.77, .13, 1.1, 0, -.05, -.12, trim);
    for (const side of [-1, 1]) {
      const x = side * .44, top = side * .33;
      for (const z of [-.62, .31]) tube([x, .08, z], [top, .86, z - .12], .032, trim);
      tube([top, .86, -.74], [top, .86, .19], .032, trim);
      tube([x, .04, -1.03], [top, .86, -.74], .028, trim);
      tube([x, .03, -.62], [x, .08, .31], .028, trim);
      block(.28, .12, .36, side * .19, .04, -.17, trim);
      block(.29, .43, .11, side * .19, .30, -.40, trim, -.16);
      block(.032, .32, .012, side * .19, .30, -.32, metal, -.16);
      for (const z of AXLES) tube([0, -.16, z], [side * .49, -.33, z], .029, metal);
      add(new Circle(.092, 14), headlights, side * .29, .20, .86);
      block(.10, .075, .04, side * .32, .15, -1.15, taillights);
    }
    for (const z of [-.74, .19]) tube([-.33, .86, z], [.33, .86, z], .032, trim);
    block(.65, .20, .41, 0, .18, -.82, trim);
    for (const z of [-.96, -.87, -.78, -.69]) tube([-.29, .30, z], [.29, .30, z], .016, metal);
    tube([-.51, -.04, 1.04], [.51, -.04, 1.04], .036, metal);
    tube([-.46, .02, -1.17], [.46, .02, -1.17], .032, metal);
    add(new Torus(.13, .018, 6, 16), trim, .20, .40, .23, -.35);
  }

  if (kind !== 'buggy') for (const side of [-1, 1]) {
    block(.14, .085, .18, side * .665, kind === 'suv' ? .49 : .36, .34, trim, 0, side * -.18);
    tube([side * .57, .29, .31], [side * .65, kind === 'suv' ? .46 : .34, .34], .016, metal);
    // Rocker panels visually tie the arches together without filling the wells.
    block(.08, .055, .94, side * .65, -.185, .04, trim);
    tube([side * .29, -.14, -1.22], [side * .29, -.14, -1.34], .031, metal);
  }

  for (const [material, data] of batches) {
    if (!data.positions.length) continue;
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(data.positions, 3));
    geometry.setAttribute('normal', new T.Float32BufferAttribute(data.normals, 3));
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    const mesh = new T.Mesh(geometry, material);
    mesh.name = `garage-${['paint', 'inset', 'glass', 'trim', 'metal', 'headlights', 'taillights'][materials.indexOf(material)]}`;
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
  }
  group.userData.garageMaterials = materials;
  return group;
}

// One shared, lightweight rim geometry per car. Each face rides on the original
// wheel object, so steering, wheel spin and suspension remain the engine's job.
export function makeGarageWheelFace(T) {
  const positions = [], normals = [];
  const Torus = T.TorusBufferGeometry || T.TorusGeometry;
  const Circle = T.CircleBufferGeometry || T.CircleGeometry;
  const Plane = T.PlaneBufferGeometry || T.PlaneGeometry;
  function add(geometry) {
    const flat = geometry.index ? geometry.toNonIndexed() : geometry;
    positions.push(...flat.attributes.position.array);
    normals.push(...flat.attributes.normal.array);
    if (flat !== geometry) flat.dispose();
    geometry.dispose();
  }
  add(new Torus(.145, .013, 4, 16));
  add(new Circle(.037, 12));
  for (let i = 0; i < 5; i++) {
    const geometry = new Plane(.028, .13);
    geometry.translate(0, .074, .002);
    geometry.rotateZ(i * Math.PI * 2 / 5);
    add(geometry);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  geometry.computeBoundingSphere();
  return geometry;
}
