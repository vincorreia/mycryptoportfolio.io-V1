require('dotenv').config();
const axios = require('axios');
const express = require('express');
const https = require('https');
const bp = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const app = express();

app.set('view engine', 'ejs');
app.use(bp.urlencoded({extended: true}));
app.use(express.static("public"));


app.use(session({
    secret:process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

/////////////////////////////////////// DB /////////////////////////////////////

mongoose.connect("mongodb://localhost:27017/MyCryptoPortfolio", {useNewUrlParser: true});

///////////////////////////////// User DB //////////////////////////////////////

const userSchema = new mongoose.Schema({
    name: String,
    user_name: String,
    googleId:String,
    password: String,
    contracts: [
        {contract: String,
        amount: Number,
        medium_price: Number }],
    games: [
        {
            contract: String,
            initialValue: Number,
            coinPerDay: [{
                type:Number
            }],
            initialInvestiment: Number
        }
    ]
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


/////////////////////////////////// REGISTER ///////////////////////////////////

app.route("/register")

    .post(function(req, res){

        User.register({username: req.body.username}, req.body.password, function(err, user){
            if(err){
                console.log(err);
                res.redirect("/login");
            } else {
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/portfolio");
                })
            }
        })
    })
    .get(function(req, res){
        res.render("register", {isAuthenticated: req.isAuthenticated()})
    });
/////////////////////////////////// LOGIN //////////////////////////////////////

app.route("/login")

    .post(function(req, res){
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });
        req.login(user, function(err){
            if(err){
                console.log(err);
            } else {
                passport.authenticate("local", {failureRedirect: '/login'})(req, res, function(){
                    res.redirect("/portfolio");
                })
            }
        })
    })
    .get(function(req, res){
        res.render("login", {isAuthenticated: req.isAuthenticated()});
    });

//////////////////////////////////// LOGOUT ////////////////////////////////////

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

////////////////////////////////////////////////////////////////////////////////
function add_contract(userId, input, callback){
    User.findOne({_id: userId}, function(err, userOnDB){
        userOnDB.contracts.push(input);
        userOnDB.save(function(err){
            if(!err){
                callback;
            }
        });

    })
};

function updateExistingContract(userId, input, callback){
    User.findOne({_id: userId}, function(err, userOnDB){
        let contract = input.contract;
        let newPrice = input.medium_price;
        let newAmount = input.amount;

        userOnDB.contracts.forEach(function(crypto){
            if(crypto.contract == contract){
                crypto.medium_price = (crypto.medium_price + newPrice) / 2;
                crypto.amount = crypto.amount + newAmount;
                userOnDB.save(function(err){
                    if(err){
                        console.log(err);
                    } else{
                        callback;
                    }
                });
            }
        })
    })
}
/////////////////////////////// Prices DB //////////////////////////////////////
const cryptoSchema = new mongoose.Schema({
    contract: String,
    coinFigure: String,
    coinPrice: Number
})

const Crypto = mongoose.model("Crypto", cryptoSchema);

function newContract(data){
    newCrypto = new Crypto(data);
    newCrypto.save(function(err){
        if(err){
            console.log(err);
        } else{
            console.log(data.price);
        }
    });
};

function updatePrice(contract, price){
    Crypto.findOne({contract: contract}, function(err, crypto){
        crypto.coinPrice = price
        crypto.save(function(err){
            if(err){
                console.log(err);
            } else{
                console.log(crypto.coinPrice);
            }
        });

    })
};

/////////////////////////// Home Page //////////////////////////////////////////

app.get("/", function(req, res){
    res.render("index", {isAuthenticated: req.isAuthenticated()});
});


///////////////////////// P2E (Under construction) /////////////////////////////

app.get("/p2e", (req, res) => {
    res.render("p2e", {isAuthenticated: req.isAuthenticated()});
})


///////////////////////// Portfolio ////////////////////////////////////////////

app.get("/portfolio", function(req, res){
    if(req.isAuthenticated()){

        User.findOne({_id: req.user.id}, function(err, userOnDB){
            if(userOnDB.contracts.length > 0){
                getCurrencyPrice(req.user.id);
            }
            Crypto.find({}, function(err, cryptos){
                res.render("portfolio", {userInfo:userOnDB, cryptos:cryptos, isAuthenticated: req.isAuthenticated()})});
        });
    } else{
        res.redirect("/login");
    }
});

//////////////////////////// Post on Portfolio /////////////////////////////////

app.post("/portfolio", function(req, res){
    if(req.isAuthenticated()){
        let newContract = req.body.cryptoContract;
        let newPurchasePrice = Number(req.body.cryptoPurchase);
        let newPurchaseAmount = Number(req.body.cryptoAmount);
        let yesOrNo = 0;
        var newInput = {
            contract: newContract,
            amount: newPurchaseAmount,
            medium_price: newPurchasePrice
        };

        User.findOne({_id:req.user.id}, function(err, result){
            result.contracts.forEach(function(crypto){
                if(crypto.contract == newInput.contract){
                    console.log("contract found!")
                    yesOrNo = 1;
                }
            });
            if(yesOrNo == 1){
                updateExistingContract(req.user.id, newInput, res.redirect("/portfolio"));
            } else{
                add_contract(req.user.id, newInput, res.redirect("/portfolio") );
            }
        })
    }
});

//////////////////////////////// Pancake Swap API //////////////////////////////
function getCurrencyPrice(userId){
    User.findOne({_id: userId}, function(err, userOnDB){
        userOnDB.contracts.forEach(function(contrato){
            var url = "https://api.pancakeswap.info/api/v2/tokens/" + contrato.contract;

            axios.get(url).then(response => {
                    const crypto = response.data.data
                        const cryptoPrice = crypto.price;
                        var cryptoSymbol = crypto.symbol;
                        var price = Math.floor(Number(cryptoPrice)* 100)/100

                        var input = {
                            contract: contrato.contract,
                            coinFigure: cryptoSymbol,
                            coinPrice: price
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
    };

/////////////////////////////// Start Server ///////////////////////////////////

app.listen(4002, function(){
    console.log("Listening on 4002")
});
