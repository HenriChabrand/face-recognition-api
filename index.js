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
    console.log(body.img64)
    //Get cast
    if(contentType == "movie"){
      tmdb.getMovieId(body.title, function(moive){
        tmdb.getMovieCast(moive.id, function(cast){
          body.title = moive.title;
          forEachAsync(cast, function (cast_next, tmdb_actor, index, array) {            
            if(tmdb_actor && tmdb_actor.profile_path!=null){     
              var query = {tmdb_actor_id: tmdb_actor.id};
              mLab.getOnce(query, function(actor_data) {
                if(!actor_data){
                  console.log("notExiting: ", tmdb_actor.name)                    
                  var faceListId = 'whatshisface';
                  var imgUrl = 'https://image.tmdb.org/t/p/w500' + tmdb_actor.profile_path;
                  var userData = tmdb_actor.id;

                  mcf.addFaceToList(faceListId, imgUrl, userData, function(mcs_data) {                  
                    if(mcs_data != null){

                      var model = {
                          "persistedFaceId": mcs_data.persistedFaceId,
                          "tmdb_actor_id": tmdb_actor.id,
                          "tmdb_actor_name": tmdb_actor.name,
                          "tmdb_actor_img_short_url": tmdb_actor.profile_path,
                          "tmdb_actor_img_url": "https://image.tmdb.org/t/p/w500" + tmdb_actor.profile_path
                      };

                      mLab.save(model, function(){
                        cast_next()
                      })    
                    }else{
                      cast_next()
                    }
                  })
                }else{
                  cast_next()
                }
              }) 
            }else{
              cast_next()
            }
          }).then(function () {   
            console.log("For each actor done!")
            var actor_match_list = [];
    
            mcf.detect(body.img64, function(list_tmp_face) {
              forEachAsync(list_tmp_face, function (next, tmp_face, index, array) {
                  mcf.findSimilar('whatshisface', tmp_face.faceId, function(match) {
                    var query = {persistedFaceId: match.persistedFaceId};
                    mLab.getOnce(query, function(actor_data) {
                      console.log("Matching Actor :",actor_data);  
                      if(actor_data!=null){
                        var actor = {
                          name: actor_data.tmdb_actor_name,
                          id: actor_data.tmdb_actor_id,
                          imgUrl: "https://image.tmdb.org/t/p/w150" + actor_data.tmdb_actor_img_short_url                
                        }
                        actor_match_list.push(actor);
                        next()              
                      }else{
                        next()
                      }
                    })
                  })
              }).then(function () {   
                  var data_out = {
                    actors : actor_match_list,
                    title: body.title
                  }
                  res.send(data_out);  
              });
            })
            
          });     
        })
      })      
    }else if(contentType == "tvshow"){      
      tmdb.getTvshowId(body.title, function(tvshow){
        tmdb.getTvshowSECast(tvshow.id, body.season, body.episode, function(cast){
          body.title = tvshow.name;
          forEachAsync(cast, function (cast_next, tmdb_actor, index, array) {            
            if(tmdb_actor && tmdb_actor.profile_path!=null){     
              var query = {tmdb_actor_id: tmdb_actor.id};
              mLab.getOnce(query, function(actor_data) {
                if(!actor_data){
                  console.log("notExiting: ", tmdb_actor.name)                    
                  var faceListId = 'whatshisface';
                  var imgUrl = 'https://image.tmdb.org/t/p/w500' + tmdb_actor.profile_path;
                  var userData = tmdb_actor.id;

                  mcf.addFaceToList(faceListId, imgUrl, userData, function(mcs_data) {                  
                    if(mcs_data != null){

                      var model = {
                          "persistedFaceId": mcs_data.persistedFaceId,
                          "tmdb_actor_id": tmdb_actor.id,
                          "tmdb_actor_name": tmdb_actor.name,
                          "tmdb_actor_img_short_url": tmdb_actor.profile_path,
                          "tmdb_actor_img_url": "https://image.tmdb.org/t/p/w500" + tmdb_actor.profile_path
                      };

                      mLab.save(model, function(){
                        cast_next()
                      })    
                    }else{
                      cast_next()
                    }
                  })
                }else{
                  cast_next()
                }
              }) 
            }else{
              cast_next()
            }
          }).then(function () {   
            console.log("For each actor done!")
            var actor_match_list = [];
    
            mcf.detect(body.img64, function(list_tmp_face) {
              forEachAsync(list_tmp_face, function (next, tmp_face, index, array) {
                  mcf.findSimilar('whatshisface', tmp_face.faceId, function(match) {
                    var query = {persistedFaceId: match.persistedFaceId};
                    mLab.getOnce(query, function(actor_data) {
                      console.log("Matching Actor :",actor_data);  
                      if(actor_data!=null){
                        var actor = {
                          name: actor_data.tmdb_actor_name,
                          id: actor_data.tmdb_actor_id,
                          imgUrl: "https://image.tmdb.org/t/p/w150" + actor_data.tmdb_actor_img_short_url                
                        }
                        actor_match_list.push(actor);
                        next()              
                      }else{
                        next()
                      }
                    })
                  })
              }).then(function () {   
                  var data_out = {
                    actors : actor_match_list,
                    title: body.title + " S. " + body.season + " Ep. " + body.episode
                  }
                  res.send(data_out);  
              });
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
  
    
    
    
  }catch(err){
    console.log(err)
  }
 
});




