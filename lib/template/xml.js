/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

import { resolve } from "@xan105/fs/path";

function imgResolve(dest = "") {
  if (!dest.startsWith("http://") && !dest.startsWith("https://") && dest != "") dest = resolve(dest);
  return dest;
}

function body(options) {

  let template = `<toast ${(options.timeStamp) ? `displayTimestamp="${options.timeStamp}" `:``}activationType="${options.activationType}" scenario="${options.scenario}" launch="${options.onClick}" duration="${options.longTime ? "Long" : "Short"}">`;
  
  if (options.group && options.group.id && options.group.title) template += `<header id="${options.group.id}" title="${options.group.title}" arguments="" />`;
  
  template += `<visual><binding template="ToastGeneric">` + 
              `<image placement="appLogoOverride" src="${imgResolve(options.icon)}" hint-crop="${options.cropIcon ? "circle" : "none"}"/>` + 
              `<image placement="hero" src="${imgResolve(options.headerImg)}"/>` +
              `<text><![CDATA[${options.title}]]></text>` +
              `<text><![CDATA[${options.message}]]></text>` +
              `<text placement="attribution"><![CDATA[${options.attribution}]]></text>`+
              `<image src="${imgResolve(options.footerImg)}" />`;
              
  if (options.progress) template += `<progress title="${options.progress.header}" value="${options.progress.percent}" valueStringOverride="${options.progress.custom}" status="${options.progress.footer}"/>`;
  
  template += `</binding></visual><actions>`;
                       
  for (const i in options.button) 
  {
    if ( i > 4) break; //You can only have up to 5 buttons; Ignoring after max button count reached 
    try{
      if (options.button[i].text && options.button[i].onClick) {
        template += `<action content="${options.button[i].text}" placement="${(options.button[i].contextMenu === true) ? 'contextMenu' : ''}" imageUri="${imgResolve(options.button[i].icon)}" arguments="${options.button[i].onClick}" activationType="${options.button[i].activationType}"/>`;
      }
    }catch{ continue } 
  } 
        
  template += `</actions><audio silent="${options.silent}" ${(options.audio) ? `src="${options.audio}"` : ""}/></toast>`;

  return template;

}

function legacy(options) {

  //Progress "polify"
  if (options.progress && options.progress.percent && options.progress.percent !== "indeterminate") 
    options.message += `\n[ ${(options.progress.custom) ? options.progress.custom : `${(options.progress.percent * 100).toFixed(0)} / 100`} ]`;

  const template = `<toast duration="${options.longTime ? "Long" : "Short"}"><visual><binding template="ToastImageAndText02">` +
                   `<image id="1" src="${imgResolve(options.icon)}" alt="image1"/>` +
                   `<text id="1">${options.title}</text>` +
                   `<text id="2">${options.message}</text>` + 
                   `</binding></visual><audio silent="${options.silent}" ${(options.audio) ? `src="${options.audio}"` : ""}/></toast>`;

  return template;

}

export { body, legacy };