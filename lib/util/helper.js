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

import { platform, release } from "node:os";
import { resolve, isAbsolute } from "node:path";
import { Failure } from "./error.js";

function getVersion () {
  const version = release().split(".");
  return { major: +version[0], minor: +version[1], build: +version[2] };
}

function compatibility(){
  
  if (platform() !== "win32") throw new Failure("Only available on Windows","ERR_UNSUPPORTED");
  
  const version = getVersion();
  
  if (version.major == 6 && (version.minor == 3 || version.minor == 2)) return true; //Windows 8 && Windows 8.1
  else if (version.major <= 6) throw new Failure("Windows too old","ERR_UNSUPPORTED"); //Windows 7 and below
  else return false;
}

function resolvePath = (filePath) => {
  return isAbsolute(filePath) ? filePath : resolve(filePath);
}

function imgResolve(dest = "") {
  if (!dest.startsWith("http://") && !dest.startsWith("https://") && dest != "") dest = resolvePath(dest);
  return dest;
}

export const rng = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export { compatibility, imgResolve };
