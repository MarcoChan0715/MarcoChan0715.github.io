// 1. Global Setup and Activity Page Logging
const logList = document.getElementById('log-list');
let isEditMode = false;

function addLog(message) {
    if (!logList) return;

    const initialLog = document.getElementById('initial-log');
    if (initialLog) initialLog.remove();

    const newLogItem = document.createElement('li');
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    newLogItem.innerHTML = `<strong>[${timeString}]</strong> ${message}`;
    logList.prepend(newLogItem);

    const items = logList.querySelectorAll('li');
    if (items.length > 30) items[items.length - 1].remove();
}


// 2. Shared Slider Helper
function updateSliderFill(slider) {
    if (!slider) return;

    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const val = parseFloat(slider.value) || 0;
    const percentage = ((val - min) / (max - min)) * 100;

    slider.style.background = `linear-gradient(to right, #1a73e8 ${percentage}%, #dadce0 ${percentage}%)`;
}

function syncInputs(sliderId, numId) {
    const slider = document.getElementById(sliderId);
    const num = document.getElementById(numId);
    if (!slider || !num) return;

    const min = parseInt(slider.min, 10);
    const max = parseInt(slider.max, 10);

    const commitNumberInput = () => {
        const raw = num.value.trim();
        if (raw === '') {
            num.value = slider.value;
            return;
        }

        let val = parseInt(raw, 10);
        if (Number.isNaN(val)) {
            num.value = slider.value;
            return;
        }

        val = Math.min(max, Math.max(min, val));
        num.value = String(val);
        slider.value = String(val);
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
    };

    slider.addEventListener('input', (e) => {
        if (document.activeElement !== num) num.value = e.target.value;
        updateSliderFill(e.target);
    });

    num.addEventListener('input', (e) => {
        const raw = e.target.value.trim();
        if (raw === '') return;

        if (!/^\d+$/.test(raw)) {
            e.target.value = raw.replace(/[^\d]/g, '');
            return;
        }

        let val = parseInt(raw, 10);
        if (Number.isNaN(val)) return;

        val = Math.min(max, Math.max(min, val));
        slider.value = String(val);
        slider.dispatchEvent(new Event('input', { bubbles: true }));
    });

    num.addEventListener('change', commitNumberInput);
    num.addEventListener('blur', commitNumberInput);
    num.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commitNumberInput();
            num.blur();
        }
    });
}


// 3. Shared Energy Calculation Helper
function updateEnergyUsage() {
    let totalUsage = 0.30;

    const isDeviceActive = (cardId, stateVar) => {
        const card = document.getElementById(cardId);
        if (!card || card.getAttribute('data-removed') === 'true' || card.getAttribute('data-offline') === 'true') return false;
        return stateVar;
    };

    if (isDeviceActive('light-card', lightsOn)) {
        const bright = parseInt(document.getElementById('brightness-slider').value) || 0;
        totalUsage += 0.05 * (bright / 100);
    }
    if (isDeviceActive('heating-card', heatingOn)) totalUsage += 2.00;
    if (isDeviceActive('desk-lamp-card', deskLampOn)) {
        const bright = parseInt(document.getElementById('desk-lamp-slider').value) || 0;
        totalUsage += 0.01 * (bright / 100);
    }
    if (isDeviceActive('tv-card', tvOn)) totalUsage += 0.15;
    if (isDeviceActive('fan-card', fanOn)) {
        const speed = parseInt(document.getElementById('fan-speed-slider').value) || 1;
        totalUsage += 0.04 * (speed / 10);
    }
    if (isDeviceActive('speaker-card', speakerOn)) {
        const vol = parseInt(document.getElementById('speaker-vol-slider').value) || 0;
        totalUsage += 0.02 * (vol / 100);
    }

    const currentUsageVal = document.getElementById('current-usage-val');
    if (currentUsageVal) currentUsageVal.textContent = totalUsage.toFixed(2);

    const statusEl = document.getElementById('current-usage-status');
    if (!statusEl) return;

    if (totalUsage > 2.3) {
        statusEl.textContent = 'High usage';
        statusEl.style.color = '#d93025';
    } else if (totalUsage > 1.0) {
        statusEl.textContent = 'Moderate usage';
        statusEl.style.color = '#f29900';
    } else {
        statusEl.textContent = 'Normal levels';
        statusEl.style.color = '#34a853';
    }
}

// 4. Sidebar Navigation and Page Switching
const navHome = document.getElementById('nav-home');
const navActivity = document.getElementById('nav-activity');
const navEnergy = document.getElementById('nav-energy');
const navAutomations = document.getElementById('nav-automations');

const homeView = document.getElementById('home-view');
const activityView = document.getElementById('activity-view');
const energyView = document.getElementById('energy-view');
const automationsView = document.getElementById('automations-view');

const topAddDeviceBtn = document.getElementById('add-device-btn');
const topAddAutoBtn = document.getElementById('add-automation-btn');
const editLayoutBtn = document.getElementById('edit-layout-btn');

function switchView(activeNav, viewToShow) {
    [navHome, navActivity, navEnergy, navAutomations].forEach(nav => nav?.classList.remove('active'));
    [homeView, activityView, energyView, automationsView].forEach(view => {
        if (view) view.style.display = 'none';
    });

    activeNav?.classList.add('active');
    if (viewToShow) viewToShow.style.display = 'block';

    if (topAddDeviceBtn) topAddDeviceBtn.style.display = (viewToShow === homeView) ? 'flex' : 'none';
    if (editLayoutBtn) editLayoutBtn.style.display = (viewToShow === homeView) ? 'flex' : 'none';
    if (topAddAutoBtn) topAddAutoBtn.style.display = (viewToShow === automationsView) ? 'flex' : 'none';

    if (viewToShow !== homeView && isEditMode && editLayoutBtn) editLayoutBtn.click();
}

navHome?.addEventListener('click', () => switchView(navHome, homeView));
navActivity?.addEventListener('click', () => switchView(navActivity, activityView));
navEnergy?.addEventListener('click', () => switchView(navEnergy, energyView));
navAutomations?.addEventListener('click', () => switchView(navAutomations, automationsView));


// 5. Header Button: Dark Mode Toggle
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeIcon = document.getElementById('theme-icon');

themeToggleBtn?.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');

    if (themeIcon) themeIcon.textContent = isDarkMode ? 'light_mode' : 'dark_mode';
    addLog(`Theme changed to ${isDarkMode ? 'Dark Mode' : 'Light Mode'}.`);
});


// 6. Quick Actions / Macros
document.getElementById('macro-lights-on')?.addEventListener('click', (e) => {
    if (isEditMode) { e.preventDefault(); return; }
    if (!lightsOn && document.getElementById('light-card')?.getAttribute('data-offline') === 'false') document.getElementById('toggle-lights-btn')?.click();
    if (!deskLampOn && document.getElementById('desk-lamp-card')?.getAttribute('data-offline') === 'false') document.getElementById('toggle-desk-lamp-btn')?.click();
    addLog('Macro executed: Lights On.');
});

