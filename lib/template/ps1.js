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

import { EOL } from "node:os";
import * as Template from "./xml.js";

function header(appID) {

  const template = `(Get-Process -Id $pid).PriorityClass = 'High'` + EOL +
                   `$Version = $PSVersionTable.PSVersion` + EOL +
                   `if($Version.Major -gt 7 -or ($Version.Major -eq 7 -and $Version.Minor -ge 1)){` + EOL +  //Check if PowerShell >= 7.1 
                   //Load Types from Assemblies (https://github.com/PowerShell/PowerShell/issues/13042)
                   `$Assembly = [pscustomobject]@{name = 'Microsoft.Windows.SDK.NET.Ref';version = '10.0.20348.20';files = @('lib/WinRT.Runtime.dll';'lib/Microsoft.Windows.SDK.NET.dll')}` + EOL + 
                   `$Package = Get-Package -Name $Assembly.name -ErrorAction SilentlyContinue` + EOL +
                   `if (!$Package){` + EOL + 
                   `Install-Package -Name $Assembly.name -MinimumVersion $Assembly.version -ProviderName NuGet -Source 'https://www.nuget.org/api/v2' -Force -Scope CurrentUser` + EOL +
                   `$Package = Get-Package -Name $Assembly.name` + EOL +
                   `}` + EOL + 
                   `$Source = Split-Path -Path $Package.Source` + EOL + 
                   `ForEach ($File in $Assembly.files) {` + EOL + 
                   `$FilePath = Join-Path -Path $Source -ChildPath $File` + EOL + 
                   `Add-Type -Path $FilePath -ErrorAction Stop` + EOL + 
                   `}` + EOL + 
                   `}else{` + EOL +
                   `[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null` + EOL +
                   `[Windows.UI.Notifications.ToastNotification, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null` + EOL +
                   `[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null` + EOL +
                   `}` + EOL +
                   `$APP_ID = '${appID}'` + EOL;

  return template;
}

function legacy(options){

  const template = `[xml]$template = @"` + EOL +
                   Template.legacy(options) + EOL +
                   `"@` + EOL +
                   `$xml = New-Object Windows.Data.Xml.Dom.XmlDocument` + EOL +
                   `$xml.LoadXml($template.OuterXml)` + EOL +
                   `[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($APP_ID).Show($xml)`;
  return template;
}

function xml(options){

  let template = `$template = @"` + EOL +
                  Template.xml(options) + EOL +
                  `"@` + EOL +
                  `$xml = New-Object Windows.Data.Xml.Dom.XmlDocument` + EOL +
                  `$xml.LoadXml($template)` + EOL +
                  `$toast = New-Object Windows.UI.Notifications.ToastNotification $xml` + EOL +
                  // Reminder to future self: You need to pass a dictionary for adaptative stuff :
                  // $DataDictionary = New-Object 'system.collections.generic.dictionary[string,string]'
                  // $Toast.Data = [Windows.UI.Notifications.NotificationData]::new($DataDictionary)
                  // cf: https://docs.microsoft.com/en-us/uwp/api/windows.ui.notifications.notificationdata#constructors
                  `$Toast.Data = [Windows.UI.Notifications.NotificationData]::new()` + EOL +
                  `$toast.Data.SequenceNumber = ${options.sequenceNumber}` + EOL;

  if (options.hide) template += `$toast.SuppressPopup = "true"` + EOL;
  if (options.uniqueID) template += `$toast.Tag = "${options.uniqueID}"` + EOL + `$toast.Group = "${options.uniqueID}"` + EOL;

  if (options.callback) {
    //Register events
    template += `if($Version.Major -gt 7 -or ($Version.Major -eq 7 -and $Version.Minor -ge 1)){` + EOL +  //Check if PowerShell >= 7.1
                `Register-ObjectEvent -SourceIdentifier cb0 -InputObject $toast -EventName Activated -Action { Write-Host "<@onActivated/>"; New-Event -SourceIdentifier cbDone0} | Out-Null` + EOL +
                `Register-ObjectEvent -SourceIdentifier cb1 -InputObject $toast -EventName Dismissed -Action { Write-Host "<@onDismissed>$($Args[1].Reason)$_</@onDismissed>"; New-Event -SourceIdentifier cbDone1} | Out-Null` + EOL +
                `Register-ObjectEvent -SourceIdentifier cb2 -InputObject $toast -EventName Failed -Action { Write-Host "<@onFailed/>"; New-Event -SourceIdentifier cbDone2} | Out-Null` + EOL +
                `}` + EOL;
  }

  template += `[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($APP_ID).Show($toast)`;
  
  if (options.callback) {
    //Wait for events
    template += EOL + 
                `if($Version.Major -gt 7 -or ($Version.Major -eq 7 -and $Version.Minor -ge 1)){` + EOL +  //Check if PowerShell >= 7.1
                `Wait-Event -SourceIdentifier cbDone* -TimeOut ${options.callback.keepalive}` + EOL +
                //Clean up
                `Unregister-Event -SourceIdentifier cb*` + EOL +
                `Remove-Event -SourceIdentifier cbDone*` + EOL +
                `}` + EOL;
  }

  return template;
}

export { header, legacy, xml };