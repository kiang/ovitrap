<?php
// Create a stream
$opts = [
    "http" => [
        "method" => "GET",
        "header" => "Accept-language: en\r\n"
                    . "Origin: http://tainan-ovitrap.nmbdcrc.tw\r\n"
                    . "Referer: http://tainan-ovitrap.nmbdcrc.tw/\r\n"
    ]
];

$context = stream_context_create($opts);

$timeEnd = strtotime('next monday') - 1;
$targetFile = dirname(__DIR__) . '/raw/' . date('YW', $timeEnd) . '.json';
if(file_exists($targetFile)) {
  unlink($targetFile);
}
$n = 30;
$weekList = array();

while(--$n > 0) {
  $timeBegin = strtotime('last monday', $timeEnd);

  if(!file_exists($targetFile)) {
    $strBegin = urlencode(date('Y/m/d', $timeBegin));
    $strEnd = urlencode(date('Y/m/d', $timeEnd));

    $data1 = json_decode(file_get_contents('http://ovitrap-api.azurewebsites.net/DistributionRecord?StartTime=' . $strBegin . '&EndTime=' . $strEnd . '&City=' . urlencode('台南市') . '&District=0&Village=0', false, $context), true);
    $data2 = json_decode(file_get_contents('http://ovitrap-api.azurewebsites.net/DistributionRecord?StartTime=' . $strBegin . '&EndTime=' . $strEnd . '&City=' . urlencode('高雄市') . '&District=0&Village=0', false, $context), true);
    file_put_contents($targetFile, json_encode(array_merge($data1, $data2)));
  }
  $weekList[] = array(
    'ym' => date('YW', $timeEnd),
    'begin' => $timeBegin,
    'end' => $timeEnd,
  );

  $timeEnd = $timeBegin - 1;
}

file_put_contents(dirname(__DIR__) . '/raw/weekList.json', json_encode($weekList));

$postData = array(
    'citycode' => 'all',
    'immigration' => '0',
    'startDate' => date('Y/m/01', strtotime('last year')),
    'endDate' => date('Y/m/d'),
);

// Setup cURL
$ch = curl_init('https://cdcdengue.azurewebsites.net/DengueData.asmx/GetDengueLocation');
curl_setopt_array($ch, array(
    CURLOPT_POST => TRUE,
    CURLOPT_RETURNTRANSFER => TRUE,
    CURLOPT_HTTPHEADER => array(
        'Content-Type: application/json; charset=utf-8',
    ),
    CURLOPT_POSTFIELDS => json_encode($postData)
));

// Send the request
$response = curl_exec($ch);

if(!empty($response)) {
  $now = time();
  $fc = array(
    'type' => 'FeatureCollection',
    'features' => array(),
  );
  $responseData = json_decode($response, true);
  $cases = json_decode($responseData['d'], true);
  foreach($cases AS $case) {
    $sickdate = strtotime($case['sickdate']);
    $diff = $now - $sickdate;
    $color = '#a9a9a9';
    if($diff < 604800) {
      $color = '#ff0000';
    } else if($diff < 1296000) {
      $color = '#ff8c00';
    } else if($diff < 2592000) {
      $color = '#ffd700';
    }
    $f = array(
      'type' => 'Feature',
      'properties' => array(
        'sickdate' => $case['sickdate'],
        'color' => $color,
      ),
      'geometry' => array(
        'type' => 'Point',
        'coordinates' => array(floatval($case['lng']), floatval($case['lat'])),
      ),
    );
    $fc['features'][] = $f;
  }
}

file_put_contents(dirname(__DIR__) . '/raw/case.json', json_encode($fc));
