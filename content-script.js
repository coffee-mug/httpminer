var s = document.createElement('script');
s.src = chrome.runtime.getURL('injected.js');
s.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(s);

// exportToCSV takes a matrix (array of array) of strings
// and downloads correspoding CSV file on user's browser.
// ex: data = [["Actor name", "best role"], ["Pierce Brosnan", "James Bond"]]
// outputs csv file containing: Actor name, best role\nPierce Brosnan, James Bond
const exportToCSV = (data) => {
  const csv = data
    .map(row => row.join(','))
    .join('\r\n');


  var blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;'
  })

  // createObjectURL temporarily stores the data in browser and assigns it a local URL
  var fileHref = URL.createObjectURL(blob)
  var link = document.createElement('a');
  link.download = "requests.csv";
  link.href = fileHref;

  // download
  link.click();
}

window.addEventListener('message', event => {
  console.log("Received message from content-script", event.data)

  // Requets list of request from background
  if (event.data.type && event.data.type == "FROM_PAGE" && event.data.action == "getResults") {
    chrome.runtime.sendMessage({
      action: "getResults"
    }, (response) => {
      console.log("Received results from background, sending back to webpage", response)

      exportToCSV(JSON.parse(response.results));

      /*
      postMessage({
        results: response.results,
        action: "getResults"
      });
      */
    })
  }

  // Request coming fom webpage with dataLayer
  if (event.data.type && event.data.type == "FROM_PAGE" && !event.data.action) {
    chrome.runtime.sendMessage({
      dL: event.data.dL
    });
  }
})