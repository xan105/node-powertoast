/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { exec } from "node:child_process";
import { shouldWin8orGreater } from "@xan105/is/assert";
import { isWin8 } from "@xan105/is";
import { writeFile, deleteFile } from "@xan105/fs";
import { Failure } from "@xan105/error";

import { normalize } from "./option.js";
import { generate } from "./template.js";
//optional peerDependencies
import { loadWinRT } from "./nodert.js";
const winRT = await loadWinRT();

async function notify(option = {}) {
  
  shouldWin8orGreater();
  
  const legacy = isWin8(); //Windows 8 && Windows 8.1
  const options = normalize(option, legacy);
  const powerShell = !winRT || (winRT && options.disableWinRT === true) ? true : false;
  const template = generate(options, powerShell, legacy);

  if (powerShell) 
  {
    const rng = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const scriptPath = join(tmpdir() || process.env.TEMP, `${Date.now()}${rng(0, 1000)}.ps1`);
      
    try{
      //Create script
      await writeFile(scriptPath, template, { encoding: "utf8", bom: true });
        
      //Excecute script
      const shell = options.usePowerShellCore ? "pwsh" : "powershell"; 
      const cmd = `-NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`;
      const ps = await promisify(exec)(`${shell} ${cmd}`,{ windowsHide: true });
      if (ps.stderr) throw new Failure(ps.stderr,"ERR_UNEXPECTED_POWERSHELL_FAIL");

      if (options.callback && ps.stdout) {
        if (ps.stdout.includes("<@onFailed/>")){
          throw new Failure("Failed to raise notification","ERR_UNEXPECTED_POWERSHELL_FAIL");
        } else if (ps.stdout.includes("<@onActivated/>")){
          options.callback.onActivated(); //cb
        } else if (ps.stdout.includes("<@onDismissed>") && ps.stdout.includes("</@onDismissed>")) {
          const tag = "<@onDismissed>";
          const start = ps.stdout.indexOf(tag) + tag.length;
          const end = ps.stdout.indexOf("</@onDismissed>");
          const reason = ps.stdout.slice(start,end);
          options.callback.onDismissed(reason); //cb
        }
      }
     
      //Clean up
      await deleteFile(scriptPath);
    }catch(err){
      await deleteFile(scriptPath);
      throw err;
    } 
  } 
  else 
  {  
    const xml = new winRT.xml.XmlDocument();
    xml.loadXml(template);

    let toast = new winRT.notifications.ToastNotification(xml);
    if (!toast) throw new Failure("Failed to create a new 'ToastNotification'","ERR_UNEXPECTED_WINRT_FAIL");

    if (!legacy) {
      toast.data = new winRT.notifications.NotificationData();
      toast.data.sequenceNumber = +options.sequenceNumber;
      if (options.hide) toast.suppressPopup = true;
      if (options.uniqueID) toast.tag = toast.group = options.uniqueID;
    }

    const toaster = winRT.notifications.ToastNotificationManager.createToastNotifier(options.appID);
    if (!toaster) throw new Failure("Failed to create a new 'ToastNotifier'","ERR_UNEXPECTED_WINRT_FAIL");

    //System check
    if (toaster.setting > 0) {
      const reasons = {
        1: "Notifications are disabled by app manifest",
        2: "Notifications are disabled by Windows group policy",
        3: "Notifications are disabled for this user (system-wide)",
        4: "Notifications are disabled for this app only (Windows settings)"
      };
      throw new Failure(reasons[toaster.setting] ?? `Notifications are disabled: ${toaster.setting}`, "ERR_NOTIFICATION_DISABLED");
    }

    //WinRT: does not keep the event loop alive
    if (options.callback) {
      //Keep it alive for user provided amount of time
      const keepalive = setTimeout(() => {}, options.callback.keepalive * 1000);

      toast.on("activated", () => {
        clearTimeout(keepalive);
        options.callback.onActivated(); //cb
      });

      toast.on("dismissed", (_, { reason }) => {
        clearTimeout(keepalive);
        const reasons = {
          0: "UserCanceled", //User dismissed the toast
          1: "ApplicationHidden", //App explicitly hid the toast by calling the ToastNotifier.hide method
          2: "TimedOut" //Toast had been shown for the maximum allowed time and was faded out
        };
        options.callback.onDismissed(reasons[reason] ?? `Dismissed: ${reason}`); //cb
      });

      toast.on("failed", (_, { error }) => {
        clearTimeout(keepalive);
        throw new Failure(`Failed to raise notification: ${error.ErrorCode}`,"ERR_UNEXPECTED_WINRT_FAIL");
      });

    } else {
      //Keep it alive for a short time. Better safe than sorry.
      setTimeout(() => {}, 100);
    }
    toaster.show(toast);
  }
}

export { notify };
export const isWinRTAvailable = winRT ? true : false;