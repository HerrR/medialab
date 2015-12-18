app.controller('AppController', ['$scope', 'FileUploader', 'Model', function($scope, FileUploader, Model) {
        $scope.faces = function(){
            return Model.getResult();
        }

        $scope.isLoading = function(){
            return Model.isLoading();
        }

        $scope.updateTimeStamp = function(){
            $scope.timestamp = new Date().getTime();
        }

        $scope.hasOutput = function(){
            return Model.hasOutput();
        }

        $scope.updateTimeStamp();

        var uploader = $scope.uploader = new FileUploader({
            url: 'php/upload.php',
            removeAfterUpload: true
        });

        uploader.filters.push({
            name: 'customFilter',
            fn: function(item /*{File|FileLikeObject}*/, options) {
                return this.queue.length < 10;
            }
        });

        // CALLBACKS
        uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
            console.info('onWhenAddingFileFailed', item, filter, options);
        };
        uploader.onAfterAddingFile = function(fileItem) {
            console.info('onAfterAddingFile', fileItem);
        };
        uploader.onAfterAddingAll = function(addedFileItems) {
            console.info('onAfterAddingAll', addedFileItems);
        };
        uploader.onBeforeUploadItem = function(item) {
            Model.setLoading(true);
            console.info('onBeforeUploadItem', item);
        };
        uploader.onProgressItem = function(fileItem, progress) {
            console.info('onProgressItem', fileItem, progress);
        };
        uploader.onProgressAll = function(progress) {
            console.info('onProgressAll', progress);
        };
        uploader.onSuccessItem = function(fileItem, response, status, headers) {
            console.info('onSuccessItem', fileItem, response, status, headers);
            console.log(response);
            $scope.updateTimeStamp();
            Model.updateResult(response);
            Model.setLoading(false);

        };
        uploader.onErrorItem = function(fileItem, response, status, headers) {
            Model.setLoading(false);
            console.info('onErrorItem', fileItem, response, status, headers);
        };
        uploader.onCancelItem = function(fileItem, response, status, headers) {
            console.info('onCancelItem', fileItem, response, status, headers);
            Model.setLoading(false);
        };
        uploader.onCompleteItem = function(fileItem, response, status, headers) {
            console.info('onCompleteItem', fileItem, response, status, headers);
        };
        uploader.onCompleteAll = function() {
            console.info('onCompleteAll');
        };

        var controller = $scope.controller = {
            isImage: function(item) {
                var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        };
    }]);