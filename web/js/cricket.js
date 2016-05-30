var small_chart_height = 250;
var medium_chart_height = 500;
var large_chart_height = 650;
var small_width = 320; //544
var medium_width = 540; //768
var default_large_width = 660;
var original_result_chart_width = 425;
var result_chart_width = 540;
var resize = .45;
var result_chart_width = function(d){
  var w =   $(window).outerWidth() * resize;
  if ($(window).outerWidth() < 970) return default_large_width;
  if (w < original_result_chart_width) return original_result_chart_width;
  else return w;
}
var valueAccessor = function (d) {return d.Value < 1 ? 0 : d.Value};
var our_colors = ["#9df5e7","#b2bfdb","#a1eda1","#fc9898", "#afedf0","#afede1", "#fc6565"];
var team_default = d3.scale.ordinal().range(["#015B64"]);
var won_default = d3.scale.ordinal().range(["#45936E"]);
var lost_default = d3.scale.ordinal().range(["#92332F"]);
var year_default = d3.scale.ordinal().range(["#1C293B"]);
var default_colors = d3.scale.ordinal().range(our_colors);
//For pie chart
var donut_inner = 40
var donut_outer = 80
var donut_height = 100
var perc_view = true;
var perc_view2 = true;


grey_undefined = function(chart) {
  chart.selectAll("text.row").classed("grey",function(d) {return d.value.not_real || d.value.count == 0});
}

//---------------------CLEANUP functions-------------------------

var yearDom = [];

//Resize the chart based on the screen size
$( window ).resize(function() {
  result_chart_width = function(d){
    var w =   $(window).outerWidth() * resize;
    if ($(window).outerWidth() < 970) return default_large_width;
    if (w < original_result_chart_width) return original_result_chart_width;
    else return w;
  }
  dc.renderAll();
});

function cleanup(d) {
  
  d.Year = d.Date.slice(-2);
  d.Year = d.Year > 16 ? 1900+parseInt(d.Year) : 2000+parseInt(d.Year);
  d.Value = 1;
  d.properDate = new Date(d.Date.split('-')[1] + " " + d.Date.split('-')[0] + ", " + d.Year);
  d.matchAgainst = d.Team + '/' + d.Opposition;
  if (d.Result != "tied") d.resultStatus = d.Team + '@' + d.Result;

  return d;
}

function isOdd(num) { 
  return num % 2;
}

function capitalizeFirst(string) { 
  return string.charAt(0).toUpperCase() + string.slice(1); 
}

