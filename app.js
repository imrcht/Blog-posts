//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const sec = require(__dirname+"/security.js");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const { truncate } = require("lodash");


const homeStartingContent = "Hello guys, this is Rachit gupta. Welcome to my blog site. Here you can Post your thoughts and we will publish in this site. This is the home page , here you can see some points of different posts and when you click on read more it will redirect you to that post page. We have 5 options in the navigation bar. Through Compose you can create a new post. Through All posts you can see all the posts that has been posted in our blog.";
const aboutContent = "Hey guys, it's Rachit again. This is about us section of our site.";
const contactContent = "You are in the Contact page of our site. If you are facing any difficulty or want to give some suggestion on upgrading the site you can directly connect me on LinkedIN. ";

var valid = true;

const app = express();
const conf = sec.getSecurity();


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname+"/public"));
app.use(session({
  secret: "It's Rach Secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect(`mongodb+srv://${conf.user}:${conf.pwd}@cluster0.vhg7m.mongodb.net/blogpostDB`, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
  name: String,
  email: String,
  password: String,
  googleId: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// passport.use(new GoogleStrategy({
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: "http://localhost:7000/auth/google/secrets",
//     userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
//   },
//   function(accessToken, refreshToken, profile, cb) {

//     User.findOrCreate({ googleId: profile.id, username: profile.emails[0].value }, function (err, user) {
//       return cb(err, user);
//     });
//   }
// ));

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is needed for the post"],
  },
  content: String,
  user: userSchema
})

const Post = mongoose.model("Post", postSchema);


app.get("/", (req, res) => {
  if (req.isAuthenticated()){
    Post.find({}, (err, posts) => {
      if (!err) {
        res.render("userpage", {
          userfname: req.user.name,
          hcontent: homeStartingContent,
          newpost: posts,
        });
      }
    })
  } else {
    Post.find({}, (err, posts) => {
      if (!err) {
        res.render("home", {
          hcontent: homeStartingContent,
          newpost: posts,
        });
      }
    })
  }
})

app.get("/about", (req, res) => {
  res.render("about", {
    acontent: aboutContent,
  })
})

app.get("/contact", (req, res) => {
  res.render("contact", {
    ccontent: contactContent,
  })
})

app.get("/compose", (req, res) => {
  if (req.isAuthenticated()){
    res.render("compose")
  } else {
    res.redirect("/")
  }
})

app.get("/login", (req, res) => {
  if (valid){
    res.render("login",{
      credentials: ""
    })
  } else {
    res.render("login",{
      credentials: "Invalid Id or password"
    })
  }
})

app.get("/register", (req, res) => {
  res.render("register")
})

app.get("/posts", (req, res) => {
  Post.find({}, (err, posts) => {
    if (!err) {
      res.render("posts", {
        newpost: posts,
      })
    }
  })
})

app.get("/posts/:postName", (req, res) => {
  let urltitle = _.lowerCase(req.params.postName);
  let postid = req.params.postName;

  Post.find({}, (err, posts) => {
    posts.forEach((post) => {
      let storedtitle = _.lowerCase(post.title);
      if (storedtitle == urltitle || postid == post._id){
        res.render("post", {
          ptitle: post.title,
          pcontent: post.content,
          pauthor: post.user.name
        });
      }
    })
  })
})

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    valid = false;
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local", { failureRedirect: "/login" })(req, res, function(){
        valid = true;
        res.redirect("/");
      });
    }
  });
});

app.post("/register", (req, res) => {
  User.register({username: req.body.username, name: req.body.fname}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/");
      });
    }
  });
});

app.post("/compose", (req, res) => {
  newuser = User({
    name: req.user.name,
    email: req.user.username,
  })
  const postitem = new Post({
    title: req.body.postTitle,
    content: req.body.postBody,
    user: newuser
  });
  postitem.save((err) => {
    if (!err) {
      res.redirect("/")
    }
  });
})
app.get('*', function(req, res){
  res.render("error")
});






app.listen( process.env.PORT || 3000, ()  => {
  if (!process.env.PORT) {
    console.log("Server started on port 3000");
  }
});
