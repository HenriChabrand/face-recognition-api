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
          //res.send(cast);
        })
      })      
    }else if(contentType == "tvshow"){      
      tmdb.getTvshowId(body.title, function(tvshowId){
        tmdb.getTvshowSECast(tvshowId, body.season, body.episode, function(cast){
          forEach(cast, function(tmdb_actor, index, arr) {
            var query = {tmdb_actor_id:tmdb_actor.id};
            mLab.getOnce(query, function(actor_data) {
              if(actor_data){
                console.log("Existing: ", actor_data.tmdb_actor_name)
              }else{
                console.log("notExiting: ", tmdb_actor.name)  
                
                var faceListId = 'whatshisface';
                var imgUrl = 'https://image.tmdb.org/t/p/w500/' + tmdb_actor.profile_path;
                var userData = tmdb_actor.id;
                
                mcf.addFaceToList(faceListId, imgUrl, userData, function(mcs_data) {
                  
                  if(mcs_data != null){
                    var model = {
                        "persistedFaceId": mcs_data.persistedFaceId,
                        "tmdb_actor_id": tmdb_actor.id,
                        "tmdb_actor_name": tmdb_actor.name,
                        "tmdb_actor_img_short_url": tmdb_actor.profile_path,
                        "tmdb_actor_img_url": "https://image.tmdb.org/t/p/w500/" + tmdb_actor.profile_path
                    };

                    console.log("created: ", model)  

                    mLab.save(model, function(test) {
                       console.log("saved: ", test)  
                    })    
                  }
                })
              }
            })            
          });    
        })
      })     
    }else{
       //res.send("Content not valide."); 
    }
    
    
    //Get temp face id
    mcf.detect(body.img64, function(list_tmp_face) {
      //console.log("list_tmp_face: ",list_tmp_face)  
      forEach(list_tmp_face, function(tmp_face, index, arr) {
        //console.log("tmp_face: ",tmp_face)  
        mcf.findSimilar('whatshisface', tmp_face.faceId, function(match) {
          console.log("match: ",match)  
          var query = {persistedFaceId: match.persistedFaceId};
          mLab.getOnce(query, function(actor_data) {
            console.log("Found: ", actor_data.tmdb_actor_name)  
          })
        })
      })            
    });
    
    
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




