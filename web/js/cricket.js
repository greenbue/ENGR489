var small_chart_height = 250;
var medium_chart_height = 500;
var large_chart_height = 650;
var small_width = 480; //544
var medium_width = 720; //768
var valueAccessor = function (d) {return d.Value < 1 ? 0 : d.Value};
var our_colors = ["#9df5e7","#b2bfdb","#a1eda1","#fc9898", "#afedf0","#afede1", "#fc6565"];
var team_default = d3.scale.ordinal().range(["#015B64"]);
var year_default = d3.scale.ordinal().range(["#1C293B"]);
var default_colors = d3.scale.ordinal().range(our_colors);
//For pie chart
var donut_inner = 40
var donut_outer = 80
var donut_height = 100


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
  
	if($.inArray(d.Year, yearDom) == -1){
		yearDom.push(d.properDate);
	}
	
  return d;
}

function isOdd(num) { 
	return num % 2;
}

//Queueing defer ensures that all our datasets get loaded before any work is done

queue()
    .defer(d3.csv, "/data/cricket-odi.csv")
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
    .colors(team_default)
    .transitionDuration(200)
    .height(small_chart_height)
		.width(small_width)
    .ordering(function(d){ return -d.key })
//		.xAxisLabel('Total Games')
//		.xAxisPadding(500)
    .elasticX(true);
	
	opposition_chart.xAxis().ticks(5).tickFormat(d3.format("d"));
	grey_undefined(opposition_chart);
	
	
	
	result = ndx.dimension(function(d){return d.Result});
		
  result_group = result.group().reduceSum(function(d){return d.Value});	
		
	result_chart = dc.pieChart('#result')
    .dimension(result)
    .group(result_group)
    .transitionDuration(200)
    .legend(dc.legend().x(0).y(25).itemHeight(18).gap(5))
    .height(small_chart_height-50)
    .label(function(d) {
      return d.key + " " + d.value
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
	
	
	result_year_chart = dc.barChart('#result_year')
		.group(result_year_group, "won")
		.valueAccessor(function(d){return d.value["won"]})
		.stack(result_year_group, "lost", function(d) { return d.value["lost"] })
		.stack(result_year_group, "tied", function(d) { return d.value["tied"] })
		.dimension(result_year)
		.centerBar(true)
		.height(medium_chart_height/2)
		.width(medium_width*1.5)
		.transitionDuration(200)
		.label(function(d) { return d; })
		.title(function(d) {
			d3.selectAll("rect.bar")
				.on('mouseover', function(d){
				});
				return d.key+": "+d3.format(',')(d.value[this.layer])+" ("+this.layer+")";
		})
		.x(d3.scale.linear().domain([1995, 2016]))
		.renderLabel(true)
		.colors(d3.scale.ordinal().domain(["won", "lost", "tied"]).range(["#45936E","#92332F", "#3E70A1"]))
		.elasticX(false)
		.elasticY(true)
		.yAxisLabel("Games")
		.margins({top: 10, right: 40, bottom: 30, left: 40})
		.renderHorizontalGridLines(true)
		.renderVerticalGridLines(true)
		.mouseZoomable(false)
		.brushOn(true)
//		.renderArea(true)
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
					.attr("font-size", "12px")
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
	

		
	
	
	
	dc.renderAll();
}