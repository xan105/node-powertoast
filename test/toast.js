import toast, { isWinRTAvailable } from "../lib/index.js";

console.info("Default transport: " + `${isWinRTAvailable ? "WinRT" : "Powershell"}`);

toast({
  disableWinRT: false,
  usePowerShellCore: true,
  appID: "Microsoft.XboxApp_8wekyb3d8bbwe!Microsoft.XboxApp",
  title: "Dummy",
  message: "Hello World",
  icon: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/480/winner.jpg",
  cropIcon: true,
  attribution: "Achievement",
  timeStamp: "1568710924",
  input:[
    { id: "textBox", placeholder: "Type a reply", title: "I'm a title"}
  ],
  select:[
    {
      id: "pkmn",
      title: "Choose wisely",
      //defaultID: "blue",  //a default value will make it sticky, because it's like user already input something
      items:[
        { id: "red", text: "Salameche" },
        { id: "blue", text: "Carapuce" },
        { id: "green", text: "Bulbizarre" }
      ]
    }
  ],
  button: [
    { text: "send", onClick: "bingmaps:?q=sushi", id: "textBox" },
    { text: "2", onClick: "bingmaps:?q=sushi", contextMenu: true },
    { text: "choose pkmn", onClick: "bingmaps:?q=sushi", id: "pkmn" },
    { text: "4", onClick: "bingmaps:?q=sushi" },
    { text: "5", onClick: "bingmaps:?q=sushi" },
    { text: "6", onClick: "bingmaps:?q=sushi" },
  ],
  silent: false,
  audio: "ms-winsoundevent:Notification.Achievement",
  progress: {
    header: "up",
    footer: "down",
    percent: 0,
  },
  //uniqueID: "id0",
  group: {
    id: "id1",
    title: "group",
  },
  headerImg: "../screenshot/example.png",
  callback: {
    keepalive: 10,
    onActivated: (args, value) => {
      console.log("activated", args, value);
    },
    onDismissed: (reason) => {
      console.log("dismissed", reason);
    },
  },
})
.then(() => {
  console.log("ok");
})
.catch((err) => {
  console.error(err);
});