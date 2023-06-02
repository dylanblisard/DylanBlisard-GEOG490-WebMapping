let currentPopup = null;
function flyToLocation(long, lat, name) {
  map.flyTo({
      center: [long, lat],
      zoom: 9,
      speed: 0.8,
      curve: 1
  });

  if (currentPopup) { return } // Don't add new popup if already open
  const popup = new mapboxgl.Popup({
                  closeButton: false,
                  closeOnClick: true,
                  closeOnMove: false,
                  })
                  .setLngLat([long, lat])
                  .setHTML(
                  `<strong>${name} Wreck</strong>`
                  )
                  .addTo(map);
  currentPopup = popup;
  popup.on('close', () => {
      currentPopup = null; // Clear the reference when the popup is closed
  });
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
  clusterRadius: 24, // Radius of each cluster when clustering points
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
  "circle-radius": ["step", ["get", "point_count"], 10, 10, 15, 15, 20],
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
  "text-field": ["get", "point_count"],
  "text-font": ["Open Sans ExtraBold", "Arial Unicode MS Bold"],
  "text-size": 15,
  },
  paint: {"text-color": "#fff"}
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
  //Get base information
  let name = e.features[0].properties.Name || "N/A";
  let period = e.features[0].properties.Period || "N/A";

  //Get coordinates
  let coordinates = e.features[0].geometry.coordinates.slice();
  let [long, lat] = coordinates.toString().split(",");
  long = (+long).toFixed(3);
  lat = (+lat).toFixed(3);

  //Get description
  let cargo = e.features[0].properties["Other cargo"];
  let hull = e.features[0].properties["Hull remains"];
  let paraphernalia = e.features[0].properties["Shipboard paraphernalia"];
  let comments = e.features[0].properties.Comments;
  if (!comments && !cargo && !hull && !paraphernalia) { comments = "No Details"; }

  //Get dating
  let firstdate = e.features[0].properties["Earliest date"];
  let lastdate = e.features[0].properties["Latest date"];
  firstdate = firstdate < 0 ? firstdate.slice(1) + " BCE" : firstdate + " CE";
  lastdate = lastdate < 0 ? lastdate.slice(1) + " BCE" : lastdate + " CE";

  new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: true,
  closeOnMove: false,
  })
  .setLngLat(coordinates)
  .setHTML(
  `<strong>${name} Wreck</strong>`
  )
  .addTo(map);

  //Set HTML
  let wordsToBold = ["amphora", "amphorae", "marble", "coins", "coin", "bronze", "silver", "gold", "ivory", "tin", "lead", "copper", "statue", "statues", "ingot", "ingots", "sculpture", "sculptures"];
  let pattern = new RegExp("\\b(?!" + "Bronze Age" + ")(" + wordsToBold.join("|") + ")\\b", "gi");
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
  document.getElementById("comment-box").innerHTML = `${comments.replace(pattern, '<strong>$&</strong>')} 
                                                      ${cargo.replace(pattern, '<strong>$&</strong>')} 
                                                      ${hull.replace(pattern, '<strong>$&</strong>')} 
                                                      ${paraphernalia.replace(pattern, '<strong>$&</strong>')}`;
  });

  // handle mouse hover 
  map.on("mouseenter", ["clusters", "unclustered-point"], () => {
      map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", ["clusters", "unclustered-point"], () => {
      map.getCanvas().style.cursor = "";
  });
});