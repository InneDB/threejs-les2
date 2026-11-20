import './style.css'

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
//shadow
renderer.shadowMap.enabled = true;
document.body.appendChild( renderer.domElement );



// ambient light + directional light
const ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 );
scene.add( ambientLight );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
directionalLight.position.set( 5, 5, 5 );
scene.add( directionalLight );

//load /public/textures/Stable.hdr, set as scene background and environment
const rgbeLoader = new RGBELoader();

rgbeLoader.load('/textures/Stable.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;
  scene.environment = texture;
});

//texture load, load public/textures/Blocks_001_COLOR_C.jpg
const textureLoader = new THREE.TextureLoader();
const textureColor = textureLoader.load( 
  '/textures/Blocks_001_COLOR_C.jpg', 
);

textureColor.colorSpace = THREE.SRGBColorSpace;

//textures

const textureHay = textureLoader.load(
  '/textures/Hay.png', 
);
textureHay.colorSpace = THREE.SRGBColorSpace;

const textureWood = textureLoader.load(
  '/textures/Wood.png', 
);
textureWood.colorSpace = THREE.SRGBColorSpace;

const textureFur = textureLoader.load(
  '/textures/Fur.png', 
);
textureFur.colorSpace = THREE.SRGBColorSpace;

const textureBronze = textureLoader.load(
  '/textures/Bronze.png', 
);
textureBronze.colorSpace = THREE.SRGBColorSpace;


const controls = new OrbitControls( camera, renderer.domElement );
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const zoomCameraPosition = new THREE.Vector3();
const zoomControlsTarget = new THREE.Vector3();
const horseHeadLocalPosition = new THREE.Vector3( -0.1, 0.4, 0 );
const horseHeadWorldPosition = new THREE.Vector3();
const horseBodyLocalPosition = new THREE.Vector3( 0, 0.2, 0 );
const horseBodyWorldPosition = new THREE.Vector3();
const haybaleLocalPosition = new THREE.Vector3( 0, 4, 0 );
const haybaleWorldPosition = new THREE.Vector3();
let isZooming = false;

//information text
const infoButton = document.createElement( 'button' );
infoButton.className = 'horse-info';
infoButton.textContent = 'i';
infoButton.hidden = true;
infoButton.title = 'Show horse head information';
document.body.appendChild( infoButton );

const infoText = document.createElement( 'div' );
infoText.className = 'horse-info-text';
infoText.textContent = 'This is the head';
infoText.hidden = true;
document.body.appendChild( infoText );

const bodyInfoButton = document.createElement( 'button' );
bodyInfoButton.className = 'horse-info';
bodyInfoButton.textContent = 'i';
bodyInfoButton.hidden = true;
bodyInfoButton.title = 'Show horse body information';
document.body.appendChild( bodyInfoButton );

const bodyInfoText = document.createElement( 'div' );
bodyInfoText.className = 'horse-info-text';
bodyInfoText.textContent = 'This is the body';
bodyInfoText.hidden = true;
document.body.appendChild( bodyInfoText );

const haybaleInfoButton = document.createElement( 'button' );
haybaleInfoButton.className = 'horse-info';
haybaleInfoButton.textContent = 'i';
haybaleInfoButton.hidden = true;
haybaleInfoButton.title = 'Show haybale information';
document.body.appendChild( haybaleInfoButton );

const haybaleInfoText = document.createElement( 'div' );
haybaleInfoText.className = 'horse-info-text';
haybaleInfoText.textContent = 'This is the hay';
haybaleInfoText.hidden = true;
document.body.appendChild( haybaleInfoText );

//zoom function head
function zoomToHorseHead() {
  const cameraDirection = camera.position.clone()
    .sub( horseHeadWorldPosition )
    .normalize();
  zoomCameraPosition.copy( horseHeadWorldPosition )
    .add( cameraDirection.multiplyScalar( 2 ) );
  zoomControlsTarget.copy( horseHeadWorldPosition );
  isZooming = true;
}

//zoom function body
function zoomToHorseBody() {
  const cameraDirection = camera.position.clone()
    .sub( horseBodyWorldPosition )
    .normalize();
  zoomCameraPosition.copy( horseBodyWorldPosition )
    .add( cameraDirection.multiplyScalar( 2 ) );
  zoomControlsTarget.copy( horseBodyWorldPosition );
  isZooming = true;
}

function zoomToHaybale() {
  const cameraDirection = camera.position.clone()
    .sub( haybaleWorldPosition )
    .normalize();
  zoomCameraPosition.copy( haybaleWorldPosition )
    .add( cameraDirection.multiplyScalar( 2 ) );
  zoomControlsTarget.copy( haybaleWorldPosition );
  isZooming = true;
}

function updateHorseHeadPosition() {
  if ( horse ) {
    horseHeadWorldPosition.copy( horseHeadLocalPosition );
    horse.localToWorld( horseHeadWorldPosition );
    horseBodyWorldPosition.copy( horseBodyLocalPosition );
    horse.localToWorld( horseBodyWorldPosition );
  }
  if ( haybale ) {
    haybaleWorldPosition.copy( haybaleLocalPosition );
    haybale.localToWorld( haybaleWorldPosition );
  }
}

infoButton.addEventListener( 'click', (event) => {
  event.stopPropagation();
  zoomToHorseHead();
  infoText.hidden = !infoText.hidden;
} );

bodyInfoButton.addEventListener( 'click', (event) => {
  event.stopPropagation();
  zoomToHorseBody();
  bodyInfoText.hidden = !bodyInfoText.hidden;
} );

