/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

import { tmpdir, EOL } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { EventEmitter } from "node:events";
import { shouldWin10orGreater } from "@xan105/is/assert";
import { asBoolean, asIntegerPositive } from "@xan105/is/opt";
import { writeFile, deleteFile } from "@xan105/fs";
import { Failure, attempt, errorLookup } from "@xan105/error";
import { normalize } from "./option.js";
import { toastXmlString } from "./xml.js";
import { remove } from "./notificationCenter.js";

//optional peerDependencies
import { loadWinRT } from "./nodert.js";
const winRT = await loadWinRT({
  includeExperimental: true
});

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
      keepalive: asIntegerPositive(option.keepalive) ?? 6
    };
    
    const usePowerShell = !winRT || (winRT && options.disableWinRT === true);
    const xmlString = toastXmlString(this.options);
    
    if (usePowerShell){
      const template = this.#generate(xmlString, options.keepalive);
      await this.#powershell(template, options.disablePowershellCore);
    } else
      this.#winrt(xmlString, options.keepalive);
  }
  
  async clear(){
    this.removeAllListeners(this.eventNames());
    await remove(this.options.appID, this.options.uniqueID);
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
  
  async #powershell(template, disablePowershellCore){
  
    const rng = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const scriptPath = join(tmpdir() || process.env.TEMP, `${Date.now()}${rng(0, 1000)}.ps1`);
        
    try{
      //Create script
      await writeFile(scriptPath, template, { encoding: "utf8", bom: true });
          
      //Excecute script
      const { stdout } = await this.#execute(scriptPath, disablePowershellCore);

      //Parse output
      if (this.eventNames().length > 0 && stdout) {
      
        const tags = {
          activated: ["<@onActivated>", "</@onActivated>"],
          args: ["<@args>", "</@args>"],
          input: ["<@input>", "</@input>"],
          dismissed: ["<@onDismissed>", "</@onDismissed>"],
          failed: "<@onFailed/>"
        };

        const has = (s, start, end) => s.includes(start) && s.includes(end);
        const slice = (s, start, end) => s.slice(s.indexOf(start) + start.length, s.indexOf(end));

        if (has(stdout, ...tags.activated)){
          //Extract argument and user input
          const event = slice(stdout, ...tags.activated);
          const args = slice(event, ...tags.args);
          const inputs = slice(event, ...tags.input).match(/\[.*?\]/g) ?? [];

          let values = {};
          for (const input of inputs)
          {
            const id = slice(input,"[",", ");
            const value = slice(input,", ","]");
            values[id] = value;
          }

          this.emit("activated", args, values);
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
    
  #generate(xmlString, keepalive) {

    let template = `(Get-Process -Id $pid).PriorityClass = 'High'` + EOL +
                   //Check if PowerShell >= 7.1
                   `$Pwsh71 = $PSVersionTable.PSVersion.Major -gt 7 -or ($PSVersionTable.PSVersion.Major -eq 7 -and $PSVersionTable.PSVersion.Minor -ge 1)` + EOL +
                   //Load WinRT Assemblies
                   `if(!$Pwsh71){` + EOL +
                   `[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null` + EOL +
                   `[Windows.UI.Notifications.ToastNotification, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null` + EOL +
                   `[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null` + EOL +
                   `} else {` + EOL +
                   //Load Types from Assemblies (https://github.com/PowerShell/PowerShell/issues/13042)
                   `$Assembly = [pscustomobject]@{name = 'Microsoft.Windows.SDK.NET.Ref';version = '10.0.20348.20';files = @('lib/WinRT.Runtime.dll';'lib/Microsoft.Windows.SDK.NET.dll')}` + EOL +
                   `$Package = Get-Package -Name $Assembly.name -ErrorAction SilentlyContinue` + EOL +
                   `if (!$Package){` + EOL +
                   `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12` + EOL +
                   `Install-Package -Name $Assembly.name -MinimumVersion $Assembly.version -ProviderName NuGet -Source 'https://www.nuget.org/api/v2' -Force -Scope CurrentUser` + EOL +
                   `} $Source = Split-Path -Path $Package.Source` + EOL +
                   `ForEach ($File in $Assembly.files) {` + EOL +
                   `$FilePath = Join-Path -Path $Source -ChildPath $File` + EOL +
                   `Add-Type -Path $FilePath -ErrorAction Stop }}` + EOL +
                   //Body
                   `$template = @"` + EOL +
                   xmlString + EOL +
                   `"@` + EOL +
                   `$xml = New-Object Windows.Data.Xml.Dom.XmlDocument` + EOL +
                   `$xml.LoadXml($template)` + EOL +
                   `$toast = New-Object Windows.UI.Notifications.ToastNotification $xml` + EOL +
                   // Reminder to future self: You need to pass a dictionary for adaptative stuff :
                   // $DataDictionary = New-Object 'system.collections.generic.dictionary[string,string]'
                   // $Toast.Data = [Windows.UI.Notifications.NotificationData]::new($DataDictionary)
                   // cf: https://docs.microsoft.com/en-us/uwp/api/windows.ui.notifications.notificationdata#constructors
                   `$Toast.Data = [Windows.UI.Notifications.NotificationData]::new()` + EOL +
                   `$toast.Data.SequenceNumber = ${this.options.sequenceNumber}` + EOL +
                   `$toast.SuppressPopup = $${this.options.hide}` + EOL +
                   `$toast.Tag = "${this.options.uniqueID}"` + EOL + `$toast.Group = "${this.options.uniqueID}"` + EOL;
                   
    if (this.options.expiration)
      template += `$toast.expiration = "${new Date(this.options.expiration).toISOString()}"` + EOL;

    if (this.eventNames().length > 0) { 
      //Register events
      template += `if($Pwsh71){` + EOL +
      `Register-ObjectEvent -SourceIdentifier cb0 -InputObject $toast -EventName Activated -Action { ` +
      `Write-Host "<@onActivated><@args>$($Args[1].Arguments)$_</@args><@input>$($Args[1].UserInput)$_</@input></@onActivated>"; New-Event -SourceIdentifier cbDone0 } | Out-Null` + EOL +
      `Register-ObjectEvent -SourceIdentifier cb1 -InputObject $toast -EventName Dismissed -Action { Write-Host "<@onDismissed>$($Args[1].Reason)$_</@onDismissed>"; New-Event -SourceIdentifier cbDone1 } | Out-Null` + EOL +
      `Register-ObjectEvent -SourceIdentifier cb2 -InputObject $toast -EventName Failed -Action { Write-Host "<@onFailed/>"; New-Event -SourceIdentifier cbDone2 } | Out-Null` + EOL +
      `}` + EOL           
    }

    template += `[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("${this.options.appID}").Show($toast)`;
    
    if (this.eventNames().length > 0) {
      //Wait for events
      template += EOL + 
      `if($Pwsh71){` + EOL +
      `Wait-Event -SourceIdentifier cbDone* -TimeOut ${keepalive}` + EOL +
      //Clean up
      `Unregister-Event -SourceIdentifier cb*` + EOL +
      `Remove-Event -SourceIdentifier cbDone*` + EOL +
      `}` + EOL;
    }

    return template;
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
    toast.tag = toast.group = this.options.uniqueID;
    if (this.options.expiration) toast.expiration = new Date(this.options.expiration).toISOString();

    const toaster = winRT.notifications.ToastNotificationManager.createToastNotifier(this.options.appID);
    if (!toaster) throw new Failure("Failed to create a new 'ToastNotifier'","ERR_WINRT");
    
    //System check
    if (toaster.setting > 0){
      const reasons = {
        1: "Notifications are disabled by app manifest",
        2: "Notifications are disabled by Windows group policy",
        3: "Notifications are disabled for this user (system-wide)",
        4: "Notifications are disabled for this app only (Windows settings)"
      };
      throw new Failure(reasons[toaster.setting] ?? `Notifications are disabled (${toaster.setting})`, "ERR_WINRT");
    }

    //WinRT does not keep the event loop alive
    //Keep it alive for set amount of time
    const timer = setTimeout(() => {}, 
      this.eventNames().length > 0 ? 
      keepalive * 1000 : 
      100 //Better safe than sorry
    );
    
    if (this.eventNames().length > 0){
      toast.on("activated", (_, event) => {
        clearTimeout(timer);
        const eventArgs = winRT.notifications.ToastActivatedEventArgs.castFrom(event); //cast to ToastActivatedEventArgs (OpaqueWrapper)
        let values = {};
        
        if (winRT.collections){ //Only needed for user input; Just skip if failed to load
          const valueSet = winRT.collections.ValueSet.castFrom(eventArgs.userInput); //cast to ValueSet (OpaqueWrapper)
          const iterator = valueSet.first(); //returns an iterator to enumerate the items in the value set
          while(iterator.hasCurrent === true) //return false when at the end of the collection
          {
            if(winRT.foundation){ //Only needed for user input; Just skip if failed to load
              const value = winRT.foundation.IPropertyValue.castFrom(iterator.current.value); //cast to IPropertyValue (OpaqueWrapper)
              values[iterator.current.key] = value.getString(); 
            } else {
              values[iterator.current.key] = iterator.current.value; //(OpaqueWrapper)
            }
            iterator.moveNext();
          }
        }
        
        this.emit("activated", eventArgs.arguments, values); 
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
    }

    toaster.show(toast);
  }
}

export { Toast };
export const isWinRTAvailable = Boolean(winRT);