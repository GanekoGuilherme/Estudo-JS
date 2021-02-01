const express = require('express');
const router = express.Router();
const Company = require('../models/company');
const auth = require('../middleware/auth');
const User = require('../models/user');

// create company (products and services are not obrigated) and registre on user
router.post('/company',auth, async (req, res) => {
    try {
      const company = {
        name: req.body.name || '',
        cnpj: req.body.cnpj || '',
        token: req.user || '',
        products: req.body.products
      }
  
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
  
      // ends registration with error
      if(!isProductNameOk) return res.status(400).send({ msg: "Product's name is invalid!" });  
      if(!isServicesNameOk) return res.status(400).send({ msg: "Service's name is invalid!" });
      if(!isServicesValueOk) return res.status(400).send({ msg: "Service's value is invalid!" });
  
      // register on DB company
      const companyCreated = await Company.create(company);    
      // update user's documents with company
      await User.updateOne({_id:company.token.idUser}, {$push: {companies: [{company_id: companyCreated._id, role:1}]}});

      return res.status(200).send({ msg: "Company registred!" });
    } catch (error) {
      console.log(error);
      return res.status(400).send({ msg: "Company registration failure!" });
    }
  });

  module.exports = (app) => app.use("/api", router);