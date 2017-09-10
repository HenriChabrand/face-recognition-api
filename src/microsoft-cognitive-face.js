var request = require('request');

var subscriptionKey = "dd5f03a431984acfa0d451f01cacb74f";


function addFaceToList(faceListId, imageUrl, userData, callback){

    var uriBase = "https://westeurope.api.cognitive.microsoft.com/face/v1.0/facelists/"
    + faceListId
    + "/persistedFaces";
    
    var headers = {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': subscriptionKey
    }

    // Configure the request
    var options = {
        url: uriBase+'?userData=' + encodeURI(userData),
        method: 'POST',
        headers: headers,
        json: {url: imageUrl}
    }

    // Start the request
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // Return out the response body
            callback(body)
        }else{
            console.log('addFaceToList: error: ',error);
        }
    })
}

/*
var faceListId = 'whatshisface';
var imageUrl = 'https://image.tmdb.org/t/p/w500/1r6SwIV4QqZgdkRuql0EQHd0rUB.jpg';
var userData = 12795;
addFaceToList(faceListId, imageUrl, userData, function(response){
    console.log(response);
})
*/

exports.addFaceToList = addFaceToList;
