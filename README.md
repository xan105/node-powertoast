About
=====

Windows toast notification using PowerShell or WinRT (Windows 8, 10, 11).<br />

Doesn't use any native module. Everything is done through PowerShell but you can use native WinRT API instead by **optionally** installing [NodeRT](https://github.com/NodeRT/NodeRT) relative package (see [installation](#Installation))

Using NodeRT is a bit faster as you don't have to wait for the PowerShell VM to start and you'll be able to subscribe to the onActivated/onDismissed callback.<br />
_NB: Callbacks are now also available with PowerShell ≥ 7.1._

Example
=======
<p align="center">
<img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/example.png">
</p>

```js 
import toast from 'powertoast';

//Sending a simple notification
toast({
  title: "NPM",
  message: "Installed.",
  icon: "https://static.npmjs.com/7a7ffabbd910fc60161bc04f2cee4160.png"
}).catch((err) => { 
  console.error(err);
});

//Callback
toast({
  title: "NPM",
  message: "Installed.",
  icon: "https://static.npmjs.com/7a7ffabbd910fc60161bc04f2cee4160.png",
  callback: { 
   onActivated: ()=>{ console.log("click") },
   onDismissed: (reason)=>{ console.log(reason) }
  }
})
.catch((err) => { 
  console.error(err);
});
```

