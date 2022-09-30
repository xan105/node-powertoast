/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

import { deprecate } from "node:util";
import { isWin8 } from "@xan105/is";
import { Failure } from "@xan105/error";
import { Toast } from "./toast.js";

/*
Map more or less the old 2.x API to the new 3.x API
⚠️ Usage is not recommended and this is provided solely for convenience.
*/
function wrapper(option){
  
  if (isWin8()) throw new Failure("Windows 8/8.1 is EOL so support was removed in 3.0. Use previous 2.x version if you need it.", 3);
  
  //map old name to new option name
  //if object has own properties then new = old
  
  const toast = new Toast(option);

  if (typeof option?.callback?.onActivated === "function"){
    toast.on("activated", option.callback.onActivated)
  }
  if (typeof option?.callback?.onDismissed === "function"){
    toast.on("dismissed", option.callback.onDismissed)
  }  

  return toast.notify({
    disableWinRT: option?.disableWinRT,
    disablePowershellCore: !option?.usePowerShellCore,
    keepalive: option?.callback?.keepalive
  });
}

const notify = deprecate(wrapper, "[powertoast] The default export is deprecated please use the new toast() constructor export instead.");

export { notify };