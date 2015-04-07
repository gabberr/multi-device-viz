//
// 
//

var colorNodes = d3.scale.category10();
var colorLinks = d3.scale.category20c();

var showDeviceText=true;
var showContextText=true;

var devices = [{
    name: "Phone"
}, {
    name: "Watch"
}, {
    name: "Tablet"
}];

var userActivities = [{
    name: "walking"
}, {
    name: "still"
}, {
    name: "on foot"
}, {
    name: "tilting"
}, {
    name: "unknown"
}
];

var androidActivities = [{
    name: "MainActivity"
}, {
    name: "OpenListActivity"
}, {
    name: "SettingsActivity"
}, {
    name: "PAUSED"
}
];

function selectChanged(i) {
    var deviceSelect = document.getElementById("device-"+i);
    var contextSelect = document.getElementById("context-"+i);

    var device = deviceSelect.options[deviceSelect.selectedIndex].value;
    var context = contextSelect.options[contextSelect.selectedIndex].value;


    //createSankey("data/interactions-phone-android.json" , "#chart-1");

    var dataPath= "data/interactions-"+ device +"-"+ context +".json";

    d3.select("#chart-"+i).selectAll("*").remove();
    createSankey(dataPath, "#chart-"+i);
}

function refreshText() {
    //debugger;
    var t1 =d3.selectAll("text.node-name")
        .classed("hidden", !showDeviceText);


    var t2 =d3.selectAll("text.context-name")
        .classed("hidden", !showContextText);
}

function showDeviceNames(c) {
    showDeviceText = c.checked;
    //d3.selectAll("text.node-name")
    //    .classed("hidden", !c.checked);
    refreshText();
}
function showContextNames(c) {
    showContextText = c.checked;
    refreshText();

}

function createLegend(targetID, elements, colorScale) {

    var w = 200;
    var h = 250;
    var svg2 = d3.select(targetID)
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    var legend = svg2.append("g")
        .selectAll("circle.legend")
        .data(elements)
        .enter()
        .append("g")
        .attr("transform", function (d, i) {

            d.x = 40,
                d.y = i * 50 + 30;
            return "translate(" + d.x + "," + d.y + ")";
        });

    legend.append("circle")
        .attr("fill", function (d) {
            return colorScale(d.name);
        })
        .attr("r", function (d) {
            return 14;
        });

    legend.append("text")
        .text(function (d) {
            return d.name;
        })
        .attr("x", function (d) {
            return 20;
        })
        .attr("y", function (d) {
            return 10;
        });
}