function change_result_view() {
  result_year_chart = dc.barChart('#result_year')
      .group(result_year_group, "won")
      .valueAccessor(function(d){return d.value["won"]})
      .stack(result_year_group, "lost", function(d) { return d.value["lost"] })
      .stack(result_year_group, "tied", function(d) { return d.value["tied"] })
      .dimension(result_year)
      .centerBar(true)
      .height(medium_chart_height/2)
      .width(result_chart_width)
      .colors(d3.scale.ordinal().domain(["won", "lost", "tied"]).range(["#45936E","#92332F", "#3E70A1"]))
      .x(d3.scale.linear().domain([1995, 2016]))
      .elasticX(false)
      .elasticY(true)
      .transitionDuration(200)
      .mouseZoomable(false)
      .yAxisLabel("Games")
      .renderHorizontalGridLines(true)
      .renderVerticalGridLines(true)  
      .margins({top: 10, right: 50, bottom: 30, left: 50})
      .on("renderlet.result_year", function (chart) {
          //Check if labels exist
          var gLabels = chart.select(".labels");
          if (gLabels.empty()){
            gLabels = chart.select(".chart-body").append('g').classed('labels', true);
          }

          var gLabelsData = gLabels.selectAll("text").data(chart.selectAll(".bar")[0]);

          gLabelsData.exit().remove(); //Remove unused elements

          gLabelsData.enter().append("text") //Add new elements

          gLabelsData
            .attr('text-anchor', 'middle  ')
            .attr('fill', 'white')
            .attr("font-size", "11px")
            .text(function(d){
              return d3.select(d).data()[0].y
            })
            .attr('x', function(d){ 
              return +d.getAttribute('x') + (d.getAttribute('width')/2); 
            })
            .attr('y', function(d){ return +d.getAttribute('y') + 15; })
            .attr('style', function(d){
              if (+d.getAttribute('height') < 18) return "display:none";
            });
        })
        .on("preRedraw", function (chart) {
            chart.rescale();
        })
        .on("preRender", function (chart) {
            chart.rescale();
        })
        .on("pretransition", function (chart) {
            chart.rescale();
        });

    result_year_chart.xAxis().ticks(10).tickFormat(d3.format("d"));
  
  if (perc_view == false) {
    $('.result_year_title').text("Overall Team A Performance by Games");
    result_year_chart
      .label(function(d) { return d; })
      .title(function(d) {
        d3.selectAll("rect.bar")
          .on('mouseover', function(d){
          });
          return d.key+": "+d3.format(',')(d.value[this.layer])+" ("+this.layer+")";
      })
      .brushOn(false);
  }
  else {
    $('.result_year_title').text("Overall Team A Performance by Percentage");
    result_year_chart = dc.lineChart('#result_year')
      .dotRadius(10)
      .group(result_year_group, "won")
      .valueAccessor(function(d){
        var v = parseFloat(d.value["won"]/(d.value["won"]+d.value["lost"]+d.value["tied"]));
        if (isNaN(v)) return 0;
        return parseFloat((v*100).toFixed(1));
      })
      .stack(result_year_group, "lost", function(d) { 
        var v = parseFloat(d.value["lost"]/(d.value["won"]+d.value["lost"]+d.value["tied"]));
        if (isNaN(v)) return 0;
        return parseFloat((v*100).toFixed(1));
      })
      .stack(result_year_group, "tied", function(d) { 
      if (d.value["tied"] == 0) return 0
      else 
        var v = parseFloat(d.value["tied"] /(d.value["won"]+d.value["lost"]+d.value["tied"])) 
        if (isNaN(v)) return 0;
        return parseFloat((v*100).toFixed(1));
      })
      .label(function(d) { return d; })
      .title(function(d) {
        var v = 0;
        if (this.layer == "won") 
          v = parseFloat(d.value["won"]/(d.value["won"]+d.value["lost"]+d.value["tied"]));
        else if(this.layer == "lost") 
          v = parseFloat(d.value["lost"]/(d.value["won"]+d.value["lost"]+d.value["tied"]));
        else 
          v = parseFloat(d.value["tied"] /(d.value["won"]+d.value["lost"]+d.value["tied"]))
        if (isNaN(v)) v = 0;
        else v = parseFloat((v*100).toFixed(1));
      
        if(d.value[this.layer] > 0){
          d3.select(".area").selectAll("circle.dot").attr("r", 10);
        }
        return d.key+": "+d3.format(',')(d.value[this.layer])+" games ("+this.layer+")\nPercentage: " + v + "%"; 
        
      })
      .brushOn(false)
      .renderArea(true)
      .dimension(result_year)
      .height(medium_chart_height/2)
      .width(result_chart_width)
      .colors(d3.scale.ordinal().domain(["won", "lost", "tied"]).range(["#45936E","#92332F", "#3E70A1"]))
      .x(d3.scale.linear().domain([1996, 2015]))
      .y(d3.scale.linear().domain([0, 110]))
      .elasticX(false)
      .elasticY(false)
      .transitionDuration(200)
      .yAxisLabel("Games")
      .renderHorizontalGridLines(true)
      .renderVerticalGridLines(true)
      .mouseZoomable(false)
      .margins({top: 20, right: 50, bottom: 30, left: 50})
      .on("pretransition", stackChartTransition = function (chart) {
        chart.selectAll("circle.dot").each(function(d, i){
          if(d.y == 0){
            d3.select(this)
              .attr("visibility", "hidden");
          }
          else{
            d3.select(this)
              .attr("r", 5.5)
              .attr("visibility", "visible")
              .on("mouseover", function(d) {
                d3.select(this)
                  .attr("visibility", "visible")
                  .attr("r", 5.5)
                  .style("fill", d.color);
              })                  
              .on("mouseout", function(d) {
                d3.select(this)
                  .attr("visibility", "visible")
                  .attr("r", 5.5)
                  .style("fill", d.color);
              });
          }
        });
        chart.selectAll(".line").each(function(d, i){
          try {
            if(d.values[i].y == 0){
              d3.select(this)
                .attr("visibility", "hidden");
            }
            else{
              d3.select(this)
                .attr("visibility", "hidden");
            }
          }
          catch (e){
          }

        });
        chart.rescale();
      });

    result_year_chart.xAxis().ticks(10).tickFormat(d3.format("d"));
  }
  
  result_year_chart.yAxis().ticks(5).tickFormat(d3.format("g"));
  grey_undefined(result_year_chart);
  
  //Need to reset the filter when the view changes or else, filter lingers
  result_year_chart.filterAll();
  dc.renderAll();
  perc_view = !perc_view;
}

