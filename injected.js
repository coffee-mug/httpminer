/* PAUSE FOR NOW TO TEST CSV EXPORT
setInterval(() => {
  const dL = JSON.stringify(window.dataLayer);

  window.postMessage({
    type: "FROM_PAGE",
    dL: dL
  })
}, 2000);
*/


window.addEventListener('message', e => {
  if (e.data && e.data.action === "getDataLayer" && e.data.type === "FROM_CONTENT") {
    //copy dataLayer from page
    var dataLayerCopy = {};
    var dataLayer = window.tc_vars;

    for (const variable in dataLayer) {
      if (dataLayer[variable]) {
        dataLayerCopy[variable] = dataLayer[variable];
      }
    }
    //send copy of dataLayer
    console.log("dataLayer from injected.js: ", dataLayerCopy)
    window.postMessage({
      type: "FROM_PAGE",
      dL: JSON.stringify(dataLayerCopy)
    });
  }
});