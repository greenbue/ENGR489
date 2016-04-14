$(document).ready(function(){
    $(".navbar-nav a").click(function(){
        $(this).tab('show');
    });
    $(function() {
      if ( document.location.href.indexOf('#home') > -1 ) {
        $('#home_tab').click();
      }
      else if ( document.location.href.indexOf('#about') > -1 ) {
        $('#about_tab').click();
      }
      else if ( document.location.href.indexOf('#services') > -1 ) {
        $('#services_tab').click();
      }
      else if ( document.location.href.indexOf('#testimonials') > -1 ) {
        $('#testimonials_tab').click();
      }
    });
    $('.navbar-nav a').on('shown.bs.tab', function(event){
        var x = $(event.target).text();         // active tab
        var y = $(event.relatedTarget).text();  // previous tab
        $(".act span").text(x);
        $(".prev span").text(y);
    });
});
