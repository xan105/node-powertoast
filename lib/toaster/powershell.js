import { join } from "node:path";
import { tmpdir, EOL } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Failure, attempt } from "@xan105/error";
import { writeFile, deleteFile } from "@xan105/fs";

function generate(xmlString, keepalive){
  
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
                `$Package = Get-Package -Name $Assembly.name -Scope CurrentUser -ErrorAction SilentlyContinue` + EOL +
                `if (!$Package){` + EOL +
                `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12` + EOL +
                `Install-Package -Name $Assembly.name -RequiredVersion $Assembly.version -ProviderName NuGet -Source 'https://www.nuget.org/api/v2' -Force -Scope CurrentUser` + EOL +
                `$Package = Get-Package -Name $Assembly.name -Scope CurrentUser -ErrorAction Stop` + EOL +
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

    template += `[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("${this.options.aumid}").Show($toast)`;
    
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

async function execute(scriptPath, disablePowershellCore){

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

function parse(stdout){
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

    const values = Object.create(null);
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

async function notify(xmlString, options){
  
  const rng = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const scriptPath = join(tmpdir(), `${Date.now()}${rng(0, 1000)}.ps1`);
  const template = generate.call(this, xmlString, options.keepalive);
  
  try{
    //Create script
    await writeFile(scriptPath, template, { encoding: "utf8", bom: true });
          
    //Excecute script
    const { stdout } = await execute(scriptPath, options.disablePowershellCore);

    //Parse output for events
    if (this.eventNames().length > 0 && stdout) parse.call(this, stdout);
       
    //Clean up
    await deleteFile(scriptPath);
  }catch(err){
    await deleteFile(scriptPath);
    throw err;
  }
}

export { notify };