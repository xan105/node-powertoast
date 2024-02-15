import { Failure, match, errorLookup } from "@xan105/error";
import { nodert as winRT } from "../optional/dependencies.js";

function notify(xmlString, { keepalive }){

    const xml = new winRT.xml.XmlDocument();
    match(xml.loadXml.bind(xml), [xmlString], {
      Err: (err) => {
        throw new Failure("Failed to parse/load XML template", { 
          code: "ERR_NODERT", 
          cause: err,
          info: errorLookup(err.HRESULT)
        });
      }
    });

    const toast = new winRT.notifications.ToastNotification(xml);
    if (!toast) throw new Failure("Failed to create a new 'ToastNotification'","ERR_NODERT");
    
    const dataDictionary = new winRT.notifications.NotificationData();
    if(dataDictionary){
      toast.data = dataDictionary;
      toast.data.sequenceNumber = this.options.sequenceNumber;
    }
    
    toast.suppressPopup = this.options.hide;
    toast.tag = toast.group = this.options.uniqueID;
    if (this.options.expiration) toast.expiration = new Date(this.options.expiration).toISOString();

    const toaster = winRT.notifications.ToastNotificationManager.createToastNotifier(this.options.aumid);
    if (!toaster) throw new Failure("Failed to create a new 'ToastNotifier'","ERR_NODERT");

    //NodeRT does not keep the event loop alive
    //Keep it alive for set amount of time
    const timer = setTimeout(() => {}, 
      this.eventNames().length > 0 ? 
      keepalive * 1000 : 
      100 //Better safe than sorry
    );
    
    if (this.eventNames().length > 0){
      toast.on("activated", (_, event) => {

        clearTimeout(timer);
        const eventArgs = winRT.notifications.ToastActivatedEventArgs.castFrom(event); //cast to ToastActivatedEventArgs (OpaqueWrapper)
        const values = Object.create(null);
        
        if (
          winRT.collections && winRT.foundation && //Only needed for user input; Just skip if failed to load
          eventArgs.userInput // ≥ win10 1903 therefore when using nodert-win10-rs4 (1803) this will be undefined
        ){ 
          const valueSet = winRT.collections.ValueSet.castFrom(eventArgs.userInput); //cast to ValueSet (OpaqueWrapper)
          const iterator = valueSet.first(); //returns an iterator to enumerate the items in the value set
          while(iterator.hasCurrent === true) //return false when at the end of the collection
          {
            const value = winRT.foundation.IPropertyValue.castFrom(iterator.current.value); //cast to IPropertyValue (OpaqueWrapper)
            values[iterator.current.key] = value.getString(); 
            iterator.moveNext();
          }
        }
        
        this.emit("activated", eventArgs.arguments, values); 
      });

      toast.on("dismissed", (_, { reason }) => {
        clearTimeout(timer);
        const reasons = {
          0: "UserCanceled", //User dismissed the toast
          1: "ApplicationHidden", //App explicitly hid the toast by calling the ToastNotifier.hide method
          2: "TimedOut" //Toast had been shown for the maximum allowed time and was faded out
        };
        this.emit("dismissed", reasons[reason] ?? `Dismissed: ${reason}`);
      });

      toast.on("failed", (_, { error }) => {
        clearTimeout(timer);
        throw new Failure(...errorLookup(error.ErrorCode));
      });
    }

    match(toaster.show.bind(toaster), [toast], {
      Err: (err)=>{
        throw new Failure("Failed to dispatch notification", { 
          code: "ERR_NODERT", 
          cause: err,
          info: errorLookup(err.HRESULT)
        });  
      }
    });
}

export { notify };