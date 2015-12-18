<?php
	$images =  $_POST["images"];
	$genders = ["Male", "Female"];
	
	$return = array();
	for ($i=0; $i < sizeof($images); $i++) { 
		$image["image"] = $images[$i];
		$image["featureVector"] = "Random feature vector";
		$image["gender"] = $genders[rand(0,1)];
		array_push($return, $image);
	}

	echo json_encode($return);
?>