'use strict';

// --- SCRIPT LOGIC ---
let isProLayoutActive = localStorage.getItem('isProLayoutActive') !== 'false';
let proLayoutObserver = null;
let currentCode = '';

let syncLocalActive = false;
let syncLocalInterval = null;
let syncLocalLastModified = 0;

let syncOnlineActive = false;
let syncOnlineFileHandle = null;

function fileSystemAccessApiAvailable() {
    return 'showOpenFilePicker' in self  // Check if the File System Access API is available in the current browser
}

// --- PRO LAYOUT FUNCTIONALITY --
function activateProLayout() {
    document.body.classList.add('pro-layout-active');

    const statementBlock = document.querySelector('.statement-bloc');
    const consoleBlock = document.querySelector('.console-bloc');
    const actionsBlock = document.querySelector('.testcases-actions-container');
    if (!consoleBlock || !actionsBlock) return;

    const unminimizeButton = document.querySelector('.console-bloc .unminimize-button');
    if (unminimizeButton) unminimizeButton.click();
    const consoleHeaderButtons = document.querySelector('.console-bloc .header-buttons');
    if (consoleHeaderButtons) consoleHeaderButtons.style.display = 'none';

    const syncPanelPosition = () => {
        if (!isProLayoutActive) return;
        const targetLeft = actionsBlock.style.left;
        if (targetLeft && consoleBlock.style.left !== targetLeft) {
            consoleBlock.style.left = targetLeft;
        }

        const targetRight = statementBlock.style.right;
        if (targetRight && actionsBlock.style.right !== targetRight) {
            actionsBlock.style.right = targetRight;
        }
    };

    proLayoutObserver = new MutationObserver(syncPanelPosition);
    proLayoutObserver.observe(actionsBlock, {attributes: true, attributeFilter: ['style']});
    syncPanelPosition();
}


function deactivateProLayout() {
    document.body.classList.remove('pro-layout-active');

    if (proLayoutObserver) {
        proLayoutObserver.disconnect();
        proLayoutObserver = null;
    }

    const consoleBlock = document.querySelector('.console-bloc');
    if (consoleBlock) consoleBlock.style.left = '';
    const consoleHeaderButtons = document.querySelector('.console-bloc .header-buttons');
    if (consoleHeaderButtons) consoleHeaderButtons.style.display = '';
    const actionsBlock = document.querySelector('.testcases-actions-container');
    if (actionsBlock) actionsBlock.style.right = '';
}


function createProLayoutToggleButton() {
    const menuContainer = document.querySelector('.menu-entries');
    if (!menuContainer) return;

    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" class="pro-icon"><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z"/></svg>`;
    const menuEntryDiv = document.createElement('div');
    menuEntryDiv.className = 'menu-entry pro-layout-entry';
    const button = document.createElement('button');
    button.className = 'menu-entry-inner';
    const iconElement = document.createElement('div');
    iconElement.innerHTML = iconSvg;
    const span = document.createElement('span');
    span.className = 'entry-label';
    span.textContent = 'Pro Layout';
    button.appendChild(iconElement.firstChild);
    button.appendChild(span);
    menuEntryDiv.appendChild(button);

    function updateButtonAppearance() {
        button.classList.toggle('selected', isProLayoutActive);
    }

    button.onclick = () => {
        isProLayoutActive = !isProLayoutActive;
        localStorage.setItem('isProLayoutActive', isProLayoutActive);
        isProLayoutActive ? activateProLayout() : deactivateProLayout();
        updateButtonAppearance();
    };
    const settingsEntry = menuContainer.querySelector('.menu-entry.settings');
    if (settingsEntry) {
        settingsEntry.insertAdjacentElement('afterend', menuEntryDiv);
    } else {
        menuContainer.appendChild(menuEntryDiv);
    }
    updateButtonAppearance();
}

// --- PRO LAYOUT FUNCTIONALITY ---


// --- UPLOAD CODE FUNCTIONALITY ---
// --- CURRENTLY UNUSED

function createUploadCodeButton() {
    const menuContainer = document.querySelector('.menu-entries');
    if (!menuContainer) return;

    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="pro-icon" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/></svg>`;
    const menuEntryDiv = document.createElement('div');
    menuEntryDiv.className = 'menu-entry load-file-entry';
    const button = document.createElement('button');
    button.className = 'menu-entry-inner';
    const iconElement = document.createElement('div');
    iconElement.innerHTML = iconSvg;
    const span = document.createElement('span');
    span.className = 'entry-label';
    span.textContent = 'Upload Code';
    button.appendChild(iconElement.firstChild);
    button.appendChild(span);
    menuEntryDiv.appendChild(button);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    button.onclick = () => fileInput.click();
    fileInput.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => updateEditorCode(e.target.result);
        reader.readAsText(file);
        event.target.value = '';
    };
    menuEntryDiv.appendChild(fileInput);

    const layoutToggleEntry = menuContainer.querySelector('.menu-entry.settings');
    if (layoutToggleEntry) {
        layoutToggleEntry.insertAdjacentElement('afterend', menuEntryDiv);
    } else {
        menuContainer.appendChild(menuEntryDiv);
    }
}