document.getElementById('macro-lights-off')?.addEventListener('click', (e) => {
    if (isEditMode) { e.preventDefault(); return; }
    if (lightsOn && document.getElementById('light-card')?.getAttribute('data-offline') === 'false') document.getElementById('toggle-lights-btn')?.click();
    if (deskLampOn && document.getElementById('desk-lamp-card')?.getAttribute('data-offline') === 'false') document.getElementById('toggle-desk-lamp-btn')?.click();
    addLog('Macro executed: Lights Off.');
});

document.getElementById('macro-all-on')?.addEventListener('click', (e) => {
    if (isEditMode) { e.preventDefault(); return; }
    const checkOn = (isOn, btnId, cardId) => {
        if (!isOn && document.getElementById(cardId)
            ?.getAttribute('data-offline') === 'false') {
            document.getElementById(btnId)?.click();
        }
    };
    checkOn(lightsOn, 'toggle-lights-btn', 'light-card');
    checkOn(heatingOn, 'toggle-heating-btn', 'heating-card');
    checkOn(deskLampOn, 'toggle-desk-lamp-btn', 'desk-lamp-card');
    checkOn(tvOn, 'toggle-tv-btn', 'tv-card');
    checkOn(fanOn, 'toggle-fan-btn', 'fan-card');
    checkOn(speakerOn, 'toggle-speaker-btn', 'speaker-card');
    addLog('Macro: All devices turned ON.');
});

document.getElementById('macro-all-off')?.addEventListener('click', (e) => {
    if (isEditMode) { e.preventDefault(); return; }
    const checkOff = (isOn, btnId, cardId) => {
        if (isOn && document.getElementById(cardId)
            ?.getAttribute('data-offline') === 'false') {
            document.getElementById(btnId)?.click();
        }
    };
    checkOff(lightsOn, 'toggle-lights-btn', 'light-card');
    checkOff(heatingOn, 'toggle-heating-btn', 'heating-card');
    checkOff(deskLampOn, 'toggle-desk-lamp-btn', 'desk-lamp-card');
    checkOff(tvOn, 'toggle-tv-btn', 'tv-card');
    checkOff(fanOn, 'toggle-fan-btn', 'fan-card');
    checkOff(speakerOn, 'toggle-speaker-btn', 'speaker-card');
    addLog('Macro: All devices turned OFF.');
});

document.getElementById('macro-eco')?.addEventListener('click', (e) => {
    if (isEditMode) { e.preventDefault(); return; }

    if (document.getElementById('heating-card')?.getAttribute('data-offline') === 'false') {
        if (!heatingOn) document.getElementById('toggle-heating-btn')?.click();
        if (!ecoModeOn) document.getElementById('eco-mode-btn')?.click();
        addLog('Macro executed: Eco Heating.');
    }
});


// 7. Home Page: Filter Pills, Favourites, Remove and Offline Logic
const pills = document.querySelectorAll('.pill');

function refreshGrid() {
    const activePill = document.querySelector('.pill.active');
    if (!activePill) return;

    const activeFilter = activePill.getAttribute('data-filter');
    const deviceCards = document.querySelectorAll('#home-view .device-card');

    deviceCards.forEach(card => {
        if (card.getAttribute('data-removed') === 'true') {
            card.style.display = 'none';
            return;
        }

        if (activeFilter === 'all') card.style.display = 'block';
        else if (activeFilter === 'favourites') card.style.display = card.getAttribute('data-favorite') === 'true' ? 'block' : 'none';
        else card.style.display = card.getAttribute('data-category') === activeFilter ? 'block' : 'none';
    });
}

pills.forEach(pill => {
    pill.addEventListener('click', (e) => {
        if (isEditMode) { e.preventDefault(); return; }
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        refreshGrid();
    });
});

function updateOfflineDisplay(card, isOffline) {
    const deviceName = card.querySelector('h3')?.textContent || 'Device';
    const statusEl = card.querySelector('.status');
    const toggleBtn = card.querySelector('.pro-btn');
    const disconnectBtn = card.querySelector('.simulate-error-opt');

    if (isOffline) {
        card.setAttribute('data-offline', 'true');
        card.classList.add('offline');
        if (statusEl) {
            statusEl.textContent = 'OFFLINE';
            statusEl.style.background = 'rgba(217, 48, 37, 0.1)';
            statusEl.style.color = '#d93025';
        }
        if (toggleBtn) toggleBtn.textContent = 'Connection Lost';
        if (disconnectBtn) disconnectBtn.textContent = 'Reconnect Network';
        addLog(`Connection lost to "${deviceName}".`);
        updateEnergyUsage();
        return;
    }

    card.setAttribute('data-offline', 'false');
    card.classList.remove('offline');

    let wasOn = false;
    if (card.id === 'light-card') wasOn = lightsOn;
    if (card.id === 'heating-card') wasOn = heatingOn;
    if (card.id === 'desk-lamp-card') wasOn = deskLampOn;
    if (card.id === 'tv-card') wasOn = tvOn;
    if (card.id === 'fan-card') wasOn = fanOn;
    if (card.id === 'speaker-card') wasOn = speakerOn;

    if (statusEl) {
        statusEl.textContent = wasOn ? 'ON' : 'OFF';
        statusEl.style.color = wasOn ? '#e65100' : '#5f6368';
        statusEl.style.background = wasOn ? 'rgba(230, 81, 0, 0.1)' : 'transparent';
    }
    if (toggleBtn) toggleBtn.textContent = `Turn ${deviceName} ${wasOn ? 'OFF' : 'ON'}`;
    if (disconnectBtn) {
        disconnectBtn.textContent = 'Disconnect';
        disconnectBtn.style.pointerEvents = 'auto';
    }
    addLog(`"${deviceName}" reconnected successfully.`);
    updateEnergyUsage();
}

