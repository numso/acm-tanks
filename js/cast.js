/* jshint strict:false */
/* global cast, console */

var namespace = 'urn:x-cast:com.dal.tanks';

window.onload = function () {
  cast.receiver.logger.setLevelValue(0);
  var castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
  window.castReceiverManager = castReceiverManager;

  console.log('Starting Receiver Manager');

  // handler for the 'ready' event
  castReceiverManager.onReady = function (event) {
    console.log('Received Ready event: ' + JSON.stringify(event.data));
    castReceiverManager.setApplicationState('Application status is ready...');
  };

  // handler for 'senderconnected' event
  castReceiverManager.onSenderConnected = function (event) {
    console.log('Received Sender Connected event: ' + event.data);
    console.log(castReceiverManager.getSender(event.data).userAgent);
  };

  // handler for 'senderdisconnected' event
  castReceiverManager.onSenderDisconnected = function (event) {
    console.log('Received Sender Disconnected event: ' + event.data);
  };

  // handler for 'systemvolumechanged' event
  castReceiverManager.onSystemVolumeChanged = function (event) {
    console.log('Received System Volume Changed event: ' + event.data.level + ' ' + event.data.muted);
  };

  // create a CastMessageBus to handle messages for a custom namespace
  window.messageBus = castReceiverManager.getCastMessageBus(namespace);

  // handler for the CastMessageBus message event
  window.messageBus.onMessage = function (event) {
    console.log('Message [' + event.senderId + ']: ' + event.data);
  };

  // initialize the CastReceiverManager with an application status message
  castReceiverManager.start(); //{ statusText: 'Application is starting' });
  console.log('Receiver Manager started');
};
