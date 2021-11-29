const express = require('express');
const https = require('https');
const bp = require('body-parser');

const app = express();

var cryptoNames = [];
var cryptoPrices = [];

app.set('view engine', 'ejs');
app.use(bp.urlencoded({extended: true}));

app.use(express.static("public"));

// Home Page //

app.get("/", function(req, res){
    res.render("index");
});

// Portfolio //

app.get("/portfolio", function(req, res){
    res.render("portfolio", {cryptoNames: cryptoNames, cryptoPrices: cryptoPrices});
});




// Post on Portfolio //

app.post("/portfolio", function(req, res){
    getCurrencyPrice(res, req.body.cryptoContract, "portfolio");
});

// Pancake Swap API //
function getCurrencyPrice(res, contract, redirection){
    var url = "https://api.pancakeswap.info/api/v2/tokens/" + contract;
    https.get(url, function(response){

            response.on("data", function(data){
                var crypto = JSON.parse(data);
                var cryptoPrice = crypto.data.price;
                var cryptoSymbol = crypto.data.symbol;
                var price = Math.floor(Number(cryptoPrice)* 100)/100
                console.log("Successfully run!")
                cryptoNames.push(cryptoSymbol);
                cryptoPrices.push(price);
                res.redirect("/" + redirection)
        });
    });
}

// Start Server //

app.listen(4002, function(){
    console.log("Listening on 4002")
});
