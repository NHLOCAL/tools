document.addEventListener('DOMContentLoaded', function() {
    const copyButton = document.getElementById('copyButton');
    const downloadButton = document.getElementById('downloadButton');
    const statusDiv = document.getElementById('status');

    function showStatus(message, type = 'info') {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type} visible`;
    }

    function hideStatus() {
        statusDiv.className = 'status';
    }
    
    function setButtonsState(disabled) {
        copyButton.disabled = disabled;
        downloadButton.disabled = disabled;
    }

    function getScrapedData(callback) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            chrome.tabs.sendMessage(tab.id, { action: "scrapeNodeBBThread" }, (response) => {
                if (chrome.runtime.lastError) {
                    showStatus("שגיאה: רענן את הדף ונסה שוב.", "error");
                    console.error(chrome.runtime.lastError.message);
                    callback(null);
                    return;
                }
                if (response && response.data && response.data.posts && response.data.posts.length > 0) {
                    callback(response.data);
                } else {
                    showStatus('לא נמצאו פוסטים לאיסוף.', "error");
                    callback(null);
                }
            });
        });
    }

    copyButton.addEventListener('click', () => {
        showStatus('אוסף את כל הפוסטים, נא להמתין...');
        setButtonsState(true);

        getScrapedData(data => {
            setButtonsState(false);
            if (!data) return;

            const jsonString = JSON.stringify(data.posts, null, 2);
            // Using a temporary textarea for large content clipboard copy
            const textarea = document.createElement('textarea');
            textarea.value = jsonString;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);

            showStatus(`הועתקו ${data.posts.length} פוסטים!`, 'success');
            setTimeout(hideStatus, 3000);
        });
    });

    downloadButton.addEventListener('click', () => {
        showStatus('אוסף את כל הפוסטים, נא להמתין...');
        setButtonsState(true);

        getScrapedData(data => {
            setButtonsState(false);
            if (!data) return;

            const jsonString = JSON.stringify(data.posts, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const safeTitle = data.title.replace(/[<>:"/\\|?*]+/g, ' ').replace(/\s+/g, ' ').trim();
            const fileName = `${safeTitle || 'thread'}.json`;

            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showStatus(`הורדו ${data.posts.length} פוסטים!`, 'success');
            setTimeout(hideStatus, 3000);
        });
    });
});