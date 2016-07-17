#D3-stockchart

This script aims to provide simple, lightweight, modulable and responsive **financial charts**. It allows to draw curves, areas or bands, on one or several charts, to show custom time intervals, and show values on mouse over.

<a href="https://www.sylvaindurand.org"><img src="preview.png" width="670" height="570" /></a>

## Usage

```js
d3.csv("data.csv", function(e, data) {
  var chart = new stockchart(data, "2y", "#mydiv", [
    // First chart
      {
        height: 250,
        x_axis: true,
        curves: [
          {id: "open",  color: "#A2C0D9", name: "Open"},
          {id: "high",  color: "#F4A6A6", name: "High"},
          {id: "low",   color: "#A2C0D9", name: "Low"},
          {id: "close", color: "#666666", name: "Price", diff: true},
        ]
      },
    // Second chart
      {
        curves: [
          {id: "signal", color: "#E0B8DA", name: "Signal"},
        ]
      }
    ]);
});
```

## Reference

### Functions

<a href="#new" name="new">#</a> <b>stockchart</b>(<i>data</i>, <i>time</i>, <i>container</i>, <i>parameters</i>)

Create a stockchart constructor and show the chart in the specified *container*, based on the specified *data* (see [*stocks*.load](#load)), *time* interval (see [*stocks*.show](#show)), and module and curves *parameters* (see below).

```js
d3.csv("mydata.csv", function(e, data) {
  var chart = new stockchart(data, "1y", "#mydiv", parameters);
});
```

<a href="#load" name="load">#</a> <i>stocks</i>.<b>load</b>(<i>data</i>)

Read and draw the specified data, which can be returned from [d3.csv](https://github.com/d3/d3-request/blob/master/README.md#csv), [d3.tsv](https://github.com/d3/d3-request/blob/master/README.md#tsv), [d3.json](https://github.com/d3/d3-request/blob/master/README.md#json) or [d3.xml](https://github.com/d3/d3-request/blob/master/README.md#xml). If another chart is already shown, clear the current chart and draw the specified data.

```js
d3.csv("mydata.csv", function(e, data) {
  chart.load(data);
});
```

<a href="#show" name="show">#</a> <i>stocks</i>.<b>show</b>([<i>time</i>])

Show data from the specified time interval, provided as a string in months (*e.g.* `6m`) or years (*e.g.* `2y`). If time interval isn't specified or can't be read, show all values.

```js
chart.show("2y");
chart.show("6m");
```

### Parameters
The *parameters* argument provides a list of charts (defined as objects), which contains a list of curves (also defined as object). Both can take several options.


#### Charts

<a href="#curves" name="curves">#</a> <b>curves</b>: list of the curves to be drawn in the current chart; see below.

<a href="#height" name="height">#</a> <b>height</b>: defines the height of the current chart, which defaults to 60.

<a href="#ratio" name="ratio">#</a> <b>ratio</b>: gives the ability to show relative values, based on the data selected the specified `id`.

<a href="#x_axis" name="x_axis">#</a> <b>x_axis</b>: if true, draw an horizontal axis under the given chart.

<a href="#y_axis" name="y_axis">#</a> <b>y_axis</b>: if `sym` is provided, the vertical axis will have a symetrical domain.


#### Curves

<a href="#color" name="color">#</a> <b>color</b>: specify the color of the curve.

<a href="#diff" name="diff">#</a> <b>diff</b>: if *true*, show the evolution since the day before in the legend.

<a href="#id" name="id">#</a> <b>id</b>: set the curve `id`, which must be the same than the column name in the provided *data*; if an array of two `id` is specified, draw an area between those two curves.

<a href="#name" name="name">#</a> <b>name</b>: specify the name shown in the legend; if not specified, the data won't be shown in the legend.

<a href="#type" name="type">#</a> <b>type</b>: if `area` is provided, draw a green and red area chart depending of the sign.

<a href="#width" name="width">#</a> <b>width</b>: specify the width of the curve.


## Question?
Please feel free to [open an issue](https://github.com/sylvaindurand/d3-stockchart/issues) or to [push a commit](https://github.com/sylvaindurand/d3-stockchart/pulls).

## License

This repository is released under [MIT License](http://opensource.org/licenses/MIT).
