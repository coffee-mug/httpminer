//console.log("hello from content-script");

var s = document.createElement('script');
s.src = chrome.runtime.getURL('injected.js');
s.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(s);

window.addEventListener('message', event => {
  //console.log("Received message from content-script", event.data)

  // Requets list of request from background
  // if (event.data.type && event.data.type == "FROM_PAGE" && event.data.action == "dataLayer") {
  //   chrome.runtime.sendMessage({
  //     action: "getResults"
  //   }, (response) => {
  //     console.log("Received results from background, sending back to webpage", response)

  //     exportToCSV(JSON.parse(response.results));

  //     /*
  //     postMessage({
  //       results: response.results,
  //       action: "getResults"
  //     });
  //     */
  //   })
  //}

  // Request coming fom webpage with dataLayer
  if (event.data.type && event.data.type == "FROM_PAGE" && !event.data.action) {
    chrome.runtime.sendMessage({
      dL: event.data.dL
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.action === "getDataLayer" && message.type === "FROM_BACK"){
        window.postMessage({action: "getDataLayer", type: "FROM_CONTENT"});
    }
});