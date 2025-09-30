const express = require('express');
const authModel = require('../../models/authModel');
const orderModel = require('../../models/orderModel');
const orderMode2 = require('../../models/oderModel2');
const orderMode3 = require('../../models/oderModel3');
const orderMode7 = require('../../models/orderModel7');
const abondentOrder2 = require('../../models/abondentOrder2');
const oderModel3ABD = require('../../models/oderModel3-abd');
const orderModel7ABD = require('../../models/orderModel7-abd');
const passwordModel = require('../../models/passwords');

const router = express.Router();

router.post('/register', async (req, res) => {
    const { email, password, name, role } = req.body;
    const response = await authModel.create({ email, password, name, role });
    if(!response) {
        return res.status(400).json({ message: 'Registration failed' });
    }
    return res.status(201).json({ message: 'User registered successfully', user: response });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await authModel.findOne({ email, password });
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    return res.status(200).json({ message: 'Login successful', user });
});

router.put('/update/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const response = await authModel.findByIdAndUpdate(id, updates, { new: true });
    if (!response) {
        return res.status(400).json({ message: 'Update failed' });
    }
    return res.status(200).json({ message: 'User updated successfully', user: response });
});

router.get('/get-all', async (req, res) => {
    const users = await authModel.find();
    return res.status(200).json({ message: 'Users retrieved successfully', users });
});

router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;
    const response = await authModel.findByIdAndDelete(id);
    if (!response) {
        return res.status(400).json({ message: 'Delete failed' });
    }
    return res.status(200).json({ message: 'User deleted successfully', user: response });
});

router.get('/get/:id', async (req, res) => {
    const { id } = req.params;
    const user = await authModel.findById(id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ message: 'User retrieved successfully', user });
});

router.route("/get-stats/record").get(async (req, res) => {
    try {
        const query = {
            createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 1)) }
        };
        const lander1 = await orderModel.find(query).select("createdAt");
        const lander1Count = lander1.length;
        const lander2 = await orderMode2.find(query).select("createdAt");
        const lander2Count = lander2.length;
        const lander3 = await orderMode3.find(query).select("createdAt");
        const lander3Count = lander3.length;
        const lander7 = await orderMode7.find(query).select("createdAt");
        const lander7Count = lander7.length;
        return res.status(200).json({ message: 'User statistics retrieved successfully', stats: { lander1:{
            count: lander1Count,
            title: "Astra Soul",
            lastOrderTime: lander1.length ? lander1[lander1.length - 1].createdAt : null
        }, lander2: {
            count: lander2Count,
            title: "AstraSoul Love",
            lastOrderTime: lander2.length ? lander2[lander2.length - 1].createdAt : null
        }, lander3: {
            count: lander3Count,
            title: "Easy Astro",
            lastOrderTime: lander3.length ? lander3[lander3.length - 1].createdAt : null
        }, lander7: {
            count: lander7Count,
            title: "Easy Astro Exp",
            lastOrderTime: lander7.length ? lander7[lander7.length - 1].createdAt : null
        }, lander8: {
            count: lander3Count,
            title: "Soul Mate Sketch",
            lastOrderTime: lander3.length ? lander3[lander3.length - 1].createdAt : null
        } } });
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving user statistics', error });
    }
});

router.route("/get-stats/abandoned").get(async (req, res) => {
    try {
        const query = {
            createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 1)) }
        };
        const lander2 = await abondentOrder2.find(query).select("createdAt");
        const lander2Count = lander2.length;
        const lander3 = await oderModel3ABD.find(query).select("createdAt");
        const lander3Count = lander3.length;
        const lander7 = await orderModel7ABD.find(query).select("createdAt");
        const lander7Count = lander7.length;
        console.log("lander7", lander7);
        return res.status(200).json({ message: 'User statistics retrieved successfully', stats: { lander2: {
            count: lander2Count,
            title: "AstraSoul Love",
            lastOrderTime: lander2.length ? lander2[lander2.length - 1].createdAt : null
        }, lander3: {
            count: lander3Count,
            title: "Easy Astro",
            lastOrderTime: lander3.length ? lander3[lander3.length - 1].createdAt : null
        }, lander7: {
            count: lander7Count,
            title: "Easy Astro Exp",
            lastOrderTime: lander7.length ? lander7[lander7.length - 1].createdAt : null
        }, lander8: {
            count: lander3Count,
            title: "Soul Mate Sketch",
            lastOrderTime: lander3.length ? lander3[lander3.length - 1].createdAt : null
        } } });
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving user statistics', error });
    }
});

router.route("/create-password").post(async (req, res) => {
    try {
        const { title, id, password, remarks, others } = req.body;
        const newPassword = await passwordModel.create({ title, id, password, remarks, others });
        return res.status(201).json({ message: 'Password created successfully', password: newPassword });
    } catch (error) {
        return res.status(500).json({ message: 'Error creating password', error });
    }
});

router.route("/get-passwords").get(async (req, res) => {
    try {
        const passwords = await passwordModel.find();
        return res.status(200).json({ message: 'Passwords retrieved successfully', passwords });
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving passwords', error });
    }
});

router.route("/delete-password/:id").delete(async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPassword = await passwordModel.findByIdAndDelete(id);
        if (!deletedPassword) {
            return res.status(404).json({ message: 'Password not found' });
        }
        return res.status(200).json({ message: 'Password deleted successfully', password: deletedPassword });
    } catch (error) {
        return res.status(500).json({ message: 'Error deleting password', error });
    }   
});

router.route("/update-password/:id").put(async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedPassword = await passwordModel.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedPassword) {
            return res.status(404).json({ message: 'Password not found' });
        }   
        return res.status(200).json({ message: 'Password updated successfully', password: updatedPassword });
    } catch (error) {
        return res.status(500).json({ message: 'Error updating password', error });
    }   
});

module.exports = router;
