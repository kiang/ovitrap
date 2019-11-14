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
$timeEnd = strtotime('2018-12-30');
$n = 100;
$weekList = array();

while(--$n > 0) {
    $targetFile = dirname(__DIR__) . '/raw/' . date('YW', $timeEnd) . '.json';
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
file_put_contents(dirname(__DIR__) . '/raw/oldWeekList.json', json_encode($weekList));