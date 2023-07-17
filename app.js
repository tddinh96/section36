import dotenv from 'dotenv';
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose, { mongo } from "mongoose";
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from "passport-local-mongoose";
import { Strategy as GoogleStrategy} from 'passport-google-oauth20';
import findOrCreate from 'mongoose-findorcreate';


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
    googleId: String,
});

/* SETUP PASSPORT MONGO LOCAL */
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });


/* SETTING UP GOOGLE OAUTH 2.0 */
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req,res){
    res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }
));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
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
});

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