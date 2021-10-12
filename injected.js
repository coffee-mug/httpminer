setInterval(() => {
  const dL = JSON.stringify(window.dataLayer);

  window.postMessage({
    type: "FROM_PAGE",
    dL: dL
  })
}, 2000);