
'use strict';
function Preload() {
  this.asset = null;
  this.ready = false;
}

Preload.prototype = {
  preload: function() {
    this.asset = this.add.sprite(this.width/2,this.height/2, 'preloader');
    this.asset.anchor.setTo(0.5, 0.5);

    this.load.onLoadComplete.addOnce(this.onLoadComplete, this);
    this.load.setPreloadSprite(this.asset);
    this.load.image('background', 'assets/background.png');
    this.load.spritesheet('ground', 'assets/ground.png', 21,21,22);

    this.load.image('title', 'assets/splash.png');

    this.load.spritesheet('lazer', 'assets/projectiles.png', 21,21,21);
    this.load.spritesheet('char1', 'assets/char1.png', 21,21,11);
    this.load.spritesheet('enemy', 'assets/enemy.png', 21,21,11);
    this.load.spritesheet('pipe', 'assets/pipes.png', 54,320,2);
    this.load.spritesheet('platform', 'assets/ground.png',21,21,22);
    this.load.spritesheet('lava', 'assets/ground.png',21,21,22);
    this.load.image('startButton', 'assets/start-button.png');
    this.load.image('firstAid', 'assets/firstaid.png');
    this.load.spritesheet('reward', 'assets/pinkcandy.png',21,21,0);
    this.load.spritesheet('heart', 'assets/hearts.png', 21, 21, 1);
    this.load.spritesheet('missile', 'assets/projectiles.png', 21, 21, 21);
    this.load.spritesheet('buttons', 'assets/buttons.png', 21, 21, 8);
    this.load.spritesheet('arrows', 'assets/dance1.png', 21, 21, 16);

    this.load.image('instructions', 'assets/instructions2.png');
    this.load.image('getReady', 'assets/get-ready.png');

    this.load.image('scoreboard', 'assets/scoreboard1.png');
    this.load.image('gameover', 'assets/gameover.png');
    this.load.image('particle', 'assets/particle.png');
    this.load.spritesheet('meteor', 'assets/meteor1.png',21,13,3);

    this.load.script('gray', 'https://raw.githubusercontent.com/photonstorm/phaser-examples/master/examples/filters/gray.js');

    this.load.audio('menu_music', 'assets/Happy_Music.wav');
    this.load.audio('action_music', 'assets/action_music.wav');
    this.load.audio('lazer_shot', 'assets/laser_shot.wav');
    this.load.audio('lazer_hit', 'assets/Laser_Hit.wav');
    this.load.audio('lava_flow', 'assets/lava_flow.wav');
    this.load.audio('lava_hit', 'assets/lava_hit.wav');
    this.load.audio('missile_launch', 'assets/missile_launch.wav');
    this.load.audio('missile_hit', 'assets/Missile_Player.wav');
    this.load.audio('jump', 'assets/flap.wav');
    this.load.audio('score', 'assets/score.wav');
    this.load.audio('menu_whoosh', 'assets/menu_whoosh_up.wav');
    this.load.audio('meteor_sound', 'assets/Missile_Explosion.wav');
    this.load.audio('game_over_sound', 'assets/smb_mariodie.wav');
    this.load.audio('swap_control_sound', 'assets/swapPlayer.wav');

    this.load.bitmapFont('flappyfont', 'assets/fonts/flappyfont/flappyfont.png', 'assets/fonts/flappyfont/flappyfont.fnt');

  },
  create: function() {
    this.asset.cropEnabled = false;
  },
  update: function() {
    if(!!this.ready) {
      this.game.state.start('menu');
    }
  },
  onLoadComplete: function() {
    this.ready = true;
  }
};

module.exports = Preload;
