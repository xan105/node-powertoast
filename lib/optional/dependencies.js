/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

import { asBoolean } from "@xan105/is/opt";

async function load(scope, namespace){
  try{
    const module = await import(`${scope}/${namespace}`);
    return module.default || module; 
  }catch{
    return null;
  }
}

async function loadNodeRT(option = {}){
  
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
    official:
    [
      "win10-rs4",
      "win10-rs3",
      "win10-cu",
      "win10-au",
      "win10"
    ]
  };
  
  const namespaces = {
    xml: {
      name: "windows.data.xml.dom", features: ["XmlDocument"]
    },
    notifications: {
      name: "windows.ui.notifications", features: ["ToastNotification", "NotificationData", "ToastNotificationManager"]
    },
    foundation: {
      name: "windows.foundation", features: ["IPropertyValue"]
    },
    collections: {
      name: "windows.foundation.collections", features: ["ValueSet"]
    },
  };

  const versions = options.includeExperimental ? scopes.community.concat(scopes.official) : scopes.official;
  
  let nodert = Object.create(null);

  for (const [ name, namespace ] of Object.entries(namespaces))
  {
    if (options.allowPrebuild){
      nodert[name] = await load("@xan105/nodert", namespace.name.replace("windows.","").replaceAll(".","/"));
      for (const feature of namespace.features)
      {
        if(!nodert[name]?.[feature]) {
          nodert[name] = null;
          break;
        }
      }
      if (nodert[name]) continue;
    }
    
    for (const version of versions)
    {
      nodert[name] = await load("@nodert-" + version, namespace.name);
      for (const feature of namespace.features)
      {
        if(!nodert[name]?.[feature]) {
          nodert[name] = null;
          break;
        }
      }
      if(nodert[name]) break;
    } 
  }

  //Mandatory namespace
  if (!nodert.xml || !nodert.notifications) nodert = null;
  
  return nodert;
}

export const nodert = await loadNodeRT({
  includeExperimental: true,
  allowPrebuild: true
});