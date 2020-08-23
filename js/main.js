
// debit card map area click to change image
var mapImg = document.getElementById("img_map");
function dhaka(){
    mapImg.src='../img/card/map3-dhaka.png';
}
function chattogram(){
    mapImg.src='../img/card/map5-chittagram.png';
}
function sylhet(){
    mapImg.src='../img/card/map4-sylhet.png';
}
function rongpur(){
    mapImg.src='../img/card/map2-rangpur.png';
}
function khulna(){
    mapImg.src='../img/card/map6-khulna.png';
}
function rajshahi(){
    mapImg.src='../img/card/map7-rajshahi.png';
}
function all_map(){
    mapImg.src='../img/card/map1-bd.png';
}
// debit card card accordion plus minus change

$(document).ready(function(){
    $(".Card_freture").click(function(){
        if($(this).find("i.plus_Freature").hasClass("fa-minus")){
            $(this).find("i.plus_Freature").removeClass("fa-minus");
            $(this).find("i.plus_Freature").addClass("fa-plus");
        }
        else if($(this).find("i.plus_Freature").hasClass("fa-plus")){
            $(this).find("i.plus_Freature").removeClass("fa-plus");
            $(this).find("i.plus_Freature").addClass("fa-minus");
        } 
        $(this).parents(".card").siblings().find("i.plus_Freature").removeClass("fa-minus");
        $(this).parents(".card").siblings().find("i.plus_Freature").addClass("fa-plus");
        
    })
});