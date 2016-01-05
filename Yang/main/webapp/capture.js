/*
 * Face Recognition app
 *
 * Based on source code from article Taking still photos with WebRTC:
 * https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Taking_still_photos
 *
 */
(function() {
  // The width and height of the captured photo. We will set the
  // width to the value defined here, but the height will be
  // calculated based on the aspect ratio of the input stream.

  var width = 320;    // We will scale the photo width to this
  var height = 0;     // This will be computed based on the input stream

  // |streaming| indicates whether or not we're currently streaming
  // video from the camera. Obviously, we start at false.

  var streaming = false;

  // The various HTML elements we need to configure or control. These
  // will be set by the startup() function.

  var video = null;
  var canvas = null;
  var photo = null;
  var startbutton = null;
  var postbutton = null;
  var photoblob = null;
  var result = null;
  var status = null;
  var fetchresulttimeoutid = null;
  var fetchresulttimes = null;
  var ticketno = null;
  var rank = [
    '1st Similar Face',
    '2nd Similar Face',
    '3rd Similar Face',
    '4th Similar Face',
    '5th Similar Face',
    '6th Similar Face',
    '7th Similar Face',
    '8th Similar Face',
    '9th Similar Face',
    '10th Similar Face'
  ];

  function startup() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    photo = document.getElementById('photo');
    startbutton = document.getElementById('startbutton');
    postbutton = document.getElementById('postbutton');
    result = document.getElementById('result');
    status = document.getElementById('status');

    fetchstatus();
    
    navigator.getMedia = ( navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia);

    navigator.getMedia(
      {
        video: true,
        audio: false
      },
      function(stream) {
        if (navigator.mozGetUserMedia) {
          video.mozSrcObject = stream;
        } else {
          var vendorURL = window.URL || window.webkitURL;
          video.src = vendorURL.createObjectURL(stream);
        }
        video.play();
      },
      function(err) {
        console.log("An error occured! " + err);
      }
    );

    video.addEventListener('canplay', function(ev){
      if (!streaming) {
        height = video.videoHeight / (video.videoWidth/width);
      
        // Firefox currently has a bug where the height can't be read from
        // the video, so we will make assumptions if this happens.
      
        if (isNaN(height)) {
          height = width / (4/3);
        }
      
        video.setAttribute('width', width);
        video.setAttribute('height', height);
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        streaming = true;
      }
    }, false);

    startbutton.addEventListener('click', function(ev){
      takepicture();
      ev.preventDefault();
    }, false);
    postbutton.addEventListener('click', function(ev){
      postpicture();
      ev.preventDefault();
    }, false);
    
    clearphoto();    
  }

  // Fill the photo with an indication that none has been
  // captured.

  function clearphoto() {
    var context = canvas.getContext('2d');
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);

    var data = canvas.toDataURL('image/jpeg');
    photo.setAttribute('src', data);
    photoblob = dataURLtoBlob(data);
  }
  
  // Capture a photo by fetching the current contents of the video
  // and drawing it into a canvas, then converting that to a PNG
  // format data URL. By drawing it on an offscreen canvas and then
  // drawing that to the screen, we can change its size and/or apply
  // other changes before drawing it.

  function takepicture() {
    var context = canvas.getContext('2d');
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);
    
      var data = canvas.toDataURL('image/jpeg');
      photo.setAttribute('src', data);
      photoblob = dataURLtoBlob(data);
      postbutton.disabled = false;
    } else {
      clearphoto();
    }
  }
  
  function postpicture() {
    var xhr;
    postbutton.disabled = true;
    if (fetchresulttimeoutid) {
      // Already fetching results for a previously posted photo
      clearTimeout(fetchresulttimeoutid);
      fetchresulttimeoutid = null;
    }
    xhr = new XMLHttpRequest();
    xhr.open('POST', 'service/recognize', true);
    xhr.send(photoblob);
    xhr.onreadystatechange = function() {
      var response;
      if (xhr.readyState != 4) {
        return;
      }
      if (fetchresulttimeoutid) {
        // Already fetching results for a previously posted photo
        clearTimeout(fetchresulttimeoutid);
        fetchresulttimeoutid = null;
      }
      if (xhr.status != 201) {
        result.textContent = 'Error posting photo: ' + xhr.status;
        return;
      }
      response = JSON.parse(xhr.responseText);
      ticketno = response.ticket;
      fetchresulttimes = 0;
      fetchresult(xhr.getResponseHeader('Location'), ticketno);
    };
    result.textContent = 'Posting photo...';
  }
  
  function fetchresult(url, ticket, dofetch) {
    var xhr;
    if (!dofetch) {
      // Don't actually fetch the first time - perform a short delay instead
      fetchresulttimeoutid = setTimeout(function() {
        fetchresulttimeoutid = null;
        fetchresult(url, ticket, true);
      }, 500);
      return;
    }
    xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.send();
    xhr.onreadystatechange = function() {
      var response, i, row, item, image, body, heading, text, score;
      if (xhr.readyState != 4) {
        return;
      }
      if (ticketno != ticket) {
        // This is an old job, ignore it
        return;
      }
      if (xhr.status != 200) {
        result.textContent = 'Error fetching results: ' + xhr.status;
        return;
      }
      response = JSON.parse(xhr.responseText);
      if (!Array.isArray(response)) {
        if (response.status == 'queued') {
          result.textContent = 'Queued (#' + (ticket - response.processed - 1) + ' in queue), please wait...';
        } else if (response.status == 'waiting') {
          result.textContent = 'Performing face recognition...';
          fetchresulttimes++;
          if (fetchresulttimes > 10) {
            result.textContent = 'Time out. Sorry, please try again.';
            postbutton.disabled = false;
            return;
          }
        } else if (response.status == 'detectionFail') {
          result.textContent = 'Feature detection failed. Please try taking a new photo.';
          return;
        }
        // Try again in a while
        fetchresulttimeoutid = setTimeout(function() {
          fetchresulttimeoutid = null;
          fetchresult(url, ticket, true);
        }, fetchresulttimes > 0 ? 250 : 1000);
        return;
      }
      result.innerHTML = '<h2>Results:</h2><div class="row"></div><div class="row"</div>';
      row = result.firstChild.nextSibling;
      for (i = 0; i < response.length; i++) {
        if (i == 5) {
          row = row.nextSibling;
        }
        item = document.createElement('div');
        item.className = 'col-md-2';
        body = document.createElement('div');
        body.className = 'thumbnail text-center';
        heading = document.createElement('h4');
        heading.textContent = rank[i]; //'Rank ' + (i + 1) + ' Face';
        body.appendChild(heading);
        text = document.createElement('p');
        text.textContent = 'W/ Dist. ';
        score = document.createElement('strong');
        score.textContent = ('' + response[i].score).substring(0, 4);
        text.appendChild(score);
        body.appendChild(text);
        image = document.createElement('img');
        image.className = 'thumbnail';
        image.src = response[i].name;
        body.appendChild(image);
        item.appendChild(body);
        row.appendChild(item);
      }
    };
  }
  
  function fetchstatus() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'service/recognize', true);
    xhr.send();
    xhr.onreadystatechange = function() {
      var response;
      if (xhr.readyState != 4) {
        return;
      }
      if (xhr.status != 200) {
        status.textContent = 'Error fetching status: ' + xhr.status;
        return;
      }
      response = JSON.parse(xhr.responseText);
      status.textContent = 'Status at ' + response.time + ': ' + response.processed
        + ' job(s) done since ' + response.since + ' and '
        + (response.tickets - response.processed) + ' job(s) in progress.';
    }
  }
  
  // source: http://stackoverflow.com/a/30407840
  // because currently canvas.toBlob doesn't have widespread support:
  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
  function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
  }

  // Set up our event listener to run the startup process
  // once loading is complete.
  window.addEventListener('load', startup, false);
})();