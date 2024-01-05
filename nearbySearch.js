function calculateDuration(place, map, directionsService, travelMode, type) {
  return new Promise(function (resolve, reject) {
    var request = {
      origin: map.getCenter(),
      destination: place.geometry.location,
      travelMode: travelMode,
    };

    directionsService.route(request, function (response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        var route = response.routes[0];
        var duration = route.legs[0].duration.text;
        var mode =
          travelMode === google.maps.TravelMode.DRIVING ? "car" : "walking";
        var placeName = place.name;
        var location =
          place.geometry.location.lat() + "," + place.geometry.location.lng();

        var result = {
          geometry: place.geometry,
          placeName: placeName,
          location: location,
          mode: mode,
          duration: duration,
          type: type,
        };

        resolve(result);
      } else {
        var mode =
          travelMode === google.maps.TravelMode.DRIVING ? "car" : "walking";
        reject(mode + " directions request failed due to " + status);
      }
    });
  });
}

function displayTravelData(travel) {
  var table = document.createElement("table");
  table.classList.add("styled-table");
  var headerRow = document.createElement("tr");
  var headings = [
    "Nom de restaurant",
    "Latitude,Longitude",
    "Durée en voiture",
    "Durée à pied",
  ];

  headings.forEach(function (headingText) {
    var th = document.createElement("th");
    th.textContent = headingText;
    headerRow.appendChild(th);
  });

  table.appendChild(headerRow);

  travel.forEach(function (item) {
    var row = document.createElement("tr");

    var placeCell = document.createElement("td");
    var locationCell = document.createElement("td");
    var driveDurationCell = document.createElement("td");
    var walkDurationCell = document.createElement("td");

    placeCell.textContent = item.placeName;
    locationCell.textContent = `${item.location}`;
    driveDurationCell.textContent = item.auto;
    walkDurationCell.textContent = item.foot;

    // Append cells to the row
    row.appendChild(placeCell);
    row.appendChild(locationCell);
    row.appendChild(driveDurationCell);
    row.appendChild(walkDurationCell);

    // Append the row to the table
    table.appendChild(row);
  });
  document.getElementById("table-container").appendChild(table);
}

function handleRestaurantData(restaurantData, map) {
  var i = 0;
  var numbersInMaps = [
    "yellow-1.svg",
    "yellow-2.svg",
    "yellow-3.svg",
    "yellow-4.svg",
    "yellow-5.svg",
    "yellow-6.svg",
  ];
  var numbers = [
    "yellow-11.svg",
    "yellow-12.svg",
    "yellow-13.svg",
    "yellow-14.svg",
    "yellow-15.svg",
    "yellow-16.svg",
  ];
  var titleArray = [];
  var autoArray = [];
  var footArray = [];

  // Extracting data from restaurantData arrays
  restaurantData.forEach(function (restaurant) {
    titleArray.push(restaurant.placeName);
    autoArray.push(restaurant.auto);
    footArray.push(restaurant.foot);

    var latLong = restaurant.latLong.split(",");
    var newLatLng = new google.maps.LatLng(latLong[0], latLong[1]);

    var content = `<p class="overflow-hidden width-49-display-inline-block" style="margin-top:0;">
                        <img src="assets/img/${numbersInMaps[i]}" class="max-width-35" alt="" />
                        <span>
                            <span style="padding-bottom:4px;"><strong>${restaurant.placeName}</strong></span><br /><small>`;

    if (restaurant.auto.length) {
      content += `<img src="assets/img/Car.svg" class="car" alt="" /> &nbsp;${restaurant.auto} `;
    }

    if (restaurant.foot.length) {
      content += `<img src="assets/img/Walking.svg" class="foot" `;
      if (!restaurant.auto.length) {
        content += ` style="margin-left:0; "`;
      }
      content += `alt="" /> &nbsp;${restaurant.foot} </small></span>`;
    }

    content += `</p>`;

    $(".restaurant-content").append(content);

    var marker = new google.maps.Marker({
      position: newLatLng,
      map: map,
      zIndex: 999,
      icon: {
        url: `assets/img/${numbers[i]}`,
        scaledSize: new google.maps.Size(40, 40),
      },
      draggable: true,
    });
    marker.set("category", "restaurant");
    markers.push(marker);

    JSONobj.RESTAURANT = [
      ...JSONobj.RESTAURANT.filter((el) => el.id !== i),
      {
        id: i,
        latLongRestaurant: restaurant.latLong,
        restaurant: restaurant.placeName,
        autoRestaurant: restaurant.auto,
        footRestaurant: restaurant.foot,
      },
    ];
    i++;
  });
}

