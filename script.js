/*
  D3 Stock Chart
  Sylvain Durand – MIT license
*/

"use strict";


function stocks(div, curves) {


// Plot initialization
// -------------------

  this.init = function(isin) {


    // Box sizing

    $.width   = 600;
    $.height  =  75;
    $.margin  =  30;
    $.padding =  20;
    $.left    =  40;
    $.right   =  20;


    // SVG initialization


    $.svg_width = $.width + $.left + $.right;
    $.svg_height = 2*$.margin;

    for (var i in curves) {
      $.svg_height += (curves[i].height||1) * $.height + $.padding;
    }

    $.svg = d3.select(div)
        .append("svg")
        .attr("width", "100%")
        .attr('viewBox','0 0 '+$.svg_width+' '+$.svg_height)
        .attr("class", "wrap")
        .attr("transform", "translate("+$.left+","+$.margin+")");

    $.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," +
          (curves[0].height||1)*$.height + ")");


    // Canvas initialization

    $.cv = d3.select(div).append("canvas")
        .attr("width", "100%")
        .attr("height", "100%");

    var cv = $.cv.node();
    $.ct = cv.getContext("2d");
    cv.width = $.svg_width;
    cv.height = $.svg_height;

    $.d = 2;
    cv.width *= $.d;
    cv.height *= $.d;
    $.cv.style("width", "100%");
    $.cv.style("height", (100 * $.svg_height / $.svg_width) + "%");

    $.ct.setTransform($.d, 0, 0, $.d, $.d * $.left, $.d * $.margin);
    $.ct.rect(0, 0, $.svg_width - $.left - $.right, $.svg_height);
    $.ct.clip();


    // Create axis and legends

    var y = 0;
    $.axis = [];
    $.format = [];
    $.legend = [];
    $.legends = [];

    for (var i in curves) {
      var box = curves[i];
      y += i==0? 0: (curves[i-1].height || 1) * $.height + $.padding;

      $.axis[i] = $.svg.append("g")
          .attr("class", "axis")
          .attr("transform", "translate(0, " + y + ")");

      $.legends[i] = $.svg.append("text")
        .attr("class", "legend")
        .attr("transform", "translate(0, " + (y + 12) + ")");

      for (var j in box.curves) {
        var curve = box.curves[j];
        if (!!curve.name) {
          $.legends[i].append("tspan")
              .attr("class", "lgd_name")
              .attr("dx", 8)
              .text(curve.name + " : ");

          $.format[curve.id] = curve.format || ".1f";
          $.legend[curve.id] = $.legends[i].append("tspan")
            .attr("class", "lgd_val")
            .style("fill", curve.color);
        }
      }
    }

    $.date = $.svg.append("g")
        .attr("transform", "translate(0, 5)")
        .append("text")
        .attr("class", "lgd_date")
        .attr("x", $.width)
        .attr("y",10)
        .attr("text-anchor", "end");


    // Show focus bar

    $.focus = $.svg.append("g")
        .attr("class", "focus")
        .append("line")
        .style("display", "none")
        .attr("y1", 0)
        .attr("y2", $.svg_height - $.height + $.margin);

    $.svg.append("rect")
        .attr("class", "overlay")
        .attr("width", $.width)
        .attr("height", $.svg_height - $.height + $.margin);


    // Time intervals selector

    var options = ["max", "10a", "5a", "2a", "1a", "6m"],
        range = $.svg.append("text")
            .attr("x", $.width)
            .attr("y", - $.margin / 4)
            .attr("text-anchor", "end")
            .attr("class", "range");

    for (var i in options) {
      range.append("tspan").text("  ");
      range.append("tspan").text(options[i])
          .attr("class", "range_" + options[i])
          .on("click",function(){$.set_zoom(d3.select(this).text())});
    }
   }


// Reading data
// ------------

  this.read = function(d) {

    d.date = d3.timeParse("%Y-%m-%d")(d.date);
    for (var stat in d) {
      if (stat != 'date') {
        if (d[stat] == "") {
          return null;
        }
        d[stat] = +d[stat];
      }
    }
    return d;

  };




// Set time interval
// -----------------

  this.set_zoom = function(time) {

    // Read requested time interval

    var today = new Date($.data[$.data.length - 1].date),
        start = new Date($.data[$.data.length - 1].date),
        arg = /(\d+)(.)/.exec(time);


    // Compute time interval

    if (!!arg) {
      if (arg[2] == 'm') {
        start.setMonth(start.getMonth() - arg[1]);
      }

      if (arg[2] == 'y' || arg[2] == 'a') {
        start.setFullYear(start.getFullYear() - arg[1]);
      }
      $.ext = [start, today];
    }

    else {
      $.ext = d3.extent($.data.map(function(d){ return d.date }));
    }


    // Show selected time interval

    d3.selectAll(".range tspan").classed("active", 0);
    d3.select(".range_" + time).classed("active", 1);


    // Update axis

    $.x = d3.scaleTime().range([0, $.width]);
    $.x.domain($.ext);

    // Draw

    $.show_legends();
    $.draw();

  };



