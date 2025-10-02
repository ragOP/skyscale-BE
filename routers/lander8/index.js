const express = require("express");
const router = express.Router();
const orderModel8 = require("../../models/orderModel8");
const AbandonedOrder8 = require("../../models/orderModel8-abd");
const crypto = require("crypto");

router.post("/create-order", async (req, res) => {
  const {
    amount,
    orderId,
    fullName,
    email,
    color,
    bundle,
    address,
    dob,
    phoneNumber,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    additionalProducts = [],
  } = req.body;
  console.log(req.body);
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
    const existingOrder = await orderModel8.findOne({ orderId });
              if (existingOrder) {
              return res.status(200).json({
                success: true,
                data: existingOrder,
              });
            }
    const payload = {
      amount,
      orderId,
      fullName,
      email,
      phoneNumber,
      color,
      bundle,
      address,
      dob,
      razorpayOrderId,
      razorpayPaymentId,
      additionalProducts,
      razorpaySignature,
    };
    const order = await orderModel8.create(payload);
    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/abandoned-order", async (req, res) => {
  const { fullName, amount, email, phone, dob, address, color, bundle } =
    req.body;

  try {
    const abandonedOrder = await AbandonedOrder8.create({
      abdOrderId: `ord_${Date.now()}_${Math.floor(Math.random() * 1e5)}`,
      fullName,
      amount,
      email,
      phone,
      dob,
      color,
      bundle,
      address,
    });

    return res.status(200).json({
      success: true,
      data: abandonedOrder,
      message: "Abandoned order created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

router.delete("/delete-abandoned-order", async (req, res) => {
  const { email } = req.query;
  console.log(email);
  if (!email) {
    return res.status(404).json({ success: false, error: "email not found" });
  }
  try {
    const deletedCart = await AbandonedOrder8.deleteMany({ email });
    if (!deletedCart) {
      return res
        .status(404)
        .json({ success: false, message: "Abandoned cart not found" });
    }
    return res.status(200).json({
      success: true,
      data: deletedCart,
      message: "Abandoned cart deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

router.get("/get-abandoned-orders", async (req, res) => {
  try {
    const result = await AbandonedOrder8.find({}).sort({ createdAt: -1 });
    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "No abandoned orders found" });
    }
    return res.status(200).json({
      success: true,
      data: result,
      message: "Abandoned orders retrieved successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get abandoned orders",
    });
  }
});

router.get("/get-orders", async (req, res) => {
  try {
    const result = await orderModel8.find({}).sort({ createdAt: -1 });
    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "No orders found" });
    }
    return res.status(200).json({
      success: true,
     data: {
        result,
        currentPage: page,
        totalPages: Math.ceil((await orderModel8.countDocuments()) / limit),
      },
      message: "All orders retrieved successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get all orders",
    });
  }
});
router.get("/get-order/main", async (req, res) => {
  const {page = 1, limit=100} = req.query;
  try {
    const orders = await orderModel8.find({}).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
    return res.status(200).json({
      success: true,
      data: {
        orders,
        currentPage: page,
        totalPages: Math.ceil((await orderModel8.countDocuments()) / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/get-order/main-abd", async (req, res) => {
  const {page = 1, limit=100} = req.query;
  try {
    const orders = await AbandonedOrder8.find({}).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});



router.patch("/delivery-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deliveryStatusEmail = req.body.deliveryStatusEmail;

    const order = await orderModel8.findByIdAndUpdate(
      id,
      { deliveryStatusEmail: deliveryStatusEmail},
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
