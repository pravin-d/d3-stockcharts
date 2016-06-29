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

      $.width   = 760;
      $.height  = 350;
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
        isin = window.location.search.replace("?", "")
      }

      d3.csv('data/isin/' + isin + '.csv', function(err, data) {
          $.read(err, data);
          $.set_zoom("1a", 1)
          $.draw_plot();
          $.draw_macd();
          $.draw_zoom();
          $.show_data();
      })
  }



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
  }



  // Affichage du graphique
  // ----------------------

  this.draw_plot = function() {

    // Définition des échelles

      $.x  = d3.time.scale().range([0, $.width]);
      $.x_axis = d3.svg.axis().scale($.x)
          .orient("bottom").tickFormat(fr_axis);


    // Création de l'espace de travail

      $.svg = d3.select(div)
          .append("svg")
          .attr("class", "plot")
          .attr("width", $.width + $.left + $.right )
          .attr("height", $.height + $.top + $.bottom)

      $.svg.append("defs").append("clipPath")
          .attr("id", "clip")
          .append("rect")
          .attr("width", $.width)
          .attr("height", $.top + $.height + $.bottom);

      $.plot = $.svg.append("g")
          .attr("class", "wrap")
          .attr("transform", "translate(" + $.left + "," + $.top + ")");


    // Créations des courbes

      for (var c in $.curves) {
        $.plot.append("path")
            .attr("class", $.curves[c])
            .style("clip-path", " url(#clip)");
      }

      $.plot.append("path")
          .attr("class", "bollinger")
          .style("clip-path", " url(#clip)")


    // Calcul des données

      if ($.type == "relative") {
        $.compute_ratio($.data[0].price);
      }

      $.pre = ($.type == "relative") ? "ratio_" : "";


    // Créations et affichage des axes

      $.plot.append("g")
          .attr("class", "y axis");

      $.plot.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + $.height + ")");

      if ($.type == "relative") {
        $.y = d3.scale.log().range([$.height, 0]);
        $.y_axis = d3.svg.axis()
            .scale($.y)
            .orient("left")
            .tickSize(-$.width, 0)
            .tickFormat(function(x) { return d3.format("+.0%")(x - 1); });
      }

      else {
        $.y = d3.scale.linear().range([$.height, 0]);
        $.y_axis = d3.svg.axis().scale($.y).orient("left").tickSize(-$.width, 0);
      }

      $.update_axis();

      $.plot.select(".x.axis")
          .call($.x_axis);

      $.plot.select(".y.axis")
          .call($.y_axis)
          .selectAll(".tick")
          .classed("tick-one", function(d){ return Math.abs(d-1) < 1e-6; });


    // Calcul des courbes

      function draw(curve) {
          $[curve] = d3.svg.line()
            .x(function(d){ return $.x(d.date) })
            .y(function(d){ return $.y(d[$.pre + curve]) });

          $.plot.select("."+curve)
            .datum($.data).transition().duration(1000)
            .attr("d", $[curve]);
      }

      for (var c in $.curves) {
        draw($.curves[c]);
      }

      $.bollinger = d3.svg.area()
          .x(function(d){ return $.x(d.date) })
          .y1(function(d){ return $.y(d[$.pre + "bollinger_upper"]) })
          .y0(function(d){ return $.y(d[$.pre + "bollinger_lower"]) });

      $.plot.select(".bollinger")
          .datum($.data).transition().duration(1000)
          .attr("d", $.bollinger);
  }



  // Affichage du MACD
  // -----------------

  this.draw_macd = function() {

    // Définition de la zone de travail

      $.svg.attr("height", + $.svg.attr("height") + $.padding + $.bottom )

      var macd = $.plot.append("g")
          .attr("class", "macd_box")
          .attr("transform", "translate(0," +
                                  ($.top + $.height + $.bottom ) + ")");


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
      $.y_macd.domain($.compute_domain("macd"));
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
            return Math.min($.y_macd(0), $.y_macd(1.5 * d.div)) }));

      macd.datum($.data)
          .append("clipPath")
          .attr("id", "negatif")
          .append("path")
          .attr("d", $.div.y1(function(d){
            return Math.max($.y_macd(0), $.y_macd(1.5 * d.div)) }));

      macd.select("path.macd").attr("d", $.macd);
      macd.select("path.signal").attr("d", $.signal);

  }



  // Affichage du sélecteur
  // ----------------------

  this.draw_zoom = function() {

    // Définition de la zone de travail

      var zoom = d3.select(div)
          .append("svg")
          .attr("class", "zoom")
          .attr("width",  ($.width + $.left + $.right ))
          .attr("height", ($.padding + $.bottom))
          .append("g")
          .attr("transform", "translate(" + $.left + ",0)");


    // Définition des échelles

      var x_zoom = d3.time.scale().range([0, $.width]);
      var y_zoom = d3.scale.linear().range([$.padding, 0]);


    // Définition des courbes

      zoom.append("path")
          .attr("class", "area")
          .style("clip-path", " url(#clip)")


    // Calcul des axes

      x_zoom.domain(d3.extent($.data.map(function(d){ return d.date })));
      y_zoom.domain(d3.extent($.data.map(function(d){ return d.price })));

    // Définition du sélecteur

      $.brush = d3.svg.brush()
          .x(x_zoom);

      zoom.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + $.padding + ")")
          .call($.x_axis);

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

      $.brush.on("brush", $.brushed);

      if (!!$.init_ext) {
        d3.select('.zoom .x.brush')
            .call($.brush.extent($.init_ext))

        delete($.init_ext);
      }
  }



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
  }



  // Mise à jour des axes
  // --------------------


  this.update_axis = function() {

    // Calcul de l'axe horizontal

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

        $.y_axis.tickValues(d3.scale.linear().domain($.y.domain()).ticks(8));
        $.compute_ratio(basevalue);
      }


    // Calcul des axes verticaux

      $.y.domain($.compute_domain($.pre + "price"));
  }



  // Calcul des domaines
  // -------------------

  this.compute_domain = function(key) {
      var dom = d3.extent($.data.map(function(d){ return d[key] })),
          ens = [];

      function val(d) {
          return (d.date >= $.ext[0] && d.date <= $.ext[1]) ? d[key] : undefined;
      }

      if (!$.init_ext && (key == "macd" || !$.brush || $.brush.empty())) {
        ens = dom;
      }

      else {
        ens = d3.extent($.data.map(val));
        if ($.type != "relative") {
          ens = [(4 * ens[0] + dom[0])/5, (4 * ens[1] + dom[1])/5];
        }
      }

      var Δ = (ens[1] - ens[0]) * 0.1;
      return [ens[0] - Δ, ens[1] + Δ];
  }




  // Affichage du curseur et des valeurs au survol
  // ---------------------------------------------

  this.show_data = function() {

    // Création de la ligne

      $.focus = $.plot.append("g")
          .attr("class", "focus")
          .style("display", "none");

      $.focus.append("line")
          .attr("y1", 10)
          .attr("y2", 10 * $.height);


    // Création des textes

      var lgd = {}

      var lgd_date = d3.select(div)
          .insert("div",".stocks")
          .attr("class", "lgd_date");

      var lgd_plot = d3.select(div)
          .insert("div",".stocks")
          .attr("class", "lgd_plot")
          .style("left", $.left + "px");

      var lgd_ma = d3.select(div)
          .insert("div",".stocks")
          .attr("class", "lgd_ma")
          .style("left", $.left + "px")
          .style("top", $.top + $.height + $.bottom + "px");

      write_legend("price", "Fermeture", lgd_plot);
      var lgd_diff = lgd_plot.append("span").attr("class", "val");
      write_legend("ewma12", "EWMA12", lgd_plot);
      write_legend("ewma26", "EWMA26", lgd_plot);
      write_legend("bollinger", "Bollinger", lgd_plot);

      if ($.macd) {
          write_legend("macd", "MACD", lgd_ma);
          write_legend("signal", "Signal", lgd_ma);
          write_legend("div", "Divergence", lgd_ma);
      }

      function write_legend(name, title, legend) {
          legend.append("span").attr("class", "lgd").text(title + " : ");
          lgd[name] = legend.append("span").attr("class", "val lgd_" + name);
      }

    // Affichage des valeurs dynamiquement

      $.plot.append("rect")
          .attr("class", "overlay")
          .attr("width", $.width)
          .attr("height", 10 * $.height)

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

              update_legends(d, test ? d0 : $.data[i - 2])
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
              evolc = evol > 0 ? ' plus' : (evol < 0 ? ' minus': '');

          lgd_date.text(fr_time(d.date));
          lgd['price'].text(fr_digit(d.price));

          lgd_diff.text(fr_digit(evol).replace('-','')+" %");
          lgd_diff.attr("class", "val evol" + evolc);

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

  }



  // Mise à jour du sélecteur
  // ------------------------

  this.brushed = function(transition) {

      function animate(fun) {
        if (transition == 1) {
          return fun.transition().duration(750);
        }

        return fun;
      }

      $.update_axis();

      $.plot.select(".x.axis").call($.x_axis);
      $.plot.select(".y.axis").call($.y_axis);

      for (var c in $.curves) {
          animate($.plot.select("."+$.curves[c]))
          .attr("d", $[$.curves[c]]);
      }

      animate($.plot.select(".area"))
          .attr("d", $.price);

      animate($.plot.select(".bollinger"))
          .attr("d", $.bollinger);

      if (!!$.y_macd) {

        animate(d3.select("#positif path"))
            .attr("d", $.div.y1(function(d){
              return Math.min($.y_macd(0), $.y_macd(1.5 * d.div)) }));

        animate(d3.select("#negatif path"))
            .attr("d", $.div.y1(function(d){
              return Math.max($.y_macd(0), $.y_macd(1.5 * d.div)) }));

        animate(d3.select(".macd"))
            .attr("d", $.macd);

        animate(d3.select(".signal"))
            .attr("d", $.signal);

        $.div = d3.svg.area()
            .x(function(d){ return $.x(d.date) })
            .y0($.y_macd(0));
      }

  }



  // Affichage des intervalles de temps
  // ----------------------------------

  this.set_zoom = function(time, init) {

      var today = new Date($.data[$.data.length - 1].date),
          start = new Date($.data[$.data.length - 1].date),
          arg = /(\d+)(.)/.exec(time);

      if (arg[2] == 'm') {
        start.setMonth(start.getMonth() - arg[1])
      }

      if (arg[2] == 'y' || arg[2] == 'a') {
        start.setFullYear(start.getFullYear() - arg[1])
      }

      if (init === undefined) {
        $.brush.extent([start, today])
        $.brushed(1);
        d3.select('.zoom .x.brush')
            .transition()
            .duration($.brush.empty() ? 0 : 0)
            .call($.brush.extent([start, today]))
      }

      else {
        $.init_ext = [start, today];
      }

  }


  var $ = this;
  $.init();

}
