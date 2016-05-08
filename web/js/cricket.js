var small_chart_height = 250;
var medium_chart_height = 500;
var large_chart_height = 650;
var small_width = 480; //544
var medium_width = 720; //768
var result_chart_width = 768;
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
var perc_view = false;


grey_undefined = function(chart) {
  chart.selectAll("text.row").classed("grey",function(d) {return d.value.not_real || d.value.count == 0});
}

//---------------------CLEANUP functions-------------------------

var yearDom = [];

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
      .brushOn(true)  
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
    $('.result_year_title').text("Overall Team Performance by Games");
    result_year_chart
      .label(function(d) { return d; })
      .title(function(d) {
        d3.selectAll("rect.bar")
          .on('mouseover', function(d){
          });
          return d.key+": "+d3.format(',')(d.value[this.layer])+" ("+this.layer+")";
      });
    
  }
  else {
    $('.result_year_title').text("Overall Team Performance by Percentage");
    result_year_chart
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
        d3.selectAll("rect.bar")
          .on('mouseover', function(d){
          });
          return d.key+": "+d3.format(',')(d.value[this.layer])+" ("+this.layer+")";
      });
    
  }
  
  result_year_chart.yAxis().ticks(5).tickFormat(d3.format("g"));
  grey_undefined(result_year_chart);
  
  //Need to reset the filter when the view changes or else, filter lingers
  result_year_chart.filterAll();
  dc.renderAll();
  perc_view = !perc_view;
  
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
//	console.log(data);

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
  //---------------------------ORDINARY CHARTS --------------------------------------
	year = ndx.dimension(function(d){return d.Year});
		
  year_group = year.group().reduceSum(function(d){return d.Value});	
		
	year_chart = dc.rowChart('#year')
    .dimension(year)
    .group(year_group)
    .colors(year_default)
    .transitionDuration(200)
    .height(large_chart_height/1.5)
		.width(small_width)
    .ordering(function(d){ return -d.key })
//		.x(d3.scale.linear().domain([-25, 25]))
    .elasticX(true);
	
	year_chart.xAxis().ticks(10).tickFormat(d3.format("g"));
	grey_undefined(year_chart);

  year_bar = ndx.dimension(function(d){return d.Year});
    
  year_bar_group = year_bar.group().reduceSum(function(d){return d.Value}); 
	
	year_bar_chart = dc.barChart('#year-bar')
      .dimension(year_bar)
      .group(year_bar_group)
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
		
	opposition = ndx.dimension(function(d){return d.Opposition});
		
  opposition_group = opposition.group().reduceSum(function(d){return d.Value});	
		
	opposition_chart = dc.rowChart('#opposition')
    .dimension(opposition)
    .group(opposition_group)
    .colors(lost_default)
    .transitionDuration(200)
    .height(small_chart_height)
		.width(small_width-50)
    .ordering(function(d){ return -d.key })
//		.xAxisLabel('Total Games')
//		.xAxisPadding(500)
    .elasticX(true)
    .title(function(d){
      var title = d.key + " \nTotal Games Won Against Team A: " + d.value;
      return title;
    });
	
	opposition_chart.xAxis().ticks(5).tickFormat(d3.format("d"));
	grey_undefined(opposition_chart);
	
	team = ndx.dimension(function(d){return d.Team});
  team_group = team.group().reduceSum(function(d){return d.Value}); 
    
  team_chart = dc.rowChart('#team')
    .dimension(team)
    .group(team_group)
    .colors(won_default)
    .transitionDuration(200)
    .height(small_chart_height)
    .width(small_width-50)
    .ordering(function(d){ return -d.key })
    .elasticX(true)
    .title(function(d){
      var title = d.key + " \nTotal Games Won Against Team B: " + d.value;
      return title;
    });
  
  team_chart.xAxis().ticks(5).tickFormat(d3.format("d"));
  grey_undefined(team_chart); 
	
	result = ndx.dimension(function(d){return d.Result});
		
  result_group = result.group().reduceSum(function(d){return d.Value});	
		
	result_chart = dc.pieChart('#result')
    .dimension(result)
    .group(result_group)
    .transitionDuration(200)
    .legend(dc.legend().x(0).y(25).itemHeight(18).gap(5))
    .height(small_chart_height-50)
    .title(function(d) {
      var title = capitalizeFirst(d.key) + ": " + d.value;
      if (d.key == "won"){
        return "Team A Won Against Team B\n" + title;
      }
      else if (d.key == "lost"){
        return "Team A Lost Against Team B\n" + title;
      }
      return title;
    })
    .label(function(d) {
      if (d.key == "won") return "Team A: " + d.value;
      else if (d.key == "lost") return "Team B: " + d.value;
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
	
	result_year = ndx.dimension(function(d){return d.Year});
	result_year_group = result_year.group().reduce(resultByYear.add, resultByYear.remove, resultByYear.init);
	
  change_result_view();
	
  var all = ndx.groupAll();
  data_count_chart = dc.dataCount('#data_count')
    .dimension(ndx)
    .group(all)
    .html({
        some: '<span class=\'data-count\'><strong>%filter-count</strong> selected out of <strong>%total-count</strong> records</span>' +
            ' | <a class=\'reset\' href=\'javascript:dc.filterAll(); dc.redrawAll();\'\'>Reset All</a>',
        all: '<span class=\'data-count\'>All records selected. Please click on the graph to apply filters.<span>'
    });
	
  //pyramid chart
  resultStatus = ndx.dimension(function(d) {return d.resultStatus});
  result_group = resultStatus.group().reduceSum(function(d){return d.Value})
  
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
    .width(medium_width-100)
    .leftColumn(function (d){ return d.key.split('@')[1] == "won"})
    .rowAccessor(function(d){ return d.key.split('@')[0]})
    .label(function(d){return d.key.split('@')[0]})
    .title(function(d){
      if (d.key.split('@')[1] == "won") return "Won: " + d.value;
      else if (d.key.split('@')[1] == "lost") return "Lost: " + d.value;
      else return NaN;
    })
    .elasticX(false)
    .twoLabels(false)
    .rowOrdering(d3.ascending)
    .columnLabels(['Won','Lost'])
    .columnLabelPosition([150,0])
    .transitionDuration(200);
  
  team_opp_chart.xAxis().ticks(7).tickFormat(function(x) {return d3.format('s')(Math.abs(x))})
	
	dc.renderAll();

  initialize();
};

function initialize(){
  //odd are wins, even are losses
  var a = $('#team_opp g .row text:eq(7)'); 
//  var b = $('#team_opp g .row rect:eq(6)');
  
  a.simulate('click');
//  b.simulate('click');
  
};

function hideshow(id){
  var a = $(id);
  a.toggle('show');
};

function showAll() {
  var idList = ["#result_year", "#team_opp", "#result", "#team", "#opposition"]
  
  for (x in idList) {
    var a = $(idList[x]);
    if (a.css('display') == "none"){
      a.toggle('show');
    }
  }
  $('[type=checkbox]').prop('checked', true); 
};