function searchNearbyPlaces() {
  var getData = $(".latLongAdresse").val();
  const array = getData.split(",");
  var lat = array[0];
  var long = array[1];

  var map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: parseFloat(lat), lng: parseFloat(long) },
    zoom: 15,
  });

  var request = {
    location: map.getCenter(),
    radius: "5000",
    type: ["restaurant"],
  };

  var service = new google.maps.places.PlacesService(map);
  service.nearbySearch(request, async function (results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      var directionsService = new google.maps.DirectionsService();

      var promises = results.slice(0, 4).map(function (place) {
        var drivePromise = calculateDuration(
          place,
          map,
          directionsService,
          google.maps.TravelMode.DRIVING,
          null
        );
        var walkPromise = calculateDuration(
          place,
          map,
          directionsService,
          google.maps.TravelMode.WALKING,
          null
        );
        return Promise.all([drivePromise, walkPromise]);
      });

      let placesWithDurations = await Promise.all(promises);
      placesWithDurations = placesWithDurations.map((place) => {
        return {
          placeName: place[0].placeName,
          location: place[0].location,
          type: place[0].type,
          auto: place[0].duration,
          foot: place[1].duration,
          latLong: `${place[0].geometry.location.lat()},${place[0].geometry.location.lng()}`,
        };
      });
      displayTravelData(placesWithDurations);
      handleRestaurantData(placesWithDurations, map);
    } else {
      console.error("Error in nearby search:", status);
    }
  });
}

document
  .getElementById("searchPlacesButton")
  .addEventListener("click", searchNearbyPlaces);
//COMMERCES

