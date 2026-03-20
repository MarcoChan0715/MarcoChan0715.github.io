// --- 1. Global Setup & Logging ---
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

// --- 2. Sliders & Energy Math ---
function updateSliderFill(slider) {
    if(!slider) return;
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const val = parseFloat(slider.value) || 0;
    const percentage = ((val - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(to right, #1a73e8 ${percentage}%, #dadce0 ${percentage}%)`;
}

document.querySelectorAll('input[type="range"]').forEach(slider => {
    updateSliderFill(slider);
    slider.addEventListener('input', (e) => updateSliderFill(e.target));
});

function syncInputs(sliderId, numId) {
    const slider = document.getElementById(sliderId);
    const num = document.getElementById(numId);
    if(slider && num) {
        slider.addEventListener('input', (e) => { num.value = e.target.value; });
        num.addEventListener('input', (e) => {
            let val = parseInt(e.target.value);
            let max = parseInt(slider.max);
            let min = parseInt(slider.min);
            if(val > max) e.target.value = max;
            if(val < min) e.target.value = min;
            slider.value = e.target.value;
            slider.dispatchEvent(new Event('input')); 
            slider.dispatchEvent(new Event('change')); 
        });
    }
}
syncInputs('brightness-slider', 'brightness-num');
syncInputs('temp-slider', 'temp-num');
syncInputs('desk-lamp-slider', 'desk-lamp-num');
syncInputs('tv-vol-slider', 'tv-vol-num');
syncInputs('color-temp-slider', 'color-temp-num');
syncInputs('fan-speed-slider', 'fan-speed-num');
syncInputs('speaker-vol-slider', 'speaker-vol-num');

let lightsOn = false, heatingOn = false, deskLampOn = false, tvOn = false, fanOn = false, speakerOn = false, ecoModeOn = false;

function updateEnergyDraw() {
    let totalDraw = 0.30; 
    const isDeviceActive = (cardId, stateVar) => {
        const card = document.getElementById(cardId);
        if (!card || card.getAttribute('data-removed') === 'true' || card.getAttribute('data-offline') === 'true') return false;
        return stateVar;
    };

    if (isDeviceActive('light-card', lightsOn)) {
        const bright = parseInt(document.getElementById('brightness-slider').value) || 0;
        totalDraw += 0.05 * (bright / 100); 
    }
    if (isDeviceActive('heating-card', heatingOn)) { totalDraw += 2.00; }
    if (isDeviceActive('desk-lamp-card', deskLampOn)) {
        const bright = parseInt(document.getElementById('desk-lamp-slider').value) || 0;
        totalDraw += 0.01 * (bright / 100); 
    }
    if (isDeviceActive('tv-card', tvOn)) { totalDraw += 0.15; }
    if (isDeviceActive('fan-card', fanOn)) {
        const speed = parseInt(document.getElementById('fan-speed-slider').value) || 1;
        totalDraw += 0.04 * (speed / 10); 
    }
    if (isDeviceActive('speaker-card', speakerOn)) {
        const vol = parseInt(document.getElementById('speaker-vol-slider').value) || 0;
        totalDraw += 0.02 * (vol / 100); 
    }

    const currentDrawVal = document.getElementById('current-draw-val');
    if(currentDrawVal) currentDrawVal.textContent = totalDraw.toFixed(2);
    
    const statusEl = document.getElementById('current-draw-status');
    if(statusEl) {
        if (totalDraw > 2.3) {
            statusEl.textContent = 'High usage'; statusEl.style.color = '#d93025'; 
        } else if (totalDraw > 1.0) {
            statusEl.textContent = 'Moderate usage'; statusEl.style.color = '#f29900'; 
        } else {
            statusEl.textContent = 'Normal levels'; statusEl.style.color = '#34a853'; 
        }
    }
}

// --- 3. NODE ADMINISTRATION & GLOBAL BUTTONS (RESTORED!) ---
function setupDeviceMenu(renameOptId, nameElId) {
    const renameOpt = document.getElementById(renameOptId);
    const nameEl = document.getElementById(nameElId);
    if(!renameOpt || !nameEl) return;

    renameOpt.addEventListener('click', () => {
        const currentName = nameEl.textContent;
        const newName = prompt(`Enter a new name for ${currentName}:`, currentName);
        if (newName && newName.trim() !== "") {
            nameEl.textContent = newName.trim();
            addLog(`Device renamed to "${newName.trim()}".`);
            const toggleBtn = document.getElementById(nameElId.replace('-name', '-toggle-btn'));
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

function refreshGrid() {
    const activePill = document.querySelector('.pill.active');
    if(!activePill) return;
    const activeFilter = activePill.getAttribute('data-filter');
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

// THIS LISTENER WAS DELETED IN THE LAST VERSION! It handles Remove, Disconnect, and Favourites.
document.body.addEventListener('click', (e) => {
    // 1. Favourites
    if (e.target.closest('.fav-btn')) {
        const favBtn = e.target.closest('.fav-btn');
        const card = favBtn.closest('.device-card');
        const isFav = card.getAttribute('data-favorite') === 'true';
        const iconSpan = favBtn.querySelector('.fav-icon');

        if (isFav) {
            card.setAttribute('data-favorite', 'false');
            iconSpan.textContent = 'favorite_border'; iconSpan.style.color = '#ccc';
        } else {
            card.setAttribute('data-favorite', 'true');
            iconSpan.textContent = 'favorite'; iconSpan.style.color = '#1a73e8';
        }
        refreshGrid();
    }

    // 2. Remove Device
    if (e.target.closest('.remove-device-opt')) {
        const removeBtn = e.target.closest('.remove-device-opt');
        const card = removeBtn.closest('.device-card');
        if (confirm(`Are you sure you want to remove this from your Smart Home?`)) {
            card.setAttribute('data-removed', 'true');
            card.setAttribute('data-favorite', 'false');
            refreshGrid(); 
            updateEnergyDraw(); 
        }
    }

    // 3. Disconnect Network
    if (e.target.closest('.simulate-error-opt')) {
        const errorBtn = e.target.closest('.simulate-error-opt');
        const card = errorBtn.closest('.device-card');
        const deviceName = card.querySelector('h3').textContent;
        const statusEl = card.querySelector('.status');
        const toggleBtn = card.querySelector('.pro-btn');
        const isOffline = card.getAttribute('data-offline') === 'true';

        if (!isOffline) {
            card.setAttribute('data-offline', 'true');
            card.classList.add('offline');
            statusEl.textContent = 'OFFLINE';
            statusEl.style.background = 'rgba(217, 48, 37, 0.1)';
            statusEl.style.color = '#d93025';
            if(toggleBtn) toggleBtn.textContent = 'Connection Lost';
            errorBtn.innerHTML = 'Reconnect Network';
            addLog(`Connection lost to "${deviceName}".`);
            updateEnergyDraw(); 
        } else {
            statusEl.innerHTML = 'Reconnecting...';
            statusEl.style.color = '#f29900'; 
            if(toggleBtn) toggleBtn.textContent = 'Connecting...';
            errorBtn.innerHTML = 'Please wait...';
            errorBtn.style.pointerEvents = 'none'; 

            setTimeout(() => {
                card.setAttribute('data-offline', 'false');
                card.classList.remove('offline');
                
                let wasOn = false;
                if(card.id === 'light-card') wasOn = lightsOn;
                if(card.id === 'heating-card') wasOn = heatingOn;
                if(card.id === 'desk-lamp-card') wasOn = deskLampOn;
                if(card.id === 'tv-card') wasOn = tvOn;
                if(card.id === 'fan-card') wasOn = fanOn;
                if(card.id === 'speaker-card') wasOn = speakerOn;

                if (wasOn) {
                    statusEl.textContent = 'ON'; 
                    statusEl.style.color = '#e65100'; 
                    statusEl.style.background = 'rgba(230, 81, 0, 0.1)';
                    if(toggleBtn) toggleBtn.textContent = `Turn ${deviceName} OFF`;
                } else {
                    statusEl.textContent = 'OFF'; 
                    statusEl.style.color = '#5f6368';
                    statusEl.style.background = 'transparent';
                    if(toggleBtn) toggleBtn.textContent = `Turn ${deviceName} ON`;
                }
                
                errorBtn.innerHTML = 'Disconnect';
                errorBtn.style.pointerEvents = 'auto'; 
                addLog(`"${deviceName}" reconnected successfully.`);
                updateEnergyDraw(); 
            }, 2000); 
        }
    }
});


// --- 4. Room Lights ---
const lightCard = document.getElementById('light-card');
const toggleLightsBtn = document.getElementById('toggle-lights-btn');
const lightStatus = document.getElementById('light-status');
const lightNameEl = document.getElementById('light-name');
const brightnessSlider = document.getElementById('brightness-slider');
const brightnessNum = document.getElementById('brightness-num');

if(toggleLightsBtn) {
    toggleLightsBtn.addEventListener('click', () => {
        lightsOn = !lightsOn; 
        let currentName = lightNameEl.textContent;
        if (lightsOn) {
            if (brightnessSlider.value === "0") {
                brightnessSlider.value = 100;
                if(brightnessNum) brightnessNum.value = 100;
                updateSliderFill(brightnessSlider);
            }
            lightStatus.textContent = 'ON'; lightStatus.style.color = '#e65100'; lightStatus.style.background = 'rgba(230, 81, 0, 0.1)';
            toggleLightsBtn.textContent = `Turn ${currentName} OFF`;
            lightCard.classList.add('active-light'); 
        } else {
            brightnessSlider.value = 0;
            if(brightnessNum) brightnessNum.value = 0;
            updateSliderFill(brightnessSlider);
            lightStatus.textContent = 'OFF'; lightStatus.style.color = '#5f6368'; lightStatus.style.background = 'transparent';
            toggleLightsBtn.textContent = `Turn ${currentName} ON`;
            lightCard.classList.remove('active-light'); 
        }
        updateEnergyDraw(); 
    });
}
if(brightnessSlider) {
    brightnessSlider.addEventListener('change', (e) => {
        if (e.target.value === "0" && lightsOn) toggleLightsBtn.click(); 
        else if (e.target.value > "0" && !lightsOn) toggleLightsBtn.click();
        updateEnergyDraw(); 
    });
}

// --- 5. Heating System ---
const heatingCard = document.getElementById('heating-card');
const toggleHeatingBtn = document.getElementById('toggle-heating-btn');
const tempStatus = document.getElementById('temp-status');
const tempSlider = document.getElementById('temp-slider');
const ecoModeBtn = document.getElementById('eco-mode-btn');
const heatingNameEl = document.getElementById('heating-name');
let previousTemp = tempSlider ? tempSlider.value : 20; 

if(toggleHeatingBtn) {
    toggleHeatingBtn.addEventListener('click', () => {
        heatingOn = !heatingOn; 
        let currentName = heatingNameEl.textContent;
        if (heatingOn) {
            toggleHeatingBtn.textContent = `Turn ${currentName} OFF`;
            heatingCard.classList.add('active-heat'); 
            tempStatus.textContent = `${tempSlider.value}°C`; tempStatus.style.color = '#e65100'; tempStatus.style.background = 'rgba(230, 81, 0, 0.1)';
        } else {
            toggleHeatingBtn.textContent = `Turn ${currentName} ON`;
            heatingCard.classList.remove('active-heat'); 
            tempStatus.textContent = 'OFF'; tempStatus.style.color = '#5f6368'; tempStatus.style.background = 'transparent';
        }
        updateEnergyDraw();
    });
}
if(tempSlider) {
    tempSlider.addEventListener('input', (e) => {
        if (heatingOn) tempStatus.textContent = `${e.target.value}°C`;
        updateSliderFill(e.target);
    });
    tempSlider.addEventListener('change', () => { if(!heatingOn) toggleHeatingBtn.click(); updateEnergyDraw(); });
}
if(ecoModeBtn) {
    ecoModeBtn.addEventListener('click', () => {
        ecoModeOn = !ecoModeOn;
        if (ecoModeOn) {
            ecoModeBtn.textContent = 'Disable Eco'; ecoModeBtn.style.background = '#ceead6'; ecoModeBtn.style.color = '#137333';
            previousTemp = tempSlider.value; tempSlider.value = 18; tempSlider.disabled = true; updateSliderFill(tempSlider);
            if(heatingOn) tempStatus.textContent = `18°C`;
            const numBox = document.getElementById('temp-num'); if(numBox) { numBox.value = 18; numBox.disabled = true; }
        } else {
            ecoModeBtn.textContent = 'Enable Eco'; ecoModeBtn.style.background = '#f1f3f4'; ecoModeBtn.style.color = '#3c4043';
            tempSlider.disabled = false; tempSlider.value = previousTemp; updateSliderFill(tempSlider);
            if(heatingOn) tempStatus.textContent = `${previousTemp}°C`;
            const numBox = document.getElementById('temp-num'); if(numBox) { numBox.value = previousTemp; numBox.disabled = false; }
        }
    });
}

// --- 6. Desk Lamp & Timer ---
const deskLampCard = document.getElementById('desk-lamp-card');
const toggleDeskLampBtn = document.getElementById('toggle-desk-lamp-btn');
const deskLampStatus = document.getElementById('desk-lamp-status');
const lampNameEl = document.getElementById('lamp-name');
const deskLampSlider = document.getElementById('desk-lamp-slider');
const deskLampNum = document.getElementById('desk-lamp-num');

if(toggleDeskLampBtn) {
    toggleDeskLampBtn.addEventListener('click', () => {
        deskLampOn = !deskLampOn; 
        let currentName = lampNameEl.textContent;
        if (deskLampOn) {
            if (deskLampSlider.value === "0") {
                deskLampSlider.value = 100;
                if(deskLampNum) deskLampNum.value = 100;
                updateSliderFill(deskLampSlider);
            }
            deskLampStatus.textContent = 'ON'; deskLampStatus.style.color = '#e65100'; deskLampStatus.style.background = 'rgba(230, 81, 0, 0.1)';
            toggleDeskLampBtn.textContent = `Turn ${currentName} OFF`;
            deskLampCard.classList.add('active-light'); 
        } else {
            deskLampSlider.value = 0;
            if(deskLampNum) deskLampNum.value = 0;
            updateSliderFill(deskLampSlider);
            deskLampStatus.textContent = 'OFF'; deskLampStatus.style.color = '#5f6368'; deskLampStatus.style.background = 'transparent';
            toggleDeskLampBtn.textContent = `Turn ${currentName} ON`;
            deskLampCard.classList.remove('active-light'); 
        }
        updateEnergyDraw();
    });
}
if(deskLampSlider) {
    deskLampSlider.addEventListener('change', (e) => {
        if (e.target.value === "0" && deskLampOn) toggleDeskLampBtn.click(); 
        else if (e.target.value > "0" && !deskLampOn) toggleDeskLampBtn.click();
        updateEnergyDraw();
    });
}

let lampTimerInterval;
let isLampTimerRunning = false;
const lampTimerBtn = document.getElementById('desk-lamp-timer-btn');
const lampTimerSelect = document.getElementById('desk-lamp-timer-select');
const lampTimerDisplay = document.getElementById('desk-lamp-timer-display');

if(lampTimerBtn) {
    lampTimerBtn.addEventListener('click', () => {
        if (isLampTimerRunning) {
            clearInterval(lampTimerInterval);
            isLampTimerRunning = false;
            lampTimerDisplay.style.display = 'none';
            lampTimerBtn.textContent = 'Start Timer';
            lampTimerBtn.style.color = '';
        } else {
            let totalSeconds = parseInt(lampTimerSelect.value) * 60;
            isLampTimerRunning = true;
            lampTimerDisplay.style.display = 'block';
            lampTimerBtn.textContent = 'Cancel Timer';
            lampTimerBtn.style.color = '#d93025'; 
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
                    lampTimerBtn.style.color = '';
                    setTimeout(() => {
                        lampTimerDisplay.style.display = 'none';
                        if (deskLampOn) toggleDeskLampBtn.click(); 
                    }, 2000);
                }
            }, 1000);
        }
    });
}

// --- 7. Smart TV & Remote ---
const tvCard = document.getElementById('tv-card');
const toggleTvBtn = document.getElementById('toggle-tv-btn');
const tvStatus = document.getElementById('tv-status');
const tvVolSlider = document.getElementById('tv-vol-slider');
const tvNameEl = document.getElementById('tv-name');
const tvNowPlaying = document.getElementById('tv-now-playing');
const tvInputSelect = document.getElementById('tv-input');

const tvChannels = { 1: "Sky News", 2: "BBC One", 3: "ITV", 4: "Channel 4", 5: "Netflix", 6: "YouTube" };
let currentChannelNum = 6; 
let isMuted = false;
let preMuteVol = 15;

function updateTvDisplay() {
    if (!tvNowPlaying) return;
    if (!tvOn) { tvNowPlaying.style.display = 'none'; return; }
    
    tvNowPlaying.style.display = 'block';
    tvNowPlaying.style.marginTop = '4px';
    tvNowPlaying.style.marginLeft = '0px';

    let input = tvInputSelect ? tvInputSelect.value : "TV / Apps";
    if (input === "TV / Apps" || input === "Smart OS Stream") { 
        tvNowPlaying.textContent = `Playing: ${tvChannels[currentChannelNum]}`; 
    } 
    else if (input === "HDMI 1" || input === "PORT_HDMI_1") { tvNowPlaying.textContent = `Playing: HDMI 1`; } 
    else if (input === "HDMI 2" || input === "PORT_HDMI_2") { tvNowPlaying.textContent = `Playing: HDMI 2`; }
}

if(toggleTvBtn) {
    toggleTvBtn.addEventListener('click', () => {
        tvOn = !tvOn; 
        let currentName = tvNameEl.textContent;
        if (tvOn) {
            tvStatus.textContent = 'ON'; tvStatus.style.color = '#1a73e8'; tvStatus.style.background = 'rgba(26, 115, 232, 0.1)';
            toggleTvBtn.textContent = `Turn ${currentName} OFF`;
            tvCard.classList.add('active-media'); 
        } else {
            tvStatus.textContent = 'OFF'; tvStatus.style.color = '#5f6368'; tvStatus.style.background = 'transparent';
            toggleTvBtn.textContent = `Turn ${currentName} ON`;
            tvCard.classList.remove('active-media'); 
        }
        updateTvDisplay();
        updateEnergyDraw();
    });
}
if(tvInputSelect) tvInputSelect.addEventListener('change', () => { if (tvOn) updateTvDisplay(); });
if(tvVolSlider) tvVolSlider.addEventListener('change', (e) => { if(!tvOn && e.target.value > 0) toggleTvBtn.click(); updateEnergyDraw(); });

const chUp = document.getElementById('tv-ch-up');
if(chUp) {
    chUp.addEventListener('click', () => {
        if(!tvOn) return;
        let input = tvInputSelect ? tvInputSelect.value : "TV / Apps";
        if(input === "TV / Apps" || input === "Smart OS Stream") {
            currentChannelNum++; if(currentChannelNum > 6) currentChannelNum = 1; 
            updateTvDisplay(); 
        }
    });
}

const chDown = document.getElementById('tv-ch-down');
if(chDown) {
    chDown.addEventListener('click', () => {
        if(!tvOn) return;
        let input = tvInputSelect ? tvInputSelect.value : "TV / Apps";
        if(input === "TV / Apps" || input === "Smart OS Stream") {
            currentChannelNum--; if(currentChannelNum < 1) currentChannelNum = 6; 
            updateTvDisplay(); 
        }
    });
}

const volUp = document.getElementById('tv-vol-up');
if(volUp) {
    volUp.addEventListener('click', () => {
        if(!tvOn) return;
        let vol = parseInt(tvVolSlider.value);
        if(vol < 100) {
            tvVolSlider.value = vol + 5;
            updateSliderFill(tvVolSlider); 
            const numBox = document.getElementById('tv-vol-num'); if(numBox) numBox.value = tvVolSlider.value;
            updateEnergyDraw();
        }
    });
}

const volDown = document.getElementById('tv-vol-down');
if(volDown) {
    volDown.addEventListener('click', () => {
        if(!tvOn) return;
        let vol = parseInt(tvVolSlider.value);
        if(vol > 0) {
            tvVolSlider.value = vol - 5;
            updateSliderFill(tvVolSlider); 
            const numBox = document.getElementById('tv-vol-num'); if(numBox) numBox.value = tvVolSlider.value;
            updateEnergyDraw();
        }
    });
}

const muteBtn = document.getElementById('tv-mute');
if(muteBtn) {
    muteBtn.addEventListener('click', () => {
        if(!tvOn) return;
        isMuted = !isMuted;
        if (isMuted) {
            preMuteVol = tvVolSlider.value; tvVolSlider.value = 0;
            const numBox = document.getElementById('tv-vol-num'); if(numBox) numBox.value = 0;
        } else {
            tvVolSlider.value = preMuteVol;
            const numBox = document.getElementById('tv-vol-num'); if(numBox) numBox.value = preMuteVol;
        }
        updateSliderFill(tvVolSlider); 
        updateEnergyDraw();
    });
}

// --- 8. Add New Device Modal (RESTORED!) ---
const addDeviceBtn = document.getElementById('add-device-btn');
const addModal = document.getElementById('add-device-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const devicesListUl = document.getElementById('available-devices-list');

if(addDeviceBtn && addModal) {
    addDeviceBtn.addEventListener('click', () => {
        addModal.style.display = 'flex';
        document.getElementById('modal-state-searching').style.display = 'block'; 
        document.getElementById('modal-state-results').style.display = 'none'; 
        document.getElementById('modal-state-connecting').style.display = 'none';
        devicesListUl.innerHTML = ''; 

        // THIS IS HOW IT FINDS THE 2 HIDDEN DEVICES!
        const removedCards = document.querySelectorAll('.device-card[data-removed="true"], .device-card[style*="display: none"]');
        
        setTimeout(() => {
            document.getElementById('modal-state-searching').style.display = 'none'; 
            document.getElementById('modal-state-results').style.display = 'block';
            
            if (removedCards.length === 0) {
                document.getElementById('found-devices-text').textContent = 'No new devices found nearby.';
            } else {
                document.getElementById('found-devices-text').textContent = `Found ${removedCards.length} devices nearby:`;
                removedCards.forEach(card => {
                    const h3 = card.querySelector('h3');
                    const name = h3 ? h3.textContent : 'Unknown Device';
                    const iconEl = card.querySelector('.material-icons');
                    const icon = iconEl ? iconEl.textContent : 'memory';
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
                        <button class="connect-btn" style="background:transparent; color:#1a73e8; border:1px solid #dadce0; border-radius:16px; padding:6px 16px; font-weight:bold; cursor:pointer;" data-target="${cardId}">Connect</button>
                    `;
                    devicesListUl.appendChild(li);
                });
            }
        }, 1500); 
    });

    closeModalBtn.addEventListener('click', () => addModal.style.display = 'none');

    devicesListUl.addEventListener('click', (e) => {
        if (e.target.classList.contains('connect-btn')) {
            const targetId = e.target.getAttribute('data-target');
            document.getElementById('modal-state-results').style.display = 'none'; 
            document.getElementById('modal-state-connecting').style.display = 'block';
            setTimeout(() => {
                addModal.style.display = 'none';
                const card = document.getElementById(targetId);
                if(card) {
                    card.style.display = 'block'; 
                    card.setAttribute('data-removed', 'false');
                }
                const pill = document.querySelector('.pill[data-filter="all"]');
                if(pill) pill.click();
                updateEnergyDraw(); 
            }, 1500);
        }
    });
}


// --- 9. Fan & Speaker ---
const fanCard = document.getElementById('fan-card');
const toggleFanBtn = document.getElementById('toggle-fan-btn');
const fanStatus = document.getElementById('fan-status');
const fanNameEl = document.getElementById('fan-name');
const fanSlider = document.getElementById('fan-speed-slider');

if(toggleFanBtn) {
    toggleFanBtn.addEventListener('click', () => {
        fanOn = !fanOn; 
        if (fanOn) {
            fanStatus.textContent = 'ON'; fanStatus.style.color = '#e65100'; fanStatus.style.background = 'rgba(230, 81, 0, 0.1)';
            toggleFanBtn.textContent = `Turn ${fanNameEl.textContent} OFF`;
            fanCard.classList.add('active-heat'); 
        } else {
            fanStatus.textContent = 'OFF'; fanStatus.style.color = '#5f6368'; fanStatus.style.background = 'transparent';
            toggleFanBtn.textContent = `Turn ${fanNameEl.textContent} ON`;
            fanCard.classList.remove('active-heat'); 
        }
        updateEnergyDraw();
    });
}
if(fanSlider) fanSlider.addEventListener('change', () => { if(!fanOn) toggleFanBtn.click(); updateEnergyDraw(); });

const speakerCard = document.getElementById('speaker-card');
const toggleSpeakerBtn = document.getElementById('toggle-speaker-btn');
const speakerStatus = document.getElementById('speaker-status');
const speakerNameEl = document.getElementById('speaker-name');
const speakerSlider = document.getElementById('speaker-vol-slider');

if(toggleSpeakerBtn) {
    toggleSpeakerBtn.addEventListener('click', () => {
        speakerOn = !speakerOn; 
        if (speakerOn) {
            speakerStatus.textContent = 'ON'; speakerStatus.style.color = '#1a73e8'; speakerStatus.style.background = 'rgba(26, 115, 232, 0.1)';
            toggleSpeakerBtn.textContent = `Turn ${speakerNameEl.textContent} OFF`;
            speakerCard.classList.add('active-media'); 
        } else {
            speakerStatus.textContent = 'OFF'; speakerStatus.style.color = '#5f6368'; speakerStatus.style.background = 'transparent';
            toggleSpeakerBtn.textContent = `Turn ${speakerNameEl.textContent} ON`;
            speakerCard.classList.remove('active-media'); 
        }
        updateEnergyDraw();
    });
}
if(speakerSlider) speakerSlider.addEventListener('change', () => { if(!speakerOn) toggleSpeakerBtn.click(); updateEnergyDraw(); });

// --- 10. Automations ---
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
    if (routineType === 'morning') {
        return {
            trigger: 'time_morning',
            actions: [
                { device: 'light', state: 'on' },
                { device: 'heat', state: 'on' }
            ]
        };
    }

    if (routineType === 'leaving') {
        return {
            trigger: 'location_leave',
            actions: [
                { device: 'light', state: 'off' },
                { device: 'lamp', state: 'off' },
                { device: 'tv', state: 'off' },
                { device: 'fan', state: 'off' },
                { device: 'speaker', state: 'off' },
                { device: 'heat', state: 'on' }
            ]
        };
    }

    if (routineType === 'movie') {
        return {
            trigger: 'manual',
            actions: [
                { device: 'tv', state: 'on' },
                { device: 'light', state: 'on' }
            ]
        };
    }

    return { trigger: 'manual', actions: [] };
}

function populateAutomationModalForCard(card) {
    const runBtn = card.querySelector('.run-routine-btn');
    if (!runBtn) return;

    document.getElementById('auto-name-input').value = card.querySelector('h3')?.textContent || 'Custom Routine';
    document.getElementById('auto-modal-title').textContent = 'Edit Routine';
    document.getElementById('save-automation-btn').textContent = 'Save Changes';
    document.querySelectorAll('.auto-actions-list input[type="checkbox"]').forEach(cb => cb.checked = false);

    const trigger = runBtn.getAttribute('data-trigger') || getDefaultRoutineConfig(runBtn.getAttribute('data-routine')).trigger;
    document.getElementById('auto-trigger-select').value = trigger;

    updateAutomationModalDevices();

    const config = runBtn.hasAttribute('data-config')
        ? JSON.parse(runBtn.getAttribute('data-config'))
        : getDefaultRoutineConfig(runBtn.getAttribute('data-routine')).actions;

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

    if (action.device === 'light') {
        if ((action.state === 'on' && !lightsOn) || (action.state === 'off' && lightsOn)) document.getElementById('toggle-lights-btn')?.click();
    }
    if (action.device === 'heat') {
        if ((action.state === 'on' && !heatingOn) || (action.state === 'off' && heatingOn)) document.getElementById('toggle-heating-btn')?.click();
    }
    if (action.device === 'lamp') {
        if ((action.state === 'on' && !deskLampOn) || (action.state === 'off' && deskLampOn)) document.getElementById('toggle-desk-lamp-btn')?.click();
    }
    if (action.device === 'tv') {
        if ((action.state === 'on' && !tvOn) || (action.state === 'off' && tvOn)) document.getElementById('toggle-tv-btn')?.click();
    }
    if (action.device === 'fan') {
        if ((action.state === 'on' && !fanOn) || (action.state === 'off' && fanOn)) document.getElementById('toggle-fan-btn')?.click();
    }
    if (action.device === 'speaker') {
        if ((action.state === 'on' && !speakerOn) || (action.state === 'off' && speakerOn)) document.getElementById('toggle-speaker-btn')?.click();
    }
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
                <div class="complex-col-left">
                    <div class="form-group">
                        <label>RUN ACTION</label>
                        <button class="pro-btn run-routine-btn" data-config='${actionJSON}' data-trigger="${triggerVal}">Run Routine</button>
                    </div>
                    <div class="form-group">
                        <label>TRIGGER CONDITIONS</label>
                        <div class="dense-readout"><p>${triggerText}</p></div>
                    </div>
                </div>
                <div class="complex-col-right">
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

if (addAutoBtn && autoModal) {
    addAutoBtn.addEventListener('click', () => {
        editingCard = null;
        document.getElementById('auto-modal-title').textContent = 'Create Custom Routine';
        document.getElementById('save-automation-btn').textContent = 'Save Routine';
        document.getElementById('auto-name-input').value = '';
        document.getElementById('auto-trigger-select').value = 'manual';
        document.querySelectorAll('.auto-actions-list input[type="checkbox"]').forEach(cb => cb.checked = false);
        updateAutomationModalDevices();
        autoModal.style.display = 'flex';
    });
}

if (closeAutoModalBtn && autoModal) {
    closeAutoModalBtn.addEventListener('click', () => {
        autoModal.style.display = 'none';
        editingCard = null;
    });
}

if (saveAutoBtn) {
    saveAutoBtn.addEventListener('click', () => {
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
                headerInfo.innerHTML = `
                    <span class="material-icons" style="vertical-align: middle; color: #34a853;">auto_awesome</span>
                    <h3 style="display: inline-block; margin-left: 5px;">${name}</h3>
                `;
            }

            const triggerReadout = editingCard.querySelector('.complex-col-left .dense-readout');
            const paramsReadout = editingCard.querySelector('.complex-col-right .dense-readout');
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
}

if (routinesGrid) {
    routinesGrid.addEventListener('click', (e) => {
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

                if (customConfig) {
                    JSON.parse(customConfig).forEach(applyAutomationAction);
                } else if (routineType === 'morning') {
                    if (!lightsOn && document.getElementById('light-card')?.getAttribute('data-offline') === 'false') document.getElementById('toggle-lights-btn')?.click();
                    brightnessSlider.value = 70;
                    if (brightnessNum) brightnessNum.value = 70;
                    updateSliderFill(brightnessSlider);

                    if (!heatingOn && document.getElementById('heating-card')?.getAttribute('data-offline') === 'false') document.getElementById('toggle-heating-btn')?.click();
                    const tempSliderEl = document.getElementById('temp-slider');
                    const tempNumEl = document.getElementById('temp-num');
                    if (ecoModeOn) document.getElementById('eco-mode-btn')?.click();
                    if (tempSliderEl) tempSliderEl.value = 22;
                    if (tempNumEl) tempNumEl.value = 22;
                    if (tempStatus) { tempStatus.textContent = '22°C'; tempStatus.style.color = '#e65100'; tempStatus.style.background = 'rgba(230, 81, 0, 0.1)'; }
                    if (tempSliderEl) updateSliderFill(tempSliderEl);
                } else if (routineType === 'leaving') {
                    if (lightsOn && document.getElementById('light-card')?.getAttribute('data-offline') === 'false') document.getElementById('toggle-lights-btn')?.click();
                    if (deskLampOn && document.getElementById('desk-lamp-card')?.getAttribute('data-offline') === 'false') document.getElementById('toggle-desk-lamp-btn')?.click();
                    if (tvOn && document.getElementById('tv-card')?.getAttribute('data-offline') === 'false') document.getElementById('toggle-tv-btn')?.click();
                    if (fanOn && document.getElementById('fan-card')?.getAttribute('data-offline') === 'false') document.getElementById('toggle-fan-btn')?.click();
                    if (speakerOn && document.getElementById('speaker-card')?.getAttribute('data-offline') === 'false') document.getElementById('toggle-speaker-btn')?.click();
                    if (!heatingOn && document.getElementById('heating-card')?.getAttribute('data-offline') === 'false') document.getElementById('toggle-heating-btn')?.click();
                    if (!ecoModeOn) document.getElementById('eco-mode-btn')?.click();
                } else if (routineType === 'movie') {
                    if (!lightsOn && document.getElementById('light-card')?.getAttribute('data-offline') === 'false') document.getElementById('toggle-lights-btn')?.click();
                    brightnessSlider.value = 10;
                    if (brightnessNum) brightnessNum.value = 10;
                    updateSliderFill(brightnessSlider);

                    if (!tvOn && document.getElementById('tv-card')?.getAttribute('data-offline') === 'false') document.getElementById('toggle-tv-btn')?.click();
                }

                updateEnergyDraw();
                btn.textContent = originalText;
                btn.style.backgroundColor = '';
                btn.style.color = '';
            }, 1000);
        }
    });
}

// --- 11. Navigation & Dark Mode ---
const navHome = document.getElementById('nav-home');
const navActivity = document.getElementById('nav-activity');
const navEnergy = document.getElementById('nav-energy');
const navAutomations = document.getElementById('nav-automations');

const homeView = document.getElementById('home-view');
const activityView = document.getElementById('activity-view');
const energyView = document.getElementById('energy-view');
const automationsView = document.getElementById('automations-view');

const headerAddDeviceBtn = document.getElementById('add-device-btn');
const headerAddAutomationBtn = document.getElementById('add-automation-btn');
const headerEditLayoutBtn = document.getElementById('edit-layout-btn');

function switchView(activeNav, viewToShow) {
    [navHome, navActivity, navEnergy, navAutomations].forEach(nav => nav?.classList.remove('active'));
    [homeView, activityView, energyView, automationsView].forEach(view => { if (view) view.style.display = 'none'; });

    activeNav?.classList.add('active');
    if (viewToShow) viewToShow.style.display = 'block';

    if (headerAddDeviceBtn) headerAddDeviceBtn.style.display = (viewToShow === homeView) ? 'flex' : 'none';
    if (headerEditLayoutBtn) headerEditLayoutBtn.style.display = (viewToShow === homeView) ? 'flex' : 'none';
    if (headerAddAutomationBtn) headerAddAutomationBtn.style.display = (viewToShow === automationsView) ? 'flex' : 'none';

    if (viewToShow !== homeView && isEditMode && typeof document.getElementById('edit-layout-btn') !== 'undefined') {
        document.getElementById('edit-layout-btn')?.click();
    }
}

navHome?.addEventListener('click', () => switchView(navHome, homeView));
navActivity?.addEventListener('click', () => switchView(navActivity, activityView));
navEnergy?.addEventListener('click', () => switchView(navEnergy, energyView));
navAutomations?.addEventListener('click', () => switchView(navAutomations, automationsView));

const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeIcon = document.getElementById('theme-icon');
if(themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if(themeIcon) themeIcon.textContent = document.body.classList.contains('dark-mode') ? 'light_mode' : 'dark_mode';
    });
}

// --- 12. EDIT LAYOUT & DRAG AND DROP (DESKTOP + IPAD SUPPORT) ---
const homeGrid = document.querySelector('#home-view .device-grid');
const filtersContainer = document.querySelector('.filters'); 
const macrosContainer = document.querySelector('.macro-container'); 
const editLayoutBtn = document.getElementById('edit-layout-btn'); 

function shouldInsertAfter(mode, rect, clientX, clientY) {
    if (mode === 'horizontal') {
        return clientX > rect.left + (rect.width / 2);
    }

    const middleY = rect.top + (rect.height / 2);
    const middleX = rect.left + (rect.width / 2);
    return clientY > middleY ||
           (Math.abs(clientY - middleY) < rect.height / 4 && clientX > middleX);
}

function findNearestReorderTarget(container, selector, draggingItem, clientX, clientY) {
    const containerRect = container.getBoundingClientRect();
    const withinContainerBounds = (
        clientX >= containerRect.left - 40 &&
        clientX <= containerRect.right + 40 &&
        clientY >= containerRect.top - 40 &&
        clientY <= containerRect.bottom + 40
    );

    if (!withinContainerBounds) return null;

    const candidates = Array.from(container.querySelectorAll(selector)).filter(item => (
        item !== draggingItem
    ));

    if (!candidates.length) return null;

    return candidates.reduce((closest, item) => {
        const rect = item.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const distance = Math.hypot(dx, dy);

        if (!closest || distance < closest.distance) {
            return { item, distance };
        }
        return closest;
    }, null)?.item || null;
}

if(editLayoutBtn) {
    editLayoutBtn.addEventListener('click', () => {
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
            if(macrosContainer) macrosContainer.classList.add('edit-mode'); 
            
            cards.forEach(card => card.setAttribute('draggable', 'true'));
            pillsList.forEach(pill => pill.setAttribute('draggable', 'true')); 
            if(macrosContainer) macroBtns.forEach(btn => btn.setAttribute('draggable', 'true')); 
        } else {
            editLayoutBtn.innerHTML = '<span class="material-icons">edit</span> Edit Layout';
            editLayoutBtn.style.backgroundColor = ''; 
            editLayoutBtn.style.color = ''; 
            
            homeGrid.classList.remove('edit-mode');
            filtersContainer.classList.remove('edit-mode'); 
            if(macrosContainer) macrosContainer.classList.remove('edit-mode'); 
            
            cards.forEach(card => card.removeAttribute('draggable'));
            pillsList.forEach(pill => pill.removeAttribute('draggable')); 
            if(macrosContainer) macroBtns.forEach(btn => btn.removeAttribute('draggable')); 
        }
    });

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

            let hover = e.target.closest(`${selector}:not(.dragging)`);
            if (!hover || !container.contains(hover)) {
                hover = findNearestReorderTarget(container, selector, dragging, e.clientX, e.clientY);
            }
            if (!hover) return;

            const rect = hover.getBoundingClientRect();
            const insertAfter = shouldInsertAfter(mode, rect, e.clientX, e.clientY);
            if (insertAfter) hover.after(dragging);
            else hover.before(dragging);
        });
    }

    setupDragAndDrop(homeGrid, '.device-card', 'grid');
    setupDragAndDrop(filtersContainer, '.pill', 'horizontal');
    setupDragAndDrop(macrosContainer, '.macro-btn', 'grid');
}

// --- 12b. TOUCH / IPAD DRAG-AND-DROP SUPPORT ---
function setupTouchReorder(container, selector, mode) {
    if (!container) return;

    let draggingItem = null;
    let placeholder = null;
    let activePointerId = null;
    let offsetX = 0;
    let offsetY = 0;
    let cleanupTimer = null;
    let rafId = null;
    let pendingLeft = 0;
    let pendingTop = 0;

    const applyDragPosition = () => {
        rafId = null;
        if (!draggingItem) return;
        draggingItem.style.left = `${pendingLeft}px`;
        draggingItem.style.top = `${pendingTop}px`;
    };

    const queueDragPosition = (left, top) => {
        pendingLeft = left;
        pendingTop = top;
        if (rafId === null) {
            rafId = requestAnimationFrame(applyDragPosition);
        }
    };

    const cleanupDraggingStyles = () => {
        if (!draggingItem) return;
        draggingItem.classList.remove('dragging', 'touch-dragging');
        draggingItem.style.position = '';
        draggingItem.style.left = '';
        draggingItem.style.top = '';
        draggingItem.style.width = '';
        draggingItem.style.height = '';
        draggingItem.style.zIndex = '';
        draggingItem.style.pointerEvents = '';
        draggingItem.style.margin = '';
        draggingItem.style.transform = '';
        draggingItem.style.transition = '';
        draggingItem.style.boxSizing = '';
    };

    const clearTouchDrag = (pointerId = null) => {
        if (!draggingItem) return;
        if (pointerId !== null && activePointerId !== pointerId) return;

        const item = draggingItem;
        const targetPlaceholder = placeholder;
        const finishCleanup = () => {
            if (cleanupTimer) {
                clearTimeout(cleanupTimer);
                cleanupTimer = null;
            }
            cleanupDraggingStyles();
            if (targetPlaceholder && targetPlaceholder.parentNode) {
                targetPlaceholder.parentNode.insertBefore(item, targetPlaceholder);
                targetPlaceholder.remove();
            }
            draggingItem = null;
            placeholder = null;
            activePointerId = null;
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        };

        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }

        if (targetPlaceholder && targetPlaceholder.parentNode) {
            const targetRect = targetPlaceholder.getBoundingClientRect();
            item.style.transition = 'left 180ms ease, top 180ms ease, transform 180ms ease, box-shadow 180ms ease';
            item.style.left = `${targetRect.left}px`;
            item.style.top = `${targetRect.top}px`;
            item.style.transform = 'scale(1) rotate(0deg)';
            cleanupTimer = setTimeout(finishCleanup, 190);
        } else {
            finishCleanup();
        }
    };

    container.addEventListener('pointerdown', (e) => {
        if (!isEditMode) return;
        if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;

        const item = e.target.closest(selector);
        if (!item || !container.contains(item)) return;

        const rect = item.getBoundingClientRect();
        const computed = window.getComputedStyle(item);

        draggingItem = item;
        activePointerId = e.pointerId;
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        placeholder = document.createElement('div');
        placeholder.className = 'drag-placeholder';
        if (item.classList.contains('device-card')) placeholder.classList.add('device-card-placeholder');
        if (item.classList.contains('pill')) placeholder.classList.add('pill-placeholder');
        if (item.classList.contains('macro-btn')) placeholder.classList.add('macro-btn-placeholder');
        placeholder.style.width = `${rect.width}px`;
        placeholder.style.height = `${rect.height}px`;
        placeholder.style.borderRadius = computed.borderRadius;
        placeholder.style.boxSizing = 'border-box';

        item.after(placeholder);

        item.classList.add('dragging', 'touch-dragging');
        item.style.position = 'fixed';
        item.style.left = `${rect.left}px`;
        item.style.top = `${rect.top}px`;
        item.style.width = `${rect.width}px`;
        item.style.height = `${rect.height}px`;
        item.style.margin = '0';
        item.style.zIndex = '3000';
        item.style.pointerEvents = 'none';
        item.style.boxSizing = 'border-box';
        item.style.transition = 'transform 180ms ease, box-shadow 180ms ease';
        item.style.transform = 'scale(1.03) rotate(-1deg)';

        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';

        if (draggingItem.setPointerCapture) {
            try { draggingItem.setPointerCapture(e.pointerId); } catch (_) {}
        }

        e.preventDefault();
    }, { passive: false });

    document.addEventListener('pointermove', (e) => {
        if (!isEditMode || !draggingItem || activePointerId !== e.pointerId) return;

        queueDragPosition(e.clientX - offsetX, e.clientY - offsetY);

        const elementUnderPointer = document.elementFromPoint(e.clientX, e.clientY);
        let hoverItem = elementUnderPointer?.closest(selector);

        if (hoverItem && (hoverItem === draggingItem || hoverItem === placeholder || !container.contains(hoverItem))) {
            hoverItem = null;
        }

        if (!hoverItem) {
            hoverItem = findNearestReorderTarget(container, selector, draggingItem, e.clientX, e.clientY);
        }

        if (!hoverItem) {
            e.preventDefault();
            return;
        }

        const rect = hoverItem.getBoundingClientRect();
        const insertAfter = shouldInsertAfter(mode, rect, e.clientX, e.clientY);

        if (insertAfter) hoverItem.after(placeholder);
        else hoverItem.before(placeholder);

        e.preventDefault();
    }, { passive: false });

    document.addEventListener('pointerup', (e) => clearTouchDrag(e.pointerId));
    document.addEventListener('pointercancel', (e) => clearTouchDrag(e.pointerId));
}

setupTouchReorder(homeGrid, '.device-card', 'grid');
setupTouchReorder(filtersContainer, '.pill', 'horizontal');
setupTouchReorder(macrosContainer, '.macro-btn', 'grid');

const pillsBtns = document.querySelectorAll('.pill');
pillsBtns.forEach(pill => {
    pill.addEventListener('click', (e) => {
        if (isEditMode) { e.preventDefault(); return; }
        pillsBtns.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        refreshGrid();
    });
});

// --- 13. QUICK MACROS ---
document.addEventListener('click', (e) => {
    if(e.target.closest('#macro-all-off')) {
        if(isEditMode) return;
        const devices = ['toggle-lights-btn', 'toggle-heating-btn', 'toggle-desk-lamp-btn', 'toggle-tv-btn', 'toggle-fan-btn', 'toggle-speaker-btn'];
        const states = [lightsOn, heatingOn, deskLampOn, tvOn, fanOn, speakerOn];
        devices.forEach((id, i) => { if(states[i]) document.getElementById(id)?.click(); });
    }
    if(e.target.closest('#macro-all-on')) {
        if(isEditMode) return;
        const devices = ['toggle-lights-btn', 'toggle-heating-btn', 'toggle-desk-lamp-btn', 'toggle-tv-btn', 'toggle-fan-btn', 'toggle-speaker-btn'];
        const states = [lightsOn, heatingOn, deskLampOn, tvOn, fanOn, speakerOn];
        devices.forEach((id, i) => { if(!states[i]) document.getElementById(id)?.click(); });
    }
    if(e.target.closest('#macro-lights-off')) {
        if(isEditMode) return;
        if(lightsOn) document.getElementById('toggle-lights-btn')?.click();
        if(deskLampOn) document.getElementById('toggle-desk-lamp-btn')?.click();
    }
    if(e.target.closest('#macro-lights-on')) {
        if(isEditMode) return;
        if(!lightsOn) document.getElementById('toggle-lights-btn')?.click();
        if(!deskLampOn) document.getElementById('toggle-desk-lamp-btn')?.click();
    }
    if(e.target.closest('#macro-eco')) {
        if(isEditMode) return;
        if(!heatingOn) document.getElementById('toggle-heating-btn')?.click();
        if(!ecoModeOn) document.getElementById('eco-mode-btn')?.click();
    }
});



updateEnergyDraw();


// --- 14. ACTIVITY LOG ENHANCEMENTS ---
function getSafeText(el, fallback = 'Device') {
    return el ? el.textContent.trim() : fallback;
}

function queueLog(message, delay = 0) {
    window.setTimeout(() => addLog(message), delay);
}

// Device power toggles
[
    [toggleLightsBtn, () => `${getSafeText(lightNameEl, 'Room Lights')} turned ${lightsOn ? 'ON' : 'OFF'}.`],
    [toggleHeatingBtn, () => `${getSafeText(heatingNameEl, 'Heating System')} turned ${heatingOn ? 'ON' : 'OFF'}.`],
    [toggleDeskLampBtn, () => `${getSafeText(lampNameEl, 'Desk Lamp')} turned ${deskLampOn ? 'ON' : 'OFF'}.`],
    [toggleTvBtn, () => `${getSafeText(tvNameEl, 'Smart TV')} turned ${tvOn ? 'ON' : 'OFF'}.`],
    [toggleFanBtn, () => `${getSafeText(fanNameEl, 'Dyson Pure Cool')} turned ${fanOn ? 'ON' : 'OFF'}.`],
    [toggleSpeakerBtn, () => `${getSafeText(speakerNameEl, 'Sonos One')} turned ${speakerOn ? 'ON' : 'OFF'}.`]
].forEach(([btn, getMessage]) => {
    btn?.addEventListener('click', () => queueLog(getMessage()));
});

// Settings changes
brightnessSlider?.addEventListener('change', () => queueLog(`${getSafeText(lightNameEl, 'Room Lights')} brightness set to ${brightnessSlider.value}%.`, 0));
deskLampSlider?.addEventListener('change', () => queueLog(`${getSafeText(lampNameEl, 'Desk Lamp')} brightness set to ${deskLampSlider.value}%.`, 0));
tempSlider?.addEventListener('change', () => queueLog(`${getSafeText(heatingNameEl, 'Heating System')} target set to ${tempSlider.value}°C.`, 0));
tvVolSlider?.addEventListener('change', () => queueLog(`${getSafeText(tvNameEl, 'Smart TV')} volume set to ${tvVolSlider.value}.`, 0));
fanSlider?.addEventListener('change', () => queueLog(`${getSafeText(fanNameEl, 'Dyson Pure Cool')} fan speed set to ${fanSlider.value}.`, 0));
speakerVolSlider?.addEventListener('change', () => queueLog(`${getSafeText(speakerNameEl, 'Sonos One')} volume set to ${speakerVolSlider.value}.`, 0));
tvInputSelect?.addEventListener('change', () => queueLog(`${getSafeText(tvNameEl, 'Smart TV')} input changed to ${tvInputSelect.value.replace('PORT_', '').replaceAll('_', ' ')}.`));
ecoModeBtn?.addEventListener('click', () => queueLog(`Eco mode ${ecoModeOn ? 'enabled' : 'disabled'} for ${getSafeText(heatingNameEl, 'Heating System')}.`));
themeToggleBtn?.addEventListener('click', () => queueLog(`Theme switched to ${document.body.classList.contains('dark-mode') ? 'Dark Mode' : 'Light Mode'}.`));
editLayoutBtn?.addEventListener('click', () => queueLog(`Layout edit mode ${isEditMode ? 'enabled' : 'disabled'}.`));

lampTimerBtn?.addEventListener('click', () => {
    queueLog(isLampTimerRunning
        ? `${getSafeText(lampNameEl, 'Desk Lamp')} timer started for ${lampTimerSelect?.selectedOptions?.[0]?.textContent || 'selected duration'}.`
        : `${getSafeText(lampNameEl, 'Desk Lamp')} timer cancelled.`);
});

// Remote controls
chUp?.addEventListener('click', () => { if (tvOn) queueLog(`${getSafeText(tvNameEl, 'Smart TV')} channel changed to ${tvChannels[currentChannelNum]}.`); });
chDown?.addEventListener('click', () => { if (tvOn) queueLog(`${getSafeText(tvNameEl, 'Smart TV')} channel changed to ${tvChannels[currentChannelNum]}.`); });
volUp?.addEventListener('click', () => { if (tvOn) queueLog(`${getSafeText(tvNameEl, 'Smart TV')} volume increased to ${tvVolSlider.value}.`); });
volDown?.addEventListener('click', () => { if (tvOn) queueLog(`${getSafeText(tvNameEl, 'Smart TV')} volume decreased to ${tvVolSlider.value}.`); });
muteBtn?.addEventListener('click', () => { if (tvOn) queueLog(`${getSafeText(tvNameEl, 'Smart TV')} ${isMuted ? 'muted' : 'unmuted'}.`); });

// Delegated logging for favourites/removal/adding devices
let pendingConnectDeviceName = null;
devicesListUl?.addEventListener('click', (e) => {
    const connectBtn = e.target.closest('.connect-btn');
    if (!connectBtn) return;
    const item = connectBtn.closest('.device-list-item');
    pendingConnectDeviceName = item?.querySelector('strong')?.textContent?.trim() || 'Device';
    queueLog(`Device "${pendingConnectDeviceName}" added to the dashboard.`, 1600);
});

document.body.addEventListener('click', (e) => {
    const favBtn = e.target.closest('.fav-btn');
    if (favBtn) {
        const card = favBtn.closest('.device-card');
        const name = card?.querySelector('h3')?.textContent?.trim() || 'Device';
        const isFav = card?.getAttribute('data-favorite') === 'true';
        queueLog(`${name} ${isFav ? 'added to' : 'removed from'} favourites.`);
    }

    const removeBtn = e.target.closest('.remove-device-opt');
    if (removeBtn) {
        const card = removeBtn.closest('.device-card');
        const name = card?.querySelector('h3')?.textContent?.trim() || 'Device';
        window.setTimeout(() => {
            if (card?.getAttribute('data-removed') === 'true') addLog(`Device "${name}" removed from the dashboard.`);
        }, 0);
    }

    if (e.target.closest('#macro-all-off') && !isEditMode) queueLog('Macro executed: System Power OFF.');
    if (e.target.closest('#macro-all-on') && !isEditMode) queueLog('Macro executed: System Power ON.');
    if (e.target.closest('#macro-lights-off') && !isEditMode) queueLog('Macro executed: Lights OFF.');
    if (e.target.closest('#macro-lights-on') && !isEditMode) queueLog('Macro executed: Lights ON.');
    if (e.target.closest('#macro-eco') && !isEditMode) queueLog('Macro executed: HVAC Eco.');
});

// Log default starting state once the page is ready
window.setTimeout(() => {
    if (logList && logList.querySelectorAll('li').length === 1 && document.getElementById('initial-log')) {
        addLog('System ready. Waiting for user actions.');
    }
}, 0);
