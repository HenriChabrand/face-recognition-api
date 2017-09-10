var mongoose = require('mongoose');

mongoose.connect('mongodb://Admin:password@ds052649.mlab.com:52649/face-recognition-mlab', {
  useMongoClient: true
});
var db = mongoose.connection;

db.once('open', function(){
    console.log("mLab open")
});

function getArray(query, callback){
    db.collection('whatshisface').find(query).toArray(function(err, array) {
       callback(array)
    }); 
}


function save(json, callback){
    db.collection('whatshisface').save(json, function(err, records) {
        callback(records);
    });
}

exports.getArray = getArray;
exports.save = save;
