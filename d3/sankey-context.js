//
// 
// 

var colorNodes = d3.scale.category10();
var colorLinks = d3.scale.category20c();

var showDeviceText = true;
var showContextText = true;

var dataZero;

var devices = [{
    name: "Phone"
}, {
    name: "Watch"
}, {
    name: "Tablet"
}];

//var userActivities = [{
//    name: "walking"
//}, {
//    name: "still"
//}, {
//    name: "on foot"
//}, {
//    name: "tilting"
//}, {
//    name: "unknown"
//}
//];

var androidActivities = [{
    name: "MainActivity"
}, {
    name: "OpenListActivity"
}, {
    name: "SettingsActivity"
}, {
    name: "PAUSE"
}
];


var colorLinks = d3.scale.ordinal()
    .domain(  ["Walking","On Foot", "Still", "Unknown"])
    .range(colorbrewer.RdGy[6]);

function selectChanged(i) {
    var deviceSelect = document.getElementById("device-" + i);
    var contextSelect = document.getElementById("context-" + i);

    var device = deviceSelect.options[deviceSelect.selectedIndex].value;
    var context = contextSelect.options[contextSelect.selectedIndex].value;

    //createSankey("data/interactions-phone-android.json" , "#chart-1");
    var dataPath = "data/interactions-" + device + "-" + context + ".json";

    d3.select("#chart-" + i).selectAll("*").remove();
    createSankey(dataPath, "#chart-" + i);
}

