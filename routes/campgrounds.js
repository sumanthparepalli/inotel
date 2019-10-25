var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var User=require("../models/user");
//INDEX - show all campgrounds
router.get("/", function(req, res){
    // Get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
       if(err){
           console.log(err);
       } else {
          res.render("campgrounds/index",{campgrounds:allCampgrounds});
       }
    });
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, function(req, res){
    // get data from form and add to campgrounds array
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    var newCampground = {name: name, image: image, description: desc, author:author}
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW - shows more info about one campground
router.get("/:id", function(req, res){
    var stat=true;
    var alhit=false;
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            console.log(foundCampground);
            var lid=foundCampground.likes;
            if(req.user==undefined)
            {
                stat=false;
            } else {
                console.log("Current User id "+typeof(req.user.id));
                for(var i=0;i<lid.length;i++){
                    if(lid[i].toString()==req.user.id)
                    {
                        console.log("Cannot hit like more than once");
                        stat=true;
                        alhit=true;
                        break;
                    }
                }
            }
            var nlikes=lid.length;
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground,stat:stat,alhit:alhit,nlikes:nlikes});
        }
    });
});

// EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});

// UPDATE CAMPGROUND ROUTE
router.put("/:id",middleware.checkCampgroundOwnership, function(req, res){
    // find and update the correct campground
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
       if(err){
           res.redirect("/campgrounds");
       } else {
           //redirect somewhere(show page)
           res.redirect("/campgrounds/" + req.params.id);
       }
    });
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:id",middleware.checkCampgroundOwnership, function(req, res){
   Campground.findByIdAndRemove(req.params.id, function(err){
      if(err){
          res.redirect("/campgrounds");
      } else {
          res.redirect("/campgrounds");
      }
   });
});

//HIT-LIKE
router.post("/:id/like",isLoggedIn,function(req,res)
{
    Campground.findById(req.params.id,function(err,campground)
    {
        if(err)
        {
            console.log(err);
            res.redirect("/campgrounds");
        } else {
            User.findById(req.user.id,function(err,user)
            {
                if(err)
                {
                    console.log(err);
                } else{
                    console.log("User who hit the like button : "+user);
                    campground.likes.push(user);
                    campground.save();
                    // req.flash("success","Like Hit Sucess");
                    res.redirect("/campgrounds/"+req.params.id);
                }
            });
        }
    });
});
//REMOVE-LIKE
router.post("/:id/unlike",isLoggedIn,function(req,res)
{
    Campground.findById(req.params.id,function(err,campground){
        if(err)
        {
            console.log(err);
        } else{
            var likes=campground.likes;
            var newarr=[];
            for(var i=0;i<likes.length;i++)
            {
                if(likes[i].toString()==req.user.id)
                continue;
                else
                newarr.push(likes[i]);
            }
            campground.likes=newarr;
            campground.save();
            res.redirect("/campgrounds/"+req.params.id);
        }
    });
});
//middleware
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error","You need to be logged in to do that");
    res.redirect("/login");
}
module.exports = router;