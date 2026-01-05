const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

// Initialize Paystack with your secret key
const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

module.exports = paystack;
