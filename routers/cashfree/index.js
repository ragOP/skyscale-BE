const axios = require("axios");

const MAIN_URL = "https://www.thesignaturestudio.in";
const CASHFREE_URL =
  process.env.CASHFREE_URL || "https://sandbox.cashfree.com/pg";

const createCashfreeSession = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      amount,
      profession,
      remarks,
      additionalProducts,
      orderType = "normal",
      url,
      quantity = 1,
    } = req.body;

    const orderId = `order_${Date.now()}`;

    const cartUrl = `${MAIN_URL}/confirmation`;

    const finalUrl = url ? url : cartUrl;

    console.log("CASHFREE_URL:", CASHFREE_URL);
    console.log(
      "CASHFREE_CLIENT_ID:",
      process.env.CASHFREE_CLIENT_ID ? "Set" : "Not set"
    );
    console.log(
      "CASHFREE_SECRET_KEY:",
      process.env.CASHFREE_SECRET_KEY ? "Set" : "Not set"
    );
    console.log("Order ID:", orderId);

    let returnUrl = `${finalUrl}?orderId=${orderId}&orderType=${orderType}`;

    const requestData = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: "cust_001",
        customer_name: fullName || "Customer",
        customer_email: email || "test@example.com",
        customer_phone: phoneNumber || "9999999999",
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: `${MAIN_URL}/api/payment/webhook`,
      },
      order_note: remarks,
      cart_details: {
        cart_items:
          additionalProducts && additionalProducts.length > 0
            ? additionalProducts.map((product, index) => ({
                item_id: `product_${index}_${Date.now()}`,
                item_name: product,
                item_description: "Additional product",
                item_image_url:
                  "https://cashfreelogo.cashfree.com/website/landings-cache/landings/occ/brownShoe.png",
                item_original_unit_price: 0.01,
                item_discounted_unit_price: 0.01,
                item_quantity: 1,
                item_currency: "INR",
              }))
            : [],
      },
    };

    console.log("Request URL:", `${CASHFREE_URL}/orders`);
    console.log("ADDITIONAL", { product_0: additionalProducts?.[0] });
    console.log("Request Data:", JSON.stringify(requestData, null, 2));
    console.log("Request Headers:", {
      "Content-Type": "application/json",
      "x-client-id": process.env.CASHFREE_CLIENT_ID ? "Set" : "Not set",
      "x-client-secret": process.env.CASHFREE_SECRET_KEY ? "Set" : "Not set",
      "x-api-version": "2025-01-01",
    });

    const response = await axios.post(`${CASHFREE_URL}/orders`, requestData, {
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CASHFREE_CLIENT_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2025-01-01",
      },
    });

    const data = response.data;
    res.json({ data: data });
  } catch (error) {
    console.error("Error creating session:", error.response?.data || error);
    res.status(500).json({ message: "Failed to create session", error: error });
  }
};

const getCashfreePaymentDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const response = await axios.get(`${CASHFREE_URL}/orders/${id}/payments`, {
      headers: {
        "x-client-id": process.env.CASHFREE_CLIENT_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        Accept: "application/json",
        "x-api-version": "2025-01-01",
      },
    });

    const data = response.data;
    res.json({ data: data });
  } catch (error) {
    console.error(
      "Error fetching payment details:",
      error.response?.data || error
    );
    res.status(500).json({ error: "Failed to fetch payment details" });
  }
};

module.exports = {
  createCashfreeSession,
  getCashfreePaymentDetails,
};
