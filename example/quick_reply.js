import { Toast } from "../lib/toast.js";

const toast = new Toast({
  title: "Andrew Bares",
  message: "Shall we meet up at 8?",
  icon: "https://picsum.photos/48?image=883",
  cropIcon: true,
  input:[
    {
      id: "reply",
      title: "Answer:",
      placeholder: "Type a reply"
    }
  ],
  button: [
    { 
      text: "Send",
      activation:"msteams:threadId=9218",
      id: "reply"
    }
  ]
});
  
toast.on("activated", (event, input) => {
  console.log(event); //msteams:threadId=9218
  console.log(input); //{ reply: "bla bla bla" }
})
.on("dismissed", (reason) => {
  console.log("dismissed:", reason);
});
  
toast.show({ keepalive: 15 })
.catch(console.error);