document.body.addEventListener('click', (e) => {
    if (e.target.closest('.fav-btn')) {
        const favBtn = e.target.closest('.fav-btn');
        const card = favBtn.closest('.device-card');
        if (!card) return;

        const deviceName = card.querySelector('h3')?.textContent || 'Device';
        const isFav = card.getAttribute('data-favorite') === 'true';
        const iconSpan = favBtn.querySelector('.fav-icon');

        if (isFav) {
            card.setAttribute('data-favorite', 'false');
            if (iconSpan) { iconSpan.textContent = 'favorite_border'; iconSpan.style.color = '#ccc'; }
            addLog(`"${deviceName}" removed from favourites.`);
        } else {
            card.setAttribute('data-favorite', 'true');
            if (iconSpan) { iconSpan.textContent = 'favorite'; iconSpan.style.color = '#1a73e8'; }
            addLog(`"${deviceName}" added to favourites.`);
        }
        refreshGrid();
    }

    if (e.target.closest('.remove-device-opt')) {
        const card = e.target.closest('.remove-device-opt').closest('.device-card');
        if (!card) return;
        const deviceName = card.querySelector('h3')?.textContent || 'Device';

        if (confirm(`Are you sure you want to remove ${deviceName} from your Smart Home?`)) {
            card.setAttribute('data-removed', 'true');
            card.setAttribute('data-favorite', 'false');
            const iconSpan = card.querySelector('.fav-icon');
            if (iconSpan) { iconSpan.textContent = 'favorite_border'; iconSpan.style.color = '#ccc'; }
            refreshGrid();
            addLog(`"${deviceName}" was removed from the dashboard.`);
            updateEnergyUsage();
        }
    }

    if (e.target.closest('.simulate-error-opt')) {
        const errorBtn = e.target.closest('.simulate-error-opt');
        const card = errorBtn.closest('.device-card');
        if (!card) return;

        const isOffline = card.getAttribute('data-offline') === 'true';
        if (!isOffline) {
            updateOfflineDisplay(card, true);
        } else {
            const statusEl = card.querySelector('.status');
            const toggleBtn = card.querySelector('.pro-btn');
            if (statusEl) { statusEl.textContent = 'Reconnecting...'; statusEl.style.color = '#f29900'; }
            if (toggleBtn) toggleBtn.textContent = 'Connecting...';
            errorBtn.textContent = 'Please wait...';
            errorBtn.style.pointerEvents = 'none';
            setTimeout(() => updateOfflineDisplay(card, false), 2000);
        }
    }
});

// 8. Device Card: Room Lights
let lightsOn = false;
const lightCard = document.getElementById('light-card');
const toggleLightsBtn = document.getElementById('toggle-lights-btn');
const lightStatus = document.getElementById('light-status');
const lightNameEl = document.getElementById('light-name');
const brightnessSlider = document.getElementById('brightness-slider');
const brightnessNum = document.getElementById('brightness-num');

toggleLightsBtn?.addEventListener('click', () => {
    lightsOn = !lightsOn;
    const currentName = lightNameEl?.textContent || 'Room Lights';

    if (lightsOn) {
        if (brightnessSlider && brightnessSlider.value === '0') {
            brightnessSlider.value = 100;
            if (brightnessNum) brightnessNum.value = 100;
            updateSliderFill(brightnessSlider);
        }
        lightStatus.textContent = 'ON';
        lightStatus.style.color = '#e65100';
        lightStatus.style.background = 'rgba(230, 81, 0, 0.1)';
        toggleLightsBtn.textContent = `Turn ${currentName} OFF`;
        lightCard?.classList.add('active-light');
        addLog(`"${currentName}" turned ON.`);
    } else {
        if (brightnessSlider) {
            brightnessSlider.value = 0;
            if (brightnessNum) brightnessNum.value = 0;
            updateSliderFill(brightnessSlider);
        }
        lightStatus.textContent = 'OFF';
        lightStatus.style.color = '#5f6368';
        lightStatus.style.background = 'transparent';
        toggleLightsBtn.textContent = `Turn ${currentName} ON`;
        lightCard?.classList.remove('active-light');
        addLog(`"${currentName}" turned OFF.`);
    }

    updateEnergyUsage();
});

brightnessSlider?.addEventListener('change', (e) => {
    if (e.target.value === '0' && lightsOn) toggleLightsBtn?.click();
    else if (e.target.value > '0' && !lightsOn) toggleLightsBtn?.click();
    else {
        addLog(`"${lightNameEl?.textContent || 'Room Lights'}" brightness set to ${e.target.value}%.`);
        updateEnergyUsage();
    }
});

document.getElementById('color-temp-slider')?.addEventListener('change', (e) => {
    addLog(`"${lightNameEl?.textContent || 'Room Lights'}" colour temperature set to ${e.target.value}K.`);
});


// 9. Device Card: Heating System
let heatingOn = false;
let ecoModeOn = false;
const heatingCard = document.getElementById('heating-card');
const toggleHeatingBtn = document.getElementById('toggle-heating-btn');
const tempStatus = document.getElementById('temp-status');
const tempSlider = document.getElementById('temp-slider');
const tempNum = document.getElementById('temp-num');
const ecoModeBtn = document.getElementById('eco-mode-btn');
const heatingNameEl = document.getElementById('heating-name');
let previousTemp = tempSlider ? tempSlider.value : 20;

toggleHeatingBtn?.addEventListener('click', () => {
    heatingOn = !heatingOn;
    const currentName = heatingNameEl?.textContent || 'Heating System';

    if (heatingOn) {
        toggleHeatingBtn.textContent = `Turn ${currentName} OFF`;
        heatingCard?.classList.add('active-heat');
        tempStatus.textContent = `${tempSlider?.value || 20}°C`;
        tempStatus.style.color = '#e65100';
        tempStatus.style.background = 'rgba(230, 81, 0, 0.1)';
        addLog(`"${currentName}" turned ON.`);
    } else {
        toggleHeatingBtn.textContent = `Turn ${currentName} ON`;
        heatingCard?.classList.remove('active-heat');
        tempStatus.textContent = 'OFF';
        tempStatus.style.color = '#5f6368';
        tempStatus.style.background = 'transparent';
        addLog(`"${currentName}" turned OFF.`);
    }

    updateEnergyUsage();
});

tempSlider?.addEventListener('input', (e) => {
    if (heatingOn && tempStatus) tempStatus.textContent = `${e.target.value}°C`;
});

tempSlider?.addEventListener('change', (e) => {
    if (!heatingOn) toggleHeatingBtn?.click();
    else {
        addLog(`"${heatingNameEl?.textContent || 'Heating System'}" target set to ${e.target.value}°C.`);
        updateEnergyUsage();
    }
});

ecoModeBtn?.addEventListener('click', () => {
    ecoModeOn = !ecoModeOn;

    if (ecoModeOn) {
        ecoModeBtn.textContent = 'Disable Eco';
        ecoModeBtn.style.background = '#ceead6';
        ecoModeBtn.style.color = '#137333';
        previousTemp = tempSlider?.value || 20;
        if (tempSlider) { tempSlider.value = 18; tempSlider.disabled = true; updateSliderFill(tempSlider); }
        if (tempNum) { tempNum.value = 18; tempNum.disabled = true; }
        if (heatingOn && tempStatus) tempStatus.textContent = '18°C';
        addLog(`Eco mode enabled for "${heatingNameEl?.textContent || 'Heating System'}".`);
    } else {
        ecoModeBtn.textContent = 'Engage Eco Mode';
        ecoModeBtn.style.background = '#f1f3f4';
        ecoModeBtn.style.color = '#3c4043';
        if (tempSlider) { tempSlider.disabled = false; tempSlider.value = previousTemp; updateSliderFill(tempSlider); }
        if (tempNum) { tempNum.value = previousTemp; tempNum.disabled = false; }
        if (heatingOn && tempStatus) tempStatus.textContent = `${previousTemp}°C`;
        addLog(`Eco mode disabled for "${heatingNameEl?.textContent || 'Heating System'}".`);
    }

    updateEnergyUsage();
});


