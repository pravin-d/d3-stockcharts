/*
  Affichage des cours avec D3
  Sylvain Durand – MIT license
*/

"use strict";


function stocks(div) {


  // Initialisation du graphique
  // ---------------------------

  this.init = function() {

    // Données à afficher sur le graphique

      $.curves = ["ewma12", "ewma26", "price"];
      $.variables = $.curves.concat(["bollinger_lower", "bollinger_upper"]);


    // Modèles de boîtes

      $.width   = 760;
      $.height  = 350;
      $.padding =  40;
      $.top     =  20;
      $.right   =  10;
      $.bottom  =  80;
      $.left    =  40;


    // Définition des échelles

      $.x  = d3.time.scale().range([0, $.width]);
      $.x2 = d3.time.scale().range([0, $.width]);
      $.y2 = d3.scale.linear().range([$.bottom, 0]);
      $.y3 = d3.scale.linear().range([$.bottom, 0]);
      $.x_axis = d3.svg.axis().scale($.x).orient("bottom").tickFormat(fr_axis);
      $.y3_axis = d3.svg.axis().scale($.y3).orient("left").tickSize(-$.width, 0).ticks(5);

    // Création de l'espace de travail

      $.svg = d3.select(div).append("svg")
          .attr("width", $.width + $.left + $.right)
          .attr("height", $.height + $.top + 2 * $.padding + 2 * $.bottom);

      $.svg.append("defs").append("clipPath")
          .attr("id", "clip")
          .append("rect")
          .attr("width", $.width)
          .attr("height", $.height + $.padding + $.bottom);

      $.plot = $.svg.append("g")
          .attr("class", "plot")
          .attr("transform", "translate(" + $.left + "," + $.top + ")");

      $.tool = $.svg.append("g")
          .attr("class", "tool")
          .attr("transform", "translate(" + $.left + "," +
            ($.top + $.height + $.padding * 3 / 4) + ")");

      $.zoom = $.svg.append("g")
          .attr("transform", "translate(" + $.left + "," +
              ($.height + 2 * $.padding + $.bottom) + ")");


    // Créations des courbes

      for (var c in $.curves) {
        $.plot.append("path")
          .attr("class", $.curves[c])
          .style("clip-path", " url(#clip)");
      }

      $.plot.append("path")
          .attr("class", "bollinger")
          .style("clip-path", " url(#clip)")

      $.tool.append("path")
          .attr("class", "macd")
          .style("clip-path", " url(#clip)")


    // Création du sélecteur

      $.zoom.append("path")
          .attr("class", "area")
          .style("clip-path", " url(#clip)")

      $.map = d3.svg.area()
          .interpolate("monotone")
          .x(function(d) { return $.x2(d.date) })
          .y1(function(d) { return $.y2(d.price) })
          .y0($.bottom);

      $.brush = d3.svg.brush()
          .x($.x2);

      $.zoom.append("g")
          .attr("class", "x brush");


    // Créations des axes

      $.plot.append("g")
          .attr("class", "y axis");

      $.plot.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0,"+$.height+")");

      $.tool.append("g")
          .attr("class", "y axis");

      $.zoom.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0,"+$.bottom+")");


    // Affichage des valeurs au survol

      $.focus = $.svg.append("g")
          .attr("class", "focus")
          .style("display", "none");

      $.focus.append("circle")
          .attr("r", 2.5)
          .attr("transform", "translate("+$.left+","+$.top+")");

      $.text = $.plot.append("g")
          .style("text-anchor", "end")
          .attr("transform", "translate("+$.width+",-5)")
          .append("text")
          .attr("class", "valeurs");

      $.svg.append("rect")
          .attr("class", "overlay")
          .attr("width", $.width)
          .attr("height", $.height + $.padding + $.bottom)
          .attr("transform", "translate("+$.left+","+$.top+")");
  }



  // Calcul de l'ensemble d'arrivée
  // ------------------------------

  this.compute_domain = function(data, key, ext) {

      function val(d, value) {
        return (d.date >= ext[0] && d.date <= ext[1]) ? d[key] : value;
      }


    // Calcul sur l'ensemble des valeurs

      if (ext === undefined) {
        var min = d3.min(data.map(function(d) { return d[key] })),
            max = d3.max(data.map(function(d) { return d[key] }));
      }


    // Calcul sur une plage donnée

      else {
        var dom = $.compute_domain(data, key),
            min = d3.min(data.map(function(d) { return val(d, dom[1]) })),
            max = d3.max(data.map(function(d) { return val(d, dom[0]) })),
            min = (4 * min + dom[0])/5,
            max = (4 * max + dom[1])/5;
      }


    // Retour de l'ensemble avec une marge

      var Δ = (max-min) * 0.1;
      return [min - Δ, max + Δ];
  }



  // Calcul des pourcentages
  // -----------------------

  this.compute_ratio = function(base) {

    for (var c in $.variables) {
        $.data.forEach(function(d) {
          d['ratio_' + $.variables[c]] = d[$.variables[c]] / base;
        });
      }
  }



  // Importation des données en JSON
  // -------------------------------

  this.read = function(err, data) {

    // Lecture des données

      data.forEach(function(d) {
          d.price = +d.price;
          d.date = d3.time.format('%Y-%m-%d').parse(d.date);
          d.ewma12 = +d.ewma12;
          d.ewma26 = +d.ewma26;
          d.bollinger_upper = +d.bollinger_upper;
          d.bollinger_lower = +d.bollinger_lower;
          d.macd = +d.macd;
        });

      $.data = data;
      $.draw();

  }



  // Affichage du graphique
  // ----------------------

  this.draw = function(type) {

    if (type === undefined) {
      type = "absolute";
    }

    // Calcul des données

      if (type == "relative") {
        $.compute_ratio($.data[0].price);
      }

      var pre = (type == "relative") ? "ratio_" : "";

    // Calcul des intervalles

      $.x.domain(d3.extent($.data.map(function(d) { return d.date })));

      $.y  = d3.scale.linear().range([$.height, 0]);
      $.y.domain($.compute_domain($.data, "price"));
      $.y_axis = d3.svg.axis().scale($.y).orient("left").tickSize(-$.width, 0);

      $.x2.domain($.x.domain());
      $.y2.domain($.y.domain());

      $.y3.domain($.compute_domain($.data, "macd"));

      if (type == "relative") {
        var percent = function(x) { return d3.format("+.0%")(x - 1); };

        $.y  = d3.scale.log().range([$.height, 0]);
        $.y_axis = d3.svg.axis()
            .scale($.y)
            .orient("left")
            .tickSize(-$.width, 0)
            .tickFormat(percent);
        $.y.domain($.compute_domain($.data, "ratio_price"));
        $.y_axis.tickValues(d3.scale.linear().domain($.y.domain()).ticks(8));

      }


    // Affichages des axes

      $.svg.select(".x.axis")
          .call($.x_axis);

      $.plot.select(".y.axis")
          .call($.y_axis)
           .selectAll(".tick")
           .classed("tick-one", function(d) { return Math.abs(d-1) < 1e-6; });

      $.tool.select(".y.axis")
          .call($.y3_axis);

      $.zoom.select(".x.axis")
          .call($.x_axis);

      $.zoom.select(".x.brush")
          .call($.brush)
          .selectAll("rect")
          .attr("y", -6)
          .attr("height", $.bottom + 5);


    // Calcul des courbes

      function draw(curve) {
        $[curve] = d3.svg.line()
          .x(function(d) { return $.x(d.date) })
          .y(function(d) { return $.y(d[pre + curve]) });

        $.plot.select("."+curve)
          .datum($.data).transition().duration(1000)
          .attr("d", $[curve]);
      }

      for (var c in $.curves) {
        draw($.curves[c]);
      }

      $.bollinger = d3.svg.area()
        .x(function(d) { return $.x(d.date) })
        .y1(function(d) { return $.y(d[pre + "bollinger_upper"]) })
        .y0(function(d) { return $.y(d[pre + "bollinger_lower"]) });

      $.plot.select(".bollinger")
        .datum($.data).transition().duration(1000)
        .attr("d", $.bollinger);

      $.macd = d3.svg.line()
        .x(function(d) { return $.x(d.date) })
        .y(function(d) { return $.y3(d.macd) });

      $.tool.select(".macd")
        .datum($.data)
        .attr("d", $.macd);

      $.zoom.select(".area")
          .datum($.data)
          .attr("d", $.map);


    // Affichage des valeurs

      $.svg.select(".overlay")
          .on("mousemove", show_price)
          .on("mouseover", function() { $.focus.style("display", null) })
          .on("mouseout", function() {
              $.focus.style("display", "none");
              $.text.text("");
            });


    // Affichage du prix

      function show_price() {
          var x0 = $.x.invert(d3.mouse(this)[0]),
              i = d3.bisector(function(d){return d.date}).left($.data, x0, 1),
              d0 = $.data[i - 1],
              d1 = $.data[i],
              d = x0 - d0.date > d1.date - x0 ? d1 : d0;

          $.focus.attr("transform", "translate("+$.x(d.date)+","+$.y(d.price)+")");
          $.text.text(fr_time(d.date) + ' – ' + fr_digit(d.price) + " €");
      }


    // Zoom sur la sélection

      $.brush.on("brush", function () {
          var ext = $.brush.extent();

          if (type == "relative") {

            var basedate = d3.min($.data.map(function(d)
                                    {if (d.date >= ext[0]) return d.date})),
                basevalue = $.data.find(function (d)
                                      {return d.date == basedate; }).price;

            $.compute_ratio(basevalue);

          }

          if (!$.brush.empty()) {
              $.x.domain($.brush.empty() ? $.x2.domain() : $.brush.extent());
              $.y.domain($.compute_domain($.data, pre + "price", ext));
          }

          else {
            $.x.domain(d3.extent($.data.map(function(d) { return d.date })));
            $.y.domain($.compute_domain($.data, pre + "price"));
          }

          if (type == "relative") {
            $.y_axis.tickValues(d3.scale.linear()
                .domain($.y.domain())
                .ticks(8));
          }


          for (var c in $.curves) {
            $.plot.select("."+$.curves[c]).attr("d", $[$.curves[c]]);
          }

          $.tool.select(".macd").attr("d", $.macd);

          $.plot.select(".area").attr("d", $.price);
          $.plot.select(".bollinger").attr("d", $.bollinger);
          $.plot.select(".x.axis").call($.x_axis);
          $.plot.select(".y.axis").call($.y_axis);

      });
  }


  var $ = this;
  $.init();

}
