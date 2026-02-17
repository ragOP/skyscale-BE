const express = require("express");
const { route } = require("../case");
const Log = require("../../models/log");
const router = express.Router();

router.post("/log-path", async (req, res) => {
    try {
        const { path } = req.body;
        if (!path) {
            return res.status(400).json({ error: "Path is required" });
        }
        const logEntry = new Log({ path });
        await logEntry.save();
        return res.status(200).json({ success: true, data: logEntry });
    } catch (error) {
        console.log("log-path error:", error);
        return res.status(500).json({ error: error.message });
    }
});

router.get("/get-logs", async (req, res) => {
    try {
        const logs = await Log.find({}).countDocuments();
        return res.status(200).json({ success: true, data: logs });
    } catch (error) {
        console.log("get-logs error:", error);
        return res.status(500).json({ error: error.message });
    }
});

router.get("/get-log-by-path", async (req, res) => {
    try {
        const { path } = req.query;

        if (!path) {
            return res.status(400).json({ success: false, message: "Path is required" });
        }

        const count = await Log.countDocuments({ path });

        return res.status(200).json({ success: true, data: count });
    } catch (error) {
        console.log("get-log-by-path error:", error);
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;