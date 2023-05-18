import { Toast } from "../lib/toast.js";

const toast = new Toast({
  appID: "Microsoft.XboxGamingOverlay_8wekyb3d8bbwe!App",
  title: "Dummy",
  message: "Hello World",
  icon: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/480/winner.jpg",
  cropIcon: true,
  attribution: "Achievement",
  timeStamp: "1568710924",
  scenario: "urgent",
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
  loopAudio: false,
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

console.log("fire");
toast.show({
  disableWinRT: false,
  disablePowershellCore: false,
  keepalive: 10
}).then(()=>{
  console.log("ok");
})

/*setTimeout(()=>{
  toast.clear();
}, 7 * 1000);*/

//real auto test:
//parse xml and verify also if valid xml