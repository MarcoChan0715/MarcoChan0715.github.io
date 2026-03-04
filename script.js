// --- 1. Global Setup & Logging ---
const logList = document.getElementById('log-list');

function addLog(message) {
    // Hide the initial "None" log the first time a real log is generated
    const initialLog = document.getElementById('initial-log');
    if (initialLog) {
        initialLog.remove();
    }

    const newLogItem = document.createElement('li');
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    newLogItem.innerHTML = `<strong>[${timeString}]</strong> ${message}`;
    logList.prepend(newLogItem);
}

// --- NEW: DYNAMIC ENERGY CALCULATION ---
function updateEnergyDraw() {
    let totalDraw = 0.30; 

    const isDeviceActive = (cardId, stateVar) => {
        const card = document.getElementById(cardId);
        if (!card || card.getAttribute('data-removed') === 'true') return false;
        return stateVar;
    };

    if (isDeviceActive('light-card', lightsOn)) {
        const bright = parseInt(document.getElementById('brightness-slider').value) || 0;
        totalDraw += 0.05 * (bright / 100); 
    }
    if (isDeviceActive('heating-card', heatingOn)) {
        totalDraw += 2.00; 
    }
    if (isDeviceActive('desk-lamp-card', deskLampOn)) {
        const bright = parseInt(document.getElementById('desk-lamp-slider').value) || 0;
        totalDraw += 0.01 * (bright / 100); 
    }
    if (isDeviceActive('tv-card', tvOn)) {
        totalDraw += 0.15; 
    }
    if (isDeviceActive('fan-card', fanOn)) {
        const speed = parseInt(document.getElementById('fan-speed-slider').value) || 1;
        totalDraw += 0.04 * (speed / 10); 
    }
    if (isDeviceActive('speaker-card', speakerOn)) {
        const vol = parseInt(document.getElementById('speaker-vol-slider').value) || 0;
        totalDraw += 0.02 * (vol / 100); 
    }

    document.getElementById('current-draw-val').textContent = totalDraw.toFixed(2);

    const statusEl = document.getElementById('current-draw-status');
    if (totalDraw > 2.3) {
        statusEl.textContent = 'High usage';
        statusEl.style.color = '#d93025'; 
    } else if (totalDraw > 1.0) {
        statusEl.textContent = 'Moderate usage';
        statusEl.style.color = '#f29900'; 
    } else {
        statusEl.textContent = 'Normal levels';
        statusEl.style.color = '#34a853'; 
    }
}

// --- 2. Popup Menus, Renaming, & Side Panel Logic ---
const panelBackdrop = document.getElementById('panel-backdrop');

document.addEventListener('click', (e) => {
    if (!e.target.closest('.menu-container')) {
        document.querySelectorAll('.popup-menu').forEach(popup => popup.style.display = 'none');
    }
});

panelBackdrop.addEventListener('click', () => {
    document.querySelectorAll('.advanced-settings.open').forEach(panel => {
        panel.classList.remove('open');
    });
    panelBackdrop.style.display = 'none';
});

function setupDeviceMenu(menuBtnId, popupId, renameOptId, advOptId, nameElId, advSectionId) {
    const menuBtn = document.getElementById(menuBtnId);
    const popup = document.getElementById(popupId);
    const renameOpt = document.getElementById(renameOptId);
    const advOpt = document.getElementById(advOptId);
    const nameEl = document.getElementById(nameElId);
    const advSection = document.getElementById(advSectionId);
    
    if(!menuBtn || !popup || !advSection) return;
    
    const closePanelBtn = advSection.querySelector('.close-panel-btn');

    menuBtn.addEventListener('click', () => {
        document.querySelectorAll('.popup-menu').forEach(p => {
            if (p !== popup) p.style.display = 'none';
        });
        popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
    });

    renameOpt.addEventListener('click', () => {
        popup.style.display = 'none'; 
        const currentName = nameEl.textContent;
        const newName = prompt(`Enter a new name for ${currentName}:`, currentName);
        
        if (newName && newName.trim() !== "") {
            nameEl.textContent = newName.trim();
            addLog(`Device renamed from "${currentName}" to "${newName.trim()}".`);
            
            const toggleBtn = document.getElementById(nameElId.replace('-name', '-toggle-btn')) || nameEl.closest('.device-card').querySelector('.action-btn');
            if (toggleBtn && toggleBtn.textContent.includes('Turn')) {
                const isOn = toggleBtn.textContent.includes('OFF'); 
                toggleBtn.textContent = `Turn ${newName.trim()} ${isOn ? 'OFF' : 'ON'}`;
            }
        }
    });

    advOpt.addEventListener('click', () => {
        popup.style.display = 'none'; 
        advSection.classList.add('open');
        panelBackdrop.style.display = 'block';
    });

    if(closePanelBtn) {
        closePanelBtn.addEventListener('click', () => {
            advSection.classList.remove('open');
            panelBackdrop.style.display = 'none';
        });
    }
}

