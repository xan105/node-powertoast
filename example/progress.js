import { Toast } from "../lib/toast.js";

const toast = new Toast({
  title: "Downloading your weekly playlist...",
  progress: {
    title: "Weekly playlist",
    value: 60,
    valueOverride: "15/26 songs",
    status: "Downloading..."
  }
});
  
toast.on("activated", () => {
  console.log("clicked!");
})
.on("dismissed", (reason) => {
  console.log("dismissed:", reason);
});
  
toast.show({ keepalive: 15 })
.catch(console.error);