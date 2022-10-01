/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

import { deprecate } from "node:util";
import { isWin8, isObj } from "@xan105/is";
import { Failure } from "@xan105/error";
import { Toast } from "./toast.js";

/*
Map more or less the old 2.x API to the new 3.x API
⚠️ Usage is not recommended and this is provided solely for convenience.
*/
function wrapper(option){
  
  if (isWin8()) throw new Failure("Windows 8/8.1 is EOL so support was removed in 3.0. Use previous 2.x version if you need it.", 3);
  
  if (!isObj(option)) option = {};
  
  const settings = {
    disableWinRT: option.disableWinRT,
    disablePowershellCore: !option.usePowerShellCore,
    keepalive: option.callback?.keepalive
  };
  
  delete option.disableWinRT;
  delete option.usePowerShellCore;
  delete option.callback?.keepalive;
  
  if (Object.hasOwn(option, "timeStamp")){
    option.time = +option.timeStamp;
    delete option.timeStamp;
  }
  
  if (isObj(option.progress)){
    if (Object.hasOwn(option.progress, "header")){
      option.progress.title = option.progress.header;
      delete option.progress.header;
    }
    if (Object.hasOwn(option.progress, "footer")){
      option.progress.status = option.progress.footer;
      delete option.progress.footer;
    }
    if (Object.hasOwn(option.progress, "percent")) {
      option.progress.value = option.progress.percent;
      delete option.progress.percent;
    }
    if (Object.hasOwn(option.progress, "custom")) {
      option.progress.valueOverride = option.progress.custom;
      delete option.progress.custom;
    }
  }

  console.log(option);
  
  const toast = new Toast(option);

  if (typeof option.callback?.onActivated === "function"){
    toast.on("activated", option.callback.onActivated)
  }
  if (typeof option.callback?.onDismissed === "function"){
    toast.on("dismissed", option.callback.onDismissed)
  }

  return toast.notify(settings);
}

const notify = deprecate(wrapper, "[powertoast]: The default export is deprecated please use the new toast() constructor export instead.");

export { notify };