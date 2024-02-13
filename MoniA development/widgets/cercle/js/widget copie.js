const url = new URL(document.currentScript.src);

let path;
for (const [key, value] of url.searchParams) {
  if (key === "path") {
    path = value;
  }
}

if (path) {
  const domain = 'https://devel.cercle.business'
  const widgetDir = `${domain}/widgets/cercle`

  const widgetWrapper = document.createElement("div");
  widgetWrapper.classList.add(
    "activ-ha-widget__wrapper",
    "activ-ha-widget__wrapper--closed"
  );
  widgetWrapper.style.width = "64px";
  widgetWrapper.style.height = "64px";
  widgetWrapper.style.position = "fixed";
  widgetWrapper.style.bottom = "20px";
  widgetWrapper.style.left = "50%";
  widgetWrapper.style.transform = "translateX(-50%)";
  widgetWrapper.style.overflow = "auto";
  widgetWrapper.style.border = "0";
  widgetWrapper.style.transition =
    "height 0.2s cubic-bezier(0, 0.55, 0.45, 1)";
  widgetWrapper.style.filter = "drop-shadow(0 0 8px rgba(0, 0, 0, 0.16))";
  widgetWrapper.style.zIndex = 2147483000;
  document.querySelector("body").appendChild(widgetWrapper);

  const openIcon = document.createElement("img");
  openIcon.className = "activ-ha-widget__icon--open";
  openIcon.src = `${widgetDir}/assets/cercle-icon.png`;
  openIcon.width = 64;
  openIcon.style.position = "absolute";
  openIcon.style.bottom = 0;
  openIcon.style.left = "50%";
  openIcon.style.transform = "translateX(-50%)";
  openIcon.style.cursor = "pointer";
  widgetWrapper.appendChild(openIcon);

  const closeIcon = document.createElement("img");
  closeIcon.className = "activ-ha-widget__icon--close";
  closeIcon.width = 16;
  closeIcon.style.display = "none";
  closeIcon.style.cursor = "pointer";
  closeIcon.style.position = "absolute";
  closeIcon.style.top = "5px";
  closeIcon.style.right = "5px";
  closeIcon.style.zIndex = 2147483001;
  closeIcon.src = `${widgetDir}/assets/cross-outline.png`;
  widgetWrapper.appendChild(closeIcon);

  const widgetContainer = document.createElement("div");
  widgetContainer.style.width = "100%";
  widgetContainer.style.height = "500px";
  widgetContainer.style.display = "flex";
  widgetContainer.style.justifyContent = "center";
  widgetContainer.style.alignItems = "center";
  widgetWrapper.appendChild(widgetContainer);

  const widget = document.createElement("iframe");
  const frameUrl = `${domain}/${path}`;
  widget.setAttribute("src", frameUrl);
  widget.style.width = "100%";
  widget.style.height = "100%";
  widget.style.position = "relative";
  widget.style.overflow = "auto";
  widget.style.border = 0;
  widget.style.display = "none";
  widget.classList.add("activ-ha-widget");
  widgetContainer.appendChild(widget);
  
  const loaderStyleSheet = document.createElement("link");
  loaderStyleSheet.rel = "stylesheet";
  loaderStyleSheet.type = "text/css";
  loaderStyleSheet.href = `${widgetDir}/css/load8.css`;
  document.head.appendChild(loaderStyleSheet);

  openIcon.addEventListener("click", async function () {
    openIcon.style.display = "none";
    closeIcon.style.display = "block";
    widgetWrapper.classList.add('loading')
    widgetWrapper.style.width = '330px'
    widgetWrapper.style.height = '500px'
    widgetWrapper.style.border = '2px #D5FE6C solid'
    widgetWrapper.style.transition = 'height 0.2s cubic-bezier(0, 0.55, 0.45, 1)'
    widgetWrapper.style.filter = 'drop-shadow(0 0 20px rgba(0, 0, 0, 0.16))'
    widgetWrapper.classList.remove('activ-ha-widget__wrapper--closed')
    widgetWrapper.classList.add('activ-ha-widget__wrapper--opened')
    widget.style.display = 'block'
  })

  closeIcon.addEventListener('click', function () {
    openIcon.style.display = 'block'
    closeIcon.style.display = 'none'
    widget.style.display = 'none'
    widgetWrapper.classList.remove('loading')
    widgetWrapper.style.width = '64px'
    widgetWrapper.style.height = '64px'
    widgetWrapper.style.border = '0'
    widgetWrapper.style.transition = 'height 0.2s cubic-bezier(0, 0.55, 0.45, 1)'
    widgetWrapper.style.filter = 'drop-shadow(0 0 8px rgba(0, 0, 0, 0.16))'
    widgetWrapper.classList.remove('activ-ha-widget__wrapper--opened')
    widgetWrapper.classList.add('activ-ha-widget__wrapper--closed')
  })

  widget.addEventListener('load', function () {
    widgetWrapper.classList.remove('loading')
  })

//   commmunication of active url in iframe between different tabs in parent
//   let firstLoad
//   window.addEventListener('load', function () {
//     firstLoad = true
//   })
// 
//   window.addEventListener('message', function (evt) {
//     const data = JSON.parse(evt.data)
//     if (data.event === 'iframe_change') {
//       const excludeUrls = ['/lead-creation', '/demo-comactiv'] // do not do "localStorage.setItem" for these urls
//       const excluded = excludeUrls.some(url => location.pathname.endsWith(url))
// 
//       if (firstLoad && !excluded) {
//         firstLoad = false
//         const activeUrl = localStorage.getItem('activha-url')
//         activeUrl ? widget.setAttribute('src', activeUrl) : localStorage.setItem('activha-url', data.url.href)
//       } else {
//         localStorage.setItem('activha-url', data.url.href)
//       }
//     }
//   })
// 
//   when already visited tab is active again, sync with current iframe url
//   document.addEventListener('visibilitychange', function () {
//     if (!document.hidden) {
//       const activeUrl = localStorage.getItem('activha-url')
//       if (activeUrl) {
//         widget.setAttribute('src', activeUrl)
//       }
//     }
//   })
}
