$(document).ready(function(){
    $(".navbar-nav a").click(function(){
        $(this).tab('show');
    });
    $(function() {
      if ( document.location.href.indexOf('#summary') > -1 ) {
        $('#summary_tab').click();
      }
      else if ( document.location.href.indexOf('#game_per') > -1 ) {
        $('#game_per_tab').click();
      }
    });
    $('.navbar-nav a').on('shown.bs.tab', function(event){
        var x = $(event.target).text();         // active tab
        var y = $(event.relatedTarget).text();  // previous tab
        $(".act span").text(x);
        $(".prev span").text(y);
    });
});