function displayMallData(travel) {
  var table = document.createElement("table");
  table.classList.add("styled-table");
  var headerRow = document.createElement("tr");
  var headings = [
    "Nom de Commerce",
    "Latitude,Longitude",
    "Durée en voiture",
    "Durée à pied",
    "type de Commerce ",
  ];

  headings.forEach(function (headingText) {
    var th = document.createElement("th");
    th.textContent = headingText;
    headerRow.appendChild(th);
  });

  table.appendChild(headerRow);
console.log("travel",travel)
  travel.forEach(function (item) {
    var row = document.createElement("tr");

    var placeCell = document.createElement("td");
    var locationCell = document.createElement("td");
    var driveDurationCell = document.createElement("td");
    var walkDurationCell = document.createElement("td");
    var typeCell = document.createElement("td");

    placeCell.textContent = item.placeName;
    locationCell.textContent = `${item.location}`;
    driveDurationCell.textContent = item.auto;
    walkDurationCell.textContent = item.foot;
    if (item.type === "shopping_mall") {
      typeCell.textContent = "Commerce";
    } else if (item.type === "butcher") {
      typeCell.textContent = "Boucherie";
    } else {
      typeCell.textContent = "Boulangerie";
    }

    // Append cells to the row
    row.appendChild(placeCell);
    row.appendChild(locationCell);
    row.appendChild(driveDurationCell);
    row.appendChild(walkDurationCell);
    row.appendChild(typeCell);

    // Append the row to the table
    table.appendChild(row);
  });
  document.getElementById("table-mall-container").appendChild(table);
}
function handleData(flattenedResults, map) {
  var i = 0;
  var numbersInMaps = [
    "red-1.svg",
    "red-12.svg",
    "red-13.svg",
    "red-4.svg",
    "red-5.svg",
    "red-6.svg",
  ];
  var numbers = [
    "red-11.svg",
    "red-2.svg",
    "red-3.svg",
    "red-14.svg",
    "red-15.svg",
    "red-16.svg",
  ];
  var titleArray = [];
  var autoArray = [];
  var footArray = [];
  var typeArray = [];
  var j = 0;
  var k = 1;
  var l = 1;
  var markers = [];

  flattenedResults.forEach(function (commerce) {
    titleArray.push(commerce.placeName);
    autoArray.push(commerce.auto);
    footArray.push(commerce.foot);
    typeArray.push(commerce.type);

    var latLong = commerce.latLong.split(",");
    var newLatLng = new google.maps.LatLng(latLong[0], latLong[1]);
   

    if (marker != undefined) {
      marker.setPosition(newLatLng);
      console.log("erreur !");
    } else {
      if (typeArray[i] == "butcher" || typeArray[i] == "bakery") {
       
        var content = `<tr>
              <td>`;
        content += `<p class="overflow-hidden">`;
        if (typeArray[i] == "butcher") {
          content +=
            `<img src="assets/img/Boucherie2.svg" class="max-width-35" alt="" /><span class="spanNumber2">` +
            k +
            `</span>`;
        } else {
          content +=
            `<img src="assets/img/Boulangerie2.svg" class="max-width-35" alt="" /><span class="spanNumber2">` +
            l +
            `</span>`;
        }
        content +=
          `
                  <span>
                      <span style="padding-bottom:4px;"><strong>` +
          titleArray[i] +
          `</strong></span><br /><small>`;

        if (autoArray[i].length) {
          content +=
            `<img src="assets/img/Car.svg" class="car" alt="" /> &nbsp;
                          ` +
            autoArray[i] +
            ` min`;
        }

        if (footArray[i].length) {
          content += `<img src="assets/img/Walking.svg" class="foot" 
              `;
          if (!autoArray[i].length) {
            content += ` style="margin-left:0; "`;
          }
          content +=
            `alt="" /> &nbsp;
                          ` +
            footArray[i] +
            ` min`;
        }

        content += `</small></span></p></td></tr>`;

        if (typeArray[i] == "butcher") {
          $(".commerce-content-2").append(content);
        } else if (typeArray[i] == "bakery") {
          $(".commerce-content-3").append(content);
        }

        if (typeArray[i] == "butcher") {
          var img = "assets/img/Boucherie.svg";
          var labelLetter = "" + k + "";
          k++;
        } else if (typeArray[i] == "bakery") {
          var img = "assets/img/Boulangerie.svg";
          var labelLetter = "" + l + "";
          l++;
        }

        var marker = new google.maps.Marker({
          position: newLatLng,
          map: map,
          zIndex: 999,
          icon: {
            url: img,
            scaledSize: new google.maps.Size(40, 40),
          },
          label: { text: labelLetter, className: "labelMap" },
          draggable: true,
        });
        marker.set("category", "commerce");
        markers.push(marker);
      } else {

        var content = `<tr>
              <td>`;
        content += `<p class="overflow-hidden">`;

        content +=
          `<img src="assets/img/` +
          numbersInMaps[j] +
          `" class="max-width-35" alt="" />`;
        content +=
          `
                  <span>
                      <span style="padding-bottom:4px;"><strong>` +
          titleArray[i] +
          `</strong></span><br /><small>`;

        if (autoArray[i].length) {
          content +=
            `<img src="assets/img/Car.svg" class="car" alt="" /> &nbsp;
                          ` +
            autoArray[i] +
            ` min`;
        }

        if (footArray[i].length) {
          content += `<img src="assets/img/Walking.svg" class="foot" 
              `;
          if (!autoArray[i].length) {
            content += ` style="margin-left:0; "`;
          }
          content +=
            `alt="" /> &nbsp;
                          ` +
            footArray[i] +
            ` min`;
        }

        content += `</small></span></p></td>
              <td><p>
                  <span>`;
        if (typeArray[i] == "shopping_mall") {
          content += `<img src="assets/img/carefoor.svg" class="max-width-45" alt="" />`;
        } else if (typeArray[i] == "Delhaize") {
          content += `<img src="assets/img/delheiz.svg" class="max-width-45" alt="" />`;
        } else if (typeArray[i] == "Colruyt") {
          content += `<img src="assets/img/cloryt.svg" class="max-width-45" alt="" />`;
        } else {
          content += ``;
        }
        /*  if (typeArray[i] == 'Carrefour') {
              content += `<img src="assets/img/carefoor.svg" class="max-width-45" alt="" />`;
          } else if (typeArray[i] == 'Delhaize') {
              content += `<img src="assets/img/delheiz.svg" class="max-width-45" alt="" />`;
          } else if (typeArray[i] == 'Colruyt') {
              content += `<img src="assets/img/cloryt.svg" class="max-width-45" alt="" />`;
          } else {
              content += ``;
          } */

        content += `</span></p></td>
          </tr>`;
        $(".commerce-content").append(content);

        var img = "assets/img/" + numbers[j];

        var marker = new google.maps.Marker({
          position: newLatLng,
          map: map,
          zIndex: 999,
          icon: {
            url: img,
            scaledSize: new google.maps.Size(40, 40),
          },
          draggable: true,
        });
        marker.set("category", "commerce");
        markers.push(marker);
        j++;
      }
      
      JSONobj.SHOPS = [
        ...JSONobj.SHOPS.filter((el) => el.id !== i),
        {
          id: i,
          latLongCommerce: commerce.latLong,
          commerce: commerce.placeName,
          autoCommerce: commerce.auto,
          footCommerce: commerce.foot,
          typeCommerce: commerce.type,
        },
      ];
      
      i++;
    }
  });
}

