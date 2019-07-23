<?php
$fc = array(
  'type' => 'FeatureCollection',
  'features' => array(),
);
$source = json_decode(file_get_contents('/home/kiang/public_html/taiwan_basecode/cunli/geo/20190624.json'), true);
foreach($source['features'] AS $f) {
  if($f['properties']['COUNTYNAME'] === '高雄市' || $f['properties']['COUNTYNAME'] === '臺南市') {
    $fc['features'][] = $f;
  }
}
file_put_contents(dirname(__DIR__) . '/js/cunli.json', json_encode($fc));
