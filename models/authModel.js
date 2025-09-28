const mongoose  = require('mongoose');
const schema = mongoose.Schema;

const authSchema = new schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    }, 
    role: {
        type: String,
        enum: ['admin', 'signature', 'astro'],
        default: 'admin'
    }
});

module.exports = mongoose.model('Auth', authSchema);