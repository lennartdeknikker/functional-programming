// endpoint and query definitions
const settings = {
  scaleExtent: [.5, 20],
  minValueInData: 3,
  maxValueInData: 200
}

const endpoint = "https://api.data.netwerkdigitaalerfgoed.nl/datasets/ivo/NMVW/services/NMVW-29/sparql";
const queryAncestorStatues = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX edm: <http://www.europeana.eu/schemas/edm/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX hdlh: <https://hdl.handle.net/20.500.11840/termmaster>
PREFIX wgs84: <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX gn: <http://www.geonames.org/ontology#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT (SAMPLE(?identifier) AS ?identifierSample) ?title ?placeName ?imageLink ?extent ?lat ?long WHERE {
  <https://hdl.handle.net/20.500.11840/termmaster7745> skos:narrower* ?place .
  ?place skos:prefLabel ?placeName .
  VALUES ?type { "Voorouderbeelden" "Voorouderbeeld" "voorouderbeelden" "voorouderbeeld" }
  ?cho    dct:spatial   ?place ;
          dc:title      ?title ;
          dc:type       ?type ;
          dc:identifier ?identifier ;
          dct:extent    ?extent ;
          edm:isShownBy ?imageLink .
  ?place  skos:exactMatch/wgs84:lat   ?lat .
  ?place  skos:exactMatch/wgs84:long  ?long .
}
GROUP BY ?identifier ?title ?place ?placeName ?type ?imageLink ?lat ?long ?extent
`;

// this code loads the map, then loads the data
loadMap('https://raw.githubusercontent.com/rifani/geojson-political-indonesia/master/IDN_adm_1_province.json')
.then(loadData(endpoint, queryAncestorStatues));

async function loadMap(geoJson) {
d3.json(geoJson)
.then(mapData => renderMap(mapData))
}

function loadData(endpoint, query) {
d3.json(endpoint + "?query=" + encodeURIComponent(query) + "&format=json")
.then(objects => { renderObjects(transformData(objects.results.bindings)) })
}

// This function transforms data to group on locations, stores those in an object with amounts per location
/*
function transformData(source) {
  let transformed = d3.nest()
  .key(function(d) { return `${d.long.value}, ${d.lat.value}`; })
  .entries(source);
  transformed.forEach(element => {
    element.amount = element.values.length;
    element.placeName = element.values[0].placeName.value;
    element.long = element.values[0].long.value;
    element.lat = element.values[0].lat.value;
  });
  return transformed;
}
*/
function transformData(source) {
  let transformed = d3.nest()
  .key(function(d) { return d.placeName.value})
  .entries(source);
  transformed.forEach(element => {
    element.amount = element.values.length;
    element.placeName = element.values[0].placeName.value;
    element.long = element.values[0].long.value;
    element.lat = element.values[0].lat.value;
  });
  return transformed;
}

// adds zoom functionality to map
const zoom = d3
  .zoom()
  .scaleExtent(settings.scaleExtent)
  .on('zoom', zoomHandler);

function zoomHandler() {
  g.attr('transform', d3.event.transform);
  adjustCirclesToZoomLevel(d3.event.transform.k);
}

// changes fill color of areas on mouse over and mouse out
function mouseOverHandler(d, i) {
  let element = d3.select(this);
  if (element.attr('fill') !== '#00aaa0') {
    element.attr('fill', '#9aeae6')
  }
}
function mouseOutHandler(d, i) {
  let element = d3.select(this);
  if (element.attr('fill') !== '#00aaa0') {
    element.attr('fill', 'white')
  }
}

// updates the selected area on click an changes it's fill color
function areaClickHandler(d) {
  d3.select('#map_text').text(`You've selected ${d.properties.NAME_1}`)
  d3.selectAll('.area').attr('fill', 'white');
  d3.select(this).attr('fill', '#00aaa0')
}

