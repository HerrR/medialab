<?php
	function callInstagram($url)
	{
		$ch = curl_init();
		curl_setopt_array($ch, array(
		CURLOPT_URL => $url,
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_SSL_VERIFYPEER => false,
		CURLOPT_SSL_VERIFYHOST => 2
	));

	$result = curl_exec($ch);
	curl_close($ch);
	return $result;
	}

	$tag = 'selfie';
	$client_id = "37a0603c73db47428a5efc4b3d8eea7b";

	$url = 'https://api.instagram.com/v1/tags/'.$tag.'/media/recent?client_id='.$client_id;

	$inst_stream = callInstagram($url);
	$results = json_decode($inst_stream, true);
	var_dump($results);
	
	// echo $results;
	// foreach ($results as $key => $value) {
	// 	echo 
	// 	echo $key;
	// 	echo $value;
	// 	# code...
	// }
	//Now parse through the $results array to display your results... 
	// foreach($results['data'] as $item){
	//     $image_link = $item['images']['low_resolution']['url'];
	//     echo '<img src="'.$image_link.'" />';
	// }
	// // Instagram
	// $client_id = "37a0603c73db47428a5efc4b3d8eea7b";
	// $access_token = "264909055.37a0603.65d1402ab1af40ad877a3b9e1fcdd111";
	// $code = "5db5db7bd370497abf59bf2500f31532";

	// function callInstagram($url){
	// 	$ch = curl_init();
	// 	curl_setopt_array($ch, array(
	// 		CURLOPT_URL => $url,
	// 		CURLOPT_RETURNTRANSFER => true,
	// 		CURLOPT_SSL_VERIFYPEER => false,
	// 		CURLOPT_SSL_VERIFYHOST => 2
	// 	));

	// 	$result = curl_exec($ch);
	// 	curl_close($ch);
	// 	return $result;
	// }

	// // $tag = 'selfie';
	// // $url = 'https://api.instagram.com/v1/tags/'.$tag.'/media/recent?client_id='.$client_id;
	// $url = 'https://api.instagram.com/v1/users/self/media/recent?access_token='.$access_token;

	// $inst_stream = callInstagram($url);
	// echo $inst_stream;

	// // echo "Hello World!";
?>