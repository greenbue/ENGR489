function create_selectize(items) {
  $('#captain-search').selectize({
      delimiter: ',',
      persist: false,
      maxItems: 1,
      options: items,
      labelField: "item",
      valueField: "item",
      searchField: "item",
      placeholder: "Pick a Captain for Team A"
  });

  $('#captain-search').on('change', function () {
    var filter = $('#captain-search').val();
    if (filter == "") {
      captain.filterAll();
    }
    else {
      captain.filterAll();
      captain.filter(filter);
      team_chart.filterAll();
      if ($('#captain-search').val().indexOf('NZ') > -1) {
        team_chart.filter("New Zealand");
      }
      else {
        team_chart.filter("New Zealand");
      }
    }
    change_title();
    change_legends();
    dc.redrawAll();
  });
}

function create_selectize2(items){
  $('#captain-search2').selectize({
      delimiter: ',',
      persist: false,
      maxItems: 1,
      options: items,
      labelField: "item",
      valueField: "item",
      searchField: "item",
      placeholder: "Pick a Captain for Team B"
  });

  $('#captain-search2').on('change', function () {
    var filter = $('#captain-search2').val();
    if (filter == "") {
      captain2.filterAll();
    }
    else {
      captain2.filterAll();
      captain2.filter(filter);
      team_chart2.filterAll();
      if ($('#captain-search2').val().indexOf('NZ') > -1) {
        team_chart2.filter("New Zealand");
      }
      else {
        team_chart2.filter("New Zealand");
      }
    }
    change_title();
    change_legends();
    dc.redrawAll();
  });
}

function reset_selectize(id){
  var $select = $(id).selectize();
  var control = $select[0].selectize;
  control.clear();
}