// loads a list of selected objects
function objectClickHandler(d, i) {
  console.log(d);
  let newHtml =`
  <h3>List of statues found at ${d.placeName}</h3>
  <ol class="item-list">
  `;

  d.values.forEach( value => {
    newHtml += `
      <li>${value.title.value}
        <ul class="sub-item-list">
          <li>Identifier: ${value.identifierSample.value}</li>
          <li>Extent: ${value.extent.value}</li>
          <li>Image Link: <a href="${value.imageLink.value}">${value.imageLink.value}</a></li>
          <li>Origin location: ${value.placeName.value} (${value.lat.value}, ${value.long.value})</li>
        </ul>
        `// <img src="${value.imageLink.value}" class="object-image" /> 
      +`</li>
    `;
  });

  newHtml += "</ol>";
  document.querySelector('.info').innerHTML = newHtml;
}

// makes it possible to zoom on click with adjustable steps
d3.select('#btn-zoom--in').on('click', () => clickToZoom(2));
d3.select('#btn-zoom--out').on('click', () => clickToZoom(.5));

function clickToZoom(zoomStep) {
  svg
    .transition()
    .duration(500)
    .call(zoom.scaleBy, zoomStep);
}

// loads the svg in the map container
const svg = d3
  .select('#map_container')
  .append('svg')
  .attr('width', '100%')
  .attr('height', '100%')

// adds the zoom functionality to the svg
const g = svg.call(zoom).append('g');

// map projection settings
const projection = d3
  .geoMercator()
  .center([120, -5])
  .scale(1600)
  .translate([window.innerWidth / 1.8, window.innerHeight/2.3]);

const path = d3.geoPath().projection(projection);

// renders the map from a given geoJson
function renderMap(geoJson) {
  g
  .append('g')
  .attr('class', 'g-map')
  .selectAll('path')
  .data(geoJson.features)
  .enter()
  .append('path')
  .attr('class', 'area')
  .attr('d', path)
  .attr('fill', 'white')
  .attr('stroke', '#c1eae8')
  .attr('stroke-width', 0.5)
  .on('mouseover', mouseOverHandler)
  .on('mouseout', mouseOutHandler)
  .on('click', areaClickHandler);
}

// renders the datapoints
function renderObjects(objects) {
  g
  .append('g')
  .attr('class', 'g-datapoints')
  .selectAll('.datapoint')
  .data(objects)
  .enter()
  .append('circle')
  .attr('class', 'datapoint')
  .attr('data-place', d => d.placeName)
  .attr('data-long', d => d.long)
  .attr('data-lat', d => d.lat)
  .attr('cx', d => projection([d.long, d.lat])[0])
  .attr('cy', d => projection([d.long, d.lat])[1])
  .attr('fill', '#00827b')
  .attr('fill-opacity', .5)
  .on('click', objectClickHandler);
  adjustCirclesToZoomLevel(1);
}

// adjusts the circles to the zoomlevel
function adjustCirclesToZoomLevel(zoomLevel) {
  const minRadius = (zoomLevel/3 < 2) ? 3 - (zoomLevel/3) : 1;
  const maxRadius = (zoomLevel*7 < 37.5) ? 40 - (zoomLevel*7) : 2.5;
  const maxZoomLevel = settings.scaleExtent[1];
  const factor = (maxRadius-minRadius) / (settings.maxValueInData-settings.minValueInData);

  g.selectAll('circle')
  .attr('r', d => {
    if (d.amount*factor < minRadius) {
      return minRadius;
    }
    else if (d.amount*factor > maxRadius) {
      return maxRadius;
    }
    else {
      return d.amount*factor;
    }
  })
  if (zoomLevel < maxZoomLevel/2) {
    g.selectAll('.datapoint')
    .attr('fill-opacity', (.3 + .7/zoomLevel))
  } else {
    g.selectAll('.datapoint')
    .attr('fill-opacity', 1)
  }
}