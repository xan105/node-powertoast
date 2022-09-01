/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

import { promisify } from "node:util";
import { exec } from "node:child_process";
import { Failure, attempt } from "@xan105/error";
import { isStringNotEmpty, isArrayOfStringNotEmpty } from "@xan105/is";
import { shouldWin10orGreater, shouldStringNotEmpty } from "@xan105/is/assert";

async function remove(appID, uniqueID = null){

  shouldWin10orGreater();
  shouldStringNotEmpty(appID)

  let cmd = "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null;" +
            "[Windows.UI.Notifications.ToastNotificationManager]::History.";
  
  if (isStringNotEmpty(uniqueID)) {
    cmd += `Remove('${uniqueID}','${uniqueID}','${appID}')`;
  } else if (isArrayOfStringNotEmpty(uniqueID)) {
    const [ groupLabel, tag ] = uniqueID;
    if(!groupLabel) throw new Failure("groupLabel can not be omitted", 1);
    cmd += tag ? `Remove('${tag}','${groupLabel}','${appID}')` : `RemoveGroup('${groupLabel}','${appID}')`;
  }else {
    cmd += `Clear('${appID}')`;
  }

  const [ps, err] = await attempt(promisify(exec),[`powershell -NoProfile -NoLogo -Command "${cmd}"`, {windowsHide: true}]);
  if (err || ps.stderr) throw new Failure(err?.stderr || ps.stderr, "ERR_POWERSHELL"); 
}

async function getHistory(appID, verbose = false){

  shouldWin10orGreater();
  shouldStringNotEmpty(appID);
  
  const cmd = "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null;" +
              `[Windows.UI.Notifications.ToastNotificationManager]::History.GetHistory('${appID}') | Format-List`;
  
  const [ps, err] = await attempt(promisify(exec),[`powershell -NoProfile -NoLogo -Command "${cmd}"`, {windowsHide: true}]);
  if (err || ps.stderr) throw new Failure(err?.stderr || ps.stderr, "ERR_POWERSHELL");

  const output = ps.stdout.split("\r\n\r\n").filter(line => line != ""); //Filter out blank space
  const result = output.map((line) => { 
        
    const col = line.trim().split("\r\n");
    const getValue = (s) => s.substring(s.indexOf(":") + 1, s.length).trim();
    
    let info = {
      expirationTime: getValue(col[0]), //regional time string (eg: "01/08/2021 20:53:23 +07:00")
      tag: getValue(col[2]),
      group: getValue(col[4])
    };
    
    if (verbose) {
      info.remoteID = getValue(col[5]) || null,
      info.suppressPopup = getValue(col[3]) === "True",
      info.mirroringAllowed = getValue(col[6]) === "Allowed",
      info.expiresOnReboot = getValue(col[9]) === "True",
      info.highPriority = getValue(col[7]) === "High",
      info.status = getValue(col[8]) || null
    }
    
    return info;   
  });

  return result;
}

export { remove, getHistory }