setupDeviceMenu('light-menu-btn', 'light-popup', 'light-rename-opt', 'light-adv-opt', 'light-name', 'light-advanced');
setupDeviceMenu('heating-menu-btn', 'heating-popup', 'heating-rename-opt', 'heating-adv-opt', 'heating-name', 'heating-advanced');
setupDeviceMenu('desk-lamp-menu-btn', 'lamp-popup', 'lamp-rename-opt', 'lamp-adv-opt', 'lamp-name', 'desk-lamp-advanced');
setupDeviceMenu('tv-menu-btn', 'tv-popup', 'tv-rename-opt', 'tv-adv-opt', 'tv-name', 'tv-advanced');
setupDeviceMenu('fan-menu-btn', 'fan-popup', 'fan-rename-opt', 'fan-adv-opt', 'fan-name', 'fan-advanced');
setupDeviceMenu('speaker-menu-btn', 'speaker-popup', 'speaker-rename-opt', 'speaker-adv-opt', 'speaker-name', 'speaker-advanced');


// --- 3. Filter Pills, Favourites & Remove Device Logic ---
const pills = document.querySelectorAll('.pill');

function refreshGrid() {
    const activeFilter = document.querySelector('.pill.active').getAttribute('data-filter');
    const deviceCards = document.querySelectorAll('.device-card');

    deviceCards.forEach(card => {
        if (card.getAttribute('data-removed') === 'true') {
            card.style.display = 'none';
            return; 
        }

        if (activeFilter === 'all') {
            card.style.display = 'block'; 
        } else if (activeFilter === 'favourites') {
            card.style.display = card.getAttribute('data-favorite') === 'true' ? 'block' : 'none';
        } else {
            card.style.display = card.getAttribute('data-category') === activeFilter ? 'block' : 'none';
        }
    });
}

pills.forEach(pill => {
    pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        refreshGrid();
    });
});

document.body.addEventListener('click', (e) => {
    if (e.target.closest('.fav-btn')) {
        const favBtn = e.target.closest('.fav-btn');
        const card = favBtn.closest('.device-card');
        const deviceName = card.querySelector('h3').textContent;
        const isFav = card.getAttribute('data-favorite') === 'true';
        const iconSpan = favBtn.querySelector('.fav-icon');

        if (isFav) {
            card.setAttribute('data-favorite', 'false');
            iconSpan.textContent = 'favorite_border'; 
            iconSpan.style.color = '#ccc';
            addLog(`"${deviceName}" removed from favourites.`);
            refreshGrid();
        } else {
            card.setAttribute('data-favorite', 'true');
            iconSpan.textContent = 'favorite'; 
            iconSpan.style.color = '#1a73e8';
            addLog(`"${deviceName}" added to favourites.`);
        }
    }

    if (e.target.classList.contains('remove-device-btn')) {
        const advSection = e.target.closest('.advanced-settings');
        const cardId = advSection.id.replace('-advanced', '-card');
        const card = document.getElementById(cardId);
        const deviceName = card.querySelector('h3').textContent;
        
        if (confirm(`Are you sure you want to remove ${deviceName} from your Smart Home?`)) {
            advSection.classList.remove('open');
            panelBackdrop.style.display = 'none';

            card.setAttribute('data-removed', 'true');
            card.setAttribute('data-favorite', 'false');
            const iconSpan = card.querySelector('.fav-icon');
            if(iconSpan) {
                iconSpan.textContent = 'favorite_border';
                iconSpan.style.color = '#ccc';
            }
            
            refreshGrid(); 
            addLog(`"${deviceName}" was removed from the dashboard.`);
            updateEnergyDraw(); 
        }
    }
});

