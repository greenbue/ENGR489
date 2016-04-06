var small_chart_height = 250;
var medium_chart_height = 500;
var large_chart_height = 650;
var small_width = 480; //544
var medium_width = 720; //768
var valueAccessor =function(d){return d.Value < 1 ? 0 : d.Value};
var our_colors = ["#9df5e7","#b2bfdb","#a1eda1","#fc9898", "#afedf0","#afede1", "#fc6565"];
var default_colors = d3.scale.ordinal().range(our_colors);
//For pie chart
var donut_inner = 40
var donut_outer = 80
var donut_height = 100


grey_undefined = function(chart) {
  chart.selectAll("text.row").classed("grey",function(d) {return d.value.not_real || d.value.count == 0})
}

//---------------------CLEANUP functions-------------------------

function cleanup(d) {
		
  d.Year = d.Date.slice(-2);
	d.Year = d.Year > 16 ? 1900+parseInt(d.Year) : 2000+parseInt(d.Year);
	d.Value = 1;
	
  return d;
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
	})
    
	//---------------------------------FILTERS-----------------------------------------
  ndx = crossfilter(_data);
  //---------------------------ORDINARY CHARTS --------------------------------------
	year = ndx.dimension(function(d){return d.Year});
		
  year_group = year.group().reduceSum(function(d){return d.Value});	
		
	year_chart = dc.rowChart('#year')
    .dimension(year)
    .group(year_group)
    .colors(default_colors)
    .transitionDuration(200)
    .height(large_chart_height/1.5)
		.width(small_width)
    .ordering(function(d){ return -d.key })
//		.x(d3.scale.linear().domain([-25, 25]))
    .legend(dc.legend().x(400).y(10).itemHeight(13).gap(5))
    .elasticX(true);
	
	year_chart.xAxis().ticks(5).tickFormat(d3.format("s"));
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
    .colors(default_colors)
    .transitionDuration(200)
    .height(small_chart_height)
		.width(small_width)
    .ordering(function(d){ return -d.key })
//		.x(d3.scale.linear().domain([-25, 25]))
    .elasticX('true');
	
	opposition_chart.xAxis().ticks(5).tickFormat(d3.format("s"));
	grey_undefined(opposition_chart);
	
	
	
	result = ndx.dimension(function(d){return d.Result});
		
  result_group = result.group().reduceSum(function(d){return d.Value});	
		
	result_chart = dc.pieChart('#result')
    .dimension(result)
    .group(result_group)
    .transitionDuration(200)
    .height(small_chart_height-50)
   	.innerRadius(donut_inner)
    .radius(donut_outer)
		.colors(d3.scale.ordinal().domain(["won", "lost", "tied"])
                                .range(["#a1eda1","#fc9898", "#afedf0"]))
		.colorAccessor(function(d) {
			if (d.key == "won") return "won";
			else if (d.key == "lost") return "lost";
			return "tied";
		});
//    .colors(default_colors);
	
	result_year = ndx.dimension(function(d){return d.Year});
	result_year_group = result_year.group().reduce(resultByYear.add, resultByYear.remove, resultByYear.init);
	
	
	result_year_chart = dc.barChart('#result_year')
		.group(result_year_group, "won")
		.stack(result_year_group, "lost", function(d) { return d.value["lost"] })
		.stack(result_year_group, "tied", function(d) { return d.value["tied"] })
		.dimension(result_year)
		.height(medium_chart_height/2)
		.width(small_width)
		.transitionDuration(200)
		.label(function(d) { console.log(d); return d; })
		.title(function(d) { 				d3.select(".area").selectAll("circle.dot").attr("r", 10);
				return d.key+": "+d3.format(',')(d.value[this.layer])+" ("+this.layer+")";
		})
		.valueAccessor(function(d){return d.value["won"]})
		.legend(dc.legend().x(800).y(10).itemHeight(13).gap(5))
		.x(d3.scale.linear().domain([1996,2016]))
		.renderLabel(true)
//		.colors(default_colors)
		.colors(d3.scale.ordinal()
			.domain(["won", "lost", "tied"])                    
			.range(["#a1eda1","#fc9898", "#afedf0"]))
    .elasticX(false)
    .elasticY(true)
		.brushOn(false);
	
	result_year_chart.xAxis().ticks(5).tickFormat(d3.format("g"));
	grey_undefined(result_year_chart);
	
	dc.renderAll();
}