/*
  Affichage des cours avec D3
  Sylvain Durand – MIT license
*/

"use strict";


function stocks(div) {

  this.init = function() {

    // Modèles de boîtes

      var height  = 350,
          width   = 760,
          padding =  60,
          top     =  30,
          right   =  10,
          left    =  40;

      $.bottom  = 100;

    // Définition des échelles

      $.x  = d3.time.scale().range([0, width]);
      $.x2 = d3.time.scale().range([0, width]);
      $.y2 = d3.scale.linear().range([$.bottom, 0]);

      $.y  = d3.scale.linear().range([height, 0]);


      $.x_axis = d3.svg.axis().scale($.x).orient("bottom").tickFormat(fr_axis);
      $.y_axis = d3.svg.axis().scale($.y).orient("left");


    // Création de l'espace de travail

      $.svg = d3.select(div).append("svg")
          .attr("width", width + left + right)
          .attr("height", height + top + padding + $.bottom);

      $.svg.append("defs").append("clipPath")
          .attr("id", "clip")
          .append("rect")
          .attr("width", width)
          .attr("height", height);

      $.graph = $.svg.append("g")
          .attr("class", "graph")
          .attr("transform", "translate("+left+","+top+")");

    // Créations des courbes

      $.graph.append("path")
          .attr("class", "line")
          .style("clip-path", " url(#clip)");

      $.price = d3.svg.line()
          .interpolate("monotone")
          .x(function(d) { return $.x(d.date) })
          .y(function(d) { return $.y(d.price) });


    // Création du sélecteur

      $.map = $.svg.append("g")
          .attr("transform", "translate("+left+","+(height+padding)+")");

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
          .attr("transform", "translate(0,"+height+")");

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
          .attr("transform", "translate("+left+","+top+")");

      $.text = $.graph.append('g')
          .style('text-anchor', 'end')
          .attr('transform', 'translate('+width+',-5)')
          .append('text')
          .attr('class', 'valeurs');

      $.svg.append("rect")
          .attr("class", "overlay")
          .attr("width", width)
          .attr("height", height)
          .attr("transform", "translate("+left+","+top+")");
  }


  this.compute_domain = function(data, ext) {

    // Calcule le domaine sur la plage donnée
      function val(d, value) {
        return (d.date >= ext[0] && d.date <= ext[1]) ? d.price : value;
      }

      if (!ext) {
        var min = d3.min(data.map(function(d) { return d.price })),
            max = d3.max(data.map(function(d) { return d.price }));
      }

      else {
        var dom = $.compute_domain(data, ''),
            min = d3.min(data.map(function(d) { return val(d, dom[1]) })),
            max = d3.max(data.map(function(d) { return val(d, dom[0]) })),
            min = (min + dom[0])/2,
            max = (max + dom[1])/2;
      }

      var Δ = (max-min) * 0.02;
      return [min - Δ, max + Δ];
  }


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


  this.draw = function() {

    // Calcul des intervalles

      $.x.domain(d3.extent($.data.map(function(d) { return d.date })));
      $.y.domain($.compute_domain($.data, ''));

      $.x2.domain($.x.domain());
      $.y2.domain($.y.domain());

    // Calcul des axes

      $.svg.select(".x.axis")
          .call($.x_axis);

      $.graph.select(".y.axis")
          .call($.y_axis);

      $.map.select(".x.axis")
          .call($.x_axis);

      $.map.select(".x.brush")
          .call($.brush)
          .selectAll("rect")
          .attr("y", -6)
          .attr("height", $.bottom + 5);

    // Calcul des courbes

      $.graph.select(".line")
          .datum($.data)
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
              $.text.text('');
            });

      function show_price() {

        // Affichage du prix

          var x0 = $.x.invert(d3.mouse(this)[0]),
              i = d3.bisector(function(d){return d.date}).left($.data, x0, 1),
              d0 = $.data[i - 1],
              d1 = $.data[i],
              d = x0 - d0.date > d1.date - x0 ? d1 : d0;

          $.focus.attr("transform", "translate("+$.x(d.date)+","+$.y(d.price)+")");
          $.text.text(fr_time(d.date) + ' – ' + fr_digit(d.price) + " €");
      }

      $.brush.on("brush", function () {
        // Affichage de la sélection

          var ext = $.brush.extent();

          if (!$.brush.empty()) {
              $.x.domain($.brush.empty() ? $.x2.domain() : $.brush.extent());
              $.y.domain($.compute_domain($.data, ext));
          }

          else {
            $.x.domain(d3.extent($.data.map(function(d) { return d.date })));
            $.y.domain($.compute_domain($.data, ''));
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


// graph.graph.select(".line").datum(graph.data).attr("d", graph.price);
