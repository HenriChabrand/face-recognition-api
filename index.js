//const forEach = require('async-foreach').forEach;
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const forEach = require('async-foreach').forEach;

const mcf = require(__dirname + '/src/microsoft-cognitive-face.js');
const mLab = require(__dirname + '/src/mLab.js');
const tmdb = require(__dirname + '/src/tmdb.js');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});


app.post('/webhook', (req, res) => {  
  try{
    
    var body = req.body;
    
    //Sort content type 
    var contentType = body.type;
    
    //Get cast
    if(contentType == "movie"){
      tmdb.getMovieId(body.title, function(moiveId){
        tmdb.getMovieCast(moiveId, function(cast){
          res.send(cast);
        })
      })      
    }else if(contentType == "tvshow"){      
      tmdb.getTvshowId(body.title, function(tvshowId){
        tmdb.getTvshowSECast(tvshowId, body.season, body.episode, function(cast){
          forEach(cast, function(tmdb_actor, index, arr) {
            var query = {tmdb_actor_id:tmdb_actor.id};
            mLab.getOnce(query, function(actor_data) {
              if(actor_data){
                console.log("Existing: ", actor_data.name)                
              }else{
                console.log("notExiting: ", tmdb_actor.name)                 
              }
            })            
          });
          
          res.send(cast);
        })
      })     
    }else{
       res.send("Content not valide."); 
    }
    
    /*
    mLab.save(body.json,function(array){
      res.send(array);      
    }) 
    */
    
    /*mcf.findSimilar(body.faceListId,body.tmpFaceId,function(faceId){
      res.send(faceId);      
    })   */     
    /*
    mcf.detect(body.imageUrl, function(faceIds){
      res.send(faceIds);      
    })        
    */
    
  }catch(err){
    console.log(err)
  }
 
});




