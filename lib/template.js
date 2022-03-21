/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

import * as ps1 from "./template/ps1.js";
import * as toastXML from "./template/xml.js";

function generate(options, powerShell, legacy) {

  let template = "";
  
  if (powerShell){
    template += ps1.header(options.appID);
    template += legacy ? ps1.legacy(options) : ps1.body(options);
  }
  else {
    template += legacy ? toastXML.legacy(options) : toastXML.body(options);
  }
  
  return template;
}

import { normalize } from "./option.js";

function makeXML(option = {}){

  const legacy = option.legacy || false;
  delete option.legacy;
  
  const options = normalize(option, legacy);
  const template = legacy ? toastXML.legacy(options) : toastXML.body(options);
  return template;
}

export { generate, makeXML };