var app = angular.module('medialab', ['angularFileUpload']);

app.factory('Model', function () {
	var facialRecognitionResult;
	var loading = false;

	this.setLoading = function(bool){
		loading = bool;
	}

	this.isLoading = function(){
		return loading;
	}

	this.updateResult = function(data){
		facialRecognitionResult = data;
	}

	this.hasOutput = function(){
		return facialRecognitionResult != undefined;
	}

	this.getResult = function(){
		return facialRecognitionResult;
	}

	return this;
});