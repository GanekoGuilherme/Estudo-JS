const express = require('express');
const router = express.Router();
const Company = require('../models/company');
const auth = require('../middleware/auth');
const User = require('../models/user');

// create product and registre on company
router.post('/product', auth, async (req, res) => {
    try {
        const product = {
            company_id: req.body.company_id || '',
            name: req.body.name || '',
            services: req.body.services
        }

        // load company from DB
        const company = await Company.findOne({ _id: product.company_id });

        // validate company
        if (company == null) return res.status(404).send({ msg: "Company not found!" });

        // load user from DB
        const user = await User.findOne({ _id: req.user.idUser });

        // validate user
        if (user == null) return res.status(404).send({ msg: "User not found!" });

        // validate has permission
        let hasPermission = false;
        if (user.type != 1) {
            user.companies.forEach(element => {
                if (element.company_id == company.id) {
                    // OBS: in this case, role 0 and 1 (EMPLOYEE and MANAGER) has permission for register product
                    if (element.role == 0 || element.role == 1) {
                        hasPermission = true;
                    }
                }
            });
        }

        // validate if this account can register product (belong the company or is admin)
        if (hasPermission != true && user.type != 1) return res.status(401).send({ msg: "User does not have permission!" });

        // validate product
        // validate name
        if (product.name.length < 1 || product.name.length > 50) return res.status(400).send({ msg: "Product's name is invalid!" });
        // validate product's name repeat
        const verifyProductName = await Company.findOne({ products: { $elemMatch: { name: product.name } } });
        if (verifyProductName != null) return res.status(400).send({ msg: "Product's name is not disponible!" });

        // validate services
        let isServicesNameOk = true;
        let isServicesValueOk = true;
        let isServicesNameNotRepeat = true;
        var mapeamento = [];
        if (product.services != null && product.services.length > 0) {
            product.services.forEach(service => {
                // validate service's name
                if (service.name == null || service.name.length < 1) isServicesNameOk = false;

                // validate service's value
                // var maskDecimal = "/^[-+]?[0-9]+\.[0-9]+$/";            
                if (service.value == null || service.value < 0.00) isServicesValueOk = false;

                // validate service's name repeat
                if (mapeamento[service.name] != null) isServicesNameNotRepeat = false;
                mapeamento[service.name] = 1;
            });
        }

        // ends registration with error
        if (!isServicesNameNotRepeat) return res.status(400).send({ msg: "There are service's name repeat!" });
        if (!isServicesNameOk) return res.status(400).send({ msg: "Service's name is invalid!" });
        if (!isServicesValueOk) return res.status(400).send({ msg: "Service's value is invalid!" });

        // update company with the new product
        await Company.updateOne({ _id: product.company_id }, { $push: { products: [{ name: product.name, services: product.services }] } });
        data = await Company.findOne({ _id: product.company_id });
        return res.status(200).send({ msg: "Product registred!", data: data });
    } catch (error) {        
        return res.status(400).send({ msg: "Product registration failure!" });
    }
});

// consult products (and services) by company
router.get('/products_by_company/:id', auth, async (req, res) => {
    try {
        // load company from DB
        const company = await Company.findOne({ _id: req.params.id });

        // validate company
        if (company == null) return res.status(404).send({ msg: "Company not found!" });

        // load user from DB
        const user = await User.findById(req.user.idUser);

        // validate has permission
        let hasPermission = false;
        if (user.type != 1) {
            user.companies.forEach(element => {
                if (element.company_id == company.id) {
                    // OBS: in this case, role 0 and 1 (EMPLOYEE and MANAGER) has permission for register product
                    if (element.role == 0 || element.role == 1) {
                        hasPermission = true;
                    }
                }
            });
        }

        // validate if this account can consult products (belong the company or is admin)
        if (hasPermission != true && user.type != 1) return res.status(401).send({ msg: "User does not have permission!" });
        
        // consult product (and services)
        data = await Company.findOne({ _id: req.params.id });
        return res.status(200).send({ data: data });
    } catch (error) {
        return res.status(400).send({ msg: "Consult products failed!" });
    }
});

// consult products (and services) by product's id
router.get('/product/:id', auth, async (req, res) => {
    try {
        // load company from DB        
        const company = await Company.findOne({ products: { $elemMatch: { _id: req.params.id } } });
        
        // validate company
        if (company == null) return res.status(404).send({ msg: "Product not found!" });

        // load user from DB
        const user = await User.findById(req.user.idUser);

        // validate has permission
        let hasPermission = false;
        if (user.type != 1) {
            user.companies.forEach(element => {
                if (element.company_id == company.id) {
                    // OBS: in this case, role 0 and 1 (EMPLOYEE and MANAGER) has permission for register product
                    if (element.role == 0 || element.role == 1) {
                        hasPermission = true;
                    }
                }
            });
        }

        // validate if this account can consult products (belong the company or is admin)
        if (hasPermission != true && user.type != 1) return res.status(401).send({ msg: "User does not have permission!" });
        
        // consult product (and services)
        var data;        
        company.products.forEach(element => {
            if(element._id == req.params.id) data = element;            
        });
        return res.status(200).send({ data: data });
    } catch (error) {        
        return res.status(400).send({ msg: "Consult products failed!" });
    }
});

// consult all product (restrict for adm)
router.get('/product_all', auth, async (req, res) => {
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
        
        // load products from companies
        let products = [];
        
        companies.forEach(company => {
            company.products.forEach(product => {                
                // products.push({company: company.name, cnpj: company.cnpj, product: product});    // this line show (company's name, cnpj and products)
                products.push({product: product});  // this line show only products
            });
        }); 

        if (products == null || products.length < 1) return res.status(404).send({ msg: "There aren't products!" });

        // return companies
        return res.status(200).send({ products });
    } catch (error) {
        return res.status(400).send({ msg: "Consult product failed!" });
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

// update company
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
            // update user's documents with company
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
        return res.status(400).send({ msg: "Deleted company failed!" });
    }
});

module.exports = (app) => app.use("/api", router);