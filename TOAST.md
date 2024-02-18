## `aumid?: string` (Microsoft.WindowsStore_8wekyb3d8bbwe!App)

  Your [Application User Model ID](https://docs.microsoft.com/fr-fr/windows/desktop/shell/appids) a.k.a. AUMID.
  
  Defaults to Microsoft Store (UWP) if not specified, so you can see how it works.<br/>
  AUMIDs can be classified into 2 categories: Win32 and UWP.
  
  ```js  
    import { Toast } from "powertoast";

    const toast = new Toast({
      aumid: "Microsoft.XboxApp_8wekyb3d8bbwe!Microsoft.XboxApp", //Xbox App (UWP)
      aumid: "com.squirrel.GitHubDesktop.GitHubDesktop", //GitHub Desktop (win32)
      title: "Hello",
      message: "world"
    });
    
    toast.show()
    .catch(console.error);
  ```
  
  ℹ️ You can view all installed AUMID via the PowerShell command `Get-StartApps`.<br />
  
  <p align="center">
    <img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/aumid.png"><br />
    <em>xan105/node-Get-StartApps isValidAUMID()</em>
  </p>
  
  ⚠️ Some features / behaviors are limited to UWP AUMID only, _because Microsoft™_.<br />
  ⚠️ On previous version of Windows, an invalid AUMID would result in the notification not being displayed !
  
### Win32
  
  For Win32 apps your framework, installer, setup, etc... should have method(s) to create / use one for you.<br />
  Eg: Innosetup has the parameter `AppUserModelID` in the `[Icons]` section, Electron has the method `app.setAppUserModelId()`.<br />
  💡 It basically boils down to creating a .lnk shortcut in the `StartMenu` folder with the AUMID property set and some registry.<br />
  
  When using a Win32 AUMID a notification will remove itself from the notification center when the app gets focus.<br/>
  You can change this behavior in the Win10 settings panel for notification (not globally but per application).<br/>
  💡 This can also be done programmatically by setting the DWORD regkey `ShowInActionCenter` to `1` in `HKCU:\\SOFTWARE\Microsoft\Windows\CurrentVersion\Notifications\Settings` for your AUMID.

## `title?: string` (None)
  
  The title of your notification.
  
  ℹ️ Since the Windows 10 Anniversary Update the default and maximum is up to 2 lines of text.

## `message?: string` (None)

  The content message of your notification.
  You can use "\n" to create a new line for the forthcoming text.
  
  ℹ️ Since the Windows 10 Anniversary Update the default and maximum is up to 4 lines (combined) for the message.
  
## `attribution?: string` (None) | ≥ Win10 (Anniversary Update)

  Reference the source of your content. This text is always displayed at the bottom of your notification, along with your app's identity or the notification's timestamp.

  On older versions of Windows that don't support attribution text, the text will simply be displayed as another text element (assuming you don't already have the maximum of 3 text elements).
  
  <p align="center">
    <img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/attribution.png">
  </p>
    
  ```js
    import { Toast } from "powertoast";

    const toast = new Toast({
        aumid: "com.squirrel.GitHubDesktop.GitHubDesktop",
        title: "Github",
        message: "Someone commented your issue",
        icon: "D:\\Desktop\\github.png",
        attribution: "Via Web"
    });
    
    toast.show()
    .catch(console.error);
  ```

## `icon?: string` (None)

  The url or file path of the image source: `.png` and `.jpeg` are supported (48x48 pixels at 100% scaling).
  
  ⚠️ Remote web images over http(s) are **only available when using an UWP AUMID**.<br/>
  💡 A workaround is to download yourself the image and pass the file path instead of an url.
  
  There are limits on the file size of each individual image.<br/>
  3 MB on normal connections and 1 MB on metered connections.<br/>
  Before Fall Creators Update, images were always limited to 200 KB.<br/>

  If an image exceeds the file size, or fails to download, or times out, or is an unvalid format the image will be dropped and the rest of the notification will be displayed.

## `cropIcon?: boolean` (false)

  Set this to `true` to _"circle-crop"_ the above icon. Otherwise, the icon is square.
  
