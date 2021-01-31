const express = require('express');
const Teste = require('./models/teste');
const User = require('./models/user');
const Company = require('./models/company');

// import dotenv for test
require('dotenv').config();

const PORT = 3000;
const HOST = '0.0.0.0';

const app = express();
app.use(express.json());

// test env
// console.log(process.env.DB_USER);
// console.log(process.env.DB_PASS);
// console.log(process.env.DB_NAME);

// test save 'msg' in collections 'teste'
app.get('/teste/:msg', async (req, res) => {
  try {
    await Teste.create({ msg: req.params.msg });
    return res.send("msg: " + req.params.msg + " success on save!");
  } catch (error) {
    console.log(error);
    return res.send("Error on save!");
  }
});

require("./controllers/index")(app);

app.listen(PORT, HOST);