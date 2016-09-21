var small_chart_height = 250;
var medium_chart_height = 500;
var large_chart_height = 650;
var small_width = 360; //544
var medium_width = 540; //768
var default_large_width = 720;
var original_result_chart_width = 550;
var resize = .475;
var result_chart_width = function(d){
  var windowWidth = $(window).width();
  var w = windowWidth * resize;
  if (windowWidth <= 972) return windowWidth*0.95; //default_large_width
  if (w < original_result_chart_width) return original_result_chart_width;
  if (windowWidth >1080) return windowWidth*0.475; //original_result_chart_width+100;
  return w;
}
var small_width = function(d){
  var windowWidth = $(window).width();
  var w = windowWidth * resize;
  if (windowWidth <= 972) return small_width;
  if (w < original_result_chart_width) return small_width;
  if (windowWidth >1080) return small_width+100;
  return w;
}

var composite_width = function(d) {
  var windowWidth = $(window).width();
  return windowWidth;
}
var valueAccessor = function (d) {return d.Value < 1 ? 0 : d.Value};
var our_colors = ["#9df5e7","#b2bfdb","#a1eda1","#fc9898", "#afedf0","#afede1", "#fc6565"];
var team_default = d3.scale.ordinal().range(["#015B64"]);
var generic_default = d3.scale.ordinal().range(["#44946E"]);
var won_default = d3.scale.ordinal().range(["#45936E"]);
var lost_default = d3.scale.ordinal().range(["#92332F"]);
var oppo_default = d3.scale.ordinal().range(["#9FB2BE"]);
var year_default = d3.scale.ordinal().range(["#1C293B"]);
var default_colors = d3.scale.ordinal().domain(["won", "lost", "tied"]).range(["#28497B", "#8A091A", "#D9B526"])
var gray_default = d3.scale.ordinal().domain(["won", "lost", "tied"]).range(["#454545", "#323232", "#afafaf"])
//For pie chart
var donut_inner = 40
var donut_outer = 60
var donut_height = 100
var perc_view = true;
var perc_view2 = true;
var first_time = true;

grey_undefined = function(chart) {
  chart.selectAll("text.row").classed("grey",function(d) {return d.value.not_real || d.value.count == 0});
}

//---------------------CLEANUP functions-------------------------

var yearDom = [];

//Resize the chart based on the screen size
$( window ).resize(function() {
  result_chart_width = function(d){
      var windowWidth = $(window).width();
      var w = windowWidth * resize;
      if (windowWidth <= 972) return windowWidth*0.95; //default_large_width
      if (w < original_result_chart_width) return original_result_chart_width;
      if (windowWidth >1080) return windowWidth*0.475; //original_result_chart_width+100;
      return w;
  }
  dc.renderAll();
});

function cleanup(d) {

  d.Year = d.Date.slice(-2);
  d.Year = d.Year > 16 ? 1900+parseInt(d.Year) : 2000+parseInt(d.Year);
  d.Value = 1;
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

//Queueing defer ensures that all our datasets get loaded before any work is done

queue()
    .defer(d3.csv, "data/cricket-captains.csv") //cricket-odi
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
    "won": 0,
    "lost": 0,
    "tied": 0
  });


  //---------------------------------FILTERS-----------------------------------------
  ndx = crossfilter(_data);
  ndx2 = crossfilter(_data);
  //---------------------------ORDINARY CHARTS --------------------------------------

  //Dimensions
  year = ndx.dimension(function(d){return d.Year});
  year2 = ndx2.dimension(function(d){return d.Year});

  result_year = year;
  result_year2 = year2;

  opposition = ndx.dimension(function(d){return d.Opposition});
  opposition2 = ndx2.dimension(function(d){return d.Opposition});

  team = ndx.dimension(function(d){return d.Team});
  team2 = ndx2.dimension(function(d){return d.Team});

  result = ndx.dimension(function(d){return d.Result});
  result2 = ndx2.dimension(function(d){return d.Result});

  resultStatus = ndx.dimension(function(d) {return d.resultStatus});
  resultStatus2 = ndx.dimension(function(d) {return d.resultStatus});

  ground = ndx.dimension(function(d){return d.Ground});
  ground2 = ndx2.dimension(function(d){return d.Ground});

  captain = ndx.dimension(function(d){return d.Captain});
  captain2 = ndx2.dimension(function(d){return d.Captain});

  //Groups
  year_group = year.group().reduceSum(function(d){return d.Value});
  year_group2 = year2.group().reduceSum(function(d){return d.Value});

  opposition_group = opposition.group().reduceSum(function(d){return d.Value});
  opposition_group2 = opposition2.group().reduceSum(function(d){return d.Value});

  team_group = team.group().reduceSum(function(d){return d.Value});
  team_group2 = team2.group().reduceSum(function(d){return d.Value});

  result_pie_group = result.group().reduceSum(function(d){return d.Value});
  result_pie_group2 = result2.group().reduceSum(function(d){return d.Value});

  ground_group = ground.group().reduceSum(function(d){return d.Value});
  ground_group2 = ground2.group().reduceSum(function(d){return d.Value});

  captain_group = captain.group().reduceSum(function(d){return d.Value});
  captain_group2 = captain2.group().reduceSum(function(d){return d.Value});

  captain_array = [];
  for (i in captain_group.all()) {
    captain_array.push(captain_group.all()[i].key);
  }

