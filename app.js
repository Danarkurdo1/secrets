require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook');
const findOrCreate = require('mongoose-findorcreate');

const app = express();
const port = 3000;

//middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(session({
    secret: "my little secret.",
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

//DataBase
mongoose.connect('mongodb://localhost:27017/userDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

// Google Oauth
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/secrets',
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//Facebook Oauth
passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/', (req, res)=>{
    res.render('home');
});

app.get('/secrets', (req, res)=>{
    User.find({secret: {$ne: null}}, (err, foundUsers)=>{
        if(err){
            console.log(err);
        }else{
            if(foundUsers){
                res.render('secrets', {usersWithSecret:foundUsers});
            }
        }
    });
});
//google Oauth routs
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

//Facebook Oauth routs
app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});

app.get('/register', (req, res)=>{
    res.render('register');
});

app.post('/register', (req, res)=>{
    User.register({username: req.body.username}, req.body.password, (err, user)=>{
        if(err){
            console.log(err);
            res.redirect('/register');
        }else{
            passport.authenticate('local')(req, res, ()=>{
                res.redirect('/secrets');
            });
        }
    });
});

app.get('/login', (req, res)=>{
    res.render('login');
});

app.post('/login', (req, res)=>{
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err)=>{
        if(err){
            console.log(err);
            res.redirect('/login');
        }else{
            passport.authenticate('local')(req, res, ()=>{
                res.redirect('/secrets');
            });
        }
    });
});

app.get('/submit', (req, res)=>{
    if(req.isAuthenticated()){
        res.render('submit');
    }else{
        res.redirect('/');
    }
});

app.post('/submit', (req, res)=>{
    User.findById(req.user._id, (err, foundUser)=>{
        if(err){
            console.log(err);
        }else{
            foundUser.secret = req.body.secret;
            foundUser.save((err)=>{
                if(err){
                    console.log(err);
                }else{
                    res.redirect('/secrets');
                }
            });
        }
    })
});

app.get('/logout', (req, res)=>{
    req.logout((err)=>{
        if(err){
            console.log(err);
        }else{
            res.redirect('/');
        }
    });
});



app.listen(port, (req, res)=>{
    console.log("Server is running on " + port);
});