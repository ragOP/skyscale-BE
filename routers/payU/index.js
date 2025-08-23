const express = require("express");
const router = express.Router();
const { payuClient, CFG } = require("../../config/payU");

/**
 * GET /api/payu/ping
 * Simple ping endpoint to verify router is working
 */
router.get("/ping", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "PayU router is working",
    timestamp: new Date().toISOString(),
    endpoint: "/api/payu/ping"
  });
});

/**
 * GET /api/payu/test
 * Test endpoint to verify PayU configuration
 */
router.get("/test", (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        message: "PayU configuration test",
        environment: CFG.env,
        merchantKey: CFG.merchantKey ? "Configured" : "Missing",
        merchantSalt: CFG.merchantSalt ? "Configured" : "Missing",
        testUrls: CFG.testUrls,
        sdkStatus: payuClient ? "Initialized" : "Failed to initialize",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/payu/debug
 * Debug endpoint to show all configuration details
 */
router.get("/debug", (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        message: "PayU debug configuration",
        environment: CFG.env,
        merchantKey: CFG.merchantKey,
        merchantSalt: CFG.merchantSalt ? "Configured" : "Missing",
        testUrls: CFG.testUrls,
        sdkStatus: payuClient ? "Initialized" : "Failed to initialize",
        envVars: {
          PAYU_MERCHANT_KEY: process.env.PAYU_MERCHANT_KEY,
          PAYU_MERCHANT_SALT: process.env.PAYU_MERCHANT_SALT ? "Set" : "Missing",
          PAYU_ENV: process.env.PAYU_ENV,
          NODE_ENV: process.env.NODE_ENV,
        },
        // Test hash generation
        testHash: (() => {
          try {
            const testData = {
              key: CFG.merchantKey,
              txnid: "TEST_TXN_123",
              amount: "100",
              productinfo: "Test Product",
              firstname: "Test",
              email: "test@test.com",
              udf1: "test",
              udf2: "",
              udf3: "",
              udf4: "Test Service"
            };
            const crypto = require('crypto');
            const hashString = [
              testData.key,
              testData.txnid,
              testData.amount,
              testData.productinfo,
              testData.firstname,
              testData.email,
              testData.udf1,
              testData.udf2,
              testData.udf3,
              testData.udf4,
              process.env.PAYU_MERCHANT_SALT
            ].join("|");
            return {
              hashString: hashString,
              hash: crypto.createHash('sha512').update(hashString).digest('hex'),
              salt: process.env.PAYU_MERCHANT_SALT ? "Set" : "Missing"
            };
          } catch (error) {
            return { error: error.message };
          }
        })()
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/payu/test-form
 * Test endpoint to generate a simple payment form with hash
 */
router.get("/test-form", (req, res) => {
  try {
    const testPaymentData = {
      key: CFG.merchantKey,
      txnid: `TEST_${Date.now()}`,
      amount: "100",
      productinfo: "Test Product",
      firstname: "Test User",
      email: "test@test.com",
      phone: "1234567890",
      surl: "http://localhost:9002/success",
      furl: "http://localhost:9002/failure",
      curl: "http://localhost:9002/cancel",
      service_provider: "payu_paisa",
      udf1: "Test Profession",
      udf2: "Test Remarks",
      udf3: "Test Products",
      udf4: "Test Service"
    };
    
    const testForm = createManualPaymentForm(testPaymentData, CFG.testUrls.payUrl);
    
    return res.status(200).json({
      success: true,
      data: {
        message: "Test payment form generated",
        paymentData: testPaymentData,
        form: testForm,
        containsHash: testForm.includes('name="hash"'),
        containsTestUrl: testForm.includes("test.payu.in"),
        formLength: testForm.length
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/payu/create-payment
 * body: { amount, fullName, email, phoneNumber, profession, remarks, additionalProducts }
 * returns: { success, data: { txnid, paymentForm, paymentData } }
 */
router.post("/create-payment", async (req, res) => {
  console.log("🚀 /api/payu/create-payment endpoint called");
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  console.log("Request headers:", req.headers);
  
  try {
    const {
      amount,
      fullName,
      email,
      phoneNumber,
      profession,
      remarks = "",
      additionalProducts = [],
      surl = process.env.FRONTEND_SUCCESS_URL ||
        "http://localhost:9002/payment-success",
      furl = process.env.FRONTEND_FAILURE_URL ||
        "http://localhost:9002/payment-failure",
      curl = process.env.FRONTEND_CANCEL_URL ||
        "http://localhost:9002/payment-cancel",
    } = req.body;

    console.log("📝 Extracted parameters:");
    console.log("- amount:", amount);
    console.log("- fullName:", fullName);
    console.log("- email:", email);
    console.log("- phoneNumber:", phoneNumber);
    console.log("- profession:", profession);
    console.log("- remarks:", remarks);
    console.log("- additionalProducts:", additionalProducts);
    console.log("- surl:", surl);
    console.log("- furl:", furl);
    console.log("- curl:", curl);

    // Validation for lander4 signature service
    if (!amount || !fullName || !email || !phoneNumber || !profession) {
      return res.status(400).json({
        success: false,
        error:
          "amount, fullName, email, phoneNumber, and profession are required for signature service",
      });
    }

    // Generate unique transaction ID
    const txnid = `TXN_${Date.now()}_${Math.floor(Math.random() * 1e5)}`;

    // Create payment data for PayU SDK with lander4 fields
    const paymentData = {
      key: CFG.merchantKey, // Add merchant key for hash generation
      txnid,
      amount,
      productinfo: `Signature Service - ${profession}`,
      firstname: fullName,
      email,
      phone: phoneNumber,
      surl,
      furl,
      curl,
      service_provider: "payu_paisa",
      // Additional fields for lander4
      udf1: profession,
      udf2: remarks,
      udf3: additionalProducts.join(", "),
      udf4: "Signature Service",
    };

    console.log("paymentData", paymentData);
    console.log("PayU Environment:", CFG.env);
    console.log("Test URLs:", CFG.testUrls);
    console.log("Environment Variables Check:");
    console.log("- PAYU_MERCHANT_KEY:", process.env.PAYU_MERCHANT_KEY ? "Set" : "Missing");
    console.log("- PAYU_MERCHANT_SALT:", process.env.PAYU_MERCHANT_SALT ? "Set" : "Missing");
    console.log("- CFG.merchantKey:", CFG.merchantKey);
    console.log("- CFG.merchantSalt:", CFG.merchantSalt ? "Set" : "Missing");

    // Try to use PayU SDK first
    let paymentForm;
    try {
      console.log("Attempting to use PayU SDK...");
      console.log("PayU Environment:", CFG.env);
      console.log("Test URLs:", CFG.testUrls);
      
      // For now, always use manual form creation to ensure hash is included
      console.log("⚠️ Bypassing SDK to ensure hash parameter is included");
      paymentForm = createManualPaymentForm(paymentData, CFG.testUrls.payUrl);
      
      // Verify the form contains the hash
      if (paymentForm.includes('name="hash"')) {
        console.log("✅ Hash parameter found in form");
      } else {
        console.log("❌ Hash parameter NOT found in form!");
        console.log("Form content:", paymentForm);
      }
      
      // Verify test URL is used
      if (paymentForm.includes("test.payu.in")) {
        console.log("✅ Test URL found in form");
      } else {
        console.log("❌ Test URL NOT found in form!");
      }
      
      // Original SDK code (commented out for now)
      // paymentForm = payuClient.paymentInitiate(paymentData);
      // console.log("PayU SDK payment form generated successfully", paymentForm);
      
      // Check if SDK generated form has correct test URL
      // if (paymentForm.includes("test.payu.in")) {
      //   console.log("✅ SDK generated test URL correctly");
      // } else if (paymentForm.includes("secure.payu.in")) {
      //   console.log("❌ SDK generated LIVE URL - this is the problem!");
      //   console.log("Falling back to manual form creation due to live URL");
      //   paymentForm = createManualPaymentForm(paymentData, CFG.testUrls.payUrl);
      // }
    } catch (sdkError) {
      console.error("PayU SDK error:", sdkError.message);
      console.log("Falling back to manual form creation");
      
      // Fallback: Create manual form for test environment
      paymentForm = createManualPaymentForm(paymentData, CFG.testUrls.payUrl);
      console.log("✅ Manual fallback form created with test URL");
    }

    console.log("Final paymentForm length:", paymentForm ? paymentForm.length : "undefined");
    console.log("Final paymentForm contains hash:", paymentForm ? paymentForm.includes('name="hash"') : "undefined");
    console.log("Final paymentForm contains test URL:", paymentForm ? paymentForm.includes("test.payu.in") : "undefined");

    const responseData = {
      success: true,
      data: {
        txnid,
        paymentForm,
        paymentData,
        merchantKey: CFG.merchantKey,
        serviceType: "Signature Service (Lander4)",
        environment: CFG.env,
        payUrl: CFG.testUrls.payUrl,
      },
    };
    
    console.log("📤 Sending response to frontend:");
    console.log("- Response success:", responseData.success);
    console.log("- Response txnid:", responseData.data.txnid);
    console.log("- Response form length:", responseData.data.paymentForm ? responseData.data.paymentForm.length : "undefined");
    console.log("- Response form contains hash:", responseData.data.paymentForm ? responseData.data.paymentForm.includes('name="hash"') : "undefined");
    console.log("- Response form contains test URL:", responseData.data.paymentForm ? responseData.data.paymentForm.includes("test.payu.in") : "undefined");

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("PayU payu-payment error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Generate PayU hash for payment verification
 * Hash is calculated using: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|salt
 */
function generatePayUHash(paymentData, salt) {
  const hashString = [
    paymentData.key || process.env.PAYU_MERCHANT_KEY,
    paymentData.txnid,
    paymentData.amount,
    paymentData.productinfo,
    paymentData.firstname,
    paymentData.email,
    paymentData.udf1 || "",
    paymentData.udf2 || "",
    paymentData.udf3 || "",
    paymentData.udf4 || "",
    salt
  ].join("|");
  
  console.log("Hash string (without salt):", [
    paymentData.key || process.env.PAYU_MERCHANT_KEY,
    paymentData.txnid,
    paymentData.amount,
    paymentData.productinfo,
    paymentData.firstname,
    paymentData.email,
    paymentData.udf1 || "",
    paymentData.udf2 || "",
    paymentData.udf3 || "",
    paymentData.udf4 || ""
  ].join("|"));
  
  // Generate SHA512 hash
  const crypto = require('crypto');
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');
  
  console.log("Generated hash:", hash);
  return hash;
}

/**
 * Create manual payment form for test environment
 */
function createManualPaymentForm(paymentData, payUrl) {
  console.log("Creating manual payment form with URL:", payUrl);
  console.log("Ensuring test environment URL is used");
  console.log("Payment data received:", JSON.stringify(paymentData, null, 2));
  
  // Generate hash for the payment
  const hash = generatePayUHash(paymentData, process.env.PAYU_MERCHANT_SALT);
  
  // Log all form fields being created
  const formFields = [
    `<input type="hidden" name="key" value="${
      paymentData.key || process.env.PAYU_MERCHANT_KEY
    }">`,
    `<input type="hidden" name="txnid" value="${paymentData.txnid}">`,
    `<input type="hidden" name="amount" value="${paymentData.amount}">`,
    `<input type="hidden" name="productinfo" value="${paymentData.productinfo}">`,
    `<input type="hidden" name="firstname" value="${paymentData.firstname}">`,
    `<input type="hidden" name="email" value="${paymentData.email}">`,
    `<input type="hidden" name="phone" value="${paymentData.phone}">`,
    `<input type="hidden" name="surl" value="${paymentData.surl}">`,
    `<input type="hidden" name="furl" value="${paymentData.furl}">`,
    `<input type="hidden" name="curl" value="${paymentData.curl}">`,
    `<input type="hidden" name="service_provider" value="${paymentData.service_provider}">`,
    `<input type="hidden" name="udf1" value="${paymentData.udf1}">`,
    `<input type="hidden" name="udf2" value="${paymentData.udf2}">`,
    `<input type="hidden" name="udf3" value="${paymentData.udf3}">`,
    `<input type="hidden" name="udf4" value="${paymentData.udf4}">`,
    `<input type="hidden" name="hash" value="${hash}">`,
  ];
  
  console.log("Form fields being created:");
  formFields.forEach((field, index) => {
    console.log(`Field ${index + 1}:`, field);
  });

  const form = `
    <form id="payu-form" action="${payUrl}" method="post">
      ${formFields.join("")}
      <button type="submit" style="display:none;">Pay Now</button>
    </form>
    <script>
      // Auto-submit the form
      document.getElementById('payu-form').submit();
    </script>
  `;
  
  console.log("✅ Manual form created with action URL:", payUrl);
  console.log("✅ Hash parameter included:", hash);
  console.log("✅ Complete form HTML:", form);
  return form;
}

/**
 * POST /api/payu/verify-payment
 * body: { txnid, amount, productinfo, firstname, email, hash }
 * returns: { success, data: { verified, message } }
 */
router.post("/verify-payment", async (req, res) => {
  try {
    const { txnid, amount, productinfo, firstname, email, hash } = req.body;

    // Validation
    if (!txnid || !amount || !productinfo || !firstname || !email || !hash) {
      return res.status(400).json({
        success: false,
        error: "All fields are required for verification",
      });
    }

    // Use PayU SDK to verify payment
    const verificationResult = await payuClient.verifyPayment({
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      hash,
    });

    if (verificationResult && verificationResult.status === "success") {
      return res.status(200).json({
        success: true,
        data: {
          verified: true,
          message: "Payment verified successfully",
          txnid,
          amount,
          details: verificationResult,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        data: {
          verified: false,
          message: "Payment verification failed",
          details: verificationResult,
        },
      });
    }
  } catch (error) {
    console.error("PayU verify-payment error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/payu/status/:txnid
 * Get payment status from PayU
 */
router.get("/status/:txnid", async (req, res) => {
  try {
    const { txnid } = req.params;

    if (!txnid) {
      return res.status(400).json({
        success: false,
        error: "Transaction ID is required",
      });
    }

    // Use PayU SDK to get transaction details
    const transactionDetails = await payuClient.getTransactionDetails({
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // Last 24 hours
      endDate: new Date().toISOString().split("T")[0],
    });

    // Filter for specific transaction
    const transaction = transactionDetails.find((t) => t.txnid === txnid);

    if (transaction) {
      return res.status(200).json({
        success: true,
        data: {
          txnid,
          status: transaction.status,
          amount: transaction.amount,
          details: transaction,
        },
      });
    } else {
      return res.status(404).json({
        success: false,
        data: {
          message: "Transaction not found",
          txnid,
        },
      });
    }
  } catch (error) {
    console.error("PayU status check error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/payu/webhook
 * PayU webhook for payment status updates
 */
router.post("/webhook", express.json({ type: "*/*" }), async (req, res) => {
  try {
    const webhookData = req.body;
    console.log("PayU webhook received:", webhookData);

    // Extract payment details from webhook
    const {
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      status,
      hash,
      mode,
      bankcode,
      error_code,
      error_message,
      udf1, // profession
      udf2, // remarks
      udf3, // additionalProducts
      udf4, // service type
    } = webhookData;

    // Process webhook data based on status
    if (status === "success") {
      // Payment successful - update your database
      console.log(`Payment successful for transaction: ${txnid}`);
      console.log(`Signature Service - Profession: ${udf1}, Remarks: ${udf2}`);
      // TODO: Update order status in your database for lander4
    } else if (status === "failure") {
      // Payment failed
      console.log(
        `Payment failed for transaction: ${txnid}, Error: ${error_message}`
      );
      // TODO: Update order status in your database for lander4
    }

    // Always respond with success to acknowledge webhook
    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("PayU webhook error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
