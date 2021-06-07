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
                   `[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null` + EOL +
                   `[Windows.UI.Notifications.ToastNotification, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null` + EOL +
                   `[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null` + EOL +
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

  template += `[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($APP_ID).Show($toast)`;

  return template;
}

export { header, legacy, xml };