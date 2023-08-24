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
const crypto = require("crypto");
//const sgMail = require('@sendgrid/mail'); // Add this line to require sendgrid
const nodemailer = require("nodemailer");
//const cryptoRandomString = require('crypto-random-string'); // Import the crypto-random-string library
const generatePassword = require('generate-password');

const multer = require('multer');
const xml2js = require('xml2js');
const fs = require('fs');

// Serve static files (CSS, images, etc.) from the "public" directory
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1/27017");

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


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

// Function to generate a random password reset token
function generateRandomToken() {
  return crypto.randomBytes(20).toString('hex');
}

//=====================
// ROUTES
//=====================

// Showing home page
app.get("/", function (req, res) {
	res.sendFile(__dirname + "/views/home.html");
});

// Showing About page
app.get("/about", function (req, res) {
	res.sendFile(__dirname + "/views/about.html");
});

// Showing Contact page
app.get("/contact", function (req, res) {
	res.sendFile(__dirname + "/views/contact.html");
});

// Showing secret page
app.get("/secret", isLoggedIn, function (req, res) {
	res.sendFile(__dirname + "/views/secret.html");
});

// Showing register form
app.get("/register", function (req, res) {
	res.sendFile(__dirname + "/views/register.html");
});

// Add a new route for "Forgot Password" page
app.get("/forgot", function (req, res) {
  res.sendFile(__dirname + "/views/forgot.html");
});


// Add a new route to handle "Forgot Password" form submission
app.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body;

    // Generate a random new password
    const newPassword = generateRandomPassword();

    // Update the user's password in the MongoDB database
    const user = await User.findOne({ email });
    if (!user) {
      const errorMessage = "User with this email address does not exist.";
      return res.send(`<script>alert("${errorMessage}"); window.location.href = "/login";</script>`);
    }

    // Update the user's password and save the changes
    user.password = newPassword;
    await user.save();

    // Send the new password to the user via email
    sendNewPasswordEmail(email, newPassword);

    // Redirect the user to the login page with a success message
    const successMessage = "A new password has been sent to your email. Please check your inbox.";
    return res.send(`<script>alert("${successMessage}"); window.location.href = "/login";</script>`);
  } catch (error) {
    // Handle any errors that occurred during the password reset process
    console.error("Error during password reset:", error);

    const errorMessage = "An error occurred during the password reset process. Please try again.";
    return res.send(`<script>alert("${errorMessage}"); window.location.href = "/forgotPassword";</script>`);
  }
});

// Function to generate a random password
function generateRandomPassword() {
  // Generate a random password with options
  const randomPassword = generatePassword.generate({
    length: 10,
    numbers: true,
    symbols: false,
    uppercase: true,
    lowercase: true,
    excludeSimilarCharacters: true,
  });
  return randomPassword;
}

// Function to send the new password to the user via email
function sendNewPasswordEmail(email, newPassword) {
  // Implement your logic to send the email here using nodemailer or SendGrid
  // For example, if you're using nodemailer:
  const transporter = nodemailer.createTransport({
    service: "gmail", // e.g., "Gmail" or "SendGrid"
    auth: {
      user: "chiragmegha03@gmail.com",
      pass: "ybonjsyaiwtkniqr",
    },
  });

  const mailOptions = {
    from: "chiragmegha03@gmail.com",
    to: email,
    subject: "Password Reset",
    text: `Your new password is: ${newPassword}`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}



// Handling user signup
app.post("/register", async (req, res) => {
    try {
      const { fullname, username, email, password, confirmPassword } = req.body;
      
      // Check if the username already exists in the database
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        // If the username already exists, redirect back to the registration page with an error message

    //     req.flash("error", "Username already exists. Please choose a different username.");
    //     return res.redirect("/register");
	const errorMessage = "Username already exists. Please choose a different username.";
      return res.send(`<script>alert("${errorMessage}"); window.location.href = "/register";</script>`);
    }

      // Check if the passwords match
      if (password !== confirmPassword) {
        // req.flash("error", "Passwords do not match. Please re-enter the passwords.");
        // return res.redirect("/register");
		const errorMessage = "Passwords do not match. Please re-enter the passwords.";
      return res.send(`<script>alert("${errorMessage}"); window.location.href = "/register";</script>`);

      }
  
      // If the username does not exist and passwords match, create a new user
      const user = await User.create({
        fullname,
        username,
        email,
        password
      });
  
      // Set a success flash message for successful registration
    //   req.flash("success", "Registration successful! You can now log in.");
	  const successMessage = "Registration successful! You can now log in.";

  
      // Redirect the user to the home page ("/") after successful registration
    //   return res.redirect("/");
	return res.send(`<script>alert("${successMessage}"); window.location.href = "/";</script>`);

    } catch (error) {
      // Handle any errors that occurred during user creation
      console.error("Error while creating user:", error);

    //   req.flash("error", "An error occurred during registration. Please try again.");
    //   // Redirect back to the registration page with an error message
    //   return res.redirect("/register");
    // }
	const errorMessage = "An error occurred during registration. Please try again.";

    // Display an alert with the error message and redirect back to the registration page
    return res.send(`<script>alert("${errorMessage}"); window.location.href = "/register";</script>`);
  }
});
  


