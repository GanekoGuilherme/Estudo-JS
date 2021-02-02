const express = require('express');
const router = express.Router();
const Company = require('../models/company');
const auth = require('../middleware/auth');
const User = require('../models/user');

// create company (products and services are not obrigated) and registre on user
router.post('/company', auth, async (req, res) => {
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
    if (company.products != null && company.products.length > 0) {
      company.products.forEach(product => {

        // validate product's name
        if (product.name == null || product.name.length < 1 || product.name.length > 50) isProductNameOk = false;

        // validate services
        if (product.services != null && product.services.length > 0) {
          product.services.forEach(service => {
            // validate service's name
            if (service.name == null || service.name.length < 1) isServicesNameOk = false;

            // validate product's value
            // var maskDecimal = "/^[-+]?[0-9]+\.[0-9]+$/";            
            if (service.value == null || service.value < 0.00) isServicesValueOk = false;
          });
        }
      });
    }

    // ends registration with error
    if (!isProductNameOk) return res.status(400).send({ msg: "Product's name is invalid!" });
    if (!isServicesNameOk) return res.status(400).send({ msg: "Service's name is invalid!" });
    if (!isServicesValueOk) return res.status(400).send({ msg: "Service's value is invalid!" });

    // register on DB company
    const companyCreated = await Company.create(company);
    // update user's documents with company
    await User.updateOne({ _id: company.token.idUser }, { $push: { companies: [{ company_id: companyCreated._id, role: 1 }] } });

    return res.status(200).send({ msg: "Company registred!" });
  } catch (error) {
    return res.status(400).send({ msg: "Company registration failure!" });
  }
});

// consult companies (and products/services)
router.get('/company', auth, async (req, res) => {
  try {
    // load user from DB
    const user = await User.findById(req.user.idUser);

    // verify user
    if (user == null) return res.status(404).send({ msg: "User not found!" });

    // verify if user has companies
    if (user.companies == null || user.companies.length < 1) return res.status(404).send({ msg: "Companies not found!" });

    var companies = []; //resp of consult
    var count = 1;      //count for loop
    user.companies.forEach(async element => {
      // consult company for id
      const consultCompany = await Company.find({ _id: element.company_id });

      // add in to array
      companies.push({ company: consultCompany, role: element.role == 1 ? 'MANAGER' : 'EMPLOYEE' });

      if (count == user.companies.length) return res.status(200).send({ companies });
      count++;
    });
  } catch (error) {
    return res.status(400).send({ msg: "Consult companies failed!" });
  }
});

// consult one company (and products/services)
router.get('/company/:id', auth, async (req, res) => {
  try {
    // load user from DB
    const user = await User.findById(req.user.idUser);
    
    // verify user
    if (user == null) return res.status(404).send({ msg: "User not found!" });

    // verify user's type (adm)
    if (user.type) {
      // load company from DB
      const company = await Company.findById(req.params.id);      

      // validate company
      if (company == null) return res.status(404).send({ msg: "Company not found!" });
      return res.status(200).send({ company });
    }

    // verify if user has companies
    if (user.companies == null || user.companies.length < 1) return res.status(404).send({ msg: "Company not found!" });
    user.companies.forEach(async element => {
      // compare user's companies with request
      if (element.company_id == req.params.id) {
        const company = await Company.find({ _id: element.company_id });

        // validate company
        if (company == null) return res.status(404).send({ msg: "Company not found!" });
        return res.status(200).send({ company });
      }
    });

  } catch (error) {    
    return res.status(400).send({ msg: "Consult company failed!" });
  }
});

// consult all company (restrict for adm)
router.get('/company_all', auth, async (req, res) => {
  try {
    // load user from DB
    const user = await User.findById(req.user.idUser);
    
    // verify user
    if (user == null) return res.status(404).send({ msg: "User not found!" });

    // verify user's type (adm)
    if (user.type != 1) return res.status(401).send({ msg: "User has not permission!" });

    // load companies from DB
    const companies = await Company.find();

    // validate company 
    if(companies == null || companies.length < 1) return res.status(404).send({ msg: "There aren't companies!" });

    // return companies
    return res.status(200).send({ companies });
  } catch (error) {    
    return res.status(400).send({ msg: "Consult company failed!" });
  }
});

module.exports = (app) => app.use("/api", router);