## `heroImg?: string` (None) | ≥ Win10 (Anniversary Update)

  Display a prominently image within the toast banner and inside the notification center if there is enough room. <br/>
  Image dimensions are 364x180 pixels at 100% scaling.
  If the image is too big it will be cut from the bottom.
  
  <p align="center">
    <img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/header.png">
  </p>
  
  ℹ️ This has the same restrictions as mentionned in the `icon` option.
  
## `inlineImg?: string` (None)

  A full-width inline-image that appears at the bottom of the toast and inside the notification center if there is enough room.
  Image will be resized to fit inside the toast.
  
  <p align="center">
    <img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/footer.png">
  </p>
  
  ℹ️ This has the same restrictions as mentionned in the `icon` option.
  
## `audio?: string` (None)

  The audio source to play when the toast is shown to the user instead of the default system notification sound.<br/>
  Unfortunately you **can not** use a file path with this ! You are limited to the Windows sound schema available in your system.<br/>
  
  ```js
    import { Toast } from "powertoast";

    const toast = new Toast({
      aumid: "com.squirrel.GitHubDesktop.GitHubDesktop",
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

## `loopAudio?: boolean` (false)

  Set to `true` to loop audio while the notification is being shown.

## `silent?: boolean` (false)

  Set to `true` to mute the sound; `false` to allow the toast notification sound to play.
  
## `hide?: boolean` (false)
  
  Set to `true` to suppress the popup message and places the toast notification **silently** into the notification center.
  
  ℹ️ NB: Using `silent: true` is redundant in this case.
  
## `activation?: string | object`

  This option controls the behavior of the toast when the user click on it.
  
  ```ts
  {
    type?: string,
    launch?: string,
    pfn?: string
  }
  ```

  💡If `activation` is a `string`, then it specifies the `launch` property.
  
  + `type?: string` (protocol | background)
  
    |activation|description|
    |----------|-----------|
    |protocol|activation protocol (URI scheme)|
    |background|launch corresponding background task (assuming you set everything up)|
    |foreground|launch the corresponding AUMID|
    |system| system call such as alarm (snooze/dismiss), also used by Notification Visualizer|
      
    The default is `protocol` type activation when `launch` is set, otherwise `background`.
    
    `Protocol` is **recommended** as there's no way of receiving feedback from the user's choice via PowerShell (< 7.1).
    
    ℹ️ When listening to events (PowerShell ≥ 7.1  / NodeRT) and `launch` is not set, it defaults to `background` as a _workaround_ for the `activated` event to trigger in _most_ cases (this is for your own convenience).
    
    ⚠ When using a Win32 AUMID with foreground and background type.<br/>
    If you wish to get any argument back from the `launch` option and/or get a valid toast activation ("activated" event): you will need an installed and registered COM server (CLSID).<br/>
    For example in innosetup this can be done with `AppUserModelToastActivatorCLSID`. Please refer to your framework, installer, setup, etc...
  
  + `launch?: string` (None)
  
    Protocol to launch (URI scheme) or argument to pass when the user click on the toast.<br />
    If none (default) click will just dismiss the notification.

    ℹ️ When using PowerShell ≥ 7.1 or NodeRT an event will be emitted when the user click on the toast ("activated" event) or when the toast is dismissed.<br />
    There are various reasons that can prevent the "activated" event to trigger. See `type` above.

    Example of protocol type action button to open up Windows 10's maps app with a pre-populated search field set to "sushi":
  
    ```js
      import { Toast } from "powertoast";

      const toast = new Toast({
        message: "Sushi",
        activation: "bingmaps:?q=sushi"
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
        activation: "https://www.google.com"
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
    ```
      
      In Electron main process, make your app a single instance with `app.requestSingleInstanceLock()` and use the second-instance event to parse the new argument(s).
      
    ```js
      if (app.requestSingleInstanceLock() !== true) app.exit();
      app.on("second-instance", (event, argv, cwd) => {  
        console.log(argv);
        //[...,"electronApp:helloworld"]
      });
    ```

  + `pfn?: string` (None)

    Set the target PFN if you are using `protocol` type activation, so that regardless of whether multiple apps are registered to handle the same protocol URI, your desired app will always be launched.
  
## `button?: object[]` (None)

  Array of buttons to add to your toast. You can only have up to 5 buttons. After the 5th they will be ignored.<br/>
  A button is represented as the following object:
  
  ```ts
  {
    text?: string,
    activation?: string | {
      type?: string,
      launch?: string,
      pfn?: string,
      behavior?: string,
    },
    icon?: string,
    contextMenu?: string,
    tooltip?: string,
    style?: string,
    id?: string
  }
  ```
  
  + `text?: string` (None)
  
    The text of your button if any.

  + `activation?: string | object`
  
    💡Same as the toast `activation` option above; But with an additional option:
    
    - `behavior?:string` (None) | ≥ Win10 (Fall Creators Update)
    
      Set it to `pendingUpdate` to create multi-step interactions in your toast notifications. For example you can create a series of toasts where the subsequent toasts depend on responses from the previous toasts. 
    
      ⚠️ The button `activation.type` must be set to `background` to use `pendingUpdate`

  + `icon?: string` (None)

    You can add icons to your buttons.<br />
    These icons are white transparent 16x16 pixel images at 100% scaling, and should have no padding included in the image itself.<br />
    In order to transforms the style of your buttons into "icon buttons" you have to provide icons for **ALL** of your buttons in the notification.
  
    <p align="center">
      <img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/btn-icon.png">
    </p>

  + `contextMenu?: boolean` (false) | ≥ Win10 (Anniversary Update)
  
    Transform the button into an additional context menu action to the existing context menu that appears when the user right click a toast notification within the notification center.
    
    ℹ️ This menu only appears when right clicked from the notification center. It does not appear when right clicking a toast popup banner. On older version these additional context menu actions will simply appear as normal buttons on your toast. Additional context menu items contribute to the total limit of 5 buttons on a toast.
  
  + `tooltip?: string` (None) | ≥ Win11
  
    Add a tooltip to your button if it has no content (text).
    
    ℹ️ Windows Narrator will read the content if present, otherwise the tooltip.
  
  + `style?: string` (None) | ≥ Win11

    Change the background color of a button. Use `success` for green and `critical` for red.

  + `id?: string` (None)
  
    Reference the id of an input field such as a text box or selection to map it to this button.

    <p align="center">
      <img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/button.png">
    </p>
      
    ```js
      import { Toast } from "powertoast";

      const toast = new Toast({
        title: "Browser",
        message: "Choose your favorite",
        button: [
          { 
            text: "Firefox", 
            activation:"https://www.mozilla.org/en/firefox/new/" 
          },
          { 
            text: "Chrome", 
            activation:"https://www.google.com/chrome/" 
          }
        ]
      });
      
      toast.on("activated", (event) => {
        console.log("clicked");
        console.log(url: event)
      })
      .on("dismissed", (reason) => {
        console.log("dismissed:", reason);
      });
      
      toast.show()
      .catch(console.error);
    ```
 
## `input?: object[]` (None)

  Input is a text box where user can input some data, eg: a quick reply text box.

  ℹ️ Inputs are only visible when the notification is expanded.

  ```ts
  {
    id: string,
    title?: string,
    placeholder?: string,
    value?: string
  }
  ```

  + `id: string`

    The id of the input. You can use this value to map it to a button. 
    
    For example, to enable a quick reply text box add a text input and a button, and reference the id of the text input field so that the button is displayed next to the input field.

  + `title?: string` (None)

    Text shown above the text box.

  + `placeholder?: string` (None)
    
    A short hint displayed in the input field before the user enters a value to describe the expected value.
    
  + `value?: string`  (None)
    
    Set a default value. The default value is shown inside the textbox.
  
## `select?: object[]` (None)

  In addition to text boxes, you can also use a selection menu.
  
  ```ts
  {
    id: string,
    title?: string,
    items: [
      {
        id: string,
        text: string,
        default?: boolean
      }
    ]
  }
  ```

  + `id: string`

    The id of the input. You can use this value to map it to a button. 
    
  + `title?: string` (None)

    Text shown above the selection.
    
  + `items: object[]`
    
    List of selection items.
    
      - `id: string`
      
        The id of the selection
      
      - `text: string`
      
        The text of the selection
        
      - `default?: boolean` (false)
      
        If this item should be the default. There can be only one default; in case of multiple the first one will be used.
 
## `progress:? object` (None) | ≥ Win10 (Creators Update)
  
   Add a progress bar inside your toast notification allowing you to convey the status of long-running operations.
   
   ```ts
   {
      title?: string,
      value?: number | string,
      valueOverride?: string,
      status: string
   }
   ```
  
  + `title?: string` (None)
  
  Text shown above the progress bar.
  
  + `value?: number` (indeterminate)
  
  The specific percent of the bar filled: 0-100 (%).<br />
  If no specific value, animated dots will indicate an operation is occurring (indeterminate).
  
  + `valueOverride?: string` (None)
  
  Set an optional string to be displayed instead of the default percentage string. If this isn't provided, something like "70%" will be displayed.
  
  + `status?: string` (None)
  
  Set a status string which is displayed underneath the progress bar on the left. This string should reflect the status of the operation, like "Downloading..." or "Installing...".
  
  <p align="center">
    <img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/progress.png">
  </p>
    
  ```js
  import { Toast } from "powertoast";

  const toast = new Toast({
    title: "Downloading your weekly playlist...",
    progress: {
      title: "Weekly playlist",
      value: 60,
      valueOverride: "15/26 songs",
      status: "Downloading..."
    }
  });
    
  toast.show()
  .catch(console.error);
  ```

## `group:? object` (None) | ≥ Win10 (Creators Update)

  You can group notifications under a common header within notification center.
  
  ```ts
  {
    id: string,
    title: string,
    activation?: string | {
      type?: string,
      launch?: string,
      pfn?: string
    }
  }
  ```

  + `id: string`
  
    Use the same header id string to unify them under the same header.
    
  + `title: string`
  
    Title of the header, title can be different and will be shown above the toast. Title from the most recent notification within a group is used in notification center, 
    if that notification gets removed, then the title falls back to the next most recent notification. 
    
  +  `activation?: string | object`
  
    💡Same as the toast `activation` option above.
    
  <p align="center">
    <img src="https://github.com/xan105/node-powertoast/raw/master/screenshot/group.png">
  </p>

## `uniqueID?: string` (random id)
    
   Unique toast id. 
   
   ℹ️ You can replace a notification by sending a new toast with the same uniqueID.<br/>
   This is useful when using a progress bar or correcting/updating the information on a toast.<br/>
   And you don't want to end up with a flood of similar toasts in the notification center.<br/>
   However this is not really suitable for information that frequently changes in a short period of time (like a download progress for example)
   or subtle changes to your toast content, like changing 50% to 65%.
   
## `sequenceNumber:? number` (0)

  Provide sequence number to prevent out-of-order updates, or assign 0 to indicate "always update".<br/>
  A higher sequence number indicates a newer toast.<br/>
  The sequence number may helps to ensure that toasts will not be displayed in a manner that may confuse when updating/correcting.
    
## `time?: number` | (Current unix time)

  Unix epoch time in seconds; Current time if not specified.<br/>
  
  ℹ️ By default, the timestamp visible within notification center is set to the time that the notification was sent. But Microsoft recommends that most apps specify a custom timestamp;
  so that the timestamp represents the time the message/information/content was actually created, rather than the time that the notification was sent.<br/>
  This also ensures that your notifications appear in the correct order within notification center (which are sorted by time).
  
## `expiration?: number` | (None)

  Set the amount of seconds after which the toast is no longer considered current or valid and should not be displayed.

## `scenario?: string` (default)

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

## `longTime?: boolean` (false) | _Deprecated_

  Set it to `true` to increase the time the toast should show up for.
  
  Most of the time "short" (false) is the most appropriate, and Microsoft recommends not using "long" (true).<br />
  This is only here for specific scenarios and app compatibility with Windows 8.
  
  ℹ️ "Long" is around ~ 25sec and "Short" is the user defined value in `Windows settings > Ease of Access > Display > Show notification for ...`
  which is available in the registry at `HKCU\Control Panel\Accessibility` -> `MessageDuration`::DWORD (Not recommended to directly modify said registry value).
  
  Available: 5sec (default), 7sec, 15sec, 30sec, 1min, 5min