const twilio = require("twilio");
const client = twilio("AC869efe3b64b579787b1c21d7718c4ca4", "8853f848903b617e5a6405bb425ea11b");
client.messages.create({
  body: "Test",
  from: "whatsapp:+17372508034",
  to: "whatsapp:+213698644333"
}).then(m => console.log(m.sid)).catch(e => console.error("TWILIO_ERROR:", e.message));
