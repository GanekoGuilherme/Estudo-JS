const mongoose = require("../database");
const Schema = mongoose.Schema;

const user = new Schema({
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    companies: [{
        company_id: {type: Schema.ObjectId, ref:'company', required: true},
        role: {type: Number, required: true},
    }]
});

module.exports = mongoose.model("user", user);
