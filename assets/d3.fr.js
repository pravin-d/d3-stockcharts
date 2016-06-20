/*
  D3.js – traduction française
  Sylvain Durand – MIT license
*/

var fr = d3.locale({
          "decimal": ",",
          "thousands": " ",
          "grouping": [3],
          "currency": ["", " €"],
          "dateTime": "%A %e %B %Y",
          "date": "%d/%m/%Y",
          "time": "%H h %M",
          "periods": ["AM", "PM"],
          "days": ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
          "shortDays": ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
          "months": ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
          "shortMonths": ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juill.", "août", "sept.", "oct.", "nov.", "déc."] })

var fr_time  = fr.timeFormat('%A %e %B %Y'),
    fr_digit = fr.numberFormat(",.2f"),
    fr_axis  = fr.timeFormat.multi([
                ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
                ["%d %b", function(d) { return d.getDate() != 1; }],
                ["%b", function(d) { return d.getMonth(); }],
                ["%Y", function() { return true; }]
              ]);
