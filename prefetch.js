const match = location.pathname.match(/\/app\/(\d+)/);
if (match) {
  window.POP = {};
  window.POP.prefetch = new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'POP_FETCH_INFO', appId: match[1] }, response => {
      resolve(response?.ok ? response.data : null);
    });
  });
}
