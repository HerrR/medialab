var scrollTo = function(scrollID){
	$('html, body').animate({
        scrollTop: $(scrollID).offset().top
    }, 2000);
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
		images.push(img);
	}
	
	model.faces = images;
	
	for(image in images){
		outputWindow.innerHTML += '<img src="'+images[image]+'"/>';
	}

	if(model.faces.length>0){$("#step2").show();}
	scrollTo("#step2");
}

var callApi = function(){
	$.ajax({
		type: "POST",
		url: "php/backend.php",
		data: {images : model.faces},
		dataType: "json",
		success: function(result){
			$("#step3").show();
			scrollTo("#step3");
			for(var r in result){
				console.log(result[r]);
			}
		},
		error: function(error){
			console.log("Error: "+error);
		}
	});
}