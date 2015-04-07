
// 
// inspiration from
// http://blog.thomsonreuters.com/index.php/mobile-patent-suits-graphic-of-the-day/
// 
// 

var data = d3.json("data/interactions.json", function(error, data) {

/*
  Created hoover elements
  <div id="tooltip" class="hidden">
    <p>Phone: <span id="tooltip-0">100 </span>
    </p>
    <p>Watch: <span id="tooltip-1">100</span></p>
</div>
 */
  console.log(error);

function initTooltip() {
  var tooltip = document.createElement("div");
  tooltip.id = "tooltip";
  tooltip.classList.add("hidden");

  var phone = document.createElement("p");
  phone.innerHTML = 'Phone: <span id="tooltip-1">/ </span>';
  var watch = document.createElement("p");
  watch.innerHTML = 'Watch: <span id="tooltip-2">/ </span>';
  var tablet = document.createElement("p");
  tablet.innerHTML= 'Tablet: <span id="tooltip-3">/ </span>';
  
  tooltip.appendChild(phone);
  tooltip.appendChild(watch);
  tooltip.appendChild(tablet);

  document.getElementById("chart").appendChild(tooltip);
}
initTooltip();

var nodes = {};

var devices = [ {
  name: "Phone",
  group: 0
}, {
  name: "Watch",
  group: 1
}, {
  name: "Tablet",
  group: 2
},
{
  name: "INIT",
  group: 3
}];

// d3.colours
color = d3.scale.category10();


// sum up the values of link targets t
// store the calculated values to nodes
for (var i = data.nodes.length - 1; i >= 0; i--) {
  var stateName = data.nodes[i].name;

 // create new property for states and add up values from links
 //  where ever this is the target state
  data.nodes[i].proportions =  [];
  data.nodes[i].proportions.push( {
        "group": 0,
        "value": 0
      });
  data.nodes[i].proportions.push( {
        "group": 1,
        "value": 0
      });
  data.nodes[i].proportions.push( {
        "group": 2,
        "value": 0
      });
    data.nodes[i].proportions.push( {
        "group": 3,
        "value": 0
      });

  for (var j = data.links.length - 1; j >= 0; j--) {
    var source = data.links[j].source;
    var target = data.links[j].target;
    if( target == stateName ) {
      for(var k = 0; k < data.links[j].proportions.length; k++) {
        data.nodes[i].proportions[k].value +=  data.links[j].proportions[k].value;
      }
      // data.nodes[i].proportions[1].value += data.links[j].proportions[1].value;
    }
  };

  // special case INIT state, is not targeted by any, so its gets a special group and color
  if( (data.nodes[i].proportions[0].value + data.nodes[i].proportions[1].value) == 0 ) {
      data.nodes[i].proportions[3].value = 5; // INIT devices
    }

};


// Finding max and min value of state values and links for mapping domain
// 
var maxDomainState = data.nodes.reduce(function(s1,s2){
                      return s1.proportions.reduce(add,0) < s2.proportions.reduce(add,0) ? s2:s1;
                   });
var minDomainState = data.nodes.reduce(function(s1,s2){
                      return s1.proportions.reduce(add,0) > s2.proportions.reduce(add,0) ? s2:s1;
                   });
var maxDomainValue = maxDomainState.proportions.reduce(add,0);
var minDomainValue = minDomainState.proportions.reduce(add,0);

var maxLinkValue = data.links.reduce(function(s1,s2){ 
                      return s1.proportions.reduce(add,0) < s2.proportions.reduce(add,0) ? s2:s1;
}).proportions.reduce(add,0);
var minLinkValue = data.links.reduce(function(s1,s2){ 
                      return s1.proportions.reduce(add,0) > s2.proportions.reduce(add,0) ? s2:s1;
}).proportions.reduce(add,0);


// set up scale so circles are not too small/big
var scale = d3.scale.linear()
  .domain([minDomainValue, maxDomainValue])
  .range([100,4000]);

var scalePaths = d3.scale.linear()
  .domain([minLinkValue, maxLinkValue])
  .range([2,8]);

// Compute the distinct nodes from the links.
data.links.forEach(function(link) {

  link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
  link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
});

var width = 960,
    height = 600;

var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(data.links)
    .size([width, height])
    .linkDistance(150)
    .charge(-5000)
    .on("tick", tick)
    .start();

// set up svg
var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);


var path = svg.append("g").selectAll("path")
    .data(force.links())
  .enter().append("path")
  .style('stroke-width', function(d){
    return scalePaths(getLinkProportion(d).reduce(add,0) );})
    .attr("class", function(d) { return "link " + d.type; })
  .on("mouseover", function (d) {
          var tooltip = d3.select("#tooltip")
              .style("left", d3.event.pageX + "px")
              .style("top", d3.event.pageY + "px")
              .style("display", "block");
        var p = getProportions(d);

        for (var i = 0; i < d.proportions.length; i++) {
           tooltip .select("#tooltip-"+(i+1))
              .text(d.proportions[i].value);
          }    
        })
            .on("mouseout", function () {
            hideTooltip();
        });

path.append("svg:title")
          .text(function(d, i) { 
            var p = getProportions(d.target);
            return [
            "Phone", p[0].value,
            "\nWatch",p[1].value
            
          ].join(" "); });

var markerPath = svg.append("svg:g").selectAll("path.marker")
    .data(force.links())
  .enter().append("svg:path")
    .attr("class", function(d) { return "marker_only " + d.type; })
    .attr("marker-end", function(d) { return "url(#" + d.type + ")"; })
  .on("mouseover", function (d) {
          var tooltip = d3.select("#tooltip")
              .style("left", d3.event.pageX + "px")
              .style("top", d3.event.pageY + "px")
              .style("display", "block");
        var p = getProportions(d);


        for (var i = 0; i < d.proportions.length; i++) {
           tooltip .select("#tooltip-"+(i+1))
              .text(d.proportions[i].value);
        }
              
        })
            .on("mouseout", function () {
            hideTooltip();
        });


// Per-type markers, as they don't inherit styles.
var defs = svg.append("defs").selectAll("marker")
    .data(force.links())
  .enter().append("marker")
    .attr("id", function(d) { return d.type; })
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 0)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .attr("overflow", "visible")
    .style("fill", "#555")
  .append("path")
    .attr("d", "M0,-5L10,0L0,5");


