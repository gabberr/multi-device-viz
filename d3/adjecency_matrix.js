function drawMatrix(data) {


    var margin = {top: 120, right: 10, bottom: 50, left: 200},
        width = 240,
        height = 240;

    // max for opacity 1 red
    var max = d3.max(data.targetContext, function(d){return d.value;}),
        x = d3.scale.ordinal().rangeBands([0, width]),
        z = d3.scale.linear().domain([0, max ]).clamp(true),
        c = d3.scale.category10().domain(d3.range(10));

    d3.select("#matrix-chart")
        .style("display", "block")


    d3.select("#matrix").remove();

    var svg = d3.select("#matrix-chart").append("svg")
        .attr("id", "matrix")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        //.style("margin-left", margin.left   + "px")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + (margin.top+30) + ")");

    svg.insert("text")
        .text(function() {
            return "Device switch";
        })
        .attr("y", - 65)
        .attr("x", - 150);

    svg.insert("text")
        .text(function() {
            return "User activity: " + data.context[0].name;
        })
        .attr("y", - 50)
        .attr("x", - 150);

    svg.insert("text")
        .text(function() {

            return data.source.name + " → " + data.target.name;
        })
        .attr("y", - 35)
        .attr("x", - 150);

    var targetTitle = svg.append("text")
            .classed("device-name",true)
        .text(function() {
            return "Target activities on " + data.target.name;
        })
            .attr("text-anchor", "middle")
        .attr("x", 100)
        .attr("y", -120)
        ;

    var sourceTitle = svg.append("text")
        .classed("device-name", true)
        .text(function() {
            return "Source activities on" + data.source.name;
        })
        .attr("text-anchor", "middle")
        .attr("transform", function (d, i) {
            return "translate(-120, "+ height/2 +") rotate(-90)";
        })




    var nodesSource = [
        { name:"MainActivity"},
        {name:"OpenListActivity"},
        {name:"SettingsActivity"},
        {name:"RenameItemActivity"},
        {name:"AddItemActivity"},
        {name:"PAUSE"}];

    var nodesTaget = [
        { name:"MainActivity"},
        {name:"OpenListActivity"},
        {name:"SettingsActivity"},
        //{name:"RenameItemActivity"},
        {name:"AddItemActivity"},
        {name:"PAUSE"}];


    function findIndex(nodename, nodes) {
        var index = -1;
        nodes.forEach(function(n, i) {
            if(n.name==nodename)
            index = i;
        })
        return index;
    }

    var links = data.targetContext.map(function(obj) {
            var nobj = {};
            nobj.source = findIndex(obj.source,nodesSource);
            nobj.target = findIndex(obj.target,nodesTaget);
            nobj.value = obj.value;
            return nobj;
        }

    )


    var activities = {};
    activities.nodes = nodesSource;
    activities.links = links;
    activities.source = data.source;
    activities.target =data.target;
    make(activities);



    function make(activities) {
        var matrix = [],
            nodes = activities.nodes,
            n = nodes.length;

        // Compute index per node.
        nodes.forEach(function (node, i) {
            node.index = i;
            node.count = 0;
            matrix[i] = d3.range(n).map(function (j) {
                return {x: j, y: i, z: 0};
            });
        });

        // Convert links to matrix;
        activities.links.forEach(function (link) {
            //matrix[link.source][link.target].z += link.value;
            //matrix[link.target][link.source].z += link.value;
            //matrix[link.source][link.source].z += link.value;
            //matrix[link.target][link.target].z += link.value;
            //nodes[link.source].count += link.value;
            //nodes[link.target].count += link.value;

            matrix[link.source][link.target].z += link.value;
            //nodes[link.source].count += link.value;
            //nodes[link.target].count += link.value;

        });

        // Precompute the orders.
        //var orders = {
        //    name: d3.range(n).sort(function (a, b) {
        //        return d3.ascending(nodes[a].name, nodes[b].name);
        //    }),
        //    count: d3.range(n).sort(function (a, b) {
        //        return nodes[b].count - nodes[a].count;
        //    }),
        //    group: d3.range(n).sort(function (a, b) {
        //        return nodes[b].group - nodes[a].group;
        //    })
        //};
        //


        // The default sort order.
        x.domain(d3.range(n));

        svg.append("rect")
            .attr("class", "background")
            .attr("fill", "white")
            .attr("width", width)
            .attr("height", height);

        var row = svg.selectAll(".row")
            .data(matrix)
            .enter().append("g")
            .attr("class", "row")
            .attr("transform", function (d, i) {
                return "translate(0," + x(i) + ")";
            })
            .each(row);

        row.append("line")
            .attr("x2", width);

        row.append("text")
            .attr("x", -8)
            .attr("y", x.rangeBand() / 2)
            .attr("dy", ".32em")
            .attr("text-anchor", "end")
            .attr("fill", function(d, i) {

                return colorNodes(activities.source.name.replace(/ .*/, ""));

            })
            .text(function (d, i) {
                return nodes[i].name;
            });

        var column = svg.selectAll(".column")
            .data(matrix)
            .enter().append("g")
            .attr("class", "column")
            .attr("transform", function (d, i) {
                return "translate(" + x(i) + ")rotate(-90)";
            });

        column.append("line")
            .attr("x1", -width);

        column.append("text")
            .attr("x", 6)
            .attr("y", x.rangeBand() / 2)
            .attr("dy", ".32em")
            .attr("text-anchor", "start")
            .attr("fill", function(d, i) {

                return colorNodes(activities.target.name.replace(/ .*/, ""));

            })
            .text(function (d, i) {
                return nodes[i].name;
            });

        function row(row) {
            var cell = d3.select(this).selectAll(".cell")
                .data(row.filter(function (d) {
                    return d.z;
                }))
                .enter().append("rect")
                .attr("class", "cell")
                .attr("x", function (d) {
                    return x(d.x);
                })
                .attr("width", x.rangeBand())
                .attr("height", x.rangeBand())
                .style("fill-opacity", function (d) {
                    return z(d.z);
                })
                .style("fill", function (d) {
                    return "red";
                    //return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null;
                })
                .on("mouseover", mouseover)
                .on("mouseout", mouseout)

                .append("title")
                .text(function (d) {
                    return d.z;
                });

        }

        function mouseover(p) {
            //debugger;
            d3.selectAll(".row text").classed("active", function (d, i) {
                return i == p.y;
            });
            d3.selectAll(".column text").classed("active", function (d, i) {
                return i == p.x;
            });
        }

        function mouseout() {
            d3.selectAll("text").classed("active", false);
        }

        d3.select("#order").on("change", function () {
            clearTimeout(timeout);
            order(this.value);
        });

        function order(value) {
            x.domain(orders[value]);

            var t = svg.transition().duration(2500);

            t.selectAll(".row")
                .delay(function (d, i) {
                    return x(i) * 4;
                })
                .attr("transform", function (d, i) {
                    return "translate(0," + x(i) + ")";
                })
                .selectAll(".cell")
                .delay(function (d) {
                    return x(d.x) * 4;
                })
                .attr("x", function (d) {
                    return x(d.x);
                });

            t.selectAll(".column")
                .delay(function (d, i) {
                    return x(i) * 4;
                })
                .attr("transform", function (d, i) {
                    return "translate(" + x(i) + ")rotate(-90)";
                });
        }

    //    var timeout = setTimeout(function () {
    //        order("group");
    //        d3.select("#order").property("selectedIndex", 2).node().focus();
    //    }, 5000);
    };



}

//drawMatrix(null,null);