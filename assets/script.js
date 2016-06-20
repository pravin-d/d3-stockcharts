/*
  Affichage des cours avec D3
  Sylvain Durand – MIT license
*/

"use strict";

function stocks(div) {

    // Modèles de boîtes

      var height = 370,
          width  = 760,
          top    =  20,
          right  =  10,
          bottom =  50,
          left   =  40;


    // Définition des échelles

      var x  = d3.time.scale().range([0, width]),
          x2 = d3.time.scale().range([0, width]),
          y  = d3.scale.linear().range([height, 0]),
          y2 = d3.scale.linear().range([bottom, 0]);

      var x_axis = d3.svg.axis().scale(x).orient("bottom").tickFormat(fr_axis),
          y_axes = d3.svg.axis().scale(y).orient("left");


    // Création de l'espace de travail

      var svg = d3.select(div).append("svg")
            .attr("width", width + left + right)
            .attr("height", height + top + 2*bottom);

      svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);

      var graph = svg.append("g")
            .attr("class", "graph")
            .attr("transform", "translate("+left+","+top+")");

    // Créations des courbes

      graph.append("path")
          .attr("class", "line")
          .style("clip-path", " url(#clip)");

      var price = d3.svg.line()
          .interpolate("basis")
          .x(function(d) { return x(d.date) })
          .y(function(d) { return y(d.price) });


    // Création du sélecteur

      var map = svg.append("g")
            .attr("transform", "translate("+left+","+(height+bottom)+")");

      map.append("path")
         .attr("class", "area")
         .style("clip-path", " url(#clip)")

      var zoom = d3.svg.area()
            .interpolate("monotone")
            .x(function(d) { return x2(d.date) })
            .y1(function(d) { return y2(d.price) })
            .y0(bottom);

      var brush = d3.svg.brush()
            .x(x2)
            .on("brush", brushed);

      map.append("g")
            .attr("class", "x brush")
            .call(brush)
            .selectAll("rect")
            .attr("y", -6)
            .attr("height", bottom + 5);

      function brushed() {
        x.domain(brush.empty() ? x2.domain() : brush.extent());
        graph.select(".area").attr("d", price);
        graph.select(".line").attr("d", price);
        graph.select(".x.axis").call(x_axis);
      }


    // Créations des axes

      graph.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0,"+height+")");

      graph.append("g")
          .attr("class", "y axis");

      map.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0,"+bottom+")");

    // Affichage des valeurs

      var focus = svg.append("g")
          .attr("class", "focus")
          .style("display", "none");

      focus.append("circle")
        .attr("r", 2.5)
        .attr("transform", "translate("+left+","+top+")");

      var text = graph.append('g')
          .style('text-anchor', 'end')
          .attr('transform', 'translate('+width+',-5)')
          .append('text')
          .attr('class', 'valeurs');

      svg.append("rect")
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            .attr("transform", "translate("+left+","+top+")");


      function draw_data(err, data) {

        // Lecture des données

          var d = []
          for (var i in data) {
            d.push({
              'price': parseFloat(data[i]),
              'date': d3.time.format('%Y-%m-%d').parse(i)
            })
          }
          data = d

        // Calcul des intervalles

          x.domain(d3.extent(data.map(function(d) { return d.date; })));
          y.domain([0, d3.max(data.map(function(d) { return d.price; }))]);
          x2.domain(x.domain());
          y2.domain(y.domain());

        // Calcul des axes

          svg.select(".x.axis")
              .call(x_axis);

          graph.select(".y.axis")
              .call(y_axes);

          map.select(".x.axis")
              .call(x_axis);

        // Calcul des courbes

          graph.select(".line")
              .datum(data)
              .attr("d", price);

          map.select(".area")
              .datum(data)
              .attr("d", zoom);

        // Affichage des valeurs

          svg.select(".overlay")
              .on("mousemove", show_price)
              .on("mouseover", function() { focus.style("display", null); })
              .on("mouseout", function() {
                  focus.style("display", "none");
                  text.text('');
                });

        function show_price() {
          var x0 = x.invert(d3.mouse(this)[0]),
              i = d3.bisector(function(d){return d.date}).left(data, x0, 1),
              d0 = data[i - 1],
              d1 = data[i],
              d = x0 - d0.date > d1.date - x0 ? d1 : d0;

          focus.attr("transform", "translate("+x(d.date)+","+y(d.price)+")");
          text.text(fr_time(d.date) + ' – ' + fr_digit(d.price) + " €");
        }

      }

      d3.json('json/assets/FR0000077919.json', draw_data);

}



