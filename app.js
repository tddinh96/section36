import dotenv from 'dotenv';
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose, { mongo } from "mongoose";
import md5 from 'md5';

/* CONFIGURATION */
dotenv.config();
const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

/* MONGOOSE SETUP */
mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});




const User = mongoose.model("User", userSchema);

app.get("/", function(req,res){
    res.render("home");
});

app.get("/login", function(req,res){
    res.render("login");
});

app.get("/register", function(req,res){
    res.render("register");
});

app.post("/register", function(req,res){
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password),
    });
    newUser.save()
     .then(()=>{
        res.render("secrets");
     })
     .catch(err =>{
        res.send(err);
     })
});

app.post("/login", function(req,res){
    const userName = req.body.username;
    const password = md5(req.body.password); 

    User.findOne({email: userName})
     .then((foundUser)=>{
        if(foundUser) {
            if (foundUser.password === password){
                res.render("secrets");
            }
        }
     })
     .catch(err =>{
        res.send(err);
     })

});

//Add comments

app.listen(3000, function(){
    console.log("Server stated on port 3000");
});