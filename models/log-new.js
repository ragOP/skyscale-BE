const mongoose = require('mongoose');

const logSchema3 = new mongoose.Schema({
    path: { type: String, required: true },
    timestamp: { type: String, required: true }
});

const Log3 = mongoose.model('Log3', logSchema3);

module.exports = Log3;