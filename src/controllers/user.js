const express = require('express');
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require('../models/user');
const Company = require('../models/company');
const auth = require('../middleware/auth');

// create user
router.post('/user', async (req, res) => {
  try {
    const user = {
      name: req.body.name || '',
      password: req.body.password || '',
      type: req.body.type || 0
    }

    // validate User's name
    if (user.name.length < 1) return res.status(400).send({ msg: "User's name is empty!" });

    // validate User's repeat
    verifyUser = await User.findOne({ name: user.name });
    
    if (verifyUser != null) return res.status(400).send({ msg: "User's name is not disponible!" });

    // validate User's password
    if (user.password.length < 1) return res.status(400).send({ msg: "User's password is empty!" });

    // validate User's role (common or admin)
    if (user.type < 0 || user.type > 1) return res.status(400).send({ msg: "User's type is invalid!" });

    await User.create(user);
    return res.status(200).send({ msg: "User registred!" });
  } catch (error) {    
    return res.status(400).send({ msg: "There are fields invalids!" });
  }
});

// update user
router.put('/user', auth, async (req, res) => {
  try {
    const user = {
      name: req.body.name || '',
      password: req.body.password || '',
      type: req.body.type,
      token: req.user || ''
    }

    // load original for comparation
    const originalUser = await User.findById(user.token.idUser);

    // validate User's repeat
    // verify user's name changed    
    if (originalUser.name !== user.name) {
      // verify new user's name is valid
      verifyUser = await User.findOne({ name: user.name });
      
      if (verifyUser != null) return res.status(400).send({ msg: "User's name is not disponible!" });
      // overwrite user's name
      originalUser.name = user.name;
    }

    // validate User's password
    if (user.password.length > 0) {
      // overwrite user's password
      originalUser.password = await bcrypt.hash(user.password, 10);
    }

    // validate User's role (common or admin)
    if (user.type >= 0 && user.type <= 1) {
      // overwrite user's type
      originalUser.type = user.type;
    }

    // update user
    await User.updateOne({ _id: user.token.idUser }, originalUser);

    // reset password for security
    originalUser.password = undefined;
    return res.status(200).send({ msg: "User updated!", data: originalUser});
  } catch (error) {
    return res.status(400).send({ msg: "Update user failed!" });
  }
});

// get user (own)
router.get('/user', auth, async (req, res) => {
  try {
    // load user from DB
    const user = await User.findById(req.user.idUser);

    // return user
    return res.status(200).send({ user });
  } catch (error) {
    return res.status(400).send({ msg: "Consult user failed!" });
  }
});

// get user (all)
router.get('/user_all', auth, async (req, res) => {
  try {
    // verify user's type
    if (req.user.type != 1) return res.status(401).send({ msg: "User does not have permission!" });

    // load user from DB
    const users = await User.find();

    // return user
    return res.status(200).send({ users });
  } catch (error) {
    return res.status(400).send({ msg: "Consult failed!" });
  }
});

// delete user (own)
router.delete('/user', auth, async (req, res) => {
  try {
    const originalUser = await User.findById(req.user.idUser);
    // verify if this account has company    
    if (originalUser == null) return res.status(404).send({ msg: "User not found!" });
    if (originalUser.companies != null && originalUser.companies.length > 0) {
      // verify if this account is owner
      await originalUser.companies.forEach(async element => {
        if (element.role == 1) {
          // delete company
          await Company.deleteOne({ _id: element.company_id });
        }
      });
    }
    // delete user
    await User.deleteOne({ _id: req.user.idUser });

    return res.status(200).send({ msg: "User deleted!" });
  } catch (error) {
    return res.status(400).send({ msg: "Delete failed!" });
  }
});

// delete user (another)
router.delete('/user/:id', auth, async (req, res) => {
  try {
    // validate user's type (admin)
    if (req.user.type != 1) return res.status(401).send({ msg: "User does not have permission!" });    

    const originalUser = await User.findById(req.params.id);
    // validate user
    if (originalUser == null) return res.status(404).send({ msg: "User not found!" });

    // verify if this account has company        
    if (originalUser.companies != null && originalUser.companies.length > 0) {
      // verify if this account is owner
      await originalUser.companies.forEach(async element => {
        if (element.role == 1) {
          // delete company
          await Company.deleteOne({ _id: element.company_id });
        }
      });
    }

    // delete user
    await User.deleteOne({ _id: req.params.id });

    return res.status(200).send({ msg: "User deleted!" });
  } catch (error) {
    return res.status(400).send({ msg: "Delete failed!" });
  }
});

module.exports = (app) => app.use("/api", router);