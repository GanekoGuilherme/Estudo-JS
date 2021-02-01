const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require('dotenv').config();

// autentic
router.post('/login', async (req, res) => {
    try {
      const user = {
        name: req.body.name || '',
        password: req.body.password || ''
      }
  
      // validate User's name
      if (user.name.length < 1) return res.status(400).send({ msg: "User's name is empty!" });
  
      // validate User's password
      if (user.password.length < 1) return res.status(400).send({ msg: "User's password is empty!" });

      // consult MongoDB
      const resp = await User.findOne({name:user.name}).select('+password');
      
      console.log(resp);

      // validate user's name
      if(resp == null) return res.status(401).send({ msg: "Authentication failure!" });

      // validate password
      bcrypt.compare(user.password,resp.password, (error, result) => {
        // return failure authentication
        if(error) return res.status(401).send({msg: "Authentication failure!"});                

        // validate password
        if(result) {
          // create token
          const token = jwt.sign({
            idUser: resp._id,
            name: resp.name,
            type: resp.type
          },
          process.env.JWT_KEY,
          {
            expiresIn: "1h"
          });

          // return token with successfuly authenticated
          return res.status(200).send({msg: "Successfuly authenticated!",token: token});}

        // return failure authentication
        return res.status(401).send({msg: "Authentication failure!"});                
      });

    } catch (error) {      
      return res.status(400).send({ msg: "There are fields invalids!" });
    }
  });

  module.exports = (app) => app.use("/api", router);