// Drawing curves
// --------------

  this.draw = function() {

    // Reset canvas

    $.ct.clearRect(-1000, -1000, 10000, 10000);
    $.ct.setTransform($.d, 0, 0, $.d, $.d * $.left, $.d * $.margin);

    // Show horizontal axis

    var x_axis = d3.axisBottom().scale($.x);
    $.svg.select(".x.axis").call(x_axis);

    // Loop over each plot

    for (var i in curves) {

      // Compute and show vertical axis

      var box = curves[i],
          y = d3.scaleLinear().range([(box.height||1)* $.height, 0]),
          axis = d3.axisLeft().ticks(3.5 * (box.height||1)),
          list = [];

      for (var j in box.curves) {
        list.push(box.curves[j].id);
      }
      y.domain($.compute_domain(list, (box.type == "sym")));
      $.axis[i].call(axis.scale(y));

      // Loop over each curve

      for (var j in box.curves) {
        var curve = box.curves[j];

        // Draw area between two variables

        if (typeof(curve.id) != "string") {
          $.ct.beginPath();
         d3.area().defined(function(d) {return d})
              .x(function(d){return $.x(d.date)})
              .y0(function(d){return y(d[curve.id[0]])})
              .y1(function(d){return y(d[curve.id[1]])})
              .context($.ct)($.data);
          $.ct.fillStyle = curve.color;
          $.ct.fill();
        }

        // Draw positive and negative area

        else if (curve.type == "area") {
          for (i = 0; i < 2; i++) {
            $.ct.beginPath();
            d3.area().defined(function(d) {return d})
                .x(function(d){return $.x(d.date)})
                .y0(function(d){return y(0)})
                .y1(function(d){return y(Math[i?'min':'max'](0,d[curve.id]))})
                .context($.ct)($.data);
            $.ct.fillStyle = i?'rgba(178,34,34,.8)':'rgba(0,128,0,.8)';
            $.ct.fill();
          }
        }

        // Draw curve

        else {
          $.ct.beginPath();
          d3.line().defined(function(d) {return d})
              .x(function(d){return $.x(d.date)})
              .y(function(d){return y(d[curve.id])})
              .context($.ct)($.data);
          $.ct.lineWidth = curve.width;
          $.ct.strokeStyle = curve.color;
          $.ct.stroke();
        }

      }

    $.ct.translate(0, (box.height||1) * $.height + $.padding);

    }

  }



  // Compute domains
  // ---------------

  this.compute_domain = function(keys, type) {

    var ext = [],
        Δ = 0.1;

    function val(d) {
        return (d.date >= $.ext[0] && d.date
            <= $.ext[1]) ? d[keys[k]] : undefined;
    }

    for (var k in keys) {
      var dom = d3.extent($.data.map(function(d){return d[keys[k]]})),
          ens = dom;

      ens = d3.extent($.data.map(val));
      ens = [(4 * ens[0] + dom[0])/5, (4 * ens[1] + dom[1])/5];

      ext[0] = !!ext[0]?Math.min(ext[0], ens[0]*(1-Δ)) : ens[0]*(1-Δ);
      ext[1] = !!ext[1]?Math.max(ext[1], ens[1]*(1+Δ)) : ens[1]*(1+Δ);
    }

    if(type == 1) {
      var sym = Math.max(-ext[0], ext[1]);
      return [-sym, sym];
    }
    else {
      return ext;
    }
  };



// Show and update legends
// -----------------------

  this.show_legends = function() {

    function default_legends() {
        $.focus.style("display", "none");
        update_legends($.data.slice(-1)[0], $.data.slice(-2)[0]);
    }

    function update_legends(d, y) {
      $.date.text(d3.timeFormat('%A %e %B %Y')(d.date));
      for (var i in $.legend) {
        $.legend[i].text(d3.format($.format[i])(d[i]));
      }
    }

    default_legends();

    d3.selectAll(".overlay")
      .on("mouseout", default_legends)
      .on("mousemove", function () {
          var x0 = $.x.invert(d3.mouse(this)[0]),
              i = d3.bisector(function(d){return d.date})
                  .left($.data, x0, 1),
              d0 = $.data[i - 1],
              d1 = (!$.data[i] ? $.data[i- 1] : $.data[i]),
              test = (x0 - d0.date > d1.date - x0),
              d = test ? d1 : d0;
          $.focus.attr("transform", "translate("+$.x(d.date)+",0)");
          update_legends(d, test ? d0 : $.data[i - 2]);
        })
      .on("mouseover", function() {
          $.focus.style("display", null)
        });

  };

  var $ = this;
  $.init();

}
