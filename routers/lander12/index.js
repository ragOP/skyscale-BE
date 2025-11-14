// routers/lander3/index.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const payuClient = require("../../config/payU");
const EmailLog = require("../../models/emailLog");

const { orderConfirmationHTML } = require("../../emails/orderConfirmation");

// IMPORTANT: use Resend helper (not Nodemailer)
const { sendEmailResend } = require("../../utils/mailer-resend");
const orderModel12 = require("../../models/orderModel12");
const orderModel12Abd = require("../../models/orderModel12-abd");

/** Helper: send + log with Resend */
async function sendAndLogConfirmationEmailResend({
  email,
  name,
  orderId,
  amount,
  additionalProducts = [],
}) {
  const adminBcc = process.env.ADMIN_ORDER_BCC || "";

  const html = orderConfirmationHTML({
    customerName: name || "",
    orderId,
    amount: Number(amount || 0),
    items: [{ title: "Soulmate Sketch Order", price: Number(amount || 0) }],
    additionalProducts,
  });

  try {
    const result = await sendEmailResend({
      to: email,
      subject: `Your AstraSoul Order is Confirmed (#${orderId})`,
      html,
      bcc: adminBcc || undefined,
      // Optional: helpful tags in Resend dashboard
      tags: [
        { name: "type", value: "order_confirmation" },
        { name: "orderId", value: String(orderId) },
      ],
    });

    const id = result?.id || "";
    const status = id ? "accepted" : "error";

    await EmailLog.create({
      toEmail: email,
      bcc: adminBcc,
      subject: `Your AstraSoul Order is Confirmed (#${orderId})`,
      orderId,
      status, // "accepted" if we got an id from Resend
      accepted: id ? [email] : [],
      rejected: [],
      response: id, // store the Resend message id here
      messageId: id, // also store in messageId
      errorMessage: "",
      meta: { amount: Number(amount || 0), name, additionalProducts },
      sentAt: new Date(),
    });

    console.log(`[email-log] Resend queued id=${id} for ${email} / ${orderId}`);
  } catch (err) {
    console.error("[order-email] Resend failed:", err?.message || err);

    await EmailLog.create({
      toEmail: email,
      bcc: adminBcc,
      subject: `Your AstraSoul Order is Confirmed (#${orderId})`,
      orderId,
      status: "error",
      accepted: [],
      rejected: [],
      response: "",
      messageId: "",
      errorMessage: err?.message || String(err),
      meta: { amount: Number(amount || 0), name, additionalProducts },
      sentAt: new Date(),
    });
  }
}

router.get("/details", async (req, res) => {
  const { txnid } = req.query;
  const order = await orderModel12.findOne({ orderId: txnid });
  if (!order) {
    return res
      .status(404)
      .json({ success: false, data: null, message: "Order not found" });
  }
  const orderDetails = {
    orderId: order.orderId,
    fullName: order.fullName,
    email: order.email,
    phoneNumber: order.phoneNumber,
    dob: order.dob,
    gender: order.gender,
    placeOfBirth: order.placeOfBirth,
    additionalProducts: order.additionalProducts,
  };
  return res.status(200).json({ success: true, data: orderDetails });
});

/**
 * POST /api/lander3/create-order  (Razorpay path)
 */
router.post("/create-order", async (req, res) => {
  const {
    amount,
    orderId,
    name,
    email,
    phone,
    dateOfBirth,
    gender,
    placeOfBirth,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    additionalProducts = [],
  } = req.body;

  try {
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
    hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Invalid Payment",
      });
    }

    const existingOrder = await orderModel12.findOne({ orderId });
      if (existingOrder) {
      return res.status(200).json({
        success: true,
        data: existingOrder,
      });
    }

    const payload = {
      amount,
      orderId,
      fullName: name,
      email,
      phoneNumber: phone,
      dob: dateOfBirth,
      gender,
      placeOfBirth,
      razorpayOrderId,
      razorpayPaymentId,
      additionalProducts,
      razorpaySignature,
    };

    const order = await orderModel12.create(payload);

    // Send via Resend (non-blocking)
    (async () => {
      if (email) {
        await sendAndLogConfirmationEmailResend({
          email,
          name,
          orderId: orderId || razorpayOrderId || `ORDER_${Date.now()}`,
          amount,
          additionalProducts,
        });
      } else {
        console.warn(
          "[order-email] no email in payload; skipping Resend + log"
        );
      }
    })();

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("create-order error:", error);
    return res.status(500).json({ error: error.message });
  }
});