function change_result_view2() {
  result_year_chart2 = dc.barChart('#result_year2')
      .group(result_year_group2, "won")
      .valueAccessor(function(d){return d.value["won"]})
      .stack(result_year_group2, "lost", function(d) { return d.value["lost"] })
      .stack(result_year_group2, "tied", function(d) { return d.value["tied"] })
      .dimension(result_year)
      .centerBar(true)
      .height(medium_chart_height/2)
      .width(result_chart_width)
      .colors(d3.scale.ordinal().domain(["won", "lost", "tied"]).range(["#45936E","#92332F", "#3E70A1"]))
      .x(d3.scale.linear().domain([1995, 2016]))
      .elasticX(false)
      .elasticY(true)
      .transitionDuration(200)
      .mouseZoomable(false)
      .yAxisLabel("Games")
      .renderHorizontalGridLines(true)
      .renderVerticalGridLines(true)  
      .margins({top: 10, right: 50, bottom: 30, left: 50})
      .on("renderlet.result_year", function (chart) {
          //Check if labels exist
          var gLabels = chart.select(".labels");
          if (gLabels.empty()){
            gLabels = chart.select(".chart-body").append('g').classed('labels', true);
          }

          var gLabelsData = gLabels.selectAll("text").data(chart.selectAll(".bar")[0]);

          gLabelsData.exit().remove(); //Remove unused elements

          gLabelsData.enter().append("text") //Add new elements

          gLabelsData
            .attr('text-anchor', 'middle  ')
            .attr('fill', 'white')
            .attr("font-size", "11px")
            .text(function(d){
              return d3.select(d).data()[0].y
            })
            .attr('x', function(d){ 
              return +d.getAttribute('x') + (d.getAttribute('width')/2); 
            })
            .attr('y', function(d){ return +d.getAttribute('y') + 15; })
            .attr('style', function(d){
              if (+d.getAttribute('height') < 18) return "display:none";
            });
        })
        .on("preRedraw", function (chart) {
            chart.rescale();
        })
        .on("preRender", function (chart) {
            chart.rescale();
        })
        .on("pretransition", function (chart) {
            chart.rescale();
        });

    result_year_chart2.xAxis().ticks(10).tickFormat(d3.format("d"));
  
  if (perc_view2 == false) {
    $('.result_year_title2').text("Overall Team B Performance by Games");
    result_year_chart2
      .label(function(d) { return d; })
      .title(function(d) {
        d3.selectAll("rect.bar")
          .on('mouseover', function(d){
          });
          return d.key+": "+d3.format(',')(d.value[this.layer])+" ("+this.layer+")";
      })
      .brushOn(false);
  }
  else {
    $('.result_year_title2').text("Overall Team B Performance by Percentage");
    result_year_chart2 = dc.lineChart('#result_year2')
      .dotRadius(10)
      .group(result_year_group2, "won")
      .valueAccessor(function(d){
        var v = parseFloat(d.value["won"]/(d.value["won"]+d.value["lost"]+d.value["tied"]));
        if (isNaN(v)) return 0;
        return parseFloat((v*100).toFixed(1));
      })
      .stack(result_year_group2, "lost", function(d) { 
        var v = parseFloat(d.value["lost"]/(d.value["won"]+d.value["lost"]+d.value["tied"]));
        if (isNaN(v)) return 0;
        return parseFloat((v*100).toFixed(1));
      })
      .stack(result_year_group2, "tied", function(d) { 
      if (d.value["tied"] == 0) return 0
      else 
        var v = parseFloat(d.value["tied"] /(d.value["won"]+d.value["lost"]+d.value["tied"])) 
        if (isNaN(v)) return 0;
        return parseFloat((v*100).toFixed(1));
      })
      .label(function(d) { return d; })
      .title(function(d) {
        var v = 0;
        if (this.layer == "won") 
          v = parseFloat(d.value["won"]/(d.value["won"]+d.value["lost"]+d.value["tied"]));
        else if(this.layer == "lost") 
          v = parseFloat(d.value["lost"]/(d.value["won"]+d.value["lost"]+d.value["tied"]));
        else 
          v = parseFloat(d.value["tied"] /(d.value["won"]+d.value["lost"]+d.value["tied"]))
        if (isNaN(v)) v = 0;
        else v = parseFloat((v*100).toFixed(1));
      
        if(d.value[this.layer] > 0){
          d3.select(".area").selectAll("circle.dot").attr("r", 10);
        }
        return d.key+": "+d3.format(',')(d.value[this.layer])+" games ("+this.layer+")\nPercentage: " + v + "%"; 
        
      })
      .brushOn(false)
      .renderArea(true)
      .dimension(result_year)
      .height(medium_chart_height/2)
      .width(result_chart_width)
      .colors(d3.scale.ordinal().domain(["won", "lost", "tied"]).range(["#45936E","#92332F", "#3E70A1"]))
      .x(d3.scale.linear().domain([1996, 2015]))
      .y(d3.scale.linear().domain([0, 110]))
      .elasticX(false)
      .elasticY(false)
      .transitionDuration(200)
      .yAxisLabel("Games")
      .renderHorizontalGridLines(true)
      .renderVerticalGridLines(true)
      .mouseZoomable(false)
      .margins({top: 20, right: 50, bottom: 30, left: 50})
      .on("pretransition", stackChartTransition = function (chart) {
        chart.selectAll("circle.dot").each(function(d, i){
          if(d.y == 0){
            d3.select(this)
              .attr("visibility", "hidden");
          }
          else{
            d3.select(this)
              .attr("r", 5.5)
              .attr("visibility", "visible")
              .on("mouseover", function(d) {
                d3.select(this)
                  .attr("visibility", "visible")
                  .attr("r", 5.5)
                  .style("fill", d.color);
              })                  
              .on("mouseout", function(d) {
                d3.select(this)
                  .attr("visibility", "visible")
                  .attr("r", 5.5)
                  .style("fill", d.color);
              });
          }
        });
        chart.selectAll(".line").each(function(d, i){
          try {
            if(d.values[i].y == 0){
              d3.select(this)
                .attr("visibility", "hidden");
            }
            else{
              d3.select(this)
                .attr("visibility", "hidden");
            }
          }
          catch (e){
          }

        });
        chart.rescale();
      });

    result_year_chart2.xAxis().ticks(10).tickFormat(d3.format("d"));
  }
  
  result_year_chart2.yAxis().ticks(5).tickFormat(d3.format("g"));
  grey_undefined(result_year_chart);
  
  //Need to reset the filter when the view changes or else, filter lingers
  result_year_chart2.filterAll();
  dc.renderAll();
  perc_view2 = !perc_view2;
  
}

