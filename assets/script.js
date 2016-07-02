/*
  Affichage des cours avec D3
  Sylvain Durand – MIT license
*/

"use strict";


function stocks(div) {


  // Initialisation du graphique
  // ---------------------------

  this.init = function(isin) {

    // Courbes à afficher sur le graphique

      $.curves = ["ewma12", "ewma26", "price"];


    // Modèles de boîtes

      $.width   = 600;
      $.height  = 300;
      $.top     =  30;
      $.bottom  =  40;
      $.left    =  40;
      $.right   =  20;
      $.padding = 100;
   }


  // Chargement des données et affichage par défaut
  // ----------------------------------------------

  this.load = function(isin) {

      if (isin === undefined) {
        isin = window.location.search.replace("?", "");
      }

      d3.csv('data/isin/' + isin + '.csv', function(err, data) {
          $.read(err, data);
          $.set_zoom("1a");
          $.draw_plot();
          $.draw_macd();
          $.draw_zoom();
          $.show_data();
      });
  };



  // Lecture des données
  // -------------------

  this.read = function(err, data) {
      data.forEach(function(d){
          d.date = d3.time.format('%Y-%m-%d').parse(d.date);
          for (var stat in d) {
            if (stat != 'date') {
              d[stat] = +d[stat];
            }
          }
        });

      $.data = data;
  };



  // Affichage du graphique
  // ----------------------

  this.draw_plot = function(update) {

      if (update === undefined) {

        // Définition des échelles

          $.x  = d3.time.scale().range([0, $.width]);


        // Création de l'espace de travail

          $.svg_width = $.width + $.left + $.right,
          $.svg_height = $.height + $.top + $.bottom;

          $.svg = d3.select(div)
              .append("svg")
              .attr("width", "100%")
              .attr("height", "100%")
              .attr('viewBox','0 0 '+ $.svg_width +' '+ $.svg_height);

          $.svg.append("defs").append("clipPath")
              .attr("id", "clip")
              .append("rect")
              .attr("width", $.width)
              .attr("height", $.top + $.height + $.bottom);

          $.wrap = $.svg.append("g")
              .attr("class", "wrap")
              .attr("transform", "translate(" + $.left + "," + $.top + ")");

          var plot = $.wrap.append("g")
              .attr("class", "div_plot");


        // Créations des courbes

          for (var c in $.curves) {
            plot.append("path")
                .attr("class", $.curves[c])
                .style("clip-path", " url(#clip)");
          }

          plot.append("path")
              .attr("class", "bollinger")
              .style("clip-path", " url(#clip)")


        // Affichage du sélecteur

        var selecteur = plot.append("text")
            .attr("class", "selecteur absolute")
            .attr("x", -$.left + 13)
            .attr("y", -10)
            .on("click", function() {
                var type = ($.type == "relative") ? "absolute" : "relative";
                $.type = type;
                $.draw_plot("update");
                selecteur.attr("class", "selecteur " + type);
            });

        selecteur.append("tspan").attr("class", "absolute").text("€");
        selecteur.append("tspan").text(" / ");
        selecteur.append("tspan").attr("class", "relative").text("%");

      }

    // Calcul des données

      if ($.type == "relative") {
        $.compute_ratio($.data[0].price);
      }

      $.pre = ($.type == "relative") ? "ratio_" : "";


    // Créations et affichage des axes

      var plot = $.svg.select(".div_plot");

      plot.append("g")
          .attr("class", "y axis");

      plot.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + $.height + ")");

      $.update_axis();

    // Calcul des courbes

      function draw(curve) {
          $[curve] = d3.svg.line()
            .x(function(d){ return $.x(d.date) })
            .y(function(d){ return $.y(d[$.pre + curve]) });

          $.wrap.select("."+curve)
            .datum($.data)
            .attr("d", $[curve]);
      }

      for (var c in $.curves) {
        draw($.curves[c]);
      }

      $.bollinger = d3.svg.area()
          .x(function(d){ return $.x(d.date) })
          .y1(function(d){ return $.y(d[$.pre + "bollinger_upper"]) })
          .y0(function(d){ return $.y(d[$.pre + "bollinger_lower"]) });

      $.wrap.select(".bollinger")
          .datum($.data)
          .attr("d", $.bollinger);
  };



  // Affichage du MACD
  // -----------------

  this.draw_macd = function() {

    // Définition de la zone de travail

      var macd = $.wrap.append("g")
          .attr("class", "div_macd")
          .attr("transform", "translate(0," +
              ($.svg_height - $.padding + $.top + $.bottom) + ")");

      $.svg_height += $.padding + $.top;

      $.svg.attr('viewBox','0 0 '+ $.svg_width +' '+ $.svg_height);


    // Définition des courbes

      macd.append("rect")
          .attr("class", "positif")
          .attr("width", $.width)
          .attr("height", $.padding)
          .attr("clip-path", "url(#positif)");

      macd.append("rect")
          .attr("class", "negatif")
          .attr("width", $.width)
          .attr("height", $.padding)
          .attr("clip-path", "url(#negatif)");

      macd.append("path")
          .attr("class", "macd")
          .style("clip-path", " url(#clip)");

      macd.append("path")
          .attr("class", 'signal')
          .style("clip-path", " url(#clip)");


    // Définition des axes

      $.y_macd = d3.scale.linear().range([$.padding, 0]);
      $.y_macd.domain($.compute_domain(["macd", "signal", "div"]));
      $.y_macd_axis = d3.svg.axis()
          .scale($.y_macd)
          .orient("left")
          .tickSize(-$.width, 0).ticks(4);

      macd.append("g")
          .attr("class", "y axis")
          .call($.y_macd_axis);


    // Affichage des courbes

      $.macd = d3.svg.line()
          .x(function(d){ return $.x(d.date) })
          .y(function(d){ return $.y_macd(d.macd) });

      $.signal = d3.svg.line()
          .x(function(d){ return $.x(d.date) })
          .y(function(d){ return $.y_macd(d.signal) });

      $.div = d3.svg.area()
          .x(function(d){ return $.x(d.date) })
          .y0($.y_macd(0));

      macd.datum($.data)
          .append("clipPath")
          .attr("id", "positif")
          .append("path")
          .attr("d", $.div.y1(function(d){
            return Math.min($.y_macd(0), $.y_macd(d.div)) }));

      macd.datum($.data)
          .append("clipPath")
          .attr("id", "negatif")
          .append("path")
          .attr("d", $.div.y1(function(d){
            return Math.max($.y_macd(0), $.y_macd(d.div)) }));

      macd.select("path.macd").attr("d", $.macd);
      macd.select("path.signal").attr("d", $.signal);

  };



  // Affichage du sélecteur
  // ----------------------

  this.draw_zoom = function() {

    // Définition de la zone de travail

      var zoom = $.wrap.append("g")
          .attr("class", "div_zoom")
          .attr("transform", "translate(0," +
              ($.svg_height - $.padding + $.bottom) + ")");

      $.svg.attr('viewBox','0 0 ' + $.svg_width + ' '
          + ($.svg_height + $.padding + $.top) );


    // Définition des courbes

      zoom.append("path")
          .attr("class", "area")
          .style("clip-path", " url(#clip)");


    // Définition des axes

      var x_zoom = d3.time.scale().range([0, $.width]),
          x_zoom_axis = d3.svg.axis().scale(x_zoom)
              .orient("bottom").tickFormat(fr_axis);

      var y_zoom = d3.scale.linear().range([$.padding, 0]);

      x_zoom.domain(d3.extent($.data.map(function(d){ return d.date })));
      y_zoom.domain(d3.extent($.data.map(function(d){ return d.price })));

      zoom.append("g")
          .attr("class", "x_zoom axis")
          .attr("transform", "translate(0," + $.padding + ")")
          .call(x_zoom_axis);


    // Définition du sélecteur

      $.brush = d3.svg.brush()
          .x(x_zoom);

      zoom.append("g")
          .attr("class", "x brush")
          .call($.brush)
          .selectAll("rect")
          .attr("height", $.padding);

      zoom.select(".area")
          .datum($.data)
          .attr("d", d3.svg.area()
              .x(function(d){ return x_zoom(d.date) })
              .y1(function(d){ return y_zoom(d.price) })
              .y0($.padding));


    // Mise à jour des valeurs lors de la sélection

      if (!!$.init_ext) {
        d3.select('.div_zoom .x.brush')
            .call($.brush.extent($.init_ext));

        delete($.init_ext);
      }

      $.brush.on("brush", $.brushed);


    // Affichage des dates

    var options = ["max", "10a", "5a", "2a", "1a", "6m"],
        range = zoom.append("text")
            .attr("x", 10)
            .attr("y", 15)
            .attr("class", "range");

    for (var i in options) {
      range.append("tspan").text(" ");
      range.append("tspan")
          .attr("class", "range_" + options[i])
          .text(options[i])
          .on("click", function(){$.set_zoom(d3.select(this).text())});
      range.append("tspan").text("  ");
    }

  };



  // Calcul des pourcentages
  // -----------------------

  this.compute_ratio = function(base) {
      $.data.forEach(function(d){
          for (var stat in d) {
            if (stat != 'date' && stat.indexOf("ratio_") < 0 ) {
              d['ratio_' + stat] = d[stat] / base;
            }
          }
        });
  };



  // Mise à jour des axes
  // --------------------


  this.update_axis = function() {

    // Calcul de l'espace de départ

      if ($.init_ext) {
          $.ext = $.init_ext;
      }

      else if (!$.brush || $.brush.empty()) {
        $.ext = d3.extent($.data.map(function(d){ return d.date }));
      }

      else {
        $.ext = $.brush.extent();
      }

      $.x.domain($.ext);


    // Calcul des ratios

      if ($.type == "relative") {
        var basedate = d3.min($.data.map(function(d)
                                {if (d.date >= $.ext[0]) return d.date})),
            basevalue = $.data.find(function (d)
                                  {return d.date == basedate; }).price;

        $.compute_ratio(basevalue);

      }

    // Calcul de l'axe horizontal

      var x_axis = d3.svg.axis().scale($.x)
          .orient("bottom").tickFormat(fr_axis);

      $.svg.select(".div_plot .x.axis").call(x_axis);

    // Calcul de l'axe vertical

      if ($.type == "relative") {
        $.y = d3.scale.log().range([$.height, 0]);
        $.y.domain($.compute_domain([$.pre + "price", $.pre + "emwa12",
              $.pre + "emwa26",  $.pre + "bollinger_lower",
              $.pre + "bollinger_upper"]));
        var y_axis = d3.svg.axis()
            .scale($.y)
            .orient("left")
            .tickSize(-$.width, 0)
            .tickFormat(function(x) { return d3.format("+.0%")(x - 1); })
            .tickValues(d3.scale.linear().domain($.y.domain()).ticks(5));
      }

      else {
        $.y = d3.scale.linear().range([$.height, 0]);
        $.y.domain($.compute_domain(([$.pre + "price", $.pre + "emwa12",
              $.pre + "emwa26",  $.pre + "bollinger_lower",
              $.pre + "bollinger_upper"])));
        y_axis = d3.svg.axis().scale($.y).orient("left")
            .tickSize(-$.width, 0);
      }

      $.svg.select(".div_plot .y.axis").call(y_axis)
          .selectAll(".tick")
          .classed("tick-one", function(d){ return Math.abs(d-1) < 1e-6; });

  };



  // Calcul des domaines
  // -------------------

  this.compute_domain = function(keys) {

      var ext = [],
          Δ = 0.15;

      function val(d) {
          return (d.date >= $.ext[0] && d.date
              <= $.ext[1]) ? d[keys[k]] : undefined;
      }

      for (var k in keys) {
        var dom = d3.extent($.data.map(function(d){ return d[keys[k]] })),
            ens = dom;

        if (keys[0] != "macd") {
          ens = d3.extent($.data.map(val));

          if (keys[0].substring(0, 6) != "ratio_") {
            ens = [(4 * ens[0] + dom[0])/5, (4 * ens[1] + dom[1])/5];
            Δ = 0;
          }
        }

        ext[0] = !!ext[0] ? Math.min(ext[0], ens[0] - Δ) : ens[0] - Δ;
        ext[1] = !!ext[1] ? Math.max(ext[1], ens[1] + Δ) : ens[1] + Δ;
      }

      return ext;
  };



  // Affichage du curseur et des valeurs au survol
  // ---------------------------------------------

  this.show_data = function() {

    // Création de la ligne

      $.focus = $.wrap.append("g")
          .attr("class", "focus")
          .style("display", "none");

      $.focus.append("line")
          .attr("y1", 0)
          .attr("y2", $.svg_height - $.padding + $.bottom);


    // Création des textes

      var lgd = {}

      $.text = $.wrap.append("g")
          .attr("class", "lgd")
          .attr("transform", "translate(0, 5)");

      var lgd_date = $.text.append("text")
          .attr("class", "lgd_date")
          .attr("x", $.width)
          .attr("y", -5)
          .attr("text-anchor", "end");

      var lgd_value = $.text.append("text")
          .attr("class", "lgd_value")
          .attr("x", $.width)
          .attr("y", 11)
          .attr("text-anchor", "end");

      write_legend("price", "", lgd_value);

      var lgd_diff = $.text.append("text")
          .attr("class", "lgd_diff")
          .attr("x", $.width)
          .attr("y", 2 * 11)
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
      write_legend("bollinger", "Bollinger : ", lgd_plot);

      if ($.macd) {
          var lgd_ma = $.text.append("text")
              .attr("class", "lgd_ma")
              .style("left", $.left + "px")
              .attr("y", $.height + $.bottom + 5);

          write_legend("macd", "MACD : ", lgd_ma);
          write_legend("signal", "Signal : ", lgd_ma);
          write_legend("div", "Divergence : ", lgd_ma);
      }

      function write_legend(name, title, legend) {
          legend.append("tspan")
              .attr("class", "lgd_name")
              .attr("dx", 8)
              .text(title);
          lgd[name] = legend.append("tspan")
              .attr("class", "lgd_val lgd_" + name);
      }

    // Affichage des valeurs au survol

      $.wrap.append("rect")
          .attr("class", "overlay")
          .attr("width", $.width)
          .attr("height", $.svg_height - $.padding + $.bottom);

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

          var evol = !!y ? (d.price - y.price) / y.price * 100 : 0,
              evolc = evol > 0 ? ' plus' : (evol < 0 ? ' minus': ''),
              evols = evol > 0 ? '▲ ' : (evol < 0 ? '▼ ': '◼ ');

          lgd_date.text(fr_time(d.date));
          lgd['price'].text(fr_digit(d.price) + " €");

          lgd_diff.attr("class", "lgd_diff" + evolc);
          lgd_triangle.text(evols);
          lgd_difference.text(fr_digit(evol).replace('-','')+" %");

          lgd['ewma12'].text(fr_digit(d.ewma12));
          lgd['ewma26'].text(fr_digit(d.ewma26));
          lgd['bollinger'].text(fr_digit(d.bollinger_lower)
              + ' – ' + fr_digit(d.bollinger_upper));

          if ($.macd) {
            lgd['macd'].text(fr_digit(d.macd));
            lgd['signal'].text(fr_digit(d.signal));
            lgd['div'].text(fr_digit(d.div));
            lgd['div'].attr("class", "val " +
                ((d.div >= 0) ? "plus" : "minus"));
          }
      }

  };



  // Mise à jour du sélecteur
  // ------------------------

  this.brushed = function() {

      $.update_axis();

      d3.selectAll(".range tspan").classed("active", 0);

      for (var c in $.curves) {
          $.wrap.select("."+$.curves[c])
              .attr("d", $[$.curves[c]]);
      }

      $.wrap.select(".bollinger")
          .attr("d", $.bollinger);

      if (!!$.y_macd) {

        d3.select("#positif path")
            .attr("d", $.div.y1(function(d){
              return Math.min($.y_macd(0), $.y_macd(d.div)); }));

        d3.select("#negatif path")
            .attr("d", $.div.y1(function(d){
              return Math.max($.y_macd(0), $.y_macd(d.div)); }));

        d3.select(".macd")
            .attr("d", $.macd);

        d3.select(".signal")
            .attr("d", $.signal);

        $.div = d3.svg.area()
            .x(function(d){ return $.x(d.date); })
            .y0($.y_macd(0));
      }

  };



  // Affichage des intervalles de temps
  // ----------------------------------

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

        if (!!$.brush) {
          $.brush.extent([start, today]);
          $.brushed();
          d3.select('.div_zoom .x.brush').call($.brush.extent([start,today]));
        }

        else {
          $.init_ext = [start, today];
        }
      }

      else {
        $.brush.extent(d3.extent($.data.map(function(d){ return d.date })));
        $.brushed();
        d3.select('.div_zoom .x.brush').call($.brush.clear());
      }

      d3.selectAll(".range tspan").classed("active", 0);
      d3.select(".range_" + time).classed("active", 1);

  };


  var $ = this;
  $.init();

}
