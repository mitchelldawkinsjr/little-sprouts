/**
 * CesiumJS globe for Sky flight free-flight.
 * Apache 2.0 engine. No Cesium ion (ion terrain/imagery needs a paid
 * commercial plan). Natural Earth II ships with CesiumJS. Ellipsoid terrain.
 * Not based on Web Flight Simulator (that project needs a separate commercial license).
 *
 * Viewer is created on first show() — building WebGL while #cesium is
 * display:none leaves a permanently black canvas.
 */

const HOME = { lon: -122.12, lat: 37.48 };
const METERS_PER_UNIT = 6;

function cesium() {
  return window.Cesium;
}

export function lonLatOf(state) {
  const east = state.x * METERS_PER_UNIT;
  const north = state.z * METERS_PER_UNIT;
  const latRad = (HOME.lat * Math.PI) / 180;
  const dLon = east / (111320 * Math.max(0.2, Math.cos(latRad)));
  const dLat = north / 110540;
  return {
    lon: HOME.lon + dLon,
    lat: HOME.lat + dLat,
    height: Math.max(80, state.alt)
  };
}

async function buildViewer(container) {
  const Cesium = cesium();
  Cesium.Ion.defaultAccessToken = undefined;

  const viewer = new Cesium.Viewer(container, {
    animation: false,
    timeline: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
    creditContainer: document.createElement('div'),
    baseLayer: false,
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    requestRenderMode: false
  });

  try {
    const imagery = await Cesium.TileMapServiceImageryProvider.fromUrl(
      Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
    );
    viewer.imageryLayers.addImageryProvider(imagery);
  } catch {
    // shortcut: solid globe if Natural Earth tiles fail; swap in a local TMS later
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#6d9354');
  }

  viewer.scene.globe.enableLighting = false;
  viewer.scene.fog.enabled = true;
  viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#87b4d6');
  viewer.scene.screenSpaceCameraController.enableInputs = false;
  viewer.clock.shouldAnimate = true;

  const craft = viewer.entities.add({
    name: 'seed-pod',
    position: Cesium.Cartesian3.fromDegrees(HOME.lon, HOME.lat, 900),
    orientation: Cesium.Transforms.headingPitchRollQuaternion(
      Cesium.Cartesian3.fromDegrees(HOME.lon, HOME.lat, 900),
      new Cesium.HeadingPitchRoll(0, 0, 0)
    ),
    ellipsoid: {
      radii: new Cesium.Cartesian3(11, 3.6, 3.6),
      material: Cesium.Color.fromCssColorString('#c9a06a')
    },
    box: {
      dimensions: new Cesium.Cartesian3(3.2, 24, 0.55),
      material: Cesium.Color.fromCssColorString('#6fa84a')
    }
  });

  return { viewer, craft };
}

export async function createGlobe(container) {
  const Cesium = cesium();
  if (!Cesium || !container) return null;

  let viewer = null;
  let craft = null;
  let visible = false;
  let ready = null;
  container.hidden = true;

  const ensure = async () => {
    if (viewer) return true;
    if (ready) return ready;
    ready = (async () => {
      container.hidden = false;
      const built = await buildViewer(container);
      viewer = built.viewer;
      craft = built.craft;
      viewer.resize();
      return true;
    })().catch(err => {
      ready = null;
      viewer = null;
      craft = null;
      container.hidden = true;
      throw err;
    });
    return ready;
  };

  return {
    async show() {
      visible = true;
      try {
        await ensure();
      } catch {
        visible = false;
        return false;
      }
      container.hidden = false;
      viewer.resize();
      viewer.scene.requestRender();
      return true;
    },
    hide() {
      visible = false;
      if (viewer) viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
      container.hidden = true;
    },
    get visible() {
      return visible && !!viewer;
    },
    update(state) {
      if (!visible || !viewer || !craft) return;
      const { lon, lat, height } = lonLatOf(state);
      const position = Cesium.Cartesian3.fromDegrees(lon, lat, height);
      // Sim yaw 0 = north (+z); Cesium heading 0 = north, + toward east.
      const heading = state.yaw || 0;
      const pitch = state.nose || 0;
      const roll = -(state.bank || 0);
      const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
      craft.position = new Cesium.ConstantPositionProperty(position);
      craft.orientation = new Cesium.ConstantProperty(
        Cesium.Transforms.headingPitchRollQuaternion(position, hpr)
      );
      viewer.camera.lookAt(
        position,
        new Cesium.HeadingPitchRange(heading, pitch - 0.28, Math.max(90, height * 0.12 + 110))
      );
    },
    destroy() {
      visible = false;
      if (viewer) {
        try {
          viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
          if (craft) viewer.entities.remove(craft);
          viewer.destroy();
        } catch { /* already torn down */ }
      }
      viewer = null;
      craft = null;
      ready = null;
    }
  };
}
