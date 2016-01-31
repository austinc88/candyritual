
'use strict';
var Char1 = require('../prefabs/Char1');
var Enemy = require('../prefabs/enemy');
var Ground = require('../prefabs/ground');
var Pipe = require('../prefabs/pipe');
var PipeGroup = require('../prefabs/pipeGroup');
var Scoreboard = require('../prefabs/scoreboard');
var Missile = require('../prefabs/traps/missile');
var Lazer = require('../prefabs/traps/lazer');
var Platform = require('../prefabs/platform');
var PlatformGroup = require('../prefabs/platformGroup');
var Lava = require('../prefabs/traps/lava');
var Meteor = require('../prefabs/traps/meteor');
var FirstAid = require('../prefabs/firstAid');

var DEBUFF_TIMER = {
  lazerFireEvent: 8,
  missileFireEvent: 10,
  meteorsFireEvent:0,
  lavaFireEvent: 20,
  changePlayerControlEvent: { timer: 0,
    isNormal: true
  }
};


function Play() {
}
Play.prototype = {
  create: function() {
    // start the phaser arcade physics engine
    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    // give our world an initial gravity of 1200
    this.game.physics.arcade.gravity.y = 1200;

    // add the background sprite
    this.background = this.game.add.tileSprite(0,-42,840,420,'background');
    this.healthBar1 = this.game.add.sprite(0, 0, 'heart');
    this.healthBar1.scale.x = 2;
    this.healthBar1.scale.y = 2;
    this.healthBar2 = this.game.add.sprite(50, 0, 'heart');
    this.healthBar2.scale.x = 2;
    this.healthBar2.scale.y = 2;
    this.healthBar3 = this.game.add.sprite(100, 0, 'heart');
    this.healthBar3.scale.x = 2;
    this.healthBar3.scale.y = 2;

    // create and add a group to hold our pipeGroup prefabs
    this.pipes = this.game.add.group();
    this.platforms = this.game.add.group();
    this.meteors = this.game.add.group();

    // create and add a new Ground object
    this.ground = new Ground(this.game, 0, this.game.height-63, 840, 420);
    this.game.add.existing(this.ground);

    // create and add a new Char1 object
    this.char1 = new Char1(this.game, 100, this.ground.y-25);
    this.game.add.existing(this.char1);

    this.setUpKeyListeners();

    //create and add new Enemy object
    this.enemy = new Enemy(this.game, 700, 200);
    this.game.add.existing(this.enemy);

    this.lava = null;

    this.setUpEnemyKeyListeners();

    this.firstAidNum = 1;

    // add mouse/touch controls
    this.game.input.onDown.addOnce(this.startGame, this);

    // keep the spacebar from propogating up to the browser
    this.game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);


    this.score = 0;
    this.scoreText = this.game.add.bitmapText(this.game.width/2, 10, 'flappyfont',this.score.toString(), 24);

    this.instructionGroup = this.game.add.group();
    this.instructionGroup.add(this.game.add.sprite(this.game.width/2, 100,'getReady'));
    this.instructionGroup.setAll('anchor.x', 0.5);
    this.instructionGroup.setAll('anchor.y', 0.5);

    this.pipeGenerator = null;

    this.gameover = false;

    this.gray = this.game.add.filter('Gray');

    Phaser.Canvas.setSmoothingEnabled(this, true);

    this.sounds = {
      pipeHitSound: this.game.add.audio('pipeHit'),
      groundHitSound: this.game.add.audio('groundHit'),
      scoreSound: this.game.add.audio('score')
    }

    //initialize the buttons
    this.lazerButton = this.game.add.sprite(this.game.width - 50, 0, 'buttons', 0);
    this.lazerButton.scale.x = 2;
    this.lazerButton.scale.y = 2;
    this.swapKeyButton = this.game.add.sprite(this.game.width - 100, 0, 'buttons', 2);
    this.swapKeyButton.scale.x = 2;
    this.swapKeyButton.scale.y = 2;
    this.missileButton = this.game.add.sprite(this.game.width - 150, 0, 'buttons', 4);
    this.missileButton.scale.x = 2;
    this.missileButton.scale.y = 2;
    this.meteorButton = this.game.add.sprite(this.game.width - 200, 0, 'buttons', 6);
    this.meteorButton.scale.x = 2;
    this.meteorButton.scale.y = 2;


  },
  update: function() {
    // enable collisions between the char1 and the ground
    // this.game.physics.arcade.collide(this.char1, this.ground, this.deathHandler, null, this);
    this.game.physics.arcade.collide(this.char1, this.ground);
    this.game.physics.arcade.collide(this.meteors, this.ground);
    this.game.physics.arcade.collide(this.char1, this.firstAidKit, this.healHandler, null, this);
    this.game.physics.arcade.collide(this.char1, this.lazer, this.lazerHandler, null, this);
    this.game.physics.arcade.collide(this.char1, this.missile, this.damageHandler, null, this);
    this.game.physics.arcade.collide(this.char1, this.lava, this.deathHandler, null, this);

    if(!this.gameover) {
      // enable collisions between the char1 and each group in the pipes group
      this.pipes.forEach(function(pipeGroup) {
        this.checkScore(pipeGroup);
        this.game.physics.arcade.collide(this.char1, pipeGroup);
      }, this);

      this.platforms.forEach(function(platformGroup) {
        this.game.physics.arcade.collide(this.char1, platformGroup);
      }, this);

      this.meteors.forEach(function(Meteor){
        this.game.physics.arcade.collide(this.char1, Meteor);
      }, this)
    }

    if (this.char1.x < 25) {
      this.deathHandler();
    }
    if (this.firstAidNum%4 === 0) {
        this.firstAidNum++;
        console.log(this.firstAidNum);
        this.firstAidKit = new FirstAid(this.game, this.game.width/4*3, this.ground.body.y - 20, 0);
        this.game.add.existing(this.firstAidKit);
    }

    if ( this.lava && this.lava.body.x < -192 && this.game.time.totalElapsedSeconds() > DEBUFF_TIMER.lavaFireEvent) {
        this.lava.reset();
        DEBUFF_TIMER.lavaFireEvent += this.game.rnd.integerInRange(0,10);
    }

    this.canFire();

  },
  canFire: function() {
    if (this.lazerButton.filters != null && this.game.time.totalElapsedSeconds() > DEBUFF_TIMER.lazerFireEvent) {
      this.lazerButton.filters = null;
    }

    if (this.swapKeyButton.filters != null && this.game.time.totalElapsedSeconds() > DEBUFF_TIMER.changePlayerControlEvent.timer) {
      this.swapKeyButton.filters = null;
    }

    if (this.missileButton.filters != null && this.game.time.totalElapsedSeconds() > DEBUFF_TIMER.missileFireEvent) {
      this.missileButton.filters = null;
    }

    if (this.meteorButton.filters != null && this.game.time.totalElapsedSeconds() > DEBUFF_TIMER.meteorsFireEvent) {
      this.meteorButton.filters = null;
    }

  },
  shutdown: function() {
    this.game.input.keyboard.removeKey(Phaser.Keyboard.SPACEBAR);
    this.char1.destroy();
    this.pipes.destroy();
    this.platforms.destroy();
    this.scoreboard.destroy();
  },
  startGame: function() {
    if(!this.char1.alive && !this.gameover) {
      this.char1.body.allowGravity = true;
      this.char1.alive = true;
      // add a timer
      this.pipeGenerator = this.game.time.events.loop(Phaser.Timer.SECOND * 25, this.generatePipes, this);
      this.pipeGenerator.timer.start();

      this.platformGenerator = this.game.time.events.loop(Phaser.Timer.SECOND * 15, this.generatePlatforms, this);
      this.platformGenerator.timer.start();

      this.instructionGroup.destroy();
      this.lava = new Lava(this.game, this.game.width*2, this.ground.body.y - 5);
      this.game.add.existing(this.lava);
    }
  },
  checkScore: function(pipeGroup) {
    if(pipeGroup.exists && !pipeGroup.hasScored && pipeGroup.topPipe.world.x <= this.char1.world.x) {
      pipeGroup.hasScored = true;
      this.score++;
      this.scoreText.setText(this.score.toString());
      this.sounds.scoreSound.play();
    }
  },
  healHandler: function(char1, AidKit) {
    this.updateHealth('UP');
    this.char1.gainHealth();
    AidKit.kill();
  },
  damageHandler: function(char1, enemy) {
    this.updateHealth('DOWN');
    this.char1.takeDamage();
    enemy.kill();

    //TODO: Damage animation / sprite when taking damage

    if (this.char1.getHealth() <= 0) {
      this.deathHandler();
    }
  },
  updateHealth: function(value) {
    if (this.char1.getHealth() === 2 && value === 'UP') {
        this.healthBar3.visible = true;
    }

    if (this.char1.getHealth() === 2 && value === 'DOWN') {
        this.healthBar2.visible = false;
    }

    if (this.char1.getHealth() === 1 && value === 'UP') {
        this.healthBar2.visible = true;
    }

    if (this.char1.getHealth() === 1 && value === 'DOWN') {
        this.healthBar1.visible = false;
    }

    if (this.char1.getHealth() === 3 && value === 'DOWN') {
        this.healthBar3.visible = false;
    }
  },
  lazerHandler: function(char1, enemy) {
    if (enemy.isHarmful) {
      console.log(enemy.isHarmful);
      this.damageHandler(char1, enemy);
    } else {
      console.log("IS NOT HARMFUL");
    }
  },
  deathHandler: function(char1, enemy) {
    if(!this.gameover) {
      this.sounds.groundHitSound.play();
      this.scoreboard = new Scoreboard(this.game);
      this.game.add.existing(this.scoreboard);
      this.scoreboard.show(this.score);
      this.gameover = true;
      this.char1.kill();
      this.pipes.callAll('stop');
      this.platforms.callAll('stop');
      this.lava.stop();
      this.pipeGenerator.timer.stop();
      this.ground.stopScroll();
    }

  },
  generatePipes: function() {
    var pipeY = this.game.rnd.integerInRange(0, 50);
    var pipeGroup = this.pipes.getFirstExists(false);
    if(!pipeGroup) {
      pipeGroup = new PipeGroup(this.game, this.pipes);
    }
    pipeGroup.reset(this.game.width, pipeY);
  },
  generateLazer: function() {
    if (!this.lazer || this.game.time.totalElapsedSeconds() > DEBUFF_TIMER.lazerFireEvent) {
      console.log(this.game.time.totalElapsedSeconds());
      var lazerY = this.game.rnd.integerInRange(0, 500);
      // create and add a new lazer object
      this.lazer = new Lazer(this.game, this.game.width-25, lazerY, 2);
      this.game.add.existing(this.lazer);
      this.lazerButton.filters = [this.gray];
      DEBUFF_TIMER.lazerFireEvent = 8 + this.game.time.totalElapsedSeconds();
    }
  },
  generateMissile: function() {
    if (!this.missile || this.game.time.totalElapsedSeconds() > DEBUFF_TIMER.missileFireEvent) {
        console.log("this total for missile: " + DEBUFF_TIMER.missileFireEvent);
        // var missileY = this.game.rnd.integerInRange(0, 300);
        var missileY = this.enemy.y;
        var missleX = this.enemy.x;

        this.missile = new Missile(this.game, missleX, missileY, 6, "missile");
        this.game.add.existing(this.missile);
        this.missile.shoot();
        this.firstAidNum++;
        this.missileButton.filters = [this.gray]
        DEBUFF_TIMER.missileFireEvent = 10 + this.game.time.totalElapsedSeconds();
    }
  },
  generatePlatforms: function() {
    var platformY = this.game.rnd.integerInRange(220, 320);
    var platformGroup = this.platforms.getFirstExists(false);
    if(!platformGroup) {
      platformGroup = new PlatformGroup(this.game, this.platforms);
    }
    platformGroup.reset(this.game.width, platformY);
  },
  generateMeteors: function() {
    if (this.game.time.totalElapsedSeconds() > DEBUFF_TIMER.meteorsFireEvent) {
    var meteorsX = this.game.rnd.integerInRange(0, this.game.width);
    var meteorsGroup = this.meteors.getFirstExists(false);
    if (!meteorsGroup) {
        meteorsGroup = new Meteor(this.game, this.meteors);
    }
    meteorsGroup.reset(meteorsX, meteorsX/13);
    this.meteorButton.filters = [this.gray]
    DEBUFF_TIMER.meteorsFireEvent = 10 + this.game.time.totalElapsedSeconds();
  }
  },
  changePlayerControl: function(){
    if (this.game.time.totalElapsedSeconds() > DEBUFF_TIMER.changePlayerControlEvent.timer){
      DEBUFF_TIMER.changePlayerControlEvent.isNormal = !DEBUFF_TIMER.changePlayerControlEvent.isNormal;
      this.swapKeyListeners(DEBUFF_TIMER.changePlayerControlEvent.isNormal);
      DEBUFF_TIMER.changePlayerControlEvent.isNormal = !DEBUFF_TIMER.changePlayerControlEvent.isNormal;
      this.game.time.events.add(Phaser.Timer.SECOND*2, function(){this.swapKeyListeners(DEBUFF_TIMER.changePlayerControlEvent.isNormal)}, this);
      this.swapKeyButton.filters = [this.gray];
      DEBUFF_TIMER.changePlayerControlEvent.timer = 30 + this.game.time.totalElapsedSeconds();
    }
  },
  swapKeyListeners: function(bool) {
    console.log(bool);
  if (bool) {
    this.upKey.onDown.remove(this.char1.moveRight,this.char1);
    this.leftKey.onDown.remove(this.char1.moveUp,this.char1);
    this.rightKey.onDown.remove(this.char1.moveLeft,this.char1);
    this.upKey.onDown.add(this.char1.moveUp, this.char1);
    this.leftKey.onDown.add(this.char1.moveLeft, this.char1);
    this.rightKey.onDown.add(this.char1.moveRight, this.char1);
  } else {
    this.upKey.onDown.remove(this.char1.moveUp,this.char1);
    this.leftKey.onDown.remove(this.char1.moveLeft,this.char1);
    this.rightKey.onDown.remove(this.char1.moveRight,this.char1);
    this.upKey.onDown.add(this.char1.moveRight, this.char1);
    this.leftKey.onDown.add(this.char1.moveUp, this.char1);
    this.rightKey.onDown.add(this.char1.moveLeft, this.char1);
  }
},
  setUpKeyListeners: function() {
    // add keyboard controls
    this.upKey = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
    this.upKey.onDown.addOnce(this.startGame, this);
    this.upKey.onDown.add(this.char1.moveUp, this.char1);

    this.leftKey = this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
    this.leftKey.onDown.add(this.char1.moveLeft, this.char1);

    this.rightKey = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
    this.rightKey.onDown.add(this.char1.moveRight, this.char1);

    this.downKey = this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
    this.downKey.onDown.add(this.char1.moveDown, this.char1);
  },
  setUpEnemyKeyListeners: function() {
    // add enemy keyboard controls
    this.enemyUpKey = this.game.input.keyboard.addKey(Phaser.Keyboard.W);
    this.enemyUpKey.onDown.add(this.enemy.moveUp, this.enemy);

    this.enemyLeftKey = this.game.input.keyboard.addKey(Phaser.Keyboard.A);
    this.enemyLeftKey.onDown.add(this.enemy.moveLeft, this.enemy);

    this.enemyRightKey = this.game.input.keyboard.addKey(Phaser.Keyboard.D);
    this.enemyRightKey.onDown.add(this.enemy.moveRight, this.enemy);

    this.enemyDownKey = this.game.input.keyboard.addKey(Phaser.Keyboard.S);
    this.enemyDownKey.onDown.add(this.enemy.moveDown, this.enemy);

    this.enemyGKey = this.game.input.keyboard.addKey(Phaser.Keyboard.G);
    this.enemyGKey.onDown.add(this.generateLazer, this);

    this.shot = this.game.input.keyboard.addKey(Phaser.Keyboard.T);
    this.shot.onDown.add(this.generateMissile, this);

    this.meteorsKey = this.game.input.keyboard.addKey(Phaser.Keyboard.M);
    this.meteorsKey.onDown.add(this.generateMeteors, this);

    this.changePlayerControlKey = this.game.input.keyboard.addKey(Phaser.Keyboard.B);
    this.changePlayerControlKey.onDown.add(this.changePlayerControl, this);
  }

};

module.exports = Play;