//Queueing defer ensures that all our datasets get loaded before any work is done

queue()
    .defer(d3.csv, "data/cricket-odi.csv")
    // .defer(d3.csv, "import-data.csv") //change name here to load more than 1 file
    .await(showCharts);

function showCharts(err, data) {
  _data = [];

  for (i in data) {
    data[i] = cleanup(data[i]);
  }
  _data = data;
//  console.log(data);

  function configureableReduce(field, value, init) {
    return {
      add: function(v,d){
        v[d[field]] = (v[d[field]] || 0) + d[value];
        return v
      },
      remove: function(v,d){
        v[d[field]] -= d[value];
        return v
      },
      init: function() {
        return init ? JSON.parse(JSON.stringify(init)) : {}
      }
    }
  }
  
  resultByYear = configureableReduce("Result", "Value", {
    "won":0,
    "lost":0,
    "tied":0
  });
  
    
  //---------------------------------FILTERS-----------------------------------------
  ndx = crossfilter(_data);
  ndx2 = crossfilter(_data);
  //---------------------------ORDINARY CHARTS --------------------------------------
  year = ndx.dimension(function(d){return d.Year});
  year2 = ndx2.dimension(function(d){return d.Year});
  
  opposition = ndx.dimension(function(d){return d.Opposition});
  opposition2 = ndx2.dimension(function(d){return d.Opposition});
  
  team = ndx.dimension(function(d){return d.Team});
  team2 = ndx2.dimension(function(d){return d.Team});
  
  result = ndx.dimension(function(d){return d.Result});
  result2 = ndx2.dimension(function(d){return d.Result});
  
  resultStatus = ndx.dimension(function(d) {return d.resultStatus});
  resultStatus2 = ndx.dimension(function(d) {return d.resultStatus});
  
  year_group = year.group().reduceSum(function(d){return d.Value}); 
  year_group2 = year2.group().reduceSum(function(d){return d.Value}); 
    
  opposition_group = opposition.group().reduceSum(function(d){return d.Value}); 
  opposition_group2 = opposition2.group().reduceSum(function(d){return d.Value});
  
  team_group = team.group().reduceSum(function(d){return d.Value});
  team_group2 = team2.group().reduceSum(function(d){return d.Value}); 
    
  result_pie_group = result.group().reduceSum(function(d){return d.Value});
  result_pie_group2 = result2.group().reduceSum(function(d){return d.Value});
  
  result_year_group = year.group().reduce(resultByYear.add, resultByYear.remove, resultByYear.init);
  
  result_year_group2 = year2.group().reduce(resultByYear.add, resultByYear.remove, resultByYear.init);
  
  result_group = resultStatus.group().reduceSum(function(d){
    if (d.Result != 'tied') return d.Value;
    else return 0;
  });
  
  result_group2 = resultStatus2.group().reduceSum(function(d){
    if (d.Result != 'tied') return d.Value;
    else return 0;
  });
  
  
  year_chart = dc.rowChart('#year')
    .dimension(year)
    .group(year_group)
    .colors(year_default)
    .transitionDuration(200)
    .height(large_chart_height/1.5)
    .width(small_width)
    .ordering(function(d){ return -d.key })
//    .x(d3.scale.linear().domain([-25, 25]))
    .elasticX(true);
  
  year_chart.xAxis().ticks(10).tickFormat(d3.format("g"));
  grey_undefined(year_chart);
  
  year_bar_chart = dc.barChart('#year-bar')
      .dimension(year)
      .group(year_group)
      .colors(default_colors)
      .transitionDuration(200)
      .height(medium_chart_height)
      .width(small_width)
      .ordering(function(d){ return -d.key })
      .x(d3.scale.linear().domain([-25, 25]))
      .brushOn(true)
      .elasticY(true)
      .elasticX(true);
  
  year_bar_chart.xAxis().ticks(5).tickFormat(d3.format("g"));
  grey_undefined(year_bar_chart);
    
  
    
  opposition_chart = dc.rowChart('#opposition')
    .dimension(opposition)
    .group(opposition_group)
    .colors(lost_default)
    .transitionDuration(200)
    .height(small_chart_height)
    .width(small_width-50)
    .ordering(function(d){ return -d.key })
//    .xAxisLabel('Total Games')
//    .xAxisPadding(500)
    .elasticX(true)
    .label(function(d){
      var label = d.key + ": " + d.value;
      return label;
    })
    .title(function(d){
      var title = d.key + " \nTotal Games Won Against Team A: " + d.value;
      return title;
    });
  
  opposition_chart.xAxis().ticks(5).tickFormat(d3.format("d"));
  grey_undefined(opposition_chart);
  
  opposition_chart2 = dc.rowChart('#opposition2')
    .dimension(opposition2)
    .group(opposition_group2)
    .colors(lost_default)
    .transitionDuration(200)
    .height(small_chart_height)
    .width(small_width-50)
    .ordering(function(d){ return -d.key })
//    .xAxisLabel('Total Games')
//    .xAxisPadding(500)
    .elasticX(true)
    .label(function(d){
      var label = d.key + ": " + d.value;
      return label;
    })
    .title(function(d){
      var title = d.key + " \nTotal Games Won Against Team A: " + d.value;
      return title;
    });
  
  opposition_chart2.xAxis().ticks(5).tickFormat(d3.format("d"));
  grey_undefined(opposition_chart2);
  
  
    
  team_chart = dc.rowChart('#team')
    .dimension(team)
    .group(team_group)
    .colors(won_default)
    .transitionDuration(200)
    .height(small_chart_height)
    .width(small_width-50)
    .ordering(function(d){ return -d.key })
    .elasticX(true)
    .label(function(d){
      var label = d.key + ": " + d.value;
      return label;
    })
    .title(function(d){
      var title = d.key + " \nTotal Games Won Against Opposition: " + d.value;
      return title;
    });
  
  team_chart.xAxis().ticks(5).tickFormat(d3.format("d"));
  grey_undefined(team_chart);
  
  team_chart2 = dc.rowChart('#team2')
    .dimension(team2)
    .group(team_group2)
    .colors(won_default)
    .transitionDuration(200)
    .height(small_chart_height)
    .width(small_width-50)
    .ordering(function(d){ return -d.key })
    .elasticX(true)
    .label(function(d){
      var label = d.key + ": " + d.value;
      return label;
    })
    .title(function(d){
      var title = d.key + " \nTotal Games Won Against Opposition: " + d.value;
      return title;
    });
  
  team_chart2.xAxis().ticks(5).tickFormat(d3.format("d"));
  grey_undefined(team_chart2);
    
  result_chart = dc.pieChart('#result')
    .dimension(result)
    .group(result_pie_group)
    .transitionDuration(200)
    .legend(dc.legend().x(0).y(25).itemHeight(18).gap(5))
    .height(small_chart_height-50)
    .title(function(d) {
      var title = capitalizeFirst(d.key) + ": " + d.value;
      if (d.key == "won"){
        return "Team A Won Against Opposition\n" + title;
      }
      else if (d.key == "lost"){
        return "Team A Lost Against Opposition\n" + title;
      }
      return title;
    })
    .height(medium_chart_height/2)
    .label(function(d) {
      if (d.key == "won") return "Won: " + d.value;
      else if (d.key == "lost") return "Lost: " + d.value;
      return capitalizeFirst(d.key) + ": " + d.value;
    })
    .radius(donut_outer)
    .colors(d3.scale.ordinal().domain(["won", "lost", "tied"])
                              .range(["#45936E","#92332F", "#3E70A1"]))
    .colorAccessor(function(d) {
      if (d.key == "won") return "won";
      else if (d.key == "lost") return "lost";
      return "tied";
    });
  
  result_chart2 = dc.pieChart('#result2')
    .dimension(result2)
    .group(result_pie_group2)
    .transitionDuration(200)
    .legend(dc.legend().x(0).y(25).itemHeight(18).gap(5))
    .height(small_chart_height-50)
    .title(function(d) {
      var title = capitalizeFirst(d.key) + ": " + d.value;
      if (d.key == "won"){
        return "Team A Won Against Opposition\n" + title;
      }
      else if (d.key == "lost"){
        return "Team B Lost Against Opposition\n" + title;
      }
      return title;
    })
    .height(medium_chart_height/2)
    .label(function(d) {
      if (d.key == "won") return "Won: " + d.value;
      else if (d.key == "lost") return "Lost: " + d.value;
      return capitalizeFirst(d.key) + ": " + d.value;
    })
    .radius(donut_outer)
    .colors(d3.scale.ordinal().domain(["won", "lost", "tied"])
                              .range(["#45936E","#92332F", "#3E70A1"]))
    .colorAccessor(function(d) {
      if (d.key == "won") return "won";
      else if (d.key == "lost") return "lost";
      return "tied";
    });
  
  var all = ndx.groupAll();
  data_count_chart = dc.dataCount('#data_count')
    .dimension(ndx)
    .group(all)
    .html({
        some: '<span class=\'data-count\'><strong>%filter-count</strong> selected out of <strong>%total-count</strong> records</span>' +
            ' | <a class=\'reset\' href=\'javascript:team_chart.filterAll(); opposition_chart.filterAll(); result_chart.filterAll(); dc.redrawAll();\'\'>Reset All</a>',
        all: '<span class=\'data-count\'>All records selected. Please click on the graph to apply filters.<span>'
    });
  
  var all2 = ndx2.groupAll();
  data_count_chart2 = dc.dataCount('#data_count2')
    .dimension(ndx2)
    .group(all2)
    .html({
        some: '<span class=\'data-count\'><strong>%filter-count</strong> selected out of <strong>%total-count</strong> records</span>' +
            ' | <a class=\'reset\' href=\'javascript:team_chart2.filterAll(); opposition_chart2.filterAll(); result_chart2.filterAll(); dc.redrawAll();\'\'>Reset All</a>',
        all: '<span class=\'data-count\'>All records selected. Please click on the graph to apply filters.<span>'
    });
  
  //pyramid chart
  
  team_opp_chart = dc.pyramidChart('#team_opp')
    .dimension(resultStatus)
    .group(result_group)
    .colors(d3.scale.ordinal().domain(["won", "lost"])
                              .range(["#45936E","#92332F"]))
    .colorAccessor(function(d) {
      if (d.key.split('@')[1] == "won") return "won";
      else if (d.key.split('@')[1] == "lost") return "lost";
    })
    .height(small_chart_height)
    .width(medium_width-200)
    .leftColumn(function (d){ return d.key.split('@')[1] == "won"})
    .rowAccessor(function(d){ return d.key.split('@')[0]})
    .label(function(d){return d.key.split('@')[0]})
    .title(function(d){
      if (d.key.split('@')[1] == "won") return "Won: " + d.value;
      else if (d.key.split('@')[1] == "lost") return "Lost: " + d.value;
      else return NaN;
    })
    .elasticX(true)
    .twoLabels(false)
    .rowOrdering(d3.ascending)
    // .columnLabels(['Won','Lost'])
    .columnLabelPosition([150,0])
    .transitionDuration(200);
  
  team_opp_chart.xAxis().ticks(7).tickFormat(function(x) {return d3.format('s')(Math.abs(x))})
  
  dc.renderAll();
  
  initialize();
};

function initialize(){
  //odd are wins, even are losses
//  var a = $('#team_opp g .row text:eq(7)'); 
  var a = $('#team g.row text:eq(3)');
  var b = $('#team2 g.row text:eq(0)');
//  var b = $('#team_opp g .row rect:eq(6)');
  
  a.simulate('click');
  b.simulate('click');
  change_result_view();
  change_result_view2();
//  b.simulate('click');
  
};

function hideshow(id){
  var a = $(id);
  a.toggle('show');
};

function showAll() {
  var idList = ["#result_year", "#team_opp", "#result", "#team", "#opposition", "#result_year2", "#team_opp2", "#result2", "#team2", "#opposition2"]
  
  for (x in idList) {
    var a = $(idList[x]);
    if (a.css('display') == "none"){
      a.toggle('show');
    }
  }
  $('[type=checkbox]').prop('checked', true); 
};