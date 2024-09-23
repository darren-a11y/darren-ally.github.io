import * as THREE from '../../libs/three137/three.module.js';
import { RGBELoader } from '../../libs/three137/RGBELoader.js';
import { LoadingBar } from '../../libs/LoadingBar.js';
import { Plane } from './Plane.js';
import { Obstacles } from './Obstacles.js';

class Game {
  
  constructor () {
    const container = document.createElement('div');
    document.body.appendChild( container );

    this.loadingBar = new LoadingBar();
    this.loadingBar.visible = false;
    this.clock = new THREE.Clock();
    this.assetsPath = '../../assets/';

    this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 100 );
    
    this.camera.position.set( -4.37, 0, -4.37 );
    this.camera.lookAt( 0, 0, 6);

    this.cameraController = new THREE.Object3D();
    // コントロール配下に置く
    this.cameraController.add( this.camera );
    // カメラが見る場所の座標
    this.cameraTarget = new THREE.Vector3( 0, 0, 6);

    this.scene = new THREE.Scene();
    this.scene.add( this.cameraController );

    const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    ambient.position.set( 0.5, 1, 0.25 );
    this.scene.add( ambient );

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    // 今だと .outputColorSpace に変わっている
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    container.appendChild( this.renderer.domElement );
    this.setEnvironment();
    this.load();

    window.addEventListener('resize', this.resize.bind(this) );

    document.addEventListener('keydown', this.keyDown.bind(this) );
    document.addEventListener('keyup', this.keyUp.bind(this) );

    document.addEventListener('touchstart', this.mouseDown.bind(this) );
    document.addEventListener('touchend', this.mouseUp.bind(this));
    document.addEventListener('mouseDown', this.mouseDown.bind(this) );
    document.addEventListener('mouseUp', this.mouseUp.bind(this));

    this.spaceKey = false;
    this.active = false;

    const btn = document.getElementById('playBtn');
    btn.addEventListener('click', this.startGame.bind(this));

  }

  startGame() {
    const gameover = document.getElementById('gameover');
    const instructions = document.getElementById('instructions');
    const btn = document.getElementById('playBtn');

    gameover.style.display = 'none';
    instructions.style.display = 'none';
    btn.style.display = 'none';

    this.score = 0;
    this.lives = 3;

    let elm = document.getElementById('score');
    elm.innerHTML = this.score;

    elm = document.getElementById('lives');
    elm.innerHTML = this.lives;

    this.plane.reset();
    this.obstacles.reset();

    this.active = true;
  }

  resize () {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
  }

  mouseDown(evt){
    this.spaceKey = true;
  }

  mouseUp(evt){
    this.spaceKey = false;
  }

  keyDown(evt){
    switch(evt.keyCode){
      case 32:
        this.spaceKey = true; 
        break;
    }
  }

  keyUp(evt){
    switch(evt.keyCode){
      case 32:
        this.spaceKey = false;
        break;
    }
  }


  setEnvironment () {
    const loader = new RGBELoader().setPath( this.assetsPath );
    const pmremGenerator = new THREE.PMREMGenerator( this.renderer );
    pmremGenerator.compileEquirectangularShader();

    loader.load('hdr/venice_sunset_1k.hdr', texture => {
      const envMap = pmremGenerator.fromEquirectangular( texture ).texture;
      pmremGenerator.dispose();
      this.scene.environment = envMap;

    }, undefined, err => {
      console.error( err.message );
    });
  }

  load () {
    this.loading = true;
    this.loadingBar.visible = true;
    this.loadSkybox();
    this.plane = new Plane(this);
    this.obstacles = new Obstacles(this);
  }

  loadSkybox () {
    this.scene.background = new THREE.CubeTextureLoader()
      .setPath( `${this.assetsPath}plane/paintedsky/` )
      .load( [
        'px.jpg',
        'nx.jpg',
        'py.jpg',
        'ny.jpg',
        'pz.jpg',
        'nz.jpg'
      ], () => {
        this.renderer.setAnimationLoop( this.render.bind(this) );
      } )
  }

  gameOver(){
    this.active = false;

    const gameover = document.getElementById('gameover');
    const btn = document.getElementById('playBtn');

    gameover.style.display = 'block';
    btn.style.display = 'block';
  }

  incScore(){
    this.score++;
    const elm = document.getElementById('score');
    elm.innerHTML = this.score;
  }

  decLives(){
    this.lives--;
    const elm = document.getElementById('lives');
    elm.innerHTML = this.lives;
    if (this.lives === 0) this.gameOver();
  }

  updateCamera () {
    this.cameraController.position.copy( this.plane.position );
    this.cameraController.position.y = 0;
    this.cameraTarget.copy( this.plane.position );
    // 手前にする
    this.cameraTarget.z += 6;
    this.camera.lookAt( this.cameraTarget );
  }

  render () {
    if (this.loading) {
      if (this.plane.ready && this.obstacles.ready) {
        this.loading = false;
        this.loadingBar.visible = false;
      } else {
        return;
      }
    }

    const dt = this.clock.getDelta();
    const time = this.clock.getElapsedTime();
    this.plane.update(time);

    if (this.active) {
      // 障害物を飛行機の位置でアップデート？
      this.obstacles.update(this.plane.position, dt);
    }
    this.updateCamera();
    this.renderer.render( this.scene, this.camera );

  }

}

export { Game };