router.post("/success", async (req, res) => {
  try {
    const { txnid, email, phone } = req.query;
    if (!txnid) {
      return res.redirect(
        302,
        `https://www.easyastro.in/failure-cousin?txnid=${txnid}`
      );
    }

    const paymentDetails = await payuClient.verifyPayment(txnid);
    if (!paymentDetails) {
      return res.redirect(
        302,
        `https://www.easyastro.in/failure-cousin?txnid=${txnid}`
      );
    }

    const txnKey = Object.keys(paymentDetails.transaction_details)[0];
    const txn = paymentDetails.transaction_details[txnKey];

    if (txn.status !== "success") {
      return res.redirect(
        302,
        `https://www.easyastro.in/failure-cousin?txnid=${txnid}`
      );
    }

    const sperateAdditionalProducts = txn.udf4 ? txn.udf4.split(",") : [];

    const payload = {
      orderId: txn.txnid,
      email: email || null,
      fullName: txn.firstname || null,
      amount: txn.amt || txn.transaction_amount || null,
      phoneNumber: phone || null,
      dob: txn.udf1 || null,
      gender: txn.udf2 || null,
      placeOfBirth: txn.udf3 || null,
      additionalProducts: sperateAdditionalProducts || null,
      orderDate: Date.now(),
    };

    const checkIfOrderExists = await orderModel12.findOne({
      orderId: txn.txnid,
    });
    if (checkIfOrderExists) {
      console.log(
        `Order with orderId ${txn.txnid} already exists. Skipping creation.`
      );
      return res.redirect(
        302,
        `https://www.easyastro.in/success-cousin?txnid=${txnid}`
      );
    }

    const order = await orderModel12.create(payload);

    (async () => {
      if (email) {
        await sendAndLogConfirmationEmailResend({
          email: txn.email,
          name: txn.firstname || "Customer",
          orderId: txn.txnid || `ORDER_${Date.now()}`,
          amount: txn.amt || txn.transaction_amount,
          additionalProducts: sperateAdditionalProducts,
        });
      } else {
        console.warn("[order-email] No email found; skipping Resend + log");
      }
    })();

    return res.redirect(302, `https://www.easyastro.in/success-cousin?txnid=${txnid}`);
  } catch (err) {
    console.error("create-order error:", err);
    return res.redirect(302, `https://www.easyastro.in/failure-cousin?txnid=${txnid}`);
  }
});

/**
 * POST /api/lander3/create-order-abd
 */
