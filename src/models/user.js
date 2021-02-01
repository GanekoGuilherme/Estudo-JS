const mongoose = require("../database");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;

const user = new Schema({
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    type:{
        type: Number,
        required:true
    },
    companies: [{
        company_id: {type: Schema.ObjectId, ref:'company', required: true},
        role: {type: Number, required: true},
    }]
});

user.pre('save', async function (next) {
    this.password =  await bcrypt.hash(this.password, 10);
    next();  
  });

module.exports = mongoose.model("user", user);
