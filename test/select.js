import { Toast } from "../lib/index.js";

const toast = new Toast({
  title: "4th coffee?",
  message: "When do you plan to come in tomorrow?",
  select:[
    {
      id: "time",
      title: "Select an item:",
      items: [
        { id: "breakfast", text: "Breakfast" },
        { id: "dinner", text: "Dinner" },
        { id: "lunch", text: "Lunch", default: true }
      ]
    }
  ],
  button: [
    { 
      text: "Reply",
      activation:"foo:bar",
    },
    { 
      text: "Call Restaurant",
      activation:"foo:bar",
    }
  ]
});
  
toast.on("activated", (event, input) => {
  console.log(event); //foo:bar
  console.log(input); //{ time: lunch}
})
.on("dismissed", (reason) => {
  console.log("dismissed:", reason);
});
  
toast.show({ keepalive: 15 })
.catch(console.error);