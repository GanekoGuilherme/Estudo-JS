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

app.post('/user', async (req, res) => {
  try {
    const user = {
      name: req.body.name || '',
      password: req.body.password || ''
    }

    if (user.name.length < 1 || user.password.length < 1) return res.status(400).send({ msg: "Name or password there are empty!" });

    await User.create(user);
    return res.status(200).send({ msg: "User registred!" });
  } catch (error) {
    return res.status(400).send({ msg: "There are fields invalids!" });
  }
});

app.post('/company', async (req, res) => {
  try {
    const company = {
      name: req.body.name || '',
      cnpj: req.body.cnpj || '',
      products: req.body.products
    }

    console.log(company);

    // validate company
    // validate name
    if (company.name.length < 1 || company.name.length > 100) return res.status(400).send({ msg: "Company's name is invalid!" });
    // validate cnpj
    if (company.cnpj.length < 1 || company.cnpj.length > 14) return res.status(400).send({ msg: "Company's CNPJ is invalid!" });

    // validate product
    let isProductNameOk = true;
    let isServicesNameOk = true;
    let isServicesValueOk = true;
    if (company.products != null && company.products.length > 0){
      company.products.forEach(product => {   

        // validate product's name
        if (product.name == null || product.name.length < 1 || product.name.length > 50) isProductNameOk = false;

        // validate services
        if(product.services != null && product.services.length > 0){
          product.services.forEach(service => {
            console.log(service);
            // validate service's name
            if(service.name == null || service.name.length < 1) isServicesNameOk = false;

            // validate product's value
            // var maskDecimal = "/^[-+]?[0-9]+\.[0-9]+$/";            
            if(service.value == null || service.value < 0.00) isServicesValueOk = false;
          });
        }
      });
    }    

    if(!isProductNameOk) return res.status(400).send({ msg: "Product's name is invalid!" });

    if(!isServicesNameOk) return res.status(400).send({ msg: "Service's name is invalid!" });
    if(!isServicesValueOk) return res.status(400).send({ msg: "Service's value is invalid!" });

    await Company.create(company);
    return res.status(200).send({ msg: "Company registred!" });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ msg: "There are fields invalids!" });
  }
});

// app.post('/company', async(req,res) => {
//   try {
//     const company = { 
//       name: req.body.name || '',
//       cnpj: req.body.cnpj || ''
//     }

//     if (company.name.length < 1 || company.name.length > 100 || company.cnpj.length < 1 || company.cnpj.length > 14) return res.status(400).send({msg: "Name or CNPJ are invalid!"});

//     await Company.create(company);
//     return res.status(200).send({ msg: "Company registred!" });
//   } catch (error){
//     console.log(error);
//     return res.status(400).send({ error: "erro" });
//   }
// });

app.listen(PORT, HOST);