// --- UPLOAD CODE FUNCTIONALITY ---


// A cloud with a DOWN arrow (from your new reference)
const iconDownSvg = `<svg fill="currentColor" viewBox="0 0 24 24" class="pro-icon" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" opacity="0"/>
    <path d="M17.67 7A6 6 0 0 0 6.33 7a5 5 0 0 0-3.08 8.27A1 1 0 1 0 4.75 14 3 3 0 0 1 7 9h.1a1 1 0 0 0 1-.8 4 4 0 0 1 7.84 0 1 1 0 0 0 1 .8H17a3 3 0 0 1 2.25 5 1 1 0 0 0 .09 1.42 1 1 0 0 0 .66.25 1 1 0 0 0 .75-.34A5 5 0 0 0 17.67 7z"/>
    <path d="M14.31 16.38L13 17.64V12a1 1 0 0 0-2 0v5.59l-1.29-1.3a1 1 0 0 0-1.42 1.42l3 3A1 1 0 0 0 12 21a1 1 0 0 0 .69-.28l3-2.9a1 1 0 1 0-1.38-1.44z"/>
</svg>`;

// A cloud with an UP arrow (arrow path is rotated 180 degrees)
const iconUpSvg = `<svg fill="currentColor" viewBox="0 0 24 24" class="pro-icon" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" opacity="0"/>
    <path d="M17.67 7A6 6 0 0 0 6.33 7a5 5 0 0 0-3.08 8.27A1 1 0 1 0 4.75 14 3 3 0 0 1 7 9h.1a1 1 0 0 0 1-.8 4 4 0 0 1 7.84 0 1 1 0 0 0 1 .8H17a3 3 0 0 1 2.25 5 1 1 0 0 0 .09 1.42 1 1 0 0 0 .66.25 1 1 0 0 0 .75-.34A5 5 0 0 0 17.67 7z"/>
    <path d="M14.31 16.38L13 17.64V12a1 1 0 0 0-2 0v5.59l-1.29-1.3a1 1 0 0 0-1.42 1.42l3 3A1 1 0 0 0 12 21a1 1 0 0 0 .69-.28l3-2.9a1 1 0 1 0-1.38-1.44z" transform="rotate(180, 12, 16.5)"/>
</svg>`;


function updateTimestampDisplay() {
    let codeTimestamp = document.querySelector(".code-timestamp");
    if (!codeTimestamp) {
        const codeManagement = document.querySelector(".ide-header");
        if (codeManagement) {
            codeTimestamp = document.createElement('div');
            codeTimestamp.className = 'code-timestamp';
            codeManagement.appendChild(codeTimestamp);
        } else return;
    }

    const start = new Date(Date.now());
    codeTimestamp.textContent = 'Last synchronized: ' + start.toLocaleString();
}

function maybe_remove_timestamp() {
    let codeTimestamp = document.querySelector(".code-timestamp");
    if (codeTimestamp && !syncOnlineActive && !syncLocalActive) codeTimestamp.remove();
}


