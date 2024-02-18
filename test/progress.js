import { Toast } from "../lib/index.js";

const toast = new Toast({
  title: "Downloading your weekly playlist...",
  progress: {
    title: "Weekly playlist",
    value: 60,
    valueOverride: "15/26 songs",
    status: "Downloading..."
  }
});
  
toast.show({ keepalive: 15 })
.catch(console.error);