// BhavAura Easebuzz Payment Gateway Backend
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import crypto from "crypto";
import axios from "axios";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ======= Your Easebuzz Credentials =======
const MERCHANT_KEY = "I6CCA093ZK";
const SALT = "I4JXPNCN8O";
const EASEBUZZ_PAYMENT_URL = "https://pay.easebuzz.in/payment/initiateLink"; // Production URL

// ======= Generate Easebuzz Hash =======
function generateHash({ key, txnid, amount, productinfo, firstname, email }) {
  // Easebuzz hash format: key|txnid|amount|productinfo|firstname|email|||||||||||salt
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${SALT}`;
  return crypto.createHash("sha512").update(hashString).digest("hex");
}

// ======= Create Payment Endpoint =======
app.post("/create-payment", async (req, res) => {
  try {
    const { name, email, phone, amount } = req.body;

    // Generate unique transaction ID
    const txnid = "TXN" + Date.now();
    const productinfo = "BhavAura Order";

    // Generate hash for security
    const hash = generateHash({
      key: MERCHANT_KEY,
      txnid,
      amount,
      productinfo,
      firstname: name,
      email,
    });

    // Prepare payload to Easebuzz
    const payload = {
      key: MERCHANT_KEY,
      txnid,
      amount,
      productinfo,
      firstname: name,
      email,
      phone,
      surl: "https://www.bhavaura.com/checkout-success",
      furl: "https://www.bhavaura.com/checkout-failed",
      hash: hash,
    };

    // Call Easebuzz API
    const response = await axios.post(EASEBUZZ_PAYMENT_URL, payload, {
      headers: { "Content-Type": "application/json" },
    });

    // Return payment URL to frontend
    res.json({
      payment_url: response.data.data ? response.data.data : response.data,
    });
  } catch (error) {
    console.error("Easebuzz API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Payment creation failed" });
  }
});

// ======= Test Endpoint =======
app.get("/", (req, res) => res.send("✅ BhavAura Payment Server is running..."));

// ======= Start Server =======
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