haybaleInfoButton.addEventListener( 'click', (event) => {
  event.stopPropagation();
  zoomToHaybale();
  haybaleInfoText.hidden = !haybaleInfoText.hidden;
} );

function updateInfoButtonPosition() {
  if ( !horse && !haybale ) return;

  const bounds = renderer.domElement.getBoundingClientRect();
  const updateMarkerPosition = (worldPosition, button, text) => {
    const projectedPosition = worldPosition.clone().project( camera );
    const isBehindCamera = projectedPosition.z < -1 || projectedPosition.z > 1;
    const screenX = bounds.left + ( projectedPosition.x + 1 ) * bounds.width / 2;
    const screenY = bounds.top + ( 1 - projectedPosition.y ) * bounds.height / 2;
    button.hidden = isBehindCamera;
    button.style.left = `${screenX}px`;
    button.style.top = `${screenY}px`;
    text.style.left = `${screenX + 24}px`;
    text.style.top = `${screenY}px`;
  };

  if ( horse ) {
    updateMarkerPosition( horseHeadWorldPosition, infoButton, infoText );
    updateMarkerPosition( horseBodyWorldPosition, bodyInfoButton, bodyInfoText );
  }
  if ( haybale ) {
    updateMarkerPosition( haybaleWorldPosition, haybaleInfoButton, haybaleInfoText );
  }
}

renderer.domElement.addEventListener( 'click', (event) => {
  infoText.hidden = true;
  bodyInfoText.hidden = true;
  haybaleInfoText.hidden = true;
  if ( !horse && !haybale ) return;

  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.x = ( ( event.clientX - bounds.left ) / bounds.width ) * 2 - 1;
  pointer.y = -( ( event.clientY - bounds.top ) / bounds.height ) * 2 + 1;

  raycaster.setFromCamera( pointer, camera );
  if ( horse ) {
    if ( raycaster.ray.distanceSqToPoint( horseHeadWorldPosition ) < 0.5 ) {
      zoomToHorseHead();
    }
    if ( raycaster.ray.distanceSqToPoint( horseBodyWorldPosition ) < 0.5 ) {
      zoomToHorseBody();
    }
  }
  if ( haybale && raycaster.ray.distanceSqToPoint( haybaleWorldPosition ) < 0.5 ) {
    zoomToHaybale();
  }
} );

//horse textures change
const horseFurMaterial = new THREE.MeshStandardMaterial( {
  map: textureFur,
} );

const horseBronzeMaterial = new THREE.MeshStandardMaterial( {
  map: textureBronze,
  metalness: 0.8,
  roughness: 0.25,
} );

const materialMenu = document.createElement( 'div' );
materialMenu.className = 'material-menu';

const materialButtons = [
  { type: 'original', label: 'Original Horse' },
  { type: 'fur', label: 'Fur' },
  { type: 'bronze', label: 'Bronze' },
].map( (material) => {
  const button = document.createElement( 'button' );
  button.type = 'button';
  button.textContent = material.label;
  button.disabled = true;
  button.addEventListener( 'click', () => {
    applyHorseMaterial( material.type );
  } );
  materialMenu.appendChild( button );
  return button;
} );

document.body.appendChild( materialMenu );

function applyHorseMaterial( materialType ) {
  if ( !horse ) return;

  horse.traverse( (child) => {
    if ( child instanceof THREE.Mesh ) {
      child.material = materialType === 'original'
        ? child.userData.originalMaterial
        : materialType === 'bronze'
          ? horseBronzeMaterial
          : horseFurMaterial;
    }
  } );
}

let horse;
let haybale;

//horse model
const gltfLoader = new GLTFLoader();
gltfLoader.load(
  '/model/Horse.glb',
  (gltf) => {
    horse = gltf.scene;
    horse.position.set( 0, 0, 0 );
    horse.rotation.y = Math.PI / 2;
    horse.scale.setScalar( 8 );
    updateHorseHeadPosition();

    horse.traverse( (child) => {
      if ( child instanceof THREE.Mesh ) {
        child.userData.originalMaterial = child.material;
      }
    } );
    scene.add( horse );
    materialButtons.forEach( (button) => {
      button.disabled = false;
    } );
    infoButton.hidden = false;
    bodyInfoButton.hidden = false;
  },
);

//import model scene.glft haybale
gltfLoader.load(
  '/model/scene.gltf',
  (gltf) => {
    haybale = gltf.scene;

    haybale.position.set(3.5, -3, 0);
    haybale.rotation.y = Math.PI / 1.2;
    haybale.scale.setScalar(0.3);

    scene.add(haybale);
    haybaleInfoButton.hidden = false;
  },
);


//cube geometry platform, hay.png as material
const geometry = new THREE.BoxGeometry( 3, 3, 3 );
const material = new THREE.MeshStandardMaterial( { 
  map: textureWood,
} );
const box = new THREE.Mesh( geometry, material );
box.position.set( 0, -1.4, 0 );
scene.add( box );


camera.position.set( 1.5, 5, 5 );

function animate( time ) {

  if ( isZooming ) {
    camera.position.lerp( zoomCameraPosition, 0.08 );
    controls.target.lerp( zoomControlsTarget, 0.08 );

    if ( camera.position.distanceTo( zoomCameraPosition ) < 0.01 ) {
      isZooming = false;
    }
  }

  controls.update();
  updateHorseHeadPosition();
  updateInfoButtonPosition();
  renderer.render( scene, camera );

}