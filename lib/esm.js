/*
MIT License

Copyright (c) 2019-2021 Anthony Beaumont

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

import { tmpdir } from "node:os";
import { writeFile, unlink as deleteFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { exec } from "node:child_process";

import { compatibility, rng } from "./util/helper.js";
import { normalize } from "./option.js";
import { generate } from "./template.js";
import { Failure } from "./util/error.js";

//optional peerDependencies
import { loadWinRT } from "./util/nodert.js";
const winRT = await loadWinRT();

export default async function (option = {}) {

  const legacy = compatibility();
  const options = normalize(option, legacy);
  const powerShell = !winRT || (winRT && options.disableWinRT === true) ? true : false;
  const template = generate(options, powerShell, legacy);

  if (powerShell) 
  {
    
    const scriptPath = join(tmpdir() || process.env.TEMP, `${Date.now()}${rng(0, 1000)}.ps1`);
      
    try{
      //Create script
      const bom = "\ufeff";
      await writeFile(scriptPath, bom + template, "utf8");
        
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
          const start = ps.stdout.indexOf("<@onDismissed>") + 14;
          const end = ps.stdout.indexOf("</@onDismissed>");
          const reason = ps.stdout.slice(start,end);
          options.callback.onDismissed(reason); //cb
        }
      }
     
      //Clean up
      await deleteFile(scriptPath).catch(() => {});
    }catch(err){
      await deleteFile(scriptPath).catch(() => {});
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
    if (toaster.setting === 1) {
      throw new Failure("Notifications are disabled by app manifest","ERR_NOTIFICATION_DISABLED");
    } else if (toaster.setting === 2) {
      throw new Failure("Notifications are disabled by Windows group policy","ERR_NOTIFICATION_DISABLED");
    } else if (toaster.setting === 3) {
      throw new Failure("Notifications are disabled for this user (system-wide)","ERR_NOTIFICATION_DISABLED");
    } else if (toaster.setting === 4) {
      throw new Failure("Notifications are disabled for this app only (Windows settings)","ERR_NOTIFICATION_DISABLED");
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
        if (reason === 0) { //User dismissed the toast
          options.callback.onDismissed("UserCanceled"); //cb
        } else if (reason === 1) { //App explicitly hid the toast by calling the ToastNotifier.hide method
          options.callback.onDismissed("ApplicationHidden"); //cb
        } else if (reason === 2) { //Toast had been shown for the maximum allowed time and was faded out
          options.callback.onDismissed("TimedOut"); //cb
        }
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

export const isWinRTAvailable = winRT ? true : false;
export * from './actionCenter.js';
