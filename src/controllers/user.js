const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.post('/user', async (req, res) => {
    try {
      const user = {
        name: req.body.name || '',
        password: req.body.password || ''
      }
  
      // validate User's name
      if (user.name.length < 1) return res.status(400).send({ msg: "User's name is empty!" });
  
      // validate User's password
      if (user.password.length < 1) return res.status(400).send({ msg: "User's password is empty!" });
      await User.create(user);
      return res.status(200).send({ msg: "User registred!" });
    } catch (error) {
      return res.status(400).send({ msg: "There are fields invalids!" });
    }
  });

  module.exports = (app) => app.use("/api", router);