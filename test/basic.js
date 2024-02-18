import { Toast } from "../lib/index.js";

const toast = new Toast({
  aumid: "Microsoft.XboxGamingOverlay_8wekyb3d8bbwe!App",
  title: "Notification",
  message: "Hello World !",
  icon: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/480/winner.jpg"
});

toast.on("activated", (event, input) => { 
  console.log("click");
});
toast.on("dismissed", (reason) => { 
  console.log(reason);
});

toast.show()
.catch(console.error);