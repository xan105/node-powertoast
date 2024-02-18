/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

import { EventEmitter } from "node:events";
import { shouldWin10orGreater, shouldObj } from "@xan105/is/assert";
import { asBoolean, asIntegerPositive } from "@xan105/is/opt";
import { attemptify } from "@xan105/error";

import { parse } from "./option.js";
import { xmlStringBuilder } from "./xml.js";
import { nodert as winRT} from "./optional/dependencies.js";
import { notify as powershell } from "./toaster/powershell.js";
import { notify as nodert } from "./toaster/nodert.js";
import { remove } from "./notificationCenter.js";

class Toast extends EventEmitter {

  constructor(option){
    shouldWin10orGreater();
    super();
    this.options = parse(option);
  }

  async show(option = {}){
    
    shouldObj(option);
    const options = {
      disableWinRT: asBoolean(option.disableWinRT) ?? false,
      disablePowershellCore: asBoolean(option.disablePowershellCore) ?? false,
      keepalive: asIntegerPositive(option.keepalive) ?? 6
    };

    const usePowerShell = !winRT || (winRT && options.disableWinRT === true);
    const xmlString = xmlStringBuilder(this.options);
    
    if (usePowerShell)
      await powershell.call(this, xmlString, options);
    else
      nodert.call(this, xmlString, options);
  }
  
  async clear(){
    this.removeAllListeners(this.eventNames());
    await attemptify(remove)(this.options.aumid, this.options.uniqueID);
  }
}

export { Toast };
export const isWinRTAvailable = Boolean(winRT);