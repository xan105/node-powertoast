/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

import {
  isString,
  isStringNotEmpty,
  isIntegerPositive, 
  isIntegerWithinRange
} from "@xan105/is";
import { 
  asBoolean, 
  asString,
  asStringNotEmpty,
  asObjLike,
  asArrayOfSomeObjLike,
  asIntegerPositiveOrZero
} from "@xan105/is/opt";

const scenarios = [
  "default", 
  "alarm", 
  "reminder", 
  "incomingCall", 
  "urgent" //win11 22h2
];

/*const commands = [
  "snooze",
  "dismiss",
  "video",
  "voice",
  "decline"
];*/

const activationTypes = [
  "protocol",
  "background",
  "foreground",
  "system" //system call such as alarm (snooze/dismiss), also used by Notification Visualizer
];

const btnStyle = [ //win11 btn color
  "success", //Green
  "critical" //Red
];

function normalize(option) {
  
  let options = {
    appID: asStringNotEmpty(option.appID) ?? "Microsoft.WindowsStore_8wekyb3d8bbwe!App",
    uniqueID: asStringNotEmpty(option.uniqueID),
    sequenceNumber: asIntegerPositiveOrZero(option.sequenceNumber) ?? 0, //0 indicates "always update"
    title: asString(option.title) ?? "",
    message: asString(option.message) ?? "",
    attribution: asString(option.attribution) ?? "",
    icon: asString(option.icon) ?? "",
    cropIcon: asBoolean(option.cropIcon) ?? false,
    heroImg: asString(option.heroImg) ?? "",
    inlineImg: asString(option.inlineImg) ?? "",
    audio: isString(option.audio) && option.audio.startsWith("ms-winsoundevent:") ? option.audio : "",
    loopAudio: asBoolean(option.loopAudio) ?? false,
    silent: asBoolean(option.silent) ?? false,
    hide: asBoolean(option.hide) ?? false,
    longTime: asBoolean(option.longTime) ?? false,
    onClick: asString(option.onClick) ?? "",
    button: asArrayOfSomeObjLike(option.button, {
      text: isString,     
      onClick: isStringNotEmpty
    }) ?? [],
    group: asObjLike(option.group, {
      id: isStringNotEmpty,
      title: isStringNotEmpty
    }),
    scenario: scenarios.includes(option.scenario) ? option.scenario : scenarios[0],
    time: isIntegerPositive(option.time) ? option.time * 1000 : Date.now(), //Unix time
    expiration: isIntegerPositive(option.expiration) ? Date.now() + (option.expiration * 1000) : null //amount of time until discarded
  };
  
  if (option.progress) {
    options.progress = {
      title: asString(option.progress.title) ?? "",
      value: isIntegerWithinRange(option.progress.value, 0, 100) ? (option.progress.value / 100).toFixed(2) : "indeterminate",
      valueOverride: asString(option.progress.valueOverride) ?? "",
      status: asString(option.progress.status) ?? "",
    };
  }
           
  options.activationType = activationTypes.includes(option.activationType) ? option.activationType : 
                           !options.onClick ? activationTypes[1] : activationTypes[0];       
                                          
  options.button.forEach((button) => { 
    button.contextMenu = asBoolean(button.contextMenu) ?? false;
    button.tooltip = asString(button.tooltip) ?? "";
    button.style = btnStyle.includes(button.style) ? button.style : "";
    button.icon = asString(button.icon) ?? "";
    button.activationType = activationTypes.includes(button.activationType) ? button.activationType : activationTypes[0];
  });
  
  return options; 
}

export { normalize };