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

      $.curves = ["price"];


    // Modèles de boîtes

      $.width   = 760;
      $.height  = 350;
      $.padding =  60;

      $.top     =  30;
      $.right   =  10;
      $.bottom  = 100;
      $.left    =  50;


    // Définition des échelles

      $.x  = d3.time.scale().range([0, $.width]);
      $.x2 = d3.time.scale().range([0, $.width]);
      $.y2 = d3.scale.linear().range([$.bottom, 0]);

      $.x_axis = d3.svg.axis().scale($.x).orient("bottom").tickFormat(fr_axis);


    // Création de l'espace de travail

      $.svg = d3.select(div).append("svg")
          .attr("width", $.width + $.left + $.right)
          .attr("height", $.height + $.top + $.padding + $.bottom);

      $.svg.append("defs").append("clipPath")
          .attr("id", "clip")
          .append("rect")
          .attr("width", $.width)
          .attr("height", $.height);

      $.graph = $.svg.append("g")
          .attr("class", "graph")
          .attr("transform", "translate("+$.left+","+$.top+")");


    // Créations des courbes

      $.graph.append("path")
          .attr("class", "line")
          .style("clip-path", " url(#clip)");


    // Création du sélecteur

      $.map = $.svg.append("g")
          .attr("transform", "translate("+$.left+","+($.height+$.padding)+")");

      $.map.append("path")
          .attr("class", "area")
          .style("clip-path", " url(#clip)")

      $.zoom = d3.svg.area()
          .interpolate("monotone")
          .x(function(d) { return $.x2(d.date) })
          .y1(function(d) { return $.y2(d.price) })
          .y0($.bottom);

      $.brush = d3.svg.brush()
          .x($.x2);

      $.map.append("g")
          .attr("class", "x brush");


    // Créations des axes

      $.graph.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0,"+$.height+")");

      $.graph.append("g")
          .attr("class", "y axis");

      $.map.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0,"+$.bottom+")");


    // Affichage des valeurs

      $.focus = $.svg.append("g")
          .attr("class", "focus")
          .style("display", "none");

      $.focus.append("circle")
          .attr("r", 2.5)
          .attr("transform", "translate("+$.left+","+$.top+")");

      $.text = $.graph.append("g")
          .style("text-anchor", "end")
          .attr("transform", "translate("+$.width+",-5)")
          .append("text")
          .attr("class", "valeurs");

      $.svg.append("rect")
          .attr("class", "overlay")
          .attr("width", $.width)
          .attr("height", $.height)
          .attr("transform", "translate("+$.left+","+$.top+")");
  }



  // Calcul de l'ensemble d'arrivée
  // ------------------------------

  this.compute_domain = function(data, key, ext="") {

      function val(d, value) {
        return (d.date >= ext[0] && d.date <= ext[1]) ? d[key] : value;
      }


    // Calcul sur l'ensemble des valeurs

      if (!ext) {
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

    for (var c in $.curves) {
        $.data.forEach(function(d) {
          d['ratio_' + $.curves[c]] = d[$.curves[c]] / base;
        });
      }

  }



  // Importation des données en JSON
  // -------------------------------

  this.read = function(err, data) {

    // Lecture des données

      var d = []
      for (var i in data) {
        d.push({
          'price': parseFloat(data[i]),
          'date': d3.time.format('%Y-%m-%d').parse(i)
        })
      }
      $.data = d;

      $.draw();

  }



  // Affichage du graphique
  // ----------------------

  this.draw = function(type="absolute") {

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

      $.graph.select(".y.axis")
          .call($.y_axis)
           .selectAll(".tick")
           .classed("tick-one", function(d) { return Math.abs(d-1) < 1e-6; });

      $.map.select(".x.axis")
          .call($.x_axis);

      $.map.select(".x.brush")
          .call($.brush)
          .selectAll("rect")
          .attr("y", -6)
          .attr("height", $.bottom + 5);


    // Calcul des courbes

      $.price = d3.svg.line()
          .x(function(d) { return $.x(d.date) })
          .y(function(d) { return $.y(
              d[pre + "price"]) });

      $.graph.select(".line")
          .datum($.data).transition().duration(1000)
          .attr("d", $.price);

      $.map.select(".area")
          .datum($.data)
          .attr("d", $.zoom);


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
                basevalue = graph.data.find(function (d)
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

          $.graph.select(".area").attr("d", $.price);
          $.graph.select(".line").attr("d", $.price);
          $.graph.select(".x.axis").call($.x_axis);
          $.graph.select(".y.axis").call($.y_axis);

      });
  }


  var $ = this;
  $.init();

}