//  result_year_group = year.group().reduce(resultByYear.add, resultByYear.remove, resultByYear.init);

  result_year_group = year.group().reduce(
    function(p, v) { // add
      p[v.Result] = p[v.Result] || [];
      p[v.Result].push(v);
      return p;
    },
    function(p, v) { // remove
      index = p[v.Result].indexOf(v);

      p[v.Result].splice(index, 1);
      return p;
    },
    function() { // initial
      return {};
    }
  );

  result_year_group2 = year2.group().reduce(
    function(p, v) { // add
      p[v.Result] = p[v.Result] || [];
      p[v.Result].push(v);
      return p;
    },
    function(p, v) { // remove
      index = p[v.Result].indexOf(v);

      p[v.Result].splice(index, 1);
      return p;
    },
    function() { // initial
      return {};
    }
  );

  result_group = resultStatus.group().reduceSum(function(d){
    if (d.Result != 'tied') return d.Value;
    else return 0;
  });

  result_group2 = resultStatus2.group().reduceSum(function(d){
    if (d.Result != 'tied') return d.Value;
    else return 0;
  });

  ground_chart = dc.rowChart('#ground')
    .dimension(ground)
    .group(ground_group)
    .colors(generic_default)
    .transitionDuration(200)
    .height(small_chart_height)
    .width(small_width-50)
    .ordering(function(d){ return -d.value })
    .elasticX(true)
    .rowsCap(7)
    .label(function(d){
      return d.key + ": " + d.value;
    })
    .title(function(d){
      var title = d.key + ": " + d.value;
      return title;
    });


  ground_chart.xAxis().ticks(5).tickFormat(d3.format("d"));
  grey_undefined(ground_chart);

  ground_chart2 = dc.rowChart('#ground2')
    .dimension(ground2)
    .group(ground_group2)
    .colors(generic_default)
    .transitionDuration(200)
    .height(small_chart_height)
    .width(small_width-50)
    .ordering(function(d){ return -d.value })
    .elasticX(true)
    .rowsCap(7)
    .label(function(d){
      return d.key + ": " + d.value;
    })
    .title(function(d){
      var title = d.key + ": " + d.value;
      return title;
    });


  ground_chart2.xAxis().ticks(5).tickFormat(d3.format("d"));
  grey_undefined(ground_chart2);

  opposition_chart = dc.rowChart('#opposition')
    .dimension(opposition)
    .group(opposition_group)
    .colors(oppo_default)
    .transitionDuration(200)
    .height(small_chart_height)
    .width(small_width-50)
    .ordering(function(d){ return -d.key })
//    .xAxisLabel('Total Games')
//    .xAxisPadding(500)
    .elasticX(true)
    .label(function(d){
      var label = d.key;
      if($.inArray(d.key, team_chart.filters()) == 0) return "";
      return label + ": " + d.value;
    })
    .title(function(d){
//      if($.inArray(d.key, team_chart.filters()) == -1) return;
      var title = d.key + " \nTotal Games Against Team A: " + d.value;
      return title;
    });

  opposition_chart._onClick = function(d) {
      if($.inArray(d.key, team_chart.filters()) == 0) return;
      var filter = opposition_chart.keyAccessor()(d);
        dc.events.trigger(function () {
            opposition_chart.filter(filter);
            opposition_chart.redrawGroup();
        });
   }

  opposition_chart.xAxis().ticks(5).tickFormat(d3.format("d"));
  grey_undefined(opposition_chart);

  opposition_chart2 = dc.rowChart('#opposition2')
    .dimension(opposition2)
    .group(opposition_group2)
    .colors(oppo_default)
    .transitionDuration(200)
    .height(small_chart_height)
    .width(small_width-50)
    .ordering(function(d){ return -d.key })
