/*
  D3 Stock Chart
  Sylvain Durand – MIT license
*/

"use strict";


function stocks(div) {


// Plot initialization
// -------------------

  this.init = function(isin) {

    $.curves = ["ewma12", "ewma26", "close"];

    // Box sizing

    $.width   = 600;
    $.height  = 100;
    $.margin  =  30;
    $.padding =  20;
    $.left    =  40;
    $.right   =  20;

    // Plot initialization

    $.x  = d3.scaleTime().range([0, $.width]);

    $.svg_width = $.width + $.left + $.right,
    $.svg_height = 3*$.height + 2*$.margin + 50 - $.padding;

    $.svg = d3.select(div)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr('viewBox','0 0 '+ $.svg_width +' '+ $.svg_height);

    $.svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", $.width)
        .attr("height", 2*$.margin + 3*$.height);

    $.wrap = $.svg.append("g")
        .attr("class", "wrap")
        .attr("transform", "translate("+$.left+","+$.margin+")");

    var plot = $.wrap.append("g")
        .attr("class", "div_plot");

    for (var c in $.curves) {
      plot.append("path")
          .attr("class", $.curves[c])
          .style("clip-path", " url(#clip)");
    }

    plot.append("path")
        .attr("class", "band")
        .style("clip-path", " url(#clip)")

    var selecteur = plot.append("text")
        .attr("class", "selecteur absolute")
        .attr("x", -$.left + 13)
        .attr("y", -10)
        .on("click", function() {
            var type = ($.type == "relative")?"absolute":"relative";
            $.type = type;
            $.draw_plot();
            selecteur.attr("class", "selecteur " + type);
        });

    selecteur.append("tspan").attr("class", "absolute").text("€");
    selecteur.append("tspan").text(" / ");
    selecteur.append("tspan").attr("class", "relative").text("%");

   }


// Reading data
// ------------

  this.read = function(d) {

    d.date = d3.timeParse("%Y-%m-%d")(d.date);
    for (var stat in d) {
      if (stat != 'date') {
        d[stat] = +d[stat];
      }
    }
    return d;

  };



// Showing price plot
// ------------------

  this.draw_plot = function() {

    if ($.type == "relative") {
      $.compute_ratio($.data[0].close);
    }

    $.pre = ($.type == "relative") ? "ratio_" : "";

    var plot = $.svg.select(".div_plot");

    plot.append("g")
        .attr("class", "y axis");

    plot.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + 3*$.height + ")");

    $.update_axis();

    var options = ["max", "10a", "5a", "2a", "1a", "6m"],
        range = plot.append("text")
            .attr("x", $.width)
            .attr("y", - $.margin / 2)
            .attr("text-anchor", "end")
            .attr("class", "range");

    for (var i in options) {
      range.append("tspan").text(" ");
      range.append("tspan")
          .attr("class", "range_" + options[i])
          .text(options[i])
          .on("click",function(){$.set_zoom(d3.select(this).text())});
      range.append("tspan").text("  ");
    }

    function draw(curve) {
      $[curve] = d3.line()
          .x(function(d){ return $.x(d.date) })
          .y(function(d){ return $.y(d[$.pre + curve]) });

      $.wrap.select("."+curve)
          .datum($.data)
          .attr("d", $[curve]);
    }

    for (var c in $.curves) {
      draw($.curves[c]);
    }

    $.band = d3.area()
        .x(function(d){ return $.x(d.date) })
        .y1(function(d){ return $.y(d[$.pre + "band_upper"]) })
        .y0(function(d){ return $.y(d[$.pre + "band_lower"]) });

    $.wrap.select(".band")
        .datum($.data)
        .attr("d", $.band);
  };



