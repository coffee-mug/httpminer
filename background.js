// Globals but not rellay, scoped to background.js 
let _requests = [];
let dLValues = [];
let tcVars = {};
let interceptedRequestsCounter = 0;
const networkFilters = {
    //urls: ["*://*.fnac.com/*"]
    urls: ["<all_urls>"]
};
const extraInfoSpecs = ["requestBody"];

let targetTabID = null;
let targetTabURL = null;

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
    for (const variable in dataLayer) {
        let pattern = new RegExp("\=" + dataLayer[variable] + "\&", "gi"); // HELP WITH REGEX ???
        let match = url.match(pattern);
        if (match && match[0]) {
            matches.push(variable + ": " + match[0].replace("=", "").replace("&", ""));
        }
    }
    if (matches.length) {
        return matches.join('|');
    } else {
        return "";
    }
}

const parseBody = (body) => {
    
    if(body.formData){
        return body.formData;
    }

    if(body.raw && Array.isArray(body.raw)){
        let parsedBody = "";
        let postedString = body.raw.map(function(data) {
            return String.fromCharCode.apply(null, new Uint8Array(data.bytes));
        }).join('');
        try {
            parsedBody = JSON.parse(postedString);
            console.log("request body parsed: ", parsedBody);
        } catch (error) {
            console.log("error retrieving body: ", error);
        } finally {
            return !!parsedBody ? parsedBody : postedString ? postedString : "";
        }
    }
    console.log("body type not handled: ", body);
    return "";
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
                decodeURIComponent(request.url).replace(/,/g, "-"),
                //request.url.match(pattern).filter(e => !!e).length > 0 ? request.url.match(pattern).join(';') : ""
                checkURLagainstDataLayer(request, tcVars)
            ]
        });

    // add headers. Caution, unshift is not a pure function
    allRequests.unshift(header);
    return allRequests;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    //console.log("tab onUpdated: ", tab);
    // restart audit
    if (/fnac\.com/gi.test(tab.url) && targetTabURL !== tab.url) {
        console.log("tab fnac! counters reseted");
        _requests = [];
        interceptedRequestsCounter = 0;
        targetTabID = tabId;
        targetTabURL = tab.url;
        console.log("New tabId: ", targetTabID);
    }
})

// onBeforeRequest  intercept requests that succeed
chrome.webRequest.onBeforeRequest.addListener(details => {
    if (details.tabId === targetTabID) {
        console.log("intercepted request: ", details);
        if (details.method === "POST") {
            // Use this to decode the body of your post
            details.parsedBody = parseBody(details.requestBody);
        }
        _requests.push(details);
        interceptedRequestsCounter++;
        console.log("interceptedRequestsCounter: " + interceptedRequestsCounter);
        chrome.runtime.sendMessage({
            action: "reqCounter",
            counter: interceptedRequestsCounter
        });
    }
}, networkFilters, extraInfoSpecs);
/*
// onComplated intercept requests that succeed
chrome.webRequest.onCompleted.addListener(details => {
	_requests.push(details);
	interceptedRequestsCounter++;
	chrome.runtime.sendMessage({action:"reqCounter", counter: interceptedRequestsCounter});
}, {
	urls: ["<all_urls>"]
	//urls: ["*://*.fnac.com/*"]
})
*/

// Get GTM dataLayer from the host page 
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    // export results to popup.js
    if (message && message.action == "getResults" && message.type === "FROM_POPUP") {

        //get datalayer from content-script
        chrome.tabs.query({
            url: "*://*.fnac.com/*"
        }, (tabs) => {
            console.log("tabs query result:", tabs);
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "getDataLayer",
                type: "FROM_BACK"
            });
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
            if (Object.keys(tcVars).length) {
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