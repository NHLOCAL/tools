import { parseTranscriptContent, timeStringToSeconds, secondsToTimeString } from './parser.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const transcriptFileInput = document.getElementById('transcript-file-input'),
        transcriptDropZone = document.getElementById('transcript-drop-zone'),
        transcriptTextInput = document.getElementById('transcript-text-input'),
        mediaFileInput = document.getElementById('media-file-input'),
        mediaDropZone = document.getElementById('media-drop-zone'),
        transcriptFileName = document.getElementById('transcript-file-name'),
        mediaFileName = document.getElementById('media-file-name'),
        processButton = document.getElementById('process-button'),
        backToInputBtn = document.getElementById('back-to-input-btn'),
        downloadSrtButton = document.getElementById('download-srt-button'),
        downloadTxtButton = document.getElementById('download-txt-button'),
        inputSection = document.getElementById('input-section'),
        editorSection = document.getElementById('editor-section'),
        notification = document.getElementById('notification'),
        mediaPlayer = document.getElementById('media-player'),
        audioPoster = document.getElementById('audio-poster'),
        playPauseBtn = document.getElementById('play-pause-btn'),
        playPauseIcon = playPauseBtn.querySelector('span'),
        progressBar = document.getElementById('progress-bar'),
        currentTimeEl = document.getElementById('current-time'),
        durationEl = document.getElementById('duration'),
        volumeBtn = document.getElementById('volume-btn'),
        volumeIcon = volumeBtn.querySelector('span'),
        volumeBar = document.getElementById('volume-bar'),
        subtitleListContainer = document.getElementById('subtitle-list-container'),
        subtitleList = document.getElementById('subtitle-list'),
        interactiveTextContainer = document.getElementById('interactive-text-container'),
        interactiveTextView = document.getElementById('interactive-text-view'),
        decreaseSpeedBtn = document.getElementById('decrease-speed-btn'),
        increaseSpeedBtn = document.getElementById('increase-speed-btn'),
        playbackSpeedEl = document.getElementById('playback-speed'),
        replaceInput = document.getElementById('replace-input'),
        replaceAllBtn = document.getElementById('replace-all-btn'),
        replaceOneBtn = document.getElementById('replace-one-btn'),
        offsetInput = document.getElementById('offset-input'),
        applyOffsetBtn = document.getElementById('apply-offset-btn'),
        undoBtn = document.getElementById('undo-btn'),
        redoBtn = document.getElementById('redo-btn'),
        searchInput = document.getElementById('search-input'),
        searchPrevBtn = document.getElementById('search-prev-btn'),
        searchNextBtn = document.getElementById('search-next-btn'),
        searchResultsDisplay = document.getElementById('search-results-display'),
        viewToggleListBtn = document.getElementById('view-toggle-list'),
        viewToggleTextBtn = document.getElementById('view-toggle-text');

    // --- State ---
    let state = { subtitles: [], sourceFormat: null, mediaURL: null, mediaFile: null, activeSubtitleId: null, wasPlayingBeforeEdit: false };
    let currentView = 'list'; // 'list' or 'text'
    let typingTimeout = null, parseTimeout = null, searchTimeout = null;
    let historyStack = [], redoStack = [];
    let searchResults = [], currentSearchIndex = -1;

    // --- Core Functions ---
    const showNotification = (message, type = 'info', duration = 3000) => {
        notification.textContent = message;
        notification.className = 'show';
        if (type === 'error') notification.classList.add('error');
        setTimeout(() => { notification.className = ''; }, duration);
    };
    
    const formatTimeForDisplay = (time) => {
        if (isNaN(time)) return "00:00";
        const totalSeconds = Math.floor(time);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
    };
    
    // --- Local Storage & History (Undo/Redo) ---
    const saveToLocalStorage = () => {
        if (state.subtitles && state.subtitles.length > 0) {
            const dataToSave = {
                subtitles: state.subtitles,
                sourceFormat: state.sourceFormat,
                mediaFileName: state.mediaFile?.name || 'קובץ לא ידוע'
            };
            localStorage.setItem('subtitleEditorAutosave', JSON.stringify(dataToSave));
        } else {
            localStorage.removeItem('subtitleEditorAutosave');
        }
    };

    const updateHistoryButtons = () => {
        undoBtn.disabled = historyStack.length <= 1;
        redoBtn.disabled = redoStack.length === 0;
    };
    
    const recordHistory = (isInitial = false) => {
        const currentState = JSON.parse(JSON.stringify({ subtitles: state.subtitles, sourceFormat: state.sourceFormat }));
        
        if (historyStack.length === 0 && !isInitial) {
             historyStack.push(currentState);
        }
        historyStack.push(currentState);
        redoStack = []; 
        updateHistoryButtons();
        saveToLocalStorage();
    };
    
    const restoreStateFromHistory = (historyEntry) => {
        state.subtitles = historyEntry.subtitles;
        state.sourceFormat = historyEntry.sourceFormat;
        renderCurrentView();
        performSearch();
        updateHistoryButtons();
        saveToLocalStorage();
    };

    const updateAndRefreshUI = (notificationMsg) => {
        recordHistory();
        renderCurrentView();
        performSearch();
        if (notificationMsg) showNotification(notificationMsg);
    };

    const undo = () => {
        if (historyStack.length < 2) return;
        redoStack.push(historyStack.pop());
        const prevState = historyStack[historyStack.length - 1];
        restoreStateFromHistory(prevState);
        showNotification('פעולה בוטלה');
    };

    const redo = () => {
        if (redoStack.length === 0) return;
        const nextState = redoStack.pop();
        historyStack.push(nextState);
        restoreStateFromHistory(nextState);
        showNotification('פעולה שוחזרה');
    };
    
    const loadFromLocalStorage = () => {
        const savedData = localStorage.getItem('subtitleEditorAutosave');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                if (parsedData.subtitles && parsedData.subtitles.length > 0) {
                    state.subtitles = parsedData.subtitles;
                    state.sourceFormat = parsedData.sourceFormat || null;
                    transcriptTextInput.value = JSON.stringify(parsedData.subtitles, null, 2);
                    transcriptFileName.textContent = `שוחזר סשן עבור: ${parsedData.mediaFileName || 'קובץ לא ידוע'}`;
                    showNotification('סשן קודם שוחזר. יש לבחור מחדש את קובץ המדיה.');
                    checkInputs();
                }
            } catch (e) {
                console.error("Failed to load from local storage", e);
                localStorage.removeItem('subtitleEditorAutosave');
            }
        }
    };

    // --- Parsing and File Handling ---
    const processTranscriptContent = (content) => {
        const result = parseTranscriptContent(content);
        if (result) {
            state.subtitles = result.data;
            state.sourceFormat = result.format;
            checkInputs();
            return true;
        }
        showNotification('שגיאה בפענוח הקובץ. ודא שהוא בפורמט נתמך (JSON, SRT, VTT, או תמלול פשוט).', 'error');
        return false;
    }

    const handleTranscriptFile = (file) => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                if (processTranscriptContent(content)) {
                    transcriptFileName.textContent = `קובץ: ${file.name}`;
                    transcriptTextInput.value = content;
                }
            };
            reader.onerror = () => showNotification('שגיאה בקריאת הקובץ.', 'error');
            reader.readAsText(file);
        } else { showNotification('יש לבחור קובץ תמלול.', 'error'); }
    };
    
    const handleMediaFile = (file) => {
         if (file && (file.type.startsWith('audio/') || file.type.startsWith('video/'))) {
            if (state.mediaURL) URL.revokeObjectURL(state.mediaURL);
            state.mediaFile = file;
            state.mediaURL = URL.createObjectURL(file);
            mediaFileName.textContent = `קובץ: ${file.name}`;
            checkInputs();
        } else { showNotification('יש לבחור קובץ שמע או וידאו.', 'error'); }
    };

    // --- Rendering ---
    const renderUI = () => {
        inputSection.style.display = 'none';
        editorSection.style.display = 'block';
        mediaPlayer.src = state.mediaURL;
        if (state.mediaFile.type.startsWith('audio/')) {
            audioPoster.textContent = state.mediaFile.name;
            audioPoster.classList.add('visible');
        } else {
            audioPoster.classList.remove('visible');
        }
        renderCurrentView();
        performSearch();
    };

    const renderCurrentView = () => {
        if (currentView === 'list') {
            renderSubtitleList();
        } else {
            renderInteractiveText();
        }
    };

    const renderSubtitleList = () => {
        subtitleList.innerHTML = '';
        const sortedSubs = [...state.subtitles].sort((a,b) => timeStringToSeconds(a.start_time) - timeStringToSeconds(b.start_time));
        state.subtitles = sortedSubs; 

        subtitleList.insertAdjacentHTML('beforeend', createAddSubGapHTML('before_first'));

        state.subtitles.forEach(sub => {
            const displayStartTime = secondsToTimeString(timeStringToSeconds(sub.start_time)),
                  displayEndTime = secondsToTimeString(timeStringToSeconds(sub.end_time));
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = `
                <div class="subtitle-item" data-id="${sub.id}">
                    <div class="subtitle-item-main">
                        <div class="time-inputs">
                            <input type="text" class="time-input start-time" value="${displayStartTime}">
                            <span>→</span>
                            <input type="text" class="time-input end-time" value="${displayEndTime}">
                        </div>
                        <div class="text-input" contenteditable="true" spellcheck="false"></div>
                    </div>
                    <div class="subtitle-item-actions">
                        <button class="delete-sub-btn" title="מחק כתובית"><span class="material-symbols-outlined">delete</span></button>
                    </div>
                </div>`;
            const subItemElement = tempDiv.firstElementChild;
            const textInput = subItemElement.querySelector('.text-input');
            textInput.textContent = sub.text || '';
            subtitleList.appendChild(subItemElement);
            subtitleList.insertAdjacentHTML('beforeend', createAddSubGapHTML(sub.id));
        });
        updateActiveSubtitle();
    }

    const renderInteractiveText = () => {
        const sortedSubs = [...state.subtitles].sort((a,b) => timeStringToSeconds(a.start_time) - timeStringToSeconds(b.start_time));
        state.subtitles = sortedSubs;
        
        let html = "";
        if (state.sourceFormat === 'simple') {
            html = sortedSubs.map(sub => `<span data-id="${sub.id}">${(sub.text || '').trim()}</span>`).join('<br><br>');
        } else {
            for (let i = 0; i < sortedSubs.length; i++) {
                const currentSub = sortedSubs[i];
                let textToAdd = `<span data-id="${currentSub.id}">${(currentSub.text || '').trim()}</span>`;

                if (i > 0) {
                    const prevSub = sortedSubs[i - 1];
                    const prevText = (prevSub.text || '').trim();
                    const prevTextEndsWithPeriod = /\.$/.test(prevText);
                    const prevTextEndsWithComma = /,$/.test(prevText);
                    const prevTextEndsStrongSentence = /[?!]$/.test(prevText);
                    const gap = timeStringToSeconds(currentSub.start_time) - timeStringToSeconds(prevSub.end_time);

                    if (!prevTextEndsWithPeriod && !prevTextEndsWithComma) {
                        html += ' ' + textToAdd;
                    } else if (gap > 1.5 || prevTextEndsStrongSentence) {
                        html += '<br><br>' + textToAdd;
                    } else {
                        html += ' ' + textToAdd;
                    } 
                } else {
                    html += textToAdd;
                }
            }
        }
        interactiveTextView.innerHTML = html;
        updateActiveSubtitle();
    };

    const createAddSubGapHTML = (afterId) => `
        <div class="add-sub-gap" data-after-id="${afterId}">
            <div class="add-sub-gap-inner">
                <div class="line"></div>
                <button title="הוסף כתובית כאן"><span class="material-symbols-outlined">add</span></button>
                <div class="line"></div>
            </div>
        </div>`;

    // --- Player and Controls ---
    const togglePlay = () => mediaPlayer.paused ? mediaPlayer.play() : mediaPlayer.pause();
    
    const updateActiveSubtitle = () => {
        const currentSub = state.subtitles.find(s => mediaPlayer.currentTime >= timeStringToSeconds(s.start_time) && mediaPlayer.currentTime < timeStringToSeconds(s.end_time));
        if (currentSub?.id === state.activeSubtitleId) return;

        const shouldBlockScroll = document.querySelector('.subtitle-item input:focus, .subtitle-item .text-input:focus, #interactive-text-view:focus');
        
        if (currentView === 'list') {
            document.querySelector(`.subtitle-item.active`)?.classList.remove('active');
            const newActiveEl = document.querySelector(`.subtitle-item[data-id="${currentSub?.id}"]`);
            if (newActiveEl) { 
                newActiveEl.classList.add('active');
                if (!shouldBlockScroll) newActiveEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else { // 'text' view
            document.querySelector(`#interactive-text-view span.active`)?.classList.remove('active');
            const newActiveEl = document.querySelector(`#interactive-text-view span[data-id="${currentSub?.id}"]`);
            if (newActiveEl) {
                newActiveEl.classList.add('active');
                if (!shouldBlockScroll) newActiveEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        state.activeSubtitleId = currentSub?.id;
    };
    
    const updatePlaybackSpeed = (change) => {
        let newRate = Math.round((mediaPlayer.playbackRate + change) * 100) / 100;
        if (newRate >= 0.25 && newRate <= 4) {
            mediaPlayer.playbackRate = newRate;
            playbackSpeedEl.textContent = `${newRate.toFixed(2).replace(/\.00$|0$/, '')}x`;
        }
    };

    // --- Event Listeners ---
    const checkInputs = () => { processButton.disabled = !(state.subtitles && state.subtitles.length > 0 && state.mediaURL); };
    
    transcriptFileInput.addEventListener('change', (e) => handleTranscriptFile(e.target.files[0]));
    mediaFileInput.addEventListener('change', (e) => handleMediaFile(e.target.files[0]));
    
    transcriptTextInput.addEventListener('input', () => {
        if (transcriptTextInput.value.trim().length > 0) { transcriptFileInput.value = ''; transcriptFileName.textContent = ''; }
        clearTimeout(parseTimeout);
        parseTimeout = setTimeout(() => {
            processTranscriptContent(transcriptTextInput.value);
        }, 500);
    });
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => { document.body.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }); });
    [transcriptDropZone, mediaDropZone].forEach(zone => {
        zone.addEventListener('dragover', () => zone.classList.add('drag-over'), false);
        zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'), false);
    });
    transcriptDropZone.addEventListener('drop', e => { transcriptDropZone.classList.remove('drag-over'); handleTranscriptFile(e.dataTransfer.files[0]); });
    mediaDropZone.addEventListener('drop', e => { mediaDropZone.classList.remove('drag-over'); handleMediaFile(e.dataTransfer.files[0]); });

    processButton.addEventListener('click', () => {
        historyStack = [];
        redoStack = [];
        recordHistory(true);
        renderUI();
    });
    
    backToInputBtn.addEventListener('click', () => {
        editorSection.style.display = 'none';
        inputSection.style.display = 'block';
        mediaPlayer.pause();
    });
    
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);

    playPauseBtn.addEventListener('click', togglePlay);
    mediaPlayer.addEventListener('click', togglePlay);
    audioPoster.addEventListener('click', togglePlay);
    mediaPlayer.addEventListener('play', () => playPauseIcon.textContent = 'pause');
    mediaPlayer.addEventListener('pause', () => playPauseIcon.textContent = 'play_arrow');
    mediaPlayer.addEventListener('loadedmetadata', () => durationEl.textContent = formatTimeForDisplay(mediaPlayer.duration));
    
    mediaPlayer.addEventListener('timeupdate', () => {
        progressBar.value = mediaPlayer.duration ? (mediaPlayer.currentTime / mediaPlayer.duration) * 100 : 0;
        currentTimeEl.textContent = formatTimeForDisplay(mediaPlayer.currentTime);
        updateActiveSubtitle();
    });

    progressBar.addEventListener('input', () => mediaPlayer.currentTime = (progressBar.value / 100) * mediaPlayer.duration);
    volumeBar.addEventListener('input', (e) => { mediaPlayer.volume = e.target.value; mediaPlayer.muted = e.target.value == 0; });
    
    mediaPlayer.addEventListener('volumechange', () => {
        const currentVolume = mediaPlayer.muted ? 0 : mediaPlayer.volume;
        volumeBar.value = currentVolume;
        volumeBar.style.setProperty('--volume-progress', `${currentVolume * 100}%`);
        if (currentVolume === 0) volumeIcon.textContent = 'volume_off';
        else if (currentVolume < 0.5) volumeIcon.textContent = 'volume_down';
        else volumeIcon.textContent = 'volume_up';
    });

    volumeBtn.addEventListener('click', () => mediaPlayer.muted = !mediaPlayer.muted);
    increaseSpeedBtn.addEventListener('click', () => updatePlaybackSpeed(0.25));
    decreaseSpeedBtn.addEventListener('click', () => updatePlaybackSpeed(-0.25));

    // --- View Switching Logic ---
    viewToggleListBtn.addEventListener('click', () => {
        if (currentView === 'list') return;
        currentView = 'list';
        viewToggleListBtn.classList.add('active');
        viewToggleTextBtn.classList.remove('active');
        subtitleListContainer.style.display = 'block';
        interactiveTextContainer.style.display = 'none';
        renderCurrentView();
        performSearch();
    });

    viewToggleTextBtn.addEventListener('click', () => {
        if (currentView === 'text') return;
        currentView = 'text';
        viewToggleTextBtn.classList.add('active');
        viewToggleListBtn.classList.remove('active');
        subtitleListContainer.style.display = 'none';
        interactiveTextContainer.style.display = 'block';
        renderCurrentView();
        performSearch();
    });

    // --- Subtitle Editing Logic (List View) ---
    subtitleListContainer.addEventListener('click', e => {
        const target = e.target;
        if (target.closest('.delete-sub-btn')) {
            const subId = target.closest('.subtitle-item').dataset.id;
            state.subtitles = state.subtitles.filter(s => s.id != subId);
            updateAndRefreshUI("הכתובית נמחקה.");
            return;
        }
        if (target.closest('.add-sub-gap button')) {
            const addGap = target.closest('.add-sub-gap');
            const afterId = addGap.dataset.afterId;
            let newSub, insertIndex;
            if (afterId === 'before_first') {
                const firstSubStartTime = state.subtitles.length > 0 ? timeStringToSeconds(state.subtitles[0].start_time) : 2;
                newSub = { id: Date.now(), start_time: "00:00:00.000", end_time: secondsToTimeString(Math.max(0.1, firstSubStartTime - 0.1)), text: "טקסט חדש..." };
                insertIndex = 0;
            } else {
                const prevSubIndex = state.subtitles.findIndex(s => s.id == afterId);
                const prevSub = state.subtitles[prevSubIndex];
                const nextSub = state.subtitles[prevSubIndex + 1];
                const startTime = timeStringToSeconds(prevSub.end_time) + 0.001;
                const endTime = nextSub ? timeStringToSeconds(nextSub.start_time) - 0.001 : startTime + 2;
                if (endTime <= startTime) return showNotification("אין מספיק מקום בין הכתוביות.", "error");
                newSub = { id: Date.now(), start_time: secondsToTimeString(startTime), end_time: secondsToTimeString(endTime), text: "טקסט חדש..." };
                insertIndex = prevSubIndex + 1;
            }
            state.subtitles.splice(insertIndex, 0, newSub);
            updateAndRefreshUI("כתובית חדשה נוספה.");
            const newSubEl = document.querySelector(`.subtitle-item[data-id="${newSub.id}"]`);
            if (newSubEl) {
                newSubEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                newSubEl.querySelector('.text-input')?.focus();
            }
            return;
        }
        const subItem = target.closest('.subtitle-item');
        if(subItem && !target.closest('input, .text-input, button, mark')) {
            mediaPlayer.currentTime = timeStringToSeconds(subItem.querySelector('.start-time').value);
            if (mediaPlayer.paused) mediaPlayer.play();
        }
    });
    
    subtitleListContainer.addEventListener('input', e => {
         const subItem = e.target.closest('.subtitle-item');
         if (!subItem) return;
         const subId = subItem.dataset.id, sub = state.subtitles.find(s => s.id == subId);
         if (e.target.classList.contains('start-time')) sub.start_time = e.target.value;
         if (e.target.classList.contains('end-time')) sub.end_time = e.target.value;
         if (e.target.classList.contains('text-input')) { sub.text = e.target.textContent; }
         if (!mediaPlayer.paused) { state.wasPlayingBeforeEdit = true; mediaPlayer.pause(); }
         clearTimeout(typingTimeout);
         typingTimeout = setTimeout(() => {
            recordHistory();
            if(state.wasPlayingBeforeEdit) { mediaPlayer.play(); state.wasPlayingBeforeEdit = false; }
         }, 1500);
    });

    // --- Interactive Text View Logic ---
    interactiveTextView.addEventListener('click', e => {
        const span = e.target.closest('span[data-id]');
        if (span && !e.target.closest('mark')) {
            const subId = span.dataset.id;
            const sub = state.subtitles.find(s => s.id == subId);
            if (sub) mediaPlayer.currentTime = timeStringToSeconds(sub.start_time);
        }
    });

    interactiveTextView.addEventListener('input', () => {
        if (!mediaPlayer.paused) { state.wasPlayingBeforeEdit = true; mediaPlayer.pause(); }
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            interactiveTextView.querySelectorAll('span[data-id]').forEach(span => {
                const subId = span.dataset.id;
                const sub = state.subtitles.find(s => s.id == subId);
                if (sub && sub.text !== span.textContent) sub.text = span.textContent;
            });
            recordHistory();
            if(state.wasPlayingBeforeEdit) { mediaPlayer.play(); state.wasPlayingBeforeEdit = false; }
        }, 1500);
    });
    
    const handleTextViewEdit = (e) => {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;

        const isInsideSub = (container.nodeType === Node.ELEMENT_NODE)
            ? container.closest('span[data-id]')
            : container.parentElement.closest('span[data-id]');

        if (!isInsideSub) {
            e.preventDefault();
            showNotification('ניתן לערוך רק את תוכן הכתובית עצמה.', 'error', 2000);
        }
    }
    
    interactiveTextView.addEventListener('keydown', e => {
        const allowedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'];
        if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
            return;
        }
        handleTextViewEdit(e);
    });
    interactiveTextView.addEventListener('paste', handleTextViewEdit);
    
    // --- Search and Replace ---
    const clearSearch = () => {
        document.querySelectorAll('mark.search-match').forEach(mark => {
            const parent = mark.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(mark.textContent), mark);
                parent.normalize();
            }
        });
        document.querySelectorAll('.search-hit').forEach(el => el.classList.remove('search-hit'));
        searchResults = []; currentSearchIndex = -1; searchResultsDisplay.textContent = '';
        searchPrevBtn.disabled = true; searchNextBtn.disabled = true; replaceOneBtn.disabled = true; replaceAllBtn.disabled = true;
    };

    const performSearch = () => {
        clearSearch();
        const query = searchInput.value.trim();
        if (!query) { return; }

        replaceAllBtn.disabled = false;
        const findRegex = new RegExp(query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
        
        searchResults = [];
        const elementsToSearch = document.querySelectorAll('#subtitle-list .text-input, #interactive-text-view span[data-id]');

        elementsToSearch.forEach(element => {
            const subId = element.closest('[data-id]').dataset.id;
            const text = element.textContent;
            if (text.match(findRegex)) {
                const newHtml = text.replace(findRegex, match => `<mark class="search-match">${match}</mark>`);
                element.innerHTML = newHtml;
                (element.closest('.subtitle-item') || element).classList.add('search-hit');
                
                element.querySelectorAll('mark.search-match').forEach(markNode => {
                    searchResults.push({
                        subId: subId,
                        element: element,
                        domNode: markNode
                    });
                });
            }
        });
        
        const hasResults = searchResults.length > 0;
        searchPrevBtn.disabled = !hasResults; searchNextBtn.disabled = !hasResults; replaceOneBtn.disabled = !hasResults;

        if (hasResults) { 
            currentSearchIndex = 0; 
            navigateToSearchResult(0); 
        } else { 
            currentSearchIndex = -1; 
            searchResultsDisplay.textContent = '0/0'; 
        }
    };
    
    const navigateToSearchResult = (index) => {
        if (searchResults.length === 0) return;

        if (currentSearchIndex > -1 && searchResults[currentSearchIndex]) {
            searchResults[currentSearchIndex].domNode.classList.remove('current-match');
        }

        currentSearchIndex = (index + searchResults.length) % searchResults.length;
        const currentMatch = searchResults[currentSearchIndex];
        
        if (currentMatch) {
            currentMatch.domNode.classList.add('current-match');
            const container = currentMatch.element.closest('.subtitle-item') || currentMatch.element;
            container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        searchResultsDisplay.textContent = `${currentSearchIndex + 1}/${searchResults.length}`;
    };

    searchInput.addEventListener('input', () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(performSearch, 300); });
    searchNextBtn.addEventListener('click', () => navigateToSearchResult(currentSearchIndex + 1));
    searchPrevBtn.addEventListener('click', () => navigateToSearchResult(currentSearchIndex - 1));

    searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && searchResults.length > 0) {
            e.preventDefault();
            if (e.shiftKey) {
                searchPrevBtn.click();
            } else {
                searchNextBtn.click();
            }
        }
    });

    replaceInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            replaceOneBtn.click();
        }
    });

    replaceOneBtn.addEventListener('click', () => {
        const findText = searchInput.value;
        const replaceText = replaceInput.value;
        if (!findText || currentSearchIndex < 0 || searchResults.length === 0) return;
        
        const indexBeforeReplace = currentSearchIndex;
        const currentMatch = searchResults[indexBeforeReplace];
        if (!currentMatch) return;

        const markNode = currentMatch.domNode;
        markNode.parentNode.replaceChild(document.createTextNode(replaceText), markNode);
        markNode.parentNode.normalize();

        const sub = state.subtitles.find(s => s.id == currentMatch.subId);
        if (sub) {
            sub.text = currentMatch.element.textContent;
        }
        
        recordHistory();
        renderCurrentView();
        performSearch();
        
        if (searchResults.length > 0) {
            const newIndex = Math.min(indexBeforeReplace, searchResults.length - 1);
            navigateToSearchResult(newIndex);
        }
    });

    replaceAllBtn.addEventListener('click', () => {
        const findText = searchInput.value; const replaceText = replaceInput.value;
        if (!findText) return showNotification('יש להזין טקסט לחיפוש.', 'error');
        const findRegex = new RegExp(findText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
        let replacementsCount = 0;
        state.subtitles.forEach(sub => {
            const currentText = sub.text || '';
            if (currentText.toLowerCase().includes(findText.toLowerCase())) {
                const newText = currentText.replace(findRegex, replaceText);
                if (newText !== currentText) { sub.text = newText; replacementsCount++; }
            }
        });
        if (replacementsCount > 0) updateAndRefreshUI(`הוחלפו ${replacementsCount} מופעים.`);
        else showNotification('הטקסט לחיפוש לא נמצא.', 'info');
    });

    applyOffsetBtn.addEventListener('click', () => {
        const offset = parseFloat(offsetInput.value);
        if (isNaN(offset)) return showNotification('ערך הזזה לא תקין.', 'error');
        state.subtitles.forEach(sub => {
            sub.start_time = secondsToTimeString(Math.max(0, timeStringToSeconds(sub.start_time) + offset));
            sub.end_time = secondsToTimeString(Math.max(0, timeStringToSeconds(sub.end_time) + offset));
        });
        updateAndRefreshUI(`התזמונים הוזזו ב-${offset} שניות.`);
    });
    
    // --- Download Functions ---
    const generateSrtContent = () => {
        return [...state.subtitles].sort((a,b) => timeStringToSeconds(a.start_time) - timeStringToSeconds(b.start_time))
            .map((sub, index) => `${index + 1}\n${secondsToTimeString(timeStringToSeconds(sub.start_time), true)} --> ${secondsToTimeString(timeStringToSeconds(sub.end_time), true)}\n${(sub.text || '').trim()}\n`).join('\n');
    };

    const generatePlainTextContent = () => {
        const sortedSubs = [...state.subtitles].sort((a,b) => timeStringToSeconds(a.start_time) - timeStringToSeconds(b.start_time));
        if (sortedSubs.length === 0) return "";
        
        if (state.sourceFormat === 'simple') {
            return sortedSubs.map(sub => (sub.text || '').trim()).join('\n\n');
        }
        
        let fullText = "";
        for (let i = 0; i < sortedSubs.length; i++) {
            const currentSub = sortedSubs[i], textToAdd = (currentSub.text || '').trim();
            if (i > 0) {
                const prevSub = sortedSubs[i - 1];
                const prevText = (prevSub.text || '').trim();
                const prevTextEndsWithPeriod = /\.$/.test(prevText);
                const prevTextEndsWithComma = /,$/.test(prevText);
                const prevTextEndsStrongSentence = /[?!]$/.test(prevText);
                const gap = timeStringToSeconds(currentSub.start_time) - timeStringToSeconds(prevSub.end_time);
                if (!prevTextEndsWithPeriod && !prevTextEndsWithComma) fullText += ' ' + textToAdd;
                else if (gap > 1.5 || prevTextEndsStrongSentence) fullText += '\n\n' + textToAdd;
                else fullText += ' ' + textToAdd;
            } else fullText += textToAdd;
        }
        return fullText;
    };
    
    const downloadFile = (content, filename, type) => {
        if (!content) return showNotification('אין כתוביות להורדה.', 'error');
        const blob = new Blob([content], { type: `${type};charset=utf-8` });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        showNotification(`${filename} נוצר והורד בהצלחה!`);
    }
    
    const baseFilename = () => (state.mediaFile?.name || 'subtitles').replace(/\.[^/.]+$/, "");

    downloadSrtButton.addEventListener('click', () => downloadFile(generateSrtContent(), `${baseFilename()}.srt`, 'text/plain'));
    downloadTxtButton.addEventListener('click', () => downloadFile(generatePlainTextContent(), `${baseFilename()}.txt`, 'text/plain'));
    
    loadFromLocalStorage();
});