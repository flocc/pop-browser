const API = 'https://polishourprices.pl/api/pop.php';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'POP_FETCH_INFO') return;

  fetch(`${API}?id=${message.appId}`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => sendResponse({ ok: true, data }))
    .catch(err => sendResponse({ ok: false, error: err.message }));

  return true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  if (!tab.url?.match(/https:\/\/store\.steampowered\.com\/app\/\d+/)) return;

  chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
  chrome.scripting.insertCSS({ target: { tabId }, files: ['style.css'] });
});
