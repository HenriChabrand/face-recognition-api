//const forEach = require('async-foreach').forEach;
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const forEach = require('async-foreach').forEach;
const forEachAsync = require('forEachAsync').forEachAsync  
const lodash = require('lodash');
const firebase = require('firebase');
                                  
const mcf = require(__dirname + '/src/microsoft-cognitive-face.js');
const mLab = require(__dirname + '/src/mLab.js');
const tmdb = require(__dirname + '/src/tmdb.js');


// Initialize Firebase
var config = {
  apiKey: "AIzaSyC5XlaMVyuV5q8EQ6gl7bEI-A96HlOYFH8",
  authDomain: "movie-fact.firebaseapp.com",
  databaseURL: "https://movie-fact.firebaseio.com",
  projectId: "movie-fact"
};

firebase.initializeApp(config);


const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});


app.post('/webhook', (req, res) => {  
  try{
    
    
    var call_id = guidGenerator();
    console.log(call_id);
    
    
    res.send(call_id);   
    
   

    
    var body = req.body; 
    
    
    
    console.log("body",body)
    
    firebase.database().ref('calls/' + call_id + '/request/').set(body);
    
    var directory = 'calls/' + call_id + '/result/'; 
    
    //Sort content type 
    var contentType = body.type;
    
    var cast;
    console.log("cast ini",cast)
    
    //Get cast
    if(contentType == "movie"){
      
      firebase.database().ref(directory + 'title').set(body.title);
     
      
      tmdb.getMovieId(body.title, function(moive){
        
         var year ='';
         year = moive.release_date.substring(0, 4);
         firebase.database().ref(directory + 'subtitle').set(year);
         firebase.database().ref(directory + 'banner').set("https://image.tmdb.org/t/p/w300" + moive.backdrop_path);
        
        tmdb.getMovieCast(moive.id, function(tmdb_cast){
          body.title = moive.title;    
          cast = tmdb_cast;
          console.log("cast movie",cast)
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
                        firebase.database().ref('calls/' + call_id + '/result/sync/').set("Sync "+ Math.floor(((index+1)/cast.length)*100) +"%");
                        cast_next()
                        
                      })    
                    }else{
                      firebase.database().ref('calls/' + call_id + '/result/sync/').set("Sync "+ Math.floor(((index+1)/cast.length)*100) +"%");
                      cast_next()
                    }
                  })
                }else{
                  firebase.database().ref('calls/' + call_id + '/result/sync/').set("Sync "+ Math.floor(((index+1)/cast.length)*100) +"%");
                  cast_next()
                }
              }) 
            }else{
              firebase.database().ref('calls/' + call_id + '/result/sync/').set("Sync "+ Math.floor(((index+1)/cast.length)*100) +"%");
              cast_next()
            }
          }).then(function () {   
            console.log("For each actor done!")
            var actor_match_list = [];
            console.log("cast tv then",cast)
            mcf.detect(body.img64, function(list_tmp_face) {
              forEachAsync(list_tmp_face, function (next, tmp_face, index, array) {
                  mcf.findSimilar('whatshisface', tmp_face.faceId, function(matchs) {
                    var actor = null;
                    forEachAsync(matchs, function (next_match, match, index, array) {
                      console.log("match msc", match);  
                      var query = {persistedFaceId: match.persistedFaceId};     
                      if(actor == null){
                        console.log("Actor empty");  
                        mLab.getOnce(query, function(actor_data) {                        
                          console.log("Matching Actor :",actor_data);  

                            if(actor_data){
                              console.log("actor_data full");  
                              var picked = lodash.filter(cast, { 'id': actor_data.tmdb_actor_id } );
                              console.log("Mpicked",picked);  
                              if(picked[0]){
                                console.log("picked");  
                                actor = {
                                  name: picked[0].name,
                                  id: picked[0].id,
                                  character: picked[0].character,
                                  imgUrl: "https://image.tmdb.org/t/p/w150" + picked[0].profile_path,
                                  confidence: match.confidence
                                }
                                
                                firebase.database().ref(directory + 'cards/' + actor_match_list.length + '/name').set(picked[0].name);
                                firebase.database().ref(directory + 'cards/' + actor_match_list.length + '/character').set(picked[0].character);
                                firebase.database().ref(directory + 'cards/' + actor_match_list.length + '/img').set("https://image.tmdb.org/t/p/w150" + picked[0].profile_path);
                                firebase.database().ref(directory + 'cards/' + actor_match_list.length + '/confidence').set(match.confidence);
                                
                                actor_match_list.push(actor);
                                next()
                              }else{
                                console.log("not picked");
                                next_match()
                              }      
                            }else{
                              console.log("actor_data null");  
                              next_match()
                            }                        
                        })
                      }else{
                        console.log("Actor filled");  
                        next_match()
                      }
                    }).then(function () {
                      console.log("matchs then");  
                      next()
                    })
                  })
              }).then(function () {   
                  var data_out = {
                    actors : actor_match_list,
                    title: body.title
                  }         
                  
                   if(actor_match_list.length == 0){
                     firebase.database().ref(directory + 'no_match').set(true);
                  }
                  
                  //res.send(data_out);  
              });
            })
            
          });     
        })
      })      
    }else if(contentType == "tvshow"){   
      
      firebase.database().ref(directory + 'title').set(body.title);
      firebase.database().ref(directory + 'subtitle').set('S0' + body.season + 'E'+ body.episode);
      
      tmdb.getTvshowId(body.title, function(tvshow){
        
        firebase.database().ref(directory + 'banner').set("https://image.tmdb.org/t/p/w300" + tvshow.backdrop_path);
        
        tmdb.getTvshowSECast(tvshow.id, body.season, body.episode, function(tmdb_cast){
          body.title = tvshow.name;
          cast = tmdb_cast;
          
          console.log("cast tv",cast)
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
                        firebase.database().ref('calls/' + call_id + '/result/sync/').set("Sync "+ Math.floor(((index+1)/cast.length)*100) +"%");
                        cast_next()
                      })    
                    }else{
                      firebase.database().ref('calls/' + call_id + '/result/sync/').set("Sync "+ Math.floor(((index+1)/cast.length)*100) +"%");
                      cast_next()
                    }
                  })
                }else{
                  firebase.database().ref('calls/' + call_id + '/result/sync/').set("Sync "+ Math.floor(((index+1)/cast.length)*100) +"%");
                  cast_next()
                }
              }) 
            }else{
              firebase.database().ref('calls/' + call_id + '/result/sync/').set("Sync "+ Math.floor(((index+1)/cast.length)*100) +"%");
              cast_next()
            }
          }).then(function () {   
            console.log("For each actor done!")
            var actor_match_list = [];
            console.log("cast tv then",cast)
            mcf.detect(body.img64, function(list_tmp_face) {
              forEachAsync(list_tmp_face, function (next, tmp_face, index, array) {
                  mcf.findSimilar('whatshisface', tmp_face.faceId, function(matchs) {
                    var actor = null;
                    forEachAsync(matchs, function (next_match, match, index, array) {
                      console.log("match msc", match);  
                      var query = {persistedFaceId: match.persistedFaceId};     
                      if(actor == null){
                        console.log("Actor empty");  
                        mLab.getOnce(query, function(actor_data) {                        
                          console.log("Matching Actor :",actor_data);  

                            if(actor_data){
                              console.log("actor_data full");  
                              var picked = lodash.filter(cast, { 'id': actor_data.tmdb_actor_id } );
                              console.log("Mpicked",picked);  
                              if(picked[0]){
                                console.log("picked");  
                                actor = {
                                  name: picked[0].name,
                                  id: picked[0].id,
                                  character: picked[0].character,
                                  imgUrl: "https://image.tmdb.org/t/p/w150" + picked[0].profile_path,
                                  confidence: match.confidence
                                }
                                
                                firebase.database().ref(directory + 'cards/' + actor_match_list.length + '/name').set(picked[0].name);
                                firebase.database().ref(directory + 'cards/' + actor_match_list.length + '/character').set(picked[0].character);
                                firebase.database().ref(directory + 'cards/' + actor_match_list.length + '/img').set("https://image.tmdb.org/t/p/w150" + picked[0].profile_path);
                                firebase.database().ref(directory + 'cards/' + actor_match_list.length + '/confidence').set(match.confidence);
                                
                                actor_match_list.push(actor);
                                next()
                              }else{
                                console.log("not picked");
                                next_match()
                              }      
                            }else{
                              console.log("actor_data null");  
                              next_match()
                            }                        
                        })
                      }else{
                        console.log("Actor filled");  
                        next_match()
                      }
                    }).then(function () {
                      console.log("matchs then");  
                      next()
                    })
                  })
              }).then(function () {   
                  console.log("list_tmp_face then");  
                  var data_out = {
                    actors : actor_match_list,
                    title: body.title + " Se. " + body.season + " Ep. " + body.episode
                  }
                  
                  if(actor_match_list.length == 0){
                     firebase.database().ref(directory + 'no_match').set(true);
                  }
                  
                  //res.send(data_out);  
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



function guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (Date.now()+"-"+S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}



