'use strict';

const toast = require('./toast.js');

toast({
  disableWinRT: true,
  appID: "Microsoft.XboxApp_8wekyb3d8bbwe!Microsoft.XboxApp",
  title: "Dummy",
  message: "Hello World",
  icon: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/480/winner.jpg",
  attribution: "Achievement",
  timeStamp: "1568710924",
  button: [
    {text: "1", onClick: "bingmaps:?q=sushi"},
    {text: "2", onClick: "bingmaps:?q=sushi"},
    {text: "3", onClick: "bingmaps:?q=sushi"},
    {text: "4", onClick: "bingmaps:?q=sushi"},
    {text: "5", onClick: "bingmaps:?q=sushi"},
    {text: "6", onClick: "bingmaps:?q=sushi"}
  ],
  silent: false,
  audio: "ms-winsoundevent:Notification.Achievement",
  progress:{
    header: "up",
    footer: "down",
    percent: 92,
    tag: "id0"
  }
}).then(()=>{console.log("ok")}).catch((err)=>{console.log(err)});