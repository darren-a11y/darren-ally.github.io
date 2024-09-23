import { Group, Vector3 } from '../../libs/three137/three.module.js'
import { GLTFLoader } from '../../libs/three137/GLTFLoader.js'
import { Explosion } from './Explosion.js';

class Obstacles {

  constructor (game) {
    this.assetsPath = game.assetsPath;
    this.loadingBar = game.loadingBar;
    this.game = game;
    this.scene = game.scene;
    this.loadStar();
    this.loadBomb();
    this.tmpPos = new Vector3();
    this.explosions = [];
  }

  loadStar () {
    const loader = new GLTFLoader().setPath(`${this.assetsPath}plane/`);
    this.ready = false;

    loader.load(
      'star.glb',
      gltf => {
        this.star = gltf.scene.children[0];
        this.star.name = 'star';
        if(this.bomb !== undefined) this.initialize();
      },
      xhr => {
        this.loadingBar.update('star', xhr.loaded, xhr.total);
      },
      err => {
        console.error( err );
      }
    );
  }

  loadBomb () {
    const loader = new GLTFLoader().setPath(`${this.assetsPath}plane/`);
    loader.load(
      'bomb.glb',
      gltf => {
        this.bomb = gltf.scene.children[0];
        if( this.star !== undefined ) this.initialize();
      },
      xhr => {
        this.loadingBar.update('bomb', xhr.loaded, xhr.total);
      },
      err => {
        console.error(err);
      }
    );
  }

  initialize () {
    this.obstacles = [];

    const obstacle = new Group();
    obstacle.add(this.star);
    // オリジナルの爆弾
    this.bomb.rotation.x = - Math.PI * .5;
    this.bomb.position.y = 7.5;
    obstacle.add(this.bomb);

    let rotate = true;

    for (let y = 5; y > -8; y -= 2.5) {
      rotate = !rotate;
      if (y === 0) continue;
      const bomb = this.bomb.clone();
      bomb.rotation.x = rotate ? -1 * Math.PI * .5 : 0;
      bomb.position.y = y;
      obstacle.add(bomb);
    }

    // １つのセット
    this.obstacles.push(obstacle);

    this.scene.add(obstacle);

    for (let i = 0; i < 3; i++) {
      const obstacle1 = obstacle.clone();
      this.scene.add(obstacle1);
      this.obstacles.push(obstacle1);
    }

    this.reset();

    this.ready = true;

  }

  removeExplosion (explosion) {
    const index = this.explosions.indexOf( explosion );
    if (index !== -1) this.explosions.splice( index, 1 );
  }

  reset () {
    this.obstacleSpawn = { pos: 20, offset: 5};
    this.obstacles.forEach( obstacle => this.respawnObstacle(obstacle) );
    let count;
    console.log(this);
     // whileループが無限にならないようにダブルチェック用
     while( this.explosions.length>0 && count<100){
      this.explosions[0].onComplete();
      count++;
  }
  }

  respawnObstacle (obstacle) {
    // 30 遠くに置く
    this.obstacleSpawn.pos += 30;
    // -1 ~ 1 * 5 で Yの位置をずらす
    const offset = (Math.random() * 2 - 1) * this.obstacleSpawn.offset;
    this.obstacleSpawn.offset += 0.2;
    // x , y, z
    obstacle.position.set(0, offset, this.obstacleSpawn.pos); 
    // 星を 0 ~ 180 で回転
    obstacle.children[0].rotation.y = Math.random() * Math.PI * 2;
    obstacle.userData.hit = false;
    obstacle.children.forEach( child => {
      child.visible = true;
    } )
  }

  // Game.js でレンダリングの度に update
  update(pos, time) {
    let collisionObstacle;

    // 柱の配列
    this.obstacles.forEach( obstacle => {
      obstacle.children[0].rotateY(0.01);
      const relativePosZ = obstacle.position.z - pos.z;
      // zの距離が２以下だと？
      if (Math.abs(relativePosZ) < 2 && !obstacle.userData.hit) {
        // ぶつかるかも候補
        collisionObstacle = obstacle;
      }
      if (relativePosZ < - 20) {
        // 十分に通り過ぎたら 再配置
        this.respawnObstacle(obstacle);
      }

    });

    if (collisionObstacle !== undefined) {
      collisionObstacle.children.some( child => {
        // 引数に渡した変数に座標がセットされる
        child.getWorldPosition(this.tmpPos);
        const dist = this.tmpPos.distanceToSquared(pos);
        if (dist < 5) {
          collisionObstacle.userData.hit = true;
          this.hit(child);
          // some をここで終了
          return true;
        }
  
      });
    }

    this.explosions.forEach(explosion => {
      explosion.update( time );
    });

  }

  hit (obj) {
    if(obj.name === 'star') {
      obj.visible = false;
      this.game.incScore();
    } else {
      this.explosions.push(new Explosion(obj, this));
      this.game.decLives();
    }
    
  }

}

export { Obstacles }