//    .xAxisLabel('Total Games')
//    .xAxisPadding(500)
    .elasticX(true)
    .label(function(d){
        var label = d.key;
        if($.inArray(d.key, team_chart2.filters()) == 0) return "";
        return label + ": " + d.value;
    })
    .title(function(d){
//      if($.inArray(d.key, team_chart2.filters()) == -1) return;
      var title = d.key + " \nTotal Games Against Team B: " + d.value;
      return title;
    });

  opposition_chart2._onClick = function(d) {
      if($.inArray(d.key, team_chart2.filters()) == 0) return;
      var filter = opposition_chart2.keyAccessor()(d);
        dc.events.trigger(function () {
            opposition_chart2.filter(filter);
            opposition_chart2.redrawGroup();
        });
   }

  opposition_chart2.xAxis().ticks(5).tickFormat(d3.format("d"));
  grey_undefined(opposition_chart2);



  team_chart = dc.rowChart('#team')
    .dimension(team)
    .group(team_group)
    .colors(generic_default)
    .transitionDuration(200)
    .filter('Australia')
    .height(small_chart_height)
    .width(small_width-50)
    .ordering(function(d){ return -d.key })
    .elasticX(true)
    .label(function(d){
        var label = d.key;
        if($.inArray(d.key, team_chart.filters()) == 0) return label + ": " + d.value;
        return label + ": " + d.value;
    })
    .title(function(d){
      if($.inArray(d.key, team_chart.filters()) == -1) return;
      var title = d.key + " \nTotal Games Against Opposition(s): " + d.value;
      return title;
    });

  team_chart._onClick = function(d) {
    // var filter = opposition_chart2.keyAccessor()(d);
    //     dc.events.trigger(function () {
    //         opposition_chart2.filter(filter);
    //         opposition_chart2.redrawGroup();
    //     });
      dc.events.trigger(function () {
        arr = opposition_chart.filters();
        if (arr.includes(d.key)) {
          opposition_chart.filterAll();
        }
        team_chart.replaceFilter(d.key);
        team_chart.redrawGroup()
      });
      hideButton('#teamA');
      change_title();
      change_legends();
      dc.renderAll();
   };

  team_chart.xAxis().ticks(5).tickFormat(d3.format("d"));
  grey_undefined(team_chart);

  team_chart2 = dc.rowChart('#team2')
    .dimension(team2)
    .group(team_group2)
    .colors(generic_default)
    .transitionDuration(200)
    .filter('New Zealand')
    .height(small_chart_height)
    .width(small_width-50)
    .ordering(function(d){ return -d.key })
    .elasticX(true)
    .label(function(d){
        var label = d.key;
        if($.inArray(d.key, team_chart2.filters()) == 0) return label + ": " + d.value;
        return label + ": " + d.value;;
    })
    .title(function(d){
      if($.inArray(d.key, team_chart2.filters()) == -1) return;
      var title = d.key + " \nTotal Games Against Opposition(s): " + d.value;
      return title;
    });

  team_chart2._onClick = function(d) {
      dc.events.trigger(function () {
        arr = opposition_chart2.filters();
        if (arr.includes(d.key)) {
          opposition_chart2.filterAll();
        }
        team_chart2.replaceFilter(d.key);
        team_chart2.redrawGroup();
      });
      hideButton('#teamB');
      change_title();
      change_legends();
      dc.renderAll();
   };

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
                              .range(["#28497B", "#8A091A", "#D9B526"]))
    .colorAccessor(function(d) {
        if (d.key == "won") return "won";
        else if (d.key == "lost") return "lost";
        return "tied";
    })
    .on("renderlet.result_pie", function(chart) {
      chart.selectAll('text.pie-slice').text( function(d) {
        v = dc.utils.printSingleValue((d.endAngle - d.startAngle) / (2*Math.PI) * 100);
        v = parseFloat(v).toFixed(1);
        return v == 0 ? "" : v + '%';
      })
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
        return "Team B Won Against Opposition\n" + title;
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
                              .range(["#28497B", "#8A091A", "#D9B526"]))
    .colorAccessor(function(d) {
      if (d.key == "won") return "won";
      else if (d.key == "lost") return "lost";
      return "tied";
    })
    .on("renderlet.result_pie2", function(chart) {
      chart.selectAll('text.pie-slice').text( function(d) {
        v = dc.utils.printSingleValue((d.endAngle - d.startAngle) / (2*Math.PI) * 100);
        v = parseFloat(v).toFixed(1);
        return v == 0 ? "" : v + '%';
      })
    });

//  result_chart._onClick = function(d) {
//      dc.events.trigger(() => {
//          result_chart.filter(d.key)
//          result_chart.renderGroup();
//      });
//
//      if (result_chart.filters().length > 0) {
//        perc_view = true;
//        change_result_view();
//      }
//      else {
//        perc_view = false;
//        change_result_view();
//      }
//
//      if (perc_view == perc_view2){
//        if (perc_view == true) true_composite_chart.yAxisLabel("Performance %");
//        else true_composite_chart.yAxisLabel("Total Games");
//      }
//      else {
//        true_composite_chart.yAxisLabel("Games/Percentage");
//      }
//      reset_composite_label();
//      dc.redrawAll();
//  }

//  result_chart2._onClick = function(d) {
//      dc.events.trigger(() => {
//          result_chart2.filter(d.key)
//          result_chart2.renderGroup();
//      });
//      if (result_chart.filters().length > 0 && result_chart2.filters().length > 0) {
//          true_composite_chart.yAxisLabel("Games (Selected)");
////        $('.variable_title').text(" Total Games (Selected)");
//      }
//      else if ((result_chart.filters().length > 0 && result_chart2.filters().length == 0) || (result_chart.filters().length == 0 && result_chart2.filters().length > 0)) {
//          true_composite_chart.yAxisLabel("Games/Percentage");
//      }
//      else {
//          true_composite_chart.yAxisLabel("Performance %");
//      }
//
//      if (result_chart2.filters().length > 0) {
//        perc_view2 = true;
//        change_result_view2();
//      }
//      else {
//        perc_view2 = false;
//        change_result_view2();
//      }
//      reset_composite_label();
//      dc.redrawAll();
//  }

  var all = ndx.groupAll();
  data_count_chart = dc.dataCount('#data_count')
    .dimension(ndx)
    .group(all)
    .html({
        some: '<span class=\'title data-count\'><strong>Team A: </strong><strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' +
            ' | <a class=\'btn btn-info reset\' href=\'javascript:   team_chart.replaceFilter("Australia"); hideButton("#teamA"); opposition_chart.filterAll(); result_chart.filterAll(); ground_chart.filterAll(); change_title(); reset_selectize("#captain-search"); perc_view = true; reset_composite_label(); draw_normalized_result_year_chart(); change_legends(); result_year_chart.brushOn(true); brush_on(); dc.renderAll(); \'\'><i class="fa fa-refresh"> Reset Team A</i></a>',
        all: '<span class=\'data-count\'>All records selected. Please click on the graph to apply filters.<span>'
    });

  var all2 = ndx2.groupAll();
  data_count_chart2 = dc.dataCount('#data_count2')
    .dimension(ndx2)
    .group(all2)
    .html({
        some: '<span class=\'title data-count\'><strong>Team B: </strong><strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' +
            ' | <a class=\'btn btn-info reset\' href=\'javascript: team_chart2.replaceFilter("New Zealand"); hideButton("#teamB"); opposition_chart2.filterAll(); result_chart2.filterAll(); ground_chart2.filterAll(); change_title(); reset_selectize("#captain-search2"); perc_view2 = true; reset_composite_label(); draw_normalized_result_year_chart2(); change_legends(); result_year_chart2.brushOn(true); brush_on2(); dc.renderAll();\'\'><i class="fa fa-refresh"> Reset Team B</i></a>',
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

function change_result_view() {
  if(first_time == false) dc.deregisterChart(result_year_chart);
  if (perc_view == false) {
    draw_normalized_result_year_chart();
  }
  else {
  draw_result_year_chart();
  }

  //Need to reset the filter when the view changes or else, filter lingers
  result_year_chart.filterAll();
  $('#brush_on').val((result_year_chart.brushOn() == true) ? "Turn OFF Brush filter" : "Turn ON Brush filter");
  dc.renderAll();
  perc_view = !perc_view;
  change_title();
  reset_composite_label();
  if(perc_view != perc_view2){
    true_composite_chart.yAxisLabel("Games/Percentage");
    $('.variable_title').text(" Games/Percentage Comparison");
  }
  change_legends();
  dc.renderAll();
}

function change_result_view2() {
  if (first_time == false) dc.deregisterChart(result_year_chart2);
  if (perc_view2 == false) {
    draw_normalized_result_year_chart2();
  }
  else {
    draw_result_year_chart2();
  }

  //Need to reset the filter when the view changes or else, filter lingers
  result_year_chart2.filterAll();
  $('#brush_on2').val((result_year_chart2.brushOn() == true) ? "Turn OFF Brush filter" : "Turn ON Brush filter");
  dc.renderAll();
  perc_view2 = !perc_view2;
  change_title();
  reset_composite_label();
  if(perc_view != perc_view2){
    true_composite_chart.yAxisLabel("Games/Percentage");
    $('.variable_title').text(" Games/Percentage Comparison");
  }
  change_legends();
  dc.renderAll();
}

function initialize(){
  draw_composite_line_chart();
  draw_normalized_result_year_chart();
  draw_normalized_result_year_chart2();
  change_title();
  hideButton("#teamA");
  hideButton("#teamB");
  first_time = false;
  create_search();
  dc.renderAll();
};

function create_search() {
  var items = {};
  items = captain_array.map(function(x) {
    return { item: x };
  });

  for (i in items){
    if (items[i].item == "") {
      items.splice(i, i+1);
    }
  }

  create_selectize(items);
  create_selectize2(items);
}

function hideshow(id){
  var a = $(id);
  a.toggle('show');
};

function showAll() {
  var idList = ["#result_year", "#team_opp", "#result", "#team", "#opposition", "#ground", "#result_year2", "#team_opp2", "#result2", "#team2", "#opposition2", "#ground2"]

  for (x in idList) {
    var a = $(idList[x]);
    if (a.css('display') == "none"){
      a.toggle('show');
    }
  }
  $('[type=checkbox]').prop('checked', true);
};

function hideButton(id){
  if (id == "#teamA" && $.inArray("Australia", team_chart.filters()) == 0) {
    $(id).hide();
  }
  if (id == "#teamB" && $.inArray("New Zealand", team_chart2.filters()) == 0) {
    $(id).hide();
  }
}

function change_title() {
  var A = team_chart.filters()[0];
  var B = team_chart2.filters()[0];
  var teamA_text = A + "'s Overall Performance by ";
  var teamB_text = B + "'s Overall Performance by ";

  if (perc_view == true) teamA_text += "Percentage"
  else teamA_text += "Games"

  if (perc_view2 == true) teamB_text += "Percentage"
  else teamB_text += "Games"

  $('.result_year_title').text(teamA_text);
  $('.result_year_title2').text(teamB_text);

  if (A == B) {
    $('.A').text(A);
    $('.B').text("");
  }
  else {
    $('.A').text(A + " | ");
    $('.B').text(B);
  }
}

function draw_result_year_chart() {
  var teamA_text = team_chart.filters()[0] + "'s Overall Performance by Games ";
  $('.result_year_title').text(teamA_text);

  result_year_chart = dc.barChart('#result_year')
      .group(result_year_group, "won")
      .valueAccessor(function(d){return d.value["won"].length })
      .stack(result_year_group, "lost", function(d) { return d.value["lost"].length })
      .stack(result_year_group, "tied", function(d) {
          if (d.value["tied"]) return d.value["tied"].length
          else return 0;
      })
      .label(function(d) { return d; })
      .title(function(d) {
          won = d.value["won"].length;
          lost = d.value["lost"].length;
          if (d.value["tied"]) tied = d.value["tied"].length
          else tied = 0;
          total = won + lost + tied;

          var v = 0;
          games_count = 0;

          label_value = 0;
          if (d.value[this.layer] == undefined) label_value = 0;
          else label_value = d.value[this.layer].length;

          output = d.key+": "+d3.format(',')(label_value)+" Game(s) ("+capitalizeFirst(this.layer)+")\n\n";

          if (this.layer == "won"){
              if (d.value[this.layer] != undefined)
                  if (d.value[this.layer].length > 1)
                      d.value[this.layer].forEach(function(obj){
                          games_count++;
                          if (games_count < 6)
                              output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
                      });
                  else {
                      obj = d.value[this.layer][0];
                      if (obj != undefined)
                          output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
                  }
          }
          else if (this.layer == "lost"){
              if (d.value[this.layer] != undefined)
                  if (d.value[this.layer].length > 1)
                      d.value[this.layer].forEach(function(obj){
                          games_count++;
                          if (games_count < 6)
                              output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
                      });
                  else {
                      obj = d.value[this.layer][0];
                      if (obj != undefined)
                          output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
                  }
          }
          else {
              if (d.value[this.layer] != undefined)
                  if (d.value[this.layer].length > 1)
                      d.value[this.layer].forEach(function(obj){
                          games_count++;
                          if (games_count < 6)
                              output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
                      });
                  else {
                      obj = d.value[this.layer][0];
                      if (obj != undefined)
                          output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
                  }
          }

          if (isNaN(v)) v = 0;
          else v = parseFloat((v*100)).toFixed(1);

          if(d.value[this.layer] > 0){
              d3.select(".area").selectAll("circle.dot").attr("r", 10);
          }

          if (games_count > 5) {
              games_count -= 5;
              output += "\nOthers [" + games_count + "]";
          }

          return output;

      })
      .brushOn(false)
      .dimension(result_year)
      .centerBar(true)
      .height(medium_chart_height/2)
      .width(result_chart_width)
      .colors(default_colors)
      .x(d3.scale.linear().domain([1995, 2016]))
      .elasticX(false)
      .elasticY(true)
      .transitionDuration(200)
      .mouseZoomable(false)
      .yAxisLabel("Games")
      .renderHorizontalGridLines(false)
      .renderVerticalGridLines(false)
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
  result_year_chart.yAxis().ticks(5).tickFormat(d3.format("g"));
  grey_undefined(result_year_chart);
}

function draw_normalized_result_year_chart() {
  if (first_time == false) dc.deregisterChart(result_year_chart);
  var teamA_text = team_chart.filters()[0] + "'s Overall Performance by Percentage";
  $('.result_year_title').text(teamA_text);
  result_year_chart = dc.barChart('#result_year')
      .group(result_year_group, "won")
      .valueAccessor(function(d){
              won = d.value["won"].length;
              lost = d.value["lost"].length;
              if (d.value["tied"]) tied = d.value["tied"].length
              else tied = 0;
              total = won + lost + tied;

              var v = parseFloat(won/total);
              if (isNaN(v)) return 0;
              return parseFloat((v*100).toFixed(1));
          })
          .stack(result_year_group, "lost", function(d) {
              won = d.value["won"].length;
              lost = d.value["lost"].length;
              if (d.value["tied"]) tied = d.value["tied"].length
              else tied = 0;
              total = won + lost + tied;

              var v = parseFloat(lost/total);
              if (isNaN(v)) return 0;
              return parseFloat((v*100).toFixed(1));
          })
          .stack(result_year_group, "tied", function(d) {
          if (d.value["tied"]) {
              won = d.value["won"].length;
              lost = d.value["lost"].length;
              if (d.value["tied"]) tied = d.value["tied"].length
              else tied = 0;
              total = won + lost + tied;

              var v = parseFloat(tied/total)
              if (isNaN(v)) return 0;
              return parseFloat((v*100).toFixed(1));
          }
          else
              return 0
          })
      .label(function(d) { return d; })
      .title(function(d) {
          won = d.value["won"].length;
          lost = d.value["lost"].length;
          if (d.value["tied"]) tied = d.value["tied"].length
          else tied = 0;
          total = won + lost + tied;

          var v = 0;
          games_count = 0;

          label_value = 0;
          if (d.value[this.layer] == undefined) label_value = 0;
          else label_value = d.value[this.layer].length;

          output = d.key+": "+d3.format(',')(label_value)+" Game(s) ("+capitalizeFirst(this.layer)+")\n\n";

          if (this.layer == "won"){
              if (d.value[this.layer] != undefined)
                  if (d.value[this.layer].length > 1)
                      d.value[this.layer].forEach(function(obj){
                          games_count++;
                          if (games_count < 6)
                              output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
                      });
                  else {
                      obj = d.value[this.layer][0];
                      if (obj != undefined)
                          output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
                  }
          }
          else if (this.layer == "lost"){
              if (d.value[this.layer] != undefined)
                  if (d.value[this.layer].length > 1)
                      d.value[this.layer].forEach(function(obj){
                          games_count++;
                          if (games_count < 6)
                              output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
                      });
                  else {
                      obj = d.value[this.layer][0];
                      if (obj != undefined)
                          output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
                  }
          }
          else {
              if (d.value[this.layer] != undefined)
                  if (d.value[this.layer].length > 1)
                      d.value[this.layer].forEach(function(obj){
                          games_count++;
                          if (games_count < 6)
                              output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
                      });
                  else {
                      obj = d.value[this.layer][0];
                      if (obj != undefined)
                          output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
                  }
          }

          if (isNaN(v)) v = 0;
          else v = parseFloat((v*100)).toFixed(1);

          if(d.value[this.layer] > 0){
              d3.select(".area").selectAll("circle.dot").attr("r", 10);
          }

          if (games_count > 5) {
              games_count -= 5;
              output += "\nOthers [" + games_count + "]";
          }

          return output;

      })
      .brushOn(false)
      .dimension(result_year)
      .centerBar(true)
      .height(medium_chart_height/2)
      .width(result_chart_width)
      .colors(default_colors)
      .x(d3.scale.linear().domain([1995, 2016]))
      .elasticX(false)
      .elasticY(true)
      .transitionDuration(200)
      .mouseZoomable(false)
      .yAxisLabel("Percentage")
      .renderHorizontalGridLines(false)
      .renderVerticalGridLines(false)
      .margins({top: 10, right: 20, bottom: 30, left: 50})
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
  result_year_chart.yAxis().ticks(5).tickFormat(d3.format("g"));
  grey_undefined(result_year_chart);
}


function draw_result_year_chart2() {
  var teamB_text = team_chart2.filters()[0] + "'s Overall Performance by Games";
  $('.result_year_title2').text(teamB_text);

  result_year_chart2 = dc.barChart('#result_year2')
      .group(result_year_group2, "won")
      .valueAccessor(function(d){return d.value["won"].length })
      .stack(result_year_group2, "lost", function(d) { return d.value["lost"].length })
      .stack(result_year_group2, "tied", function(d) {
          if (d.value["tied"]) return d.value["tied"].length
          else return 0;
      })
      .label(function(d) { return d; })
      .title(function(d) {
          won = d.value["won"].length;
          lost = d.value["lost"].length;
          if (d.value["tied"]) tied = d.value["tied"].length
          else tied = 0;
          total = won + lost + tied;

          var v = 0;
          games_count = 0;

          label_value = 0;
          if (d.value[this.layer] == undefined) label_value = 0;
          else label_value = d.value[this.layer].length;

          output = d.key+": "+d3.format(',')(label_value)+" Game(s) ("+capitalizeFirst(this.layer)+")\n\n";

          if (this.layer == "won"){
              if (d.value[this.layer] != undefined)
                  if (d.value[this.layer].length > 1)
                      d.value[this.layer].forEach(function(obj){
                          games_count++;
                          if (games_count < 6)
                              output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
                      });
                  else {
                      obj = d.value[this.layer][0];
                      if (obj != undefined)
                          output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
                  }
          }
          else if (this.layer == "lost"){
              if (d.value[this.layer] != undefined)
                  if (d.value[this.layer].length > 1)
                      d.value[this.layer].forEach(function(obj){
                          games_count++;
                          if (games_count < 6)
                              output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
                      });
                  else {
                      obj = d.value[this.layer][0];
                      if (obj != undefined)
                          output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
                  }
          }
          else {
              if (d.value[this.layer] != undefined)
                  if (d.value[this.layer].length > 1)
                      d.value[this.layer].forEach(function(obj){
                          games_count++;
                          if (games_count < 6)
                              output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
                      });
                  else {
                      obj = d.value[this.layer][0];
                      if (obj != undefined)
                          output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
                  }
          }

          if (isNaN(v)) v = 0;
          else v = parseFloat((v*100)).toFixed(1);

          if(d.value[this.layer] > 0){
              d3.select(".area").selectAll("circle.dot").attr("r", 10);
          }

          if (games_count > 5) {
              games_count -= 5;
              output += "\nOthers [" + games_count + "]";
          }

          return output;

      })
      .brushOn(false)
      .dimension(result_year2)
      .centerBar(true)
      .height(medium_chart_height/2)
      .width(result_chart_width)
      .colors(default_colors)
      .x(d3.scale.linear().domain([1995, 2016]))
      .elasticX(false)
      .elasticY(true)
      .transitionDuration(200)
      .mouseZoomable(false)
      .yAxisLabel("Games")
      .renderHorizontalGridLines(false)
      .renderVerticalGridLines(false)
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
  result_year_chart2.yAxis().ticks(5).tickFormat(d3.format("g"));
  grey_undefined(result_year_chart2);
}

function draw_normalized_result_year_chart2() {
  if (first_time == false) dc.deregisterChart(result_year_chart2);
  var teamB_text = team_chart2.filters()[0] + "'s Overall Performance by Percentage";
  $('.result_year_title2').text(teamB_text);
  result_year_chart2 = dc.barChart('#result_year2')
    .group(result_year_group2, "won")
    .valueAccessor(function(d){
        won = d.value["won"].length;
        lost = d.value["lost"].length;
        if (d.value["tied"]) tied = d.value["tied"].length
        else tied = 0;
        total = won + lost + tied;

        var v = parseFloat(won/total);
        if (isNaN(v)) return 0;
        return parseFloat((v*100).toFixed(1));
      })
      .stack(result_year_group2, "lost", function(d) {
        won = d.value["won"].length;
        lost = d.value["lost"].length;
        if (d.value["tied"]) tied = d.value["tied"].length
        else tied = 0;
        total = won + lost + tied;

        var v = parseFloat(lost/total);
        if (isNaN(v)) return 0;
        return parseFloat((v*100).toFixed(1));
      })
      .stack(result_year_group2, "tied", function(d) {
      if (d.value["tied"]) {
        won = d.value["won"].length;
        lost = d.value["lost"].length;
        if (d.value["tied"]) tied = d.value["tied"].length
        else tied = 0;
        total = won + lost + tied;

        var v = parseFloat(tied/total)
        if (isNaN(v)) return 0;
        return parseFloat((v*100).toFixed(1));
      }
      else
        return 0
      })
    .label(function(d) { return d; })
    .title(function(d) {
      won = d.value["won"].length;
      lost = d.value["lost"].length;
      if (d.value["tied"]) tied = d.value["tied"].length
      else tied = 0;
      total = won + lost + tied;

      var v = 0;
      games_count = 0;

      label_value = 0;
      if (d.value[this.layer] == undefined) label_value = 0;
      else label_value = d.value[this.layer].length;

      output = d.key+": "+d3.format(',')(label_value)+" Game(s) ("+capitalizeFirst(this.layer)+")\n\n";

      if (this.layer == "won"){
        if (d.value[this.layer] != undefined)
          if (d.value[this.layer].length > 1)
            d.value[this.layer].forEach(function(obj){
              games_count++;
              if (games_count < 6)
                output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
            });
          else {
            obj = d.value[this.layer][0];
            if (obj != undefined)
              output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
          }
      }
      else if (this.layer == "lost"){
        if (d.value[this.layer] != undefined)
          if (d.value[this.layer].length > 1)
            d.value[this.layer].forEach(function(obj){
              games_count++;
              if (games_count < 6)
                output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
            });
          else {
            obj = d.value[this.layer][0];
            if (obj != undefined)
              output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
          }
      }
      else {
        if (d.value[this.layer] != undefined)
          if (d.value[this.layer].length > 1)
            d.value[this.layer].forEach(function(obj){
              games_count++;
              if (games_count < 6)
                output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
            });
          else {
            obj = d.value[this.layer][0];
            if (obj != undefined)
              output += "Date: " + obj.Date + " at " + obj.Ground +"\n";
          }
      }

      if (isNaN(v)) v = 0;
      else v = parseFloat((v*100)).toFixed(1);

      if(d.value[this.layer] > 0){
        d3.select(".area").selectAll("circle.dot").attr("r", 10);
      }

      if (games_count > 5) {
        games_count -= 5;
        output += "\nOthers [" + games_count + "]";
      }

      return output;

    })
    .brushOn(false)
    .dimension(result_year2)
    .centerBar(true)
    .height(medium_chart_height/2)
    .width(result_chart_width)
    .colors(default_colors)
    .x(d3.scale.linear().domain([1995, 2016]))
    .elasticX(false)
    .elasticY(true)
    .transitionDuration(200)
    .mouseZoomable(false)
    .yAxisLabel("Percentage")
    .renderHorizontalGridLines(false)
    .renderVerticalGridLines(false)
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
  result_year_chart2.yAxis().ticks(5).tickFormat(d3.format("g"));
  grey_undefined(result_year_chart2);
}

function draw_composite_line_chart() {
  true_composite_chart = dc.compositeChart("#true_composite_chart")
    .transitionDuration(1000)
    .label(function(d) { return d; })
    .title(function(d) {
      won = d.value["won"].length;
      lost = d.value["lost"].length;
      if (d.value["tied"]) tied = d.value["tied"].length
      else tied = 0;
      total = won + lost + tied;

      var v = 0;
      var text = "";
//      if (won != 0){
//        v = parseFloat(won/(total-tied));
//        text = "Won: " + won + "\n";
//      }
//      else won -= 1;
//
//      if (lost != 0) {
//        text += "Lost: " + lost + "\n";
//      }
//      else lost -= 1;
//
//      if (tied != 0) {
//        text += "Tied: " + tied + "\n";
//      }
//      else tied -= 1;
      won_v = parseFloat(won/(total-tied));
      lost_v = parseFloat(lost/(total-tied));
      text = "Won: " + won + "\n";
      text += "Lost: " + lost + "\n";
      text += "Tied: " + tied + "\n";
      won -= 1;
      lost -= 1;
      tied -= 1;
      performance = (won_v == 0) ? parseFloat((won_v*100).toFixed(1)) : parseFloat((lost_v*100).toFixed(1));

      if (isNaN(won_v)) return 0; //Something went wrong if this happens
      if (won == -1 && lost == -1) {
        text += "Incomplete result selection (Won AND Lost must be selected). Unable to get % of performance."
      }
      else {
        text += "Win Performance: " + parseFloat((won_v*100).toFixed(1))  + "%";
      }
      return d.key + "\n" + text;
    })
    .brushOn(false)
    .height(medium_chart_height/3)
    .width(composite_width)
    .x(d3.scale.linear().domain([1996, 2016]))
//    .y(d3.scale.linear().domain([-5, 105]))
    .yAxisLabel("Performance %")
    .yAxisPadding(35)
    .elasticX(false)
    .elasticY(true)
    .renderHorizontalGridLines(true)
    .legend(dc.legend().x(80).y(10).itemHeight(13).gap(5).autoItemWidth(true))
    .margins({top: 10, right: 50, bottom: 30, left: 50});

    normaline_chart = dc.lineChart(true_composite_chart)
      .group(result_year_group, team_chart.filter())
      .dimension(year)
      .valueAccessor(function(d){
        won = d.value["won"].length;
        lost = d.value["lost"].length;
        if (d.value["tied"]) tied = d.value["tied"].length
        else tied = 0;
        total = won + lost + tied;
        if (perc_view == false) {
          if (result_chart.filters().length <= 1) {
              if (won != 0) return  won;
              if (lost != 0) return lost;
              if (tied != 0) return tied;
          }
          else if (result_chart.filters().length > 1 && result_chart.filters().length != 3) {
            if (won != 0) return  won;
            if (lost != 0) return lost;
            if (tied != 0) return tied;
          }
          else {
            return won;
          }
        }

        var v = parseFloat(won/(total-tied));
        if (isNaN(v)) return 0;
        return parseFloat((v*100).toFixed(1));
      })
      .label(function(d) { return d; })
      .title(function(d) {
          won = d.value["won"].length;
          lost = d.value["lost"].length;
          if (d.value["tied"]) tied = d.value["tied"].length
          else tied = 0;
          total = won + lost + tied;

          if (result_chart.filters().length == 1) {
              if (won != 0) return  "Total Games (Won): " + won;
//              if (lost != 0) return "Total Games (Lost): " + lost;
//              if (tied != 0) return "Total Games (Tied): " + tied;
          }
          else if (result_chart.filters().length >= 2) {
              return "Total Games (Won): " + won;
          }

          var v = parseFloat(won/total);
          if (isNaN(v)) return 0 + "%";
          return "Yearly Performance: " + parseFloat((v*100).toFixed(1)) + "%";
      })
      .colors("blue")
      .x(d3.scale.linear().domain([1995, 2016]));

    normaline_chart2 = dc.lineChart(true_composite_chart)
      .group(result_year_group2, team_chart2.filter())
      .dimension(year2)
      .valueAccessor(function(d){
        won = d.value["won"].length;
        lost = d.value["lost"].length;
        if (d.value["tied"]) tied = d.value["tied"].length
        else tied = 0;
        total = won + lost + tied;
        if (perc_view2 == false) {
          if (result_chart2.filters().length <= 1) {
              if (won != 0) return  won;
              if (lost != 0) return lost;
              if (tied != 0) return tied;
          }
          else if (result_chart2.filters().length > 1 && result_chart2.filters().length != 3) {
            if (won != 0) return  won;
            if (lost != 0) return lost;
            if (tied != 0) return tied;
          }
          else {
            return won;
          }
        }

        var v = parseFloat(won/(total-tied));
        if (isNaN(v)) return 0;
        return parseFloat((v*100).toFixed(1));
      })
      .label(function(d) { return d; })
      .title(function(d) {
          won = d.value["won"].length;
          lost = d.value["lost"].length;
          if (d.value["tied"]) tied = d.value["tied"].length
          else tied = 0;
          total = won + lost + tied;

          if (result_chart2.filters().length == 1) {
              if (won != 0) return  "Total Games (Won): " + won;
//              if (lost != 0) return "Total Games (Lost): " + lost;
//              if (tied != 0) return "Total Games (Tied): " + tied;
          }
          else if (result_chart2.filters().length >= 2) {
              return "Total Games (Won): " + won;
          }

          var v = parseFloat(won/total);
          if (isNaN(v)) return 0 + "%";
          return "Yearly Performance: " + parseFloat((v*100).toFixed(1)) + "%";
      })
      .colors("black")
      .x(d3.scale.linear().domain([1995, 2016]))
      .dashStyle([5,5]);

    true_composite_chart
      .compose([
      normaline_chart,
      normaline_chart2
    ])
    .render();

  true_composite_chart.xAxis().ticks(10).tickFormat(d3.format("d"));
  true_composite_chart.yAxis().ticks(5).tickFormat(d3.format("g"));
  change_legends();
}


function reset_composite_label() {
//  if (result_chart.filters().length == 0 && result_chart2.filters().length == 0) {
//    if (perc_view == false && perc_view2 == false) {
//      true_composite_chart.yAxisLabel("Games");
//      $('.variable_title').text(" Total Games (All)");
//      dc.redrawAll();
//      return;
//    }
//    true_composite_chart.yAxisLabel("Performance %");
//    dc.redrawAll();
//  }
//
//  if ((result_chart.filters().length > 0 && result_chart2.filters().length > 0) || (result_chart.filters().length > 0 && result_chart2.filters().length > 0) && (perc_view == false && perc_view2 == false)) {
//    true_composite_chart.yAxisLabel("Games (Selected)");
//    $('.variable_title').text(" Total Games (Selected)");
//  }
//  else if ((result_chart.filters().length > 0 && result_chart2.filters().length == 0) || (result_chart.filters().length == 0 && result_chart2.filters().length > 0)) {
//    if (perc_view == false && perc_view2 == false) {
//      true_composite_chart.yAxisLabel("Games (Selected)");
//      $('.variable_title').text(" Total Games (Selected)");
//      return;
//    }
//
//    true_composite_chart.yAxisLabel("Games/Percentage");
//    $('.variable_title').text(" Games/Percentage Comparison");
//  }
//  else {
//    true_composite_chart.yAxisLabel("Performance %");
//    $('.variable_title').text(" Performance %");
//  }
    if (perc_view == perc_view2){
      if (perc_view == true) {
        true_composite_chart.yAxisLabel("Performance %");
        $('.variable_title').text(" Performance %");
      }
      else {
        $('.variable_title').text(" Total Games");
        true_composite_chart.yAxisLabel("Total Games");
      }
    }
    else {
      $('.variable_title').text(" Games/Percentage Comparison");
      true_composite_chart.yAxisLabel("Games/Percentage");
    }
  dc.redrawAll();
}

function change_legends() {
  if (perc_view == false) {
    legend = team_chart.filter() + " (Games) - Team A";
  }
  else {
    legend = team_chart.filter() + " (Percentage) - Team A";
  }

  if (perc_view2 == false) {
    legend2 = team_chart2.filter() + " (Games) - Team B";
  }
  else {
    legend2 = team_chart2.filter() + " (Percentage) - Team B";
  }
  normaline_chart.group(result_year_group, legend) ;
  normaline_chart2.group(result_year_group2, legend2);
}

function brush_on() {
  brush = result_year_chart.brushOn();
  result_year_chart.brushOn(!brush);
  result_year_chart.filterAll();
  $('#brush_on').val((result_year_chart.brushOn() == true) ? "Turn OFF Brush filter" : "Turn ON Brush filter");
  dc.renderAll();
}

function brush_on2() {
  brush = result_year_chart2.brushOn();
  result_year_chart2.brushOn(!brush);
  result_year_chart2.filterAll();
  $('#brush_on2').val((result_year_chart2.brushOn() == true) ? "Turn OFF Brush filter" : "Turn ON Brush filter");
  dc.renderAll();
}

function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  var expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') {
          c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
          return c.substring(name.length,c.length);
      }
  }
  return "";
}
