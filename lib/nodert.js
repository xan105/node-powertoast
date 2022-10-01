/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

async function load(version){

  let winRT;

  try {
    winRT = {
      xml: (await import(`@nodert-${version}/windows.data.xml.dom`)).default,
      notifications: (await import(`@nodert-${version}/windows.ui.notifications`)).default,
    };
    if (!winRT.xml || !winRT.notifications) winRT = null;
  } catch {
    winRT = null;
  }
  
  return winRT;
}

async function loadWinRT(){
  
  const versions = [
    "win10-rs4", //official NodeRT
    "win10-20h1",
    "win11", //21H2
    "win11-22h2"
  ];

  let winRT;
  
  for (const version of versions){
    winRT = await load(version);
    if (winRT) break;
  }

  return winRT;
}

export { loadWinRT };