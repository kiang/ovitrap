//ref https://firsemisphere.blogspot.com/2019/02/javascript-gis-proj4js.html
proj4.defs([
  [
    'EPSG:4326',
    '+title=WGS84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'
  ], [
    'EPSG:3826',
    '+title=TWD97 TM2 +proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +units=m +no_defs'
  ]
]);

//EPSG
var EPSG3826 = new proj4.Proj('EPSG:3826'); //TWD97 TM2(121分帶)
var EPSG4326 = new proj4.Proj('EPSG:4326'); //WGS84

var sidebar = new ol.control.Sidebar({ element: 'sidebar', position: 'right' });
var jsonFiles, filesLength, fileKey = 0;

var projection = ol.proj.get('EPSG:3857');
var projectionExtent = projection.getExtent();
var size = ol.extent.getWidth(projectionExtent) / 256;
var resolutions = new Array(20);
var matrixIds = new Array(20);
for (var z = 0; z < 20; ++z) {
    // generate resolutions and matrixIds arrays for this WMTS
    resolutions[z] = size / Math.pow(2, z);
    matrixIds[z] = z;
}

var map, count, vectorPoints, cunli, selectedArea = 'all';;
$.getJSON('raw/count.json', {}, function(c) {
  count = c;
  vectorPoints = new ol.layer.Vector({
    source: new ol.source.Vector({
      url: 'raw/case.json',
      format: new ol.format.GeoJSON()
    }),
    style: pointStyleFunction
  });

  cunli = new ol.layer.Vector({
    source: new ol.source.Vector({
      url: 'js/cunli.json',
      format: new ol.format.GeoJSON()
    }),
    style: getCunliStyle
  });
  map = new ol.Map({
    layers: [baseLayer, vectorPoints, cunli],
    target: 'map',
    view: appView
  });
  map.addControl(sidebar);
  map.on('singleclick', function(evt) {
    content.innerHTML = '';
    pointClicked = false;

    map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
      if(false === pointClicked) {
        var message = '<table class="table table-dark">';
        message += '<tbody>';
        var p = feature.getProperties();
        if(p.VILLCODE) {
          message += '<h1>' + p.TOWNNAME + p.VILLNAME + '</h1>';
          if(count[p.VILLCODE]) {
            var keys = Object.keys(count[p.VILLCODE]);
            keys.sort(function(a,b) {
              return b-a;
            });
            message += '<table class="table table-dark"><thead>';
            message += '<tr><th>週次</th><th>調查單位</th><th>誘卵桶卵數</th><th>陽性率</th></tr>';
            message += '</thead><tbody>';
            for(k in keys) {
              for(unit in count[p.VILLCODE][keys[k]]) {
                message += '<tr><th scope="row">' + keys[k] + '</th>';
                message += '<td>' + unit + '</td>';
                message += '<td>' + count[p.VILLCODE][keys[k]][unit].countEggs + '</td>';
                message += '<td>' + Math.round((count[p.VILLCODE][keys[k]][unit].countPlus / count[p.VILLCODE][keys[k]][unit].countTotal * 100)) + '%</td></tr>';
              }
            }
            message += '</tbody></table>';
          }
          $('#sidebarCunli').html(message);
          return false;
        } else if(p.key) {
          sidebarTitle.innerHTML = jsonPoints[p.key].Address;
          for(k in jsonPoints[p.key]) {
            message += '<tr><th scope="row">' + k + '</th><td>' + jsonPoints[p.key][k] + '</td></tr>';
          }
        } else if(p.sickdate) {
          sidebarTitle.innerHTML = p.sickdate;
          message += '<tr><th scope="row">發病日期</th><td>' + p.sickdate + '</td></tr>';
        }
        message += '</tbody></table>';
        content.innerHTML = message;
        pointClicked = true;
      }
    });
    sidebar.open('home');
  });
  $('#formSelectArea').change(function () {
      selectedArea = $(this).val();
      var extentOfAllFeatures = ol.extent.createEmpty();
      cunli.getSource().forEachFeature(function (f) {
          if (selectedArea === 'all') {
              f.setStyle(getCunliStyle);
              ol.extent.extend(extentOfAllFeatures, f.getGeometry().getExtent());
          } else if (f.get('TOWNNAME') !== selectedArea) {
              f.setStyle(styleHide);
          } else {
              f.setStyle(getCunliStyle);
              ol.extent.extend(extentOfAllFeatures, f.getGeometry().getExtent());
          }
      });
      map.getView().fit(extentOfAllFeatures);
  });
})

var styleHide = new ol.style.Style();

var styleBlank = new ol.style.Style({
  stroke: new ol.style.Stroke({
      color: 'rgba(37,67,140,0.5)',
      width: 1
  }),
  fill: new ol.style.Fill({
    color: 'rgba(255,255,255,0.1)'
  }),
  text: new ol.style.Text({
    font: 'bold 16px "Open Sans", "Arial Unicode MS", "sans-serif"',
    fill: new ol.style.Fill({
      color: 'blue'
    })
  })
});

