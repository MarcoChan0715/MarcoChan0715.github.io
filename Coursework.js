// --- Analog Clock Functionality ---
$(document).ready(function () {
    function updateClock() {
        const now = new Date();
        
        const seconds = now.getSeconds();
        const sdegree = seconds * 6;
        
        const mins = now.getMinutes();
        const mdegree = mins * 6 + (seconds / 10); // Smooth movement
        
        const hours = now.getHours();
        const hdegree = hours * 30 + (mins / 2); // Smooth movement

        $("#sec").css({ "transform": "rotate(" + sdegree + "deg)" });
        $("#min").css({ "transform": "rotate(" + mdegree + "deg)" });
        $("#hour").css({ "transform": "rotate(" + hdegree + "deg)" });
    }

    setInterval(updateClock, 1000);
    updateClock(); // Run immediately on load
});

// --- Stopwatch Functionality ---
let timer = null;
let seconds = 0, minutes = 0, hours = 0;

function Start() {
    if (timer !== null) return; // Prevent multiple clicks
    timer = setInterval(updateDisplay, 1000);
}

function Stop() {
    clearInterval(timer);
    timer = null;
}

function Reset() {
    Stop();
    seconds = 0;
    minutes = 0;
    hours = 0;
    const display = document.getElementById("displayTime");
    if(display) display.textContent = "00:00:00";
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
    if(display) display.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function pad(value) {
    return value < 10 ? `0${value}` : value;
}
