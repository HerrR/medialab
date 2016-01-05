var photo = null;
var startbutton = null;
var postbutton = null;
var photoblob = null;
var result = null;
var status = null;
var fetchresulttimeoutid = null;
var fetchresulttimes = null;
var ticketno = null;


var scrollTo = function(scrollID){
	$('html, body').animate({
        scrollTop: $(scrollID).offset().top
    }, 1000);
}

var saveFaces = function(){
	var outputWindow = document.getElementById("outputWindow");
	var video = document.getElementById("video");
	var images = [];
	var trackingPoints = model.trackingPoints;

	outputWindow.innerHTML = '';
	for(var i = 0; i<trackingPoints.length;i++){
		var tp = trackingPoints[i];
		outputWindow.innerHTML += "<canvas id='canvasFace"+i+"' style='display:none;'></canvas>";
		var canvas = document.getElementById("canvasFace"+i);
		canvas.width = tp.width;
		canvas.height = tp.height;
		var context = canvas.getContext('2d');
		context.drawImage(video, tp.x, tp.y, tp.width*1.6, tp.height*1.6, 0, 0, tp.width, tp.height);

		var img = canvas.toDataURL("image/jpeg");

      	photoblob = dataURLtoBlob(img);
      	model.photoBlobs.push(photoblob);
      	postpicture(photoblob);
      	// console.log(photoblob);
		images.push(img);
	}
	
	model.faces = images;
	
	for(image in images){
		outputWindow.innerHTML += '<img src="'+images[image]+'"/>';
	}

	if(model.faces.length>0){$("#step2").show();}
	scrollTo("#step2");
	stopTrack();
}

var toggleTrack = function(){
	if(trackerTask.running_){
		trackerTask.stop();
	} else {
		trackerTask.run();
	}
	updateTrackerStatus();
}

var stopTrack = function(){
	if(trackerTask.running_){
		trackerTask.stop();
	}
	updateTrackerStatus();
}

var startTrack = function(){
	if(!trackerTask.running_){
		trackerTask.run();
	}
	updateTrackerStatus();
}

var updateTrackerStatus = function(){
	var trackerStatusDiv = document.getElementById("trackingStatus");
	var status = "";
	if(trackerTask.running_){
		status = "running";
	} else {
		status = "paused";
	}
	trackerStatusDiv.innerHTML = "Tracker is currently <span style='font-weight:bold'>"+ status +"</span>."; 
}

var dataURLtoBlob = function (dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}


var postpicture = function(photoblob) {
    var xhr;
    if (fetchresulttimeoutid) {
      // Already fetching results for a previously posted photo
      clearTimeout(fetchresulttimeoutid);
      fetchresulttimeoutid = null;
    }

    xhr = new XMLHttpRequest();

    // URL service/recognize
    xhr.open('POST', 'service/recognize', true);
    // xhr.open('POST', 'php/backend.php', true);
    xhr.send(photoblob);
    xhr.onreadystatechange = function() {
      var response;
      console.log(xhr.response);
      // console.log( JSON.parse( xhr.responseText) );
      if (xhr.readyState != 4) {
        return;
      }
      if (fetchresulttimeoutid) {
        // Already fetching results for a previously posted photo
        clearTimeout(fetchresulttimeoutid);
        fetchresulttimeoutid = null;
      }
      if (xhr.status != 201) {
       	console.log('Error posting photo: ' + xhr.status);
        return;
      }
      response = JSON.parse(xhr.responseText);
      ticketno = response.ticket;
      fetchresulttimes = 0;
      fetchresult(xhr.getResponseHeader('Location'), ticketno);
    };
		console.log('Posting photo...');
  }
  

  
var fetchresult = function (url, ticket, dofetch) {
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
        // result.textContent = 'Error fetching results: ' + xhr.status;
        return;
      }
      response = JSON.parse(xhr.responseText);
      if (!Array.isArray(response)) {
        if (response.status == 'queued') {
          // result.textContent = 'Queued (#' + (ticket - response.processed - 1) + ' in queue), please wait...';
        } else if (response.status == 'waiting') {
          // result.textContent = 'Performing face recognition...';
          fetchresulttimes++;
          if (fetchresulttimes > 10) {
            // result.textContent = 'Time out. Sorry, please try again.';
            // postbutton.disabled = false;
            return;
          }
        } else if (response.status == 'detectionFail') {
          // result.textContent = 'Feature detection failed. Please try taking a new photo.';
          return;
        }
        // Try again in a while
        fetchresulttimeoutid = setTimeout(function() {
          fetchresulttimeoutid = null;
          fetchresult(url, ticket, true);
        }, fetchresulttimes > 0 ? 250 : 1000);
        return;
      }
      // result.innerHTML = '<h2>Results:</h2><div class="row"></div><div class="row"</div>';
      row = result.firstChild.nextSibling;
      for (i = 0; i < response.length; i++) {
        if (i == 5) {
          row = row.nextSibling;
        }
        // item = document.createElement('div');
        // item.className = 'col-md-2';
        // body = document.createElement('div');
        // body.className = 'thumbnail text-center';
        // heading = document.createElement('h4');
        // // heading.textContent = rank[i]; //'Rank ' + (i + 1) + ' Face';
        // body.appendChild(heading);
        // text = document.createElement('p');
        // // text.textContent = 'W/ Dist. ';
        // score = document.createElement('strong');
        // // score.textContent = ('' + response[i].score).substring(0, 4);
        // text.appendChild(score);
        // body.appendChild(text);
        // image = document.createElement('img');
        // image.className = 'thumbnail';
        // image.src = response[i].name;
        // body.appendChild(image);
        // item.appendChild(body);
        // row.appendChild(item);
      }
    };
  }
  
var fetchstatus = function(){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'service/recognize', true);
    xhr.send();
    xhr.onreadystatechange = function() {
      var response;
      if (xhr.readyState != 4) {
        return;
      }
      if (xhr.status != 200) {
        // status.textContent = 'Error fetching status: ' + xhr.status;
        return;
      }
      response = JSON.parse(xhr.responseText);
      // status.textContent = 'Status at ' + response.time + ': ' + response.processed
        + ' job(s) done since ' + response.since + ' and '
        + (response.tickets - response.processed) + ' job(s) in progress.';
    }
  }
  

  
var callApi = function(){
	var blob = model.photoBlobs[0];
	console.log(blob);
	$.ajax({
		type: "POST",
		url: "php/backend.php",
		// url: "service/recognize",
		// data: blob,
	    // processData: false,
    	// contentType: "multipart/form-data",
		data: {images : model.faces},
		// dataType: "json",
		success: function(result){
			$("#step3").show();
			scrollTo("#step3");
			console.log(result);
			// for(var r in result){
			// 	console.log(result[r]);
			// }
		},
		error: function(error){
			console.log("Error: "+error);
		}
	});
}

var showCommercial = function(){
	$("#step4").show();
	scrollTo("#step4");
}

var restart = function(){
	scrollTo("#step1");
	$("#step4").hide();
	$("#step3").hide();
	$("#step2").hide();
	model.trackingPoints = [];
	model.faces = [];
	startTrack();
}