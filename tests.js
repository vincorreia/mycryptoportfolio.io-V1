const mongoose = require('mongoose');
const https = require('https');

mongoose.connect("mongodb://localhost:27017/testDB")

var url = "https://api.pancakeswap.info/api/v2/tokens/0x00e1656e45f18ec6747f5a8496fd39b50b38396d";

https.get(url, function(response){

        response.on("data", function(data){
            var crypto = JSON.parse(data);
            var cryptoPrice = crypto.data.price;
            var cryptoSymbol = crypto.data.symbol;
            var price = Math.floor(Number(cryptoPrice)* 100)/100
            console.log(price)
        });
    });
