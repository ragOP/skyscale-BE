const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    path: { type: String, required: true },
    timestamp: { type: String, required: true }
});

const Log = mongoose.model('Log', logSchema);

module.exports = Log;