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
    // validate cnpj repeat
    const verifyCompanyCNPJ = await Company.findOne({ cnpj: company.cnpj });
    if (verifyCompanyCNPJ != null) return res.status(400).send({ msg: "Company's CNPJ is not disponible!" });

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

    return res.status(200).send({ msg: "Company registred!", data: companyCreated });
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
    if (user.type != 1) return res.status(401).send({ msg: "User does not have permission!" });

    // load companies from DB
    const companies = await Company.find();

    // validate company 
    if (companies == null || companies.length < 1) return res.status(404).send({ msg: "There aren't companies!" });

    // return companies
    return res.status(200).send({ companies });
  } catch (error) {
    return res.status(400).send({ msg: "Consult company failed!" });
  }
});

// update company
router.put('/company/:id', auth, async (req, res) => {
  try {
    // load company from body
    const updateCompany = {
      name: req.body.name || "",
      cnpj: req.body.cnpj || ""
    };

    // load user from DB
    const user = await User.findById(req.user.idUser);

    // load company from DB
    const originalCompany = await Company.findById(req.params.id);

    // verify user
    if (user == null) return res.status(404).send({ msg: "User not found!" });

    // verify is user's MANAGER
    let findCompany = false;
    user.companies.forEach(element => {
      // find
      if (element.company_id == req.params.id) {
        findCompany = true;
      }
    });

    // verify user is not adm and didn't find company
    if (user.type != 1 && findCompany == false) return res.status(404).send({ msg: "Company not found!" });

    // validate company
    // validate name
    if (updateCompany.name.length > 100) return res.status(400).send({ msg: "Company's name is invalid!" });
    // overwrite company's name
    if (updateCompany.name.length > 0 && updateCompany.name != originalCompany.name) originalCompany.name = updateCompany.name;

    // validate cnpj
    if (updateCompany.cnpj.length > 14) return res.status(400).send({ msg: "Company's CNPJ is invalid!" });
    if (updateCompany.cnpj.length > 0 && updateCompany.cnpj != originalCompany.cnpj) {
      // verify is new company's CNPJ valid
      const verifyCompanyCNPJ = await Company.findOne({ cnpj: updateCompany.cnpj });
      if (verifyCompanyCNPJ != null) return res.status(400).send({ msg: "Company's cnpj is not disponible!" });
      originalCompany.cnpj = updateCompany.cnpj;
    }

    // update company
    await Company.updateOne({ _id: originalCompany._id }, originalCompany);
    return res.status(200).send({ msg: "Company updated!", data: originalCompany });
  } catch (error) {
    return res.status(400).send({ msg: "Consult company failed!" });
  }
});

// delete company
router.delete('/company/:id', auth, async (req, res) => {
  try {

    // load user from DB
    const user = await User.findById(req.user.idUser);
    // verify user
    if (user == null) return res.status(404).send({ msg: "User not found!" });

    // load company from DB
    const originalCompany = await Company.findById(req.params.id);
    
    // validate company
    if (originalCompany == null) return res.status(404).send({ msg: "Company not found!" });

    //verify delete own company
    let findCompany = false;
    user.companies.forEach(element => {
      if (element.company_id == req.params.id) findCompany = true;
    });

    // verify user is not adm and didn't find company
    if (user.type != 1 && findCompany == false) return res.status(404).send({ msg: "Company not found!" });

    // delete own company
    if (findCompany) {
      // update array companies from users
      await User.updateOne({ _id: req.user.idUser }, { $pull: { companies: { company_id: req.params.id } } });
    } else {
      // delete another company
      // find user's linked with company    
      const usersNeedUpdate = await User.findOne({ companies: { $elemMatch: { company_id: req.params.id } } });
      await User.updateOne({ _id: usersNeedUpdate._id }, { $pull: { companies: { company_id: req.params.id } } });
    }

    // delete company from DB
    await Company.deleteOne({ _id: req.params.id });
    return res.status(200).send({ msg: "Company deleted!" });
  } catch (error) {
    return res.status(400).send({ msg: "Consult company failed!" });
  }
});

module.exports = (app) => app.use("/api", router);