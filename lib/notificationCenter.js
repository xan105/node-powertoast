/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

import { promisify } from "node:util";
import { exec } from "node:child_process";
import { Failure } from "@xan105/error";
import { shouldWin10orGreater, shouldStringNotEmpty } from "@xan105/is/assert";

async function remove(appID, uniqueID = null){

  shouldWin10orGreater();
  shouldStringNotEmpty(appID)

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
  shouldStringNotEmpty(appID);
  
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