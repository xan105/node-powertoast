import { getHistory } from "../lib/index.js";

const appID = "Microsoft.XboxGamingOverlay_8wekyb3d8bbwe!App";
console.log( await getHistory(appID, true) );