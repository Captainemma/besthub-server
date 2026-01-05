const paypal = require("paypal-rest-sdk");

paypal.configure({
  mode: process.env.PAYPAL_MODE || "sandbox", // fallback to sandbox
  client_id: process.env.PAYPAL_CLIENT_ID || "Abcd1234EFGH5678ijkl9012MNOP3456qrst7890uvwxYZ",
  client_secret: process.env.PAYPAL_CLIENT_SECRET || "EFGH1234ijkl5678MNOP9012qrst3456uvwx7890AbcdYZ",
});

module.exports = paypal;