// --- 4. Device Controls: Room Lights ---
let lightsOn = false;
const lightCard = document.getElementById('light-card');
const toggleLightsBtn = document.getElementById('toggle-lights-btn');
const lightStatus = document.getElementById('light-status');
const lightNameEl = document.getElementById('light-name');
const brightnessSlider = document.getElementById('brightness-slider');
const brightnessVal = document.getElementById('brightness-val');

toggleLightsBtn.addEventListener('click', () => {
    lightsOn = !lightsOn; 
    let currentName = lightNameEl.textContent;
    if (lightsOn) {
        lightStatus.textContent = 'ON';
        lightStatus.style.color = '#e65100'; 
        toggleLightsBtn.textContent = `Turn ${currentName} OFF`;
        lightCard.classList.add('active-light'); 
        addLog(`"${currentName}" turned ON.`);
    } else {
        lightStatus.textContent = 'OFF';
        lightStatus.style.color = '#5f6368'; 
        toggleLightsBtn.textContent = `Turn ${currentName} ON`;
        lightCard.classList.remove('active-light'); 
        addLog(`"${currentName}" turned OFF.`);
    }
    updateEnergyDraw(); 
});

brightnessSlider.addEventListener('change', (e) => {
    brightnessVal.textContent = `${e.target.value}%`;
    addLog(`"${lightNameEl.textContent}" brightness adjusted to ${e.target.value}%.`);
    updateEnergyDraw(); 
});


// --- 5. Device Controls: Heating System ---
let heatingOn = false;
let ecoModeOn = false;
const heatingCard = document.getElementById('heating-card');
const toggleHeatingBtn = document.getElementById('toggle-heating-btn');
const tempStatus = document.getElementById('temp-status');
const tempSlider = document.getElementById('temp-slider');
const targetTempVal = document.getElementById('target-temp-val');
const ecoModeBtn = document.getElementById('eco-mode-btn');
const heatingNameEl = document.getElementById('heating-name');

let previousTemp = tempSlider.value; 

toggleHeatingBtn.addEventListener('click', () => {
    heatingOn = !heatingOn; 
    let currentName = heatingNameEl.textContent;
    if (heatingOn) {
        toggleHeatingBtn.textContent = `Turn ${currentName} OFF`;
        heatingCard.classList.add('active-heat'); 
        addLog(`"${currentName}" turned ON.`);
    } else {
        toggleHeatingBtn.textContent = `Turn ${currentName} ON`;
        heatingCard.classList.remove('active-heat'); 
        addLog(`"${currentName}" turned OFF.`);
    }
    updateEnergyDraw();
});

tempSlider.addEventListener('change', (e) => {
    targetTempVal.textContent = `${e.target.value}°C`;
    tempStatus.textContent = `${e.target.value}°C`;
    addLog(`"${heatingNameEl.textContent}" target set to ${e.target.value}°C.`);
});

ecoModeBtn.addEventListener('click', () => {
    ecoModeOn = !ecoModeOn;
    if (ecoModeOn) {
        ecoModeBtn.textContent = 'Disable';
        ecoModeBtn.style.background = '#ceead6';
        ecoModeBtn.style.color = '#137333';
        
        previousTemp = tempSlider.value;
        tempSlider.value = 18;
        tempSlider.disabled = true; 
        targetTempVal.textContent = `18°C (Eco Locked)`;
        tempStatus.textContent = `18°C`;
        addLog(`"${heatingNameEl.textContent}" Eco Mode ENABLED.`);
    } else {
        ecoModeBtn.textContent = 'Enable';
        ecoModeBtn.style.background = '#e8eaed';
        ecoModeBtn.style.color = '#3c4043';
        
        tempSlider.disabled = false;
        tempSlider.value = previousTemp;
        targetTempVal.textContent = `${previousTemp}°C`;
        tempStatus.textContent = `${previousTemp}°C`;
        addLog(`"${heatingNameEl.textContent}" Eco Mode DISABLED.`);
    }
});


