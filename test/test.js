import { Toast, isWinRTAvailable } from "../lib/toast.js";

console.info("Default transport: " + `${isWinRTAvailable ? "WinRT" : "Powershell"}`);

const toast = new Toast({
  appID: "Microsoft.XboxGamingOverlay_8wekyb3d8bbwe!App",
  title: "Dummy",
  message: "Hello World",
  icon: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/480/winner.jpg",
  cropIcon: true,
  attribution: "Achievement",
  time: "1568710924",
  scenario: "urgent",
  activation: {
    launch: "hello:world",
    type: "protocol"
  },
  button: [
    { text: "", activation: "bingmaps:?q=sushi" },
    { text: "2", activation: "bingmaps:?q=sushi", contextMenu: true },
    { text: "3", activation: "bingmaps:?q=sushi" },
    { text: "4", activation: "bingmaps:?q=sushi" },
    { text: "5", activation: "bingmaps:?q=sushi" },
    { text: "6", activation: "bingmaps:?q=sushi" },
  ],
  audio: "ms-winsoundevent:Notification.Achievement",
  uniqueID: "id0",
  group: {
    id: "id1",
    title: "group",
  },
  heroImg: "../screenshot/example.png",
  input: [
   {
    id: "input0",
    text: "Ping?",
    placeholder: "ping?"
   } 
  ]
});

toast.on("activated", (event, input)=>{ 
  setImmediate(() => {
    console.log("activated:", event);
    console.log("user input: ", input)
  });
})
.on("dismissed", (reason)=>{ 
  setImmediate(() => {
    console.log("dismissed:", reason);
  });
});

toast.show({
  disableWinRT: false,
  disablePowershellCore: true,
  keepalive: 10
}).then(()=>{
  console.log("Sent...");
}).catch(console.error);

setTimeout(()=>{
  toast.clear();
  console.log("removed");
}, 15 * 1000);