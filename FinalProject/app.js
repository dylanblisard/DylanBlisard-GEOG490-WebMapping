/* DEFINE FUNCTIONS */

let popup = null;
function setInfo(feature) {
  //Get base information
  let name = feature.properties.Name || "N/A";
  let period = feature.properties.Period || "N/A";
  let link = feature.properties.Link || "N/A";

  //Get dating
  let firstdate = feature.properties["Earliest date"];
  let lastdate = feature.properties["Latest date"];
  firstdate = firstdate < 0 ? firstdate.slice(1) + " BCE" : firstdate + " CE";
  lastdate = lastdate < 0 ? lastdate.slice(1) + " BCE" : lastdate + " CE";

  //Get coordinates
  let coordinates = feature.geometry.coordinates.slice();
  let [long, lat] = coordinates.toString().split(",");
  long = (+long).toFixed(3);
  lat = (+lat).toFixed(3);

  //Get description
  let cargo = feature.properties["Other cargo"];
  let hull = feature.properties["Hull remains"];
  let paraphernalia = feature.properties["Shipboard paraphernalia"];
  let comments = feature.properties["Comments"];
  if (!comments && !cargo && !hull && !paraphernalia) { comments = "No Details"; }

  //Set HTML
  document.getElementById("content-box").innerHTML = 
  `<div class="name-text">
      <div class="name"><strong>${name} Wreck</strong></div>
      <button id="flyButton" class="btn" onClick="flyToLocation(${long}, ${lat}, '${name}')">
      <img draggable=false class="unselectable" style="width: 20px; height: 24px;" src="images/zoom-in.svg" alt=""></img>
      </button>
  </div>
  <span>Period: ${period}</span><br>
  <span>Dating: ${firstdate} to ${lastdate}</span><br>
  <hr>`

  document.getElementById("content-start").classList.remove('scrollio-start');
  document.getElementById("content-start").classList.add('scrollio');


  //Bold keywords
  let wordsToBold = ["amphora", "amphorae", "marble", "coins", "coin", "bronze", "silver", "gold", "ivory", "tin", "lead", "copper", "statue", "statues", "ingot", "ingots", "sculpture", "sculptures"];
  let pattern = new RegExp("\\b(?!" + "Bronze Age" + ")(" + wordsToBold.join("|") + ")\\b", "gi");
  let bodyText = `${comments} ${cargo} ${hull} ${paraphernalia}`;

  for (let i = 0; i < wordsToBold.length; i++) {
    bodyText = bodyText.replace(pattern, (match) => { return `<strong>${match}</strong>` });
  }

  //Add Wiki link if available
  if (link !== "N/A") {
    bodyText += `<br><br>Learn More: <a class="wiki-link" target="_blank" href=${link}>Wikipedia.com</a><br><br>`
  }

  //Set Body text
  document.getElementById("comment-box").innerHTML = bodyText;                              

  //Create new popup
  if (popup !== null) { popup.remove() }
  popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: true,
    closeOnMove: false,
    })
    .setLngLat(coordinates)
    .setHTML(`<strong>${name} Wreck</strong>`)
    .addTo(map);
  
  //Return attributes
  return [long, lat, name];
}

//Load GeoJSON data
function loadGeoJSON(callback) {
  var xhr = new XMLHttpRequest();
  xhr.overrideMimeType("application/json");
  xhr.open("GET", "Shipwrecks.geojson", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      callback(JSON.parse(xhr.responseText));
    }
  };
  xhr.send(null);
}

//Get a random feature
function getRandomFeature(geojson) {
  var features = geojson.features;
  var randomIndex = Math.floor(Math.random() * features.length);
  return features[randomIndex];
}

//Fly to random point
function flyToRandom() {
  loadGeoJSON(function (geojson) {
    var randomFeature = getRandomFeature(geojson);
    let info = setInfo(randomFeature);
    flyToLocation(info[0], info[1], info[2]);
  });
}

//Fly to determined point
function flyToLocation(long, lat, name) {
  map.flyTo({
      center: [long, lat],
      zoom: 9,
      speed: 0.8,
      curve: 1
  });

  //Create new popup
  if (popup !== null) { popup.remove() }
  popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: true,
    closeOnMove: false,
    })
    .setLngLat([long, lat])
    .setHTML(`<strong>${name} Wreck</strong>`)
    .addTo(map);
}


