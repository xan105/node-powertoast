/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

import { randomUUID } from "node:crypto";
import { shouldObj } from "@xan105/is/assert";
import {
  isString,
  isStringNotEmpty,
  isIntegerPositive, 
  isIntegerWithinRange,
  isArrayOfObjLike
} from "@xan105/is";
import { 
  asBoolean, 
  asString,
  asStringNotEmpty,
  asObj,
  asObjLike,
  asArrayOfObj,
  asArrayOfSomeObjLike,
  asIntegerPositiveOrZero
} from "@xan105/is/opt";

const Scenarios = [
  "default", 
  "alarm", 
  "reminder", 
  "incomingCall", 
  "urgent" //win10/11 22h2
];

const Activation = {
  types: [
    "protocol",
    "background",
    "foreground",
    "system" //system call such as alarm (snooze/dismiss), also used by Notification Visualizer
  ],
  behavior: [
    "default",
    "pendingUpdate"
  ]
};

const Styles = {
  success: "Success", //green
  critical: "Critical" //red
};

const AUMID = "Microsoft.WindowsStore_8wekyb3d8bbwe!App"; //MS Store (≥Win10)

function parse(option) {
  
  shouldObj(option);
  
  const currentTime = Date.now();
  
  const options = {
    aumid: asStringNotEmpty(option.aumid) ?? AUMID,
    uniqueID: asStringNotEmpty(option.uniqueID) ?? randomUUID(),
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
    activation: isString(option.activation) ? { launch: option.activation } : asObj(option.activation) ?? {},
    button: asArrayOfObj(option.button) ?? [],
    input: asArrayOfSomeObjLike(option.input, {
      id: isStringNotEmpty
    }) ?? [],
    select: asArrayOfSomeObjLike(option.select, {
      id: isStringNotEmpty,
      items: [isArrayOfObjLike,[{
        id: isStringNotEmpty,
        text: isStringNotEmpty
      }]]
    }) ?? [],
    group: asObjLike(option.group, {
      id: isStringNotEmpty,
      title: isStringNotEmpty
    }),
    scenario: Scenarios.includes(option.scenario) ? option.scenario : Scenarios[0],
    time: isIntegerPositive(option.time) ? option.time * 1000 : currentTime, //Unix time
    expiration: isIntegerPositive(option.expiration) ? currentTime + (option.expiration * 1000) : null //amount of time until discarded
  };
  
  if (option.progress) {
    options.progress = {
      title: asString(option.progress.title) ?? "",
      value: isIntegerWithinRange(option.progress.value, 0, 100) ? (option.progress.value / 100).toFixed(2) : "indeterminate",
      valueOverride: asString(option.progress.valueOverride) ?? "",
      status: asString(option.progress.status) ?? "",
    };
  }
  
  options.activation.launch = asString(options.activation.launch) ?? "",
  options.activation.type = Activation.types.includes(options.activation.type) ? options.activation.type : 
                           !options.activation.launch ? Activation.types[1] : Activation.types[0];
  options.activation.pfn = options.activation.type === Activation.types[0] && options.activation.launch ? asString(options.activation.pfn) ?? "" : "";
  
  if (option.group){
    options.group.activation = isString(options.group.activation) ? { launch: options.group.activation } : asObj(options.group.activation) ?? {};
    options.group.activation.launch = asString(options.group.activation.launch) ?? "",
    options.group.activation.type = options.group.activation.type === Activation.types[0] || options.group.activation.type === Activation.types[2] ? options.group.activation.type : Activation.types[0];
    options.group.activation.pfn = options.group.activation.type === Activation.types[0] && options.group.activation.launch ? asString(options.group.activation.pfn) ?? "" : "";
  }

  options.button.forEach((button) => {
    button.text = asString(button.text) ?? "",
    button.icon = asString(button.icon) ?? "";
    button.tooltip = isString(button.tooltip) && !button.text ? button.tooltip : "";
    button.style = Styles[button.style] ?? "";
    button.contextMenu = asBoolean(button.contextMenu) ?? false;
    button.id = asString(button.id) ?? "";
    button.activation = isString(button.activation) ? { launch: button.activation } : asObj(button.activation) ?? {};
    button.activation.launch = asString(button.activation.launch) ?? "",
    button.activation.type = Activation.types.includes(button.activation.type) ? button.activation.type : 
                           !button.activation.launch ? Activation.types[1] : Activation.types[0];
    button.activation.pfn = button.activation.type === Activation.types[0] && button.activation.launch ? asString(button.activation.pfn) ?? "" : "";
    button.activation.behavior = button.activation.type === Activation.types[1] && Activation.behavior.includes(button.activation.behavior) ? button.activation.behavior : "";
  });
  
  options.input.forEach((input) => {
    input.title = asString(input.title) ?? "";
    input.placeholder = asString(input.placeholder) ?? "";
    input.default = asString(input.value) ?? "";
    delete input.value;
  });
  
  options.select.forEach((select) => {
    const id = select.items?.find((item) => item.default === true)?.id;
    select.default = asString(id) ?? "";
    select.title = asString(select.title) ?? "";
  });
  
  return Object.freeze(options); 
}

export { parse };