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
    $.padding =   8;
    $.left    =  50;
    $.right   =  20;
    $.text    =  20;


    // SVG initialization


    $.svg_width = $.width + $.left + $.right;
    $.svg_height = 1.5*$.margin;

    for (var i = 0; i < curves.length; i++) {
      $.svg_height += (curves[i].height||1) * $.height + $.padding +
                      $.text * (!!curves[i].axis ||
                      (!!curves[i+1] &&! !curves[i+1].ratio));
    }

    $.svg = d3.select(div)
        .append("svg")
        .attr("width", "100%")
        .attr('viewBox','0 0 '+$.svg_width+' '+$.svg_height)
        .attr("class", "wrap")
        .attr("transform", "translate("+$.left+","+$.margin+")");


    // Canvas initialization

    $.cv = d3.select(div).append("canvas")
        .attr("width", "100%")
        .attr("height", "100%");

    var cv = $.cv.node();
    $.ct = cv.getContext("2d");
    cv.width = $.svg_width;
    cv.height = $.svg_height;

    $.d = Math.max(window.devicePixelRatio, 2);
    cv.width *= $.d;
    cv.height *= $.d;
    $.cv.style("width", "100%");
    $.cv.style("height", (100 * $.svg_height / $.svg_width) + "%");

    $.ct.setTransform($.d, 0, 0, $.d, $.d * $.left, $.d * $.margin);
    $.ct.rect(0, 0, $.svg_width - $.left - $.right, $.svg_height);
    $.ct.clip();


    // Create axis and legends

    var y = 0;
    $.type = [];
    $.axis = [];
    $.format = [];
    $.legend = [];
    $.legends = [];

    for (var i in curves) {
      var box = curves[i];

      // Horizontal axis

      if ( box.axis ) {
        $.svg.append("g")
            .attr("class", "x axis")
            .attr("transform","translate(0,"+(y+(box.height||1)*$.height)+")");
      }

      $.axis[i] = $.svg.append("g")
          .attr("class", "axis")
          .attr("transform", "translate(0, " + y + ")");

      // Ratio selector

      if ( box.ratio ) {
        var select = $.svg.append("text")
            .attr("id", "select" + i)
            .attr("class", "select absolute")
            .attr("transform", "translate(0, " + (y-4) + ")")
            .attr("text-anchor", "end")
            .on("click", function() {
              var k = d3.select(this).attr("id").slice(6);
              $.type[k] = ($.type[k] == "relative") ? "absolute" : "relative";
              $.draw();
              d3.select(this).attr("class", "select " + $.type[k]);
            });

        select.append("tspan").attr("class", "absolute").text('$');
        select.append("tspan").text(" / ");
        select.append("tspan").attr("class", "relative").text("%");
      }

      // Legends

      $.legends[i] = $.svg.append("text")
        .attr("class", "legend")
        .attr("transform", "translate(0, " + (y + 7) + ")");

      for (var j in box.curves) {
        var curve = box.curves[j];
        if (!!curve.name) {
          $.legends[i].append("tspan")
              .attr("dx", 8)
              .text(curve.name + " : ");

          $.format[curve.id] = curve.format || ".1f";
          $.legend[curve.id] = $.legend[curve.id] || [];
          $.legend[curve.id].push($.legends[i].append("tspan")
            .attr("class", "lgd_val lgd_" + curve.id)
            .style("fill", curve.color));
        }
      }

      // Translation to the next box

      y += (box.height||1)*$.height + $.padding
        + ((!!box.axis || (!!curves[(parseInt(i)+1)+""]
          && !!curves[(parseInt(i)+1)+""].ratio)) && $.text);

    }

    $.date = $.svg.append("g")
        .attr("transform", "translate(0, 5)")
        .append("text")
        .attr("class", "legend date")
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
          .on("click",function(){$.set_zoom(d3.select(this).text()); });
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

    var x_axis = d3.axisBottom().tickSizeOuter(0).scale($.x);
    $.svg.selectAll(".x.axis").call(x_axis);

    // Loop over each plot

    for (var i in curves) {

      // Compute and show vertical axis

      var box = curves[i],
          y = d3["scale" + (($.type[i]=="relative") ? "Log" : "Linear")]()
                .range([(box.height||1)* $.height, 0]),
          axis = d3.axisLeft().ticks(3.5 * (box.height||1))
                    .tickSizeInner(-$.width).tickSizeOuter(0),
          list = [];

      for (var j in box.curves) {

        // Compute ratio if necessary

        var pre = "";

        if ($.type[i] == "relative") {
          pre = "ratio_";

          var id = box.curves[j].id,
              name = (typeof(id) == "string")? [id] : id,
              start = d3.min($.data.map(function(d)
                              {if (d.date >= $.ext[0]) return d.date})),
              base = $.data.find(function (d)
                              {return d.date == start; })[box.ratio];

          for (var id in name) {
            $.data.forEach(function(d){d[pre+name[id]] = d[name[id]]/base});
          }
        }
        list.push(pre + box.curves[j].id);
      }

      y.domain($.compute_domain(list, (box.type == "sym")));

      if ($.type[i] == "relative") {
          axis = d3.axisLeft()
                  .tickFormat(function(x) { return d3.format("+.0%")(x - 1);})
                  .tickValues(d3.scaleLinear().domain(y.domain())
                  .ticks(2.5 * (box.height||1)))
                  .tickSizeInner(-$.width)
                  .tickSizeOuter(0);
      }

      $.axis[i].call(axis.scale(y));

      // Loop over each curve

      for (var j in box.curves) {
        var curve = box.curves[j],
            id = curve.id;

        // Draw area between two variables

        if (typeof(id) != "string") {
          console.log(id[0]);
          $.ct.beginPath();
          d3.area().defined(function(d) {return d})
              .x( function(d){ return $.x(d.date); })
              .y0( function(d){ return y(d[pre+id[0]]); })
              .y1( function(d){ return y(d[pre+id[1]]); })
              .context($.ct)($.data);
          $.ct.fillStyle = curve.color;
          $.ct.fill();
        }

        // Draw positive and negative area

        else if (curve.type == "area") {
          for (var k = 0; k < 2; k++) {
            $.ct.beginPath();
            d3.area().defined(function(d) {return d})
                .x( function(d){ return $.x(d.date); })
                .y0( function(d){ return y(0); })
                .y1( function(d){ return y(Math[k?'min':'max'](0,d[pre+id])); })
                .context($.ct)($.data);
            $.ct.fillStyle = k?'rgba(178,34,34,.8)':'rgba(0,128,0,.8)';
            $.ct.fill();
          }
        }

        // Draw curve

        else {
          $.ct.beginPath();
          d3.line().defined(function(d) {return d})
              .x( function(d){ return $.x(d.date); })
              .y( function(d){ return y(d[pre+id]); })
              .context($.ct)($.data);
          $.ct.lineWidth = curve.width;
          $.ct.strokeStyle = curve.color;
          $.ct.stroke();
        }

      }

    // Translation to the next box

    $.ct.translate(0, (box.height||1)*$.height + $.padding
        + ((!!box.axis || (!!curves[(parseInt(i)+1)+""]
        && !!curves[(parseInt(i)+1)+""].ratio)) && $.text));
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
      var dom = d3.extent($.data.map( function(d){ return d[keys[k]]})),
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
        for (var j in $.legend[i]) {
          $.legend[i][j].text(d3.format($.format[i])(d[i]));
        }
      }
    }

    function detect_pointer() {
      !!(d3.event.type=="mouseover") && $.focus.style("display", null);
      var x0 = $.x.invert(d3.mouse(this)[0]),
          i = d3.bisector( function(d){ return d.date})
              .left($.data, x0, 1),
          d0 = $.data[i - 1],
          d1 = (!$.data[i] ? $.data[i- 1] : $.data[i]),
          test = (x0 - d0.date > d1.date - x0),
          d = test ? d1 : d0;
      $.focus.attr("transform", "translate("+$.x(d.date)+",0)");
      update_legends(d, test ? d0 : $.data[i-2]);
    }

    default_legends();

    d3.selectAll(".overlay")
      .on("mouseout", default_legends)
      .on("mousemove", detect_pointer)
      .on("mouseover", detect_pointer);

  };

  var $ = this;
  $.init();

}
