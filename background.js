// Globals but not rellay, scoped to background.js 
const _requests = [];
let dLValues = [];


// dataLayerValues returns an array, concatenation of every dataLayer item values
const dataLayerValues = (dataLayer) => {
  return dataLayer.map(push => {
    delete push['gtm.uniqueEventId'];
    return Object.values(push)
  }).flat();
}

// requestsContainingDL returns a list of requests that contain values 
// oberved in the dataLayer
const requests = () => {
  let filterValues = dLValues.filter(val => val != ".");
  let pattern = new RegExp("(" + dLValues.join(')|(').replace(/(\.|\+|\?|\[|\]|\*)+/gi, '') + ")", "gi")
  const header = [
    ["Request URL", "DataLayer values observed"]
  ];

  const allRequests =
    _requests
    .map(request => {
      return [
        request.url,
        request.url.match(pattern).filter(e => !!e).length > 0 ? request.url.match(pattern).join(';') : ""
      ]
    })

  // add headers. Caution, unshift is not a pure function
  allRequests.unshift(header)
  return allRequests;
}

// onComplated intercept requests that succeed
chrome.webRequest.onCompleted.addListener(details => {
  _requests.push(details);
}, {
  urls: ["<all_urls>"]
})


// Get GTM dataLayer from the host page 
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // export results to content-script
  if (message && message.action == "getResults") {
    sendResponse({
      action: "getResults",
      results: JSON.stringify(requests()),
      type: "BACKGROUND"
    })

  }

  // message coming form content-script with dataLayer infos.
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