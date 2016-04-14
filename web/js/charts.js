var small_chart_height = 300;
var valueAccessor =function(d){return d.Value < 1 ? 0 : d.Value};
var our_colors = ["#9df5e7","#b2bfdb","#a1eda1","#fc9898", "#afedf0","#afede1", "#fc6565"];
var default_colors = d3.scale.ordinal().range(our_colors);

grey_undefined = function(chart) {
  chart.selectAll("text.row").classed("grey",function(d) {return d.value.not_real || d.value.count == 0})
}

//---------------------CLEANUP functions-------------------------

function cleanup(d) {

  d.year = +d.Period.substr(0, 4);
  d.Value = +d.Value;

  return d;
}

//Queueing defer ensures that all our datasets get loaded before any work is done

queue()
    .defer(d3.csv, "data/import-data.csv")
    // .defer(d3.csv, "import-data.csv") //change name here to load more than 1 file
    .await(showCharts);

function showCharts(err, data) {
  _data = [];

  for(i in data){
    data[i]["Country of Origin"] != "Total" ? _data.push(cleanup(data[i])) : "";
  }


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

importByYear = configureableReduce("Country of Origin", "Value", {
    "Australia" :0,
    "China, People's Republic of":0,
    "United States of America" :0,
    "Japan" :0,
    "Germany" :0
  }
)



  //---------------------------------FILTERS-----------------------------------------
  ndx = crossfilter(_data);

  //---------------------------ORDINARY CHARTS --------------------------------------
  //Chart by Country Import Total
  country = ndx.dimension(function(d){return d["Country of Origin"]});
  country_group = country.group().reduceSum(function(d){return d['Value']});

  country_chart = dc.rowChart('#country')
    .dimension(country)
    .group(country_group)
    .colors(default_colors)
    .transitionDuration(200)
    .height(small_chart_height)
    .cap(5)
    .ordering(function(d){ return -d.value })
    .elasticX('true');

  country_chart.xAxis().ticks(4).tickFormat(d3.format("s"))
  grey_undefined(country_chart);
  //Commodity Chart

  commodity = ndx.dimension(function(d){return d['Commodity'].length > 80 ? d['Commodity'].substr(0,80)+"..." : d['Commodity']});
  commodity_group = commodity.group().reduceSum(function(d){return d['Value']});

  commodity_chart = dc.rowChart('#commodity')
    .dimension(commodity)
    .group(commodity_group)
    .colors(default_colors)
    .transitionDuration(200)
    .height(small_chart_height)
    .cap(10)
    .ordering(function(d){ return -d.value })
    .elasticX('true');

  commodity_chart.xAxis().ticks(4).tickFormat(d3.format("s"))

  year = ndx.dimension(function(d){return d.year});
  commodity_country_group = year.group().reduce(importByYear.add, importByYear.remove, importByYear.init);

  commodity_country_chart = dc.lineChart('#commodity-country')
    .dimension(year)
    .group(commodity_country_group, "Australia")
    .stack(commodity_country_group,"China, People's Republic of" ,function(d){return d.value["China, People's Republic of"]})
    .stack(commodity_country_group,"United States of America" ,function(d){return d.value["United States of America"]})
    .stack(commodity_country_group,"Japan" ,function(d){return d.value["Japan"]})
    .stack(commodity_country_group,"Germany" ,function(d){return d.value["Germany"]})
		.valueAccessor(function(d){return d.value["Australia"]})
    .height(small_chart_height+50)
    .width(800)
    .transitionDuration(200)
    .x(d3.scale.linear().domain([2000,2015]))
    .colors(default_colors)
    .elasticX(false)
    .elasticY(false)
    .renderArea(true)
    .label(function(d) { return d.value; })
    .title(function(d) {
			if(d.value[this.layer] > 0){
				d3.select(".area").selectAll("circle.dot").attr("r", 10);
				return d.key+": "+d3.format(',')(d.value[this.layer])+" ("+this.layer+")";
			}
			else{
				
			}
		})
    .legend(dc.legend().x(800).y(10).itemHeight(13).gap(5))
    .brushOn(false)
		.renderDataPoints({fillOpacity: 1, strokeOpacity: 1, 
											 radius: 5, stroke: 'blue', strokeWidth:8})
		.on("pretransition", stackChartTransition = function(chart) {
			chart.selectAll("circle.dot").each(function(d, i){
				if(d.y == 0){
					d3.select(this)
						.attr("visibility", "hidden");
				}
				else{
					d3.select(this)
						.attr("visibility", "visible");
				}
			});
			chart.selectAll(".line").each(function(d, i){
				console.log(d.values[i].y);
				if(d.values[i].y == 0){
					d3.select(this)
						.attr("visibility", "hidden");
				}
				else{
					d3.select(this)
						.attr("visibility", "visible");
				}
			});
		});
    
    
    commodity_country_chart2 = dc.lineChart('#commodity-country2')
    .dimension(year)
    .group(commodity_country_group, "Australia")
    .stack(commodity_country_group,"China, People's Republic of" ,function(d){return d.value["China, People's Republic of"]})
    .stack(commodity_country_group,"United States of America" ,function(d){return d.value["United States of America"]})
    .stack(commodity_country_group,"Japan" ,function(d){return d.value["Japan"]})
    .stack(commodity_country_group,"Germany" ,function(d){return d.value["Germany"]})
		.valueAccessor(function(d){return d.value["Australia"]})
    .height(small_chart_height+50)
    .width(800)
    .transitionDuration(200)
    .x(d3.scale.linear().domain([2000,2015]))
    .colors(default_colors)
    .elasticX(false)
    .elasticY(true)
    .renderArea(true)
    .label(function(d) { return d.value; })
    .brushOn(true);

  commodity_country_chart.yAxis().ticks(5).tickFormat(d3.format("s"))
  commodity_country_chart.xAxis().ticks(15).tickFormat(d3.format("B"))
  
  commodity_country_chart2.yAxis().ticks(5).tickFormat(d3.format("s"))
  commodity_country_chart2.xAxis().ticks(15).tickFormat(d3.format("B"))


  dc.renderAll();
}
