$(document).ready(function () {
    setInterval(function () {

        var seconds = new Date().getSeconds() * 6;
        var srotate = "rotate(" + seconds + "deg)";
        var sdegree = seconds * 6;

        $("#sec").css({"transform": srotate 
        });
    }, 1000);
});

$(document).ready(function () {
    setInterval(function () {

        var mins = new Date().getMinutes() * 6;
        var mrotate = "rotate(" + mins + "deg)";
        var mdegree = mins * 6;

        $("#min").css({"transform": mrotate 
        });
    }, 1000);
});

$(document).ready(function () {
    setInterval(function () {

        var hours = new Date().getHours() * 30;
        var hrotate = "rotate(" + hours + "deg)";
        var hdegree = hours * 30;

        $("#hour").css({"transform": hrotate 
        });
    }, 1000);
});