/*
MIT License

Copyright (c) 2019-2020 Anthony Beaumont

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
"use strict";

const os = require("os");
const fs = require("fs");
const path = require("path");
const util = require("util");
const { exec } = require("child_process");
const { rng, windowsGetVersion } = require("./helper.cjs");
const templateXml = require("./template.cjs");

let winRT;
try {
  winRT = {
    xml: require("@nodert-win10-rs4/windows.data.xml.dom"),
    notifications: require("@nodert-win10-rs4/windows.ui.notifications"),
  };
  if (!winRT.xml || !winRT.notifications) winRT = null;
} catch {
  winRT = null;
}

module.exports = async (option = {}) => {
  if (os.platform() !== "win32") throw "API is only available in Windows.";

  const version = windowsGetVersion();

  let legacyTemplate = false;

  //Windows 8 && Windows 8.1
  if (version.major == 6 && (version.minor == 3 || version.minor == 2)) legacyTemplate = true;
  //Windows 7 and below
  else if (version.major <= 6) throw "Unsupported Windows version";

  const powerShell = !winRT || (winRT && option.disableWinRT === true) ? true : false;

  const scriptPath = path.join(os.tmpdir() || process.env.TEMP, `${Date.now()}${rng(0, 1000)}.ps1`);

  try {
    const defaultAppID = legacyTemplate
      ? "winstore_cw5n1h2txyewy!Windows.Store"
      : "Microsoft.WindowsStore_8wekyb3d8bbwe!App";
    const scenarios = ["default", "alarm", "reminder", "incomingCall"];

    let options = {
      appID: option.appID || defaultAppID,
      uniqueID: option.uniqueID || null,
      sequenceNumber: option.sequenceNumber || 0, //0 to indicate "always update"
      title: option.title || "",
      message: option.message || "",
      attribution: option.attribution || "",
      icon: option.icon || "",
      cropIcon: option.cropIcon || false,
      headerImg: option.headerImg || "",
      footerImg: option.footerImg || "",
      silent: option.silent || false,
      hide: option.hide || false,
      audio: option.audio || "",
      longTime: option.longTime || false,
      onClick: option.onClick || "",
      button: option.button || [],
      group: option.group || null,
      scenario: scenarios.includes(option.scenario) ? option.scenario : "default",
    };

    if (option.progress) {
      options.progress = {
        header: option.progress.header || "",
        percent:
          (option.progress.percent || option.progress.percent === 0) &&
          option.progress.percent >= 0 &&
          option.progress.percent <= 100
            ? (option.progress.percent / 100).toFixed(2)
            : "indeterminate",
        custom: option.progress.custom || "",
        footer: option.progress.footer || "",
      };
    }

    if (option.callback) {
      options.callback = {
        keepalive: Number.isInteger(option.callback.keepalive) ? option.callback.keepalive : 6000,
        onActivated: option.callback.onActivated || function () {},
        onDismissed: option.callback.onDismissed || function () {},
      };
    }

    try {
      if (option.timeStamp) {
        options.timeStamp = new Date(+option.timeStamp * 1000).toISOString();
      } else {
        options.timeStamp = "";
      }
    } catch (err) {
      options.timeStamp = "";
    }

    let template;

    if (powerShell) {
      template =
        `(Get-Process -Id $pid).PriorityClass = 'High'` +
        os.EOL +
        `[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null` +
        os.EOL +
        `[Windows.UI.Notifications.ToastNotification, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null` +
        os.EOL +
        `[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null` +
        os.EOL +
        `$APP_ID = '${options.appID}'` +
        os.EOL;
    }

    if (legacyTemplate) {
      if (powerShell) {
        template +=
          `[xml]$template = @"` +
          os.EOL +
          templateXml.legacy(options) +
          os.EOL +
          `"@` +
          os.EOL +
          `$xml = New-Object Windows.Data.Xml.Dom.XmlDocument` +
          os.EOL +
          `$xml.LoadXml($template.OuterXml)` +
          os.EOL +
          `[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($APP_ID).Show($xml)`;
      } else {
        template = templateXml.legacy(options);
      }
    } else {
      if (powerShell) {
        template +=
          `$template = @"` +
          os.EOL +
          templateXml(options) +
          os.EOL +
          `"@` +
          os.EOL +
          `$xml = New-Object Windows.Data.Xml.Dom.XmlDocument` +
          os.EOL +
          `$xml.LoadXml($template)` +
          os.EOL +
          `$toast = New-Object Windows.UI.Notifications.ToastNotification $xml` +
          os.EOL +
          // Reminder to future self: You need to pass a dictionary for adaptative stuff :
          // $DataDictionary = New-Object 'system.collections.generic.dictionary[string,string]'
          // $Toast.Data = [Windows.UI.Notifications.NotificationData]::new($DataDictionary)
          // cf: https://docs.microsoft.com/en-us/uwp/api/windows.ui.notifications.notificationdata#constructors
          `$Toast.Data = [Windows.UI.Notifications.NotificationData]::new()` +
          os.EOL +
          `$toast.Data.SequenceNumber = ${options.sequenceNumber}` +
          os.EOL;

        if (options.hide) template += `$toast.SuppressPopup = "true"` + os.EOL;
        if (options.uniqueID)
          template +=
            `$toast.Tag = "${options.uniqueID}"` +
            os.EOL +
            `$toast.Group = "${options.uniqueID}"` +
            os.EOL;

        template += `[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($APP_ID).Show($toast)`;
      } else {
        template = templateXml(options);
      }
    }

    if (powerShell) {
      const bom = "\ufeff";
      await fs.promises.writeFile(scriptPath, bom + template, "utf8");

      const output = await util.promisify(exec)(
        `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`,
        {
          windowsHide: true,
        }
      );
      if (output.stderr) throw output.stderr;

      await fs.promises.unlink(scriptPath).catch(() => {});
    } else {
      const xml = new winRT.xml.XmlDocument();
      xml.loadXml(template);

      let toast = new winRT.notifications.ToastNotification(xml);

      if (!toast) throw "Failed to create a new 'ToastNotification'";

      if (!legacyTemplate) {
        toast.data = new winRT.notifications.NotificationData();
        toast.data.sequenceNumber = +options.sequenceNumber;
        if (options.hide) toast.suppressPopup = true;
        if (options.uniqueID) toast.tag = toast.group = options.uniqueID;
      }

      const toaster = winRT.notifications.ToastNotificationManager.createToastNotifier(
        options.appID
      );

      if (!toaster) throw "Failed to create a new 'ToastNotifier'";

      if (toaster.setting === 1) {
        throw "Notifications are disabled by app manifest";
      } else if (toaster.setting === 2) {
        throw "Notifications are disabled by Windows group policy";
      } else if (toaster.setting === 3) {
        throw "Notifications are disabled for this user (system-wide)";
      } else if (toaster.setting === 4) {
        throw "Notifications are disabled for this app only (Windows settings)";
      }

      if (options.callback) {
        //WinRT: registered event listener does not keep the event loop alive
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
        //WinRT: does not keep the event loop alive
        //It shouldn't be needed with the "return toaster.show()" instead of "toaster.show()" '~hack~'
        //But keep it alive for a short time. Better safe than sorry
        setTimeout(() => {}, 100);
        return toaster.show(toast);
      }
    }
  } catch (err) {
    if (powerShell)
      fs.unlink(scriptPath, function () {
        throw err;
      });
    else throw err;
  }
};

module.exports.isWinRTAvailable = () => (winRT ? true : false);
