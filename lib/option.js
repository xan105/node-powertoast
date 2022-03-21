/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

import { isIntegerPositive, isArrayOfObj } from "@xan105/is";

const store = {
  win10: "Microsoft.WindowsStore_8wekyb3d8bbwe!App",
  win8: "winstore_cw5n1h2txyewy!Windows.Store"
};

const scenarios = ["default", "alarm", "reminder", "incomingCall"];

const activationTypes = [
  "foreground",
  "background",
  "protocol",
  "system" //undocumented but used by Notification Visualizer ?
];

function normalize(option, legacy) {
  
  let options = {
    disableWinRT: option.disableWinRT || false,
    usePowerShellCore: option.usePowerShellCore || false,
    appID: option.appID || ( legacy ? store.win8 : store.win10 ),
    uniqueID: option.uniqueID || null,
    sequenceNumber: option.sequenceNumber || 0, //0 to indicate "always update"
    title: option.title || "",
    message: option.message || "",
    attribution: option.attribution || "",
    icon: option.icon || "",
    cropIcon: option.cropIcon || false,
    headerImg: option.headerImg || "",
    footerImg: option.footerImg || "",
    silent: option.silent || false,
    hide: option.hide || false,
    audio: option.audio || "",
    longTime: option.longTime || false,
    onClick: option.onClick || "",
    button: isArrayOfObj(option.button) ? option.button : [],
    group: option.group || null,
    scenario: scenarios.includes(option.scenario) ? option.scenario : scenarios[0]
  };
  
  if (option.progress) {
    options.progress = {
      header: option.progress.header || "",
      percent: (option.progress.percent || option.progress.percent === 0) && 
                option.progress.percent >= 0 && 
                option.progress.percent <= 100 ? (option.progress.percent / 100).toFixed(2) : "indeterminate",
      custom: option.progress.custom || "",
      footer: option.progress.footer || "",
    };
  }

  if (option.callback) {
    options.callback = {
      keepalive: isIntegerPositive(option.callback.keepalive) ? option.callback.keepalive : 6,
      onActivated: option.callback.onActivated || function () {},
      onDismissed: option.callback.onDismissed || function () {},
    };
  }
  
  try {
    if (option.timeStamp) options.timeStamp = new Date(+option.timeStamp * 1000).toISOString();
    else options.timeStamp = "";
  } catch { options.timeStamp = "" }
  
  options.activationType = activationTypes.includes(option.activationType) ? option.activationType : 
                           options.callback && !options.onClick ? "background" : "protocol";                  
  options.button.forEach(button => button.activationType = activationTypes.includes(button.activationType) ? button.activationType : "protocol");

  return options; 
}

export { normalize };