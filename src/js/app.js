var map;
var sidebarHidden = false;
var input;
var autocomplete;
var zomatoAPI = 'https://developers.zomato.com/api/v2.1';
var chartAPI =
  'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|';
var markers = [];
var infowindow;
var selectedRes;
var sidebarHide;

function initMap() {
  sidebarHide = document.getElementById('sidebar-hide');
  var btm = {
    lat: 12.9135919,
    lng: 77.6122421
  };
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 17,
    center: btm
  });
  map.addListener('click',
    function () {
      if (infowindow) infowindow.close();
      selectedRes = null;
      if (sidebarHidden) {
        sidebarHide.style.backgroundColor = 'gray';
      }
    }
  );
  setInitialPostionOfSidebar(false);

  input = document.getElementById('location-input');
  autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo('bounds', map);
  autocomplete.addListener('place_changed', placeChanged);
}

function toggleSidebar() {
  if (sidebarHidden && !selectedRes) {
    return;
  }
  sidebarHidden = !sidebarHidden;
  var sidebar = document.getElementById('sidebar');
  var from = sidebarHidden ? 0 : -400;
  var to = sidebarHidden ? -400 : 0;
  TinyAnimate.animateCSS(sidebar, 'left', 'px', from, to, 500, 'easeInOutQuart',
    function () {
      sidebarHide.innerHTML = sidebarHidden ? '&gt;' : '&lt;';
      if (sidebarHidden && !selectedRes) {
        sidebarHide.style.backgroundColor = 'gray';
      }
    }
  );
}

function setInitialPostionOfSidebar(show) {
  sidebarHidden = !show;
  var sidebar = document.getElementById('sidebar');
  sidebarHide.innerHTML = sidebarHidden ? '&gt;' : '&lt;';
  sidebar.style.left = sidebarHidden ? '-400px' : '0';
}

function placeChanged() {
  var place = autocomplete.getPlace();
  if (!place.geometry) {
    return;
  }


  map.setCenter(place.geometry.location);
  map.setZoom(17); // Why 17? Because it looks good.

  getRestaurants(place);
}

function getRestaurants(place) {
  if (!place.geometry) return;

  var lat = place.geometry.location.lat();
  var lon = place.geometry.location.lng();
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState === XMLHttpRequest.DONE
      && xmlhttp.status === 200) {
      var data;
      try {
        data = JSON.parse(xmlhttp.responseText);
      } catch (err) {
        console.error(err);
        return;
      }
      removeMarkers();
      showRestaurantMarkers(data.restaurants);
    }
  };

  xmlhttp.open('GET', zomatoAPI + '/search?lat=' + lat + '&lon=' + lon, true);
  xmlhttp.send();
}

function showRestaurantMarkers(restaurants) {
  restaurants.forEach(
    function (obj) {
      var res = obj.restaurant;
      var lat = parseFloat(res.location.latitude);
      var lng = parseFloat(res.location.longitude);
      var position = {lat: lat, lng: lng};
      var pinColor = res.user_rating.rating_color;
      var pinImage = new google.maps.MarkerImage(chartAPI + pinColor,
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34));
      var marker = new google.maps.Marker({
        icon: pinImage,
        map: map,
        position: position
      });
      marker.addListener('mouseover', openInfoWindow.bind(null, res, marker));
      marker.addListener('click', openSidebar.bind(null, res));
      markers.push(marker);
    }
  );
}

function openInfoWindow(res, marker) {
  if (infowindow) infowindow.close();
  var ratingSpan = '';
  if (res.user_rating.aggregate_rating !== '0') {
    ratingSpan = '<span class="info-rating" style="background-color: #' +
    res.user_rating.rating_color + '">' + res.user_rating.aggregate_rating +
    '</span>';
  }
  infowindow = new google.maps.InfoWindow({
    content: ratingSpan +
      '<span class="info-heading">' + res.name + '</span><br/>' +
      'Cusisines: ' + res.cuisines + '<br/>' +
      'Average Cost For Two: ' +
        '<b>' + res.currency + ' ' + res.average_cost_for_two + '</b>'
  });
  infowindow.open(map, marker);
}

function openSidebar(res) {
  selectedRes = res;
  sidebarHide.style.backgroundColor = 'darkCyan';
  var img = document.getElementById('sel-res-img');
  var title = document.getElementById('title');
  var price = document.getElementById('price');
  if (sidebarHidden) {
    toggleSidebar();
  }
  img.src = res.thumb || 'img/no-image-found.png';
  title.innerHTML = res.name;
  price.innerHTML = res.average_cost_for_two;
}

function removeMarkers() {
  markers.forEach(
    function (m) {
      m.setMap(null);
    }
  );
  markers = [];
}

function imgError(img) {
  img.src = 'img/no-image-found.png';
}

XMLHttpRequest.prototype.realSend = XMLHttpRequest.prototype.send;
var newSend = function (vData) {
  this.setRequestHeader('user-key', 'b8977c4c52df5e872ef2189844a8f0c2');
  this.realSend(vData);
};
XMLHttpRequest.prototype.send = newSend;
