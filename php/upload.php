<?php

if ( !empty( $_FILES ) ) {

    $tempPath = $_FILES[ 'file' ][ 'tmp_name' ];
    $uploadPath = dirname( __FILE__ ) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . $_FILES[ 'file' ][ 'name' ];

    move_uploaded_file( $tempPath, $uploadPath );

    $answer = array( 'answer' => 'File transfer completed', 'file' => $_FILES['file'] );
    $answer['fileLocation'] = $_FILES['file']['name'];
    $json = json_encode( $answer );

    include "FaceDetector.php";

	$detector = new svay\FaceDetector('detection.dat');
	$detector->faceDetect($uploadPath);

	$detectionInfo = $detector->getFaces();
	$detectionInfo["fileStatus"] = $answer;

	echo json_encode($detector->toJson());

} else {

    echo 'No files';

}

?>