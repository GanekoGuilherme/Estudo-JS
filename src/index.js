const express = require('express');
const Teste = require('./models/teste');

const PORT = 3000;
const HOST = '0.0.0.0';

const app = express();

// save 'msg' in collections 'teste'
app.get('/teste/:msg', async (req,res) => {
  try{    
    await Teste.create({msg:req.params.msg});
    return res.send("msg: "+req.params.msg+" success on save!");
  } catch (error){
    console.log(error);
    return res.send("Error on save!");
  }
});


app.listen(PORT,HOST);