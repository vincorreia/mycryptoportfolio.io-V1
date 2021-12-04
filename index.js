const express = require('express');
const https = require('https');
const bp = require('body-parser');
const mongoose = require('mongoose');

const app = express();

app.set('view engine', 'ejs');
app.use(bp.urlencoded({extended: true}));

app.use(express.static("public"));

// Home Page //

app.get("/", function(req, res){
    res.render("index");
});

// Portfolio //

app.get("/portfolio", function(req, res){
    User.findOne({_id: 1}, function(err, userOnDB){
        if(userOnDB.contracts.length > 0){
            getCurrencyPrice();
        }
        setTimeout(function(){
            Crypto.find({}, function(err, cryptos){
        setTimeout(function(){
            res.render("portfolio", {userInfo:userOnDB, cryptos:cryptos})}
            , 300);
    })}, 300);
    });
    }
    );



// Post on Portfolio //

app.post("/portfolio", function(req, res){
    let newContract = req.body.cryptoContract;
    let newPurchasePrice = Number(req.body.cryptoPurchase);
    let newPurchaseAmount = Number(req.body.cryptoAmount);
    var newInput = {
        contract: newContract,
        amount: newPurchaseAmount,
        medium_price: newPurchasePrice
    };
    console.log(newInput)
    add_contract(newInput, res.redirect("/portfolio") )
});

// Pancake Swap API //
function getCurrencyPrice(){
    User.findOne({_id: 1}, function(err, userOnDB){
        userOnDB.contracts.forEach(function(contrato){
            var url = "https://api.pancakeswap.info/api/v2/tokens/" + contrato.contract;

            https.get(url, function(response){

                    response.on("data", function(data){
                        var crypto = JSON.parse(data);
                        var cryptoPrice = crypto.data.price;
                        var cryptoSymbol = crypto.data.symbol;
                        var price = Math.floor(Number(cryptoPrice)* 100)/100
                        console.log(cryptoPrice)

                        var input = {
                            contract: contrato.contract,
                            coinFigure: cryptoSymbol,
                            coinPrice: cryptoPrice
                        }
                        Crypto.findOne({contract: input.contract}, function(err, resp){
                            if(resp === null){
                                    newContract(input);
                            } else {
                                    updatePrice(input.contract, input.coinPrice);
                            }
                        });
                    }
                )
            });
        });
    });
};
// DB //

mongoose.connect("mongodb://localhost:27017/MyCryptoPortfolio")
// User DB //
const userSchema = new mongoose.Schema({
    _id: Number,
    name: String,
    user_name: String,
    password: Number,
    contracts: [
        {contract: String,
        amount: Number,
        medium_price: Number }],
});

const User = mongoose.model("User", userSchema);

function add_contract(input, callback){
    User.findOne({_id: 1}, function(err, userOnDB){
        userOnDB.contracts.push(input);
        userOnDB.save();
        callback;
    })
};


// Prices DB //
const cryptoSchema = new mongoose.Schema({
    contract: String,
    coinFigure: String,
    coinPrice: Number
})

const Crypto = mongoose.model("Crypto", cryptoSchema);

function newContract(data){
    newCrypto = new Crypto(data);
    newCrypto.save();
};

function updatePrice(contract, price){
    Crypto.findOne({contract: contract}, function(err, crypto){
        crypto.coinPrice = price
        crypto.save();
        console.log(crypto.coinPrice)
    })
};

function waitRes(contractArray){
    contractArray.forEach(function(contrato){
        Crypto.findOne({contract: contrato.contract}, function(err, crypto){
            if(cryptos.includes(crypto)){
                cryptos[crypto].coinPrice = crypto.coinPrice
            } else {
                cryptos.push(crypto);
            }
        })
    });
}
// Start Server //

app.listen(4002, function(){
    console.log("Listening on 4002")
});
