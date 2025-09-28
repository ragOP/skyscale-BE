const express = require('express');
const authModel = require('../../models/authModel');
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

module.exports = router;
