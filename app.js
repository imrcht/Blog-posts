//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const sec = require(__dirname+"/security.js");

const homeStartingContent = "Hello guys, this is Rachit gupta. Welcome to my blog site. Here you can Post your thoughts and we will publish in this site. This is the home page , here you can see some points of different posts and when you click on read more it will redirect you to that post page. We have 5 options in the navigation bar. Through Compose you can create a new post. Through All posts you can see all the posts that has been posted in our blog.";
const aboutContent = "Hey guys, it's Rachit again. This is about us section of our site.";
const contactContent = "You are in the Contact page of our site. If you are facing any difficulty or want to give some suggestion on upgrading the site you can directly connect me on LinkedIN. ";


const app = express();
const conf = sec.getSecurity();

mongoose.connect(`mongodb+srv://${conf.user}:${conf.pwd}@cluster0.vhg7m.mongodb.net/blogpostDB`, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname+"/public"));

const postSchema = mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is needed for the post"],
  },
  content: String,
})

const Post = mongoose.model("Post", postSchema);




app.get("/", (req, res) => {
  Post.find({}, (err, posts) => {
    if (!err) {
      res.render("home", {
        hcontent: homeStartingContent,
        newpost: posts,
      });
    }
  })
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
  res.render("compose")
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
        });
      }
    })
  })
})

app.post("/compose", (req, res) => {
  const postitem = new Post({
    title: req.body.postTitle,
    content: req.body.postBody,
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






app.listen( process.env.POST || 3000, ()  => {
  if (!process.env.POST) {
    console.log("Server started on port 3000");
  }
});