// Showing MACD module
// -------------------

  this.draw_macd = function() {

    var macd = $.wrap.append("g")
        .attr("class", "div_macd")
        .attr("transform", "translate(0," +
            ($.svg_height - $.height + 2*$.padding) + ")");

    $.svg_height += $.height + $.padding;

    $.svg.attr('viewBox','0 0 '+ $.svg_width +' '+ $.svg_height);

    macd.append("rect")
        .attr("class", "positif")
        .attr("width", $.width)
        .attr("height", $.height)
        .attr("clip-path", "url(#positif)");

    macd.append("rect")
        .attr("class", "negatif")
        .attr("width", $.width)
        .attr("height", $.height)
        .attr("clip-path", "url(#negatif)");

    macd.append("path")
        .attr("class", "macd")
        .style("clip-path", " url(#clip)");

    macd.append("path")
        .attr("class", 'signal')
        .style("clip-path", " url(#clip)");

    $.y_macd = d3.scaleLinear().range([$.height, 0]);
    $.y_div = d3.scaleLinear().range([$.height, 0]);
    $.y_macd.domain($.compute_domain(["macd", "signal"], 'sym'));
    $.y_div.domain($.compute_domain(["div"], 'sym'));
    $.y_macd_axis = d3.axisLeft().scale($.y_macd).ticks(5);

    macd.append("g")
        .attr("class", "y axis")
        .call($.y_macd_axis);

    $.macd = d3.line()
        .x(function(d){ return $.x(d.date) })
        .y(function(d){ return $.y_macd(d.macd) });

    $.signal = d3.line()
        .x(function(d){ return $.x(d.date) })
        .y(function(d){ return $.y_macd(d.signal) });

    $.div = d3.area()
        .x(function(d){ return $.x(d.date) })
        .y0($.y_div(0));

    macd.datum($.data)
        .append("clipPath")
        .attr("id", "positif")
        .append("path")
        .attr("d", $.div.y1(function(d){
          return Math.min($.y_div(0), $.y_div(d.div)) }));

    macd.datum($.data)
        .append("clipPath")
        .attr("id", "negatif")
        .append("path")
        .attr("d", $.div.y1(function(d){
          return Math.max($.y_div(0), $.y_div(d.div)) }));

    macd.select("path.macd").attr("d", $.macd);
    macd.select("path.signal").attr("d", $.signal);

  };



// Showing RSI module
// -------------------

  this.draw_rsi = function() {

    var rsi = $.wrap.append("g")
        .attr("class", "div_rsi")
        .attr("transform", "translate(0," +
            ($.svg_height - $.height + 2*$.padding) + ")");

    $.svg_height += $.height + $.padding;

    $.svg.attr('viewBox','0 0 '+ $.svg_width +' '+ $.svg_height);

    rsi.append("path")
        .attr("class", "rsi")
        .style("clip-path", " url(#clip)");

    $.y_rsi = d3.scaleLinear().range([$.height, 0]);
    $.y_rsi.domain([0, 100]);
    $.y_rsi_axis = d3.axisLeft()
        .scale($.y_rsi).ticks(4);

    rsi.append("g")
        .attr("class", "y axis")
        .call($.y_rsi_axis);

    $.rsi = d3.line()
        .x(function(d){ return $.x(d.date) })
        .y(function(d){ return $.y_rsi(d.rsi) });

    rsi.datum($.data)
    rsi.select("path.rsi").attr("d", $.rsi);

  };



  // Showing ADX module
  // ------------------

  this.draw_adx = function() {

    var adx = $.wrap.append("g")
        .attr("class", "div_adx")
        .attr("transform", "translate(0," +
            ($.svg_height - $.height + 2*$.padding) + ")");

    $.svg_height += $.height + $.padding;

    $.svg.attr('viewBox','0 0 '+ $.svg_width +' '+ $.svg_height);

    adx.append("path")
        .attr("class", "adx")
        .style("clip-path", " url(#clip)");

    adx.append("path")
        .attr("class", 'dim')
        .style("clip-path", " url(#clip)");

    adx.append("path")
        .attr("class", 'dip')
        .style("clip-path", " url(#clip)");

    $.y_adx = d3.scaleLinear().range([$.height, 0]);
    $.y_adx.domain($.compute_domain(["adx", "dim", "dip"]));
    $.y_adx_axis = d3.axisLeft().scale($.y_adx).ticks(4);

    adx.append("g")
        .attr("class", "y axis")
        .call($.y_adx_axis);

    $.adx = d3.line()
        .x(function(d){ return $.x(d.date) })
        .y(function(d){ return $.y_adx(d.adx) });

    $.dim = d3.line()
        .x(function(d){ return $.x(d.date) })
        .y(function(d){ return $.y_adx(d.dim) });

    $.dip = d3.line()
        .x(function(d){ return $.x(d.date) })
        .y(function(d){ return $.y_adx(d.dip) });

    adx.datum($.data)
    adx.select("path.adx").attr("d", $.adx);
    adx.select("path.dim").attr("d", $.dim);
    adx.select("path.dip").attr("d", $.dip);

  };