// --- 6. Device Controls: Desk Lamp ---
let deskLampOn = false;
const deskLampCard = document.getElementById('desk-lamp-card');
const toggleDeskLampBtn = document.getElementById('toggle-desk-lamp-btn');
const deskLampStatus = document.getElementById('desk-lamp-status');
const lampNameEl = document.getElementById('lamp-name');

toggleDeskLampBtn.addEventListener('click', () => {
    deskLampOn = !deskLampOn; 
    let currentName = lampNameEl.textContent;
    if (deskLampOn) {
        deskLampStatus.textContent = 'ON';
        deskLampStatus.style.color = '#e65100'; 
        toggleDeskLampBtn.textContent = `Turn ${currentName} OFF`;
        deskLampCard.classList.add('active-light'); 
        addLog(`"${currentName}" turned ON.`);
    } else {
        deskLampStatus.textContent = 'OFF';
        deskLampStatus.style.color = '#5f6368'; 
        toggleDeskLampBtn.textContent = `Turn ${currentName} ON`;
        deskLampCard.classList.remove('active-light'); 
        addLog(`"${currentName}" turned OFF.`);
    }
    updateEnergyDraw();
});

document.getElementById('desk-lamp-slider').addEventListener('change', (e) => {
    document.getElementById('desk-lamp-val').textContent = `${e.target.value}%`;
    addLog(`"${lampNameEl.textContent}" brightness adjusted to ${e.target.value}%.`);
    updateEnergyDraw();
});

let lampTimerInterval;
let isLampTimerRunning = false;
const lampTimerBtn = document.getElementById('desk-lamp-timer-btn');
const lampTimerSelect = document.getElementById('desk-lamp-timer-select');
const lampTimerDisplay = document.getElementById('desk-lamp-timer-display');

lampTimerBtn.addEventListener('click', () => {
    let currentName = lampNameEl.textContent;
    if (isLampTimerRunning) {
        clearInterval(lampTimerInterval);
        isLampTimerRunning = false;
        lampTimerDisplay.style.display = 'none';
        lampTimerBtn.textContent = 'Start Timer';
        lampTimerBtn.style.color = '#3c4043';
        addLog(`"${currentName}" sleep timer cancelled.`);
    } else {
        let totalSeconds = parseInt(lampTimerSelect.value) * 60;
        isLampTimerRunning = true;
        
        lampTimerDisplay.style.display = 'block';
        lampTimerBtn.textContent = 'Cancel Timer';
        lampTimerBtn.style.color = '#d93025'; 
        addLog(`"${currentName}" sleep timer set for ${lampTimerSelect.value} minutes.`);

        if (!deskLampOn) toggleDeskLampBtn.click(); 

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
                lampTimerBtn.style.color = '#3c4043';
                addLog(`"${currentName}" sleep timer finished.`);
                
                setTimeout(() => {
                    lampTimerDisplay.style.display = 'none';
                    if (deskLampOn) toggleDeskLampBtn.click(); 
                }, 2000);
            }
        }, 1000);
    }
});


// --- 7. Device Controls: Smart TV ---
let tvOn = false;
const tvCard = document.getElementById('tv-card');
const toggleTvBtn = document.getElementById('toggle-tv-btn');
const tvStatus = document.getElementById('tv-status');
const tvNowPlaying = document.getElementById('tv-now-playing');
const tvInputSelect = document.getElementById('tv-input');
const tvVolSlider = document.getElementById('tv-vol-slider');
const tvVolVal = document.getElementById('tv-vol-val');
const tvNameEl = document.getElementById('tv-name');

const tvChannels = { 1: "Sky News", 2: "BBC One", 3: "ITV", 4: "Channel 4", 5: "Netflix", 6: "YouTube" };
let currentChannelNum = 1;

function updateTvDisplay() {
    if (!tvOn) {
        tvNowPlaying.style.display = 'none';
        return;
    }
    tvNowPlaying.style.display = 'block';
    let input = tvInputSelect.value;
    if (input === "TV / Apps") {
        tvNowPlaying.textContent = `Playing: ${tvChannels[currentChannelNum]}`;
    } else if (input === "HDMI 1") {
        tvNowPlaying.textContent = `Playing: HDMI 1 (Console)`;
    } else if (input === "HDMI 2") {
        tvNowPlaying.textContent = `Playing: HDMI 2 (Cable)`;
    }
}

