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

async function remove(aumid, uniqueID = null){

  shouldWin10orGreater();
  shouldStringNotEmpty(aumid)

  let cmd = "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null;" +
            "[Windows.UI.Notifications.ToastNotificationManager]::History.";
  
  if (isStringNotEmpty(uniqueID)) {
    cmd += `Remove('${uniqueID}','${uniqueID}','${aumid}')`;
  } else if (isArrayOfStringNotEmpty(uniqueID)) {
    const [ groupLabel, tag ] = uniqueID;
    cmd += tag ? `Remove('${tag}','${groupLabel}','${aumid}')` : `RemoveGroup('${groupLabel}','${aumid}')`;
  }else {
    cmd += `Clear('${aumid}')`;
  }

  const [ps, err] = await attempt(promisify(exec),[`powershell -NoProfile -NoLogo -Command "${cmd}"`, {windowsHide: true}]);
  if (err || ps.stderr) throw new Failure(err?.stderr || ps.stderr, "ERR_POWERSHELL"); 
}

async function getHistory(aumid, verbose = false){

  shouldWin10orGreater();
  shouldStringNotEmpty(aumid);
  
  const cmd = "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null;" +
              `[Windows.UI.Notifications.ToastNotificationManager]::History.GetHistory('${aumid}') | Format-List`;
  
  const [ps, err] = await attempt(promisify(exec),[`powershell -NoProfile -NoLogo -Command "${cmd}"`, {windowsHide: true}]);
  if (err || ps.stderr) throw new Failure(err?.stderr || ps.stderr, "ERR_POWERSHELL");

  const lines = ps.stdout.split("\r\n\r\n").filter(line => line != ""); //Filter out blank space
  const result = lines.map((line) => { 
        
    const entry = line.trim().split("\r\n");
    const valueFrom = (s) => s.substring(s.indexOf(":") + 1, s.length).trim();
    
    const info = Object.create(null);
    info.expirationTime = valueFrom(entry[0]); //regional time string (eg: "01/08/2021 20:53:23 +07:00")
    info.tag = valueFrom(entry[2]);
    info.group = valueFrom(entry[4]);
    if (verbose) {
      info.remoteID = valueFrom(entry[5]) || null,
      info.suppressPopup = valueFrom(entry[3]) === "True",
      info.mirroringAllowed = valueFrom(entry[6]) === "Allowed",
      info.expiresOnReboot = valueFrom(entry[9]) === "True",
      info.highPriority = valueFrom(entry[7]) === "High",
      info.status = valueFrom(entry[8]) || null
    }
    
    return info;   
  });

  return result;
}

export { remove, getHistory }