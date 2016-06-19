/*
  Affichage des cours avec D3
  Sylvain Durand – MIT license
*/


function stocks(div) {

  // Modèles de boîtes

    var height = 370,
        width  = 760,
        top    =  20,
        right  =  10,
        bottom =  50,
        left   =  40;

  // Axes

    var x  = d3.time.scale().range([0, width]),
        x2 = d3.time.scale().range([0, width]),
        y  = d3.scale.linear().range([height, 0]),
        y2 = d3.scale.linear().range([bottom, 0]);

    var x_axis  = d3.svg.axis().scale(x).orient("bottom").tickFormat(format),
        y_axes  = d3.svg.axis().scale(y).orient("left");

    var brush = d3.svg.brush()
        .x(x2)
        .on("brush", brushed);

  // Création de l'espace de travail

    var svg = d3.select(div).append("svg")
        .attr("width", width + left + right)
        .attr("height", height + top + 2*bottom);

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    var area = d3.svg.line()
        .x(function(d) { return x(d.date);  })
        .y(function(d) { return y(d.price); });

    var area2 = d3.svg.area()
        .y0(bottom)
        .x(function(d)  { return x2(d.date);  })
        .y1(function(d) { return y2(d.price); });

    var graph = svg.append("g")
        .attr("class", "graph")
        .attr("transform", "translate(" + left + "," + top + ")");

    var map = svg.append("g")
        .attr("class", "map")
        .attr("transform", "translate(" + left + "," + (height+bottom) + ")");


  d3.json('json/assets/FR0000077919.json', function(err, data) {

    // Chargement des données

      var d = []
      for (var i in data) {
        d.push({
          'price': parseFloat(data[i]),
          'date': d3.time.format('%Y-%m-%d').parse(i)
        })
      }
      data = d

    // Réinitialisation des axes par défaut

      x.domain(d3.extent(data.map(function(d) { return d.date; })));
      y.domain([0, d3.max(data.map(function(d) { return d.price; }))]);
      x2.domain(x.domain());
      y2.domain(y.domain());

      graph.append("path")
          .datum(data)
          .attr("class", "line")
          .attr("d", area)
          .style("clip-path", " url(#clip)");

      graph.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(x_axis);

      graph.append("g")
          .attr("class", "y axis")
          .call(y_axes);

      map.append("path")
          .datum(data)
          .attr("class", "area")
          .attr("d", area2)
          .style("clip-path", " url(#clip)");

      map.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + bottom + ")")
          .call(x_axis);

      map.append("g")
          .attr("class", "x brush")
          .call(brush)
          .selectAll("rect")
          .attr("y", -6)
          .attr("height", bottom + 7);

      var focus = svg.append("g")
            .attr("class", "focus")
            .style("display", "none");

          focus.append("circle")
            .attr("r", 2.5)
            .attr("transform", "translate(" + left + "," + top + ")");

      var helper = graph.append('g')
          .style('text-anchor', 'end')
          .attr('transform', 'translate(' + width + ', -5)');

      var text = helper.append('text')
                 .attr('class', 'valeurs');

      svg.append("rect")
          .attr("class", "overlay")
          .attr("width", width)
          .attr("height", height)
          .attr("transform", "translate(" + left + "," + top + ")")
          .on("mouseover", function() { focus.style("display", null); })
          .on("mouseout", function() { focus.style("display", "none"); })
          .on("mousemove", function() {
              var x0 = x.invert(d3.mouse(this)[0]),
                  i = d3.bisector(function(d) { return d.date; }).left(data, x0, 1),
                  d = x0 - data[i - 1].date > data[i].date - x0 ? data[i] : data[i - 1];
                  focus.attr("transform", "translate(" + x(d.date) +  "," + y(d.price) + ")");
                  text.text(fr.timeFormat('%A %e %B %Y')(d.date) + ' – ' + fr.numberFormat(",.2f")(d.price) + " €");
          });

  });

  function brushed() {
    x.domain(brush.empty() ? x2.domain() : brush.extent());
    graph.select(".area").attr("d", area);
    graph.select(".line").attr("d", area);
    graph.select(".x.axis").call(x_axis);
  }

}