// 10. Device Card: Desk Lamp
let deskLampOn = false;
const deskLampCard = document.getElementById('desk-lamp-card');
const toggleDeskLampBtn = document.getElementById('toggle-desk-lamp-btn');
const deskLampStatus = document.getElementById('desk-lamp-status');
const lampNameEl = document.getElementById('lamp-name');
const deskLampSlider = document.getElementById('desk-lamp-slider');
const deskLampNum = document.getElementById('desk-lamp-num');

toggleDeskLampBtn?.addEventListener('click', () => {
    deskLampOn = !deskLampOn;
    const currentName = lampNameEl?.textContent || 'Desk Lamp';

    if (deskLampOn) {
        if (deskLampSlider && deskLampSlider.value === '0') {
            deskLampSlider.value = 100;
            if (deskLampNum) deskLampNum.value = 100;
            updateSliderFill(deskLampSlider);
        }
        deskLampStatus.textContent = 'ON';
        deskLampStatus.style.color = '#e65100';
        deskLampStatus.style.background = 'rgba(230, 81, 0, 0.1)';
        toggleDeskLampBtn.textContent = `Turn ${currentName} OFF`;
        deskLampCard?.classList.add('active-light');
        addLog(`"${currentName}" turned ON.`);
    } else {
        if (deskLampSlider) {
            deskLampSlider.value = 0;
            if (deskLampNum) deskLampNum.value = 0;
            updateSliderFill(deskLampSlider);
        }
        deskLampStatus.textContent = 'OFF';
        deskLampStatus.style.color = '#5f6368';
        deskLampStatus.style.background = 'transparent';
        toggleDeskLampBtn.textContent = `Turn ${currentName} ON`;
        deskLampCard?.classList.remove('active-light');
        addLog(`"${currentName}" turned OFF.`);
    }

    updateEnergyUsage();
});

deskLampSlider?.addEventListener('change', (e) => {
    if (e.target.value === '0' && deskLampOn) toggleDeskLampBtn?.click();
    else if (e.target.value > '0' && !deskLampOn) toggleDeskLampBtn?.click();
    else {
        addLog(`"${lampNameEl?.textContent || 'Desk Lamp'}" brightness set to ${e.target.value}%.`);
        updateEnergyUsage();
    }
});

let lampTimerInterval;
let isLampTimerRunning = false;
const lampTimerBtn = document.getElementById('desk-lamp-timer-btn');
const lampTimerSelect = document.getElementById('desk-lamp-timer-select');
const lampTimerDisplay = document.getElementById('desk-lamp-timer-display');

lampTimerBtn?.addEventListener('click', () => {
    const currentName = lampNameEl?.textContent || 'Desk Lamp';

    if (isLampTimerRunning) {
        clearInterval(lampTimerInterval);
        isLampTimerRunning = false;
        lampTimerDisplay.style.display = 'none';
        lampTimerBtn.textContent = 'Start Timer';
        lampTimerBtn.style.color = '';
        addLog(`"${currentName}" sleep timer cancelled.`);
        return;
    }

    let totalSeconds = parseInt(lampTimerSelect.value) * 60;
    isLampTimerRunning = true;
    lampTimerDisplay.style.display = 'block';
    lampTimerBtn.textContent = 'Cancel Timer';
    lampTimerBtn.style.color = '#d93025';
    addLog(`"${currentName}" sleep timer set for ${lampTimerSelect.value} minutes.`);

    if (!deskLampOn) toggleDeskLampBtn?.click();

    lampTimerInterval = setInterval(() => {
        totalSeconds--;
        let h = Math.floor(totalSeconds / 3600);
        let m = Math.floor((totalSeconds % 3600) / 60);
        let s = totalSeconds % 60;
        let timeString = '';
        if (h > 0) timeString += `${h}h `;
        timeString += `${m}m ${s}s remaining`;
        lampTimerDisplay.textContent = timeString;

        if (totalSeconds <= 0) {
            clearInterval(lampTimerInterval);
            isLampTimerRunning = false;
            lampTimerDisplay.textContent = 'Timer Finished!';
            lampTimerBtn.textContent = 'Start Timer';
            lampTimerBtn.style.color = '';
            addLog(`"${currentName}" sleep timer finished.`);
            setTimeout(() => {
                lampTimerDisplay.style.display = 'none';
                if (deskLampOn) toggleDeskLampBtn?.click();
            }, 2000);
        }
    }, 1000);
});

// 11. Device Card: Smart TV
let tvOn = false;
const tvCard = document.getElementById('tv-card');
const toggleTvBtn = document.getElementById('toggle-tv-btn');
const tvStatus = document.getElementById('tv-status');
const tvVolSlider = document.getElementById('tv-vol-slider');
const tvVolNum = document.getElementById('tv-vol-num');
const tvNameEl = document.getElementById('tv-name');
const tvNowPlaying = document.getElementById('tv-now-playing');
const tvInputSelect = document.getElementById('tv-input');

const tvChannels = { 1: 'Sky News', 2: 'BBC One', 3: 'ITV', 4: 'Channel 4', 5: 'Netflix', 6: 'YouTube' };
let currentChannelNum = 6;
let isMuted = false;
let preMuteVol = 15;

function updateTvDisplay() {
    if (!tvNowPlaying) return;
    if (!tvOn) { tvNowPlaying.style.display = 'none'; return; }

    tvNowPlaying.style.display = 'block';
    tvNowPlaying.style.marginTop = '4px';
    tvNowPlaying.style.marginLeft = '0px';

    const input = tvInputSelect ? tvInputSelect.value : 'TV / Apps';
    if (input === 'TV / Apps' || input === 'Smart OS Stream') tvNowPlaying.textContent = `Playing: ${tvChannels[currentChannelNum]}`;
    else if (input === 'HDMI 1' || input === 'PORT_HDMI_1') tvNowPlaying.textContent = 'Playing: HDMI 1';
    else if (input === 'HDMI 2' || input === 'PORT_HDMI_2') tvNowPlaying.textContent = 'Playing: HDMI 2';
}

toggleTvBtn?.addEventListener('click', () => {
    tvOn = !tvOn;
    const currentName = tvNameEl?.textContent || 'Smart TV';

    if (tvOn) {
        tvStatus.textContent = 'ON';
        tvStatus.style.color = '#1a73e8';
        tvStatus.style.background = 'rgba(26, 115, 232, 0.1)';
        toggleTvBtn.textContent = `Turn ${currentName} OFF`;
        tvCard?.classList.add('active-media');
        addLog(`"${currentName}" turned ON.`);
    } else {
        tvStatus.textContent = 'OFF';
        tvStatus.style.color = '#5f6368';
        tvStatus.style.background = 'transparent';
        toggleTvBtn.textContent = `Turn ${currentName} ON`;
        tvCard?.classList.remove('active-media');
        addLog(`"${currentName}" turned OFF.`);
    }

    updateTvDisplay();
    updateEnergyUsage();
});

tvInputSelect?.addEventListener('change', () => {
    if (tvOn) {
        updateTvDisplay();
        addLog(`"${tvNameEl?.textContent || 'Smart TV'}" input changed to ${tvInputSelect.value.replace('PORT_', '').replaceAll('_', ' ')}.`);
    }
});

