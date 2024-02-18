import { Toast } from "../lib/index.js";

const toast = new Toast({
  title: "Browser",
  message: "Choose your favorite",
  button: [
    { 
      text: "Firefox",
      activation:"https://www.mozilla.org/en/firefox/new/", 
      icon: "https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/brands/firefox-browser.svg",
    },
    { 
      text: "Chrome", 
      activation:"https://www.google.com/chrome/",
      icon: "https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/brands/chrome.svg",
    }
  ]
});
  
toast.on("activated", (event) => {
  console.log("url:", event);
})
.on("dismissed", (reason) => {
  console.log("dismissed:", reason);
});
  
toast.show({ keepalive: 10 })
.catch(console.error);