import * as THREE from '../js/lib/three.js/three.module.js';
import { XYZLoader } from '../js/lib/three.js/XYZLoader.js';
import TrackballControls from '../js/lib/three.js/TrackballControls.js';
import { OrbitControls, MapControls } from '../js/lib/three.js/OrbitControls.js';

let renderer, camera, scene, obj, controls;

init();

function init() {
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 20, 50);
  scene = new THREE.Scene();
  scene.add(camera);
  scene.add(new THREE.AxesHelper);
  scene.background = new THREE.Color( 0xbfd1e5 );
  const light = new THREE.PointLight();
  light.position.y = 30;
  scene.add(light);

  const opts = {
    color: 'green',
    size: 1,
    sizeAttenuation: true,
    depthTest: true,
    transparent: true
  };

  function getDimensions(xyz) {
    if (xyz.length < 3) {
      throw new Error('Empty data');
    }
    let width, height;
    let y0 = xyz[1];
    for (let i = 0; i < xyz.length; i+=3) {
      const x = xyz[i];
      const y = xyz[i + 1];
      const z = xyz[i + 2];
      if (y != y0) {
        height = i / 3;
        width = (xyz.length / 3) / height;
        break;
      }
    }
    return [width, height];
  }

  function transferZ(vertsA, vertsB) {
    if (vertsA.length != vertsB.length)
      throw new Error(`vertsA.length: ${vertsA.length} != vertsB.length: ${vertsB.length}`);
    if (vertsA.length % 3 != 0)
      throw new Error('Buffer length must be divisible by 3');
    for (let i = 0; i < vertsA.length; i += 3) {
      const z = vertsA[ i + 2 ];
      vertsB[ i + 2 ] = z;
    }
  }

  function transfer2(geometry, xyzArr, vertices) {
    var hVerts = geometry.heightSegments + 1;
    var wVerts = geometry.widthSegments + 1;
    for (let j = 0; j < hVerts; j++) {
      for (let i = 0; i < wVerts; i++) {
        //+0 is x, +1 is y.
        const off = 3*(j*wVerts+i)+2;
        vertices[off] = xyzArr[off];
      }
    }
  }

  const loader = new XYZLoader();
  loader.load('xyz.xyz', geometry => {
      geometry.center();
      const opts = {color: 'green', side: THREE.DoubleSide};
      const material = new THREE.MeshPhongMaterial(opts);
      console.log('loaded xyz geometry: ', geometry);
      const xyzArr = geometry.attributes.position.array;
      // TODO: why are width and height swapped?
      const [height, width] = getDimensions(xyzArr);
      console.log(`width: ${width}, height: ${height}`);
      const geom2 = new THREE.PlaneBufferGeometry(width, height, width - 1, height - 1);
      const position = geom2.getAttribute('position');
      const vertices = position.array;
      transferZ(xyzArr, vertices);
      //transfer2(geom2, xyzArr, vertices);
      obj = new THREE.Mesh(geom2, material);
      obj.rotateX(Math.PI / 2);
      scene.add(obj);
    });

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  /*
  controls = new TrackballControls(camera, renderer.domElement);
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = false;
  controls.dynamicDampingFactor = 0.3;
  */
  controls = new MapControls(camera, renderer.domElement);
  window.addEventListener('resize', onWindowResize, false);
}


function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

animate();
function animate() {
  requestAnimationFrame( animate );
  controls.update();
  renderer.render( scene, camera );
}