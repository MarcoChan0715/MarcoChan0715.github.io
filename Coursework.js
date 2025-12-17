// --- Global Dark Mode System ---
document.addEventListener("DOMContentLoaded", function () {
    // 1. Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // 2. Inject Toggle Button into Navbar
    const navbarList = document.querySelector('.navbar ul');
    if (navbarList) {
        const li = document.createElement('li');
        const btn = document.createElement('a');
        btn.href = "#";
        btn.id = "global-theme-toggle";
        // Set icon based on current mode
        btn.textContent = document.body.classList.contains('dark-mode') ? "☀️" : "🌙";
        btn.style.cursor = "pointer";
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.toggle('dark-mode');
            
            // Update Icon
            if (document.body.classList.contains('dark-mode')) {
                btn.textContent = "☀️";
                localStorage.setItem('theme', 'dark');
            } else {
                btn.textContent = "🌙";
                localStorage.setItem('theme', 'light');
            }
        });

        li.appendChild(btn);
        navbarList.appendChild(li);
    }
});

// --- Existing Clock Functionality ---
// (Only runs if elements exist, preventing errors on other pages)
if (document.getElementById("sec")) {
    setInterval(() => {
        const now = new Date();
        const seconds = now.getSeconds();
        const mins = now.getMinutes();
        const hours = now.getHours();
        
        const sdegree = seconds * 6;
        const mdegree = mins * 6 + (seconds / 10);
        const hdegree = hours * 30 + (mins / 2);

        $("#sec").css({ "transform": "rotate(" + sdegree + "deg)" });
        $("#min").css({ "transform": "rotate(" + mdegree + "deg)" });
        $("#hour").css({ "transform": "rotate(" + hdegree + "deg)" });
    }, 1000);
}

// --- Existing Stopwatch Functionality ---
let timer = null;
let seconds = 0, minutes = 0, hours = 0;

function Start() {
    if (timer !== null) return;
    timer = setInterval(updateDisplay, 1000);
}

function Stop() {
    clearInterval(timer);
    timer = null;
}

function Reset() {
    Stop();
    seconds = 0; minutes = 0; hours = 0;
    const display = document.getElementById("displayTime");
    if(display) display.textContent = "00:00:00";
}

function updateDisplay() {
    seconds++;
    if (seconds === 60) { seconds = 0; minutes++; }
    if (minutes === 60) { minutes = 0; hours++; }
    
    const display = document.getElementById("displayTime");
    if(display) display.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function pad(val) { return val < 10 ? `0${val}` : val; }
