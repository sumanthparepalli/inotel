var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground=require("../models/campground");
//root route
router.get("/", function(req, res){
    res.render("landing");
});

// show register form
router.get("/register", function(req, res){
   res.render("register"); 
});

//handle sign up logic
router.post("/register", function(req, res){
    var fname=req.body.fname;
    var lname=req.body.lname;
    var gen=req.body.gender;
    var uname=req.body.username;
    var pass=req.body.password;
    var cnf=req.body.cnfpass;
    if(fname.length==0||uname.length==0||pass.length==0||cnf.length==0)
    {
        req.flash("error","All the fields are mandatory");
        res.redirect("/register");
    }
    if(req.body.password!=req.body.cnfpass)
    {
        req.flash("error","Password and Confirm password should match");
        res.redirect("/register");
    }
    var newUser = new User({username:uname,firstname:fname,lastname:lname,gender:gen});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            req.flash("error",err.message);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to YelpCamp " + user.username);
            res.redirect("/campgrounds"); 
        });
    });
});

//show login form
router.get("/login", function(req, res){
   res.render("login"); 
});

//handling login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), function(req, res){
        
});

router.get("/account",isLoggedIn,function(req,res)
{
    var id=req.user.id;
    var posted=[];
    Campground.find({},function(err,camp)
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            camp.forEach(function(campground)
            {
                if(campground.author.id.toString()==id)
                posted.push(campground);
            });
            res.render("account.ejs",{posted:posted});
        }
    });
});

// logout route
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "Logged you out!");
   res.redirect("/campgrounds");
});

//middleware
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

module.exports = router;