var s = document.createElement('script');
s.src = chrome.runtime.getURL('injected.js');
s.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(s);

window.addEventListener('message', event => {
  console.log("Rcevied message from content-script", event.data)

  if (event.data.type && event.data.type == "FROM_PAGE") {
    console.log("Send message with dL", event.data.dL);

    chrome.runtime.sendMessage({
      dL: event.data.dL
    });
  }
})