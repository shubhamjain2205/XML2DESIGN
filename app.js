// App.js

const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const bodyParser = require("body-parser");
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const flash = require("connect-flash"); // Add this line to require connect-flash
const User = require("./model/User");
const app = express();

mongoose.connect("mongodb://localhost/27017");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require("express-session")({
	secret: "Rusty is a dog",
	resave: false,
	saveUninitialized: false
}));

// Use the connect-flash middleware
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//=====================
// ROUTES
//=====================

// Showing home page
app.get("/", function (req, res) {
	res.render("home");
});

// Showing secret page
app.get("/secret", isLoggedIn, function (req, res) {
	res.render("secret");
});

// Showing register form
app.get("/register", function (req, res) {
	res.render("register");
});

// Handling user signup
app.post("/register", async (req, res) => {
    try {
      const existingUser = await User.findOne({ username: req.body.username });
      // Check if the username already exists in the database
      if (existingUser) {
        // If the username already exists, redirect back to the registration page with an error message
        req.flash("error", "Username already exists. Please choose a different username.");
        return res.redirect("/register");
      }
  
      // If the username does not exist, create a new user
      const user = await User.create({
        username: req.body.username,
        password: req.body.password
      });
  
      // Set a success flash message for successful registration
      req.flash("success", "Registration successful! You can now log in.");
  
      // Redirect the user to the home page ("/") after successful registration
      return res.redirect("/");
    } catch (error) {
      // Handle any errors that occurred during user creation
      console.error("Error while creating user:", error);
      req.flash("error", "An error occurred during registration. Please try again.");
      // Redirect back to the registration page with an error message
      return res.redirect("/register");
    }
  });
  
  

//Showing login form
app.get("/login", function (req, res) {
	res.render("login");
});

//Handling user login
app.post("/login", async function(req, res){
	try {
		// check if the user exists
		const user = await User.findOne({ username: req.body.username });
		if (user) {
		//check if password matches
		const result = req.body.password === user.password;
		if (result) {
			res.render("secret");
		} else {
			res.status(400).json({ error: "password doesn't match" });
		}
		} else {
		res.status(400).json({ error: "User doesn't exist" });
		}
	} catch (error) {
		res.status(400).json({ error });
	}
});

//Handling user logout
app.get("/logout", function (req, res) {
	req.logout(function(err) {
		if (err) { return next(err); }
		res.redirect('/');
	});
});



function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) return next();
	res.redirect("/login");
}

var port = process.env.PORT || 3000;
app.listen(port, function () {
	console.log("Server Has Started!");
});