/* INITIALIZATION */
// we'll use the configuration object as a global
// requests filter
const requests = [];
let dLValues = [];

const dataLayerValues = (dataLayer) => {
  return dataLayer.map(push => Object.values(push)).flat().filter(value => value)
}

const requestsContainingDL = () => {
  requests.forEach(request => {
    if (new RegExp(dLValues.join('|'), 'gi').test(request)) {
      console.log("Request uses dataLayer value", request);
    }
  })
}

chrome.webRequest.onCompleted.addListener(details => {
  console.log(details);
  requests.push(details);

}, {
  urls: ["<all_urls>"]
})


// Get GTM dataLayer from the host page 
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.dL) {
    try {
      const dL = JSON.parse(message.dL);

      // store it in a global for later use
      dLValues = dataLayerValues(dL);
    } catch (e) {
      console.log("Failed to parse JSON", e)
    }
  }
})

// onclick on the extension, export the results
/*
chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: {
      tabId: tab.id
    },
    function: requestsContainingDL,
  })
})
*/