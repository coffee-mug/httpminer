// Globals but not rellay, scoped to background.js 
const _requests = [];
let dLValues = [];
let tcVars = {};
let interceptedRequestsCounter = 0;

// dataLayerValues returns an array, concatenation of every dataLayer item values
const dataLayerValues = (dataLayer) => {
  return dataLayer.map(push => {
    delete push['gtm.uniqueEventId'];
    return Object.values(push);
  }).flat();
}

const checkURLagainstDataLayer = (request, dataLayer) => {
    let url = decodeURIComponent(request.url);
    let matches = [];
    for(const variable in dataLayer){
      let pattern = new RegExp("\=" + dataLayer[variable] + "\&", "gi"); // HELP WITH REGEX ???
      let match = url.match(pattern);
      if(match && match[0]){
        matches.push(variable + ": " + match[0].replace("=","").replace("&",""));
      }
    }
    if(matches.length){
      return matches.join('|');
    } else {
      return "";
    }
}

// requestsContainingDL returns a list of requests that contain values 
// oberved in the dataLayer
const requests = () => {
  let filterValues = dLValues.filter(val => val != ".");
  let pattern = new RegExp("(" + dLValues.join(')|(').replace(/(\.|\+|\?|\[|\]|\*)+/gi, '') + ")", "gi")
  const header = ["Request URL", "DataLayer values observed"];
  console.log("audit begin. current dataLayer:", tcVars);
  const allRequests =
    _requests
    .map(request => {
      return [
        decodeURIComponent(request.url).replace(/,/g,"-"),
        //request.url.match(pattern).filter(e => !!e).length > 0 ? request.url.match(pattern).join(';') : ""
        checkURLagainstDataLayer(request, tcVars)
      ]
    });

  // add headers. Caution, unshift is not a pure function
  allRequests.unshift(header);
  return allRequests;
}

// onComplated intercept requests that succeed
chrome.webRequest.onCompleted.addListener(details => {
  _requests.push(details);
  interceptedRequestsCounter++;
  chrome.runtime.sendMessage({action:"reqCounter", counter: interceptedRequestsCounter});
}, {
  urls: ["<all_urls>"]
  //urls: ["*://*.fnac.com/*"]
})


// Get GTM dataLayer from the host page 
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
  // export results to popup.js
  if (message && message.action == "getResults" && message.type === "FROM_POPUP") {
      
      //get datalayer from content-script
      chrome.tabs.query({ url: "*://*.fnac.com/*" }, (tabs) => {
        console.log("tabs query result:", tabs);
        chrome.tabs.sendMessage(tabs[0].id, {action:"getDataLayer", type: "FROM_BACK"});
      });
  }

  // message coming form content-script with dataLayer infos.
  if (message && message.dL) {
    try {
      //const dL = JSON.parse(message.dL);

      // store it in a global for later use
      //dLValues = dataLayerValues(dL);
      tcVars = JSON.parse(message.dL); 
      console.log("dataLayer from")
    } catch (e) {
      console.log("Failed to parse JSON", e)
    } finally {
      //send results
      if(Object.keys(tcVars).length){
        chrome.runtime.sendMessage({
          action: "gotResults",
          results: JSON.stringify(requests()),
          type: "FROM_BACK"
        });
      }
    }
  }
  //return true;  // Required to keep message port open
});