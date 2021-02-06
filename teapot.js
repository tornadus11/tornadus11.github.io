"use strict";
var controls;

let camera, renderer, torusMesh, planeMesh;
import {TeapotGeometry} from './js/TeapotGeometry.js';

const params = {
    roughness: 0.0,
    metalness: 0.25,
    exposure: 1.0,
    debug: false
};

// There's no reason to set the aspect here because we're going
// to set it every frame anyway so we'll set it to 2 since 2
// is the the aspect for the canvas default size (300w/150h = 2)
let scene = getEnvScene();
let tess = - 1;
let effectController;
let teaGeo;

teaGeo = new TeapotGeometry( 20,
    56,
    true,
    true,
    true,
    false,
    true );


camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 1000 );
camera.position.set( 0, 0, 120 );

scene = new THREE.Scene();
scene.background = new THREE.Color( 0x000000 );

renderer = new THREE.WebGLRenderer({ antialias: true });
document.body.appendChild(renderer.domElement);
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

//

//let geometry = new THREE.TorusKnotGeometry( 18, 8, 150, 20 );
let geometry = new THREE.SphereGeometry( 26, 64, 32 );
let material = new THREE.MeshStandardMaterial( {
    color: 0xffffff,
    metalness: params.metalness,
    roughness: params.roughness
} );
console.log(teaGeo);


torusMesh = new THREE.Mesh(teaGeo, material);

scene.add( torusMesh );


geometry = new THREE.PlaneGeometry( 200, 200 );
material = new THREE.MeshBasicMaterial();

planeMesh = new THREE.Mesh( geometry, material );
planeMesh.position.y = - 50;
planeMesh.rotation.x = - Math.PI * 0.5;
scene.add( planeMesh );

THREE.DefaultLoadingManager.onLoad = function ( ) {

    pmremGenerator.dispose();

};

const pmremGenerator = new THREE.PMREMGenerator( renderer );
let ldrCubeMap,ldrCubeRenderTarget,generatedCubeRenderTarget;
const ldrUrls = [  'null_plainsky512_rt.png', 'null_plainsky512_lf.png', 'null_plainsky512_up.png', 'null_plainsky512_dn.png',  'null_plainsky512_bk.png', 'null_plainsky512_ft.png' ];
ldrCubeMap = new THREE.CubeTextureLoader()
    .setPath( './assets/skybox/' )
    .load( ldrUrls, function () {

        ldrCubeMap.encoding = THREE.sRGBEncoding;

        ldrCubeRenderTarget = pmremGenerator.fromCubemap( ldrCubeMap );

    } );
pmremGenerator.compileCubemapShader();
generatedCubeRenderTarget = pmremGenerator.fromScene( scene, 0.04 );

controls = new THREE.OrbitControls( camera, renderer.domElement );
controls.autoRotate = true;


function getEnvScene() {

    const envScene = new THREE.Scene();

    const geometry = new THREE.BoxGeometry();
    geometry.deleteAttribute( 'uv' );
    const roomMaterial = new THREE.MeshStandardMaterial( { metalness: 0, side: THREE.BackSide } );
    const room = new THREE.Mesh( geometry, roomMaterial );
    room.scale.setScalar( 10 );
    envScene.add( room );

    const box = new THREE.BoxGeometry(200, 200, 200);
    const material = new THREE.MeshPhongMaterial({
    color: 0x808080,
    specular: 0xffffff,
    shininess: 50,
    flatShading: true
    });

    const mesh = new THREE.Mesh(box, material);
    envScene.add(mesh);


    const mainLight = new THREE.PointLight( 0xffffff, 50, 0, 2 );
    envScene.add( mainLight );

    const lightMaterial = new THREE.MeshLambertMaterial( { color: 0x000000, emissive: 0xffffff, emissiveIntensity: 10 } );

    const light1 = new THREE.Mesh( geometry, lightMaterial );
    light1.material.color.setHex( 0xff0000 );
    light1.position.set( - 5, 2, 0 );
    light1.scale.set( 0.1, 1, 1 );
    envScene.add( light1 );

    const light2 = new THREE.Mesh( geometry, lightMaterial.clone() );
    light2.material.color.setHex( 0x00ff00 );
    light2.position.set( 0, 5, 0 );
    light2.scale.set( 1, 0.1, 1 );
    envScene.add( light2 );

    const light3 = new THREE.Mesh( geometry, lightMaterial.clone() );
    light3.material.color.setHex( 0x0000ff );
    light3.position.set( 2, 1, 5 );
    light3.scale.set( 1.5, 2, 0.1 );
    envScene.add( light3 );

    return envScene;
}

function resizeCanvasToDisplaySize() {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== width ||canvas.height !== height) {
    // you must pass false here or three.js sadly fights the browser
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // set render target sizes here
  }
}

function animate(time) {
  time *= 0.001;  // seconds

  resizeCanvasToDisplaySize();

  //mesh.rotation.x = time * 0.5;
  //mesh.rotation.y = time * 1;
  controls.update();
  //material.color.setHSL(Math.sin(1.5*time),1,0.1);
  render();
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

function render() {

    torusMesh.material.roughness = params.roughness;
    torusMesh.material.metalness = params.metalness;

    let renderTarget, cubeMap;

    renderTarget = ldrCubeRenderTarget;
    cubeMap = ldrCubeMap;


    const newEnvMap = renderTarget ? renderTarget.texture : null;

    if ( newEnvMap && newEnvMap !== torusMesh.material.envMap ) {

        torusMesh.material.envMap = newEnvMap;
        torusMesh.material.needsUpdate = true;

        planeMesh.material.map = newEnvMap;
        planeMesh.material.needsUpdate = true;

    }

    //torusMesh.rotation.y += 0.005;
    planeMesh.visible = params.debug;

    scene.background = cubeMap;
    renderer.toneMappingExposure = params.exposure;

    renderer.render( scene, camera );

}