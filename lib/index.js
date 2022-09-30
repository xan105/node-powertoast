/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

export { notify as default } from "./shim.js"; //deprecation warning
export * from "./toast.js";
export * from "./notificationCenter.js";
export { makeXML } from "./xml.js";