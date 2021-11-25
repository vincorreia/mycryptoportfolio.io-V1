const express = require('express');
const https = require('https');
const bp = require('body-parser');
const app = express();

app.use(bp.urlencoded({extended: true}));

app.use(express.static("public"));


app.get("/", function(req, res){
    res.sendFile(__dirname + "/index.html");
});


app.get("/portfolio", function(req, res){
    res.sendFile(__dirname + "/portfolio.html");
});


app.listen(4002, function(){
    console.log("Listening on 4002")
});


// Post on Portfolio //

app.post("/portfolio", function(req, res){
    getCurrencyPrice(res, req.body.cryptoContract);
})

// Pancake Swap API //
function getCurrencyPrice(res, contract){
    var url = "https://api.pancakeswap.info/api/v2/tokens/" + contract;
    https.get(url, function(response){

            response.on("data", function(data){
                const crypto = JSON.parse(data);
                const cryptoPrice = crypto.data.price;
                const cryptoSymbol = crypto.data.symbol;
                const price = Math.floor(Number(cryptoPrice)* 100)/100
                res.send(cryptoSymbol + " price: $" + price);
        });
    });
}
