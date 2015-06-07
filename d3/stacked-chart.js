function drawStackedChart(data) {

    //stack(data.links[0].targetContext);
    var stack = d3.layout.stack();

    data = [
        {
            androidActivity: "MainActivity",
            Walking: 32,
            "On Foot": 0,
            Still: 30,
            Unknown: 0
        },
        {
            androidActivity: "OpenListActivity",
            Walking: 16,
            "On Foot": 0,
            Still: 12,
            Unknown: 10
        },

        {
            androidActivity: "SettingsActivity",
            Walking: 3,
            "On Foot": 0,
            Still: 5,
            Unknown: 1

        },

        {
            androidActivity: "AddItemActivity",
            Walking: 3,
            "On Foot": 8,
            Still: 9,
            Unknown: 1

        }

    ]


    var margin = {top: 100, right: 60, bottom: 120, left: 40},
        width = 400 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
        .rangeRound([height, 0]);

    var color = d3.scale.ordinal()
        .range(['rgb(178,24,43)','rgb(239,138,98)','rgb(253,219,199)','rgb(224,224,224)','rgb(153,153,153)','rgb(77,77,77)']);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(7)
        .tickFormat(d3.format("2s"));

    var svg = d3.select("#stacked-chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        color.domain(d3.keys(data[0]));

        // Map our columns to our colors
        color.domain(d3.keys(data[0]).filter(function (key) {
            return key !== "androidActivity";
        }));


        color.range = colorLinks.range;

        data.forEach(function (d) {
            var y0 = 0;
            d.types = color.domain().map(function (name) {
                return {
                    name: name,
                    y0: y0,
                    y1: y0 += +d[name]
                };
            });
            d.total = d.types[d.types.length - 1].y1;
        });




        x.domain(data.map(function(d) { return d.androidActivity; }));

        y.domain([0, 1.5 * d3.max(data, function(d) { return d.total; })]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", function(d) {
                    return "rotate(-65)"
                });


    svg.insert("text")
        .text(function() {
            return "Device: Phone";
        })
        .attr("y", -10)
        .attr("x", 0);


    var year = svg.selectAll(".year")
        .data(data)
        .enter().append("g")
        .attr("class", "g")

        .attr("transform", function (d) {
            return "translate(" + x(d.androidActivity) + ",0)";
        });

    var cols = year.selectAll("rect")
        .data(function (d) {
            return d.types;
        })
        .enter().append("rect")
        .attr("width", x.rangeBand())
        .attr("y", function (d) {
            return y(d.y1);
        })
        .attr("height", function (d) {
            return y(d.y0) - y(d.y1);
        })
        .style("fill", function (d) {
            return color(d.name);
        })

    var colTitle = cols.append("title")
        .text(function (d) {
            return d.y1;
        });


    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("#visits");

        var legend = svg.selectAll(".legend")
            .data(color.domain().slice().reverse())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

        legend.append("rect")
            .attr("x", width - 18)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", color);

        legend.append("text")
            .attr("x", width - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function(d) { return d; });

}

drawStackedChart(null);