// Compute percentages
// -------------------

  this.compute_ratio = function(base) {
    $.data.forEach(function(d){
        for (var stat in d) {
          if (stat != 'date' && stat.indexOf("ratio_") < 0 ) {
            d['ratio_' + stat] = d[stat] / base;
          }
        }
      });
  };



// Update axis
// -----------


  this.update_axis = function() {

    if (!$.ext) {
      $.ext = d3.extent($.data.map(function(d){ return d.date }));
    }

    $.x.domain($.ext);

    if ($.type == "relative") {
      var basedate = d3.min($.data.map(function(d)
                          {if (d.date >= $.ext[0]) return d.date})),
          basevalue = $.data.find(function (d)
                          {return d.date == basedate; }).close;

      $.compute_ratio(basevalue);
    }

    var x_axis = d3.axisBottom().scale($.x);
    $.svg.select(".div_plot .x.axis").call(x_axis);

    if ($.type == "relative") {
      $.y = d3.scaleLog().range([3*$.height, 0]);
      $.y.domain($.compute_domain([$.pre + "close", $.pre + "emwa12",
            $.pre + "emwa26",  $.pre + "band_lower",
            $.pre + "band_upper"]));
      var y_axis = d3.axisLeft()
          .scale($.y)
          .tickFormat(function(x) { return d3.format("+.0%")(x - 1);})
          .tickValues(d3.scaleLinear().domain($.y.domain()).ticks(7));
    }

    else {
      $.y = d3.scaleLinear().range([3*$.height, 0]);
      $.y.domain($.compute_domain(([$.pre + "close", $.pre + "emwa12",
            $.pre + "emwa26",  $.pre + "band_lower",
            $.pre + "band_upper"])));
      y_axis = d3.axisLeft().scale($.y);
    }

    $.svg.select(".div_plot .y.axis").call(y_axis).selectAll(".tick");

  };



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

      if (keys[0] != "macd") {
        ens = d3.extent($.data.map(val));

        if (keys[0].substring(0, 6) != "ratio_") {
          ens = [(4 * ens[0] + dom[0])/5, (4 * ens[1] + dom[1])/5];
        }
      }

      ext[0] = !!ext[0]?Math.min(ext[0], ens[0]*(1-Δ)) : ens[0]*(1-Δ);
      ext[1] = !!ext[1]?Math.max(ext[1], ens[1]*(1+Δ)) : ens[1]*(1+Δ);
    }

    if(type == "sym") {
      var sym = Math.max(-ext[0], ext[1]);
      return [-sym, sym];
    }
    else {
      return ext;
    }
  };