function createSankey(jsonPath, targetElementId) {

    var data = d3.json(jsonPath, function (error, data) {
//<!--SANKEY DIAGRAM-->

        for (var i = data.nodes.length - 1; i >= 0; i--) {
            var stateName = data.nodes[i].name;
            // create new property for nodes and add up values from links
            //  where ever this is the target state
            data.nodes[i].proportions = [];
            data.nodes[i].proportions.push({
                "name": "summation",
                "value": 0
            });

            for (var j = data.links.length - 1; j >= 0; j--) {
                var source = data.links[j].source;
                var target = data.links[j].target;
                if (target == stateName) {
                    for (var k = 0; k < data.links[j].proportions.length; k++) {
                        data.nodes[i].proportions[k].value += data.links[j].proportions[k].value;
                    }
                    data.links[j].targetID = i;
                    // data.nodes[i].proportions[1].value += data.links[j].proportions[1].value;
                }
                if (source == stateName) {
                    data.links[j].sourceID = i;
                }
            }
            ;
            // special case INIT state, is not targeted by any, so its gets a special group and color
            //if( (data.nodes[i].proportions[0].value + data.nodes[i].proportions[1].value) == 0 ) {
            //    data.nodes[i].proportions[3].value = 5; // INIT devices
            //  }

        }
        ;

        var tooltip = d3.select("body")
            .append("div")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .text("a simple tooltip");

        var padding = 28;
        var format2Number = d3.format(",.2f"),
            formatNumber = d3.format(",.0f"),
            format = function (a) {
                return formatNumber(a)
            },
            format2 = function (a) {
                return format2Number(a)
            };

        var margin = {
                top: 30,
                right: 250,
                bottom: 20,
                left: 40
            },
            width = 640 - margin.left - margin.right,
            height = 550 - margin.bottom - 90;
        var svg = d3.select(targetElementId).append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        var sankey = d3.sankey().nodeWidth(30).nodePadding(padding).size([width, height-200]);
        var path = sankey.link();


        sankey
            .nodes(data.nodes)
            .links(data.links)
            .layout(32);


        var group = svg.append("g");
        var link = group.selectAll(".link")
            .data(data.links)
            .enter().append("path")
            .attr("class", function (d) {
                return "link " + d.proportions[0].name;
            })
            .attr("id", function (d,i) { return "path_" + i; })
            .attr("d", path)
            .style("stroke-width", function (d) {
                return Math.max(1, d.dy);
            })
            .attr("stroke", function (d) {
                return colorLinks(d.proportions[0].name);
            })
            .sort(function (a, b) {
                return b.dy - a.dy;
            });

        var linkText = group.selectAll(".linkText")
            .data(data.links)
            .enter()
            .append("text")
            .attr("x", 100)
            .attr("dy", 0)
            .append("textPath")
            .text(function (d) {
                //debugger;
                //return "Context: " + d.proportions[0].name + " " + d.source.name + " → " + d.target.name + "\n" + format(d.proportions[0].value);
                return format(d.proportions[0].value);
            })
            .attr("xlink:href", function (d,i) { return "#path_" + i; });

        var node = svg.append("g").selectAll(".node")
            .data(data.nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            })
            .call(d3.behavior.drag()
                .origin(function (d) {
                    return d;
                })
                .on("dragstart", function () {
                    this.parentNode.appendChild(this);
                })
                .on("drag", dragmove));

        node.append("rect")
            .attr("height", function (d) {
                return d.dy;
            })
            .attr("width", sankey.nodeWidth())
            .style("fill", function (d) {
                return d.color = colorNodes(d.name.replace(/ .*/, ""));
            })
            .style("stroke", function (d) {
                return d3.rgb(d.color).darker(2);
            })
            .append("title")
            .text(function (d) {
                return d.name + "\n" + format(d.value);
            });

        node.append("text")
            .text(function (d) {
                return d.value;
            })
            .attr("x", function (d) {
                //debugger;
                return 15;
            })
            .attr("y", function (d) {
                return d.dy/2;
            })
            .attr("text-anchor", "middle");




        //showContextBar(data.links[0]);
        //stack(data.links[0].targetContext);
        var stack = d3.layout.stack();

        // Add a group for each row of data
        var groups = svg.append("g").selectAll(".context")
            .data(data.links[0].targetContext)
            .enter()
            .append("g");


        var svgChart = d3.select("#tooltipChart")
            .append("svg")
            .attr("width", 250)
            .attr("height", 150);

        //var arcs = svgChart.append("g").selectAll("arcs.nodes")
        //    .data(data.links[0].targetContext)
        //    .enter()
        //    .append("g");

        function showChartOnHover(link) {

            var barWidth = 100;
            var sum = d3.sum(link.targetContext, function(a) {
                return a[0].y;
            });

            var yScale = d3.scale.linear()
                .domain([0, sum])
                .range([0, link.dy ]);

            var newdata = link.targetContext;

            var newdata = newdata.map( function(obj) {
                return obj[0];
            });
            //debugger;
            svgChart.selectAll("*").remove();
                //.style("left", d3.event.pageX + "px")
                //.style("top", d3.event.pageY + "px");
            //stack(newdata);
            //
            //groups
            //    .remove();

            var pie = d3.layout.pie()
                .sort(null)
                .value(function(d) { return d.y; });

            /**
             * D3 arc helper for calculation of arcs parameters
             */
            var arc = d3.svg.arc()
                .outerRadius(40)
                .innerRadius(0);

            var arcs = svgChart.append("g").selectAll("arc.nodes")
                .data(pie(newdata))
                .enter()
                .append("g")
                .attr("fill", "none")
                .attr("r",  function (d) { return 20; } )
                .attr("class", "arc")
                .attr("transform", "translate(" + (40) + ", " + (40  )  + ")");

            arcs.append("path")
                .attr("fill", function(d, i) {

                    return colorLinks(d.data.name);
                })
                .attr("d", arc);



            var legend = svgChart.append("g")
                .selectAll("circle.legend")
                .data(newdata)
                .enter()
                .append("g")
                .attr("transform", function (d, i) {
                    //debugger;
                    d.value = d.y;
                    d.x = 100,
                        d.y = i * 20 + 10;
                    return "translate(" + d.x + "," + d.y + ")";
                });

            legend.append("circle")
                .attr("fill", function (d) {
                    //debugger;
                    return colorLinks(d.name);
                })
                .attr("r", function (d) {
                    return 5;
                });

            legend.append("text")
                .text(function (d) {
                    return d.name + "(" + d.value + "/" + sum + ")";
                })
                .attr("x", function (d) {
                    return 10;
                })
                .attr("y", function (d) {
                    return 5;
                });



            //groups = svg.append("g").selectAll(".context")
            //    .data(newdata)
            //    .enter()
            //    .append("g")
            //    .on("mouseover", function (d) {
            //        debugger;
            //        tooltip
            //            .style("left", d3.event.pageX + "px")
            //            .style("top", d3.event.pageY + "px")
            //            .style("text-shadow", "0 1px 0 #ddd, 1px 0 0 #ddd, 0 -1px 0 #ddd, -1px 0 0 #ddd")
            //            .style("visibility", "visible")
            //            .style("font-size", "0.9em");
            //
            //        tooltip
            //            .text(d[0].name + ": " + d[0].y);
            //    })
            //    .on("mousemove", function () {
            //        return tooltip.style("top",
            //            (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
            //    })
            //    .on("mouseout", function () {
            //        return tooltip.style("visibility", "hidden");
            //    });

            /**
             * Stacked bar chart of contexts
             */
            //var rects = groups.selectAll("rect")
            //    .data(function (d) {
            //        return d;
            //    })
            //    .enter()
            //    .append("rect")
            //    .attr("fill", "white")
            //    .transition()
            //    .duration(500)
            //    .attr("x", function (d, i) {
            //        return link.target.x + 30;
            //    })
            //    .attr("y", function (d) {
            //        return yScale(d.y0) + link.target.y + link.ty;
            //    })
            //    .attr("height", function (d) {
            //        return yScale(d.y);
            //    })
            //    .attr("width", barWidth)
            //    .sort(function (a, b) {
            //        return b.dy - a.dy;
            //    })
            //    .style("fill", function (d, i) {
            //        return colorLinks(d.name);
            //    });


            /**
             * Displays context names in the stacked context bar chart
             */
            //var contextText = groups.selectAll("text")
            //    .data(function (d) {
            //        return d;
            //    })
            //    .enter()
            //    .append("text")
            //    .classed("context-name", true)
            //    .attr("x", function (d, i) {
            //        return link.target.x + 35;
            //    })
            //    .attr("fill", "black")
            //    .attr("y", function (d) {
            //        return yScale(d.y0) + 15 + link.target.y + link.ty;
            //    })
            //    .text(function (d) {
            //        if(yScale(d.y) > 16)
            //            return d.name + ": " + format(d.y);
            //        else
            //            return null;
            //    });

        }






        /**
         * Select single link with mouse and show stacked bar of target device context
         */
        link
            .on("click", function (d, index) {

                if (this.className.baseVal.indexOf("selectedLink") >= 0) {
                    svg.selectAll(".link")
                        .classed("selectedLink", false)
                } else {
                    svg.selectAll(".link")
                        .classed("selectedLink", function (d, i) {
                            return index === i;
                        })
                }

                showChartOnHover(d);
                refreshText();

            });

        /**
         * Shows link name on hover
         */
        link
            .on("mouseover", function (d) {
                tooltip
                    .style("left", d3.event.pageX + "px")
                    .style("top", d3.event.pageY + "px")
                    .style("text-shadow", "0 1px 0 #ddd, 1px 0 0 #ddd, 0 -1px 0 #ddd, -1px 0 0 #ddd")
                    .style("visibility", "visible")
                    .style("font-size", "0.9em");

                tooltip
                    .text(d.proportions[0].name + ": " + d.proportions[0].value);
            })
            .on("mousemove", function () {
                return tooltip.style("top",
                    (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
            })
            .on("mouseout", function () {
                return tooltip.style("visibility", "hidden");
            });


        /**
         * Displays device name at node
         */
        node.append("text")
            .attr("x", -6)
            .attr("y", function (d) {
                return d.dy / 2;
            })
            .classed("node-name", true)
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function (d) {
                return d.name;
            })
            .filter(function (d) {
                return d.x < width / 2;
            })
            .attr("x", 5 + sankey.nodeWidth())
            .attr("text-anchor", "start");

        function dragmove(d) {
            d3.select(this).attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
            groups.attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
            sankey.relayout();
            //debugger;
            link.attr("d", path);

        }

        var hideTooltip = function () {
            // Hide the tooltip
            var tooltip = d3.select("#tooltip")
                .style("visibility", "hidden");

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
};


//createLegend("#chartLegend",devices, colorNodes);
//createLegend("#chartLegend",userActivities, colorLinks);
//createLegend("#chartLegend",androidActivities, colorLinks);
createSankey("data/interactions-phone-user.json" , "#chart-1");
//createSankey("data/interactions-watch-user.json" , "#chart-2");

