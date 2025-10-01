const express = require("express");
const router = express.Router();
const orderModel6 = require("../../models/orderModel6");
const crypto = require("crypto");
const AbondentOrder2 = require("../../models/abondentOrder2");
router.post("/create-order", async (req, res) => {
  const {
    name,
    email,
    phone,
    dob,
    items,
    orderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  } = req.body;
  try {
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
    hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature" });
    }

    const data = {
      items,
      orderId,
      fullName: name,
      email,
      phone,
      dob,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    };

    const order = await orderModel6.create(data);

    return res.status(200).json({
      success: true,
      data: order,
      message: "Order placed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});
router.post("/abandoned-order", async (req, res) => {
  const { name, email, phone, dob, address, items } = req.body;

  console.log(items, "hee");

  try {
    const abandonedOrder = await AbondentOrder2.create({
      orderId: `ord_${Date.now()}_${Math.floor(Math.random() * 1e5)}`,
      fullName: name,
      email,
      phone,
      dob,
      address,
      items,
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
    const deletedCart = await AbondentOrder2.deleteMany({ email });
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
    const result = await AbondentOrder2.find({}).sort({ createdAt: -1 });
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
    const result = await orderModel6.find({}).sort({ createdAt: -1 });
    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "No orders found" });
    }
    return res.status(200).json({
      success: true,
      data: result,
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
  const { page = 1, limit = 100 } = req.query;
  try {
    const orders = await orderModel6
      .find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return res.status(200).json({
      success: true,
      data: {
        orders,
        currentPage: page,
        totalPages: Math.ceil((await orderModel6.countDocuments()) / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/get-order/main-abd", async (req, res) => {
  const { page = 1, limit = 100 } = req.query;
  try {
    const orders = await AbondentOrder2.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return res.status(200).json({
      success: true,
      data: {
        orders,
        currentPage: page,
        totalPages: Math.ceil((await AbondentOrder2.countDocuments()) / limit),
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

    const order = await orderModel6.findByIdAndUpdate(
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
