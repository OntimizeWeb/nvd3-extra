/* nvd3 extra version 1.0.0 (https://github.com/novus/nvd3) 2020-08-21 */
(function(){

// Node/CommonJS - require D3
if (typeof (module) !== 'undefined' && typeof (exports) !== 'undefined' && typeof (d3) == 'undefined') {
  d3 = require('d3');
}

// Node/CommonJS - require nvd3
if (typeof (module) !== 'undefined' && typeof (exports) !== 'undefined' && typeof (nv) == 'undefined') {
  nv = require('nvd3');
}

nv.models.gauge = function() {
  "use strict";

  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin = {top: 0, right: 0, bottom: 0, left: 0}
      , width = 500
      , height = 500
      , id = Math.floor(Math.random() * 10000) //Create semi-unique ID in case user doesn't select one
      , color = nv.utils.getColor(['#88ac67', '#f78f20', '#db4e4e'])
      , valueFormat = d3.format(',.2f')
      , title = false
      , showMinMaxLabels = false
      , min = 0
      , max = 100
      , zoneLimit1 = 0.6
      , zoneLimit2 = 0.8
      , dispatch = d3.dispatch('chartClick', 'renderEnd')
      ;


  //============================================================
  // chart function
  //------------------------------------------------------------

  var renderWatch = nv.utils.renderWatch(dispatch);

  function chart(selection) {
      renderWatch.reset();

      selection.each(function(data) {
          var availableWidth = width - margin.left - margin.right
              , availableHeight = height - margin.top - margin.bottom
              , container = d3.select(this)
              ;

          var cx = availableWidth / 2;
          var cy = availableHeight / 2;

          nv.utils.initSVG(container);

          var radius = Math.min(availableWidth, availableHeight) / 2;
          var range = max - min;
          var fontSize = Math.round(Math.min(availableWidth, availableHeight) / 9);

          var zones = [
              { from: min, to: min + range * zoneLimit1 },
              { from: min + range * zoneLimit1, to: min + range * zoneLimit2 },
              { from: min + range * zoneLimit2, to: max }
          ];

          // Setup containers and skeleton of chart
          var wrap = container.selectAll('.nv-wrap.nv-gauge').data([data]);
          var wrapEnter = wrap.enter().append('g').attr('class','nvd3 nv-wrap nv-gauge nv-chart-' + id);
          var gEnter = wrapEnter.append('g');
          var g_bands = gEnter.append('g').attr('class', 'nv-gaugeBands');
          var g_title = gEnter.append('g').attr('class', 'nv-gaugeTitle');
          var g_needle = gEnter.append('g').attr('class', 'nv-gaugeNeedle');
          var g_label = gEnter.append('g').attr('class', 'nv-gaugeLabel');
          var g_minLabel = gEnter.append('g').attr('class', 'nv-gaugeMinLabel');
          var g_maxLabel = gEnter.append('g').attr('class', 'nv-gaugeMaxLabel');

          wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

          // draw gauge bands
          for (var i in zones) {
              drawBand(zones[i].from, zones[i].to, color(i), min, max, radius, g_bands);
          }

          // draw needle
          var needlePath = buildNeedlePath(data[0][0], range, cx, cy, min, max, radius);

          var needleLine = d3.svg.line()
              .x(function(d) { return d.x; })
              .y(function(d) { return d.y; })
              .interpolate("basis");

          g_needle.append("path")
              .data([needlePath])
              .attr("d", needleLine);

          g_needle.append('circle')
              .attr('cx', 0)
              .attr('cy', 0)
              .attr('r', 0.115 * radius);

          wrap.selectAll('.nv-gaugeBands path')
              .attr("transform", function () { return "translate(" + cx + ", " + (cy - 0.08 * radius) + ") rotate(270)" });

          wrap.select('.nv-gaugeNeedle')
              .attr('transform', 'translate(' + cx + ',' + (cy - 0.08 * radius) + ')');

          wrap.select('.nv-gaugeTitle')
              .attr('transform', 'translate(' + cx + ',' + (cy / 2 + fontSize / 2) + ')');

          wrap.select('.nv-gaugeLabel')
              .attr('transform', 'translate(' + cx + ',' + (cy + radius / 2 - fontSize * 0.9) + ')');

          if (showMinMaxLabels) {
              wrap.select('.nv-gaugeMinLabel')
                  .attr('transform', 'translate(' + (cx - radius / 2.6 - fontSize * 0.9) + ',' + (cy + radius / 1.35 - fontSize * 0.9) + ')');

              wrap.select('.nv-gaugeMaxLabel')
                  .attr('transform', 'translate(' + (cx + radius / 1.25 - fontSize * 0.9) + ',' + (cy + radius / 1.35 - fontSize * 0.9) + ')');
          }

          // draw title
          if (title) {
              g_title.append("text")
                  .attr("dy", fontSize / 2)
                  .attr("text-anchor", "middle")
                  .text(title)
                  .style("font-size", fontSize + "px");
          }

          // draw value
          g_label.append("text")
              .data(data)
              .attr("dy", fontSize / 2)
              .attr("text-anchor", "middle")
              .text(valueFormat)
              .style("font-size", fontSize*0.9 + "px");

          if (showMinMaxLabels) {
              g_minLabel.append("text")
                  .data(data)
                  .attr("dy", fontSize / 2)
                  .attr("text-anchor", "start")
                  .text(valueFormat(min))
                  .style("font-size", fontSize*0.45 + "px");

              g_maxLabel.append("text")
                  .data(data)
                  .attr("dy", fontSize / 2)
                  .attr("text-anchor", "end")
                  .text(valueFormat(max))
                  .style("font-size", fontSize*0.45 + "px");
          }

          container.on('click', function(d,i) {
              dispatch.chartClick({
                  data: d,
                  index: i,
                  pos: d3.event,
                  id: id
              });
          });

          // draws a gauge band
          function drawBand(start, end, color, min, max, radius, element) {
              if (0 >= end - start) return;

              element.append("path")
                  .style("fill", color)
                  .attr("d", d3.svg.arc()
                      .startAngle(valueToRadians(start, min, max))
                      .endAngle(valueToRadians(end, min, max))
                      .innerRadius(0.65 * radius)
                      .outerRadius(0.85 * radius))
                  .attr("transform", function() { return "translate(" + radius + ", " + radius + ") rotate(270)" });
          }

          function buildNeedlePath(value, range, cx, cy, min, max, radius) {
              if (value > max) {
                  value = max;
              }

              var delta = range / 1;
              var tailValue = value - (range * (1/(270/360)) / 2);

              var head = centerPoint(valueToPoint(value, 0.8, min, max, radius), cx, cy);
              var head1 = centerPoint(valueToPoint(value - delta, 0.12, min, max, radius), cx, cy);
              var head2 = centerPoint(valueToPoint(value + delta, 0.12, min, max, radius), cx, cy);

              var tail = centerPoint(valueToPoint(tailValue, 0, min, max, radius), cx, cy);
              var tail1 = centerPoint(valueToPoint(tailValue - delta, 0.12, min, max, radius), cx, cy);
              var tail2 = centerPoint(valueToPoint(tailValue + delta, 0.12, min, max, radius), cx, cy);

              function centerPoint(point, cx, cy) {
                  point.x -= cx;
                  point.y -= cy;
                  return point;
              }

              return [head, head1, tail2, tail, tail1, head2, head];
          }

          function valueToDegrees(value, min, max) {
              range = max - min;
              return value / range * 270 - (min / range * 270 + 45);
          }

          function valueToRadians(value, min, max) {
              return valueToDegrees(value, min, max) * Math.PI / 180;
          }

          function valueToPoint(value, factor, min, max, radius) {
              return {
                  x: cx - radius * factor * Math.cos(valueToRadians(value, min, max)),
                  y: cy - radius * factor * Math.sin(valueToRadians(value, min, max))
              };
          }
      });

      renderWatch.renderEnd('gauge immediate');
      return chart;
  }

  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  chart.dispatch = dispatch;
  chart.options = nv.utils.optionsFunc.bind(chart);

  chart._options = Object.create({}, {
      // simple options, just get/set the necessary values
      width:      {get: function(){return width;}, set: function(_){width=_;}},
      height:     {get: function(){return height;}, set: function(_){height=_;}},
      title:      {get: function(){return title;}, set: function(_){title=_;}},
      showMinMaxLabels:    {get: function(){return showMinMaxLabels;}, set: function(_){showMinMaxLabels=_;}},
      valueFormat:    {get: function(){return valueFormat;}, set: function(_){valueFormat=_;}},
      id:         {get: function(){return id;}, set: function(_){id=_;}},
      min:         {get: function(){return min;}, set: function(_){min=_;}},
      max:         {get: function(){return max;}, set: function(_){max=_;}},
      zoneLimit1: {get: function(){return zoneLimit1;}, set: function(_){zoneLimit1=_;}},
      zoneLimit2: {get: function(){return zoneLimit2;}, set: function(_){zoneLimit2=_;}},

      // options that require extra logic in the setter
      margin: {get: function(){return margin;}, set: function(_){
          margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
          margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
          margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
          margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
      }},
      color: {get: function(){return color;}, set: function(_){
          color=nv.utils.getColor(_);
      }}
  });

  nv.utils.initOptions(chart);
  return chart;
};nv.models.gaugeChart = function() {
  "use strict";

  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var gauge = nv.models.gauge();

  var margin = {top: 0, right: 0, bottom: 0, left: 0}
      , width = null
      , height = null
      , color = nv.utils.defaultColor()
      , noData = null
      , dispatch = d3.dispatch('renderEnd')
      ;

  //============================================================
  // Chart function
  //------------------------------------------------------------

  var renderWatch = nv.utils.renderWatch(dispatch);

  function chart(selection) {
      renderWatch.reset();
      renderWatch.models(gauge);

      selection.each(function(data) {
          var container = d3.select(this);
          nv.utils.initSVG(container);

          var availableWidth = nv.utils.availableWidth(width, container, margin),
              availableHeight = nv.utils.availableHeight(height, container, margin);

          chart.update = function() { container.transition().call(chart); };
          chart.container = this;

          // Display No Data message if there's nothing to show.
          if (!data || !data.length) {
              nv.utils.noData(chart, container);
              return chart;
          } else {
              container.selectAll('.nv-noData').remove();
          }

          // Setup containers and skeleton of chart
          var wrap = container.selectAll('g.nv-wrap.nv-gaugeChart').data([data]);
          var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-gaugeChart').append('g');
          var g = wrap.select('g');

          gEnter.append('g').attr('class', 'nv-gaugeWrap');

          wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

          // Main Chart Component(s)
          gauge.width(availableWidth).height(availableHeight);
          var gaugeWrap = g.select('.nv-gaugeWrap').datum([data]);
          d3.transition(gaugeWrap).call(gauge);
      });

      renderWatch.renderEnd('gauge chart immediate');
      return chart;
  }

  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  // expose chart's sub-components
  chart.dispatch = dispatch;
  chart.gauge = gauge;
  chart.options = nv.utils.optionsFunc.bind(chart);

  // use Object get/set functionality to map between vars and chart functions
  chart._options = Object.create({}, {
      // simple options, just get/set the necessary values
      width:      {get: function(){return width;}, set: function(_){width=_;}},
      height:     {get: function(){return height;}, set: function(_){height=_;}},
      noData:         {get: function(){return noData;}, set: function(_){noData=_;}},

      // options that require extra logic in the setter
      color: {get: function(){return color;}, set: function(_){
          color = _;
          gauge.color(color);
      }},
      margin: {get: function(){return margin;}, set: function(_){
          margin.top    = _.top    !== undefined ? _.top    : margin.top;
          margin.right  = _.right  !== undefined ? _.right  : margin.right;
          margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
          margin.left   = _.left   !== undefined ? _.left   : margin.left;
      }}
  });

  nv.utils.inheritOptions(chart, gauge);
  nv.utils.initOptions(chart);

  return chart;
};nv.models.packedBubble = function() {
  "use strict";

  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin = {top: 0, right: 0, bottom: 0, left: 0}
      , width = 500
      , height = 500
      , id = Math.floor(Math.random() * 10000) //Create semi-unique ID in case user doesn't select one
      , color = nv.utils.defaultColor()
      , valueFormat = function(d) { return d.value; }
      , title = false
      , padding = 1.5
      , dispatch = d3.dispatch('chartClick', 'elementClick', 'elementDblClick', 'elementMouseover', 'elementMouseout', 'elementMousemove', 'renderEnd')
      ;


  //============================================================
  // chart function
  //------------------------------------------------------------

  var renderWatch = nv.utils.renderWatch(dispatch);

  function chart(selection) {
      renderWatch.reset();

      selection.each(function(data) {
          var availableWidth = width - margin.left - margin.right
              , availableHeight = height - margin.top - margin.bottom
              , container = d3.select(this)
              ;

          nv.utils.initSVG(container);

          // Setup containers and skeleton of chart
          var wrap = container.selectAll('.nv-wrap.nv-packedBubble').data([data]);
          var wrapEnter = wrap.enter().append('g').attr('class','nvd3 nv-wrap nv-packedBubble nv-chart-' + id);
          var gEnter = wrapEnter.append('g');
          gEnter.append('g').attr('class', 'nv-packedBubbleNodes');
          var g_bubbles = wrap.selectAll('.nv-packedBubbleNodes');

          wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

          var root = d3.layout.pack()
              .sort(null)
              .size([availableWidth, availableHeight])
              .padding(padding);

          // pack nodes from data, hide children
          var nodes = g_bubbles.selectAll(".node")
              .data(root.nodes({ children: data }).filter(function(d) { return d.depth > 0; }))
              .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

          var g_nodes = nodes.enter().append("g")
                  .attr("class", function(d) { return d.children ? "node" : "leaf node"; })
                  .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

          // draw circles
          g_nodes.append("circle")
              .style("fill", function(d) { return color(d.index); })
              .filter(function(d) { return !d.children; }).style({ "visibility": "hidden", "opacity": 0 });

          // set/update radius getter to support updating data (responsive width)
          var circles = nodes.selectAll('circle')
              .attr("r", function(d) { return d.r; });

          // hook up bubble events
          g_nodes.on('mouseover', function(d, i) {
              d3.select(this).classed('hover', true);

              dispatch.elementMouseover({
                  data: d,
                  index: i,
                  color: d3.select(this).select('circle').style("fill")
              });
          })
          .on('mouseout', function(d, i) {
              d3.select(this).classed('hover', false);

              dispatch.elementMouseout({
                  data: d,
                  index: i,
                  color: d3.select(this).select('circle').style("fill")
              });
          })
          .on('mousemove', function(d, i) {
              dispatch.elementMousemove({
                  data: d,
                  index: i,
                  color: d3.select(this).select('circle').style("fill")
              });
          })
          .on('click', function(d, i) {
              var element = this;

              if (d.children) {
                  var node = d3.select(this);
                  var expanded = node.classed('expanded');

                  node.classed('expanded', !expanded)
                      .transition()
                      .duration(500)
                      .style("opacity", expanded ? 1 : 0.3);

                  d3.selectAll('.node circle')
                      .filter(function(d2) { return d2.parent.name == d.name; })
                      .style("visibility", "visible")
                      .transition()
                      .duration(500)
                      .style("opacity", expanded ? 0 : 1)
                      .each('end', function() { d3.select(this).style('visibility', !expanded ? 'visible' : 'hidden'); });
              }

              dispatch.elementClick({
                  data: d,
                  index: i,
                  color: d3.select(this).select('circle').style("fill"),
                  event: d3.event,
                  element: element
              });

              d3.event.stopPropagation();
          })
          .on('dblclick', function(d, i) {
              dispatch.elementDblClick({
                  data: d,
                  index: i,
                  color: d3.select(this).select('circle').style("fill")
              });

              d3.event.stopPropagation();
          });

          //
          container.on('click', function(d, i) {
              dispatch.chartClick({
                  data: d,
                  index: i,
                  pos: d3.event,
                  id: id
              });
          });
      });

      renderWatch.renderEnd('packedBubble immediate');
      return chart;
  }

  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  chart.dispatch = dispatch;
  chart.options = nv.utils.optionsFunc.bind(chart);

  chart._options = Object.create({}, {
      // simple options, just get/set the necessary values
      width:      {get: function(){return width;}, set: function(_){width=_;}},
      height:     {get: function(){return height;}, set: function(_){height=_;}},
      title:      {get: function(){return title;}, set: function(_){title=_;}},
      padding:      {get: function(){return padding;}, set: function(_){padding=_;}},
      valueFormat:    {get: function(){return valueFormat;}, set: function(_){valueFormat=_;}},
      id:         {get: function(){return id;}, set: function(_){id=_;}},


      // options that require extra logic in the setter
      margin: {get: function(){return margin;}, set: function(_){
          margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
          margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
          margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
          margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
      }},

      color: {get: function(){return color;}, set: function(_){
          color=nv.utils.getColor(_);
      }}
  });

  nv.utils.initOptions(chart);
  return chart;
};nv.models.packedBubbleChart = function() {
  "use strict";

  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var packedBubble = nv.models.packedBubble()
      , tooltip = nv.models.tooltip()
      ;

  var margin = {top: 0, right: 0, bottom: 0, left: 0}
      , width = null
      , height = null
      , color = nv.utils.defaultColor()
      , noData = null
      , dispatch = d3.dispatch('renderEnd')
      ;

  tooltip
      .headerEnabled(false)
      .duration(0)
      .valueFormatter(function(d, i) {
          return packedBubble.valueFormat()(d, i);
      });

  //============================================================
  // Chart function
  //------------------------------------------------------------

  var renderWatch = nv.utils.renderWatch(dispatch);

  function chart(selection) {
      renderWatch.reset();
      renderWatch.models(packedBubble);

      selection.each(function(data) {
          var container = d3.select(this);
          nv.utils.initSVG(container);

          var availableWidth = nv.utils.availableWidth(width, container, margin),
              availableHeight = nv.utils.availableHeight(height, container, margin);

          chart.update = function() { container.transition().call(chart); };
          chart.container = this;

          // Display No Data message if there's nothing to show.
          if (!data) {
              nv.utils.noData(chart, container);
              return chart;
          } else {
              container.selectAll('.nv-noData').remove();
          }

          // Setup containers and skeleton of chart
          var wrap = container.selectAll('g.nv-wrap.nv-packedBubbleChart').data([data]);
          var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-packedBubbleChart').append('g');
          var g = wrap.select('g');

          gEnter.append('g').attr('class', 'nv-packedBubbleWrap');

          wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

          // Main Chart Component(s)
          packedBubble.width(availableWidth).height(availableHeight);
          var packedBubbleWrap = g.select('.nv-packedBubbleWrap').datum(data);
          d3.transition(packedBubbleWrap).call(packedBubble);
      });

      renderWatch.renderEnd('packedBubble chart immediate');
      return chart;
  }

  //============================================================
  // Event Handling/Dispatching (out of chart's scope)
  //------------------------------------------------------------
  packedBubble.dispatch.on('elementMouseover.tooltip', function(evt) {
      evt['series'] = {
          key: evt.data.name,
          value: evt.data,
          color: evt.color
      };

      tooltip.data(evt).hidden(false);
  });

  packedBubble.dispatch.on('elementMouseout.tooltip', function(evt) {
      tooltip.hidden(true);
  });

  packedBubble.dispatch.on('elementMousemove.tooltip', function(evt) {
      tooltip.position();
  });

  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  // expose chart's sub-components
  chart.dispatch = dispatch;
  chart.packedBubble = packedBubble;
  chart.options = nv.utils.optionsFunc.bind(chart);
  chart.tooltip = tooltip;

  // use Object get/set functionality to map between vars and chart functions
  chart._options = Object.create({}, {
      // simple options, just get/set the necessary values
      width:      {get: function(){return width;}, set: function(_){width=_;}},
      height:     {get: function(){return height;}, set: function(_){height=_;}},
      noData:         {get: function(){return noData;}, set: function(_){noData=_;}},

      // options that require extra logic in the setter
      color: {get: function(){return color;}, set: function(_){
          color = _;
          packedBubble.color(color);
      }},
      margin: {get: function(){return margin;}, set: function(_){
          margin.top    = _.top    !== undefined ? _.top    : margin.top;
          margin.right  = _.right  !== undefined ? _.right  : margin.right;
          margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
          margin.left   = _.left   !== undefined ? _.left   : margin.left;
      }}
  });

  nv.utils.inheritOptions(chart, packedBubble);
  nv.utils.initOptions(chart);

  return chart;
};nv.models.radar = function() {
  "use strict";

  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin = {top: 0, right: 0, bottom: 0, left: 0}
      , width = 500
      , height = 500
      , id = Math.floor(Math.random() * 10000) //Create semi-unique ID in case user doesn't select one
      , color = nv.utils.getColor(['#88ac67', '#f78f20', '#db4e4e'])
      , valueFormat = d3.format(',.2f')
      , margin = { top: 15, bottom: 30, left: 100, right: 120 }
      , title = false
      , min = null
      , max = null
      , stepSize = null
      , radius = 5
      , factor = 1
      , factorLegend = 1
      , opacityArea = 0.5
      , nodeRadius = 4
      , dispatch = d3.dispatch('chartClick', 'renderEnd', 'elementMouseover', 'elementMouseout', 'elementMousemove')
      ;


  //============================================================
  // chart function
  //------------------------------------------------------------

  var renderWatch = nv.utils.renderWatch(dispatch);

  function chart(selection) {
      renderWatch.reset();

      selection.each(function (data) {
          var availableWidth = width - margin.left - margin.right
              , availableHeight = height - margin.top - margin.bottom
              , container = d3.select(this)
              ;

          if (max == null) {
              data.forEach(function (d) {
                  var m = d3.max(d.values, function (v) { return v.value; });

                  if (m > max)
                      max = m;
              });
          }

          if (min == null) {
              min = -max;
          }

          radius = factor * (Math.min(availableWidth, availableHeight) / 2);

          data.forEach(function (d, i) {
              d.color = color(d.series);
          });

          nv.utils.initSVG(container);

          var step = stepSize || ((max - min) / 10);
          var adjustedMax = max + step;
          var range = d3.range(min, adjustedMax, step);
          var allAxis = data[0].values.map(function (d) { return d.axis; });
          var radians = 2 * Math.PI;

          // Setup containers and skeleton of chart
          var wrap = container.selectAll('.nv-wrap.nv-radar').data([data]);
          var wrapEnter = wrap.enter().append('g').attr('class','nvd3 nv-wrap nv-radar nv-chart-' + id);
          var gEnter = wrapEnter.append('g');

          wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

          // level lines (circle segments)
          gEnter.append('g').attr('class', 'nv-radarLevels');
          var g_levels = wrap.select('.nv-radarLevels');

          var levelFactors = range.map(function (i, j) {
              return factor * radius * (j / (range.length - 1));
          });

          var levelGroups = g_levels
              .selectAll('.level-group')
              .data(levelFactors);

          levelGroups
              .enter()
              .append('g')
              .attr('class', 'level-group');

          levelGroups.exit().remove();

          var levelLines = levelGroups
              .selectAll('.level')
              .data(function (levelFactor) {
                  return allAxis.map(function (i) { return levelFactor; });
              });

          levelLines
              .enter()
              .append('line')
              .attr('class', 'level')
              .style("stroke", "grey")
              .style("stroke-opacity", "0.75")
              .style("stroke-width", "0.3px");

          levelLines.exit().remove();

          levelGroups.selectAll('.level')
              .attr('x1', function (levelFactor, i) { return levelFactor * (1 - factor * Math.sin(i * radians / allAxis.length)); })
              .attr("y1", function (levelFactor, i) { return levelFactor * (1 - factor * Math.cos(i * radians / allAxis.length)); })
              .attr("x2", function (levelFactor, i) { return levelFactor * (1 - factor * Math.sin((i + 1) * radians / allAxis.length)); })
              .attr("y2", function (levelFactor, i) { return levelFactor * (1 - factor * Math.cos((i + 1) * radians / allAxis.length)); })
              .attr("transform", function (levelFactor) { return "translate(" + (availableWidth / 2 - levelFactor) + ", " + (availableHeight / 2 - levelFactor) + ")"; });

          // level values
          gEnter.append('g').attr('class', 'nv-radarLevelValues');
          var g_labelValues = wrap.select('.nv-radarLevelValues');

          var labelValues = g_labelValues
              .selectAll('.level-value')
              .data(levelFactors);

          labelValues
              .enter()
              .append('text')
              .attr('class', 'level-value')
              .style('fill', '#000000')
              .text(function (d, i) { return range[i]; });

          labelValues.exit().remove();

          g_labelValues
              .selectAll('.level-value')
              .attr('transform', function (levelFactor, i) { return 'translate(' + (5 + availableWidth / 2) + ',' + (availableHeight / 2 - levelFactor) + ')'; });

          // axis lines
          gEnter.append('g').attr('class', 'nv-radarAxisLines');
          var g_axisLines = wrap.select('.nv-radarAxisLines');

          var axisLines = g_axisLines
              .selectAll('.axis-line')
              .data(allAxis);

          axisLines
              .enter()
              .append('line')
              .attr('class', 'axis-line')
              .style("stroke", "grey")
              .style("stroke-width", "1px");

          axisLines.exit().remove();

          g_axisLines.selectAll('.axis-line')
              .attr("x1", availableWidth / 2)
              .attr("y1", availableHeight / 2)
              .attr("x2", function (d, i) { return availableWidth / 2 + radius * factor * Math.sin(i * radians / allAxis.length); })
              .attr("y2", function (d, i) { return availableHeight / 2 - radius * factor * Math.cos(i * radians / allAxis.length); });

          // axis labels
          gEnter.append('g').attr('class', 'nv-radarAxisLabels');
          var g_axisLabels = wrap.select('.nv-radarAxisLabels');

          var axisLabels = g_axisLabels
              .selectAll('.axis-label')
              .data(allAxis);

          axisLabels
              .enter()
              .append('text')
              .attr('class', 'axis-label')
              .text(function (d) { return d; })
              .attr("dy", "1.5em")
              .attr("transform", function(d, i){return "translate(0, -10)"})
              .attr("text-anchor", "middle");

          axisLabels.exit().remove();

          g_axisLabels.selectAll('.axis-label')
              .attr("x", function (d, i) { return availableWidth / 2 + radius * Math.sin(i * radians / allAxis.length) + (this.getBBox().width / 1.5) * Math.sin(i * radians / allAxis.length); })
              .attr("y", function (d, i) { return availableHeight / 2 - radius * Math.cos(i * radians / allAxis.length) - 20 * Math.cos(i * radians / allAxis.length); });

          // series
          gEnter.append('g').attr('class', 'nv-radarSeries');
          var g_series = wrap.select('.nv-radarSeries');

          var series = g_series
              .selectAll('.series')
              .data(data);

          series
              .enter()
              .append('g')
              .attr('class', 'series');

          series.exit().remove();

          function getSeriesNodeData(d) {
              return d.values.map(function (v, i) {
                  var delta = (v.value - min) / (adjustedMax - min);

                  return {
                      x: availableWidth / 2 + radius * delta * factor * Math.sin(i * radians / allAxis.length),
                      y: availableHeight / 2 - radius * delta * factor * Math.cos(i * radians / allAxis.length),
                      series: d.series,
                      color: d.color,
                      value: v.value,
                      key: v.axis,
                      seriesName: d.key,
                      link: v.link || null
                  };
              });
          };

          // series areas
          var seriesAreas = series.selectAll('.series-area')
              .data(function (d) { return [getSeriesNodeData(d)]; });

          seriesAreas
              .enter()
              .append('polygon')
              .attr('class', function (d) { return 'series-area series-area-' + d[0].series; })
              .style('fill-opacity', opacityArea)
              .style('stroke-width', '2px')
              .on('mouseover', function (d){
                  var active = this;

                  series.selectAll(".series-area")
                      .filter(function () { return this != active; })
                      .transition(200)
                      .style("fill-opacity", 0.1);

                  d3.select(active)
                      .transition(200)
                      .style("fill-opacity", .7);
              })
              .on('mouseout', function(){
                  series.selectAll(".series-area")
                      .transition(200)
                      .style("fill-opacity", opacityArea);
              });

          seriesAreas.exit().remove();

          series.selectAll('.series-area')
              .attr('points', function (d) {
                  return d.map(function (o) { return o.x + ',' + o.y; }).join(' ');
              })
              .style('stroke', function (d) { return d[0].color; })
              .style('fill', function (d) { return d[0].color; });

          // series points
          var seriesPoints = series.selectAll('.series-point')
              .data(getSeriesNodeData);

          seriesPoints
              .enter()
              .append('circle')
              .attr('class', 'series-point')
              .attr('cursor', function (d) { return d.link ? 'pointer' : 'default'; })
              .attr('r', nodeRadius)
              .on('mouseover', function (d) {
                  d3.select(this).classed('hover', true);

                  dispatch.elementMouseover({
                      data: d
                  });
              })
              .on('mouseout', function(d) {
                  d3.select(this).classed('hover', false);

                  dispatch.elementMouseout({
                      data: d
                  });
              })
              .on('mousemove', function(d) {
                  dispatch.elementMousemove({
                      data: d
                  });
              })
              .on('click', function(d, i) {
                  dispatch.chartClick({
                      data: d,
                      index: i,
                      pos: d3.event,
                      id: id
                  });
              });

          seriesPoints.exit().remove();

          series.selectAll('.series-point')
              .attr('cx', function (d) { return d.x; })
              .attr('cy', function (d) { return d.y; })
              .style('fill', function (d) { return d.color; });
      });

      renderWatch.renderEnd('radar immediate');
      return chart;
  }

  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  chart.dispatch = dispatch;
  chart.options = nv.utils.optionsFunc.bind(chart);

  chart._options = Object.create({}, {
      // simple options, just get/set the necessary values
      width:      {get: function(){return width;}, set: function(_){width=_;}},
      height:     {get: function(){return height;}, set: function(_){height=_;}},
      title:      {get: function(){return title;}, set: function(_){title=_;}},
      valueFormat:    {get: function(){return valueFormat;}, set: function(_){valueFormat=_;}},
      id:         {get: function(){return id;}, set: function(_){id=_;}},
      min:         {get: function(){return min;}, set: function(_){min=_;}},
      max: { get: function () { return max; }, set: function (_) { max = _; } },
      stepSize: { get: function () { return stepSize; }, set: function (_) { stepSize = _; } },
      radius: { get: function () { return radius; }, set: function (_) { radius = _; } },
      factor: { get: function () { return factor; }, set: function (_) { factor = _; } },
      factorLegend: { get: function () { return factorLegend; }, set: function (_) { factorLegend = _; } },
      levels: { get: function () { return levels; }, set: function (_) { levels = _; } },
      opacityArea: { get: function () { return opacityArea; }, set: function (_) { opacityArea = _; } },

      // options that require extra logic in the setter
      margin: {get: function(){return margin;}, set: function(_){
          margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
          margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
          margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
          margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
      }},
      color: {get: function(){return color;}, set: function(_){
          color=nv.utils.getColor(_);
      }}
  });

  nv.utils.initOptions(chart);
  return chart;
};nv.models.radarChart = function() {
  "use strict";

  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var radar = nv.models.radar()
      , tooltip = nv.models.tooltip()
      , legend = nv.models.legend()
      ;

  var margin = {top: 0, right: 0, bottom: 0, left: 0}
      , width = null
      , height = null
      , color = nv.utils.defaultColor()
      , noData = 'No Data Available.'
      , showLegend = true
      , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'stateChange', 'changeState', 'renderEnd')
      , state = nv.utils.state()
      , defaultState = null
      ;

  tooltip
      .duration(0)
      .valueFormatter(function(d, i) {
          return radar.valueFormat()(d, i);
      });

  //============================================================
  // Chart function
  //------------------------------------------------------------

  var renderWatch = nv.utils.renderWatch(dispatch);

  var stateGetter = function(data) {
      return function(){
          return {
              active: data.map(function(d) { return !d.disabled })
          };
      }
  };

  var stateSetter = function(data) {
      return function(state) {
          if (state.active !== undefined)
              data.forEach(function(series,i) {
                  series.disabled = !state.active[i];
              });
      }
  };

  function chart(selection) {
      renderWatch.reset();
      renderWatch.models(radar);

      selection.each(function (data) {
          var container = d3.select(this);
          nv.utils.initSVG(container);

          var availableWidth = nv.utils.availableWidth(width, container, margin),
              availableHeight = nv.utils.availableHeight(height, container, margin);

          chart.update = function() { container.transition().call(chart); };
          chart.container = this;

          state
              .setter(stateSetter(data), chart.update)
              .getter(stateGetter(data))
              .update();

          // DEPRECATED set state.disableddisabled
          state.disabled = data.map(function (d) { return !!d.disabled; });

          if (!defaultState) {
              var key;
              defaultState = {};
              for (key in state) {
                  if (state[key] instanceof Array)
                      defaultState[key] = state[key].slice(0);
                  else
                      defaultState[key] = state[key];
              }
          }

          // Display No Data message if there's nothing to show.
          if (!data || !data.length) {
              nv.utils.noData(chart, container);
              return chart;
          } else {
              container.selectAll('.nv-noData').remove();
          }

          data.forEach(function (d, i) {
              d.series = i;
              d.color = color(i);
          });

          // Setup containers and skeleton of chart
          var wrap = container.selectAll('g.nv-wrap.nv-radarChart').data(data);
          var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-radarChart').append('g');
          var g = wrap.select('g');

          gEnter.append('g').attr('class', 'nv-radarWrap');
          gEnter.append('g').attr('class', 'nv-radarLegendWrap');

          if (showLegend) {
              legend.width(availableWidth);

              g.select('.nv-radarLegendWrap')
                  .datum(data)
                  .call(legend);

              if (margin.top != legend.height()) {
                  margin.top = legend.height();
                  availableHeight = (height || parseInt(container.style('height')) || 400)
                      - margin.top - margin.bottom;
              }

              wrap.select('.nv-legendWrap')
                  .attr('transform', 'translate(0,' + (-margin.top) +')')
          }

          wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

          // Main Chart Component(s)
          radar
              .width(availableWidth)
              .height(availableHeight);

          var radarWrap = g
              .select('.nv-radarWrap')
              .datum(data.filter(function (d, i) { return !data[i].disabled; }));

          d3.transition(radarWrap).call(radar);

          //============================================================
          // Event Handling/Dispatching (in chart's scope)
          //------------------------------------------------------------
          dispatch.on('changeState', function (e) {
              if (typeof e.disabled !== 'undefined' && data.length === e.disabled.length) {
                  data.forEach(function(series, i) {
                      series.disabled = e.disabled[i];
                  });

                  state.disabled = e.disabled;
              }

              chart.update();
          });
      });

      renderWatch.renderEnd('radar chart immediate');
      return chart;
  }

  //============================================================
  // Event Handling/Dispatching (out of chart's scope)
  //------------------------------------------------------------
  legend.dispatch.on('stateChange', function (newState) {
      for (var key in newState)
          state[key] = newState[key];

      dispatch.stateChange(state);
      chart.update();
  });

  radar.dispatch.on('elementMouseover.tooltip', function (evt) {
      evt['value'] = evt.data.seriesName;

      evt['series'] = {
          key: evt.data.key,
          value: evt.data.value,
          color: evt.data.color
      };

      tooltip.data(evt).hidden(false);
  });

  radar.dispatch.on('elementMouseout.tooltip', function(evt) {
      tooltip.hidden(true);
  });

  radar.dispatch.on('elementMousemove.tooltip', function (evt) {
      tooltip.position();
  });

  radar.dispatch.on('chartClick', function (evt) {
      if (evt.data.link) {
          window.location.href = evt.data.link;
      }
  });

  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  // expose chart's sub-components
  chart.dispatch = dispatch;
  chart.radar = radar;
  chart.options = nv.utils.optionsFunc.bind(chart);
  chart.tooltip = tooltip;
  chart.tooltipText = null;
  chart.legend = legend;

  // use Object get/set functionality to map between vars and chart functions
  chart._options = Object.create({}, {
      // simple options, just get/set the necessary values
      width:          {get: function(){return width;}, set: function(_){width=_;}},
      height:         {get: function(){return height;}, set: function(_){height=_;}},
      noData: { get: function () { return noData; }, set: function (_) { noData = _; } },
      showLegend: { get: function () { return showLegend; }, set: function (_) { showLegend = _; } },
      defaultState:    {get: function(){return defaultState;}, set: function(_){defaultState=_;}},

      // options that require extra logic in the setter
      color: {get: function(){return color;}, set: function(_){
          color = nv.utils.getColor(_);
          radar.color(color);
          legend.color(color);
      }},

      margin: {get: function(){return margin;}, set: function(_){
          margin.top    = _.top    !== undefined ? _.top    : margin.top;
          margin.right  = _.right  !== undefined ? _.right  : margin.right;
          margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
          margin.left   = _.left   !== undefined ? _.left   : margin.left;
      }}
  });

  nv.utils.inheritOptions(chart, radar);
  nv.utils.initOptions(chart);

  return chart;
};
nv.extraVersion = "1.0.0";
})();
//# sourceMappingURL=nv.d3.extra.js.map