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
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { exec } from "node:child_process";

import { compatibility, rng } from "./helper.js";
import normalize from "./option.js";
import generate from "./template/template.js";

let winRT;
try {
  winRT = {
    xml: (await import("@nodert-win10-rs4/windows.data.xml.dom")).default,
    notifications: (await import("@nodert-win10-rs4/windows.ui.notifications")).default,
  };
  if (!winRT.xml || !winRT.notifications) winRT = null;
} catch {
  winRT = null;
}

export default async function (option = {}) {

  const legacy = compatibility();
  const powerShell = !winRT || (winRT && option.disableWinRT === true) ? true : false;
  
  const options = normalize(option, legacy);
  const template = generate(options, powerShell, legacy);

  if (powerShell) 
  {
    
    const scriptPath = join(tmpdir() || process.env.TEMP, `${Date.now()}${rng(0, 1000)}.ps1`);
      
    try{
      //Create script
      const bom = "\ufeff";
      await fs.writeFile(scriptPath, bom + template, "utf8");
        
      //Excecute script
      const output = await promisify(exec)(`powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`,{ windowsHide: true });
      if (output.stderr) throw output.stderr;
     
      //Clean up
      await fs.unlink(scriptPath).catch(() => {});
    }catch(err){
      await fs.unlink(scriptPath).catch(() => {});
      throw err;
    }
      
  } 
  else 
  {
      
    const xml = new winRT.xml.XmlDocument();
    xml.loadXml(template);

    let toast = new winRT.notifications.ToastNotification(xml);
    if (!toast) throw "Failed to create a new 'ToastNotification'";

    if (!legacy) {
      toast.data = new winRT.notifications.NotificationData();
      toast.data.sequenceNumber = +options.sequenceNumber;
      if (options.hide) toast.suppressPopup = true;
      if (options.uniqueID) toast.tag = toast.group = options.uniqueID;
    }

    const toaster = winRT.notifications.ToastNotificationManager.createToastNotifier(options.appID);
    if (!toaster) throw "Failed to create a new 'ToastNotifier'";

    //System check
    if (toaster.setting === 1) {
      throw "Notifications are disabled by app manifest";
    } else if (toaster.setting === 2) {
      throw "Notifications are disabled by Windows group policy";
    } else if (toaster.setting === 3) {
      throw "Notifications are disabled for this user (system-wide)";
    } else if (toaster.setting === 4) {
      throw "Notifications are disabled for this app only (Windows settings)";
    }

    //WinRT: does not keep the event loop alive
    if (options.callback) {
      //Keep it alive for user provided amount of time
      const keepalive = setTimeout(() => {}, options.callback.keepalive);

      toast.on("activated", () => {
        clearTimeout(keepalive);
        options.callback.onActivated(); //cb
      });

      toast.on("dismissed", (_, { reason }) => {
        clearTimeout(keepalive);
        if (reason === 0) {
          options.callback.onDismissed("userCanceled"); //cb
        } else if (reason === 2) {
          options.callback.onDismissed("applicationHidden"); //cb
        } else {
          options.callback.onDismissed(reason); //cb
        }
      });

      toast.on("failed", (_, { error }) => {
        clearTimeout(keepalive);
        throw `Failure to raise notification: ${error.ErrorCode}`;
      });

      toaster.show(toast);
      
    } else {
      //It shouldn't be needed with the "return toaster.show()" instead of "toaster.show()" '~hack~'
      //But keep it alive for a short time. Better safe than sorry
      setTimeout(() => {}, 100);
      return toaster.show(toast);
    }
  }
}

export const isWinRTAvailable = winRT ? true : false;
