/* global $, Firebase */

$(function () {
  'use strict';

  var K_FIRE  = 32;
  var K_LEFT  = 37;
  var K_UP    = 38;
  var K_RIGHT = 39;
  var K_DOWN  = 40;

  var id = getID();
  var fbTank = new Firebase('https://tanks-acm.firebaseio.com/tanks/' + id);

  var tank = { dx: 0, dy: 0 };
  update();

  var kills = 0;
  var deaths = 0;
  updateStats();

  fbTank.on('value', function (snapshot) {
    var val = snapshot.val();
    kills = val.kills || 0;
    deaths = val.deaths || 0;
    updateStats();
  });

  function updateStats() {
    $('#kills').text('Kills: ' + kills);
    $('#deaths').text('Deaths: ' + deaths);
  }

  function getID() {
    var letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    var id = '';
    for (var i = 0; i < 7; ++i) {
      id += letters[Math.floor(Math.random() * letters.length)];
    }
    return id;
  }

  function move(dx, dy) {
    tank.dx = dx;
    tank.dy = dy;
  }

  function shoot() {
    tank.shoot = !tank.shoot;
  }

  function update() {
    fbTank.update(tank);
  }

  function updateKeys() {
    var x = 0;
    var y = 0;

    if (keys[K_FIRE] && !confirm) {
      shoot();
      confirm = true;
    }

    if (keys[K_LEFT]) x -= 1;
    if (keys[K_RIGHT]) x += 1;

    if (keys[K_UP]) y -= 1;
    if (keys[K_DOWN]) y += 1;

    move(x, y);
    update();
  }

  var keys = [];
  var confirm = false;

  $(document).keydown(function (e) {
    keys[e.keyCode] = true;
    updateKeys();
  });

  $(document).keyup(function (e) {
    keys[e.keyCode] = false;
    if (e.keyCode === K_FIRE) confirm = false;
    updateKeys();
  });

  $(window).on('beforeunload', function () {
    fbTank.set(null);
  });

  $(document).on('touchstart', touchStart);
  $(document).on('touchmove', touchMove);
  $(document).on('touchend', touchEnd);

  var curTouch = {};

  function touchStart(e) {
    e.preventDefault();

    var touch = e;
    if (e && e.originalEvent && e.originalEvent.changedTouches) {
      touch = e.originalEvent.changedTouches[0];
    }

    if (touch.pageX > $(window).width() / 2) {
      shoot();
      return update();
    }

    if (!curTouch.identifier) {
      curTouch = touch;
      calculateTouchCoords(touch.pageX, touch.pageY);
    }
  }

  function touchMove(e) {
    e.preventDefault();

    var touch = e;
    if (e && e.originalEvent && e.originalEvent.changedTouches) {
      touch = e.originalEvent.changedTouches[0];
    }

    if (touch.identifier === curTouch.identifier) {
      calculateTouchCoords(touch.pageX, touch.pageY);
    }
  }

  function touchEnd(e) {
    e.preventDefault();

    var id = e.originalEvent.changedTouches[0].identifier;

    if (curTouch.identifier === id) {
      curTouch = {};
      move(0,0);
      update();
    }
  }

  function calculateTouchCoords(rawX, rawY) {
    var w = $(window).width() / 4;
    var h = $(window).height() / 2;

    var x = (rawX - w) / 50;
    if (x < -1) x = -1;
    if (x > 1) x = 1;
    var y = (rawY - h) / 50;
    if (y < -1) y = -1;
    if (y > 1) y = 1;

    move(x, y);
    update();
  }
});
