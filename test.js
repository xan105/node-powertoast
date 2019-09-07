'use strict';

const toast = require('./toast.js');

toast({
  appID: "Microsoft.XboxApp_8wekyb3d8bbwe!Microsoft.XboxApp",
  title: "Dummy",
  message: "Hello World",
  icon: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/480/winner.jpg"
}).then(()=>{console.log("ok")}).catch((err)=>{console.log(err)});