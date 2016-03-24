registerKeyboardHandler = function(callback) {
  var callback = callback;
  console.log("here2");
  d3.select(window).on("keydown", callback);  
};

d3.json("pulsar_data_test.json", function(data){

    var sorted = []
    SimpleGraph = function(elemid, options) {

    var self = this;
    this.chart = document.getElementById(elemid);
    this.cx = this.chart.clientWidth;
    this.cy = this.chart.clientHeight;
    this.options = options || {};
    this.options.xmax = options.xmax || 30;
    this.options.xmin = options.xmin || 0;
    this.options.ymax = options.ymax || 10;
    this.options.ymin = options.ymin || 0;

    this.padding = {
        "top":    this.options.title  ? 40 : 20,
        "right":  30,
        "bottom": this.options.xlabel ? 60 : 10,
        "left":   this.options.ylabel ? 90 : 45
    };

    this.size = {
        "width":  this.cx - this.padding.left - this.padding.right,
        "height": this.cy - this.padding.top  - this.padding.bottom
    };

  // x-scale
    this.x = d3.scale.linear()
               .domain([(this.options.xmin)*1000, (this.options.xmax)*1000])
               .range([0, this.size.width]);

  this.downx = Math.NaN;

  // y-scale (inverted domain)
    this.y = d3.scale.linear()
               .domain([(this.options.ymax), (this.options.ymin)])
               .nice()
               .range([0, this.size.height])
               .nice();

    this.downy = Math.NaN;

    this.dragged = this.selected = null;

    this.line = d3.svg.line()
                  .x(function(d, i) { return this.x(this.points[i].x); })
                  .y(function(d, i) { return this.y(this.points[i].y); });

    var xrange =  (this.options.xmax - this.options.xmin),
        yrange2 = (this.options.ymax - this.options.ymin) / 2,
        yrange4 = yrange2 / 2;

    this.datacount = 37;
  
    for(var x in data)
        sorted.push([data[x]['Period'], data[x]['Period Derivative'], x])
    sorted.sort(function(a, b) { return a[0] - b[0]; });
  
    this.points = d3.range(this.datacount).map(function(i) { 
        return { x: sorted[i][0]*1000, y: Math.log(sorted[i][1]) }; 
    }, self);

    this.vis = d3.select(this.chart).append("svg")
                 .attr("width",  this.cx)
                 .attr("height", this.cy)
                 .append("g")
                    .attr("transform", "translate(" + this.padding.left + "," + this.padding.top + ")");

    this.plot = this.vis.append("rect")
                    .attr("width", this.size.width)
                    .attr("height", this.size.height)
                    .style("fill", "#FFF")
                    .attr("pointer-events", "all")
                    .on("mousedown.drag", self.plot_drag())
                    .on("touchstart.drag", self.plot_drag())
    this.plot.call(d3.behavior.zoom().x(this.x).y(this.y).on("zoom", this.redraw()));

    this.vis.append("svg")
            .attr("top", 0)
            .attr("left", 0)
            .attr("width", this.size.width)
            .attr("height", this.size.height)
            .attr("viewBox", "0 0 "+this.size.width+" "+this.size.height)
            .attr("class", "line")
            .append("path")
                .attr("class", "line")
                .attr("d", this.line(this.points));

  // add Chart Title
    this.vis.append("text")
            .attr("class", "axis")
            .text(this.options.title)
            .attr("x", this.size.width/2)
            .attr("dy","-0.2em")
            .style("text-anchor","middle")
            .style("font-family", "serif")
            .style("font-weight", "bold")
            .style("font-size", "33px");

  // Add the x-axis label
    this.vis.append("text")
            .attr("class", "axis")
            .text(this.options.xlabel)
            .attr("x", this.size.width/2)
            .attr("y", this.size.height)
            .attr("dy","2.4em")
            .style("text-anchor","middle");

  // add y-axis label
    this.vis.append("g").append("text")
            .attr("class", "axis")
            .text(this.options.ylabel)
            .style("text-anchor","middle")
            .attr("transform","translate(" + -70 + " " + this.size.height/2+") rotate(-90)");

    d3.select(this.chart)
      .on("mousemove.drag", self.mousemove())
      .on("touchmove.drag", self.mousemove())
      .on("mouseup.drag",   self.mouseup())
      .on("touchend.drag",  self.mouseup());

    this.redraw()();
    };
  
//
// SimpleGraph methods
//

    SimpleGraph.prototype.add_point = function(values){
        var self = this;
        var newpoint = {};
        for(var i in values)
            newpoint[i] = values[i];
        data.push(newpoint);

        sorted = [];
        for(var x in data)
            sorted.push([data[x]['Period'], data[x]['Period Derivative'], x])
        sorted.sort(function(a, b) { return a[0] - b[0]; });
        //console.log(sorted);
        this.datacount += 1;
        console.log(this.datacount);
        this.points = d3.range(this.datacount).map(function(i) { console.log(i);
            return { x: sorted[i][0]*1000, y: Math.log(sorted[i][1]) }; 
        }, self);
        self.update(null);
    }

    SimpleGraph.prototype.plot_drag = function() {
        var self = this;
        return function() {
        registerKeyboardHandler(self.keydown());
        d3.select('body').style("cursor", "move");
        }
    };

    SimpleGraph.prototype.update = function(threshold) {
        var self = this;
        var lines = this.vis.select("path").attr("d", this.line(this.points));
        
        var circle = this.vis.select("svg").selectAll("circle")
                             .data(this.points, function(d) { return d; });

        var div;
        var color = d3.scale.category20();

        circle.enter().append("circle")
                      .attr("class", function(d) { return d === self.selected ? "selected" : null; })
                      .attr("cx", function(d) { return self.x(d.x); })
                      .attr("cy", function(d) { return self.y(d.y); })
                      .attr("r", 4.5)
                      .attr("fill", function(d) { 
                              if(threshold == null)
                                  return color(Math.floor(d.x)+1); 
                              else{
                                if(d.y > threshold)
                                  return "red";
                                else
                                  return "green";
                              }
                           })
                      .on("mousedown",  self.datapoint_drag())
                      .on("mouseover", function(d, k){

                        if(self.selected){
                            return;
                        };

                        div = d3.select("#chart1").append("div")
                                .attr("class", "tooltip")
                                .style("opacity", 0);

                        div.transition()
                           .duration(200)
                           .style("opacity", 1);

                        div.html("<br><b>Pulsar: " + data[sorted[k][2]]['Pulsar']+"</b><br><br>"+
                           "Period: " + data[sorted[k][2]]['Period'] + "<br>"+
                           "Period Derivative: " + data[sorted[k][2]]['Period Derivative']
                        )
                        .style("left", (self.x(d.x) + 130)  + "px")
                        .style("top", (self.y(d.y)) + "px");
                          
                    })
                    .on("mouseout", function(d){
                        /*div.transition()
                           .duration(500)
                           .style("opacity", 0);*/

                        $('.tooltip').remove();
                            self.selected = null;
                    });
        circle
            .attr("class", function(d) { return d === self.selected ? "selected" : null; })
            .attr("cx",function(d) { 
                return self.x(d.x); })
            .attr("cy", function(d) { return self.y(d.y); })
            .attr("fill", function(d) { 
              if(threshold == null)
                  return color(Math.floor(d.x)+1); 
              else{
                if(d.y > threshold)
                  return "red";
                else
                  return "green";
              }
            })

        circle.exit().remove();

        if (d3.event && d3.event.keyCode) {
            d3.event.preventDefault();
            d3.event.stopPropagation();
        }
    };

    SimpleGraph.prototype.datapoint_drag = function() {
        var self = this;
        return function(d) {
            registerKeyboardHandler(self.keydown());
            document.onselectstart = function() { return false; };
            self.selected = d;//self.dragged = d;
            $('.tooltip').remove();
                self.update(null);
            }
    };

    SimpleGraph.prototype.mousemove = function() {
        var self = this;
        return function() {
            var p = d3.svg.mouse(self.vis[0][0]),
            t = d3.event.changedTouches;
    
            if (self.dragged) {
                self.dragged.y = self.y.invert(Math.max(0, Math.min(self.size.height, p[1])));
                self.update(null);
            };
            if (!isNaN(self.downx)) {
                d3.select('body').style("cursor", "ew-resize");
                var rupx = self.x.invert(p[0]),
                xaxis1 = self.x.domain()[0],
                xaxis2 = self.x.domain()[1],
                xextent = xaxis2 - xaxis1;
                if (rupx != 0) {
                    var changex, new_domain;
                    changex = self.downx / rupx;
                    new_domain = [xaxis1, xaxis1 + (xextent * changex)];
                    self.x.domain(new_domain);
                    self.redraw()();
                }
                d3.event.preventDefault();
                d3.event.stopPropagation();
            };
            if (!isNaN(self.downy)) {
                d3.select('body').style("cursor", "ns-resize");
                var rupy = self.y.invert(p[1]),
                yaxis1 = self.y.domain()[1],
                yaxis2 = self.y.domain()[0],
                yextent = yaxis2 - yaxis1;
                if (rupy != 0) {
                    var changey, new_domain;
                    changey = self.downy / rupy;
                    new_domain = [yaxis1 + (yextent * changey), yaxis1];
                    self.y.domain(new_domain);
                    self.redraw()();
                }
                d3.event.preventDefault();
                d3.event.stopPropagation();
            }
        }
    };

    SimpleGraph.prototype.mouseup = function() {
        var self = this;
        return function() {
            document.onselectstart = function() { return true; };
            d3.select('body').style("cursor", "auto");
            d3.select('body').style("cursor", "auto");
            if (!isNaN(self.downx)) {
                self.redraw()();
                self.downx = Math.NaN;
                d3.event.preventDefault();
                d3.event.stopPropagation();
            };
            if (!isNaN(self.downy)) {
                self.redraw()();
                self.downy = Math.NaN;
                d3.event.preventDefault();
                d3.event.stopPropagation();
            }
            if (self.dragged) { 
                self.dragged = null 
            }
        }
    }
    mydata = data;
    SimpleGraph.prototype.keydown = function() {
        var self = this;
        return function() {
            if (!self.selected) return;
            switch (d3.event.keyCode) {
                case 46: {
                    var i = self.points.indexOf(self.selected);
                    var point = self.points.splice(i, 1), data_point;
                    for(var i=0;i<data.length;++i){
                        if((data[i]['Period'])*1000 == point[0].x && Math.log(data[i]['Period Derivative']) == point[0].y){
                            data_point = data.splice(i, 1);
                            break;
                        }
                    }

                    sorted = [];
                    for(var x in data)
                        sorted.push([data[x]['Period'], data[x]['Period Derivative'], x])
                    sorted.sort(function(a, b) { return a[0] - b[0]; });
                    //console.log(sorted);
                    self.selected = null;
                    $('.tooltip').remove();
                    document.getElementById("text_message").innerHTML = "Data point deleted";
                    document.getElementById("message").style.visibility = "visible";
                    setTimeout(function(){
                        document.getElementById("message").style.visibility = "hidden";
                        }, 2000);

                    self.datacount -= 1;

                    self.update(null);
                    break;
                }
            }
        }
    };

    SimpleGraph.prototype.redraw = function() {
        var self = this;
        return function() {
            var tx = function(d) { 
                return "translate(" + self.x(d) + ",0)"; 
            },
            ty = function(d) { 
                return "translate(0," + self.y(d) + ")";
            },
            stroke = function(d) { 
                return d ? "#ccc" : "#666"; 
            },
            fx = self.x.tickFormat(10),
            fy = self.y.tickFormat(10);

    // Regenerate x-ticks…
            var gx = self.vis.selectAll("g.x")
                         .data(self.x.ticks(10), String)
                         .attr("transform", tx);

            gx.select("text")
              .text(fx);

            var gxe = gx.enter().insert("g", "a")
                        .attr("class", "x")
                        .attr("transform", tx);

            gxe.append("line")
               .attr("stroke", stroke)
               .attr("y1", 0)
               .attr("y2", self.size.height);

            gxe.append("text")
               .attr("class", "axis")
               .attr("y", self.size.height)
               .attr("dy", "1em")
               .attr("text-anchor", "middle")
               .text(fx)
               .style("cursor", "ew-resize")
               .on("mouseover", function(d) { d3.select(this).style("font-weight", "bold");})
               .on("mouseout",  function(d) { d3.select(this).style("font-weight", "normal");})
               .on("mousedown.drag",  self.xaxis_drag())
               .on("touchstart.drag", self.xaxis_drag());

            gx.exit().remove();

    // Regenerate y-ticks…
            var gy = self.vis.selectAll("g.y")
                         .data(self.y.ticks(10), String)
                         .attr("transform", ty);

            gy.select("text")
              .text(fy);

            var gye = gy.enter().insert("g", "a")
                        .attr("class", "y")
                        .attr("transform", ty)
                        .attr("background-fill", "#FFEEB6");

            gye.append("line")
               .attr("stroke", stroke)
               .attr("x1", 0)
               .attr("x2", self.size.width);

            gye.append("text")
               .attr("class", "axis")
               .attr("x", -3)
               .attr("dy", ".35em")
               .attr("text-anchor", "end")
               .text(fy)
               .style("cursor", "ns-resize")
               .on("mouseover", function(d) { d3.select(this).style("font-weight", "bold");})
               .on("mouseout",  function(d) { d3.select(this).style("font-weight", "normal");})
               .on("mousedown.drag",  self.yaxis_drag())
               .on("touchstart.drag", self.yaxis_drag());

            gy.exit().remove();
            self.plot.call(d3.behavior.zoom().x(self.x).y(self.y).on("zoom", self.redraw()));
            self.update(null);    
        }  
    }

    SimpleGraph.prototype.xaxis_drag = function() {
        var self = this;
        return function(d) {
            document.onselectstart = function() { return false; };
            var p = d3.svg.mouse(self.vis[0][0]);
            self.downx = self.x.invert(p[0]);
        }
    };

    SimpleGraph.prototype.yaxis_drag = function(d) {
        var self = this;
        return function(d) {
            document.onselectstart = function() { return false; };
            var p = d3.svg.mouse(self.vis[0][0]);
            self.downy = self.y.invert(p[1]);
        }
    }

    var x = document.getElementsByName('x-axis'), x_axis = "Period";
    labels = {"Period": "Period in seconds (*10e-3)", "TOAs": "Number of times-of-arrival", "RMS": "RMS value of pulsar's timing residuals (*10e6 seconds)"};

    var xmax = Number.NEGATIVE_INFINITY, xmin = Number.POSITIVE_INFINITY;
    for(var i=0;i<data.length;++i){
        if(data[i][x_axis] > xmax)
            xmax = data[i][x_axis];
    }

    for(var i=0;i<data.length;++i){
        if(data[i][x_axis] < xmin)
            xmin = data[i][x_axis];
    }

    var flag = 0;
    var ymax = Math.log(1.051006e-19), ymin = Math.log(2.4297e-21);
    graph = new SimpleGraph("chart1", {
          "xmax": xmax*1.2, "xmin": xmin*0.8,
          "ymax": ymax, "ymin": ymin,
          "title": x_axis+" vs. Period-Derivative",
          "xlabel": labels[x_axis],
          "ylabel": "Log of Period-Derivative (s/s)"  
        }, flag);

    document.getElementById('submit_form').onclick = function(){
        graph.add_point({
            "Pulsar": document.getElementById('pulsar').value,
            "TOAs": document.getElementById('toa').value,
            "Raw Profiles": document.getElementById('raw_p').value,
            "Period": document.getElementById('period').value, 
            "Period Derivative": document.getElementById('period_d').value,
            "DM": document.getElementById('dm').value,
            "RMS": document.getElementById('rms').value,
            "Binary": document.getElementById('binary').value
            });

        var dimmer = document.getElementsByClassName("dimmer")[0];
        var lightbox = document.getElementById("add_point_form");
        document.body.removeChild(dimmer);
        lightbox.style.visibility = 'hidden';

        document.getElementById("text_message").innerHTML = "Data point added";
        document.getElementById("message").style.visibility = "visible";
        setTimeout(function(){
            document.getElementById("message").style.visibility = "hidden";
            }, 2000);

        var inp = document.getElementsByClassName('form-control');
        for(var i=0;i<inp.length;++i)
            inp[i].value = '';
    };

    document.getElementById("add_threshold").onclick = function(){
        var threshold = document.getElementById("threshold_value").value;
        if(threshold == "")
            return;

        threshold = Math.log(Number(threshold));
        graph.update(threshold);
    }
    
    document.getElementById("remove_threshold").onclick = function(){
        document.getElementById("threshold_value").value = "";
        graph.update(null);
    }
});
