const express = require("express");
const caseModel = require("../../models/caseModel");
const router = express.Router();

router.post("/create-record", async (req, res) => {
    const {name, phoneNumber, score} = req.body;
    try {
        const payload = {name, phoneNumber, score};
        const record = await caseModel.create(payload);
        return res.status(200).json({
            success: true,
            data: record,
        });
    } catch (error) {
        console.error("create-record error:", error);
        return res.status(500).json({ error: error.message });
    }
});

router.get("/get-leaderboard", async (req, res) => {
    const {page = 1, limit = 20} = req.query;
    try {
        const records = await caseModel.find({}).sort({ score: -1 }).skip((page - 1) * limit).limit(limit);
        return res.status(200).json({
            success: true,
            data: records,
        });
    } catch (error) {
        console.error("get-leaderboard error:", error);
        return res.status(500).json({ error: error.message });
    }
});
