const mongoose = require("../database");
const Schema = mongoose.Schema;

const service = new Schema({
    name: {
        type: String,
        required: true,
    },
    description:{
        type: String
    },
    value:{
        type: Number,
        required: true,
    }
});

const product = new Schema({
    name: {
        type: String,
        required: true,
    },
    services:[service]
});

const company = new Schema({
    name: {
        type: String,
        required: true,
    },
    cnpj: {
        type: String,
        required: true,
    },
    products: [product]
});

module.exports = mongoose.model("company", company);
