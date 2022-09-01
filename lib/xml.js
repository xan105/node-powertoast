/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

import { resolve } from "@xan105/fs/path";
import { normalize } from "./option.js";

function imgResolve(imgPath) { //Resolve filePath only
  return imgPath.startsWith("http://") || 
         imgPath.startsWith("https://") || 
         imgPath === "" ? imgPath : "file:///" + resolve(imgPath);
}

function toastXmlString(options) {

  let template = "<toast "+ 
                 `displayTimestamp="${new Date(options.time).toISOString()}" ` + 
                 `activationType="${options.activationType}" ` + 
                 `scenario="${options.scenario}" ` + 
                 `launch="${options.onClick}" ` + 
                 `duration="${options.longTime ? 'long' : 'short'}" `+
                 ">";
  
  //Toast header
  if (options.group) {
    template += "<header " + 
                 `id="${options.group.id}" ` +
                 `title="${options.group.title}" ` + 
                 `arguments="" `+
                 //`activationType="protocol" `+
                 "/>";
  }
  
  //Visual
  template += `<visual><binding template="ToastGeneric">` +
              `<image placement="appLogoOverride" src="${imgResolve(options.icon)}" hint-crop="${options.cropIcon ? 'circle' : 'none'}"/>` + 
              `<image placement="hero" src="${imgResolve(options.heroImg)}"/>` + 
              `<image src="${imgResolve(options.inlineImg)}"/>` +
              `<text><![CDATA[${options.title}]]></text>` +
              `<text><![CDATA[${options.message}]]></text>` +
              `<text placement="attribution"><![CDATA[${options.attribution}]]></text>`
              
  //Progress bar
  if (options.progress) {
    template += "<progress " + 
                `title="${options.progress.title}" ` + 
                `value="${options.progress.value}" ` + 
                `valueStringOverride="${options.progress.valueOverride}" ` + 
                `status="${options.progress.status}" ` + 
                "/>";
  }
  template += "</binding></visual>";
            
  //Buttons
  template += "<actions>";
          
  for (const [i, button ] of options.button.entries())          
  {
    if ( i > 4) break; //You can only have up to 5 buttons; Ignoring after max button count reached 
    template += "<action " +
    `placement="${button.contextMenu ? 'contextMenu' : 'none'}" ` +
    `content="${button.text}" ` +
    `hint-toolTip="${button.tooltip}" ` + //win11
    `hint-buttonStyle="${button.style}" ` + //win11
    `imageUri="${imgResolve(button.icon)}" ` +
    `activationType="${button.activationType}" ` +
    `arguments="${button.onClick}" ` +
    "/>";
  } 
  template += "</actions>";
  
  //Audio     
  template += "<audio "+ 
              `silent="${options.silent}" ` +
              `loop="${options.loopAudio}" ` +
              `src="${options.audio}"` +
              "/>";
  
  //EOF
  template += "</toast>";

  return template;
}

function makeXML(option = {}){
  const options = normalize(option);
  return toastXmlString(options);
}

export { toastXmlString, makeXML };