toggleTvBtn.addEventListener('click', () => {
    tvOn = !tvOn; 
    let currentName = tvNameEl.textContent;
    if (tvOn) {
        tvStatus.textContent = 'ON';
        tvStatus.style.color = '#1a73e8'; 
        toggleTvBtn.textContent = `Turn ${currentName} OFF`;
        tvCard.classList.add('active-media'); 
        addLog(`"${currentName}" turned ON.`);
    } else {
        tvStatus.textContent = 'OFF';
        tvStatus.style.color = '#5f6368'; 
        toggleTvBtn.textContent = `Turn ${currentName} ON`;
        tvCard.classList.remove('active-media'); 
        addLog(`"${currentName}" turned OFF.`);
    }
    updateTvDisplay();
    updateEnergyDraw();
});

tvInputSelect.addEventListener('change', (e) => {
    if (tvOn) {
        addLog(`"${tvNameEl.textContent}" input changed to ${e.target.value}.`);
        updateTvDisplay();
    }
});

tvVolSlider.addEventListener('change', (e) => {
    tvVolVal.textContent = `${e.target.value}`;
    addLog(`"${tvNameEl.textContent}" volume set to ${e.target.value}.`);
    updateEnergyDraw();
});

let isMuted = false;
let preMuteVol = 15;

document.getElementById('tv-ch-up').addEventListener('click', () => {
    if(!tvOn) return;
    if(tvInputSelect.value === "TV / Apps") {
        currentChannelNum++;
        if(currentChannelNum > 6) currentChannelNum = 1; 
        updateTvDisplay();
        addLog(`"${tvNameEl.textContent}" channel changed to ${tvChannels[currentChannelNum]}.`);
    }
});

document.getElementById('tv-ch-down').addEventListener('click', () => {
    if(!tvOn) return;
    if(tvInputSelect.value === "TV / Apps") {
        currentChannelNum--;
        if(currentChannelNum < 1) currentChannelNum = 6; 
        updateTvDisplay();
        addLog(`"${tvNameEl.textContent}" channel changed to ${tvChannels[currentChannelNum]}.`);
    }
});

document.getElementById('tv-vol-up').addEventListener('click', () => {
    if(!tvOn) return;
    let vol = parseInt(tvVolSlider.value);
    if(vol < 100) {
        tvVolSlider.value = vol + 5;
        tvVolVal.textContent = tvVolSlider.value;
        addLog(`"${tvNameEl.textContent}" volume increased.`);
        updateEnergyDraw();
    }
});

document.getElementById('tv-vol-down').addEventListener('click', () => {
    if(!tvOn) return;
    let vol = parseInt(tvVolSlider.value);
    if(vol > 0) {
        tvVolSlider.value = vol - 5;
        tvVolVal.textContent = tvVolSlider.value;
        addLog(`"${tvNameEl.textContent}" volume decreased.`);
        updateEnergyDraw();
    }
});

document.getElementById('tv-mute').addEventListener('click', () => {
    if(!tvOn) return;
    isMuted = !isMuted;
    if (isMuted) {
        preMuteVol = tvVolSlider.value;
        tvVolSlider.value = 0;
        tvVolVal.textContent = 'Muted';
        addLog(`"${tvNameEl.textContent}" Muted.`);
    } else {
        tvVolSlider.value = preMuteVol;
        tvVolVal.textContent = preMuteVol;
        addLog(`"${tvNameEl.textContent}" Unmuted.`);
    }
    updateEnergyDraw();
});


// --- 8. Add New Device Modal Logic ---
const addDeviceBtn = document.getElementById('add-device-btn');
const addModal = document.getElementById('add-device-modal');
const closeModalBtn = document.getElementById('close-modal-btn');

const stateSearching = document.getElementById('modal-state-searching');
const stateResults = document.getElementById('modal-state-results');
const stateConnecting = document.getElementById('modal-state-connecting');
const devicesListUl = document.getElementById('available-devices-list');
const foundText = document.getElementById('found-devices-text');

