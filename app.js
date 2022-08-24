require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;


const app = express();
const port = 3000;


//DataBase
mongoose.connect('mongodb://localhost:27017/userDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


const User = mongoose.model('User', userSchema);

//middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');



app.get('/', (req, res)=>{
    res.render('home');
});

app.get('/register', (req, res)=>{
    res.render('register');
});

app.post('/register', (req, res)=>{

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const user = new User({
            email: req.body.username,
            password: hash
        });
    
        user.save((err)=>{
            if(err){
                console.log(err);
            }else{
                res.render('secrets');
            }
        }); 
    });
});

app.get('/login', (req, res)=>{
    res.render('login');
});

app.post('/login', (req, res)=>{
    const username = req.body.username;
    const password = req.body.password;
    bcrypt.hash(password, saltRounds, function(err, hash) {
        User.findOne({email: username}, (err, userFound)=>{
            if(err){
                console.log(err);
            }else{
                if(userFound){
                    bcrypt.compare(password, userFound.password, function(err, result) {
                       if(result === true){
                        res.render('secrets');
                       } 
                    });
                }
            }
        }); 
    });
});




app.listen(port, (req, res)=>{
    console.log("Server is running on " + port);
});