/**
 * CesiumJS globe for Sky flight free-flight.
 * Apache 2.0 engine. No Cesium ion (ion terrain/imagery needs a paid
 * commercial plan). Natural Earth II ships with CesiumJS. Ellipsoid terrain.
 * Not based on Web Flight Simulator (that project needs a separate commercial license).
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
    height: Math.max(40, state.alt)
  };
}

export async function createGlobe(container) {
  const Cesium = cesium();
  if (!Cesium || !container) return null;

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
    terrainProvider: new Cesium.EllipsoidTerrainProvider()
  });

  viewer.imageryLayers.removeAll();
  try {
    const imagery = await Cesium.TileMapServiceImageryProvider.fromUrl(
      Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
    );
    viewer.imageryLayers.addImageryProvider(imagery);
  } catch {
    viewer.imageryLayers.addImageryProvider(new Cesium.SingleTileImageryProvider({
      url: 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="#6d9354"/></svg>'
      )
    }));
  }

  viewer.scene.globe.enableLighting = false;
  viewer.scene.fog.enabled = true;
  viewer.scene.screenSpaceCameraController.enableInputs = false;
  viewer.clock.shouldAnimate = false;

  const craft = viewer.entities.add({
    name: 'seed-pod',
    position: Cesium.Cartesian3.fromDegrees(HOME.lon, HOME.lat, 800),
    orientation: Cesium.Transforms.headingPitchRollQuaternion(
      Cesium.Cartesian3.fromDegrees(HOME.lon, HOME.lat, 800),
      new Cesium.HeadingPitchRoll(0, 0, 0)
    ),
    ellipsoid: {
      radii: new Cesium.Cartesian3(9, 3.2, 3.2),
      material: Cesium.Color.fromCssColorString('#c8a45a')
    },
    box: {
      dimensions: new Cesium.Cartesian3(3.2, 20, 0.55),
      material: Cesium.Color.fromCssColorString('#6f9e5c')
    }
  });

  let visible = false;
  container.hidden = true;

  return {
    show() {
      visible = true;
      container.hidden = false;
      viewer.resize();
    },
    hide() {
      visible = false;
      container.hidden = true;
    },
    get visible() {
      return visible;
    },
    update(state) {
      if (!visible) return;
      const { lon, lat, height } = lonLatOf(state);
      const position = Cesium.Cartesian3.fromDegrees(lon, lat, height);
      const heading = -state.yaw;
      const pitch = state.nose || 0;
      const roll = -(state.bank || 0);
      const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
      craft.position = new Cesium.ConstantPositionProperty(position);
      craft.orientation = new Cesium.ConstantProperty(
        Cesium.Transforms.headingPitchRollQuaternion(position, hpr)
      );

      const transform = Cesium.Transforms.headingPitchRollToFixedFrame(position, hpr);
      const back = new Cesium.Cartesian3(0, -96, 32);
      const cam = Cesium.Matrix4.multiplyByPoint(transform, back, new Cesium.Cartesian3());
      viewer.camera.setView({
        destination: cam,
        orientation: {
          heading,
          pitch: pitch - 0.18,
          roll: 0
        }
      });
    },
    destroy() {
      viewer.entities.remove(craft);
      viewer.destroy();
    }
  };
}
