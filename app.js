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
const nodemailer = require("nodemailer");


const homeStartingContent = "Hello guys, Welcome to my blog site. Here you can Post your thoughts and we will publish in this site. This is the home page , here you can see some points of different posts and when you click on read more it will redirect you to that post page. We have 5 options in the navigation bar. Through Compose you can create a new post. Through All posts you can see all the posts that has been posted in our blog.";
const aboutContent = "Hey guys,This is about us section of our site.";
const contactContent = "You are in the Contact page of our site. If you are facing any difficulty or want to give some suggestion on upgrading the site you can directly connect me on LinkedIN. ";


const app = express();
const conf = sec.getSecurity();
const secret = sec.getSecret();


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
const commentSchema = new mongoose.Schema({
  name: String,
  comment: String
})

const Comment = mongoose.model("Comment", commentSchema);

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is needed for the post"],
  },
  content: String,
  user: userSchema,
  comments: Array
})

const Post = mongoose.model("Post", postSchema);


function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}
var matchotp = 0;
var valid = true;
var usern = "";
var regusername = "";
var regpassword = "";
var regname = ""

app.get("/", (req, res) => {
  if (req.isAuthenticated()){
    usern = req.user.name;
    Post.find({}, (err, posts) => {
      if (!err) {
        res.render("home", {
          userfname: "| "+req.user.name,
          hcontent: homeStartingContent,
          newpost: posts,
          var1: "compose",
          var2: "logout"
        });
      }
    })
  } else {
    Post.find({}, (err, posts) => {
      if (!err) {
        res.render("home", {
          userfname: "",
          hcontent: homeStartingContent,
          newpost: posts,
          var1: "login",
          var2: "register"
        });
      }
    })
  }
})

app.get("/about", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("about", {
      acontent: aboutContent,
      userfname: "| "+usern,
      var1: "compose",
      var2: "logout"
    })
  } else {
    res.render("about", {
      acontent: aboutContent,
      userfname: "",
      var1: "login",
      var2: "register"
    })
  }
  
})

app.get("/contact", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("contact", {
      ccontent: contactContent,
      userfname: "| "+usern,
      var1: "compose",
      var2: "logout"
    })
  } else {
    res.render("contact", {
      ccontent: contactContent,
      userfname: "",
      var1: "login",
      var2: "register"
    })
  }
})

app.get("/compose", (req, res) => {
  if (req.isAuthenticated()){
    res.render("compose", {
      userfname: "| "+usern,
      var1: "compose",
      var2: "logout"
    })
  } else {
    res.redirect("/register")
  }
})

app.get("/login", (req, res) => {
    if (valid){
      res.render("login", {
        userfname: "",
        var1: "login",
        var2: "register",
        credentials: ""
      })
    } else {
      res.render("login", {
        userfname: "",
        var1: "login",
        var2: "register",
        credentials: "Invalid Login or password"
      })
    }
})

app.get("/register", (req, res) => {
  res.render("register", {
    userfname: "",
    var1: "login",
    var2: "register",
    credentials: "Invalid Login or password"
  })
})

app.get("/posts", (req, res) => {
  Post.find({}, (err, posts) => {
    if (!err) {
      if (req.isAuthenticated()){
        res.render("posts", {
          newpost: posts,
          userfname: "| "+usern,
          var1: "compose",
          var2: "logout"
        })
      } else {
        res.render("posts", {
          newpost: posts,
          userfname: "",
          var1: "login",
          var2: "register"
        })
      }
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
        if (req.isAuthenticated()){
          res.render("post", {
            pid: post._id,
            ptitle: post.title,
            pcontent: post.content,
            pauthor: post.user.name,
            userfname: "| "+usern,
            var1: "compose",
            var2: "logout",
            pcomments: post.comments
          });
        } else {
          res.render("post", {
            pid: post._id,
            ptitle: post.title,
            pcontent: post.content,
            pauthor: post.user.name,
            userfname: "",
            var1: "login",
            var2: "register",
            pcomments: post.comments
          });
        }
      }
    })
  })
})

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.get("/otpverify", (req, res) =>{
  res.render("otpverify")
})

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
  regusername = req.body.username;
  regname = req.body.fname;
  regpassword = req.body.password;

    otp = getRandomInt(100000,1000000);
    matchotp = otp;
    var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: secret.email,
            pass: secret.password
        }
    });
    
    var mailOptions = {
        from: secret.email,
        to: regusername,
        subject: "OTP for Fiercht Blog",
        html: `<h1>Hello ${regname}</h1><p>OTP for your registration is</p><h2>${otp}</h2>`
    }

    transporter.sendMail(mailOptions, (err, info) =>{
        if (err) {
            console.log(err);
        } else {
            console.log(`Email sent: `+info.response);
            res.redirect("/otpverify");
        }
    })
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
});

app.post("/otp", (req, res) =>{
  if (req.body.otp == matchotp) {
    User.register({username: regusername, name: regname}, regpassword, function(err, user){
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local", function(){
          res.redirect("/login")
        })(req, res)
      }
    });
  } else {
    res.render("error")
  }
})

app.post("/post/comment", async function (req, res) {
  console.log(req.body.pid);
  const comment = new Comment({
    name: usern,
    comment: req.body.ucomment
  });
  allcomments=[comment]
  await Post.findById({_id: req.body.pid}, function (err, post) {
    post.comments.forEach((item)=>{
      allcomments.push(item)
    })
    // console.log(`Inside find ${allcomments}`);
  })
  await Post.updateOne(
    {_id: req.body.pid}, 
    {$set: {
    comments: allcomments
      }
    },
    function (err) {
      if (err) {
        console.log(err);
      } else {
        // console.log(`updated ${allcomments}`);
      }
    })
    // console.log(`after update ${allcomments}`);
  comment.save()
  res.redirect("/posts/"+req.body.pid)
})

app.get('*', function(req, res){
  res.render("error")
});






app.listen( process.env.PORT || 3000, ()  => {
  if (!process.env.PORT) {
    console.log("Server started on port 3000");
  }
});