var styleHigh = new ol.style.Style({
  stroke: new ol.style.Stroke({
      color: 'rgba(37,67,140,0.5)',
      width: 1
  }),
  fill: new ol.style.Fill({
    color: 'rgba(139,0,255,0.7)'
  }),
  text: new ol.style.Text({
    font: 'bold 16px "Open Sans", "Arial Unicode MS", "sans-serif"',
    fill: new ol.style.Fill({
      color: 'blue'
    })
  })
});

var styleNotice = new ol.style.Style({
  stroke: new ol.style.Stroke({
      color: 'rgba(139,0,255,0.3)',
      width: 1
  }),
  fill: new ol.style.Fill({
    color: 'rgba(184,161,207,0.4)'
  }),
  text: new ol.style.Text({
    font: 'bold 16px "Open Sans", "Arial Unicode MS", "sans-serif"',
    fill: new ol.style.Fill({
      color: 'blue'
    })
  })
});

var styleYellow = new ol.style.Style({
  stroke: new ol.style.Stroke({
      color: 'rgba(139,0,255,0.3)',
      width: 1
  }),
  fill: new ol.style.Fill({
    color: 'rgba(255,255,0,0.1)'
  }),
  text: new ol.style.Text({
    font: 'bold 16px "Open Sans", "Arial Unicode MS", "sans-serif"',
    fill: new ol.style.Fill({
      color: 'blue'
    })
  })
});

var unitKey = '台南市衛生局';
var areaList = {};
var getCunliStyle = function(f) {
  var p = f.getProperties();
  var code = p.VILLCODE;
  var town = p.TOWNNAME;
  var villtext = town + p.VILLNAME;
  var theStyle = styleBlank.clone();
  if (!areaList[town]) {
    areaList[town] = town;
    $('#formSelectArea').append('<option>' + town + '</option>');
  }
  if(count[code] && count[code][jsonFiles[fileKey].ym] && count[code][jsonFiles[fileKey].ym][unitKey]) {
    var plusRate = count[code][jsonFiles[fileKey].ym][unitKey].countPlus / count[code][jsonFiles[fileKey].ym][unitKey].countTotal;
    if(plusRate > 0.6 || count[code][jsonFiles[fileKey].ym][unitKey].countEggs > 500) {
      theStyle = styleHigh.clone();
    } else if(plusRate > 0.3 || count[code][jsonFiles[fileKey].ym][unitKey].countEggs > 250) {
      theStyle = styleNotice.clone();
    } else if(plusRate > 0 || count[code][jsonFiles[fileKey].ym][unitKey].countEggs > 0) {
      theStyle = styleYellow.clone();
    }
  }
  theStyle.getText().setText(villtext);
  return theStyle;
}

$('a.btnUnit').click(function() {
  unitKey = $(this).attr('data-unit');
  cunli.changed();
  return false;
});

var appView = new ol.View({
  center: ol.proj.fromLonLat([120.221507, 23.000694]),
  zoom: 14
});

var baseLayer = new ol.layer.Tile({
    source: new ol.source.WMTS({
        matrixSet: 'EPSG:3857',
        format: 'image/png',
        url: 'https://wmts.nlsc.gov.tw/wmts',
        layer: 'EMAP',
        tileGrid: new ol.tilegrid.WMTS({
            origin: ol.extent.getTopLeft(projectionExtent),
            resolutions: resolutions,
            matrixIds: matrixIds
        }),
        style: 'default',
        wrapX: true,
        attributions: '<a href="http://maps.nlsc.gov.tw/" target="_blank">國土測繪圖資服務雲</a>'
    }),
    opacity: 0.3
});

function pointStyleFunction(f, r) {
  var p = f.getProperties();
  return new ol.style.Style({
    image: new ol.style.RegularShape({
      radius: 20,
      points: 3,
      fill: new ol.style.Fill({
        color: p.color
      }),
      stroke: new ol.style.Stroke({
        color: '#fff',
        width: 2
      })
    })
  })
}

var layerYellow = new ol.style.Style({
  stroke: new ol.style.Stroke({
      color: 'rgba(0,0,0,1)',
      width: 1
  }),
  fill: new ol.style.Fill({
      color: 'rgba(255,255,0,0.1)'
  }),
  text: new ol.style.Text({
    font: 'bold 16px "Open Sans", "Arial Unicode MS", "sans-serif"',
    fill: new ol.style.Fill({
      color: 'blue'
    })
  })
});

var geolocation = new ol.Geolocation({
  projection: appView.getProjection()
});

geolocation.setTracking(true);

geolocation.on('error', function(error) {
  console.log(error.message);
});

var positionFeature = new ol.Feature();

positionFeature.setStyle(new ol.style.Style({
  image: new ol.style.Circle({
    radius: 6,
    fill: new ol.style.Fill({
      color: '#3399CC'
    }),
    stroke: new ol.style.Stroke({
      color: '#fff',
      width: 2
    })
  })
}));

