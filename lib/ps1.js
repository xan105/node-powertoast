/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

import { EOL } from "node:os";

function generate(xmlString, options, keepalive) {

  let template = `(Get-Process -Id $pid).PriorityClass = 'High'` + EOL +
                 `$Pwsh71 = $PSVersionTable.PSVersion.Major -gt 7 -or ($PSVersionTable.PSVersion.Major -eq 7 -and $PSVersionTable.PSVersion.Minor -ge 1)` + EOL + //Check if PowerShell >= 7.1
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
                 `$toast.Data.SequenceNumber = ${options.sequenceNumber}` + EOL +
                 `$toast.SuppressPopup = $${options.hide}` + EOL; 
            
  if (options.uniqueID) 
    template += `$toast.Tag = "${options.uniqueID}"` + EOL + `$toast.Group = "${options.uniqueID}"` + EOL;
  if (options.expiration)
    template += `$toast.expiration = "${new Date(options.expiration).toISOString()}"` + EOL;

  if (keepalive > 0) { 
    //Register events
    template += `if($Pwsh71){` + EOL +
    `Register-ObjectEvent -SourceIdentifier cb0 -InputObject $toast -EventName Activated -Action { Write-Host "<@onActivated>$($Args[1].Arguments)$_</@onActivated>"; New-Event -SourceIdentifier cbDone0} | Out-Null` + EOL +
    `Register-ObjectEvent -SourceIdentifier cb1 -InputObject $toast -EventName Dismissed -Action { Write-Host "<@onDismissed>$($Args[1].Reason)$_</@onDismissed>"; New-Event -SourceIdentifier cbDone1} | Out-Null` + EOL +
    `Register-ObjectEvent -SourceIdentifier cb2 -InputObject $toast -EventName Failed -Action { Write-Host "<@onFailed/>"; New-Event -SourceIdentifier cbDone2} | Out-Null` + EOL +
    `}` + EOL           
  }

  template += `[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("${options.appID}").Show($toast)`;
  
  if (keepalive > 0) {
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

export { generate };