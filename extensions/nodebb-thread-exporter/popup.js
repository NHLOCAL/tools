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

    function getThreadData(callback) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0] || !tabs[0].id) {
                 showStatus("לא ניתן לגשת לטאב הנוכחי.", "error");
                 callback(null);
                 return;
            }
            const tab = tabs[0];

            chrome.tabs.sendMessage(tab.id, { action: "exportNodeBBThread" }, (response) => {
                if (chrome.runtime.lastError) {
                    showStatus("שגיאת תקשורת עם הדף. רענן ונסה שוב.", "error");
                    console.error(chrome.runtime.lastError.message);
                    callback(null);
                    return;
                }
                
                if (response && response.success && response.data) {
                    if (response.data.posts && response.data.posts.length > 0) {
                        callback(response.data);
                    } else {
                        showStatus('לא נמצאו פוסטים לאיסוף.', "error");
                        callback(null);
                    }
                } else {
                    showStatus(`שגיאה: ${response?.error || 'שגיאה לא ידועה'}`, "error");
                    callback(null);
                }
            });
        });
    }

    copyButton.addEventListener('click', () => {
        showStatus('אוסף פוסטים דרך ה-API, נא להמתין...');
        setButtonsState(true);

        getThreadData(data => {
            setButtonsState(false);
            if (!data) return;

            const jsonString = JSON.stringify({ title: data.title, posts: data.posts }, null, 2);
            navigator.clipboard.writeText(jsonString).then(() => {
                showStatus(`הועתקו ${data.posts.length} פוסטים ללוח!`, 'success');
                setTimeout(hideStatus, 3000);
            }).catch(err => {
                showStatus('ההעתקה ללוח נכשלה.', 'error');
                console.error('Clipboard write failed: ', err);
            });
        });
    });

    downloadButton.addEventListener('click', () => {
        showStatus('אוסף פוסטים דרך ה-API, נא להמתין...');
        setButtonsState(true);

        getThreadData(data => {
            setButtonsState(false);
            if (!data) return;

            const jsonString = JSON.stringify({ title: data.title, posts: data.posts }, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            const safeTitle = data.title.replace(/[<>:"/\\|?*]+/g, '_').replace(/\s+/g, '_').trim();
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