// --- SYNC LOCAL FUNCTIONALITY ---
function updateEditorCode(code) {
    if (code && code !== currentCode) {
        console.log("Updating editor code...");

        currentCode = code;
        const eventData = {status: 'updateCode', code: code.replace(/\r\n|\r/g, '\n')};
        const ev = new CustomEvent('ExternalEditorToIDE', {detail: eventData});
        window.document.dispatchEvent(ev);
        updateTimestampDisplay();
    }
}


// Observes the file for changes and updates the editor
async function observeFileForSyncLocal(handle) {
    // Immediately update with the initial content
    const initialFile = await handle.getFile();
    syncLocalLastModified = initialFile.lastModified;
    updateEditorCode(await initialFile.text());

    syncLocalInterval = setInterval(async () => {
        try {
            if ((await handle.queryPermission({mode: 'read'})) !== 'granted') {
                stopSyncLocalProcess(); // Stop if permission is revoked
                return;
            }

            const file = await handle.getFile();
            if (file.lastModified > syncLocalLastModified) {
                syncLocalLastModified = file.lastModified;
                updateEditorCode(await file.text());
            }
        } catch (error) {
            console.error("Error observing file, stopping sync.", error);
            stopSyncLocalProcess();
        }
    }, 500);
}

// Starts the sync process
async function startSyncLocalProcess() {
    try {
        const [newHandle] = await window.showOpenFilePicker();
        syncLocalActive = true;

        const button = document.querySelector('.sync-local-entry .menu-entry-inner');
        if (button) button.classList.toggle('selected', true);
        await observeFileForSyncLocal(newHandle);
    } catch (err) {
        if (err.name !== 'AbortError') console.error(err);
    }
}

// Stops the sync process
function stopSyncLocalProcess() {
    if (!syncLocalActive) return;

    if (syncLocalInterval) {
        clearInterval(syncLocalInterval);
        syncLocalInterval = null;
    }
    syncLocalActive = false;

    const button = document.querySelector('.sync-local-entry .menu-entry-inner');
    if (button) button.classList.toggle('selected', false);

}


function createSyncLocalButton() {
    const menuContainer = document.querySelector('.menu-entries');
    if (!menuContainer) return;

    const menuEntryDiv = document.createElement('div');
    menuEntryDiv.className = 'menu-entry sync-local-entry';

    const button = document.createElement('button');
    button.className = 'menu-entry-inner';

    button.onclick = () => {
        if (fileSystemAccessApiAvailable() === false) {
            alert("File System Access API not available. To use this feature, enable:\n\nchrome://flags/#file-system-access-api");
            return;
        }

        if (syncLocalActive) stopSyncLocalProcess();
        else startSyncLocalProcess();

    };

    const iconElement = document.createElement('div');
    iconElement.innerHTML = iconUpSvg;

    const span = document.createElement('span');
    span.className = 'entry-label';
    span.textContent = 'Sync Local';

    button.appendChild(iconElement.firstChild);
    button.appendChild(span);
    menuEntryDiv.appendChild(button);

    const uploadFileEntry = menuContainer.querySelector('.menu-entry.settings');
    if (uploadFileEntry) {
        uploadFileEntry.insertAdjacentElement('afterend', menuEntryDiv);
    } else menuContainer.appendChild(menuEntryDiv);

}

// --- SYNC LOCAL FUNCTIONALITY ---


// --- SYNC ONLINE FUNCTIONALITY ---
async function startSyncOnlineProcess() {
    try {
        const [newHandle] = await window.showOpenFilePicker();
        syncOnlineFileHandle = newHandle;

        { // Enable synchronization
            let eventData = {status: 'synchronized', value: true};
            let ev = new CustomEvent('ExternalEditorToIDE', {detail: eventData});
            window.document.dispatchEvent(ev);
        }

        { // Initial code download
            let eventData = {status: 'getCode'};
            let ev = new CustomEvent('ExternalEditorToIDE', {detail: eventData});
            window.document.dispatchEvent(ev);
        }

        syncOnlineActive = true;

        const button = document.querySelector('.sync-online-entry .menu-entry-inner');
        if (button) button.classList.toggle('selected', true);
        console.log("Sync Online started. Your local file will be updated when changes are made.");

    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error(err);
        }
    }
}

