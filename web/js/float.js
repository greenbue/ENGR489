$(function() {
		$( ".draggable" ).draggable({
		});
});

$(document).ready(function(){
    titleloc = parseInt($('.sidebar-title').css("top").substring(0,$('.sidebar-title').css("top").indexOf("px")))
		menuloc = parseInt($('.sidebar').css("top").substring(0,$('.sidebar').css("top").indexOf("px")))
    $(window).scroll(function () { 
			var title_offset = titleloc+$(document).scrollTop()+"px";
			$('.sidebar-title').animate({top:title_offset},{duration:300,queue:false});
			var menu_offset = menuloc+$(document).scrollTop()+"px";
			$('.sidebar').animate({top:menu_offset},{duration:300,queue:false});
    });
});