// render map
async function loadMap() {
  await getDataFrom('https://raw.githubusercontent.com/rifani/geojson-political-indonesia/master/IDN_adm_1_province.json')
  .then(mapData => renderMap(mapData))
  // render data points
  .then(
    await getDataFrom('https://api.data.netwerkdigitaalerfgoed.nl/datasets/ivo/NMVW/services/NMVW-29/sparql?default-graph-uri=&query=PREFIX+rdf%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0D%0APREFIX+dc%3A+%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%3E%0D%0APREFIX+dct%3A+%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Fterms%2F%3E%0D%0APREFIX+skos%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2004%2F02%2Fskos%2Fcore%23%3E%0D%0APREFIX+edm%3A+%3Chttp%3A%2F%2Fwww.europeana.eu%2Fschemas%2Fedm%2F%3E%0D%0APREFIX+foaf%3A+%3Chttp%3A%2F%2Fxmlns.com%2Ffoaf%2F0.1%2F%3E%0D%0APREFIX+hdlh%3A+%3Chttps%3A%2F%2Fhdl.handle.net%2F20.500.11840%2Ftermmaster%3E%0D%0APREFIX+wgs84%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2003%2F01%2Fgeo%2Fwgs84_pos%23%3E%0D%0APREFIX+geo%3A+%3Chttp%3A%2F%2Fwww.opengis.net%2Font%2Fgeosparql%23%3E%0D%0APREFIX+skos%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2004%2F02%2Fskos%2Fcore%23%3E%0D%0APREFIX+gn%3A+%3Chttp%3A%2F%2Fwww.geonames.org%2Fontology%23%3E%0D%0APREFIX+rdf%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0D%0APREFIX+rdfs%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0D%0ASELECT+%28SAMPLE%28%3Fidentifier%29+AS+%3FidentifierSample%29+%3Ftitle+%3FplaceName+%3FimageLink+%3Fextent+%3Flat+%3Flong+WHERE+%7B%0D%0A+++%3Chttps%3A%2F%2Fhdl.handle.net%2F20.500.11840%2Ftermmaster7745%3E+skos%3Anarrower*+%3Fplace+.%0D%0A+++%09%3Fplace+skos%3AprefLabel+%3FplaceName+.%0D%0A+++VALUES+%3Ftype+%7B+%22Voorouderbeelden%22+%22Voorouderbeeld%22+%22voorouderbeelden%22+%22voorouderbeeld%22+%7D%0D%0A+++%3Fcho+dct%3Aspatial+%3Fplace+%3B%0D%0A++++++++dc%3Atitle+%3Ftitle+%3B%0D%0A+++++++dc%3Atype+%3Ftype+%3B%0D%0A+++++++dc%3Aidentifier+%3Fidentifier+%3B%0D%0A+++++++dct%3Aextent+%3Fextent+%3B%0D%0A++++++edm%3AisShownBy+%3FimageLink+.%0D%0A+++%3Fplace+skos%3AexactMatch%2Fwgs84%3Alat+%3Flat+.%0D%0A+++%3Fplace+skos%3AexactMatch%2Fwgs84%3Along+%3Flong+.%0D%0A%7D%0D%0AGROUP+BY+%3Fidentifier+%3Ftitle+%3Fplace+%3FplaceName+%3Ftype+%3FimageLink+%3Flat+%3Flong+%3Fextent&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on')
    .then(objects => {
      renderObjects(transformData(objects.results.bindings));
    })
  );
}

loadMap();

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

function getDataFrom(queryLink) {
  return d3.json(queryLink);
};

const zoom = d3
  .zoom()
  .scaleExtent([.5, 20])
  .on('zoom', zoomHandler);

function zoomHandler() {
  g.attr('transform', d3.event.transform);
  adjustCirclesToZoomLevel(d3.event.transform.k);
}


function mouseOverHandler(d, i) {
  
  let element = d3.select(this);
  if (element.attr('fill') !== '#00aaa0') {
    element.attr('fill', '#9aeae6')
  }
}

function mouseOutHandler(d, i) {
  let element = d3.select(this);
  if (element.attr('fill') !== '#00aaa0') {
    element.attr('fill', '#c1eae8')
  }
}

function clickHandler(d, i) {
  d3.select('#map__text').text(`You've selected ${d.properties.NAME_1}`)
  d3.selectAll('.province').attr('fill', '#c1eae8');
  d3.selectAll('.province').attr('stroke-width', '.5');
  d3.select(this).attr('fill', '#00aaa0')
  d3.select(this).attr('stroke-width', '2')
}

function clickToZoom(zoomStep) {
  svg
    .transition()
    .duration(500)
    .call(zoom.scaleBy, zoomStep);
}

d3.select('#btn-zoom--in').on('click', () => clickToZoom(2));
d3.select('#btn-zoom--out').on('click', () => clickToZoom(.5));

const svg = d3
  .select('#map__container')
  .append('svg')
  .attr('width', '100%')
  .attr('height', '100%')

const g = svg.call(zoom).append('g');

const projection = d3
  .geoMercator()
  .center([120, -5])
  .scale(1600)
  .translate([window.innerWidth / 1.8, window.innerHeight/2.3]);

const path = d3.geoPath().projection(projection);
const color = d3.scaleOrdinal(d3.schemeCategory10.slice(1, 4));


  function renderMap(root) {
  g
    .append('g')
    .selectAll('path')
    .data(root.features)
    .enter()
    .append('path')
    .attr('class', 'province')
    .attr('d', path)
    .attr('fill', '#c1eae8')
    .attr('stroke', '#FFF')
    .attr('stroke-width', 0.5)
    .on('mouseover', mouseOverHandler)
    .on('mouseout', mouseOutHandler)
    .on('click', clickHandler);
  }
  
  function renderObjects(objects) {
    g
    .append('g')
    .selectAll('.datapoint')
    .data(objects)
    .enter()
    .append('circle')
    .attr('class', 'datapoint')
		.attr('cx', d => projection([d.long, d.lat])[0])
		.attr('cy', d => projection([d.long, d.lat])[1])
		.attr('fill', '#00827b')
    .attr('fill-opacity', .5)

    adjustCirclesToZoomLevel(1);
  }

  function adjustCirclesToZoomLevel(zoomLevel) {
    
    let minRadius = (zoomLevel/3 < 2) ? 3 - (zoomLevel/3) : 1;
    let maxRadius = (zoomLevel*7 < 37.5) ? 40 - (zoomLevel*7) : 2.5;
    let maxValueInData = 200;
    let minValueInData = 3;
    let maxZoomLevel = 20;
    let factor = (maxRadius-minRadius) / (maxValueInData-minValueInData);

    g.selectAll('.datapoint')
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
    easterEgg(zoomLevel, maxZoomLevel);
  }

  function easterEgg(zoomLevel, maxZoomLevel) {
    let mickey = [
      {
        x: 713.1922842768404,
        y: 357.39588549979203,
        r: 2.253807106598985      
      },
      {
        x: 712.6200955348663,
        y: 354.3623462592666,
        r: 1  
      },
      {
        x: 715.9848110800312,
        y: 355.9852290633346,
        r: 1  
      }
    ]

    if (zoomLevel > maxZoomLevel /2) {
      g
      .selectAll('.mickey')
      .data(mickey)
      .enter()
      .append('circle')
      .attr('class', 'mickey')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.r)
      .attr('fill', 'black')
    }
  }