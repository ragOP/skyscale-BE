const express = require("express");
const router = express.Router();
const orderModel12 = require("../../models/oderModel2");
const orderModel = require("../../models/orderModel");
const orderModel14 = require("../../models/oderModel4");
const orderModel13 = require("../../models/oderModel3");
const orderModel15 = require("../../models/oderModel5");
const orderModel3Abd = require("../../models/oderModel3-abd");
const orderModel5Abd = require("../../models/oderModel5-abd");

//----orders of astraSoul -----//
router.get("/get-all-orders-astrasoul", async (req, res) => {
  const { page, limit = 10, startDate, endDate } = req.query;

  const filter = {};
  if (startDate && endDate) {
    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const skip = (page - 1) * limit;

  const result = await orderModel
    .find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  if (result.length === 0) {
    return res
      .status(200)
      .json({ success: false, data: [], message: "No orders found" });
  }

  //   const totalDoc = await orderModel.countDocuments(filter);
  const totalRevenue = await orderModel.aggregate([
    { $match: filter || {} },
    {
      $group: { _id: null, total: { $sum: "$amount" }, totalDoc: { $sum: 1 } },
    },
  ]);
  const total = totalRevenue[0]?.total || 0;
  const totalDoc = totalRevenue[0]?.totalDoc || 0;
  const totalPages = Math.ceil(totalDoc / limit);

  return res.status(200).json({
    success: true,
    data: result,
    totalPages,
    totalDoc,
    totalRevenue: total,
    message: "Orders fetched successfully",
  });
});
//---- orders of astraSoul love -----//
router.get("/get-all-orders-astrasoullove", async (req, res) => {
  const { page, limit = 10, startDate, endDate } = req.query;

  const filter = {};
  if (startDate && endDate) {
    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const skip = (page - 1) * limit;

  const result = await orderModel12
    .find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  if (result.length === 0) {
    return res
      .status(200)
      .json({ success: false, data: [], message: "No orders found" });
  }

  const totalRevenue = await orderModel12.aggregate([
    { $match: filter || {} },
    {
      $group: { _id: null, total: { $sum: "$amount" }, totalDoc: { $sum: 1 } },
    },
  ]);
  const total = totalRevenue[0]?.total || 0;
  const totalDoc = totalRevenue[0]?.totalDoc || 0;
  const totalPages = Math.ceil(totalDoc / limit);

  return res.status(200).json({
    success: true,
    data: result,
    totalPages,
    totalDoc,
    totalRevenue: total,
    message: "Orders fetched successfully",
  });
});
//---- orders of signature -----//
router.get("/get-all-orders-signature", async (req, res) => {
  const { page, limit = 10, startDate, endDate } = req.query;

  const filter = {};
  if (startDate && endDate) {
    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const skip = (page - 1) * limit;

  const result = await orderModel14
    .find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  if (result.length === 0) {
    return res
      .status(200)
      .json({ success: false, data: [], message: "No orders found" });
  }

  const totalRevenue = await orderModel14.aggregate([
    { $match: filter || {} },
    {
      $group: { _id: null, total: { $sum: "$amount" }, totalDoc: { $sum: 1 } },
    },
  ]);
  const total = totalRevenue[0]?.total || 0;
  const totalDoc = totalRevenue[0]?.totalDoc || 0;
  const totalPages = Math.ceil(totalDoc / limit);

  return res.status(200).json({
    success: true,
    data: result,
    totalPages,
    totalDoc,
    totalRevenue: total,
    message: "Orders fetched successfully",
  });
});
//---- orders of easyastro -----//
router.get("/get-all-orders-easyastro", async (req, res) => {
  const { page, limit = 10, startDate, endDate } = req.query;

  const filter = {};
  if (startDate && endDate) {
    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const skip = (page - 1) * limit;

  const result = await orderModel13
    .find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  if (result.length === 0) {
    return res
      .status(200)
      .json({ success: false, data: [], message: "No orders found" });
  }

  const totalRevenue = await orderModel13.aggregate([
    { $match: filter || {} },
    {
      $group: { _id: null, total: { $sum: "$amount" }, totalDoc: { $sum: 1 } },
    },
  ]);
  const total = totalRevenue[0]?.total || 0;
  const totalDoc = totalRevenue[0]?.totalDoc || 0;
  const totalPages = Math.ceil(totalDoc / limit);

  return res.status(200).json({
    success: true,
    data: result,
    totalPages,
    totalDoc,
    totalRevenue: total,
    message: "Orders fetched successfully",
  });
});
//----orders of easyastro Sister2 -----//
router.get("/get-all-orders-easyastroSister2", async (req, res) => {
  const { page, limit = 10, startDate, endDate } = req.query;

  const filter = {};
  if (startDate && endDate) {
    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const skip = (page - 1) * limit;

  const result = await orderModel15
    .find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  if (result.length === 0) {
    return res
      .status(200)
      .json({ success: false, data: [], message: "No orders found" });
  }

  const totalRevenue = await orderModel15.aggregate([
    { $match: filter || {} },
    {
      $group: { _id: null, total: { $sum: "$amount" }, totalDoc: { $sum: 1 } },
    },
  ]);
  const total = totalRevenue[0]?.total || 0;
  const totalDoc = totalRevenue[0]?.totalDoc || 0;
  const totalPages = Math.ceil(totalDoc / limit);

  return res.status(200).json({
    success: true,
    data: result,
    totalPages,
    totalDoc,
    totalRevenue: total,
    message: "Orders fetched successfully",
  });
});

//---- abondened orders of easyastro -----//
router.get("/get-all-abd-orders-easyastro", async (req, res) => {
  const { page, limit = 10, startDate, endDate } = req.query;

  const filter = {};
  if (startDate && endDate) {
    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const skip = (page - 1) * limit;

  const result = await orderModel3Abd
    .find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  if (result.length === 0) {
    return res
      .status(200)
      .json({ success: false, data: [], message: "No orders found" });
  }

  const totalDoc = await orderModel3Abd.countDocuments(filter);
  const totalPages = Math.ceil(totalDoc / limit);

  return res.status(200).json({
    success: true,
    data: result,
    totalPages,
    totalDoc,
    message: "Orders fetched successfully",
  });
});
//--- abondened orders of easyastro Sister2 -----//
router.get("/get-all-abd-orders-easyastrosister2", async (req, res) => {
  const { page, limit = 10, startDate, endDate } = req.query;

  const filter = {};
  if (startDate && endDate) {
    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const skip = (page - 1) * limit;

  const result = await orderModel5Abd
    .find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  if (result.length === 0) {
    return res
      .status(200)
      .json({ success: false, data: [], message: "No orders found" });
  }

  const totalDoc = await orderModel5Abd.countDocuments(filter);
  const totalPages = Math.ceil(totalDoc / limit);

  return res.status(200).json({
    success: true,
    data: result,
    totalPages,
    totalDoc,
    message: "Orders fetched successfully",
  });
});

module.exports = router;
