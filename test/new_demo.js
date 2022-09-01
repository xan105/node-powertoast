import { Toast } from "../lib/toast.js";

const toast = new Toast({
  appID: "Microsoft.XboxGamingOverlay_8wekyb3d8bbwe!App",
  title: "Dummy",
  message: "Hello World",
  icon: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/480/winner.jpg",
  cropIcon: true,
  attribution: "Achievement",
  timeStamp: "1568710924",
  button: [
    { text: "1", onClick: "bingmaps:?q=sushi" },
    { text: "2", onClick: "bingmaps:?q=sushi", contextMenu: true },
    { text: "3", onClick: "bingmaps:?q=sushi" },
    { text: "4", onClick: "bingmaps:?q=sushi" },
    { text: "5", onClick: "bingmaps:?q=sushi" },
    { text: "6", onClick: "bingmaps:?q=sushi" },
  ],
  silent: false,
  audio: "ms-winsoundevent:Notification.Achievement",
  uniqueID: "id0",
  group: {
    id: "id1",
    title: "group",
  },
  heroImg: "../screenshot/example.png",
  activationType: "background",
  loopAudio: false
})
.once("activated", (event)=>{ 
  setImmediate(() => {
    console.log("activated:", event);
  });
})
.once("dismissed", (reason)=>{ 
  setImmediate(() => {
    console.log("dismissed:", reason);
  });
})
.notify({
  disableWinRT: true,
  disablePowershellCore: false,
  keepalive: 10
})
.then(() => {
  console.log("done");
})
.catch((err) => { 
  console.error(err);
});

//real auto test:
//parse xml and verify also if valid xml