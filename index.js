const express = require('express');
const https = require('https');
const bp = require('body-parser');

const app = express();

var cryptoNames = [];
var cryptoPrices = [];

app.set('view engine', 'ejs');
app.use(bp.urlencoded({extended: true}));

app.use(express.static("public"));


app.get("/", function(req, res){
    res.render("index");
});


app.get("/portfolio", function(req, res){
    res.render("portfolio", {cryptoNames: cryptoNames, cryptoPrices: cryptoPrices});
});


app.listen(4002, function(){
    console.log("Listening on 4002")
});


// Post on Portfolio //

app.post("/portfolio", function(req, res){
    getCurrencyPrice(req.body.cryptoContract);

    res.redirect("/portfolio")
})

// Pancake Swap API //
function getCurrencyPrice(contract){
    var url = "https://api.pancakeswap.info/api/v2/tokens/" + contract;
    https.get(url, function(response){

            response.on("data", function(data){
                var crypto = JSON.parse(data);
                var cryptoPrice = crypto.data.price;
                var cryptoSymbol = crypto.data.symbol;
                var price = Math.floor(Number(cryptoPrice)* 100)/100
                cryptoNames.push(cryptoSymbol);
                cryptoPrices.push(price);
        });
    });
}
