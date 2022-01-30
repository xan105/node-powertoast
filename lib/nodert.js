/*
MIT License

Copyright (c) 2019-2022 Anthony Beaumont

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

async function load(version = "rs4"){

  let winRT;

  try {
    winRT = {
      xml: (await import(`@nodert-win10-${version}/windows.data.xml.dom`)).default,
      notifications: (await import(`@nodert-win10-${version}/windows.ui.notifications`)).default,
    };
    if (!winRT.xml || !winRT.notifications) winRT = null;
  } catch {
    winRT = null;
  }
  
  return winRT;
}

async function loadWinRT(){
  
  const versions = ["rs4", "20h1"];

  let winRT;
  
  for (const version of versions){
    winRT = await load(version);
    if (winRT) break;
  }

  return winRT;
}

export { loadWinRT };