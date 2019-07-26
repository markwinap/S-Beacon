console.log('TEST')

var title_1 = document.getElementById("title_1");
var title_2 = document.getElementById("title_2");
var html = document.getElementById("html");

var input_1 = document.getElementById("input_1");
var input_2 = document.getElementById("input_2");
var button_1 = document.getElementById("button_1");
var button_3 = document.getElementById("button_3");

//element.addEventListener(event, function, useCapture);
//events: mouseover, click, dblclick, mouseout,
title_1.addEventListener("click", function(){
    title_1.innerText = input_1.value;
});
button_1.addEventListener("click", function(){
    input_2.value = input_1.value;
    console.log(input_1.value);
});
button_3.addEventListener("click", function(){
    clearInterval(myInterval);
});
function myFunction2(){
    input_2.value = input_1.value;
    console.log(input_1.value);  
}

//setInterval(function, milliseconds, param1, param2, ...)
var myInterval = setInterval(function(){
    title_1.style.color = `rgb(${getRandom()}, ${getRandom()}, ${getRandom()})`;
    input_2.style.backgroundColor = "rgb(" + getRandom() + "," + getRandom() + "," + getRandom() +")";
    input_1.style.backgroundColor = getRandColor();
    funColor(title_2);
    funColor(getElement("title_3"));
    var d = new Date();
     title_2.innerText = input_2.value + " Segundos en el reloj " + d.getSeconds();
    }, 1000);
function getRandom(){//1, 255
    return Math.floor((Math.random() * 255) + 1);
}
function getRandColor(){
    return  "rgb(" + getRandom() + "," + getRandom() + "," + getRandom() +")";
}
function funColor(element){
    element.style.backgroundColor = getRandColor();
}
function getElement(name){
    return document.getElementById(name);
}
//var myfunction = function(){ alert("Hello World!");}
//function myfunction(){ alert("Hello World!");}

//button_1.addEventListener("click", myfunction );

