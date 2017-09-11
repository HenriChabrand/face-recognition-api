//const forEach = require('async-foreach').forEach;
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const forEach = require('async-foreach').forEach;
const forEachAsync = require('forEachAsync').forEachAsync  

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
          forEach(cast, function(tmdb_actor, index, arr) {
            var query = {tmdb_actor_id:tmdb_actor.id};
            mLab.getOnce(query, function(actor_data) {
              if(actor_data){
                //console.log("Existing: ", actor_data.tmdb_actor_name)
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
    }else if(contentType == "tvshow"){      
      tmdb.getTvshowId(body.title, function(tvshowId){
        tmdb.getTvshowSECast(tvshowId, body.season, body.episode, function(cast){
          forEach(cast, function(tmdb_actor, index, arr) {
            var query = {tmdb_actor_id:tmdb_actor.id};
            mLab.getOnce(query, function(actor_data) {
              if(actor_data){
                //console.log("Existing: ", actor_data.tmdb_actor_name)
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
    
    
      
    /*
    
    var data = {
      title: “Game Of Thrones S03E08”,
      actors : [
      {
      name: "James Cosmo”,
      imgUrl: “https://image.tmdb.org/t/p/w150/523gSqAG9eSSNmKexFFZYh38SxL.jpg”,
      id:”2467”
      },
      {
      name: "Joe Dempsie”,
      imgUrl: “https://image.tmdb.org/t/p/w150/f5ImnMIPkNFHK1lXOolqBHpI27o.jpg,
      id:”570296”
      }
      ]
      }*/
  
    var res_list = [];
    
    mcf.detect(body.img64, function(list_tmp_face) {
      forEachAsync(list_tmp_face, function (next, tmp_face, index, array) {
          mcf.findSimilar('whatshisface', tmp_face.faceId, function(match) {
            var query = {persistedFaceId: match.persistedFaceId};
            mLab.getOnce(query, function(actor_data) {
              res_list.push(actor_data);
              next()              
            })
          })
      }).then(function () {          
          res.send(res_list);  
      });
    })
    
    
  }catch(err){
    console.log(err)
  }
 
});




