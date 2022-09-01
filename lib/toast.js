/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { EventEmitter } from "node:events";
import { shouldWin10orGreater } from "@xan105/is/assert";
import { asBoolean, asIntegerPositiveOrZero } from "@xan105/is/opt";
import { writeFile, deleteFile } from "@xan105/fs";
import { Failure, attempt, errorLookup } from "@xan105/error";
import { normalize } from "./option.js";
import { toastXmlString } from "./xml.js";
import { generate } from "./ps1.js";
//optional peerDependencies
import { loadWinRT } from "./nodert.js";
const winRT = await loadWinRT();

class Toast extends EventEmitter {
  
  constructor(option = {}){
    shouldWin10orGreater();
    super();
    this.options = normalize(option);
  }
  
  async notify(option = {}){
  
    const options = {
      disableWinRT: asBoolean(option.disableWinRT) ?? false,
      disablePowershellCore: asBoolean(option.disablePowershellCore) ?? false,
      keepalive: asIntegerPositiveOrZero(option.keepalive) ?? 6
    };
    
    const usePowerShell = !winRT || (winRT && options.disableWinRT === true);
    const xmlString = toastXmlString(this.options);
    
    if (usePowerShell){
      const template = generate(xmlString, this.options, options.keepalive);
      await this.#powershell(template, options);
    } else 
      this.#winrt(xmlString, options.keepalive);
  }
  
  async #execute(scriptPath, disablePowershellCore){

    const shells = ["pwsh", "powershell"];
    if(disablePowershellCore) shells.shift();

    const cmd = ["-NoProfile", "-NoLogo", "-ExecutionPolicy", "Bypass", "-File", scriptPath];
    for (const shell of shells){
      const [ ps, err ] = await attempt(promisify(execFile), [shell, cmd, { windowsHide: true }]);
      if (err?.code === "ENOENT") continue;
      if (err || ps.stderr) throw new Failure(err?.stderr || ps.stderr, "ERR_POWERSHELL");
      return ps;
    }
  }
  
  async #powershell(template, options){
  
    const rng = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const scriptPath = join(tmpdir() || process.env.TEMP, `${Date.now()}${rng(0, 1000)}.ps1`);
        
    try{
      //Create script
      await writeFile(scriptPath, template, { encoding: "utf8", bom: true });
          
      //Excecute script
      const { stdout } = await this.#execute(scriptPath, options.disablePowershellCore);
      
      if (options.keepalive > 0 && stdout) {
      
        const tags = {
          activated: ["<@onActivated>", "</@onActivated>"],
          dismissed: ["<@onDismissed>", "</@onDismissed>"],
          failed: "<@onFailed/>"
        };

        const has = (s, start, end) => s.includes(start) && s.includes(end);
        const slice = (s, start, end) => s.slice(s.indexOf(start) + start.length, s.indexOf(end));

        if (has(stdout, ...tags.activated)){
          const event = slice(stdout, ...tags.activated);
          this.emit("activated", event);
        } 
        else if (has(stdout, ...tags.dismissed)){
          const reason = slice(stdout, ...tags.dismissed);
          this.emit("dismissed", reason);
        }
        else if (stdout.includes(tags.failed)){
          throw new Failure("Failed to raise notification", "ERR_POWERSHELL");
        }
      }
       
      //Clean up
      await deleteFile(scriptPath);
    }catch(err){
      await deleteFile(scriptPath);
      throw err;
    } 
  }
    
  #winrt(xmlString, keepalive){

    const xml = new winRT.xml.XmlDocument();
    const [, err] = attempt(xml.loadXml.bind(xml), [xmlString]);
    if (err) {
      throw new Failure("Failed to parse/load XML template", { 
        code: "ERR_WINRT", 
        cause: err,
        info: errorLookup(err.HRESULT)
      });
    }

    let toast = new winRT.notifications.ToastNotification(xml);
    if (!toast) throw new Failure("Failed to create a new 'ToastNotification'","ERR_WINRT");
    
    toast.data = new winRT.notifications.NotificationData();
    toast.data.sequenceNumber = this.options.sequenceNumber;
    toast.suppressPopup = this.options.hide;
    if (this.options.uniqueID) toast.tag = toast.group = this.options.uniqueID;
    if (this.options.expiration) toast.expiration = new Date(options.expiration).toISOString();

    const toaster = winRT.notifications.ToastNotificationManager.createToastNotifier(this.options.appID);
    if (!toaster) throw new Failure("Failed to create a new 'ToastNotifier'","ERR_WINRT");
    
    //System check
    if (toaster.setting > 0) {
      const reasons = {
        1: "Notifications are disabled by app manifest",
        2: "Notifications are disabled by Windows group policy",
        3: "Notifications are disabled for this user (system-wide)",
        4: "Notifications are disabled for this app only (Windows settings)"
      };
      throw new Failure(reasons[toaster.setting] ?? `Notifications are disabled (${toaster.setting})`, "ERR_WINRT");
    }

    //WinRT does not keep the event loop alive
    //Keep it alive for provided amount of time
    //Better safe than sorry
    const timer = setTimeout(() => {}, keepalive > 0 ? keepalive * 1000 : 100);

    toast.on("activated", (_, event) => {
      clearTimeout(timer);
      const eventArgs = winRT.notifications.ToastActivatedEventArgs.castFrom(event);
      this.emit("activated", eventArgs?.arguments); //cast to ToastActivatedEventArgs 
    });

    toast.on("dismissed", (_, { reason }) => {
      clearTimeout(timer);
      const reasons = {
        0: "UserCanceled", //User dismissed the toast
        1: "ApplicationHidden", //App explicitly hid the toast by calling the ToastNotifier.hide method
        2: "TimedOut" //Toast had been shown for the maximum allowed time and was faded out
      };
      this.emit("dismissed", reasons[reason] ?? `Dismissed: ${reason}`);
    });

    toast.on("failed", (_, { error }) => {
      clearTimeout(timer);
      throw new Failure(...errorLookup(error.ErrorCode));
    });

    toaster.show(toast);
  }
}

export { Toast };