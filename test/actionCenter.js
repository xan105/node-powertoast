import toast, { remove, getHistory } from "../lib/index.js";

(async()=>{

 const appID = "Microsoft.XboxApp_8wekyb3d8bbwe!Microsoft.XboxApp";

 await toast({appID: appID,title: "Dummy1",message: "Hello World",uniqueID: "id0", hide: true});
 await toast({appID: appID,title: "Dummy2",message: "Hello World",uniqueID: "id1", hide: true});
 
 await new Promise(resolve => setTimeout(resolve, 1 * 1000));
 console.log( await getHistory(appID) );
 
 //await remove(appID);
 await remove(appID,"id0");
 //await remove(appID, [null,"id0"]);
 //await remove(appID, ["id0","id0"]);

})().catch(console.error);