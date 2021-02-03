const express = require('express');
const router = express.Router();
const Company = require('../models/company');
const auth = require('../middleware/auth');
const User = require('../models/user');

// create service and registre on product
router.post('/service', auth, async (req, res) => {
    try {
        const service = {
            product_id: req.body.product_id || '',
            name: req.body.name || '',
            description: req.body.description || '',
            value: req.body.value
        }

        // load company from DB
        const company = await Company.findOne({ products: { $elemMatch: { _id: service.product_id } } });

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
                    // OBS: in this case, role 0 and 1 (EMPLOYEE and MANAGER) has permission for register service
                    if (element.role == 0 || element.role == 1) {
                        hasPermission = true;
                    }
                }
            });
        }

        // validate if this account can register service (belong the company or is admin)
        if (hasPermission != true && user.type != 1) return res.status(401).send({ msg: "User does not have permission!" });

        // validate services
        let isServicesNameOk = true;
        let isServicesValueOk = true;
        let isServicesNameNotRepeat = true;
        var mapping = [];

        // identify index of array (products)
        var index = 0;
        var indexProductCurrent = 0;
        company.products.forEach(product => {
            if (product._id == service.product_id) {
                indexProductCurrent = index;
            }
            index++;
        });

        // validate service's name
        if (service.name == null || service.name.length < 1) isServicesNameOk = false;

        // validate service's value
        // var maskDecimal = "/^[-+]?[0-9]+\.[0-9]+$/";            
        if (service.value == null || service.value < 0.00) isServicesValueOk = false;

        // validate service's name repeat
        if (company.products[indexProductCurrent].services != null && company.products[indexProductCurrent].services.length > 0) {
            company.products[indexProductCurrent].services.forEach(serv => {
                // fill mapping for identify repeat name                
                mapping[serv.name] = 1;
            });
        }
        // verify current name
        if (mapping[service.name] != null) isServicesNameNotRepeat = false;

        // ends registration with error
        if (!isServicesNameNotRepeat) return res.status(400).send({ msg: "There are service's name repeat!" });
        if (!isServicesNameOk) return res.status(400).send({ msg: "Service's name is invalid!" });
        if (!isServicesValueOk) return res.status(400).send({ msg: "Service's value is invalid!" });

        // update company with the new service
        // find product
        Company.findOne({ _id: company._id }).then(doc => {
            // get element for change
            item = doc.products.id(service.product_id);
            // push service
            item["services"].push({ name: service.name, description: service.description, value: service.value });
            // save alterations
            doc.save();
            return res.status(200).send({ msg: "Service registred!", data: doc.products[indexProductCurrent] });
        }).catch(err => {
            return res.status(400).send({ msg: "Service registred failed!" });
        });
    } catch (error) {
        return res.status(400).send({ msg: "Service registred failure!" });
    }
});

// consult service by company
router.get('/services_by_company/:id', auth, async (req, res) => {
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

        // validate if this account can consult services (belong the company or is admin)
        if (hasPermission != true && user.type != 1) return res.status(401).send({ msg: "User does not have permission!" });

        // consult services
        dataRaw = await Company.findOne({ _id: req.params.id });
        data = [];
        dataRaw.products.forEach(element => {
            data.push(element.services);
        });
        return res.status(200).send({ data: data });
    } catch (error) {
        return res.status(400).send({ msg: "Consult service failed!" });
    }
});

// consult services by service's id
router.get('/service/:id', auth, async (req, res) => {
    try {
        // load company from DB        
        const company = await Company.findOne({ 'products.services._id': req.params.id });

        // validate company
        if (company == null) return res.status(404).send({ msg: "Service not found!" });

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

        // validate if this account can consult services (belong the company or is admin)
        if (hasPermission != true && user.type != 1) return res.status(401).send({ msg: "User does not have permission!" });

        // consult service
        var data;
        company.products.forEach(element => {
            element.services.forEach(service => {
                if (service._id == req.params.id) data = service;
            });
        });
        return res.status(200).send({ data: data });
    } catch (error) {
        return res.status(400).send({ msg: "Consult service failed!" });
    }
});

// consult all services (restrict for adm)
router.get('/service_all', auth, async (req, res) => {
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
        let services = [];

        companies.forEach(company => {
            company.products.forEach(product => {
                // products.push({company: company.name, cnpj: company.cnpj, product: product});    // this line show (company's name, cnpj and products)
                services.push({ service: product.services });  // this line show only services
            });
        });

        if (services == null || services.length < 1) return res.status(404).send({ msg: "There aren't services!" });

        // return companies
        return res.status(200).send({ services });
    } catch (error) {
        return res.status(400).send({ msg: "Consult services failed!" });
    }
});

