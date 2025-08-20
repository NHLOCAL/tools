chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "sendPosts") {
    const json = JSON.stringify(message.data, null, 2);
    const blob = new Blob([json], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({
      url: url,
      filename: "posts.json"
    });
  } else if (message.action === "error") {
    alert("Error: " + message.message);
  }
});