var pie = d3.layout.pie()
        .sort(null)
        .value(function(d) { return d.value; });
var arc = d3.svg.arc()
        .outerRadius(20)
        .innerRadius(0);
var circle = svg.append("g").selectAll("circle.nodes")
    .data(force.nodes())
    .enter()
    .append("g")
    .attr("fill", "none")
    .attr("r",  function (d) { return 20; } )
.call(force.drag);


var legend = svg.append("g")
           .selectAll("circle.legend")
           .data( devices)
           .enter()
           .append("g")
           .attr("transform", function(d, i) {
             d.x = 40,
             d.y = i* 50 + 30;
             return "translate(" + d.x + "," + d.y + ")"; 
           });

legend.append("circle")
    .attr("fill", function (d) { return color(d.group); })
    .attr("r",  function (d) { return 14; } );

legend.append("text")
    .text(function (d) { return d.name; })
    .attr("x", function (d) { return 20; })
    .attr("y", function (d) { return 10; });

 
circle.each(function(d){
    // var sum = getProportions(d).reduce(add, 0);
    var r = Math.sqrt(scale(calcRadius(d)));

    if(isNaN(r))
      r=5;
    arc = arc.outerRadius(r);
    d3.select(this)
    .selectAll("path")
        .data(function(d, i) {
          var prop = getProportions(d);
          return pie(getProportions(d)); })
    .enter().append("svg:path")
        .attr("d", 
          arc)
        // .attr("opacity",0.3)
        .attr("fill", function(d, i) { 
          return color(d.data.group  ); });  
    })
    .on("mouseover", function (d) {
        var tooltip = d3.select("#tooltip")
            .style("left", d3.event.pageX + "px")
            .style("top", d3.event.pageY + "px")
            .style("display", "block");
      var p = getProportions(d);



      for (var i = 0; i < p.length; i++) {
          tooltip .select("#tooltip-"+(i+1))
            .text(p[i].value);
        }

            
      })
          .on("mouseout", function () {
            hideTooltip();
          
      });


var text = svg.append("g").selectAll("text")
    .data(force.nodes())
  .enter().append("text")
    .attr("x", 8)
    .attr("y", ".31em")
    .text(function(d) { 
      return d.name; });

// Use elliptical arc path segments to doubly-encode directionality.
function tick() {
  // path.attr("d", linkArc);


  path.attr("d", function(d) {
    var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = Math.sqrt(dx * dx + dy * dy);
    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
  });
    
  markerPath.attr("d", function(d) {
    var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = Math.sqrt(dx * dx + dy * dy);
// Stackoverflow ...
    // We know the center of the arc will be some distance perpendicular from the
    // link segment's midpoint. The midpoint is computed as:
    var endX = (d.target.x + d.source.x) / 2;
    var endY = (d.target.y + d.source.y) / 2;

    // Notice that the paths are the arcs generated by a circle whose 
    // radius is the same as the distance between the nodes. This simplifies the 
    // trig as we can simply apply the 30-60-90 triangle rule to find the difference
    // between the radius and the distance to the segment midpoint from the circle 
    // center.
    var len = dr - ((dr/2) * Math.sqrt(3));
    
    // Remember that is we have a line's slope then the perpendicular slope is the 
    // negative inverse.
    endX = endX + (dy * len/dr);
    endY = endY + (-dx * len/dr);
      
    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + endX + "," + endY;
  });


  circle.attr("transform", transform);
  text.attr("transform", transform);
}

function getProportions(d) {
  for (var i = data.nodes.length - 1; i >= 0; i--) {
    if(data.nodes[i].name == d.name)
      return data.nodes[i].proportions;
    
  }
  return 0;
}
function getLinkProportion(d) {
  for (var i = data.links.length - 1; i >= 0; i--) {
    if(data.links[i].source == d.source) {
      if(data.links[i].target == d.target){
        return data.links[i].proportions;
      }  
    }
  }
  return 0;
}

var hideTooltip = function() {
  // Hide the tooltip
  var tooltip = d3.select("#tooltip")
    .style("display", "none");
  for (var i = 0; i < 3; i++) {
    tooltip.select("#tooltip-" + (i + 1)).text("/");
  }
};
function transform(d) {
  return "translate(" + d.x + "," + d.y + ")";
}
function calcRadius(d) {
   var sum = getProportions(d).reduce(add, 0);
   return sum;
}

function add(a, b) {
    return a + b.value;
}
});