//Showing login form
app.get("/login", function (req, res) {
	res.sendFile(__dirname + "/views/login.html");
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

// Handle XML Upload
app.post("/upload", upload.single('xmlFile'), async (req, res) => {
  try {
    const xmlData = req.file.buffer.toString();

    xml2js.parseString(xmlData, { explicitArray: false, strict: true }, async (err, result) => {
      if (err) {
        console.error('Error parsing XML:', err);
        return res.status(500).send('Error parsing XML');
      }

      try {
        const XmlData = require('./model/uploadedXML'); // Import your XmlData model

        // Store the entire parsed JSON result as a document
        const savedData = await XmlData.create({ data: result });

        const XMLsuccessMessage = "XML data saved to MongoDB";
        return res.send(`<script>alert("${XMLsuccessMessage}"); window.location.href = "/secret";</script>`);
      } catch (error) {
        console.error('Error saving XML data to MongoDB:', error);
        return res.status(500).send('Error saving XML data to MongoDB');
      }
    });
  } catch (error) {
    console.error("Error during XML upload:", error);
    return res.status(500).send('Error during XML upload');
  }
});

//"Showing secret page" route to include a link for uploading XML files
app.get("/secret", isLoggedIn, function (req, res) {
  res.sendFile(__dirname + "/views/secret.html");
});

// Add a new route to fetch the list of XML document IDs
app.get("/getXmlIds", async (req, res) => {
  try {
    const XmlData = require('./model/uploadedXML'); // Import your XmlData model
    const xmlIds = await XmlData.find().distinct("_id");
    res.json(xmlIds);
  } catch (error) {
    console.error("Error fetching XML IDs:", error);
    res.status(500).send("Error fetching XML IDs");
  }
});

// Add a new route to fetch XML data by ID
app.get("/getXmlData", async (req, res) => {
  try {
    const XmlData = require('./model/uploadedXML'); // Import your XmlData model
    const xmlId = req.query.id; // Get the ID from the query parameter
    const xmlDocument = await XmlData.findById(xmlId);

    // Convert the JSON data back to XML format
    const xmlData = new xml2js.Builder().buildObject(xmlDocument.data);

    // Send the XML data as response
    res.set('Content-Type', 'text/xml');
    res.send(xmlData);
  } catch (error) {
    console.error("Error fetching XML data:", error);
    res.status(500).send("Error fetching XML data");
  }
});

// Add a new route to fetch XML tree by ID
app.get("/getXmlTree", async (req, res) => {
  try {
    const XmlData = require('./model/uploadedXML'); // Import your XmlData model
    const xmlId = req.query.id; // Get the ID from the query parameter
    const xmlDocument = await XmlData.findById(xmlId);

    const xmlData = xmlDocument.data; // Assume your data is in JSON format

    // Generate XML tree HTML using the generateXmlTree function
    const xmlTreeHTML = generateXmlTree(xmlData);

    // Send the XML tree as response
    res.set('Content-Type', 'text/html');
    res.send(xmlTreeHTML);
  } catch (error) {
    console.error("Error generating XML tree:", error);
    res.status(500).send("Error generating XML tree");
  }
});

// Function to generate an XML tree
function generateXmlTree(xmlData) {
  let xmlTreeHTML = '<ul class="tree">';
  
  function buildTree(node) {
    if (Array.isArray(node)) {
      xmlTreeHTML += '<ul>';
      node.forEach(item => {
        buildTree(item);
      });
      xmlTreeHTML += '</ul>';
    } else if (typeof node === 'object') {
      xmlTreeHTML += '<ul>';
      for (const key in node) {
        xmlTreeHTML += `<li>${key}`;
        if (Object.keys(node[key]).length > 0) {
          xmlTreeHTML += '<span class="toggle">Toggle</span>';
        }
        buildTree(node[key]);
        xmlTreeHTML += `</li>`;
      }
      xmlTreeHTML += '</ul>';
    } else {
      xmlTreeHTML += `<li>${node}</li>`;
    }
  }

  buildTree(xmlData);
  xmlTreeHTML += '</ul>';

  return xmlTreeHTML;
}

var port = process.env.PORT || 3000;
app.listen(port, function () {
	console.log("Server Has Started!");
});