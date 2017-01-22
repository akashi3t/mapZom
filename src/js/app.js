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
var loader;
var reviews;
var place = {
  lat: 0,
  lng: 0
};
var currentUserLocation;

function init() {
  sidebarHide = document.getElementById('sidebar-hide');
  loader = document.getElementById('loader');
  reviews = document.getElementById('reviews-placeholder');
  setCurrentLocation(function (Geoposition) {
    place.lat = Geoposition.coords.latitude;
    place.lng = Geoposition.coords.longitude;
    currentUserLocation = Object.assign({}, place);

    drawMap();
  }, function (err) {
    drawMap();
  });
}

function drawMap(next) {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: currentUserLocation ? 17 : 2,
    center: place
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

  if (place)
    getRestaurants(place);
}

function setCurrentLocation(successHandler, errHandler) {
  if (navigator.geolocation) {
    return navigator.geolocation.getCurrentPosition(
      successHandler, errHandler, {timeout: 5000}
    );
  }
  return next();
}

function toggleSidebar() {
  if (sidebarHidden && !selectedRes) {
    return;
  }
  sidebarHidden = !sidebarHidden;
  var sidebar = document.getElementById('sidebar');
  var from = sidebarHidden ? 0 : -400;
  var to = sidebarHidden ? -400 : 0;
  TinyAnimate.animateCSS(sidebar, 'left', 'px', from, to, 400, 'easeInOutQuart',
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
  var lat, lng;
  
  if (!place.geometry) {
    lat = place.lat;
    lng = place.lng;
  } else {
    lat = place.geometry.location.lat();
    lng = place.geometry.location.lng();
  }

  var url = zomatoAPI + '/search?lat=' + lat + '&lon=' + lng;
  get(url, function (err, data) {
    if (err) return;

    removeMarkers();
    showRestaurantMarkers(data.restaurants);
  });
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
      marker.addListener('click', function () {
        openSidebar(res);
        getReviews(res);
      });
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
      'cuisines: ' + res.cuisines + '<br/>' +
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
  var cuisines = document.getElementById('cuisines');
  var onlineDelivey = document.getElementById('online-delivey');
  var deliveryNow = document.getElementById('delivery-now');
  var imgRating = document.getElementById('img-rating');

  if (sidebarHidden) {
    toggleSidebar(); 
  }
  img.src = res.thumb || 'img/no-image-found.jpg';
  title.innerHTML = res.name;
  price.innerHTML = res.currency + ' ' + res.average_cost_for_two;
  cuisines.innerHTML = res.cuisines;
  onlineDelivey.innerHTML = res.has_online_delivery ? 'Yes' : 'No';
  deliveryNow.innerHTML = res.is_delivering_now ? 'Yes' : 'No';
  imgRating.innerHTML = res.user_rating.aggregate_rating;
  imgRating.style.backgroundColor = '#' + res.user_rating.rating_color;
}

function getReviews(res) {
  var url = zomatoAPI + '/reviews?res_id=' + res.R.res_id;
  reviews.innerHTML = '';
  loader.style.display = 'block';

  get(url, function (err, data) {
    loader.style.display = 'none';
    if (err) return;

    if (data.reviews_count === 0) {
      reviews.innerHTML = '<p>No Reviews Found!</p>';
    }
    data.user_reviews.forEach(function (obj) {
      var review = obj.review;
      var reviewDiv = document.createElement('div');
      var profilePic = document.createElement('img');
      var name = document.createElement('h4');
      var ratingPara = document.createElement('p');
      var rating = document.createElement('span');
      var comment = document.createElement('p');
      var hRule = document.createElement('hr');
      profilePic.src = review.user.profile_image;
      name.innerHTML = review.user.name;
      rating.className = 'info-rating';
      rating.style.backgroundColor = '#' + review.rating_color;
      rating.innerHTML = review.rating;
      ratingPara.innerHTML = 'Rated: ';
      ratingPara.appendChild(rating);
      comment.className = 'comment';
      comment.innerHTML = review.review_text;
      reviewDiv.className = 'review';
      reviewDiv.appendChild(profilePic);
      reviewDiv.appendChild(name);
      reviewDiv.appendChild(ratingPara);
      reviewDiv.appendChild(comment);
      reviewDiv.appendChild(hRule);
      reviews.appendChild(reviewDiv);
    });
  });
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
  img.src = 'img/no-image-found.jpg';
}

XMLHttpRequest.prototype.realSend = XMLHttpRequest.prototype.send;
var newSend = function (vData) {
  this.setRequestHeader('user-key', 'b8977c4c52df5e872ef2189844a8f0c2');
  this.realSend(vData);
};
XMLHttpRequest.prototype.send = newSend;

function get(url, next) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState === XMLHttpRequest.DONE
      && xmlhttp.status === 200) {
      var data;
      try {
        data = JSON.parse(xmlhttp.responseText);
      } catch (err) {
        console.error(err);
        return next(err);
      }
      return next(null, data);
    }
  };

  xmlhttp.open('GET', url, true);
  xmlhttp.send();
}