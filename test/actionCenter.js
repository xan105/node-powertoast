import { getHistory } from "../lib/index.js";

const appID = "Microsoft.XboxApp_8wekyb3d8bbwe!Microsoft.XboxApp";
console.log( await getHistory(appID) );