const mongoose = require("../database");
const Schema = mongoose.Schema;

const teste = new Schema({
  msg: {
    type: String,
    required: true,
  }
});

module.exports = mongoose.model("teste", teste);