tvVolSlider?.addEventListener('change', (e) => {
    if (!tvOn && e.target.value > 0) toggleTvBtn?.click();
    else addLog(`"${tvNameEl?.textContent || 'Smart TV'}" volume set to ${e.target.value}.`);
    updateEnergyUsage();
});

document.getElementById('tv-ch-up')?.addEventListener('click', () => {
    if (!tvOn) return;
    const input = tvInputSelect ? tvInputSelect.value : 'TV / Apps';
    if (input === 'TV / Apps' || input === 'Smart OS Stream') {
        currentChannelNum++;
        if (currentChannelNum > 6) currentChannelNum = 1;
        updateTvDisplay();
        addLog(`"${tvNameEl?.textContent || 'Smart TV'}" channel changed to ${tvChannels[currentChannelNum]}.`);
    }
});

document.getElementById('tv-ch-down')?.addEventListener('click', () => {
    if (!tvOn) return;
    const input = tvInputSelect ? tvInputSelect.value : 'TV / Apps';
    if (input === 'TV / Apps' || input === 'Smart OS Stream') {
        currentChannelNum--;
        if (currentChannelNum < 1) currentChannelNum = 6;
        updateTvDisplay();
        addLog(`"${tvNameEl?.textContent || 'Smart TV'}" channel changed to ${tvChannels[currentChannelNum]}.`);
    }
});

document.getElementById('tv-vol-up')?.addEventListener('click', () => {
    if (!tvOn) return;
    let vol = parseInt(tvVolSlider.value);
    if (vol < 100) {
        tvVolSlider.value = vol + 5;
        if (tvVolNum) tvVolNum.value = tvVolSlider.value;
        updateSliderFill(tvVolSlider);
        addLog(`"${tvNameEl?.textContent || 'Smart TV'}" volume increased to ${tvVolSlider.value}.`);
        updateEnergyUsage();
    }
});

document.getElementById('tv-vol-down')?.addEventListener('click', () => {
    if (!tvOn) return;
    let vol = parseInt(tvVolSlider.value);
    if (vol > 0) {
        tvVolSlider.value = vol - 5;
        if (tvVolNum) tvVolNum.value = tvVolSlider.value;
        updateSliderFill(tvVolSlider);
        addLog(`"${tvNameEl?.textContent || 'Smart TV'}" volume decreased to ${tvVolSlider.value}.`);
        updateEnergyUsage();
    }
});

document.getElementById('tv-mute')?.addEventListener('click', () => {
    if (!tvOn) return;
    isMuted = !isMuted;

    if (isMuted) {
        preMuteVol = tvVolSlider.value;
        tvVolSlider.value = 0;
        if (tvVolNum) tvVolNum.value = 0;
        addLog(`"${tvNameEl?.textContent || 'Smart TV'}" muted.`);
    } else {
        tvVolSlider.value = preMuteVol;
        if (tvVolNum) tvVolNum.value = preMuteVol;
        addLog(`"${tvNameEl?.textContent || 'Smart TV'}" unmuted.`);
    }

    updateSliderFill(tvVolSlider);
    updateEnergyUsage();
});


// 12. Hidden Device Card: Dyson Pure Cool
let fanOn = false;
const fanCard = document.getElementById('fan-card');
const toggleFanBtn = document.getElementById('toggle-fan-btn');
const fanStatus = document.getElementById('fan-status');
const fanNameEl = document.getElementById('fan-name');
const fanSlider = document.getElementById('fan-speed-slider');
let fanOsc = false;

toggleFanBtn?.addEventListener('click', () => {
    fanOn = !fanOn;
    const currentName = fanNameEl?.textContent || 'Dyson Pure Cool';

    if (fanOn) {
        fanStatus.textContent = 'ON';
        fanStatus.style.color = '#e65100';
        fanStatus.style.background = 'rgba(230, 81, 0, 0.1)';
        toggleFanBtn.textContent = `Turn ${currentName} OFF`;
        fanCard?.classList.add('active-heat');
        addLog(`"${currentName}" turned ON.`);
    } else {
        fanStatus.textContent = 'OFF';
        fanStatus.style.color = '#5f6368';
        fanStatus.style.background = 'transparent';
        toggleFanBtn.textContent = `Turn ${currentName} ON`;
        fanCard?.classList.remove('active-heat');
        addLog(`"${currentName}" turned OFF.`);
    }

    updateEnergyUsage();
});

fanSlider?.addEventListener('change', (e) => {
    if (!fanOn) toggleFanBtn?.click();
    else addLog(`"${fanNameEl?.textContent || 'Dyson Pure Cool'}" fan speed set to ${e.target.value}.`);
    updateEnergyUsage();
});

document.getElementById('fan-osc-btn')?.addEventListener('click', (e) => {
    fanOsc = !fanOsc;
    if (fanOsc) {
        e.target.textContent = 'Disable';
        e.target.style.background = '#ceead6';
        addLog(`"${fanNameEl?.textContent || 'Dyson Pure Cool'}" oscillation enabled.`);
    } else {
        e.target.textContent = 'Enable';
        e.target.style.background = '#f1f3f4';
        addLog(`"${fanNameEl?.textContent || 'Dyson Pure Cool'}" oscillation disabled.`);
    }
});


// 13. Hidden Device Card: Sonos One
let speakerOn = false;
const speakerCard = document.getElementById('speaker-card');
const toggleSpeakerBtn = document.getElementById('toggle-speaker-btn');
const speakerStatus = document.getElementById('speaker-status');
const speakerNameEl = document.getElementById('speaker-name');
const speakerSlider = document.getElementById('speaker-vol-slider');

toggleSpeakerBtn?.addEventListener('click', () => {
    speakerOn = !speakerOn;
    const currentName = speakerNameEl?.textContent || 'Sonos One';

    if (speakerOn) {
        speakerStatus.textContent = 'ON';
        speakerStatus.style.color = '#1a73e8';
        speakerStatus.style.background = 'rgba(26, 115, 232, 0.1)';
        toggleSpeakerBtn.textContent = `Turn ${currentName} OFF`;
        speakerCard?.classList.add('active-media');
        addLog(`"${currentName}" turned ON.`);
    } else {
        speakerStatus.textContent = 'OFF';
        speakerStatus.style.color = '#5f6368';
        speakerStatus.style.background = 'transparent';
        toggleSpeakerBtn.textContent = `Turn ${currentName} ON`;
        speakerCard?.classList.remove('active-media');
        addLog(`"${currentName}" turned OFF.`);
    }

    updateEnergyUsage();
});

speakerSlider?.addEventListener('change', (e) => {
    if (!speakerOn && e.target.value > 0) toggleSpeakerBtn?.click();
    else addLog(`"${speakerNameEl?.textContent || 'Sonos One'}" volume set to ${e.target.value}.`);
    updateEnergyUsage();
});


