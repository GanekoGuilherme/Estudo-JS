const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req,res,next) => {
    try {
        // get token
        const [bearer,token] = req.headers.authorization.split(" ");

        // verify token
        const decode = jwt.verify(token, process.env.JWT_KEY);
        req.user = decode;
        next();    
    } catch (error) {
        console.log(error);
        return res.status(401).send({msg: "Authentication failure!"});
    }    
};