Powertoast was made for Node.js first but it can work as well with Electron (PowerShell or WinRT/NodeRT).<br />
Alternatively if you prefer to use [Electron native API](https://www.electronjs.org/fr/docs/latest/api/notification#new-notificationoptions) you can build a toastXml string instead:

```js
"use strict";
const { Notification } = require('electron');

(async()=>{
  const { makeXML } = await import('powertoast'); //Load ESM
  
  const options = {
    title: "foo",
    message: "bar",
    button: [
      { text: "red", onClick: "electron:red" },
      { text: "blue", onClick: "electron:blue" }
    ]
  };

  const toastXmlString = makeXML(options);
  const toast = new Notification({toastXml: toastXmlString});
  toast.show();

})().catch(console.error);
```

Installation
============

`npm install powertoast`

### Optional packages

The recommended NodeRT scope is the official [@nodert-win10-rs4](https://github.com/NodeRT/NodeRT) but unofficial [@nodert-win10-20h1](https://github.com/MaySoMusician/NodeRT) is also supported.
`@nodert-win10-20h1` is _"easier"_ to compile nowadays as it supports vs2019 and targets a more up to date Windows 10 SDK.
But as per the author's instruction it should be considered experimental.

<details>
<summary>@nodert-win10-rs4 (recommended)</summary>

 + [NodeRT windows.data.xml.dom](https://www.npmjs.com/package/@nodert-win10-rs4/windows.data.xml.dom)<br />
 `npm install @nodert-win10-rs4/windows.data.xml.dom`
 + [NodeRT windows.ui.notifications](https://www.npmjs.com/package/@nodert-win10-rs4/windows.ui.notifications)<br /> 
 `npm install @nodert-win10-rs4/windows.ui.notifications`
 
 _Prerequisite: C/C++ build tools (vs20**15**/20**17**) and Python 3.x (node-gyp) / Windows 10 SDK **10.0.17134.0** (1803 Redstone 4)_<br/>
_⚠️ SDK and build tools version are important here. This will most likely fail to compile otherwise._

</details>

<details>
<summary>@nodert-win10-20h1 (experimental)</summary>

 + [NodeRT windows.data.xml.dom](https://www.npmjs.com/package/@nodert-win10-20h1/windows.data.xml.dom)<br />
 `npm install @nodert-win10-20h1/windows.data.xml.dom`
 + [NodeRT windows.ui.notifications](https://www.npmjs.com/package/@nodert-win10-20h1/windows.ui.notifications)<br /> 
 `npm install @nodert-win10-20h1/windows.ui.notifications`
 
 _Prerequisite: C/C++ build tools (vs20**19**/20**22**) and Python 3.x (node-gyp) / Windows 10 SDK **10.0.19041.0** (2004)_<br/>
_⚠️ SDK and build tools version are important here. This will most likely fail to compile otherwise._

 💡 node-gyp ≥ v8.4.0 supports vs2022 (_included in npm ≥ 8.1.4_)

</details>

⚠️ Electron ≥ 14 : NodeRT should be loaded in the main process [NodeRT#158](https://github.com/NodeRT/NodeRT/issues/158)

API
===

⚠️ This module is only available as an ECMAScript module (ESM) starting with version 2.0.0.<br />
Previous version(s) are CommonJS (CJS) with an ESM wrapper.

## Default export

#### `(option?: obj): Promise<void>`

⚠️ Windows 8/8.1 have very basic notification compared to Windows 10/11, some options will be ignored.

<details>
<summary>⚙️ Options</summary>

- **disableWinRT** : boolean | ≥ Win8.x

  If you have installed the optional NodeRT native module but for whatever reason(s) you want to use PowerShell instead.<br />
  Then set this to true. **Default** to false.
  
- **usePowerShellCore** : boolean | ≥ Win8.x

  Use `pwsh` (PowerShell Core) instead of `powershell` (PowerShell Desktop / Windows Embedded).<br />
  _Needless to say PowerShell (core) needs to be installed and its path added to your env var for this to work._<br />
  **Default** to false.

- **appID** : string | ≥ Win8.x

  Your [Application User Model ID](https://docs.microsoft.com/fr-fr/windows/desktop/shell/appids) a.k.a. AUMID.
  
  **Default** to Microsoft Store (UWP) so you can see how it works if not specified.
  
  ⚠️ An invalid appID will result in the notification not being displayed !
  
  You can view all installed appID via the PowerShell command `Get-StartApps`.<br />
  AppIDs can be classified into 2 categories: Win32 appID and UWP appID.<br />
  
  <p align="center">
  <img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/aumid.png"><br />
  <em>xan105/node-Get-StartApps isValidAUMID()</em>
  </p>
  
  Win32 appID (_red_) is whatever string you want.<br />
  UWP appID (_green_) is a string with a very specific set of rules.<br />
  Some features / behaviors are limited to UWP appID only because Microsoft™.
  
  Your framework, installer, setup, etc... should have method(s) to create / use one for you.<br />
  Eg: Innosetup has the parameter `AppUserModelID` in the `[Icons]` section, Electron has the method `app.setAppUserModelId()`.<br />
  💡 It basically boils down to creating a .lnk shortcut in the `StartMenu` folder with the AUMID property set and some registry.<br />
  
```js  
  import toast from 'powertoast';

  toast({
    appID: "Microsoft.XboxApp_8wekyb3d8bbwe!Microsoft.XboxApp", //Xbox App (UWP)
    appID: "com.squirrel.GitHubDesktop.GitHubDesktop", //GitHub Desktop (win32)
    title: "Hello",
    message: "world"
  }).catch(err => console.error(err));
```

  Example with a **dev** electron app : (_Dont forget to add a non-pinned shortcut to your start menu in this case._)

  <p align="center">
  <img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/electron.png">
  </p>

```js  
  import toast from 'powertoast';

  toast({
    appID: "D:\\dev\\hello_world\\node_modules\\electron\\dist\\electron.exe", //app.setAppUserModelId(process.execPath) 
    title: "Hello",
    message: "world"
  }).catch(err => console.error(err));
```

- **title** : string | ≥ Win8.x
  
  The title of your notification.

- **message** : string | ≥ Win8.x

  The content message of your notification.
  You can use "\n" to create a new line for the forthcoming text.
  
  Since the Windows 10 Anniversary Update the default and maximum is up to 2 lines of text for the title, and up to 4 lines (combined) for the message.

- **attribution** : string | ≥ Win10 (Anniversary Update)

  Reference the source of your content. This text is always displayed at the bottom of your notification, along with your app's identity or the notification's timestamp.

  On older versions of Windows that don't support attribution text, the text will simply be displayed as another text element (assuming you don't already have the maximum of 3 text elements).
  
 <p align="center">
<img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/attribution.png">
</p>
  
```js
    
    import toast from 'powertoast';

    toast({
      appID: "com.squirrel.GitHubDesktop.GitHubDesktop",
      title: "Github",
      message: "Someone commented your issue",
      icon: "D:\\Desktop\\25231.png",
      attribution: "Via Web"
    }).catch(err => console.error(err));
```

- **icon** : string | ≥ Win8.x

  The URI of the image source, using one of these protocol handlers:
  
  - file:/// (_eg: `"D:\\Desktop\\test.jpg"`_)
  - http(s)://

  .png and .jpeg are supported (48x48 pixels at 100% scaling).

  ⚠️ Remote web images over http(s) are **only available when using an UWP appID**.<br/>
  There are limits on the file size of each individual image.<br/>
  3 MB on normal connections and 1 MB on metered connections.<br/>
  Before Fall Creators Update, images were always limited to 200 KB.<br/>

  If an image exceeds the file size, or fails to download, or times out, or is an unvalid format the image will be dropped and the rest of the notification will be displayed.
  
  💡 A workaround is to download yourself the image and pass the img filepath instead of an URL.

- **cropIcon** : boolean | ≥ Win10

  You can use this to 'circle-crop' your image (true). Otherwise, the image is square (false).
  
  **default** to false.

- **headerImg** : string | ≥ Win10 (Anniversary Update)

  <p align="center">
  <img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/header.png">
  </p>

  Display a prominently image within the toast banner and inside the Action Center if there is enough room. <br/>
  Image dimensions are 364x180 pixels at 100% scaling.
  If the image is too big it will be cut from the bottom.
  
  Otherwise same restrictions as mentionned in the `icon` option.

- **footerImg** : string | ≥ Win10

  <p align="center">
  <img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/footer.png">
  </p>

  A full-width inline-image that appears at the bottom of the toast and inside the Action Center if there is enough room.
  Image will be resized to fit inside the toast.
  
  Otherwise same restrictions as mentionned in the `icon` option.

- **silent** : boolean | ≥ Win8.x

  True to mute the sound; false to allow the toast notification sound to play. **Default** to false.

- **hide** : boolean | ≥ Win10
  
  True to suppress the popup message and places the toast notification **silently** into the action center. **Default** to false.<br/>
  Using `silent: true` is redundant in this case.
  
- **audio** : string | ≥ Win8.x

  The audio source to play when the toast is shown to the user.<br/>
  You **can't** use file:/// with this ! You are limited to the Windows sound schema available in your system.<br/>
  
  example: ms-winsoundevent:Notification.Default
  
  💡 But you can create your own Windows sound schema with the registry and use it for your toast:
  
  File must be a .wav, by default Windows sounds are located in `%WINDIR%\media`
  
```
  //Registry
  Windows Registry Editor Version 5.00

  [HKEY_CURRENT_USER\AppEvents\Schemes\Apps\.Default\**YOUR_SOUND_ID**]

  [HKEY_CURRENT_USER\AppEvents\Schemes\Apps\.Default\**YOUR_SOUND_ID**\.Current]
  @="path_to_your_sound_file.wav"

  [HKEY_CURRENT_USER\AppEvents\Schemes\Apps\.Default\**YOUR_SOUND_ID**\.Default]
  @="path_to_your_sound_file.wav"
  
  //js
  import toast from 'powertoast';

  toast({
    appID: "com.squirrel.GitHubDesktop.GitHubDesktop",
    title: "Github",
    message: "Someone commented your issue",
    audio: "ms-winsoundevent:**YOUR_SOUND_ID**"
  }).catch(err => console.error(err));
```
  
- **longTime** : boolean | ≥ Win8.x

  Increase the time the toast should show up for.<br />
  **Default** to false.
  
  Most of the time "short" (default) is the most appropriate, and Microsoft recommends not using "long".<br />
  This is only here for specific scenarios and app compatibility (Windows 8).
  
  Long is around ~ 25sec<br />
  Short is the user defined value (_Windows settings > Ease of Access > Display > Show notification for ..._)
  
  Or registry: `HKCU\Control Panel\Accessibility` -> `MessageDuration`::DWORD (Not recommended to directly modify registry value)
  
  User value default to 5sec; <br/>
  Available: 5, 7, 15, 30, 1min, 5min

- **onClick** : string | ≥ Win10

  Protocol to launch when the user click on the toast.<br />
  If none (**default**) click will just dismiss the notification.<br />

  ⚠️ Protocol type action is recommended (see activationType below) ~~as there's no way of receiving feedback from the user's choice via PowerShell~~.<br />
  💡 If you are using PowerShell ≥ 7.1 or NodeRT native module and you want to execute some js code when the user click on the toast or when the toast is dismissed then please see the callback option section down below.<br />
  
  Example of protocol type action button to open up Windows 10's maps app with a pre-populated search field set to "sushi":
  
```js
  import toast from 'powertoast';

  toast({
    message: "Sushi",
    onClick: "bingmaps:?q=sushi"
  }).catch(err => console.error(err));
```

  You can also redirect to an http/https resource :
  
```js
  import toast from 'powertoast';

  toast({
    message: "Google It",
    onClick: "https://www.google.com"
  }).catch(err => console.error(err));
```

  💡 You can create your own protocol: [create your own URI scheme](https://msdn.microsoft.com/en-us/windows/desktop/aa767914).<br/>
  And even send args back to say an electron app:<br/>
  In electron just make your app a single instance with `app.requestSingleInstanceLock()`<br/>
  Then use the second-instance event to parse the new args.
  
  Let's say we created an electron: URI scheme;
  Let's send a notification:
```js
  toast({
    message: "custom URI",
    onClick: "electron:helloworld"
  }).catch(err => console.error(err));
  ```
  In electron:
  ```js
  if (app.requestSingleInstanceLock() !== true) { app.quit(); }
  app.on('second-instance', (event, argv, cwd) => {  
    
    console.log(argv);
    //[...,"electron:helloworld"]

  }) 
```

- **activationType** : string | ≥ Win10

  This option allows you to override the activation type of the _onClick_ option.<br/>
  Use this only if you know what you are doing 🙃.<br/>

  |activation|description|
  |----------|-----------|
  |foreground|launch corresponding appID|
  |background|launch corresponding background task (assuming you set everything up)|
  |protocol|activation protocol (URI scheme)|
  |system| undocumented but used by Notification Visualizer|
  
  Default is `protocol` as due to the scope of this lib this is what you'll most likely need and when using callback without _onClick_ option it defaults to `background` as a _workaround_ for the `onActivated` callback to trigger in this case (this is for your own convenience).
  
  💡 When using a win32 appID (AUMID) with foreground and background type.<br/>
  If you wish to get any argument back or a valid toast activation: you will need an installed and registered COM server (CLSID).<br/>
  In innosetup this can be done with `AppUserModelToastActivatorCLSID`. Please refer to your framework, installer, setup, etc...

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
  
  You can add additional context menu actions (Anniversary Update) to the existing context menu that appears when the user right clicks your toast from within Action Center by using `contextMenu: true`.<br />
This menu only appears when right clicked from Action Center. It does not appear when right clicking a toast popup banner.
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
  
  💡 When using a win32 appID (AUMID) and you aren't using the _onClick_ option and you didn't override the default _activationType_ for it then in order to get the `onActivated` callback to trigger **from the action center**. You'll need to set up a CLSID (_COM interface_) for said appID. In innosetup this can be done with `AppUserModelToastActivatorCLSID`. Please refer to your framework, installer, setup, etc...

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
  
- **scenario** : string | ≥ Win10

  "default", "alarm", "reminder", "incomingCall"<br />
  **Default** to ... well, 'default'.

  The scenario adjusts a few behaviors:

  + **Reminder**: The notification will stay on screen until the user dismisses it or takes action (Sticky notification).
    _Microsoft doesn't recommend to use this just for keeping your notification persistent on screen_.
  + **Alarm**: In addition to the reminder behaviors, alarms will additionally loop audio with a default alarm sound.
  + **IncomingCall**: Same behaviors as alarms except they use ringtone audio and their buttons are styled differently (displayed full screen on Windows Mobile devices).
  <br />
  ⚠️ When using Reminder or Alarm, you must provide at least one button on your toast notification.<br /> 
  Otherwise, the toast will be treated as a normal toast.
  
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
   And you don't want to end up with a flood of similar toasts in the Action Center. <br/> 
   
   However this is not really suitable for information that frequently changes in a short period of time (like a download progress for example)
   or subtle changes to your toast content, like changing 50% to 65%.

- **sequenceNumber** : number | ≥ Win10

    Provide sequence number to prevent out-of-order updates, or assign 0 to indicate "always update". <br/>
    A higher sequence number indicates a newer toast. <br/>
    _default to 0_ <br/>
    
    The sequence number may helps to ensure that toasts will not be displayed in a manner that may confuse when updating/correcting.
  
- **group** : { id : string, title : string } | ≥ Win10 (Creators Update)

    You can group notifications under a common header within Action Center<br/>
```
  {
    id: use the same header id string to unify them under the header,
    title: title of the header, title can be different and will be shown above the toast.
           title from the most recent notification within a group is used in Action Center, 
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
  
  By default, the timestamp visible within Action Center is set to the time that the notification was sent.<br/>
  You can optionally override the timestamp with your own custom date and time, so that the timestamp represents the time the message/information/content was actually created, rather than the time that the notification was sent.<br/>
  This also ensures that your notifications appear in the correct order within Action Center (which are sorted by time). Microsoft recommends that most apps specify a custom timestamp.<br/>
  But you can safely omit this option.

</details>

## Named export

#### `boolean isWinRTAvailable`

True if the peerDependencies for WinRT were successfully loaded; false otherwise.

#### `remove(appID: string, uniqueID?: string | string[]): Promise<void>`

Remove programmatically notification(s) from the Action Center (≥ Win10).

If using only appID then it removes every notification for said appID in the action center.<br/>
If you provide an optional uniqueID _as a string_ then it removes that specific notification for the given appID.

If you want to use the tag and group (label) properties of a toast to target a notification then use uniqueID _as an array_ as `[tag, groupLabel]`.<br/>
Only need to use groupLabel ? set tag to null `[null, groupLabel]`.<br/>
groupLabel can not be omitted so `[tag, null]` isn't valid.

⚠️ NB: Do not confuse group (label) with the `group` option of this lib default export.<br/>
`uniqueID` option of this lib default export actually sets both tag and group (label) to the same value for convenience.

#### `getHistory(appID: string): Promise<obj[]>`

Get notification history for the given appID (≥ Win10).<br/>
Contrary to what the _'history'_ might suggest it just list the current notification(s) for the given appID in the action center.<br/>
Once a notification is cleared from it it's gone.

Return an array of object with the following properties:<br/>

|name|type|description|
|----|----|-----------|
|expirationTime|string|time after which a toast should not be displayed (eg: "01/08/2021 20:53:23 +07:00")|
|tag|string|unique identifier (tag)|
|group|string|unique identifier (group label)|
|remoteID|string or null|id to correlate this notification with another one generated on another device|
|suppressPopup|boolean|whether toast's pop-up UI is displayed on the user's screen|
|mirroringAllowed|boolean|whether notification is allowed to be displayed on multiple devices|
|expiresOnReboot|boolean|whether toast will remain in the Action Center after a reboot|
|highPriority|boolean|whether the notification is displayed in high priority (wake up the screen, etc)|
|status|string or null|additional information about the status of the toast|

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

- Notification(s) don't stay in the Action center

  When using a Win32 appID a notification will remove itself from the Action center when the app gets focus.<br/>
  You can change this behavior in the Win10 settings panel for notification (not globally but per application).<br/>
  💡 This can also be done programmatically by setting the DWORD regkey `ShowInActionCenter` to `1` in `HKCU:\\SOFTWARE\Microsoft\Windows\CurrentVersion\Notifications\Settings` for your appID.
  
Known missing features
======================

  + Expiration time
  + Adaptative progress bar update
  + Button callback (_due to technical limitation_)
