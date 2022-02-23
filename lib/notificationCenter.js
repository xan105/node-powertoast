/*
MIT License

Copyright (c) Anthony Beaumont

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { promisify } from "node:util";
import { exec } from "node:child_process";
import { Failure } from "@xan105/error";
import { shouldWin10orGreater } from "@xan105/is/assert";

async function remove(appID, uniqueID = null){

  shouldWin10orGreater();
  
  if (!appID) throw new Failure("An invalid or unsupported value was passed for the argument 'appID'","ERR_INVALID_ARGS");
  
  let clear = "[Windows.UI.Notifications.ToastNotificationManager]::History.";
  
  if (uniqueID)
  {
    if (!Array.isArray(uniqueID)) {
      clear += `Remove('${uniqueID}','${uniqueID}','${appID}')`;
    } else if (uniqueID.length === 2) {
      const tag = uniqueID[0];
      const groupLabel = uniqueID[1];
    
       if (groupLabel && !tag) {
        clear += `RemoveGroup('${groupLabel}','${appID}')`;
       } else if (groupLabel && tag) {
        clear += `Remove('${tag}','${groupLabel}','${appID}')`;
       } else {
        throw new Failure("groupLabel can not be omitted","ERR_MALFORMED_ARGS");
       }
    } else {
      throw new Failure("uniqueID as an array is [tag or null, groupLabel]","ERR_MALFORMED_ARGS");
    }
  }
  else 
  {
    clear += `Clear('${appID}')`;
  }
  
  const cmd = "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null;" + clear;
    
  const ps = await promisify(exec)(`powershell -NoProfile "${cmd}"`,{windowsHide: true});
  if (ps.stderr) throw new Failure(ps.stderr,"ERR_UNEXPECTED_POWERSHELL_FAIL");
    
}

async function getHistory(appID, verbose = false){

  shouldWin10orGreater();
  
  if (!appID) throw new Failure("An invalid or unsupported value was passed for the argument 'appID'","ERR_INVALID_ARGS");
  
  const cmd = "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null;" +
              `[Windows.UI.Notifications.ToastNotificationManager]::History.GetHistory('${appID}') | Format-List`;
  
  const ps = await promisify(exec)(`powershell -NoProfile "${cmd}"`,{windowsHide: true});
  if (ps.stderr) throw new Failure(ps.stderr,"ERR_UNEXPECTED_POWERSHELL_FAIL");

  const output = ps.stdout.split("\r\n\r\n").filter(line => line != ""); //Filter out blank space

  const result = output.map((line) => { 
        
    const col = line.trim().split("\r\n");
    const getValue = (string) => string.substring(string.indexOf(":") + 1, string.length).trim();
    
    let info = {
      expirationTime: getValue(col[0]), //regional time string (eg: "01/08/2021 20:53:23 +07:00")
      tag: getValue(col[2]),
      group: getValue(col[4])
    };
    
    if (verbose) {
      info.remoteID = getValue(col[5]) || null,
      info.suppressPopup = getValue(col[3]) === "True" ? true : false,
      info.mirroringAllowed = getValue(col[6]) === "Allowed" ? true : false,
      info.expiresOnReboot = getValue(col[9]) === "True" ? true : false,
      info.highPriority = getValue(col[7]) === "High" ? true : false,
      info.status = getValue(col[8]) || null
    }
    
    return info;   
  });

  return result;
}

export { remove, getHistory }