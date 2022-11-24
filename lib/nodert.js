/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

import { asBoolean } from "@xan105/is/opt";

async function load(scope, namespace){
  try{
    const module = await import(`${scope}/${namespace}`);

    console.log(scope, namespace);
    return module.default || module; 
  }catch{
    return null;
  }
}

async function loadWinRT(option = {}){
  
  const options = {
    includeExperimental: asBoolean(option.includeExperimental) ?? false,
    allowPrebuild: asBoolean(option.allowPrebuild) ?? true
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
  
  const namespaces = [
    { name: "xml", namespace: "windows.data.xml.dom" },
    { name: "notifications", namespace: "windows.ui.notifications" },
    { name: "foundation", namespace: "windows.foundation" },
    { name: "collections", namespace: "windows.foundation.collections" },
  ];

  const versions = options.includeExperimental ? scopes.community.concat(scopes.official) : scopes.official;
  
  let winRT = {};

  for (const { name, namespace } of namespaces)
  {
    if (options.allowPrebuild)
      winRT[name] = await load("@xan105/nodert", namespace.replace("windows.","").replaceAll(".","/"));
    
    if (winRT[name]) continue;
    
    for (const version of versions)
    {
      winRT[name] = await load("@nodert-" + version, namespace);
      if(winRT[name]) break;
    }
  }

  if (!winRT.xml || !winRT.notifications) winRT = null;

  return winRT;
}

export { loadWinRT };