addDeviceBtn.addEventListener('click', () => {
    addModal.style.display = 'flex';
    stateSearching.style.display = 'block';
    stateResults.style.display = 'none';
    stateConnecting.style.display = 'none';
    devicesListUl.innerHTML = ''; 
    addLog('Searching for nearby smart devices...');

    const removedCards = document.querySelectorAll('.device-card[data-removed="true"]');

    setTimeout(() => {
        stateSearching.style.display = 'none';
        stateResults.style.display = 'block';

        if (removedCards.length === 0) {
            foundText.textContent = 'No new devices found nearby.';
        } else {
            foundText.textContent = `Found ${removedCards.length} devices nearby:`;
            
            removedCards.forEach(card => {
                const name = card.querySelector('h3').textContent;
                const icon = card.querySelector('.icon-circle .material-icons').textContent;
                const cardId = card.id;
                
                const li = `
                    <li class="device-list-item">
                        <span class="material-icons" style="font-size: 30px; color: #5f6368;">${icon}</span>
                        <div class="list-item-text">
                            <strong>${name}</strong>
                            <br><small>Ready to pair</small>
                        </div>
                        <button class="action-btn connect-btn" data-target="${cardId}" data-name="${name}">Connect</button>
                    </li>
                `;
                devicesListUl.insertAdjacentHTML('beforeend', li);
            });
        }
    }, 3000);
});

closeModalBtn.addEventListener('click', () => {
    addModal.style.display = 'none';
});

devicesListUl.addEventListener('click', (e) => {
    if (e.target.classList.contains('connect-btn')) {
        const targetId = e.target.getAttribute('data-target');
        const name = e.target.getAttribute('data-name');
        
        stateResults.style.display = 'none';
        stateConnecting.style.display = 'block';
        addLog(`Connecting to ${name}...`);

        setTimeout(() => {
            addModal.style.display = 'none';
            
            const card = document.getElementById(targetId);
            card.setAttribute('data-removed', 'false');
            
            addLog(`Successfully added "${name}" to your smart home.`);
            document.querySelector('.pill[data-filter="all"]').click();
            updateEnergyDraw(); 
        }, 2500);
    }
});


// --- 9. Device Controls: Dyson Fan ---
let fanOn = false;
const fanCard = document.getElementById('fan-card');
const toggleFanBtn = document.getElementById('toggle-fan-btn');
const fanStatus = document.getElementById('fan-status');
const fanNameEl = document.getElementById('fan-name');
let fanOsc = false;

toggleFanBtn.addEventListener('click', () => {
    fanOn = !fanOn; 
    let currentName = fanNameEl.textContent;
    if (fanOn) {
        fanStatus.textContent = 'ON';
        fanStatus.style.color = '#e65100'; 
        toggleFanBtn.textContent = `Turn ${currentName} OFF`;
        fanCard.classList.add('active-heat'); 
        addLog(`"${currentName}" turned ON.`);
    } else {
        fanStatus.textContent = 'OFF';
        fanStatus.style.color = '#5f6368'; 
        toggleFanBtn.textContent = `Turn ${currentName} ON`;
        fanCard.classList.remove('active-heat'); 
        addLog(`"${currentName}" turned OFF.`);
    }
    updateEnergyDraw();
});

document.getElementById('fan-speed-slider').addEventListener('change', (e) => {
    document.getElementById('fan-speed-val').textContent = `${e.target.value}`;
    addLog(`"${fanNameEl.textContent}" speed adjusted to ${e.target.value}.`);
    updateEnergyDraw();
});

document.getElementById('fan-osc-btn').addEventListener('click', (e) => {
    fanOsc = !fanOsc;
    if(fanOsc) {
        e.target.textContent = "Disable";
        e.target.style.background = '#ceead6';
        addLog(`"${fanNameEl.textContent}" Oscillation ENABLED.`);
    } else {
        e.target.textContent = "Enable";
        e.target.style.background = '#e8eaed';
        addLog(`"${fanNameEl.textContent}" Oscillation DISABLED.`);
    }
});


// --- 10. Device Controls: Sonos Speaker ---
let speakerOn = false;
const speakerCard = document.getElementById('speaker-card');
const toggleSpeakerBtn = document.getElementById('toggle-speaker-btn');
const speakerStatus = document.getElementById('speaker-status');
const speakerNameEl = document.getElementById('speaker-name');

