const mongoose = require('mongoose');

const logSchema2 = new mongoose.Schema({
    path: { type: String, required: true },
    timestamp: { type: String, required: true }
});

const Log2 = mongoose.model('Log2', logSchema2);

module.exports = Log2;