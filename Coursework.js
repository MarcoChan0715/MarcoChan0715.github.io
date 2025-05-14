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



let timer;
let isRunning = false;
let seconds = 0;
let minutes = 0;
let hours = 0;

function Start() {
  if (!isRunning) {
    timer = setInterval(updateDisplay, 1000);
    isRunning = true;
  }
}

function Stop() {
  clearInterval(timer);
  isRunning = false;
}

function Reset() {
  clearInterval(timer);
  isRunning = false;
  seconds = -1;
  minutes = 0;
  hours = 0;
  updateDisplay();
}

function updateDisplay() {
  seconds++;
  if (seconds === 60) {
    seconds = 0;
    minutes++;
    if (minutes === 60) {
      minutes = 0;
      hours++;
    }
  }

  const display = document.getElementById("displayTime");
  display.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function pad(value) {
  return value < 10 ? `0${value}` : value;
}