toggleSpeakerBtn.addEventListener('click', () => {
    speakerOn = !speakerOn; 
    let currentName = speakerNameEl.textContent;
    if (speakerOn) {
        speakerStatus.textContent = 'ON';
        speakerStatus.style.color = '#1a73e8'; 
        toggleSpeakerBtn.textContent = `Turn ${currentName} OFF`;
        speakerCard.classList.add('active-media'); 
        addLog(`"${currentName}" turned ON.`);
    } else {
        speakerStatus.textContent = 'OFF';
        speakerStatus.style.color = '#5f6368'; 
        toggleSpeakerBtn.textContent = `Turn ${currentName} ON`;
        speakerCard.classList.remove('active-media'); 
        addLog(`"${currentName}" turned OFF.`);
    }
    updateEnergyDraw();
});

document.getElementById('speaker-vol-slider').addEventListener('change', (e) => {
    document.getElementById('speaker-vol-val').textContent = `${e.target.value}`;
    addLog(`"${speakerNameEl.textContent}" volume adjusted to ${e.target.value}.`);
    updateEnergyDraw();
});

// --- 11. Automations / Routines Logic ---

// Run existing or custom routines
document.querySelector('#automations-view').addEventListener('click', (e) => {
    if (e.target.classList.contains('run-routine-btn')) {
        const routineType = e.target.getAttribute('data-routine');
        const customConfig = e.target.getAttribute('data-config');
        const routineName = e.target.closest('.device-info') ? e.target.closest('.device-info').querySelector('h3').textContent : e.target.getAttribute('data-name');
        
        const originalText = e.target.textContent;
        e.target.textContent = "Running...";
        e.target.style.backgroundColor = "#e8eaed";
        e.target.style.color = "#1a73e8";

        setTimeout(() => {
            addLog(`Automation: "${routineName}" routine activated.`);

            // Custom user-created routine
            if (customConfig) {
                const actions = JSON.parse(customConfig);
                actions.forEach(action => {
                    if(action.device === 'light') {
                        if((action.state === 'on' && !lightsOn) || (action.state === 'off' && lightsOn)) document.getElementById('toggle-lights-btn').click();
                    }
                    if(action.device === 'heat') {
                        if((action.state === 'on' && !heatingOn) || (action.state === 'off' && heatingOn)) document.getElementById('toggle-heating-btn').click();
                    }
                    if(action.device === 'tv') {
                        if((action.state === 'on' && !tvOn) || (action.state === 'off' && tvOn)) document.getElementById('toggle-tv-btn').click();
                    }
                });
            } 
            // Pre-built routines
            else {
                if (routineType === 'morning') {
                    if (!lightsOn) document.getElementById('toggle-lights-btn').click();
                    brightnessSlider.value = 70;
                    brightnessVal.textContent = "70%";
                    if (!heatingOn) document.getElementById('toggle-heating-btn').click();
                    if (ecoModeOn) ecoModeBtn.click(); 
                    tempSlider.value = 22;
                    targetTempVal.textContent = "22°C";
                    tempStatus.textContent = "22°C";
                } else if (routineType === 'leaving') {
                    if (lightsOn) document.getElementById('toggle-lights-btn').click();
                    if (tvOn) document.getElementById('toggle-tv-btn').click();
                    if (deskLampOn) document.getElementById('toggle-desk-lamp-btn').click();
                    if (fanOn) document.getElementById('toggle-fan-btn').click();
                    if (speakerOn) document.getElementById('toggle-speaker-btn').click();
                    if (!heatingOn) document.getElementById('toggle-heating-btn').click(); 
                    if (!ecoModeOn) ecoModeBtn.click();
                } else if (routineType === 'movie') {
                    if (!lightsOn) document.getElementById('toggle-lights-btn').click();
                    brightnessSlider.value = 10;
                    brightnessVal.textContent = "10%";
                    if (fanOn) document.getElementById('toggle-fan-btn').click();
                    if (!tvOn) document.getElementById('toggle-tv-btn').click();
                    tvInputSelect.value = "TV / Apps";
                    updateTvDisplay();
                }
            }

            updateEnergyDraw(); 

            e.target.textContent = originalText;
            e.target.style.backgroundColor = "";
            e.target.style.color = "";
        }, 1000); 
    }
});