// 14. Device Management
function setupDeviceMenu(renameOptId, nameElId) {
    const renameOpt = document.getElementById(renameOptId);
    const nameEl = document.getElementById(nameElId);
    if (!renameOpt || !nameEl) return;

    renameOpt.addEventListener('click', () => {
        const currentName = nameEl.textContent;
        const newName = prompt(`Enter a new name for ${currentName}:`, currentName);

        if (newName && newName.trim() !== '') {
            nameEl.textContent = newName.trim();
            addLog(`Device renamed from "${currentName}" to "${newName.trim()}".`);
            const toggleBtn = document.getElementById(nameElId.replace('-name', '-toggle-btn')) || nameEl.closest('.device-card')?.querySelector('.pro-btn');
            if (toggleBtn && toggleBtn.textContent.includes('Turn')) {
                const isOn = toggleBtn.textContent.includes('OFF');
                toggleBtn.textContent = `Turn ${newName.trim()} ${isOn ? 'OFF' : 'ON'}`;
            }
        }
    });
}

setupDeviceMenu('light-rename-opt', 'light-name');
setupDeviceMenu('heating-rename-opt', 'heating-name');
setupDeviceMenu('lamp-rename-opt', 'lamp-name');
setupDeviceMenu('tv-rename-opt', 'tv-name');
setupDeviceMenu('fan-rename-opt', 'fan-name');
setupDeviceMenu('speaker-rename-opt', 'speaker-name');

