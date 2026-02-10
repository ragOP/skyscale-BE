// routers/lander777/index.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const orderModel777 = require("../../models/orderModel777");
const orderModel777Abd = require("../../models/orderModel777-abd");
const EmailLog = require("../../models/emailLog");

const { orderConfirmationHTML } = require("../../emails/orderConfirmation");
const { sendEmail, getTransporter } = require("../../utils/mailer");

async function sendAndLogConfirmationEmailNodeMailer({
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
    const transporter = await getTransporter();
    const result = await sendEmail({
      to: email,
      subject: `Your AstraSoul Order is Confirmed (#${orderId})`,
      html,
      bcc: adminBcc || undefined,
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
      status,
      accepted: id ? [email] : [],
      rejected: [],
      response: id,
      messageId: id,
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

/**
 * POST /api/lander777/create-order  (Razorpay path)
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
    const existingOrder = await orderModel777.findOne({ orderId });
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

    const order = await orderModel777.create(payload);

    (async () => {
      if (email) {
        await sendAndLogConfirmationEmailNodeMailer({
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

/**
 * POST /api/lander777/create-order-abd
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
    const order = await orderModel777Abd.create(payload);

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
 * DELETE /api/lander777/delete-order-abd
 */
router.delete("/delete-order-abd", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: "email required" });
  }

  try {
    const result = await orderModel777Abd.deleteMany({ email });

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
 * POST /api/lander777/create-order-phonepe  (PhonePe path)
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

    const order = await orderModel777.create(payload);

    (async () => {
      if (email) {
        await sendAndLogConfirmationEmailNodeMailer({
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
 * GET /api/lander777/get-orders
 */
router.get("/get-orders", async (req, res) => {
  const orders = await orderModel777.find({}).sort({ createdAt: -1 });
  return res.status(200).json({ success: true, data: orders });
});

/**
 * GET /api/lander777/get-orders-abd
 */
router.get("/get-orders-abd", async (req, res) => {
  const orders = await orderModel777Abd.find({}).sort({ createdAt: -1 });
  return res.status(200).json({ success: true, data: orders });
});

/**
 * GET /api/lander777/get-email-sent
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
    const orders = await orderModel777
      .find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return res.status(200).json({
      success: true,
      data: {
        orders,
        currentPage: page,
        totalPages: Math.ceil((await orderModel777.countDocuments()) / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/get-order/main-abd", async (req, res) => {
  const { page = 1, limit = 100 } = req.query;
  try {
    const orders = await orderModel777Abd
      .find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return res.status(200).json({
      success: true,
      data: {
        orders,
        currentPage: page,
        totalPages: Math.ceil((await orderModel777Abd.countDocuments()) / limit),
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

    const order = await orderModel777.findByIdAndUpdate(
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
