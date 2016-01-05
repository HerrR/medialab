var model = {};
model.trackingPoints = [];
model.faces = [];
model.photoBlobs = [];

window.onload = function() {
  var video = document.getElementById('video');
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');

  var tracker = new tracking.ObjectTracker('face');
  tracker.setInitialScale(4);
  tracker.setStepSize(2);
  tracker.setEdgesDensity(0.1);

  trackerTask = tracking.track('#video', tracker, { camera: true });
  updateTrackerStatus();

  tracker.on('track', function(event) {
    if(event["data"].length > 0){
      model.trackingPoints = event.data;  
    }
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    event.data.forEach(function(rect) {
      context.strokeStyle = '#a64ceb';
      context.strokeRect(rect.x, rect.y, rect.width, rect.height);
      context.font = '11px Helvetica';
      context.fillStyle = "#fff";
      context.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 5, rect.y + 11);
      context.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22);
    });
  });
};