function searchPlaces(types, counts) {
  var getData = $(".latLongAdresse").val();
  const array = getData.split(",");
  var lat = array[0];
  var long = array[1];

  var map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: parseFloat(lat), lng: parseFloat(long) },
    zoom: 15,
  });

  var service = new google.maps.places.PlacesService(map);

  var resultsArray = []; // To store transformed results as an array of objects
  var promises = types.flatMap(function (type, index) {
    return new Promise(function (resolve, reject) {
      service.nearbySearch(
        {
          location: map.getCenter(),
          radius: "5000",
          type: [type.toString()],
        },
        function (placeResults, status) {

          if (status === google.maps.places.PlacesServiceStatus.OK) {
            console.log("placeResults",placeResults)
            var selectedResults = placeResults.slice(0, counts[index]);
            var directionsService = new google.maps.DirectionsService();
            var durationPromises = selectedResults.map(function (place) {
              return new Promise(function (resolveDuration, rejectDuration) {
                var drivePromise = calculateDuration(
                  place,
                  map,
                  directionsService,
                  google.maps.TravelMode.DRIVING,
                  type
                );
                var walkPromise = calculateDuration(
                  place,
                  map,
                  directionsService,
                  google.maps.TravelMode.WALKING,
                  type
                );

                Promise.all([drivePromise, walkPromise])
                  .then(function (data) {
                    resolveDuration({
                      placeName: data[0].placeName,
                      location: data[0].location,
                      type: data[0].type,
                      auto: data[0].duration,
                      foot: data[1].duration,
                      latLong: `${data[0].geometry.location.lat()},${data[0].geometry.location.lng()}`,
                    });
                  })
                  .catch(function (error) {
                    console.error("Error calculating durations:", error);
                    rejectDuration(error);
                  });
              });
            });

            Promise.all(durationPromises)
              .then(function (results) {
                resultsArray.push(results);
                console.log("resultsArray", resultsArray); 
                resolve();
              })
              .catch(function (error) {
                console.error("Error in duration promises:", error);
                reject(error);
              });
          } else {
            reject(`Error in nearby ${type} search: ${status}`);
          }
        }
      );
    });
  });

  Promise.all(promises)
    .then(function () {
      // Flatten the array and handleResults
      var flattenedResults = resultsArray.flat();
      // console.log("flattenedResults",flattenedResults)
      displayMallData(flattenedResults);
      handleData(flattenedResults, map); 
    })
    .catch(function (error) {
      console.error(error);
    });
}

// Usage example
var types = ["shopping_mall", "bakery", "butcher"];
var counts = [3, 2, 2];

document
  .getElementById("searchMallButton")
  .addEventListener("click", function () {
    searchPlaces(types, counts);
  });