router.post("/create-order-abd", async (req, res) => {
  const {
    amount,
    name,
    email,
    phone,
    dateOfBirth,
    gender,
    placeOfBirth,
    additionalProducts = [],
  } = req.body;

  try {
    const payload = {
      abdOrderId: `ord_${Date.now()}_${Math.floor(Math.random() * 1e5)}`,
      amount,
      fullName: name,
      email,
      phoneNumber: phone,
      dob: dateOfBirth,
      gender,
      placeOfBirth,
      additionalProducts,
    };
    const order = await orderModel12Abd.create(payload);

    if (order) {
      const response = await fetch(
        "https://scheduler-easy-astro.onrender.com/api/schedule-job/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        console.error(
          "Scheduler service responded with error:",
          response.statusText
        );
      } else {
        console.log("Scheduled job successfully");
      }
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("create-order-abd error:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/lander3/delete-order-abd/:id
 */
router.delete("/delete-order-abd", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: "email required" });
  }

  try {
    const result = await orderModel12Abd.deleteMany({ email });

    const response = await fetch(
      "https://scheduler-easy-astro.onrender.com/api/schedule-job/delete",
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }
    );
    if (!response.ok) {
      console.error(
        "Scheduler service responded with error:",
        response.statusText
      );
    } else {
      console.log("Scheduled job successfully");
    }
    return res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: `${result.deletedCount} Abandoned Order(s) deleted successfully`,
    });
  } catch (error) {
    console.error("delete-order-abd error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/lander3/create-order-phonepe  (PhonePe path)
 */
router.post("/create-order-phonepe", async (req, res) => {
  const {
    amount,
    orderId,
    name,
    email,
    phone,
    dateOfBirth,
    gender,
    placeOfBirth,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    additionalProducts = [],
  } = req.body;

  try {
    const payload = {
      amount,
      orderId,
      fullName: name,
      email,
      phoneNumber: phone,
      dob: dateOfBirth,
      gender,
      placeOfBirth,
      razorpayOrderId,
      razorpayPaymentId,
      additionalProducts,
      razorpaySignature,
    };

    const order = await orderModel12.create(payload);

    // Send via Resend (non-blocking)
    (async () => {
      if (email) {
        await sendAndLogConfirmationEmailResend({
          email,
          name,
          orderId: orderId || `ORDER_${Date.now()}`,
          amount,
          additionalProducts,
        });
      } else {
        console.warn(
          "[order-email] no email in payload; skipping Resend + log"
        );
      }
    })();

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("create-order-phonepe error:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/lander3/get-orders
 */
router.get("/get-orders", async (req, res) => {
  const orders = await orderModel12.find({}).sort({ createdAt: -1 });
  return res.status(200).json({ success: true, data: orders });
});

/**
 * GET /api/lander3/get-orders-abd
 */
router.get("/get-orders-abd", async (req, res) => {
  const orders = await orderModel12Abd.find({}).sort({ createdAt: -1 });
  return res.status(200).json({ success: true, data: orders });
});

/**
 * GET /api/lander3/get-email-sent  (unchanged, still works with Resend logs)
 *   ?status=accepted|rejected|error
 *   ?from=YYYY-MM-DD&to=YYYY-MM-DD
 *   ?orderId=...
 *   ?email=...
 */
router.get("/get-email-sent", async (req, res) => {
  try {
    const { status, from, to, orderId, email } = req.query;
    const q = {};
    if (status) q.status = status;
    if (orderId) q.orderId = orderId;
    if (email) q.toEmail = email;
    if (from || to) {
      q.sentAt = {};
      if (from) q.sentAt.$gte = new Date(from);
      if (to) q.sentAt.$lte = new Date(to);
    }
    const logs = await EmailLog.find(q).sort({ sentAt: -1 });
    return res.status(200).json({ success: true, data: logs });
  } catch (err) {
    console.error("get-email-sent error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/get-order/main", async (req, res) => {
  const { page = 1, limit = 100 } = req.query;
  try {
    const orders = await orderModel12
      .find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return res.status(200).json({
      success: true,
      data: {
        orders,
        currentPage: page,
        totalPages: Math.ceil((await orderModel12.countDocuments()) / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/get-order/main-abd", async (req, res) => {
  const { page = 1, limit = 100 } = req.query;
  try {
    const orders = await orderModel12Abd
      .find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return res.status(200).json({
      success: true,
      data: {
        orders,
        currentPage: page,
        totalPages: Math.ceil((await orderModel12Abd.countDocuments()) / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch("/delivery-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deliveryStatusEmail = req.body.deliveryStatusEmail;

    const order = await orderModel12.findByIdAndUpdate(
      id,
      { deliveryStatusEmail: deliveryStatusEmail },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;