// 15. Add Device Modal
const addDeviceBtn = document.getElementById('add-device-btn');
const addModal = document.getElementById('add-device-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const stateSearching = document.getElementById('modal-state-searching');
const stateResults = document.getElementById('modal-state-results');
const stateConnecting = document.getElementById('modal-state-connecting');
const devicesListUl = document.getElementById('available-devices-list');
const foundText = document.getElementById('found-devices-text');

addDeviceBtn?.addEventListener('click', () => {
    if (!addModal) return;

    addModal.style.display = 'flex';
    if (stateSearching) stateSearching.style.display = 'block';
    if (stateResults) stateResults.style.display = 'none';
    if (stateConnecting) stateConnecting.style.display = 'none';
    if (devicesListUl) devicesListUl.innerHTML = '';
    addLog('Searching for nearby smart devices...');

    const removedCards = document.querySelectorAll('#home-view .device-card[data-removed="true"]');

    setTimeout(() => {
        if (stateSearching) stateSearching.style.display = 'none';
        if (stateResults) stateResults.style.display = 'block';

        if (removedCards.length === 0) {
            if (foundText) foundText.textContent = 'No new devices found nearby.';
            return;
        }

        if (foundText) foundText.textContent = `Found ${removedCards.length} devices nearby:`;
        removedCards.forEach(card => {
            const name = card.querySelector('h3')?.textContent || 'Unknown Device';
            const icon = card.querySelector('.material-icons')?.textContent || 'memory';
            const cardId = card.id;
            const li = document.createElement('li');
            li.className = 'device-list-item';
            li.innerHTML = `
                <div class="list-item-left">
                    <span class="material-icons" style="font-size: 24px;">${icon}</span>
                    <div class="list-item-text">
                        <strong style="font-size: 16px;">${name}</strong><br>
                        <small style="color:#5f6368;">Ready to pair</small>
                    </div>
                </div>
                <button class="connect-btn" style="background:transparent; color:#1a73e8; border:1px solid #dadce0; border-radius:16px; padding:6px 16px; font-weight:bold; cursor:pointer;" data-target="${cardId}" data-name="${name}">Connect</button>
            `;
            devicesListUl?.appendChild(li);
        });
    }, 1500);
});

closeModalBtn?.addEventListener('click', () => {
    if (addModal) addModal.style.display = 'none';
});

devicesListUl?.addEventListener('click', (e) => {
    const connectBtn = e.target.closest('.connect-btn');
    if (!connectBtn) return;

    const targetId = connectBtn.getAttribute('data-target');
    const name = connectBtn.getAttribute('data-name') || 'Device';

    if (stateResults) stateResults.style.display = 'none';
    if (stateConnecting) stateConnecting.style.display = 'block';
    addLog(`Connecting to "${name}"...`);

    setTimeout(() => {
        if (addModal) addModal.style.display = 'none';
        const card = document.getElementById(targetId);
        if (card) {
            card.style.display = 'block';
            card.setAttribute('data-removed', 'false');
        }
        document.querySelector('.pill[data-filter="all"]')?.click();
        addLog(`Successfully added "${name}" to your smart home.`);
        updateEnergyUsage();
    }, 1500);
});


// 16. Automations Page and Add Automation
let editingCard = null;

const automationDeviceConfig = [
    { id: 'light', cardId: 'light-card', nameId: 'light-name', toggleId: 'toggle-lights-btn' },
    { id: 'heat', cardId: 'heating-card', nameId: 'heating-name', toggleId: 'toggle-heating-btn' },
    { id: 'lamp', cardId: 'desk-lamp-card', nameId: 'lamp-name', toggleId: 'toggle-desk-lamp-btn' },
    { id: 'tv', cardId: 'tv-card', nameId: 'tv-name', toggleId: 'toggle-tv-btn' },
    { id: 'fan', cardId: 'fan-card', nameId: 'fan-name', toggleId: 'toggle-fan-btn' },
    { id: 'speaker', cardId: 'speaker-card', nameId: 'speaker-name', toggleId: 'toggle-speaker-btn' }
];

function getTriggerLabel(triggerValue) {
    const triggerMap = {
        manual: 'Manual (When I click "Run Routine")',
        time_morning: 'At Sunrise (06:30 AM)',
        time_evening: 'At Sunset (18:00 PM)',
        temp_drop: 'When inside temp drops below 18°C',
        location_leave: 'When I leave home',
        location_arrive: 'When I arrive home'
    };
    return triggerMap[triggerValue] || 'Manual (When I click "Run Routine")';
}

function updateAutomationModalDevices() {
    automationDeviceConfig.forEach(dev => {
        const card = document.getElementById(dev.cardId);
        const checkbox = document.getElementById(`auto-${dev.id}-check`);
        if (!card || !checkbox) return;

        const actionItem = checkbox.closest('.auto-action-item');
        if (!actionItem) return;

        if (card.getAttribute('data-removed') !== 'true') {
            actionItem.style.display = 'flex';
            const label = actionItem.querySelector('label');
            const nameEl = document.getElementById(dev.nameId);
            if (label && nameEl) label.textContent = nameEl.textContent;
        } else {
            actionItem.style.display = 'none';
            checkbox.checked = false;
        }
    });
}

function getDefaultRoutineConfig(routineType) {
    if (routineType === 'morning') return { trigger: 'time_morning', actions: [{ device: 'light', state: 'on' }, { device: 'heat', state: 'on' }] };
    if (routineType === 'leaving') return { trigger: 'location_leave', actions: [{ device: 'light', state: 'off' }, { device: 'lamp', state: 'off' }, { device: 'tv', state: 'off' }, { device: 'fan', state: 'off' }, { device: 'speaker', state: 'off' }, { device: 'heat', state: 'on' }] };
    if (routineType === 'movie') return { trigger: 'manual', actions: [{ device: 'tv', state: 'on' }, { device: 'light', state: 'on' }] };
    return { trigger: 'manual', actions: [] };
}

function populateAutomationModalForCard(card) {
    const runBtn = card.querySelector('.run-routine-btn');
    if (!runBtn) return;

    document.getElementById('auto-name-input').value = card.querySelector('h3')?.textContent || 'Custom Routine';
    document.getElementById('auto-modal-title').textContent = 'Edit Routine';
    document.getElementById('save-automation-btn').textContent = 'Save Changes';
    document.querySelectorAll('.auto-actions-list input[type="checkbox"]').forEach(cb => cb.checked = false);

    const routineType = runBtn.getAttribute('data-routine');
    const trigger = runBtn.getAttribute('data-trigger') || getDefaultRoutineConfig(routineType).trigger;
    document.getElementById('auto-trigger-select').value = trigger;
    updateAutomationModalDevices();

    const config = runBtn.hasAttribute('data-config') ? JSON.parse(runBtn.getAttribute('data-config')) : getDefaultRoutineConfig(routineType).actions;
    config.forEach(action => {
        const check = document.getElementById(`auto-${action.device}-check`);
        const select = document.getElementById(`auto-${action.device}-state`);
        if (check && check.closest('.auto-action-item').style.display !== 'none') {
            check.checked = true;
            if (select) select.value = action.state;
        }
    });
}

function applyAutomationAction(action) {
    const config = automationDeviceConfig.find(dev => dev.id === action.device);
    if (!config) return;

    const cardElement = document.getElementById(config.cardId);
    if (!cardElement || cardElement.getAttribute('data-offline') === 'true' || cardElement.getAttribute('data-removed') === 'true') return;

    if (action.device === 'light' && ((action.state === 'on' && !lightsOn) || (action.state === 'off' && lightsOn))) document.getElementById('toggle-lights-btn')?.click();
    if (action.device === 'heat' && ((action.state === 'on' && !heatingOn) || (action.state === 'off' && heatingOn))) document.getElementById('toggle-heating-btn')?.click();
    if (action.device === 'lamp' && ((action.state === 'on' && !deskLampOn) || (action.state === 'off' && deskLampOn))) document.getElementById('toggle-desk-lamp-btn')?.click();
    if (action.device === 'tv' && ((action.state === 'on' && !tvOn) || (action.state === 'off' && tvOn))) document.getElementById('toggle-tv-btn')?.click();
    if (action.device === 'fan' && ((action.state === 'on' && !fanOn) || (action.state === 'off' && fanOn))) document.getElementById('toggle-fan-btn')?.click();
    if (action.device === 'speaker' && ((action.state === 'on' && !speakerOn) || (action.state === 'off' && speakerOn))) document.getElementById('toggle-speaker-btn')?.click();
}

function buildRoutineCardHTML(name, triggerVal, statusLines, actions) {
    const triggerText = getTriggerLabel(triggerVal);
    const actionJSON = JSON.stringify(actions).replace(/'/g, '&apos;');

    return `
        <div class="device-card routine-custom">
            <div class="card-header">
                <div class="device-info">
                    <span class="material-icons" style="vertical-align: middle; color: #34a853;">auto_awesome</span>
                    <h3 style="display: inline-block; margin-left: 5px;">${name}</h3>
                </div>
            </div>
            <div class="card-body-complex">
                <div class="complexLeft">
                    <div class="form-group">
                        <label>RUN ACTION</label>
                        <button class="pro-btn run-routine-btn" data-config='${actionJSON}' data-trigger="${triggerVal}">Run Routine</button>
                    </div>
                    <div class="form-group">
                        <label>TRIGGER CONDITIONS</label>
                        <div class="dense-readout"><p>${triggerText}</p></div>
                    </div>
                </div>
                <div class="complexRight">
                    <div class="form-group">
                        <label>ROUTINE SETTINGS</label>
                        <div class="dense-readout">${statusLines.map(line => `<p>${line}</p>`).join('')}</div>
                    </div>
                    <div class="form-group" style="margin-top: auto;">
                        <div class="admin-buttons">
                            <button class="secondary-btn edit-routine-opt">Edit Sequence</button>
                            <button class="danger-btn delete-routine-opt">Delete Routine</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

const routinesGrid = document.getElementById('routines-grid');
const addAutoBtn = document.getElementById('add-automation-btn');
const autoModal = document.getElementById('add-automation-modal');
const closeAutoModalBtn = document.getElementById('close-auto-modal-btn');
const saveAutoBtn = document.getElementById('save-automation-btn');

addAutoBtn?.addEventListener('click', () => {
    editingCard = null;
    document.getElementById('auto-modal-title').textContent = 'Create Custom Routine';
    document.getElementById('save-automation-btn').textContent = 'Save Routine';
    document.getElementById('auto-name-input').value = '';
    document.getElementById('auto-trigger-select').value = 'manual';
    document.querySelectorAll('.auto-actions-list input[type="checkbox"]').forEach(cb => cb.checked = false);
    updateAutomationModalDevices();
    autoModal.style.display = 'flex';
});

closeAutoModalBtn?.addEventListener('click', () => {
    autoModal.style.display = 'none';
    editingCard = null;
});

saveAutoBtn?.addEventListener('click', () => {
    const name = document.getElementById('auto-name-input').value.trim() || 'Custom Routine';
    const triggerVal = document.getElementById('auto-trigger-select').value;
    const actions = [];
    const statusLines = [];

    automationDeviceConfig.forEach(dev => {
        const check = document.getElementById(`auto-${dev.id}-check`);
        const select = document.getElementById(`auto-${dev.id}-state`);
        if (!check || !select) return;
        if (check.checked && check.closest('.auto-action-item').style.display !== 'none') {
            const state = select.value;
            const currentName = document.getElementById(dev.nameId)?.textContent || dev.id;
            actions.push({ device: dev.id, state });
            statusLines.push(`${currentName}: ${state.toUpperCase()}`);
        }
    });

    if (actions.length === 0) {
        alert('Please select at least one action for this routine.');
        return;
    }

    if (editingCard) {
        const headerInfo = editingCard.querySelector('.device-info');
        if (headerInfo) {
            headerInfo.innerHTML = `<span class="material-icons" style="vertical-align: middle; color: #34a853;">auto_awesome</span><h3 style="display: inline-block; margin-left: 5px;">${name}</h3>`;
        }

        const triggerReadout = editingCard.querySelector('.complexLeft .dense-readout');
        const paramsReadout = editingCard.querySelector('.complexRight .dense-readout');
        const runBtn = editingCard.querySelector('.run-routine-btn');
        if (triggerReadout) triggerReadout.innerHTML = `<p>${getTriggerLabel(triggerVal)}</p>`;
        if (paramsReadout) paramsReadout.innerHTML = statusLines.map(line => `<p>${line}</p>`).join('');
        if (runBtn) {
            runBtn.setAttribute('data-config', JSON.stringify(actions));
            runBtn.setAttribute('data-trigger', triggerVal);
            runBtn.removeAttribute('data-routine');
        }
        editingCard.classList.add('routine-custom');
        addLog(`Routine updated to "${name}".`);
    } else {
        routinesGrid?.insertAdjacentHTML('beforeend', buildRoutineCardHTML(name, triggerVal, statusLines, actions));
        addLog(`New automation "${name}" created.`);
    }

    autoModal.style.display = 'none';
    editingCard = null;
});

routinesGrid?.addEventListener('click', (e) => {
    if (e.target.closest('.edit-routine-opt')) {
        editingCard = e.target.closest('.device-card');
        populateAutomationModalForCard(editingCard);
        autoModal.style.display = 'flex';
        return;
    }

    if (e.target.closest('.delete-routine-opt')) {
        const card = e.target.closest('.device-card');
        const routineName = card?.querySelector('h3')?.textContent || 'this routine';
        if (confirm(`Are you sure you want to completely delete "${routineName}"?`)) {
            card?.remove();
            addLog(`Routine "${routineName}" was deleted.`);
        }
        return;
    }

    if (e.target.classList.contains('run-routine-btn')) {
        const btn = e.target;
        const routineType = btn.getAttribute('data-routine');
        const customConfig = btn.getAttribute('data-config');
        const routineName = btn.closest('.device-card')?.querySelector('h3')?.textContent || 'Routine';
        const originalText = btn.textContent;
        btn.textContent = 'Running...';
        btn.style.backgroundColor = '#e8eaed';
        btn.style.color = '#1a73e8';

        setTimeout(() => {
            addLog(`Automation: "${routineName}" routine activated.`);
            if (customConfig) JSON.parse(customConfig).forEach(applyAutomationAction);
            else {
                getDefaultRoutineConfig(routineType).actions.forEach(applyAutomationAction);
                if (routineType === 'morning') {
                    if (brightnessSlider) { brightnessSlider.value = 70; if (brightnessNum) brightnessNum.value = 70; updateSliderFill(brightnessSlider); }
                    if (tempSlider) { if (ecoModeOn) document.getElementById('eco-mode-btn')?.click(); tempSlider.value = 22; if (tempNum) tempNum.value = 22; if (tempStatus) { tempStatus.textContent = '22°C'; tempStatus.style.color = '#e65100'; tempStatus.style.background = 'rgba(230, 81, 0, 0.1)'; } updateSliderFill(tempSlider); }
                }
                if (routineType === 'movie' && brightnessSlider) { brightnessSlider.value = 10; if (brightnessNum) brightnessNum.value = 10; updateSliderFill(brightnessSlider); }
                if (routineType === 'leaving' && !ecoModeOn) document.getElementById('eco-mode-btn')?.click();
            }
            updateEnergyUsage();
            btn.textContent = originalText;
            btn.style.backgroundColor = '';
            btn.style.color = '';
        }, 1000);
    }
});

// 17. Edit Layout Drag-and-Drop
const homeGrid = document.querySelector('#home-view .device-grid');
const filtersContainer = document.querySelector('.filters');
const macrosContainer = document.querySelector('.macro-container');

function setupDragAndDrop(container, selector, mode) {
    if (!container) return;

    container.addEventListener('dragstart', (e) => {
        if (!isEditMode) return;
        const item = e.target.closest(selector);
        if (item) setTimeout(() => item.classList.add('dragging'), 0);
    });

    container.addEventListener('dragend', (e) => {
        if (!isEditMode) return;
        const item = e.target.closest(selector);
        if (item) item.classList.remove('dragging');
    });

    container.addEventListener('dragover', (e) => {
        if (!isEditMode) return;
        e.preventDefault();

        const dragging = container.querySelector('.dragging');
        if (!dragging) return;

        const hover = e.target.closest(`${selector}:not(.dragging)`);
        if (!hover || !container.contains(hover)) return;

        const rect = hover.getBoundingClientRect();
        let insertAfter;
        if (mode === 'horizontal') {
            insertAfter = e.clientX > rect.left + (rect.width / 2);
        } else {
            const middleY = rect.top + (rect.height / 2);
            const middleX = rect.left + (rect.width / 2);
            insertAfter = e.clientY > middleY ||
                         (Math.abs(e.clientY - middleY) < rect.height / 4 && e.clientX > middleX);
        }

        if (insertAfter) hover.after(dragging);
        else hover.before(dragging);
    });
}

editLayoutBtn?.addEventListener('click', () => {
    isEditMode = !isEditMode;

    const cards = homeGrid.querySelectorAll('.device-card');
    const pillsList = filtersContainer.querySelectorAll('.pill');
    const macroBtns = macrosContainer.querySelectorAll('.macro-btn');

    if (isEditMode) {
        editLayoutBtn.innerHTML = '<span class="material-icons">check</span> Finish';
        editLayoutBtn.style.backgroundColor = '#34a853';
        editLayoutBtn.style.color = '#ffffff';

        homeGrid.classList.add('edit-mode');
        filtersContainer.classList.add('edit-mode');
        macrosContainer.classList.add('edit-mode');

        cards.forEach(card => card.setAttribute('draggable', 'true'));
        pillsList.forEach(pill => pill.setAttribute('draggable', 'true'));
        macroBtns.forEach(btn => btn.setAttribute('draggable', 'true'));

        addLog('Edit Layout mode enabled. Drag items to rearrange.');
    } else {
        editLayoutBtn.innerHTML = '<span class="material-icons">edit</span> Edit Layout';
        editLayoutBtn.style.backgroundColor = '';
        editLayoutBtn.style.color = '';

        homeGrid.classList.remove('edit-mode');
        filtersContainer.classList.remove('edit-mode');
        macrosContainer.classList.remove('edit-mode');

        cards.forEach(card => card.removeAttribute('draggable'));
        pillsList.forEach(pill => pill.removeAttribute('draggable'));
        macroBtns.forEach(btn => btn.removeAttribute('draggable'));

        addLog('Dashboard layout saved.');
    }
});

setupDragAndDrop(homeGrid, '.device-card', 'grid');
setupDragAndDrop(filtersContainer, '.pill', 'horizontal');
setupDragAndDrop(macrosContainer, '.macro-btn', 'grid');


// 18. Initial Setup
document.querySelectorAll('input[type="range"]').forEach(slider => updateSliderFill(slider));

syncInputs('brightness-slider', 'brightness-num');
syncInputs('temp-slider', 'temp-num');
syncInputs('desk-lamp-slider', 'desk-lamp-num');
syncInputs('tv-vol-slider', 'tv-vol-num');
syncInputs('color-temp-slider', 'color-temp-num');
syncInputs('fan-speed-slider', 'fan-speed-num');
syncInputs('speaker-vol-slider', 'speaker-vol-num');

refreshGrid();
updateEnergyUsage();

setTimeout(() => {
    if (logList && logList.querySelectorAll('li').length === 1 && document.getElementById('initial-log')) {
        addLog('System ready. Waiting for user actions.');
    }
}, 0);
