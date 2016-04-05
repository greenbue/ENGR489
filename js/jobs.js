var small_chart_height = 300;
var valueAccessor =function(d){return d.Value < 1 ? 0 : d.Value};
var our_colors = ["#9df5e7","#b2bfdb","#a1eda1","#fc9898", "#afedf0","#afede1", "#fc6565"];
var default_colors = d3.scale.ordinal().range(our_colors);
var quarters = {MAR:1, JUN:2, SEP:3, DEC:4}

var donut_inner = 40
var donut_outer = 80
var donut_height = 180

grey_undefined = function(chart) {
  chart.selectAll("text.row").classed("grey",function(d) {return d.value.not_real || d.value.count == 0})
}

//---------------------CLEANUP functions-------------------------

function cleanup(d) {

  d.year = +d.Quarter.substr(4,2)+2000
  d.qtr = d.Quarter.substr(0,3)
  d.genderStatus = d.Sex + '@'+ d["Employment status"]
  d.Value = +d.Value
  return d;
}

//Queueing defer ensures that all our datasets get loaded before any work is done

queue()
    .defer(d3.csv, "data/jobs2.csv")
    // .defer(d3.csv, "import-data.csv") //change name here to load more than 1 file
    .await(showCharts);


function showCharts(err, data) {
  _data = [];

  for (i in data) {
    data[i] = cleanup(data[i]);
  }
  _data = data;

  //---------------------------------FILTERS-----------------------------------------
  ndx = crossfilter(_data);
  //---------------------------ORDINARY CHARTS --------------------------------------

  genderStatus = ndx.dimension(function(d) {return d.genderStatus});
  gender_group = genderStatus.group().reduceSum(function(d){return d.Value})

  gender_status_chart = dc.pyramidChart('#genderStatus')
    .dimension(genderStatus)
    .group(gender_group)
    .colors(d3.scale.ordinal().range([our_colors[1],our_colors[3]]))
    .colorAccessor(function(d){return d.key[0]})
    .leftColumn(function(d){return d.key[0] == 'M'}) // return true if entry is to go in the left column. Defaults to i%2 == 0, i.e. every second one goes to the right.
    .rowAccessor(function(d){return d.key.split('@')[1]}) // return the row the group needs to go into.
    .height(small_chart_height)
    //.title(function(d,i){return i})
    .label(function(d){return d.key.split('@')[1]})
    .elasticX(true)
    //.labelOffsetX(20)
    .twoLabels(false)// defaults to true. if false, .label defaults to .rowAccessor
    .columnLabels(['Male','Female'])
    .columnLabelPosition([0,250]) //[in,down], in pix. defaults to [5,10]
    .transitionDuration(200)

  gender_status_chart.xAxis().ticks(7).tickFormat(function(x) {return d3.format('s')(Math.abs(x))})

  gender = ndx.dimension(function(d){return d.Sex});
  gender_group = gender.group().reduceSum(function(d){return d.Value});

  gender_chart = dc.pieChart('#gender')
    .dimension(gender)
    .group(gender_group)
    .transitionDuration(200)
    .height(small_chart_height)
   //.innerRadius(donut_inner)
    .radius(donut_outer)
    .colors(default_colors);

  job = ndx.dimension(function(d){return d.Industry});
  job_group = job.group().reduceSum(function(d){return d.Value});

  job_chart = dc.rowChart('#job')
    .dimension(job)
    .group(job_group)
    .colors(default_colors)
    .transitionDuration(200)
    .height(small_chart_height)
    .ordering(function(d){ return -d.value })
    .elasticX('true');

  job_chart.xAxis().ticks(4).tickFormat(d3.format("s"))
  grey_undefined(job_chart);

  employment = ndx.dimension(function(d){return d["Employment status"]});
  employment_group = employment.group().reduceSum(function(d){return d.Value});

  employment_chart = dc.rowChart('#employment')
    .dimension(employment)
    .group(employment_group)
    .colors(default_colors)
    .transitionDuration(200)
    .height(small_chart_height)
    .ordering(function(d){ return -d.value })
    .elasticX('true');

  employment_chart.xAxis().ticks(4).tickFormat(d3.format("s"))
  grey_undefined(employment_chart);



  dc.renderAll()
}