// Show values on hover
// --------------------

  this.show_data = function() {

    $.focus = $.wrap.append("g")
        .attr("class", "focus")
        .style("display", "none");

    $.focus.append("line")
        .attr("y1", 0)
        .attr("y2", $.svg_height - $.height + $.margin);

    var lgd = {}

    $.text = $.wrap.append("g")
        .attr("class", "lgd")
        .attr("transform", "translate(0, 5)");

    var lgd_date = $.text.append("text")
        .attr("class", "lgd_date")
        .attr("x", $.width)
        .attr("y",10)
        .attr("text-anchor", "end");

    var lgd_value = $.text.append("text")
        .attr("class", "lgd_value")
        .attr("x", $.width)
        .attr("y", 25)
        .attr("text-anchor", "end");

    write_legend("close", "", lgd_value);

    var lgd_diff = $.text.append("text")
        .attr("class", "lgd_diff")
        .attr("x", $.width)
        .attr("y", 36)
        .attr("text-anchor", "end");

    var lgd_triangle = lgd_diff.append("tspan")
            .attr("class", "lgd_triangle");

    var lgd_difference = lgd_diff.append("tspan")
            .attr("dx", 0.5);

    var lgd_plot = $.text.append("text")
        .attr("class", "lgd_plot")
        .attr("y", 5);

    write_legend("ewma12", "EWMA12 : ", lgd_plot);
    write_legend("ewma26", "EWMA26 : ", lgd_plot);
    write_legend("band", "Bollinger : ", lgd_plot);

    if ($.macd) {
      var lgd_ma = d3.select(".div_macd")
          .append("text")
          .attr("class", "lgd_ma")
          .style("left", $.left + "px")
          .attr("y", 10);

      write_legend("macd", "MACD : ", lgd_ma);
      write_legend("signal", "Signal : ", lgd_ma);
      write_legend("div", "Divergence : ", lgd_ma);
    }

    if ($.rsi) {
      var lgd_rsi = d3.select(".div_rsi")
          .append("text")
          .attr("class", "lgd_rs")
          .style("left", $.left + "px")
          .attr("y", 10);

      write_legend("rsi", "RSI : ", lgd_rsi);
    }

    if ($.adx) {
      var lgd_adx = d3.select(".div_adx")
          .append("text")
          .attr("class", "lgd_rs")
          .style("left", $.left + "px")
          .attr("y", 10);

      write_legend("dip", "DI+ : ", lgd_adx);
      write_legend("dim", "DI- : ", lgd_adx);
      write_legend("adx", "ADX : ", lgd_adx);
    }

    function write_legend(name, title, legend) {
      legend.append("tspan")
          .attr("class", "lgd_name")
          .attr("dx", 8)
          .text(title);
      lgd[name] = legend.append("tspan")
          .attr("class", "lgd_val lgd_" + name);
    }

    $.wrap.append("rect")
        .attr("class", "overlay")
        .attr("width", $.width)
        .attr("height", $.svg_height - $.height + $.margin);

    default_legends();

    d3.selectAll(".overlay," + div + " div")
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

    function default_legends() {
        $.focus.style("display", "none");
        update_legends($.data.slice(-1)[0], $.data.slice(-2)[0]);
    }

    function update_legends(d, y) {

        var evol = !!y ? (d.close - y.close) / y.close : 0,
            evolc = evol > 0 ? ' plus' : (evol < 0 ? ' minus': ''),
            evols = evol > 0 ? '▲ ' : (evol < 0 ? '▼ ': '◼ ');

        lgd_date.text(d3.timeFormat('%A %e %B %Y')(d.date));
        lgd['close'].text(d3.format("$.2f")(d.close));

        lgd_diff.attr("class", "lgd_diff" + evolc);
        lgd_triangle.text(evols);
        lgd_difference.text(d3.format(".1%")(evol));

        lgd['ewma12'].text(d3.format(".1f")(d.ewma12));
        lgd['ewma26'].text(d3.format(".1f")(d.ewma26));
        lgd['band'].text(d3.format(".1f")(d.band_lower)
            + ' – ' + d3.format(".1f")(d.band_upper));

        if ($.macd) {
          lgd['macd'].text(d3.format(".1f")(d.macd));
          lgd['signal'].text(d3.format(".1f")(d.signal));
          lgd['div'].text(d3.format(".1f")(d.div));
          lgd['div'].attr("class", "val " +
              ((d.div >= 0) ? "plus" : "minus"));
        }

        if ($.rsi) {
          lgd['rsi'].text(d3.format(".1f")(d.rsi));
        }

        if ($.rsi) {
          lgd['dip'].text(d3.format(".1f")(d.dip));
          lgd['dim'].text(d3.format(".1f")(d.dim));
          lgd['adx'].text(d3.format(".1f")(d.adx));
        }
    }

  };


// Set zoom
// --------

  this.set_zoom = function(time) {

    var today = new Date($.data[$.data.length - 1].date),
        start = new Date($.data[$.data.length - 1].date),
        arg = /(\d+)(.)/.exec(time);

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

    d3.selectAll(".range tspan").classed("active", 0);
    d3.select(".range_" + time).classed("active", 1);

    $.update_axis();

    for (var c in $.curves) {
      $.wrap.select("."+$.curves[c])
          .attr("d", $[$.curves[c]]);
    }

    $.wrap.select(".band")
        .attr("d", $.band);

    d3.select("#positif path")
        .attr("d", $.div.y1(function(d){
          return Math.min($.y_div(0), $.y_div(d.div)); }));

    d3.select("#negatif path")
        .attr("d", $.div.y1(function(d){
          return Math.max($.y_div(0), $.y_div(d.div)); }));

    d3.select(".macd")
        .attr("d", $.macd);

    d3.select(".signal")
        .attr("d", $.signal);

    d3.select(".rsi")
        .attr("d", $.rsi);

    d3.select(".adx")
        .attr("d", $.adx);

    d3.select(".dim")
        .attr("d", $.dim);

    d3.select(".dip")
        .attr("d", $.dip);

    $.div = d3.area()
        .x(function(d){ return $.x(d.date); })
        .y0($.y_div(0));

  };


  var $ = this;
  $.init();

}
