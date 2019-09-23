'use strict';

const toast = require('./toast.js');

toast({
  appID: "Microsoft.XboxApp_8wekyb3d8bbwe!Microsoft.XboxApp",
  title: "Dummy",
  message: "Hello World",
  icon: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/480/winner.jpg",
  timeStamp: "1568710924",
  button: [
    {text: "1", onClick: "bingmaps:?q=sushi"},
    {text: "2", onClick: "bingmaps:?q=sushi"},
    {text: "3", onClick: "bingmaps:?q=sushi"},
    {text: "4", onClick: "bingmaps:?q=sushi"},
    {text: "5", onClick: "bingmaps:?q=sushi"},
    {text: "6", onClick: "bingmaps:?q=sushi"}
  ],
  audio: "ms-winsoundevent:Notification.Achievement",
  progress:{
    header: "up",
    footer: "down",
    percent: 88
  }
}).then(()=>{console.log("ok")}).catch((err)=>{console.log(err)});