// consult all services belong this user (auth)
router.get('/service_own', auth, async (req, res) => {
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
        let services = [];

        companies.forEach(company => {
            company.products.forEach(product => {
                // products.push({company: company.name, cnpj: company.cnpj, product: product});    // this line show (company's name, cnpj and products)
                services.push({ service: product.services });  // this line show only services
            });
        });

        if (services == null || services.length < 1) return res.status(404).send({ msg: "There aren't services!" });

        // return companies
        return res.status(200).send({ services });
    } catch (error) {
        return res.status(400).send({ msg: "Consult services failed!" });
    }
});

// update service
router.put('/service/:id', auth, async (req, res) => {
    try {
        // load company from body
        const updateService = {
            name: req.body.name || '',
            description: req.body.description || '',
            value: req.body.value
        };

        // load company from DB        
        const company = await Company.findOne({ 'products.services._id': req.params.id });

        // validate company
        if (company == null) return res.status(404).send({ msg: "Service not found!" });

        // load original service
        let originalService = null;
        var product_id = 0;
        company.products.forEach(product => {
            product.services.forEach(serv => {
                if (serv._id == req.params.id) {
                    originalService = serv;
                    product_id = product._id;
                }
            });
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

        // validate service's name
        if (updateService.name.length < 1) return res.status(400).send({ msg: "Service's name is invalid!" });        
        // validate service's name repeat
        if (updateService.name != originalService.name) {
            const verifyServiceName = await Company.findOne({ 'products.services.name': updateService.name });
            if (verifyServiceName != null) return res.status(400).send({ msg: "Service's name is not disponible!" });

            // update service (local)
            originalService.name = updateService.name;
        }

        // validate service's descriptions
        if(updateService.description != null && updateService.description.length > 0){
            // verify if service's descriptions changes
            if(updateService.description != originalService.description) originalService.description = updateService.description;
        }

        // validate service's value      
        if (updateService.value < 0.00) return res.status(400).send({ msg: "Service's value is invalid!" });
        // verify if service's value changes
        if(updateService.value != null && updateService.value != originalService.value) originalService.value = updateService.value;

        // find service
        Company.findOne({ _id: company._id }).then(doc => {
            // get element for change
            item = doc.products.id(product_id);

            // identify index for update
            let index = 0;
            let indexUpdate = 0;
            item["services"].forEach(element => {
                if (element._id == req.params.id) {
                    indexUpdate = index;
                }
                index++;
            });

            // update services
            item["services"][indexUpdate].name = originalService.name; 
            item["services"][indexUpdate].description = originalService.description;
            item["services"][indexUpdate].value = originalService.value;

            // save alterations
            doc.save();
            return res.status(200).send({ msg: "Service registred!", data: originalService });
        }).catch(err => {
            return res.status(400).send({ msg: "Update service failed!" });
        });
    } catch (error) {
        return res.status(400).send({ msg: "Update service failed!" });
    }
});

// delete service
router.delete('/service/:id', auth, async (req, res) => {
    try {
        // load company from DB        
        const company = await Company.findOne({ 'products.services._id': req.params.id });

        // validate company
        if (company == null) return res.status(404).send({ msg: "Service not found!" });

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

        // validate if this account can delete service (belong the company or is admin)
        if (hasPermission != true && user.type != 1) return res.status(401).send({ msg: "User does not have permission!" });

        // identify product's id
        var product_id = 0;
        company.products.forEach(product => {
            product.services.forEach(serv => {
                if (serv._id == req.params.id) {
                    originalService = serv;
                    product_id = product._id;
                }
            });
        });

        // update array (services) from company (without the current service)
        // find service
        Company.findOne({ _id: company._id }).then(doc => {
            // get element for change
            item = doc.products.id(product_id);

            // remove services
            item["services"].remove(req.params.id);

            // save alterations
            doc.save();
            return res.status(200).send({ msg: "Service deleted!"});
        }).catch(err => {            
            return res.status(400).send({ msg: "Delete service failed!" });
        });
    } catch (error) {
        return res.status(400).send({ msg: "Deleted service failed!" });
    }
});

module.exports = (app) => app.use("/api", router);