function refreshText() {

    var t1 = d3.selectAll("text.node-name")
        .classed("hidden", !showDeviceText);

    var t2 = d3.selectAll("text.context-name")
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

    var dataReader = d3.json(jsonPath, function (error, res) {


        dataZero = res;

        var data = {};

        data.nodes = dataZero.nodes;
        data.links = dataZero.links;

        data = updateData(data);

        //debugger;
        /**
         * Stores link sum to target state, adds sourceId and target id properties to links
         */
        function updateData(data) {
            for (var i = data.nodes.length - 1; i >= 0; i--) {
                var stateName = data.nodes[i].name;
                // create new property for nodes and add up values from links
                //  where ever this is the target state
                data.nodes[i].context = [];
                data.nodes[i].context.push({
                    "name": "summation",
                    "value": 0
                });

                for (var j = data.links.length - 1; j >= 0; j--) {
                    var source = data.links[j].source;
                    var target = data.links[j].target;
                    if (target == stateName) {
                        for (var k = 0; k < data.links[j].context.length; k++) {
                            data.nodes[i].context[0].value += data.links[j].context[k].value;
                        }
                        data.links[j].targetID = i;
                        //data.nodes[i].context[1].value += data.links[j].context[1].value;
                    }
                    if (source == stateName) {
                        data.links[j].sourceID = i;
                    }
                }
                ;
                // special case INIT state, is not targeted by any, so its gets a special group and color
                //if( (data.nodes[i].context[0].value + data.nodes[i].context[1].value) == 0 ) {
                //    data.nodes[i].context[3].value = 5; // INIT devices
                //  }

            }
            return data;
        }


        /**
         * Checks if nodeA is connected to nodeB using BFS
         * @param nodeA - the selected node
         * @param nodeB - the goal node
         * @returns {boolean}
         */

        function areNodesConnected(nodeA, nodeB) {

            var sourceLinks = nodeB.sourceLinks;
            var targetLinks = nodeB.targetLinks;

            var isConnected = false;
            sourceLinks.forEach(function (el) {
                if (el.source.name == nodeA.name)
                    isConnected = true;
                if (el.target.name == nodeA.name)
                    isConnected = true;
            });

            targetLinks.forEach(function (el) {
                if (el.source.name == nodeA.name)
                    isConnected = true;
                if (el.target.name == nodeA.name)
                    isConnected = true;
            });

            var remainingNodes = [],
                nextNodes = [];
            var traverse = [
                //    {
                //    linkType : "targetLinks",
                //    nodeType : "source"
                //},
                {
                    linkType: "sourceLinks",
                    nodeType: "target"
                }];

            traverse.forEach(function (step) {
                nodeB[step.linkType].forEach(function (link) {
                    remainingNodes.push(link[step.nodeType]);
                });

                while (remainingNodes.length) {
                    nextNodes = [];
                    remainingNodes.forEach(function (node) {
                        node[step.linkType].forEach(function (link) {
                            nextNodes.push(link[step.nodeType]);
                            if (node.name == nodeA.name) {
                                // found a path to selected node
                                isConnected = true;
                            }
                        });
                    });
                    remainingNodes = nextNodes;
                }
            });
            return isConnected;

        }

        function drawPath(data, svg, selectedNode) {

            var node = svg.selectAll(".node rect")
                .style("visibility", function (d) {
                    return "hidden";
                })
                .filter(function (d) {
                    var vale = areNodesConnected(selectedNode, d);
                    return vale;
                })
                .style("fill", function (d) {
                    return d.color = colorNodes(d.name.replace(/ .*/, ""));
                })
                .style("visibility", function (d) {
                    return "visible";
                });

            var nodeText = svg.selectAll(".node text")
                .style("visibility", function (d) {
                    return "hidden";
                })
                .filter(function (d) {
                    var vale = areNodesConnected(selectedNode, d);
                    return vale;
                })
                .style("visibility", function (d) {
                    return "visible";
                })


            var linkPath = svg.selectAll(".link")
                .style("visibility", function (d) {
                    return "hidden";
                })
                .filter(function (d) {
                    var vale = areNodesConnected(selectedNode, d.target);
                    return vale;
                })
                .style("visibility", function (d) {
                    return "visible";
                });

            var linkText = svg.selectAll(".textpath")
                .style("visibility", function (d) {
                    return "hidden";
                })
                .filter(function (d) {
                    //debugger;
                    var vale = areNodesConnected(selectedNode, d.target);
                    return vale;
                })
                .style("visibility", function (d) {
                    return "visible";
                });

            var pi = Math.PI;

            var arc = d3.svg.arc()
                .innerRadius(0)
                .outerRadius(function (d) {
                    var sum = d3.sum(d.sourceLinks, function (d) {
                        return d.context[0].value;
                    })

                    return 10;
                    var stroke = ( d.dy - ( sum * d.dy / d.value) );
                    return stroke;

                })
                .startAngle(0 * (pi / 180)) //converting from degs to radians
                .endAngle(pi / 2) // 1/4 of a circle - 90 degrees

            var dropOffs = svg.selectAll(".dropoff-arc")
                .style("visibility", function (d) {
                    return "hidden";
                })
                .filter(function (d) {
                    return areNodesConnected(selectedNode, d);
                })
                .filter(function (d) {
                    var sum = d3.sum(d.sourceLinks, function (d) {
                        return d.context[0].value;
                    })
                    return d.value > 0 && (d.value - sum ) > 1;
                })
                .attr("fill", function (d, i) {
                    return "red";
                })
                .attr("d", arc)
                .attr("transform", function (d) {
                    var sum = d3.sum(d.sourceLinks, function (d) {
                        return d.context[0].value;
                    })

                    var stroke = ( d.dy - ( sum * d.dy / d.value) );
                    var x0 = d.x + d.dx,
                    y0 = d.y + d.dy - stroke + 10;

                    return "translate(" + x0 + "," + y0 + " )";

                }).style("visibility", function (d) {
                    return "visible";
                });

            var dropOffLines = svg.selectAll(".dropoffline")
                .style("visibility", function (d) {
                    return "hidden";
                })
                .filter(function (d) {
                    var vale = areNodesConnected(selectedNode, d);
                    return vale;
                })
                .filter(function (d) {
                    var sum = d3.sum(d.sourceLinks, function (d) {
                        return d.context[0].value;
                    })
                    return d.value > 0 && (d.value - sum ) > 1;
                })
                //.attr("opacity", 0.5)
                .attr("width", 10)
                .attr("fill", "url(#line-gradient)")
                .attr("x", function (d) {
                    var x0 = d.x + d.dx;
                    return x0;
                })
                .attr("y", function (d) {
                    var sum = d3.sum(d.sourceLinks, function (d) {
                        return d.context[0].value;
                    });
                    var stroke = ( d.dy - ( sum * d.dy / d.value) );
                    var y1 = d.y + d.dy - stroke + 10;
                    return y1;
                })
                //.attr("x2", function (d) {
                //    var x0 = d.x + d.dx + 5;
                //    ;
                //    return x0;
                //})
                .attr("height", function (d) {

                    var sum = d3.sum(d.sourceLinks, function(_) {
                        return _.dy;
                    })

                    var y1 =  d.dy;
                    return d.dy-sum;
                })
                .style("visibility", function (d) {
                    return "visible";
                })

        }

        function drawSankey(data, svg) {

            /**
             * Group for link text and links
             */

            var group = svg.append("g");

            var link = group.selectAll(".link")
                .data(data.links)
                .enter().append("path")
                .attr("class", function (d) {
                    return "link " + d.context[0].name;
                })
                .attr("id", function (d, i) {
                    return "path_" + i;
                })
                .attr("d", path)
                .style("stroke-width", function (d) {
                    return Math.max(1, d.dy);
                })
                .attr("stroke", function (d, i) {
                    return colorLinks(d.context[0].name);
                })
                .sort(function (a, b) {
                    return b.dy - a.dy;
                })

            var title = link.append("title")
                .text(function(d) {
                    return d.context[0].value;
                });

            var linkText = group.selectAll(".linkText")
                .data(data.links)
                .enter()
                .append("text")
                .attr("x", 50)
                .attr("dy", 0)
                .append("textPath")
                .attr("class", "textpath")
                .text(function (d) {
                    return d.context[0].name;
                })
                .attr("xlink:href", function (d, i) {
                    return "#path_" + i;
                });


            var dropOffs = svg.selectAll(".dropoff")
                .data(data.nodes)
                .enter()
                .append("path")
                .attr("class", "dropoff-arc");


            var dropOfflines = svg.selectAll(".dropofflines")
                .data(data.nodes)
                .enter()
                .append("rect")
                .attr("class", "dropoffline");

            dropOfflines
                .on("mouseover", function (d) {
                    d3.select("#tooltipChart h2").html("Dropoff")
                    showDropoff(d);
                    d3.select("#tooltipChart")
                        .style("visibility", "visible")
                        .style("left", d3.event.pageX + "px")
                        //.attr("height", 50)
                        .style("top", d3.event.pageY + "px");

                })
                .on("mousemove", function () {
                    return d3.select("#tooltipChart")
                        .style("top",
                        (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
                })
                .on("mouseout", function () {
                    return d3.select("#tooltipChart").style("visibility", "hidden");
                });


            var node = svg.append("g").selectAll(".node")
                .data(data.nodes)
                .enter().append("g")
                .attr("id", function (d, i) {
                    return "node_" + i;
                })
                .attr("class", "node")
                .attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                })
                //.call(d3.behavior.drag()
                //    .origin(function (d) {
                //        return d;
                //    })
                //    .on("dragstart", function () {
                //        this.parentNode.appendChild(this);
                //    })
                //    .on("drag", dragmove));

            /**
             * Displays node;
             */

            node.append("rect")
                .attr("height", function (d) {
                    return d.dy;
                })
                .attr("width", sankey.nodeWidth())
                .style("fill", function (d) {
                    return d.color = colorNodes(d.name.replace(/ .*/, ""));
                });


            /**
             * Display node value in center of node
             */

            node.append("text")
                .text(function (d) {
                    return d.value;
                })
                .attr("x", function (d) {
                    //debugger;
                    return 15;
                })
                .attr("y", function (d) {
                    return d.dy / 2;
                })
                .attr("text-anchor", "middle");


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
                    return d.name.replace(/ .*/, "");
                })
                .filter(function (d) {
                    return d.x < width / 2;
                })
                .attr("x", 5 + sankey.nodeWidth())
                .attr("text-anchor", "start");

            node
                .on("click", function (d, index) {

                    if (d.sourceLinks.length > 0)
                        drawPath(data, svg, d);

                });


            /**
             * Select single link with mouse and show stacked bar of target device context
             */
            //link
            //.on("click", function (d, index) {
            //
            //    if (this.className.baseVal.indexOf("selectedLink") >= 0) {
            //        svg.selectAll(".link")
            //            .classed("selectedLink", false)
            //    } else {
            //        svg.selectAll(".link")
            //            .classed("selectedLink", function (d, i) {
            //                return index === i;
            //            })
            //    }
            //
            //    showChartOnHover(d);
            //    refreshText();
            //
            //});

            /**
             * Shows link name on hover
             */
            link
                .on("click", function (d, i) {

                    //debugger;

                    d3.selectAll(".link")
                        .style("stroke", function (d2, i) {
                            return colorLinks(d2.context[0].name);
                        });


                    t.stroke(colorLinks(d.context[0].name));
                    svg.call(t);

                    d3.select(this)
                        .style("stroke", t.url());


                    drawMatrix(d);

                })
                .on("mousemove", function () {
                    return d3.select("#tooltipChart")
                        .style("top",
                        (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
                })
                .on("mouseout", function () {
                    return d3.select("#tooltipChart").style("visibility", "hidden");
                });




            node
                .on("mouseover", function (d) {

                    /**
                     *
                     * temporary fix :) #324
                     */
                    d3.select("#tooltipChart h2").html(d.name);
                   var p = d3.select("#tooltipChart p");
                    p.html("Avg session time: 34.1s <br/> " +
                    "Avg. # of interactions: 8.4 <br/> " +
                    "Dropoff: 32/77")

                    //d3.select("#tooltipChart svg").html();
                    svgChart.selectAll("*").remove();

                    //showActivitiesChartOnHover(d);
                    d3.select("#tooltipChart")
                        .style("visibility", "visible")
                        .style("left", d3.event.pageX + "px")
                        .style("top", d3.event.pageY + "px");

                })
                .on("mousemove", function () {
                    return d3.select("#tooltipChart")
                        .style("top",
                        (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
                })
                .on("mouseout", function () {
                    return d3.select("#tooltipChart").style("visibility", "hidden");
                });


            /**
             * move path(link) as you drag node
             * @param d
             */
            //function dragmove(d) {
            //
            //    d3.select(this).attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
            //    groups.attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
            //    sankey.relayout();
            //    //debugger;
            //    link.attr("d", path);
            //
            //}

        }

        //var tooltip = d3.select(".tooltipChart")
        //    .append("div")
        //    .style("position", "absolute")
        //    .style("z-index", "10")
        //    .style("visibility", "hidden")
        //    .text("a simple tooltip");

        var padding = 28;
        var format2Number = d3.format(",.2f"),
            formatNumber = d3.format(",.0f"),
            format = function (a) {
                return formatNumber(a)
            },
            format2 = function (a) {
                return format2Number(a)
            },
            percentageFormat = d3.format("%");

        var margin = {
                top: 150,
                right: 100,
                bottom: 50,
                left: 40
            },
            width = 900 - margin.left - margin.right,
            height = 400 - margin.bottom;

        var svg = d3.select(targetElementId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var sankey = d3.sankey().nodeWidth(30).nodePadding(padding).size([width, height ]);
        var path = sankey.link();


        var t = textures.lines()
            .heavier(10)
            .thinner(1.5);
            //.size(16)
            //.strokeWidth(8);
            //.data([1,2,3])();
        svg.call(t);

        var y = d3.scale.linear()
            .range([200, 0]);

        svg.append("defs")
            .append("svg:linearGradient")
            .attr("id", "line-gradient")
            //.attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%")
            .selectAll("stop")
            .data([
                {offset: "0%", color: "red"},
                {offset: "40%", color: "red"},
                //{offset: "75%", color: "red"},
                //{offset: "90%", color: "white"},
                {offset: "100%", color: "white"}
            ])
            .enter().append("stop")
            .attr("offset", function (d) {
                return d.offset;
            })
            .attr("stop-color", function (d) {
                return d.color;
            })
            //.attr("start-opacity", function (d) {
            //    return 1;
            //})
            //.attr("stop-opacity", function (d) {
            //    return 1;
            //});


        sankey
            .nodes(data.nodes)
            .links(data.links)
            .layout(32);


        drawSankey(data, svg, data.nodes[0]);
        drawPath(data, svg, data.nodes[0]);


        //showContextBar(data.links[0]);
        //stack(data.links[0].targetContext);
        //var stack = d3.layout.stack();

        // Add a group for each row of data
        var groups = svg.append("g").selectAll(".context")
            .data(data.links[0].targetContext)
            .enter()
            .append("g");


        var svgChart = d3.select("#tooltipChart")
            .append("svg")
            .attr("width", 250)
            .attr("height", 100);

        //var arcs = svgChart.append("g").selectAll("arcs.nodes")
        //    .data(data.links[0].targetContext)
        //    .enter()
        //    .append("g");

        function showChartOnHover(link) {

            //var sum = d3.sum(link.targetContext, function (a) {
            //    return a.value;
            //});
            //
            //var yScale = d3.scale.linear()
            //    .domain([0, sum])
            //    .range([0, link.dy]);
            //var newdata = link.targetContext;
               //

            svgChart.selectAll("*").remove();
            svgChart
                .transition()
                .attr("height", 80)
                .attr("width", 80);

            //var pie = d3.layout.pie()
            //    .sort(null)
            //    .value(function (d) {
            //        return d.value;
            //    });

            /**
             * D3 arc helper for calculation of arcs parameters
             */
            //var arc = d3.svg.arc()
            //    .outerRadius(40)
            //    .innerRadius(0);
            //
            //var arcs = svgChart.append("g").selectAll("arc.nodes")
            //    .data(pie(newdata))
            //    .enter()
            //    .append("g")
            //    .attr("fill", "black")
            //    .attr("r", function (d) {
            //        return 20;
            //    })
            //    .attr("class", "arc")
            //    .attr("transform", "translate(" + (40) + ", " + (40  ) + ")");
            //
            //
            //arcs.append("path")
            //    .attr("fill", function (d) {
            //        return colorLinks(d.data.name);
            //    })
            //    .attr("d", arc);
            //
            //arcs.append("text")
            //    .attr("transform", function (d) {
            //        return "translate(" + arc.centroid(d) + ")";
            //    })
            //    .attr("dy", ".35em")
            //    .style("text-anchor", "middle")
            //    .text(function (d) {
            //        return percentageFormat(d.value / sum);
            //    });

            /**
             * Legend for tooltip piechart
             */
            //var legend = svgChart.append("g")
            //    .selectAll("circle.legend")
            //    .data(newdata)
            //    .enter()
            //    .append("g")
            //    .attr("transform", function (d, i) {
            //
            //        d.x = 100,
            //            d.y = i * 20 + 10;
            //        return "translate(" + d.x + "," + d.y + ")";
            //    });
            //
            //legend.append("circle")
            //    .attr("fill", function (d) {
            //        //debugger;
            //        return colorLinks(d.name);
            //    })
            //    .attr("r", function (d) {
            //        return 5;
            //    });
            //
            //legend.append("text")
            //    .text(function (d) {
            //        return d.name + "(" + d.value + "/" + sum + ")";
            //    })
            //    .attr("x", function (d) {
            //        return 10;
            //    })
            //    .attr("y", function (d) {
            //        return 5;
            //    });


        }


        /**
         * Shows activities pie chart at a node
         * @param node
         */

        function showActivitiesChartOnHover(node) {


            var sum = d3.sum(node.activities, function (a) {
                return a.value;
            });

return;
            var newdata = node.activities;
            svgChart.selectAll("*").remove();
//debugger;
            svgChart
                .transition()
                .attr("height", 80);

            var pie = d3.layout.pie()
                .sort(null)
                .value(function (d) {
                    return d.value;
                });

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
                .attr("fill", "black")
                .attr("r", function (d) {
                    return 20;
                })
                .attr("class", "arc")
                .attr("transform", "translate(" + (40) + ", " + (40  ) + ")");


            arcs.append("path")
                .attr("fill", function (d) {
                    return colorLinks(d.data.name);
                })
                .attr("d", arc);

            arcs.append("text")
                .attr("transform", function (d) {
                    return "translate(" + arc.centroid(d) + ")";
                })
                .attr("dy", ".35em")
                .style("text-anchor", "middle")
                .text(function (d) {
                    return percentageFormat(d.value / sum);
                });

            /**
             * Legend for tooltip piechart
             */
            var legend = svgChart.append("g")
                .selectAll("circle.legend")
                .data(newdata)
                .enter()
                .append("g")
                .attr("transform", function (d, i) {

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
        }

        function showDropoff(node) {

            //debugger;
            //var sum = d3.sum(node.sourceLinks, function (d) {
            //    return d.context[0].dropoffvalue;
            //});
            //
            ////var newdata = node.activities;
            //
            //
            //
            //svgChart.selectAll("*").remove();
            //svgChart
            //    .transition()
            //    .attr("height", 20);
            //
            //svgChart
            //    .append("text")
            //    .attr("height", "100px")
            //    .attr("transform", function (d) {
            //        return "translate( 10 , 10)";
            //    })
            //    //.attr("dy", "3em")
            //    .style("text-anchor", "left")
            //    .text(function (d) {
            //
            //        var part = node.value-sum;
            //        var per = percentageFormat(part/(sum+part));
            //
            //        return part + " of total "+ (sum+part) + " ("+per+")";
            //    });



            var sum = d3.sum(node.sourceLinks, function (d){
                return d.context[0].dropoffvalue;
            });

            // combines same context from different device switches
            var nest = d3.nest()
                .key(function(d) {
                    return d.context[0].name})
                .entries(node.sourceLinks);

            nest.map(function (d) {
                d.value = d3.sum(d.values, function(el) {
                    return el.context[0].dropoffvalue;
                });
                return d;
            });
            //console.log(nest)



            var newdata = nest;

            d3.selectAll("#tooltipChart p").html("");
            svgChart.selectAll("*").remove()
            //
            //svgChart
            //    .transition()
            //    .attr("height", 80);


            var pie = d3.layout.pie()
                .sort(null)
                .value(function (d) {
                    //debugger;
                    return d.value;
                });
    //debugger;
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
                .attr("fill", "black")
                .attr("r", function (d) {
                    return 20;
                })
                .attr("class", "arc")
                .attr("transform", "translate(" + (40) + ", " + (40  ) + ")");


            arcs.append("path")
                .attr("fill", function (d) {
                    //debugger;
                    return colorLinks(d.data.key);
                })
                .attr("d", arc);

            arcs.append("text")
                .attr("transform", function (d) {
                    return "translate(" + arc.centroid(d) + ")";
                })
                .attr("dy", ".35em")
                .style("text-anchor", "middle")
                .text(function (d) {
                    //debugger;
                    return percentageFormat( d.value / sum);
                });

            /**
             * Legend for tooltip piechart
             */
            var legend = svgChart.append("g")
                .selectAll("circle.legend")
                .data(newdata)
                .enter()
                .append("g")
                .attr("transform", function (d, i) {

                    d.x = 100,
                        d.y = i * 20 + 10;
                    return "translate(" + d.x + "," + d.y + ")";
                });

            legend.append("circle")
                .attr("fill", function (d) {
                    //debugger;
                    return colorLinks(d.key);
                })
                .attr("r", function (d) {
                    return 5;
                });

            legend.append("text")
                .text(function (d) {
                    //debugger;
                    return d.key + "(" + d.value + "/" + sum + ")";
                })
                .attr("x", function (d) {
                    return 10;
                })
                .attr("y", function (d) {
                    return 5;
                });

        }


        //var hideTooltip = function () {
        //    // Hide the tooltip
        //    var tooltip = d3.select("#tooltip")
        //        .style("visibility", "hidden");
        //
        //};

        function transform(d) {
            return "translate(" + d.x + "," + d.y + ")";
        }

        function calcRadius(d) {
            var sum = getcontext(d).reduce(add, 0);
            return sum;
        }

        function add(a, b) {
            return a + b.value;
        }
    });
};


//createLegend("#chartLegend",devices, colorNodes);
//createLegend("#chartLegend",userActivities, colorLinks);
//createLegend("#chartLegend", userActivities, colorLinks);
createSankey("data/interactions-phone-android.json", "#chart-1");
//createSankey("data/interactions-watch-user.json" , "#chart-2");

