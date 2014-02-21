/* global $, _, Firebase, requestAnimationFrame, Howl */

_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

$(function () {
  'use strict';

  new Howl({
    urls: ['snd/background.wav'],
    loop: true,
    volume: 0.1
  }).play();

  var music_fire = new Howl({
    urls: ['snd/shoot.mp3'],
    volume: 0.3
  });

  var music_explode = new Howl({
    urls: ['snd/explosion.wav'],
    volume: 0.2
  });

  var names = 'Fire,Crush,Bubba,Terminator,Destroyer,Flash,Catch,Caboose,Little Friend,Inigo Montoya,Napoleon,Batman,Robin,Sludge,Arrow,Gremlin,Chief,Wreck'.split(',');

  var tankTmpl = '<div id="tank-{{id}}" class="tank" style="left:{{x}}px;top:{{y}}px;"><div class="name"><span>{{name}}</span><div class="arrow"></div></div><div class="explode"></div><img src="img/tank.png"></div>';
  var bulletTmpl = '<div id="bullet-{{id}}" class="bullet" style="left:{{x}}px;top:{{y}}px;"></div>';

  var TANK_SPEED = 3;
  var BULLET_SPEED = 5;

  var arena = $('#arena');
  var tanks = {};
  var bullets = [];

  var fbTanks = new Firebase('https://tanks-acm.firebaseio.com/tanks/');

  fbTanks.on('child_added', function (data) {
    createTank(data.name(), data.val());
  });

  fbTanks.on('child_removed', function (data) {
    removeTank(data.name());
  });

  fbTanks.on('child_changed', function (data) {
    updateTank(data.name(), data.val());
  });

  function createTank(id, fbTank) {
    var tank = {
      id: id,
      name: fbTank.name || names[Math.floor(Math.random() * names.length)],
      x: Math.floor(Math.random() * $(window).width()) - 100,
      y: Math.floor(Math.random() * $(window).height()) - 100,
      dx: fbTank.dx || 0,
      dy: fbTank.dy || 0,
      dirX: Math.random() * 2 - 1 || 0.1,
      dirY: Math.random() * 2 - 1
    };

    arena.append(_.template(tankTmpl, tank));
    tank.selector = $('#tank-' + tank.id);
    tanks[id] = tank;

    var rot = getRot(tank, 'dirX', 'dirY');
    tank.selector.find('img').css({
      '-webkit-transform': 'rotate(' + rot + 'deg)'
    });
  }

  function randomizeLoc(tank) {
    tank.x = Math.floor(Math.random() * $(window).width()) - 100;
    tank.y = Math.floor(Math.random() * $(window).height()) - 100;
    tank.selector.css({
      top: tank.y + 'px',
      left: tank.x + 'px'
    });
  }

  function removeTank(id) {
    tanks[id].selector.remove();
    delete tanks[id];
  }

  function updateTank(id, fbTank) {
    tanks[id].dx = fbTank.dx;
    tanks[id].dy = fbTank.dy;
    tanks[id].shoot = fbTank.shoot;
  }

  function createBullet(tank) {
    var bullet = {
      id: getID(),
      plyr: tank.id
    };

    bullet.dx = tank.dirX;
    bullet.dy = tank.dirY;


    var rot = getRot(tank, 'dirX', 'dirY');
    bullet.dx = Math.cos(rot / 180 * Math.PI);
    bullet.dy = Math.sin(rot / 180 * Math.PI);

    bullet.x = tank.x + 25 + bullet.dx * 40;
    bullet.y = tank.y + 25 + bullet.dy * 40;

    arena.append(_.template(bulletTmpl, bullet));
    bullet.selector = $('#bullet-' + bullet.id);
    bullets.push(bullet);
  }

  function removeBullet(bullet, i) {
    bullet.selector.remove();
    bullets.splice(i, 1);
  }

  function updateSprite(tank) {
    if (tank.dead) {
      tank.deadTimer += 10;
      var theTime = Math.floor(tank.deadTimer / 20);
      if (theTime < 25) {
        var newX = theTime % 5;
        var newY = Math.floor(theTime / 5);
        tank.selector.find('.explode').css({
          'background-position-x': (newX * -64),
          'background-position-y': (newY * -64)
        });
      } else {
        tank.dead = false;
        tank.selector.find('img').show();
        tank.selector.find('.explode').hide();
        randomizeLoc(tank);
      }
      return;
    }

    tank.x += tank.dx * TANK_SPEED;
    if (tank.x < 0) tank.x = 0;
    if (tank.x > $(window).width() - 100) tank.x = $(window).width() - 100;

    tank.y += tank.dy * TANK_SPEED;
    if (tank.y < 0) tank.y = 0;
    if (tank.y > $(window).height() - 100) tank.y = $(window).height() - 100;

    tank.selector.css({
      top: tank.y + 'px',
      left: tank.x + 'px'
    });

    if (tank.dx !== 0 || tank.dy !== 0) {
      var rot = getRot(tank, 'dx', 'dy');
      tank.selector.find('img').css({
        '-webkit-transform': 'rotate(' + rot + 'deg)'
      });
      tank.dirX = tank.dx;
      tank.dirY = tank.dy;
    }

    if (tank.shoot !== tank.confirm) {
      createBullet(tank);
      music_fire.play();
      tank.confirm = tank.shoot;
    }
  }

  function updateBullets() {
    for (var i = 0; i < bullets.length; ++i) {
      var b = bullets[i];
      b.x += b.dx * BULLET_SPEED;
      b.y += b.dy * BULLET_SPEED;

      b.selector.css({
        top: b.y + 'px',
        left: b.x + 'px'
      });

      if (b.x < 0 || b.x > $(window).width() || b.y < 0 || b.y > $(window).height()) {
        removeBullet(b, i);
        --i;
      }
    }
  }

  function checkCollision(tank) {
    if (tank.dead) return;
    for (var i = 0; i < bullets.length; ++i) {
      if (bullets[i].plyr === tank.id) continue;
      var x = dist(bullets[i], tank, 25);
      if (x < 50) {
        playDeath(tank, bullets[i].plyr);
        removeBullet(bullets[i], i);
        return;
      }
    }
  }

  function playDeath(tank, bulletId) {
    music_explode.play();
    tank.dead = true;
    tank.deadTimer = 0;
    tank.selector.find('img').hide();
    tank.selector.find('.explode').show().css({
      'background-position-x': 0,
      'background-position-y': 0
    });

    var winner = fbTanks.child(bulletId);
    winner.once('value', function (_tank) {
      var val = _tank.val();
      var kills = val.kills || 0;
      kills++;
      winner.update({ kills: kills });
    });

    var loser = fbTanks.child(tank.id);
    loser.once('value', function (_tank) {
      var val = _tank.val();
      var deaths = val.deaths || 0;
      deaths++;
      loser.update({ deaths: deaths });
    });
  }

  function dist(bullet, tank, offset) {
    return Math.sqrt(Math.pow(bullet.x - tank.x - offset, 2) + Math.pow(bullet.y - tank.y - offset, 2));
  }

  function getID() {
    var letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    var id = '';
    for (var i = 0; i < 7; ++i) {
      id += letters[Math.floor(Math.random() * letters.length)];
    }
    return id;
  }

  function getRot(tank, x_key, y_key) {
    var rot;
    if (tank[x_key] !== 0) {
      rot = Math.atan2(tank[y_key], tank[x_key]) * 180 / Math.PI;
    } else if (tank[y_key] > 0) {
      rot = 90;
    } else if (tank[y_key] < 0) {
      rot = 270;
    }
    return rot;
  }

  function gameLoop() {
    requestAnimationFrame(gameLoop);
    for (var id in tanks) {
      updateSprite(tanks[id]);
      updateBullets();
      checkCollision(tanks[id]);
    }
  }

  gameLoop();
});
