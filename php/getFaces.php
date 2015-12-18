<?php
include "FaceDetector.php";

$detector = new svay\FaceDetector('detection.dat');
$detector->faceDetect('img/6.jpg');
$detectionInfo = $detector->getFaces();

echo json_encode($detector->toJson());
?>