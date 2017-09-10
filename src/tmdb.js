var request = require('request');

var api_key = "dda8900b36aa97fa58cc2c3868d24877";


//Get movie ID
function getMovieId(query, callback){


    var uriBase = "https://api.themoviedb.org/3/search/movie?api_key="
    + api_key
    +"&language=en-US&query="
    + encodeURI(query)
    +"&page=1&include_adult=false";
    

    // Configure the request
    var options = {
        url: uriBase,
        method: 'GET'
    }

    // Start the request
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var json = JSON.parse(body);
            if(json.results[0]){    
                var item = json.results[0];
                callback(item.id)
            }else{
                callback(null)
            }
        }else{
            console.log('thmdb search movie id: error: ',error);
        }
    })
}


//Get tvshow ID
function getTvshowId(query, callback){


    var uriBase = "https://api.themoviedb.org/3/search/tv?api_key="
    + api_key
    +"&language=en-US&query="
    + encodeURI(query)
    +"&page=1&include_adult=false";
    

    // Configure the request
    var options = {
        url: uriBase,
        method: 'GET'
    }

    // Start the request
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var json = JSON.parse(body);
            if(json.results[0]){    
                var item = json.results[0];
                callback(item.id)
            }else{
                callback(null)
            }
        }else{
            console.log('thmdb search tvshow id: error: ',error);
        }
    })
}



//Get movie cast
function getMovieCast(movieId, callback){

    var uriBase = "https://api.themoviedb.org/3/movie/"
    + movieId
    + "/credits?api_key="
    + api_key;
    

    // Configure the request
    var options = {
        url: uriBase,
        method: 'GET'
    }

    // Start the request
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var json = JSON.parse(body);
            if(json.cast){                    
                callback(json.cast)
            }else{
                callback(null)
            }
        }else{
            console.log('thmdb get movie cast: error: ',error);
        }
    })
}


//Get get tvshow season episode  cast
function getTvshowSECast(tvshowId, season, episode, callback){

    var uriBase = "https://api.themoviedb.org/3/tv/"
    + tvshowId
    + "/season/"
    + season 
    + "/episode/"
    + episode
    + "/credits?api_key="
    + api_key;
    

    // Configure the request
    var options = {
        url: uriBase,
        method: 'GET'
    }

    // Start the request
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var json = JSON.parse(body);
            if(json.cast){                    
                callback(json.cast)
            }else{
                callback(null)
            }
        }else{
            console.log('thmdb get tvshow season episode cast: error: ',error);
        }
    })
}

exports.getMovieId = getMovieId;
exports.getTvshowId = getTvshowId;
exports.getMovieCast = getMovieCast;
exports.getTvshowSECast = getTvshowSECast;
