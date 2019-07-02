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

$timeEnd = strtotime('last wednesday');
$n = 50;

while(--$n > 0) {
  $timeBegin = strtotime('last wednesday', $timeEnd);
  $targetFile = __DIR__ . '/raw/' . date('YW', $timeEnd) . '.json';
  if(!file_exists($targetFile)) {
    $strBegin = urlencode(date('Y/m/d', $timeBegin));
    $strEnd = urlencode(date('Y/m/d', $timeEnd));

    $json = file_get_contents('http://ovitrap-api.azurewebsites.net/DistributionRecord?StartTime=' . $strBegin . '&EndTime=' . $strEnd . '&City=%E5%8F%B0%E5%8D%97%E5%B8%82&District=0&Village=0', false, $context);
    file_put_contents($targetFile, $json);
  }

  $timeEnd = $timeBegin;
}
