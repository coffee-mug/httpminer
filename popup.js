var counter = document.getElementById("reqCounter");
var buttonDownload = document.getElementById("csv");

const exportToCSV = (data) => {
    console.log(data);
    const csv = data
        /*  
          .split(",")
          */
        .map(row => row.join(','))
        .join('\n');
    var blob = new Blob([csv], {
        type: 'text/csv;charset=utf-8;'
    })

    // createObjectURL temporarily stores the data in browser and assigns it a local URL
    var fileHref = URL.createObjectURL(blob)
    // download
    chrome.downloads.download({
        url: fileHref,
        filename: `httpminer_audit_${+new Date()}.csv`
    });
}

//Updating the counter
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // export results to content-script
    if (message && message.action === "reqCounter") {
        sendResponse({
            action: "ok"
        });
        counter.innerText = message.counter;
    }

    if (message && message.action == "gotResults" && message.type === "FROM_BACK") {
        exportToCSV(JSON.parse(message.results))
    }
});

//Download button
buttonDownload.addEventListener("click", (ev) => {
    chrome.runtime.sendMessage({
        type: "FROM_POPUP",
        action: "getResults"
    });
});