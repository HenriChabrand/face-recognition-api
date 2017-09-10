var request = require('request');

var subscriptionKey = "dd5f03a431984acfa0d451f01cacb74f";


//Add face to face list
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
            console.log('msc addFaceToList: error: ',error);
        }
    })
}

//Detect
function detect(imageUrl, callback){

    var uriBase = "https://westeurope.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=true";
    
    var headers = {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': subscriptionKey
    }

    // Configure the request
    var options = {
        url: uriBase,
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
            console.log('msc detect: error: ',error);
        }
    })
}

exports.addFaceToList = addFaceToList;
exports.detect = detect;
