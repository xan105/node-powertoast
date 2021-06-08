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

const store = {
  win10: "Microsoft.WindowsStore_8wekyb3d8bbwe!App",
  win8: "winstore_cw5n1h2txyewy!Windows.Store"
};

const scenarios = ["default", "alarm", "reminder", "incomingCall"];

function normalize(option, legacy) {
  
  let options = {
    appID: option.appID || ( legacy ? store.win8 : store.win10 ),
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
    scenario: scenarios.includes(option.scenario) ? option.scenario : scenarios[0],
  };

  if (option.progress) {
    options.progress = {
      header: option.progress.header || "",
      percent: (option.progress.percent || option.progress.percent === 0) && 
                option.progress.percent >= 0 && 
                option.progress.percent <= 100 ? (option.progress.percent / 100).toFixed(2) : "indeterminate",
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
    if (option.timeStamp) options.timeStamp = new Date(+option.timeStamp * 1000).toISOString();
    else options.timeStamp = "";
  } catch { options.timeStamp = "" }
  
  return options; 
}

export { normalize };