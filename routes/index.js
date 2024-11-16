var express = require("express");
var router = express.Router();
const User = require("../models/userModel");
const { validateEmail, validatePassword } = require("./customValidators");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const Product = require("../models/medicmodel");

// Define the isAuthenticated middleware
const isAuthenticated = (req, res, next) => {
  // Check if the user is authenticated
  if (req.session && req.session.userEmail) {
    // User is authenticated, proceed to the next middleware
    return next();
  }

  // User is not authenticated, redirect to the login page
  res.redirect("/login");
};

router.get("/", function (req, res) {
  const email = req.session.userEmail || null;
  res.render("hello-world", { email: email });
});

router.get("/signup", (req, res) => {
  res.render("signup", { message: null, error: null });
});

router.post("/signup", (req, res) => {
  const { email, password, confirmPassword } = req.body;
  console.log(email, password, confirmPassword);
  const user = new User({ email, password });
  const validationError = user.validateSync();
  if (password !== confirmPassword) {
    return res.render("signup", {
      message: "Password and Confirm Password do not match",
      error: null,
    });
  }
  if (validationError) {
    return res.render("signup", {
      message: null,
      error: validationError.errors,
    });
  }
  User.findOne({ email })
    .then((existingUser) => {
      if (existingUser) {
        console.log(existingUser);
        return res.render("signup", {
          message: "Email already taken",
          error: null,
        });
      } else {
        return bcrypt.hash(password, 10);
      }
    })
    .then((hashedPassword) => {
      const signupUser = new User({ email, password: hashedPassword });
      console.log(signupUser);

      return signupUser.save();
    })
    .then(() => {
      res.redirect("/login");
    })
    .catch((error) => {
      console.error(error);
    });
});

router.get("/login", (req, res) => {
  res.render("login", { errors: [], message: null });
});

router.post(
  "/login",
  [
    // Add custom validation that required/imported
    validateEmail,
    validatePassword,
  ],
  function (req, res) {
    // Access the validation errors from the request object
    const errors = req.validationErrors || [];

    // Validate the request
    const validationResultErrors = validationResult(req);
    if (!validationResultErrors.isEmpty()) {
      // Merge the errors from validation result into the existing errors
      errors.push(...validationResultErrors.array());
    }

    if (errors.length > 0) {
      // There are validation errors, render the form with errors
      res.render("login", { errors, message: null });
    } else {
      const { email, password } = req.body;
      let foundUser; // Declare foundUser here

      User.findOne({ email })
        .then((user) => {
          console.log(user);
          if (!user) {
            return res.render("login", {
              message: "Incorrect Email Address.",
              errors: [],
            });
          }
          foundUser = user; // Assign user to foundUser
          return bcrypt.compare(password, user.password);
        })
        .then((isPasswordValid) => {
          if (!isPasswordValid) {
            return res.render("login", {
              message: "Incorrect password.",
              errors: [],
            });
          }
          // Set user's ID and email in the session
          req.session.userId = foundUser._id;
          req.session.userEmail = foundUser.email;
          res.redirect("/medic");
        })
        .catch((error) => {
          console.error(error);
          res.status(500).send("Internal Server Error");
        });
    }
  }
);
router.get("/addmadic", isAuthenticated, function (req, res) {
  res.render("addmedic", { title: "to add" });
});
router.post("/addeditem", function (req, res) {
  const email = req.session.userEmail;
  console.log(email);
  Product.find({ createdBy: email })
    .countDocuments()
    .then((data) => {
      if (data >= 5) {
        return res.json("Cant add more than 5 Medicine");
      } else {
        const medicine = req.body.medicine;
        console.log(medicine);
        const Availablestock = req.body.Availablestock;
        console.log(Availablestock);
        // Create a new User object
        const newitem = new Product({
          Medicine: medicine,
          Availablestock: Availablestock,
          addedAt: Date.now(),
          createdBy: email,
        });
        // Save the User object to the database
        newitem
          .save()
          .then(() => {
            res.redirect("/medic");
          })
          .catch((error) => {
            console.error(error);
            res.status(500).send("Internal Server Error");
          });
      }
    });
});

router.get("/delete/:id", function (req, res) {
  const reqId = req.params.id;
  Product.findByIdAndDelete(reqId)
    .then((data) => res.redirect("/medic"))
    .catch((err) => console.log(err));
});

router.get("/medic", isAuthenticated, function (req, res) {
  const { page = 1, limit = 2 } = req.query; // Set default page and limit
  const email = req.session.userEmail;
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };
  console.log(email);

  Product.paginate({ createdBy: email }, options)
    .then((result) => {
      res.render("medictable", { data: result.docs, pagination: result });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Internal Server Error");
    });
});

router.get("/update/:id",isAuthenticated, function (req, res) {
  const reqId = req.params.id;
  Product.findById(reqId)
    .then((data) => res.render("editing", { data: data, title: "Update Page" }))
    .catch((err) => console.log(err));
});

router.post("/updateitem/:id",isAuthenticated, function (req, res) {
  const reqId = req.params.id;
  const email = req.session.userEmail
  const { Medicine, Availablestock } = req.body;
  console.log(req.body);

  const product = new Product({ Medicine, Availablestock,addedAt: Date.now(),createdBy:email });
  const validationErrors = product.validateSync();
  if (validationErrors) {
    res.render("editing",{data:[],title: "Update Page"});
    console.log(validationErrors);
    
  } else {
    Product.findByIdAndUpdate(reqId, {
      Medicine,
      Availablestock,
      addedAt: Date.now(),
      createdBy : email
    })
      .then((updatedProduct) => {
        if (updatedProduct) {
          res.redirect("/medic");
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }
});

//route for logout
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      res.send("Error");
    } else {
      res.redirect("/login");
    }
  });
});


router.get("/search-medicine", (req, res) => {
  const email = req.session.userEmail
  const medicineName = req.query.medicine;
  console.log(medicineName);
  Product.find({createdBy:email, Medicine: { $regex: medicineName, $options: "i" } })
    .then((results) => res.json(results))
    .catch((error) => {
      console.error(error);
      res.status(500).send("Internal Server Error");
    });
});

module.exports = router;