geolocation.on('change:position', function() {
  var coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
});

new ol.layer.Vector({
  map: map,
  source: new ol.source.Vector({
    features: [positionFeature]
  })
});

$('#btn-geolocation').click(function () {
  appView.setCenter(geolocation.getPosition());
  return false;
});

var pointColors = ['#ffffff', '#fad3d0', '#faa19e', '#fa605d', '#fa1714', '#cc1714', '#991799'];
var pointStyles = [];
for(k in pointColors) {
  pointStyles.push(new ol.style.Style({
    image: new ol.style.Circle({
      radius: 5,
      fill: new ol.style.Fill({
        color: pointColors[k]
      }),
      stroke: new ol.style.Stroke({
        color: '#fff',
        width: 1
      })
    })
  }));
}

function appendLeadingZeroes(n){
  if(n <= 9){
    return "0" + n;
  }
  return n
}

var jsonPoints, pointLayer, dateBegin, dateEnd;
function showPoints(jsonFile) {
  dateBegin = new Date(jsonFiles[fileKey].begin * 1000);
  dateEnd = new Date(jsonFiles[fileKey].end * 1000);
  var weekContent = '<table class="table table-dark"><tbody>';
  weekContent += '<tr><th scope="row">週數</th><td>' + jsonFiles[fileKey].ym + '</td></tr>';
  weekContent += '<tr><th scope="row">開始</th><td>' + dateBegin.getFullYear() + '-' + appendLeadingZeroes(dateBegin.getMonth() + 1) + '-' + appendLeadingZeroes(dateBegin.getDate()) + '</td></tr>';
  weekContent += '<tr><th scope="row">結束</th><td>' + dateEnd.getFullYear() + '-' + appendLeadingZeroes(dateEnd.getMonth() + 1) + '-' + appendLeadingZeroes(dateEnd.getDate()) + '</td></tr>';
  weekContent += '</tbody></table>';
  $('#weekContent').html(weekContent);
  $('#weekTitle').html(jsonFile);
  $.getJSON('raw/' + jsonFile + '.json', {}, function(points) {
    var pointFeatures = [];
    jsonPoints = points;
    for(k in jsonPoints) {
      var p = proj4(EPSG3826, EPSG4326, [parseFloat(points[k].X), parseFloat(points[k].Y)]);
      var pointFeature = new ol.Feature({
        key: k,
        geometry: new ol.geom.Point(ol.proj.fromLonLat(p))
      });
      if(jsonPoints[k].AvgEggs > 100) {
        pointFeature.setStyle(pointStyles[6]);
      } else if (jsonPoints[k].AvgEggs > 80) {
        pointFeature.setStyle(pointStyles[5]);
      } else if (jsonPoints[k].AvgEggs > 60) {
        pointFeature.setStyle(pointStyles[4]);
      } else if (jsonPoints[k].AvgEggs > 40) {
        pointFeature.setStyle(pointStyles[3]);
      } else if (jsonPoints[k].AvgEggs > 20) {
        pointFeature.setStyle(pointStyles[2]);
      } else if (jsonPoints[k].AvgEggs > 0) {
        pointFeature.setStyle(pointStyles[1]);
      } else {
        pointFeature.setStyle(pointStyles[0]);
      }
      pointFeatures.push(pointFeature);
    }
    pointLayer = new ol.layer.Vector({
      map: map,
      source: new ol.source.Vector({
        features: pointFeatures
      })
    });
  })
}


$.getJSON('raw/weekList.json', {}, function(weeks) {
  jsonFiles = weeks;
  filesLength = jsonFiles.length;
  showPoints(jsonFiles[fileKey].ym);
});

$('#btnPrevious').click(function() {
  fileKey += 1;
  if(fileKey >= filesLength) {
    fileKey = filesLength - 1;
  }
  showPoints(jsonFiles[fileKey].ym);
  updateVector();
  cunli.changed();
  return false;
});

$('#btnNext').click(function() {
  fileKey -= 1;
  if(fileKey < 0) {
    fileKey = 0;
  }
  showPoints(jsonFiles[fileKey].ym);
  updateVector();
  cunli.changed();
  return false;
});

var vectorPointsPool = [];
function updateVector() {
  var theSource = vectorPoints.getSource();
  for(k in vectorPointsPool) {
    theSource.addFeature(vectorPointsPool[k]);
  }
  vectorPointsPool = [];
  theSource.forEachFeature(function(f) {
    var fp = f.getProperties();
    var dParts = fp.sickdate.split('/');
    var fDate = new Date(dParts[0], dParts[1] - 1, dParts[2]);
    if(fDate > dateEnd) {
      vectorPointsPool.push(f.clone());
      theSource.removeFeature(f);
    }
  });
}

var sidebarTitle = document.getElementById('sidebarTitle');
var content = document.getElementById('sidebarContent');
var pointClicked;