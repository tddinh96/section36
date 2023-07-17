import dotenv from 'dotenv';
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose, { mongo } from "mongoose";
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from "passport-local-mongoose";


/* CONFIGURATION */
dotenv.config();
const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

/* SESSION SETUP */
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


/* MONGOOSE SETUP */
mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});

/* SETUP PASSPORT MONGO LOCAL */
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req,res){
    res.render("home");
});

app.get("/login", function(req,res){
    res.render("login");
});

app.get("/register", function(req,res){
    res.render("register");
});

app.get("/secrets", function(req,res){
    if (req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("login");
    }
});

app.get("/logout", function(req,res){
    req.logout(function(err){
        if (err) {
            console.log(err);
        } else{
            res.redirect("/");
        }
    })
})

app.post("/register", function(req,res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else {
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets")
            });
        }
    });

});

app.post("/login", function(req,res){

    const user = new User({
        username: req.body.username,
        password: req.body.password

    });
    req.login(user, function(err){
        if (err){
            console.log(err);
        } else {
            passport.authenticate("local")(req,res, function(){
                res.render("secrets");
            })
        }
    })

});

//Add comments

app.listen(3000, function(){
    console.log("Server stated on port 3000");
});