// Stops the sync process
function stopSyncOnlineProcess() {
    // Disable synchronization
    let eventData = {status: 'synchronized', value: false};
    let ev = new CustomEvent('ExternalEditorToIDE', {detail: eventData});
    window.document.dispatchEvent(ev);

    syncOnlineActive = false;
    syncOnlineFileHandle = null;

    const button = document.querySelector('.sync-online-entry .menu-entry-inner');
    if (button) button.classList.toggle('selected', false);
    maybe_remove_timestamp();
}

async function writeCodeToLocalFile(code) {
    if (!syncOnlineFileHandle) return;
    try {
        const writable = await syncOnlineFileHandle.createWritable();
        await writable.write(code);
        await writable.close();

        // If the local-to-online sync is also active, update its timestamp
        // to prevent it from immediately re-uploading this change.
        if (syncLocalActive) {
            const file = await syncOnlineFileHandle.getFile();
            syncLocalLastModified = file.lastModified;
        }
    } catch (error) {
        console.error("Failed to write to file, stopping sync.", error);
        stopSyncOnlineProcess();
    }
}

function handleSyncOnlineEvents(event) {
    if (!syncOnlineActive) return;
    console.log("Received event from IDE:", event.detail);

    if (event.detail.code && event.detail.code !== currentCode) {
        currentCode = event.detail.code;
        writeCodeToLocalFile(event.detail.code);
        console.log("Code written to local file.");
        updateTimestampDisplay();
    }

}

function createSyncOnlineButton() {
    const menuContainer = document.querySelector('.menu-entries');
    if (!menuContainer) return;

    const menuEntryDiv = document.createElement('div');
    menuEntryDiv.className = 'menu-entry sync-online-entry';

    const button = document.createElement('button');
    button.className = 'menu-entry-inner';

    window.document.addEventListener('IDEToExternalEditor', handleSyncOnlineEvents);

    button.onclick = () => {
        if (typeof window.showOpenFilePicker !== 'function') {
            alert("File System Access API not available.");
            return;
        }
        if (syncOnlineActive) stopSyncOnlineProcess();
        else startSyncOnlineProcess();

    };

    const iconElement = document.createElement('div');
    iconElement.innerHTML = iconDownSvg;

    const span = document.createElement('span');
    span.className = 'entry-label';
    span.textContent = 'Sync Online';

    button.appendChild(iconElement.firstChild);
    button.appendChild(span);
    menuEntryDiv.appendChild(button);

    const uploadFileEntry = menuContainer.querySelector('.menu-entry.settings');
    if (uploadFileEntry) {
        uploadFileEntry.insertAdjacentElement('afterend', menuEntryDiv);
    } else {
        menuContainer.appendChild(menuEntryDiv);
    }
}

// --- SYNC ONLINE FUNCTIONALITY ---


// --- INITIALIZATION ---
function initialize() {
    // If the button we are about to create already exists, do nothing.
    if (document.querySelector('.pro-layout-entry')) {
        return;
    }

    // createUploadCodeButton();
    createSyncOnlineButton();
    createSyncLocalButton();
    createProLayoutToggleButton();

    if (isProLayoutActive) activateProLayout();
}

// This function will be called by the observer on every DOM change.
const handleDOMChanges = () => {
    // Check if the menu exists on the page right now.
    const menuExists = document.querySelector('.menu-entries');

    if (menuExists) {
        // The menu is present, so try to initialize our UI.
        // The guard clause inside initialize() will prevent it from running if it's already there.
        initialize();
    } else {
        if (syncLocalActive) stopSyncLocalProcess();
        if (syncOnlineActive) stopSyncOnlineProcess();
    }

};

// Create an observer that calls our handler function.
const observer = new MutationObserver(handleDOMChanges);

// Start observing the entire document for changes.
observer.observe(document.body, {
    childList: true, subtree: true
});