mapboxgl.accessToken = "pk.eyJ1IjoiZGJsaXNhcmQiLCJhIjoiY2xnNWQ2NzBqMDFvMTNtbWpjcnF2N3BwayJ9.A_cJHb58qSAoYjKyBcz6yw";
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/dblisard/clhnyb0dw000t01pv7axmagwy",
  maxBounds: [
    [-10, 27], // Southwest coordinates [longitude, latitude]
    [42, 50]   // Northeast coordinates [longitude, latitude]
  ],
    center: [-10.099190, 40.181034],
    zoom: 2,
    minZoom: 4,
    pitchWithRotate: false, // Disable 3D mode
    dragRotate: false // Disable map rotation
});
map.addControl(new mapboxgl.NavigationControl({
  showCompass: false,
}));


  
map.on("load", () => {
  map.addSource("shipwrecks", {
    type: "geojson",
    data: "Shipwrecks.geojson",
    cluster: true,
    clusterMaxZoom: 6, // Max zoom to cluster points on
    clusterRadius: 30, // Radius of each cluster when clustering points
  });

  map.addLayer({
    id: "unclustered-point",
    type: "circle",
    source: "shipwrecks",
    filter: ["!", ["has", "point_count"]],
    paint: {
    "circle-color": "#66023C",
    "circle-radius": 6,
    "circle-stroke-width": 2,
    "circle-stroke-color": "#ffffff",
    "circle-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 1, 0.75],
    },
  });

  map.addLayer({
    id: "clusters",
    type: "circle",
    source: "shipwrecks",
    filter: ["has", "point_count"],
    paint: {
    "circle-color": "#66023C",
    "circle-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 1, 0.75],
    "circle-radius": ["step", ["get", "point_count"], 12, 5, 15, 10, 20, 15, 20, 25, 32],
    "circle-stroke-width": 2,
    "circle-stroke-color": "#ffffff",
    },
  });

  map.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: "shipwrecks",
    filter: ["has", "point_count"],
    layout: {
      "text-field": [
        "match",
        ["get", "point_count"],
        1, "I",
        2, "II",
        3, "III",
        4, "IV",
        5, "V",
        6, "VI",
        7, "VII",
        8, "VIII",
        9, "IX",
        10, "X",
        11, "XI",
        12, "XII",
        13, "XIII",
        14, "XIV",
        15, "XV",
        16, "XVI",
        17, "XVII",
        18, "XVIII",
        19, "XIX",
        20, "XX",
        21, "XXI",
        22, "XXII",
        23, "XXIII",
        24, "XXIV",
        25, "XXV",
        26, "XXVI",
        27, "XXVII",
        28, "XXVIII",
        29, "XXIX",
        30, "XXX",
        31, "XXXI",
        32, "XXXII",
        33, "XXXIII",
        34, "XXXIV",
        35, "XXXV",
        36, "XXXVI",
        37, "XXXVII",
        38, "XXXVIII",
        39, "XXXIX",
        40, "XL",
        41, "XLI",
        42, "XLII",
        43, "XLIII",
        44, "XLIV",
        45, "XLV",
        46, "XLVI",
        47, "XLVII",
        48, "XLVIII",
        49, "XLIX",
        50, "L",
        "Other"
      ],
      "text-font": ["Open Sans ExtraBold", "Arial Unicode MS Bold"],
      "text-size": 13,
    },
    paint: { "text-color": "#fff" }
  });




// change color on hover
let hoveredStateId = null;
map.on("mousemove", "unclustered-point", (e) => {
  if (e.features.length > 0) {
  if (hoveredStateId !== null) {
      map.setFeatureState(
      { source: "shipwrecks", id: hoveredStateId },
      { hover: false }
      );
  }
  hoveredStateId = e.features[0].id;
  map.setFeatureState(
      { source: "shipwrecks", id: hoveredStateId },
      { hover: true }
  );
  }
});

// Change color on hover for clusters layer
map.on("mousemove", "clusters", (e) => {
  if (e.features.length > 0) {
  if (hoveredStateId !== null) {
      map.setFeatureState(
      { source: "shipwrecks", id: hoveredStateId },
      { hover: false }
      );
  }
  hoveredStateId = e.features[0].id;
  map.setFeatureState(
      { source: "shipwrecks", id: hoveredStateId },
      { hover: true }
  );
  }
});

// Return to original color on mouse leave
map.on("mouseleave", ["unclustered-point", "clusters"], () => {
  if (hoveredStateId !== null) {
  map.setFeatureState(
      { source: "shipwrecks", id: hoveredStateId },
      { hover: false }
  );
  }
  hoveredStateId = null;
});





// inspect a cluster on click
map.on("click", "clusters", (e) => {
  const features = map.queryRenderedFeatures(e.point, {
  layers: ["clusters"],
  });
  const clusterId = features[0].properties.cluster_id;
  map.getSource("shipwrecks").getClusterExpansionZoom(clusterId, (err, zoom) => {
  if (err) return;
  map.easeTo({
      center: features[0].geometry.coordinates,
      zoom: zoom,
  });
  });
});


  // on click open popup with geojson properties 
  map.on("click", "unclustered-point", (e) => {
    setInfo(e.features[0]);
  });

  // handle mouse hover 
  map.on("mouseenter", ["clusters", "unclustered-point"], () => {
      map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", ["clusters", "unclustered-point"], () => {
      map.getCanvas().style.cursor = "";
  });
});





