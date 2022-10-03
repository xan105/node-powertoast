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
         imgPath === "" ? imgPath : resolve(imgPath);
}

function addAttributeOrTrim(name, value){
  return value ? `${name}="${value}" ` : "";
}

function toastXmlString(options) {

  let template = "<toast "+ 
                 `displayTimestamp="${new Date(options.time).toISOString()}" ` + 
                 `scenario="${options.scenario}" ` + 
                 `duration="${options.longTime ? 'long' : 'short'}" `+
                 `activationType="${options.activationType}" ` +
                 addAttributeOrTrim("launch", options.onClick) +
                 addAttributeOrTrim("ProtocolActivationTargetApplicationPfn", options.activationPfn) +
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
                `value="${options.progress.value}" ` +
                addAttributeOrTrim("title", options.progress.title) +
                addAttributeOrTrim("valueStringOverride", options.progress.valueOverride) +
                addAttributeOrTrim("status", options.progress.status) +
                "/>";
  }
  template += "</binding></visual>";
            
  //Actions
  template += "<actions>";     
  //Inputs
  for (const [i, input] of [...options.input, ...options.select].entries())
  {
    if ( i > 4) break; //You can only have up to 5 inputs; Ignoring after max count reached
    
    template += "<input " +
                `id="${input.id}" ` + //⚠️ required
                addAttributeOrTrim("title", input.title) +
                addAttributeOrTrim("defaultInput", input.default);

    if(input.items)
    {
      template += `type="selection" >`;
      for (const [j, select] of input.items.entries())
      {
        if ( j > 4) break; //You can only have up to 5 select; Ignoring after max count reached
        template += "<selection " + 
                    `id="${select.id}" ` + //⚠️ required
                    `content="${select.text}" ` + //⚠️ required
                    "/>";
      }
      template += "</input>";
    } 
    else 
    {
      template += `type="text" ` +
                  addAttributeOrTrim("placeHolderContent", input.placeholder) +
                  "/>";
    }
  }
  //Buttons
  for (const [i, button ] of Array.prototype.entries.call(options.button))          
  {
    if ( i > 4) break; //You can only have up to 5 buttons; Ignoring after max count reached
    template += "<action " +
    `content="${button.text}" ` + //⚠️ required
    `arguments="${button.onClick}" ` + //⚠️ required
    `activationType="${button.activationType}" ` +
    `afterActivationBehavior="${button.activationBehavior}" ` +
    addAttributeOrTrim("ProtocolActivationTargetApplicationPfn", button.activationPfn);
    
    if(button.contextMenu){
      template += `placement="contextMenu" `;
    } else {
      template += addAttributeOrTrim("imageUri", imgResolve(button.icon)) +
                  addAttributeOrTrim("hint-inputId", button.id) + //corresponding input ID eg: quick reply
                  addAttributeOrTrim("hint-toolTip", button.tooltip) + //win11
                  addAttributeOrTrim("hint-buttonStyle", button.style); //win11
    }
    template += "/>";
  } 
  template += "</actions>";
  
  //Audio     
  template += "<audio "+ 
              `silent="${options.silent}" ` +
              `loop="${options.loopAudio}" ` +
              addAttributeOrTrim("src", options.audio) + 
              "/>";
  
  //EOF
  template += "</toast>";

  console.log(template);

  return template;
}

function makeXML(option = {}){
  const options = normalize(option);
  return toastXmlString(options);
}

export { toastXmlString, makeXML };