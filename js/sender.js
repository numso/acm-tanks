/* global chrome, console, $ */

var applicationID = '9E944A4E';

var mySession;

$(function () {
  'use strict';

  init();

  function init() {
    if (!chrome || !chrome.cast || !chrome.cast.isAvailable)
      return setTimeout(init, 1000);

    var sessionRequest = new chrome.cast.SessionRequest(applicationID);

    var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
      function sessionJoinedListener(session) {
        mySession = session;
        debug('sessionJoinedListener', arguments);
      }, function receiverListener(e) {
        debug('receiverListener', arguments);
        var fn = (e === 'available' ? 'show' : 'hide');
        $('#cast')[fn]();
      }
    );

    chrome.cast.initialize(apiConfig,
      function onInitSuccess() {
        debug('onInitSuccess', arguments);
      }, function onInitError() {
        debug('onInitError', arguments);
      }
    );
  }

  $('#cast').click(cast);
  function cast() {
    chrome.cast.requestSession(
      function successCallback(session) {
        debug('successCallback', arguments);
        mySession = session;
        mySession.addUpdateListener(
          function sessionUpdateListener() {
            debug('sessionUpdateListener', arguments);
          }
        );
      }, function errorCallback() {
        debug('errorCallback', arguments);
      }
    );
  }

  function debug(msg, args) {
    console.log(msg + JSON.stringify(args));
  }
});
