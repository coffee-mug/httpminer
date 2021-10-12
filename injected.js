/* PAUSE FOR NOW TO TEST CSV EXPORT
setInterval(() => {
  const dL = JSON.stringify(window.dataLayer);

  window.postMessage({
    type: "FROM_PAGE",
    dL: dL
  })
}, 2000);
*/


// TODO: refactor this, I'm just testing for now
const button = document.createElement('button');
button.textContent = "Download request in CSV";

button.style.bottom = "5vh";
button.style.right = "5vw";
button.style.position = "absolute";

button.addEventListener('click', e => {
  // We must communicate through postMessage
  window.postMessage({
    type: "FROM_PAGE",
    action: "getResults"
  })
})

document.body.appendChild(button);

window.addEventListener('message', e => {
  if (e.data && e.data.action == "getResults" && e.data.results) {
    let parsed = JSON.parse(e.data.results);
    exportToCSV(parsed);
  }
})