// Custom Automation Modal Logic
const addAutoBtn = document.getElementById('add-automation-btn');
const autoModal = document.getElementById('add-automation-modal');
const closeAutoModalBtn = document.getElementById('close-auto-modal-btn');
const saveAutoBtn = document.getElementById('save-automation-btn');

addAutoBtn.addEventListener('click', () => {
    autoModal.style.display = 'flex';
    document.getElementById('auto-name-input').value = '';
    document.querySelectorAll('.auto-actions-list input[type="checkbox"]').forEach(cb => cb.checked = false);
});

closeAutoModalBtn.addEventListener('click', () => {
    autoModal.style.display = 'none';
});

saveAutoBtn.addEventListener('click', () => {
    const name = document.getElementById('auto-name-input').value || "Custom Routine";
    const actions = [];
    let statusText = [];

    if(document.getElementById('auto-light-check').checked) {
        const state = document.getElementById('auto-light-state').value;
        actions.push({device: 'light', state: state});
        statusText.push(`Lights ${state.toUpperCase()}`);
    }
    if(document.getElementById('auto-heat-check').checked) {
        const state = document.getElementById('auto-heat-state').value;
        actions.push({device: 'heat', state: state});
        statusText.push(`Heating ${state.toUpperCase()}`);
    }
    if(document.getElementById('auto-tv-check').checked) {
        const state = document.getElementById('auto-tv-state').value;
        actions.push({device: 'tv', state: state});
        statusText.push(`TV ${state.toUpperCase()}`);
    }

    if(actions.length === 0) {
        alert("Please select at least one action for this routine.");
        return;
    }

    // Build the new HTML card dynamically
    const cardHTML = `
        <div class="device-card" style="border-left: 4px solid #34a853;">
            <div class="card-header">
                <div class="icon-circle" style="background: #e6f4ea; color: #34a853;"><span class="material-icons">star</span></div>
                <div class="device-info">
                    <h3>${name}</h3>
                    <span class="status" style="font-weight: normal;">${statusText.join(', ')}</span>
                </div>
            </div>
            <button class="action-btn run-routine-btn" data-config='${JSON.stringify(actions)}' data-name="${name}">Run Routine</button>
        </div>
    `;

    document.getElementById('routines-grid').insertAdjacentHTML('beforeend', cardHTML);
    autoModal.style.display = 'none';
    addLog(`New automation "${name}" created.`);
});

// --- 12. Sidebar Navigation Logic & Initialization ---
const navHome = document.getElementById('nav-home');
const navActivity = document.getElementById('nav-activity');
const navEnergy = document.getElementById('nav-energy'); 
const navAutomations = document.getElementById('nav-automations'); 

const homeView = document.getElementById('home-view');
const activityView = document.getElementById('activity-view');
const energyView = document.getElementById('energy-view'); 
const automationsView = document.getElementById('automations-view'); 

// Button elements to show/hide
const topAddDeviceBtn = document.getElementById('add-device-btn');
const topAddAutoBtn = document.getElementById('add-automation-btn');

function switchView(activeNav, viewToShow) {
    navHome.classList.remove('active');
    navActivity.classList.remove('active');
    navEnergy.classList.remove('active');
    navAutomations.classList.remove('active');
    
    homeView.style.display = 'none';
    activityView.style.display = 'none';
    energyView.style.display = 'none';
    automationsView.style.display = 'none';
    
    activeNav.classList.add('active');
    viewToShow.style.display = 'block';

    // Toggle the right button in the header based on the page
    topAddDeviceBtn.style.display = (viewToShow === homeView) ? 'flex' : 'none';
    topAddAutoBtn.style.display = (viewToShow === automationsView) ? 'flex' : 'none';
}

navHome.addEventListener('click', () => switchView(navHome, homeView));
navActivity.addEventListener('click', () => switchView(navActivity, activityView));
navEnergy.addEventListener('click', () => switchView(navEnergy, energyView));
navAutomations.addEventListener('click', () => switchView(navAutomations, automationsView));

// Initialize energy display on load
updateEnergyDraw();