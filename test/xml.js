import { makeXML } from "../lib/index.js";

const options = {
  appID: "io.github.xan105.achievement.watcher",
  title: "Dummy",
  message: "Hello World",
  icon: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/480/winner.jpg",
  cropIcon: true,
  attribution: "Achievement",
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
  progress: {
    header: "up",
    footer: "down",
    percent: 0,
  },
  uniqueID: "id0",
  group: {
    id: "id1",
    title: "group",
  },
  headerImg: "../screenshot/example.png",
  //legacy: true
};

const string = makeXML(options);
console.log(string);