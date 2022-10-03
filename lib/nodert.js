/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

import { asBoolean } from "@xan105/is/opt";

async function load(version){

  let winRT;

  try {
    winRT = {
      xml: (await import(`@nodert-${version}/windows.data.xml.dom`)).default,
      notifications: (await import(`@nodert-${version}/windows.ui.notifications`)).default
    };
    if (!winRT.xml || !winRT.notifications) winRT = null;
  } catch {
    winRT = null;
  }
  
  if(winRT){
    //Only needed for user input; Shouldn't disable winRT if failed to load
    try{
      winRT.collections = (await import(`@nodert-${version}/windows.foundation.collections`)).default;
    } catch { /*Do Nothing*/ }
    try{
      winRT.foundation = (await import(`@nodert-${version}/windows.foundation`)).default; //build crash ?
    } catch { /*Do Nothing*/ }
  }
  
  return winRT;
}

async function loadWinRT(option = {}){
  
  const options = {
    includeExperimental: asBoolean(option.includeExperimental) ?? false,
    sequentialLoading: asBoolean(option.sequentialLoading) ?? true
  };
  
  const scopes = {
    community: [
      "win11-22h2",
      "win11",
      "win10-21h1",
      "win10-20h1",
      "win10-19h1"
    ],
    official: [
      "win10-rs4",
      "win10-rs3",
      "win10-cu",
      "win10-au",
      "win10"
    ]
  };

  const versions = options.includeExperimental ? scopes.community.concat(scopes.official) : scopes.official;

  let winRT;

  if(options.sequentialLoading){
    for (const version of versions){
      winRT = await load(version);
      if (winRT) break;
    }
  } else {
    //This is actually way slower 🤔 (measured with process.hrtime)
    const promises = versions.map(version => new Promise((resolve, reject) => load(version).then(module => module ? resolve(module) : reject())));
    winRT = await Promise.any(promises).catch(()=>{});
  }

  return winRT;
}

export { loadWinRT };