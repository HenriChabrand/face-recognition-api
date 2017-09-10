//const forEach = require('async-foreach').forEach;
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const mcf = require(__dirname + '/src/microsoft-cognitive-face.js');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});


app.post('/webhook', (req, res) => {  
  try{
    
    var body = req.body;
    console.log("body",body);
    
    mcf.detect(body.imageUrl, function(faceIds){
      res.send(faceIds);      
    })    
    
  }catch(err){
    console.log(err)
  }
 
});



