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
            if (element._id == req.params.id) data = element;
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
                products.push({ product: product });  // this line show only products
            });
        });

        if (products == null || products.length < 1) return res.status(404).send({ msg: "There aren't products!" });

        // return companies
        return res.status(200).send({ products });
    } catch (error) {
        return res.status(400).send({ msg: "Consult product failed!" });
    }
});

// consult all product belong this user (auth)
router.get('/product_own', auth, async (req, res) => {
    try {
        // load user from DB
        const user = await User.findById(req.user.idUser);

        // verify user
        if (user == null) return res.status(404).send({ msg: "User not found!" });

        // verify user's type (adm)
        if (user.type != 1) return res.status(401).send({ msg: "User does not have permission!" });

        var companiesFilter = [];
        user.companies.forEach(element => {
            companiesFilter.push(element.company_id);
        });
        
        // load companies from DB
        const companies = await Company.find({'_id':{$in:companiesFilter}});

        // validate company 
        if (companies == null || companies.length < 1) return res.status(404).send({ msg: "There aren't companies!" });

        // load products from companies
        let products = [];

        companies.forEach(company => {
            company.products.forEach(product => {
                // products.push({company: company.name, cnpj: company.cnpj, product: product});    // this line show (company's name, cnpj and products)
                products.push({ product: product });  // this line show only products
            });
        });

        if (products == null || products.length < 1) return res.status(404).send({ msg: "There aren't products!" });

        // return companies
        return res.status(200).send({ products });
    } catch (error) {
        return res.status(400).send({ msg: "Consult product failed!" });
    }
});

// update product
router.put('/product/:id', auth, async (req, res) => {
    try {
        // load company from body
        const updateProduct = {
            name: req.body.name || "",
        };

        // load company from DB        
        const company = await Company.findOne({ products: { $elemMatch: { _id: req.params.id } } });

        // validate company
        if (company == null) return res.status(404).send({ msg: "Product not found!" });

        // load original product
        let originalProduct = null;
        company.products.forEach(product => {
            if (product._id == req.params.id) originalProduct = product;
        });

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

        // validate if this account can update products (belong the company or is admin)
        if (hasPermission != true && user.type != 1) return res.status(401).send({ msg: "User does not have permission!" });

        // validate product's name
        if (updateProduct.name.length < 1 || updateProduct.name.length > 50) return res.status(400).send({ msg: "Product's name is invalid!" });
        // validate product's name repeat
        if (updateProduct.name != originalProduct.name) {
            const verifyProductName = await Company.findOne({ products: { $elemMatch: { name: updateProduct.name } } });
            if (verifyProductName != null) return res.status(400).send({ msg: "Product's name is not disponible!" });

            // update product
            originalProduct.name = updateProduct.name;

            // find product
            Company.findOne({ _id: company._id }).then(doc => {
                item = doc.products.id(req.params.id);  // get element for change
                item["name"] = originalProduct.name;    // overwrite product's name
                doc.save();                             // save alterations
            }).catch(err => {
                return res.status(400).send({ msg: "Update product failed!" });
            });

            // return product updated
            return res.status(200).send({ msg: "Product updated!", data: originalProduct });
        } else {
            return res.status(400).send({ msg: "No product changes!" });
        }
    } catch (error) {        
        return res.status(400).send({ msg: "Update product failed!" });
    }
});

// delete product
router.delete('/product/:id', auth, async (req, res) => {
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

        // validate if this account can delete products (belong the company or is admin)
        if (hasPermission != true && user.type != 1) return res.status(401).send({ msg: "User does not have permission!" });

        // update array (products) from company (without the current product)
        await Company.updateOne({ _id: company._id }, { $pull: { products: { _id: req.params.id } } });
        
        return res.status(200).send({ msg: "Product deleted!"});
    } catch (error) {
        return res.status(400).send({ msg: "Deleted company failed!" });
    }
});

module.exports = (app) => app.use("/api", router);