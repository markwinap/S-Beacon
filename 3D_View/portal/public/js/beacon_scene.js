'use strict';

/* global THREE */

//BEACONS POSITION IF SIZE 1
//X; -17 - 2 | Y: 0,2,4,5,12,16 | Z: -8 - 8
let beacons_pos = [[[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],[[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],[[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],[[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],[[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]];
//Fill Array
for (let y = 0; y < 5; y++) {
  for (let x = 0; x < 19; x++) {
    for (let z = 0; z < 16; z++) {
      beacons_pos[y][x][z] = {
        x: -17 + x,
        y: y,
        z: -8 + z,
        color: '#fff',
        beacon: null,
        BeaconID: 'no'
      };
    }
  }
}
window.addEventListener('load', (event) => {
  main();
  const load_data = setInterval(function () {
    getData();
  }, 3000);
})
async function getData() {
  let beac = await axios({
    method: 'get',
    url: 'http://localhost:3000/data.json'
  }).then(res => res).catch(err => err);
  let it = beac.data.Items;
  for (let a in it) {
    let zone = parseInt(it[a].ZoneID, 0);
    let nFound = true;
    for (let x in beacons_pos[zone]) {
      for (let z in beacons_pos[zone][x]) {
        if (it[a].BeaconID == beacons_pos[zone][x][z].BeaconID) {
          beacons_pos[zone][x][z].beacon = it[a];
          nFound = false;
        }
      }
    }
    if (nFound) {
      let x = randInt(beacons_pos[zone].length);
      let z = randInt(beacons_pos[zone][x].length);
      beacons_pos[zone][x][z].beacon = it[a];
      beacons_pos[zone][x][z].BeaconID = it[a].BeaconID;
    }
  }
}
let building;
let mainObj = [];
let objects = [];
let beacons = [];
let params = {
  message: 'Beacons 3D',
  speed: 0.3,
  rotate: false,
  dots: false,
  heartbeat: '#FFE66D',
  alarmout: '#FF6B6B',
  alarmin: '#4ECDC4',
  dots_color: '#FF6B6B',
  dots_size: 0.08,
  building_color: '#FCA311'
};

function main() {
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({
    canvas
  });
  //CAMERA
  const fov = 75;
  const aspect = 2; // the canvas default
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 2;
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  const scene = new THREE.Scene();

  //STATS
  const stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);

  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);
  }
  //GUI
  const gui = new dat.GUI();
  gui.add(params, 'message');
  gui.add(params, 'speed', 0, 3.0);
  gui.add(params, 'rotate');
  //Beacons
  const b = gui.addFolder('Beacons');
  b.addColor(params, 'heartbeat');
  b.addColor(params, 'alarmout');
  b.addColor(params, 'alarmin');
  //Dots
  const d = gui.addFolder('Dots');
  d.add(params, 'dots');
  d.addColor(params, 'dots_color');
  d.add(params, 'dots_size', 0, 1.0);
  //Building Color
  const bu = gui.addFolder('Building');
  bu.addColor(params, 'building_color');


  {
    const loader = new THREE.ObjectLoader();
    loader.load(
      "models/tata.json",
      function (obj) {
        for (let i in obj.children) {
          mainObj.push(obj.children[i].geometry);
        }
      },
      // onProgress callback
      function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      // onError callback
      function (err) {
        console.error('An error happened');
      }
    );
  }

  function addLineGeometry(x, y, color, geometry) {
    const material = new THREE.LineBasicMaterial({
      color: color,
      linecap: 'round',
      linejoin: 'round'
    });
    const mesh = new THREE.LineSegments(geometry, material);
    return mesh;
    //addObject(x, y, mesh);
  }

  function addPointGeometry(x, y, color, size, geometry) {
    const poinM = new THREE.PointsMaterial({
      color: color,
      size: size
    });
    const poinG = new THREE.Points(geometry, poinM);
    return poinG;
    //addObject(x, y, poinG);
  }
  const boxG = new THREE.BoxBufferGeometry(0.5, 0.5, 0.5);
  const group = new THREE.Group();

  function addBoxGeometry(x, y, z, color, geometry) {
    const material = new THREE.MeshBasicMaterial({
      color: color
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.x = x;
    cube.position.y = y;
    cube.position.z = z;
    return cube;
  } {
    const width = 1;
    const height = 1;
    const depth = 1;
    addLineGeometry(0, 0, new THREE.EdgesGeometry(new THREE.BoxBufferGeometry(width, height, depth)));
  } {
    const radius = 1;
    const geometry = new THREE.OctahedronBufferGeometry(radius);

    addLineGeometry(0, 0, new THREE.EdgesGeometry(geometry));

  }

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    const width = canvas.clientWidth * pixelRatio | 0;
    const height = canvas.clientHeight * pixelRatio | 0;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  function render(time) {
    time *= 0.001;
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    newObjects();
    if (params.rotate) {
      const rot = time * params.speed;
      group.rotation.y = rot;
    }
    stats.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  function newObjects() {
    group.children = [];
    if (objects.length > 0) {
      for (let i in objects) {
        scene.remove(objects[i]);
        objects = [];
      }
    }
    for (let i in mainObj) {
      let o = new THREE.EdgesGeometry(mainObj[i]);
      group.add(addLineGeometry(0, 0, params.building_color, o));
      if (params.dots) {
        group.add(addPointGeometry(0, 0, params.dots_color, params.dots_size, o));
      }
    }
    for (let ba in beacons_pos) {
      for (let bb in beacons_pos[ba]) {
        for (let bc in beacons_pos[ba][bb]) {
          let beacon_obj = beacons_pos[ba][bb][bc];
          if (beacon_obj.beacon != null) {
            group.add(addBoxGeometry(beacon_obj.x, beacon_obj.y * 4, beacon_obj.z, params[beacon_obj.beacon.msgtype], boxG));
          }
        }
      }
    }
    group.position.set(0, -10, 0);
    scene.add(group);
  }
}


function randInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}