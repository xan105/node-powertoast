About
=====

Windows toast notification and toastXml string builder.<br />

Doesn't use any native module. Everything is done through PowerShell but you can use native WinRT API bindings instead by **optionally** installing [NodeRT](https://github.com/NodeRT/NodeRT) relative packages (see [installation](#Installation) for more details).

Please note that when using PowerShell some features such as click events and user input requires Powershell ≥ 7.1 (pwsh) also known as PowerShell Core.<br />
Using WinRT (NodeRT) is a bit faster as you don't have to wait for the PowerShell VM to start.

**Electron**

Powertoast was made for Node.js first but it also works in Electron with either PowerShell or WinRT (NodeRT).<br />
If you prefer to use the new [Electron native API](https://www.electronjs.org/fr/docs/latest/api/notification#new-notificationoptions) directly. 
You can easily build a [toastXml string](https://docs.microsoft.com/en-us/uwp/schemas/tiles/toastschema/schema-root) for it.

Example
=======

### A simple toast

<p align="center">
<img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/example.png">
</p>

```js 
import { Toast } from "powertoast";

//Create a toast
const toast = new Toast({
  title: "NPM",
  message: "Installed.",
  icon: "https://static.npmjs.com/7a7ffabbd910fc60161bc04f2cee4160.png"
})

//Events (optional)
toast.on("activated", (event, input) => { 
  // Where event and input are the data from an interactive toast
  console.log("click");
});
toast.on("dismissed", (reason) => { console.log(reason) });

toast.show() //Promise
.then(()=>{
  console.log("Sent");
})
.catch((err) => { 
  console.error(err);
});
```

### Build a toastXml string for [Electron native API](https://www.electronjs.org/fr/docs/latest/api/notification#new-notificationoptions):

```js
//Main process
import { Notification } from "electron";
import { toXmlString } from "powertoast";
  
const options = {
  title: "First partner",
  message: "Every journey begins with a choice",
  button: [
    { text: "Bulbasaur", activation: "myapp:green" },
    { text: "Charmander", activation: "myapp:red" },
    { text: "Squirtle", activation: "myapp:blue" }
  ]
};

const xmlString = toXmlString(options);
const toast = new Notification({ toastXml: xmlString });
toast.show();
```

Installation
============

```
npm install powertoast
```

<details>
<summary>Optional NodeRT packages</summary>

  <br />
  
  All NodeRT scopes up to the latest official [@nodert-win10-rs4](https://github.com/NodeRT/NodeRT) and unofficial made by the community up to [@nodert-win11-22h2](https://github.com/demosjarco/NodeRT) are supported. The Windows SDK version they target is implied in their name.

  💡 Mixing NodeRT modules from different scopes is supported (priority to the most recent SDK) but should be treated with caution.

  NodeRT modules required for toast notification:

  - `windows.data.xml.dom`
  - `windows.ui.notifications`

  For user input (text box and dropdown selection list) you will also need:

  - `windows.ui.notifications` (> nodert-win10-rs4 (1803) since it's available on win10 ≥ 1903)
  - `windows.foundation`
  - `windows.foundation.collections`

  💡 If you have trouble compiling NodeRT native addons.<br />
  They are available precompiled through the [@xan105/nodert](https://github.com/xan105/node-nodeRT) package.

  ```
  npm i @xan105/nodert --modules="windows.ui.notifications, windows.data.xml.dom, windows.foundation, windows.foundation.collections"
  ```

  Note that you can also add a list of modules in your package.json file under the `_nodert/modules` path:

  ```json
  "_nodert" : {
    "modules" : [
      "windows.data.xml.dom",
      "windows.ui.notifications"
    ]
  },
  ```

  Please see [@xan105/nodert](https://github.com/xan105/node-nodeRT#install) for more details.

  **Electron**

  For Electron add the `--electron` flag to target Electron's ABI

  ```
  npm i @xan105/nodert --electron --modules="windows.ui.notifications, windows.data.xml.dom"
  ```

  ⚠️ Electron ≥ 14 : NodeRT should be loaded in the main process [NodeRT#158](https://github.com/NodeRT/NodeRT/issues/158)

</details>

API
===

⚠️ This module is only available as an ECMAScript module (ESM) starting with version `2.0.0`.<br />
Previous version(s) are CommonJS (CJS) with an ESM wrapper.

ℹ️ Windows 8/8.1 support was removed in `3.x`

## Named export

### `Toast(option?: object): Class`

Create a toast notification.

_extends 📖 [EventEmitter](https://nodejs.org/docs/latest-v20.x/api/events.html#class-eventemitter)_

#### Constructor

`(option?: object)`

ℹ️ Because there is a ton of options for toast notification, they are in [./TOAST.md](TOAST.md).

#### Events

- `activated (event: string, input: { key: value, ... })`

  When user activates a toast notification through a click.
  
  Event is the argument passed by the notification or button.
  
  Input (textbox and/or selection) is the user input represented as key/value pair(s).

- `dismissed (reason: string)`

  When a toast notification leaves the screen, either by expiring or being explicitly dismissed by the user.

  |Name|Description|
  |----|-----------|
  |UserCanceled|User dismissed the toast|
  |ApplicationHidden|Application explicitly hid the toast|
  |TimedOut|Toast had been shown for the maximum allowed time and was faded out|
  
#### Methods

- `clear(): Promise<void>`

  Remove the notification from the notification center and all event listeners.

- `show(option?: object): Promise<void>`

  Show toast notification.

  **⚙️ Options**

  +  `disableWinRT?: boolean` (false)

    If you have installed the optional NodeRT native module(s) but for whatever reason(s) you want to use PowerShell instead set this to `true`.

  + `disablePowershellCore?: boolean` (false)

    By default when using PowerShell this module will first try to use `pwsh` (PowerShell Core), then `powershell` (PowerShell Desktop / Windows Embedded).
    Set this to `true` to skip `pwsh` and only use `powershell` which is included with Windows.

    ℹ️ PowerShell Core has some caveats hence the option to disable/skip it:

      - It's painfully slow to start.
      - It needs to be installed and its path added to your env var.
      - In order for PowerShell Core to use WinRT it will have to download WinRT assemblies 
        through its package manager (done on first run).

    ⚠️ Please note that some features such as click events and user input requires Powershell ≥ 7.1 (pwsh).<br />

  + `keepalive?: number` (6) seconds

    ⚠️ This option is only for when listening for events !

    The maximum amount of time PowerShell will wait for events before exiting or how long to keep the event loop alive for NodeRT.

    PowerShell needs to be running to subscribe to the events and NodeRT registered event listener does not keep the event loop alive.
    The default value is `6` seconds as 5 seconds is the default notification duration but keep in mind some users might have change this value in their Windows settings.

    ℹ️ NB: When using NodeRT If you have something else maintaining the event loop then you can ignore this.

  **Returns**
    
    ✔️ Resolves as soon as the notification has been dispatched. Except when PowerShell needs to be running to subscribe to events in which case the promise will resolve only afterwards.
    
    ❌ Rejects on error.
  
### `toXmlString(option?: object): string`

Expose the toastXML string builder used by the Toast class for debugging purposes or for example if you want to use it with [Electron native API](https://www.electronjs.org/fr/docs/latest/api/notification#new-notificationoptions).

Please see the `Toast` class constructor for the relevant options.

ℹ️ The following options have no effect when just building a Toast XmlString:

- aumid
- uniqueID
- hide
- sequenceNumber
- expiration

### `const isWinRTAvailable: boolean`

True if the peerDependencies for WinRT were successfully loaded; false otherwise.

### `remove(aumid: string, uniqueID?: string | string[]): Promise<void>`

Remove programmatically notification(s) from the notification center.

If using only `aumid` then it removes every notification for said aumid in the notification center.<br/>
If you provide an optional `uniqueID` (string) then it removes that specific notification for the given aumid.

ℹ️ This library `uniqueID` option actually sets both tag and groupLabel to the same value for convenience.<br />
If you want to use the tag and groupLabel properties of a toast to target a notification then use<br />
`uniqueID` (array) as `[ groupLabel: string, tag?: string ]`.

### `getHistory(aumid: string, verbose?: boolean): Promise<object[]>`

List the current notification(s) for the given `aumid` in the notification center.

<details>
<summary>Return an array of object with the following properties:</summary>

<br />

|name|type|description|
|----|----|-----------|
|expirationTime|string|time after which a toast should not be displayed (eg: "01/08/2021 20:53:23 +07:00")|
|tag|string|unique identifier (tag)|
|group|string|unique identifier (group label)|

If `verbose` (false) is set to `true` then the following properties are added:

|name|type|description|
|----|----|-----------|
|remoteID|string or null|id to correlate this notification with another one generated on another device|
|suppressPopup|boolean|whether toast's pop-up UI is displayed on the user's screen|
|mirroringAllowed|boolean|whether notification is allowed to be displayed on multiple devices|
|expiresOnReboot|boolean|whether toast will remain in the notification center after a reboot|
|highPriority|boolean|whether the notification is displayed in high priority (wake up the screen, etc)|
|status|string or null|additional information about the status of the toast|

</details>

📖 Microsoft doc
=================

📖 [Microsoft Toast API](https://docs.microsoft.com/en-us/windows/uwp/design/shell/tiles-and-notifications/adaptive-interactive-toasts).<br />
📖 [Toast content XML schema](https://docs.microsoft.com/en-us/windows/uwp/design/shell/tiles-and-notifications/toast-xml-schema).<br />
📖 [ToastNotificationHistory class](https://docs.microsoft.com/en-us/uwp/api/Windows.UI.Notifications.ToastNotificationHistory).<br />
📖 [ToastNotification properties](https://docs.microsoft.com/en-us/uwp/api/windows.ui.notifications.toastnotification#properties).<br />
📖 [send-local-toast-other-apps](https://github.com/MicrosoftDocs/windows-dev-docs/blob/docs/hub/apps/design/shell/tiles-and-notifications/send-local-toast-other-apps.md).<br />