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
}