About
=====

Windows toast notification using PowerShell or WinRT and toastXml string builder.<br />

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
toast.on("activated", (argument, input) => { 
  // Where argument and input are the data from an interactive toast
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
import { asXmlString } from "powertoast";
  
const options = {
  title: "First partner",
  message: "Every journey begins with a choice",
  //Buttons using protocol activation
  button: [
    { text: "Bulbasaur", onClick: "electron:green" },
    { text: "Charmander", onClick: "electron:red" },
    { text: "Squirtle", onClick: "electron:blue" }
  ]
};

const xmlString = asXmlString(options);
const toast = new Notification({ toastXml: xmlString });
toast.show();
```

Installation
============

```
npm install powertoast
```

### Optional NodeRT packages

All NodeRT scopes up to the latest official [@nodert-win10-rs4](https://github.com/NodeRT/NodeRT) and unofficial made by the community up to [@nodert-win11-22h2](https://github.com/demosjarco/NodeRT) are supported. The Windows SDK version they target is implied in their name.

💡 Mixing NodeRT modules from different scopes is supported (priority to the most recent SDK) but should be treated with caution.

NodeRT modules required for toast notification:

- `windows.data.xml.dom`
- `windows.ui.notifications`

For user input (text box and dropdown selection list) you will also need:

- `windows.ui.notifications` (> nodert-win10-rs4 (1803) since it's available on win10 ≥ 1903)
- `windows.foundation`
- `windows.foundation.collections`

💡 If you have trouble compiling NodeRT native addons. They are available precompiled through the [@xan105/nodert](https://github.com/xan105/node-nodeRT) package.

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

#### Electron

For Electron add the `--electron` flag to target Electron's ABI

```
npm i @xan105/nodert --electron --modules="windows.ui.notifications, windows.data.xml.dom"
```

⚠️ NB: Electron ≥ 14 : NodeRT should be loaded in the main process [NodeRT#158](https://github.com/NodeRT/NodeRT/issues/158)

API
===

⚠️ This module is only available as an ECMAScript module (ESM) starting with version `2.0.0`.<br />
Previous version(s) are CommonJS (CJS) with an ESM wrapper.

ℹ️ Windows 8/8.1 support was removed in `3.x`

## Named export

### Toast(option?: object): Class

_extends 📖 [EventEmitter](https://nodejs.org/docs/latest-v20.x/api/events.html#class-eventemitter)_

Create a toast notification.

#### Constructor

`(option?: object)`

ℹ️ There is a ton of options for toast notification (long text warning 😅)

<details>
<summary>⚙️ Options:</summary>

- `appID?: string` (Microsoft.WindowsStore_8wekyb3d8bbwe!App)

  ⚠️ An invalid appID will result in the notification not being displayed !

  Your [Application User Model ID](https://docs.microsoft.com/fr-fr/windows/desktop/shell/appids) a.k.a. AUMID.<br />
  Defaults to Microsoft Store (UWP) so you can see how it works if not specified.
  
  You can view all installed appID via the PowerShell command `Get-StartApps`.<br />
  AppIDs can be classified into 2 categories: Win32 appID and UWP appID.<br />
  
  <p align="center">
  <img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/aumid.png"><br />
  <em>xan105/node-Get-StartApps isValidAUMID()</em>
  </p>
  
  Win32 appID (_red_) is whatever string you want.<br />
  UWP appID (_green_) is a string with a very specific set of rules.<br />
  Some features / behaviors are limited to UWP appID only _because Microsoft™_.
  
  Your framework, installer, setup, etc... should have method(s) to create / use one for you.<br />
  Eg: Innosetup has the parameter `AppUserModelID` in the `[Icons]` section, Electron has the method `app.setAppUserModelId()`.<br />
  💡 It basically boils down to creating a .lnk shortcut in the `StartMenu` folder with the AUMID property set and some registry.<br />
  
```js  
  import { Toast } from "powertoast";

  const toast = new Toast({
    appID: "Microsoft.XboxApp_8wekyb3d8bbwe!Microsoft.XboxApp", //Xbox App (UWP)
    appID: "com.squirrel.GitHubDesktop.GitHubDesktop", //GitHub Desktop (win32)
    title: "Hello",
    message: "world"
  });
  
  toast.show()
  .catch(console.error);
```

- `title?: string` (None)
  
  The title of your notification.
  
  ℹ️ Since the Windows 10 Anniversary Update the default and maximum is up to 2 lines of text.

- `message?: string` (None)

  The content message of your notification.
  You can use "\n" to create a new line for the forthcoming text.
  
  ℹ️ Since the Windows 10 Anniversary Update the default and maximum is up to 4 lines (combined) for the message.
  
- `attribution?: string` (None) | ≥ Win10 (Anniversary Update)

  Reference the source of your content. This text is always displayed at the bottom of your notification, along with your app's identity or the notification's timestamp.

  On older versions of Windows that don't support attribution text, the text will simply be displayed as another text element (assuming you don't already have the maximum of 3 text elements).
  
<p align="center">
  <img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/attribution.png">
</p>
  
```js
  import { Toast } from "powertoast";

  const toast = new Toast({
      appID: "com.squirrel.GitHubDesktop.GitHubDesktop",
      title: "Github",
      message: "Someone commented your issue",
      icon: "D:\\Desktop\\github.png",
      attribution: "Via Web"
  });
  
  toast.show()
  .catch(console.error);
```

- `icon?: string` (None)

  The url or file path of the image source: `.png` and `.jpeg` are supported (48x48 pixels at 100% scaling).
  
  ⚠️ Remote web images over http(s) are **only available when using an UWP appID**.<br/>
  💡 A workaround is to download yourself the image and pass the file path instead of an url.
  
  There are limits on the file size of each individual image.<br/>
  3 MB on normal connections and 1 MB on metered connections.<br/>
  Before Fall Creators Update, images were always limited to 200 KB.<br/>

  If an image exceeds the file size, or fails to download, or times out, or is an unvalid format the image will be dropped and the rest of the notification will be displayed.

- `cropIcon?: boolean` (false)

  Set this to `true` to _"circle-crop"_ the above icon. Otherwise, the icon is square.
  
- `heroImg?: string` (None) | ≥ Win10 (Anniversary Update)

  Display a prominently image within the toast banner and inside the notification center if there is enough room. <br/>
  Image dimensions are 364x180 pixels at 100% scaling.
  If the image is too big it will be cut from the bottom.
  
  <p align="center">
    <img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/header.png">
  </p>
  
  ℹ️ This has the same restrictions as mentionned in the `icon` option.
  
- `inlineImg?: string` (None)

  A full-width inline-image that appears at the bottom of the toast and inside the notification center if there is enough room.
  Image will be resized to fit inside the toast.
  
  <p align="center">
    <img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/footer.png">
  </p>
  
  ℹ️ This has the same restrictions as mentionned in the `icon` option.
  
- `audio?: string` (None)

  The audio source to play when the toast is shown to the user instead of the default system notification sound.<br/>
  Unfortunately you **can not** use a file path with this ! You are limited to the Windows sound schema available in your system.<br/>
  
```js
  import { Toast } from "powertoast";

  const toast = new Toast({
    appID: "com.squirrel.GitHubDesktop.GitHubDesktop",
    title: "Github",
    message: "Someone commented your issue",
    audio: "ms-winsoundevent:Notification.Default"
  });
  
  toast.show()
  .catch(console.error);
```
  
  💡 A workaround is to create your own Windows sound schema with the registry and use it for your toast:
  
```
  //Registry
  Windows Registry Editor Version 5.00

  [HKEY_CURRENT_USER\AppEvents\Schemes\Apps\.Default\mysound]

  [HKEY_CURRENT_USER\AppEvents\Schemes\Apps\.Default\mysound\.Current]
  @="path_to_your_sound_file.wav"

  [HKEY_CURRENT_USER\AppEvents\Schemes\Apps\.Default\mysound\.Default]
  @="path_to_your_sound_file.wav"
```

ℹ️ File must be `.wav` format and by default Windows sounds are located in `%WINDIR%\media`

- `loopAudio?: boolean` (false)

  Set to `true` to loop audio while the notification is being shown.

- `silent?: boolean` (false)

  Set to `true` to mute the sound; `false` to allow the toast notification sound to play.
  
- `hide?: boolean` (false)
  
  Set to `true` to suppress the popup message and places the toast notification **silently** into the notification center.
  
  ℹ️ NB: Using `silent: true` is redundant in this case.
  
- `onClick?: string` (None)

  Protocol to launch when the user click on the toast.<br />
  If none (default) click will just dismiss the notification.

  💡 When using PowerShell ≥ 7.1 or NodeRT an event will be emitted when the user click on the toast or when the toast is dismissed.<br />

  Example of protocol type action button to open up Windows 10's maps app with a pre-populated search field set to "sushi":
  
```js
  import { Toast } from "powertoast";

  const toast = new Toast({
    message: "Sushi",
    onClick: "bingmaps:?q=sushi"
  });
  
  toast.on("activated", (event) => {
    console.log("clicked");
    console.log(event) //"bingmaps:?q=sushi"
  })
  .on("dismissed", (reason) => {
    console.log("dismissed:", reason);
  });
  
  toast.show()
  .catch(console.error);
```

  You can also redirect to an http/https resource :
  
```js
  import { Toast } from "powertoast";

  const toast = new Toast({
    message: "Google It",
    onClick: "https://www.google.com"
  });

  toast.show()
  .catch(console.error);
```

  💡 You can create your own protocol for your application: [create your own URI scheme](https://msdn.microsoft.com/en-us/windows/desktop/aa767914) (msdn).
  
  Here is an example on how to handle your own protocol in Electron:
  
  Consider the following notification:

```js
  import { Toast } from "powertoast";
  
  const toast = new Toast({
    message: "custom URI",
    onClick: "electronApp:helloworld"
  });

  toast.show()
  .catch(console.error);
``
  
  In Electron main process, make your app a single instance with `app.requestSingleInstanceLock()` and use the second-instance event to parse the new argument(s).
  
```js
  if (app.requestSingleInstanceLock() !== true) app.exit();
  app.on("second-instance", (event, argv, cwd) => {  
    console.log(argv);
    //[...,"electronApp:helloworld"]
  });
```

- `activationType?: string` (protocol|background)

  ⚠ **Use this only if you know what you are doing** 🙃.<br/>

  This option allows you to override the activation type of the `onClick` option.<br/>
  
  |activation|description|
  |----------|-----------|
  |protocol|activation protocol (URI scheme)|
  |foreground|launch corresponding appID|
  |background|launch corresponding background task (assuming you set everything up)|
  |system| system call such as alarm (snooze/dismiss), also used by Notification Visualizer|
  
  The default is `protocol` type activation when `onClick` is set, otherwise `background`.
  
  `Protocol` is recommended as there's no way of receiving feedback from the user's choice via PowerShell (< 7.1).
  
  ℹ️ When listening to events (PowerShell ≥ 7.1  / NodeRT) and `onClick` is not set, it defaults to `background` as a _workaround_ for the `activated` event to trigger in this case (this is for your own convenience).
  
  💡 When using a Win32 appID (AUMID) with foreground and background type.<br/>
  If you wish to get any argument back or a valid toast activation: you will need an installed and registered COM server (CLSID).<br/>
  In innosetup this can be done with `AppUserModelToastActivatorCLSID`. Please refer to your framework, installer, setup, etc...
  
- `activationPfn?: string` (None)

  Set the target PFN if you are using `protocol` type activation, so that regardless of whether multiple apps are registered to handle the same protocol URI, your desired app will always be launched.
  

 
  

  
  
  
  
  
  
  
  
  
  
- `scenario?: string` (default)

  The scenario adjusts a few behaviors:

  + `reminder` 
    The notification will stay on screen until the user dismisses it or takes action (Sticky notification).<br />
    ℹ️ Microsoft doesn't recommend to use this just for keeping your notification persistent on screen.<br />
    ⚠️ When using `reminder` you must provide at least one button on your toast notification. Otherwise, the toast will be treated as a normal toast.
    
  + `alarm` 
    In addition to the reminder behaviors, alarms will additionally loop audio with a default alarm sound.<br />
    ⚠️ When using `alarm` you must provide at least one button on your toast notification. Otherwise, the toast will be treated as a normal toast.
    
  + `incomingCall` 
    Same behaviors as alarms except it uses ringtone audio and the buttons are styled differently (displayed fullscreen on Windows Mobile devices).
    
  + `urgent` (≥ Win11) 
    High priority toast that can break through Focus Assist (Do not Disturb) unless explicitly disallowed in the notifications settings.

- `longTime?: boolean` (false) | _Deprecated_

  Set it to `true` to increase the time the toast should show up for.
  
  Most of the time "short" (false) is the most appropriate, and Microsoft recommends not using "long" (true).<br />
  This is only here for specific scenarios and app compatibility with Windows 8.
  
  ℹ️ "Long" is around ~ 25sec and "Short" is the user defined value in `Windows settings > Ease of Access > Display > Show notification for ...`
  which is available in the registry at `HKCU\Control Panel\Accessibility` -> `MessageDuration`::DWORD (Not recommended to directly modify registry value).
  
  User value default to 5sec; <br/>
  Available: 5sec, 7sec, 15sec, 30sec, 1min, 5min

</details>

#### Events

- 

#### Methods

- `show(option?: object): Promise<void>`

Show toast notification.

**⚙️ Options**

- `disableWinRT?: boolean` (false)

If you have installed the optional NodeRT native module(s) but for whatever reason(s) you want to use PowerShell instead set this to `true`.

- `disablePowershellCore?: boolean` (false)

By default when using PowerShell this module will first try to use `pwsh` (PowerShell Core), then `powershell` (PowerShell Desktop / Windows Embedded).
Set this to `true` to skip `pwsh` and only use `powershell` which is included with Windows.

ℹ️ PowerShell Core has some caveats that should be taken into consideration (hence the option to disable/skip it):

+ It's painfully slow to start
+ It needs to be installed and its path added to your env var
+ In order for PowerShell Core to use WinRT it will have to download WinRT assemblies trhough its package manager (done on first run)

⚠️ Please note that some features such as click events and user input requires Powershell ≥ 7.1 (pwsh).<br />

- `keepalive?: number` (6) seconds

⚠️ This option is only for when listening for events !

The maximum amount of time PowerShell will wait for events before exiting or how long to keep the event loop alive for NodeRT.

PowerShell needs to be running to subscribe to the events and NodeRT registered event listener does not keep the event loop alive.
The default value is `6` seconds as 5 seconds is the default notification duration but keep in mind some users might have change this value in their Windows settings.

ℹ️ NB: When using NodeRT If you have something else maintaining the event loop then you can ignore this.

**Returns**
  
✔️ Resolves as soon as the notification has been dispatched. Except when PowerShell needs to be running to subscribe to events in which case the promise will resolve only afterwards.
❌ Rejects on error.

- `clear(): Promise<void>`


/* old */

#### `(option?: obj): Promise<void>`

Send a toast notification.

**Parameters**


<details>
<summary>⚙️ Options</summary>


- **button** : [{ text : string, onClick : string, activationType?: string, contextMenu ?: boolean, icon ?: string }] | ≥ Win10

  Array of buttons to add to your toast. You can only have up to 5 buttons.<br/>
  After the 5th they will be ignored.
  
```js
  [
    {
      text: "", 
      onClick: "", //Protocol to launch (see previous onClick section)
      activationType: "protocol", //Optional onClick activation type override (see previous activationType section; always defaults to protocol)
      icon: "", //Optional icon path
      contextMenu: true //Optional placement to context menu (≥ Win10 Anniversary Update)
    },
    ...
  ]
```
  
<p align="center">
<img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/button.png">
</p>
  
```js
import toast from 'powertoast';

toast({
  title: "Browser",
  message: "Choose your favorite",
  button: [
    {text: "Firefox", onClick:"https://www.mozilla.org/en/firefox/new/"},
    {text: "Chrome", onClick:"https://www.google.com/chrome/"}
  ]
}).catch(err => console.error(err));
```
  
  You can add icons to your buttons.<br />
  These icons are white transparent 16x16 pixel images at 100% scaling, and should have no padding included in the image itself.<br />
  In order to transforms the style of your buttons into icon buttons you have to provide icons for **ALL** of your buttons in the notification.
  
<p align="center">
<img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/btn-icon.png">
</p>
  
  You can add additional context menu actions (Anniversary Update) to the existing context menu that appears when the user right clicks your toast from within notification center by using `contextMenu: true`.<br />
This menu only appears when right clicked from notification center. It does not appear when right clicking a toast popup banner.
Anniversary Update and up, on older version these additional context menu actions will simply appear as normal buttons on your toast.
Additional context menu items contribute to the total limit of 5 buttons on a toast.

- **callback** : { keepalive ?: number, onActivated?() : void, onDismissed?() : void } | ≥ Win10 (⚠️ WinRT / PowerShell ≥ 7.1 only) 

  Callback to execute when user activates a toast notification through a click or when a toast notification leaves the screen, either by expiring or being explicitly dismissed by the user.<br />
  
  Because of how [NodeRT](https://github.com/NodeRT/NodeRT) works registered event listener does not keep the event loop alive so you will need to provide a timeout value to keep it alive (default to 6sec as 5sec is the default notification duration but keep in mind some users might have change this value in their Windows settings).<br />
  💡 If you have something else maintaining the event loop then you can ignore this.<br />
  
  The promise will resolve as soon as possible and will not wait for the keep-a-live. The keep-a-live is only to permit WinRT events to register.<br />
  
```js
  import toast from 'powertoast';

  toast({
    title: "Hello",
    message: "world",
    callback: { 
      keepalive: 6, //keep-a-live in sec
      onActivated: ()=>{ console.log("click") },
      onDismissed: (reason)=>{ console.log(reason) }
    }
  })
  .then(()=> console.log("Notified"))
  .catch(err => console.error(err));
```
  
  `onDismissed` gives you the reason:
  
  |Name|Code|Description|
  |----|----|-----------|
  |UserCanceled|0|User dismissed the toast|
  |ApplicationHidden|1|App explicitly hid the toast notification by calling the ToastNotifier.hide method|
  |TimedOut|2|Toast had been shown for the maximum allowed time and was faded out|
  
  💡 When using a win32 appID (AUMID) and you aren't using the _onClick_ option and you didn't override the default _activationType_ for it then in order to get the `onActivated` callback to trigger **from the notification center**. You'll need to set up a CLSID (_COM interface_) for said appID. In innosetup this can be done with `AppUserModelToastActivatorCLSID`. Please refer to your framework, installer, setup, etc...

  ⚠️ When using PowerShell ≥ 7.1 usage is as above with the following changes:
  
  - We have to keep PowerShell running to subscribe to the events hence the promise will resolve only afterwards.
  - keepalive is the maximum value PowerShell will wait for any of the events before exiting.
  - There is no need to keep the event loop alive (if that wasn't clear)
  
```js
  import toast from 'powertoast';

  toast({
    usePowerShellCore: true, //Use pwsh (core) instead of powershell (desktop); In this case v7.1
    title: "Hello",
    message: "world",
    callback: { 
      keepalive: 6, //time-out in sec
      onActivated: ()=>{ console.log("click") },
      onDismissed: (reason)=>{ console.log(reason) }
    }
  })
  .then(()=> console.log("Notified"))
  .catch(err => console.error(err));
```
  

  
- **progress** : { header ?: string, percent ?: number | null, custom ?: string, footer ?: string } | Win8.x and ≥ Win10 (Creators Update)

  Add a progress bar to your toast.<br/>
```
  {
    header : optional string,
    footer: optional string,
    percent : percent of the progress bar, set it to null or omit it to get a progress with the little dots moving,
    custom : optional string to be displayed instead of the default percentage string
  }
```
  
<p align="center">
<img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/progress.png">
</p>
  
```js
import toast from 'powertoast';

toast({
  title: "Dummy",
  message: "Hello World",
  icon: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/480/winner.jpg",
  progress:{
    header: "Header",
    footer: "Footer",
    percent: 50,
    custom: "10/20 Beers"
  }
}).catch(err => console.error(err));
```

💡 On Windows 8.x This will be shown as a text as long as your message is one line max.<br/>
custom takes precedence over percent and both header and footer are ignored.
<p align="center">
<img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/progress_win8.png">
</p>

```js
import toast from 'powertoast';

toast({
  title: "Dummy",
  message: "Hello World",
  icon: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/480/winner.jpg",
  progress:{ percent: 50 }
}).catch(err => console.error(err));
```
  
- **uniqueID** : string | ≥ Win10

   You can replace a notification by sending a new toast with the same uniqueID. <br/>
   This is useful when using a progress bar or correcting/updating the information on a toast. <br/>
   And you don't want to end up with a flood of similar toasts in the notification center. <br/> 
   
   However this is not really suitable for information that frequently changes in a short period of time (like a download progress for example)
   or subtle changes to your toast content, like changing 50% to 65%.

- **sequenceNumber** : number | ≥ Win10

    Provide sequence number to prevent out-of-order updates, or assign 0 to indicate "always update". <br/>
    A higher sequence number indicates a newer toast. <br/>
    _default to 0_ <br/>
    
    The sequence number may helps to ensure that toasts will not be displayed in a manner that may confuse when updating/correcting.
  
- **group** : { id : string, title : string } | ≥ Win10 (Creators Update)

    You can group notifications under a common header within notification center<br/>
```
  {
    id: use the same header id string to unify them under the header,
    title: title of the header, title can be different and will be shown above the toast.
           title from the most recent notification within a group is used in notification center, 
           if that notification gets removed, then the title falls back 
           to the next most recent notification. 
  }
```
  
<p align="center">
<img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/group.png">
</p>
  
- **timeStamp** : number | string | ≥ Win10

  Unix epoch time in seconds.<br/>
  Current time by **default** if not specified.<br/>
  
  By default, the timestamp visible within notification center is set to the time that the notification was sent.<br/>
  You can optionally override the timestamp with your own custom date and time, so that the timestamp represents the time the message/information/content was actually created, rather than the time that the notification was sent.<br/>
  This also ensures that your notifications appear in the correct order within notification center (which are sorted by time). Microsoft recommends that most apps specify a custom timestamp.<br/>
  But you can safely omit this option.

</details>

## Named export

#### `isWinRTAvailable: boolean`

True if the peerDependencies for WinRT were successfully loaded; false otherwise.

#### `remove(appID: string, uniqueID?: string | string[]): Promise<void>`

Remove programmatically notification(s) from the notification center (≥ Win10).

If using only appID then it removes every notification for said appID in the notification center.<br/>
If you provide an optional uniqueID _as a string_ then it removes that specific notification for the given appID.

If you want to use the tag and group (label) properties of a toast to target a notification then use uniqueID _as an array_ as `[tag, groupLabel]`.<br/>
Only need to use groupLabel ? set tag to null `[null, groupLabel]`.<br/>
groupLabel can not be omitted so `[tag, null]` isn't valid.

⚠️ NB: Do not confuse group (label) with the `group` option of this lib default export.<br/>
`uniqueID` option of this lib default export actually sets both tag and group (label) to the same value for convenience.

#### `getHistory(appID: string, verbose?: boolean): Promise<obj[]>`

Get notification history for the given appID (≥ Win10).<br/>
Contrary to what the _'history'_ might suggest it just list the current notification(s) for the given appID in the notification center.<br/>
Once a notification is cleared from it it's gone.

<details>
<summary>Return an array of object with the following properties:</summary>

|name|type|description|
|----|----|-----------|
|expirationTime|string|time after which a toast should not be displayed (eg: "01/08/2021 20:53:23 +07:00")|
|tag|string|unique identifier (tag)|
|group|string|unique identifier (group label)|

If verbose is true then the following properties are added:

|name|type|description|
|----|----|-----------|
|remoteID|string or null|id to correlate this notification with another one generated on another device|
|suppressPopup|boolean|whether toast's pop-up UI is displayed on the user's screen|
|mirroringAllowed|boolean|whether notification is allowed to be displayed on multiple devices|
|expiresOnReboot|boolean|whether toast will remain in the notification center after a reboot|
|highPriority|boolean|whether the notification is displayed in high priority (wake up the screen, etc)|
|status|string or null|additional information about the status of the toast|

</details>

#### `makeXML(option?: obj): string`

Expose the toastXML string builder used by the default export for debugging purposes or for example if you want to use it with [Electron native API](https://www.electronjs.org/fr/docs/latest/api/notification#new-notificationoptions).

Please see the default export for the relevant option(s).<br />
For Windows 8/8.1 there is an additional option `legacy`.

```js
import { makeXML } from "powertoast";

const options = {
  title: "Winner",
  message: "Win a game",
  icon: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/480/winner.jpg",
  legacy: true //Win 8/8.1
};

const toastXmlString = makeXML(options);
console.log(toastXmlString); //do something

//Or with Electron
const toast = new Notification({toastXml: toastXmlString});
toast.show();
```

Microsoft doc
=============

📖 [Microsoft Toast API](https://docs.microsoft.com/en-us/windows/uwp/design/shell/tiles-and-notifications/adaptive-interactive-toasts).<br />
📖 [Toast content XML schema](https://docs.microsoft.com/en-us/windows/uwp/design/shell/tiles-and-notifications/toast-xml-schema).<br />
📖 [ToastNotificationHistory class](https://docs.microsoft.com/en-us/uwp/api/Windows.UI.Notifications.ToastNotificationHistory).<br />
📖 [ToastNotification properties](https://docs.microsoft.com/en-us/uwp/api/windows.ui.notifications.toastnotification#properties).<br />

Common Issues
=============

- I dont see any notification

  1. Check your appID.
  2. Check your focus assistant and notifcation settings. Don't forget 'Quiet hours' on Windows 8.1
  3. In some cases you need a shortcut (win8) or a non-pinned shortcut (win10) to your start menu for the specified appID.
  
- Where is my icon/image ?

  Check URL or file path.<br/>
  ⚠️ URL is only available for UWP appID.<br/>
  If an image exceeds the file size, or fails to download, or times out, or is an unvalid format the image will be dropped and the rest of the notification will be displayed.<br/>
  💡 A workaround is to download yourself the image and pass the img filepath instead of an URL.
  
- Notifications when app is fullscreen aren't displayed
  
  You can't drawn a notification over an exclusive fullscreen app.<br />
  But you can over a fullscreen borderless.<br />
  
  Double check your focus assistant and notifcation settings in the windows settings panel.<br />
  ⚠️ Note that since Windows 10 1903 there is a new default fullscreen auto rule enabled to alarm only by default which will prevent toast notification over fullscreen borderless.

- Slight delay between event and the display of the notification

  Running the PowerShell script can take up to a few seconds in some cases.<br />
  If it really bothers you, you might want to try to use the optional NodeRT native module.<br />
  If you are loading a remote img resource via http/https it will significantly impact the delay if it hasn't been cached yet by Windows.<br />
  The first time you are using this with PowerShell ≥ 7.1; It has to download assemblies (such as WinRT types).

- Notification(s) don't stay in the notification center

  When using a Win32 appID a notification will remove itself from the notification center when the app gets focus.<br/>
  You can change this behavior in the Win10 settings panel for notification (not globally but per application).<br/>
  💡 This can also be done programmatically by setting the DWORD regkey `ShowInActionCenter` to `1` in `HKCU:\\SOFTWARE\Microsoft\Windows\CurrentVersion\Notifications\Settings` for your appID.
  
Known missing features
======================

  + Expiration time
  + Adaptative progress bar update
  + Button callback (_due to technical limitation_)
