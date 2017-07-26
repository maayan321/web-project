var express = require('express');
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var router = express.Router();
var passport = require('passport');

var jwt = require('express-jwt');
//check the secret ant try to change back to SECRET
var secret = 'Dumbledor';

var auth = jwt({secret: secret, userProperty: 'payload'});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/posts', function(req, res, next) {
    Post.find(function(err, posts){
        if(err){ return next(err); }

        res.json(posts);
    });
});




router.post('/posts', auth, function(req, res, next) {

    // console.log("PAYLOAD:", req.payload);
    var post = new Post(req.body);
    post.author = req.payload.id;
    // var user = User.findById(req.payload.id);
    // console.log("user : " ,user);
    // console.log("post : " ,post);

    // user.myPosts.push(post);

    User.findById(req.payload.id).then(function(user){
        if (!user) { return res.sendStatus(401); }

        return user.insertPost(post);

    }).catch(next);

    // user.insertPost(post)
    // user.save();
    // // Story.
    // find(...).
    // populate({
    //     path: 'fans',
    //     match: { age: { $gte: 21 }},
    //     // Explicitly exclude `_id`, see http://bit.ly/2aEfTdB
    //     select: 'name -_id',
    //     options: { limit: 5 }
    // }).
    // exec()
    //
    // post.populate({
    //     path: 'author'
    // });
        post.save(function(err, post){
        if(err){ return next(err); }

        res.json(post);
    });
});
router.param('post', function(req, res, next, id) {
    var query = Post.findById(id);

    query.exec(function (err, post){
        if (err) { return next(err); }
        if (!post) { return next(new Error('can\'t find post')); }

        req.post = post;
        return next();
    });
});





// Preload comment objects on routes with ':comment'
router.param('comment', function(req, res, next, id) {
    var query = Comment.findById(id);

    query.exec(function (err, comment){
        if (err) { return next(err); }
        if (!comment) { return next(new Error("can't find comment")); }

        req.comment = comment;
        return next();
    });
    // query.populate('author').execPopulate().then(function (err, comment){
    //     if (err) { return next(err); }
    //     if (!comment) { return next(new Error("can't find comment")); }
    //
    //     req.comment = comment;
    //     return next();
    // });
});

router.get('/posts/:post', function(req, res, next) {
    req.post.populate('comments author' , function(err, post) {
        if (err) { return next(err); }

        res.json(post);
    });
});

// router.put('/posts/:post/upvote', auth , function(req, res, next) {
//     req.post.upvote(function(err, post){
//         if (err) { return next(err); }
//
//         res.json(post);
//     });
// });
// router.post('/:article/favorite', auth.required, function(req, res, next) {
//     var articleId = req.article._id;
//
//     User.findById(req.payload.id).then(function(user){
//         if (!user) { return res.sendStatus(401); }
//
//         return user.favorite(articleId).then(function(){
//             return req.article.updateFavoriteCount().then(function(article){
//                 return res.json({article: article.toJSONFor(user)});
//             });
//         });
//     }).catch(next);
// });

router.put('/posts/:post/favorite', auth, function(req, res, next) {
    // console.log("im hereee in favorite");
    // console.log("req.post._id:", req.post._id);
    // var postId = req.post._id;
    var post1 = req.post;

    User.findById(req.payload.id).then(function(user){
        // console.log("user :", user);

        if (!user) { return res.sendStatus(401); }
        if(req.post.author.toString() === user._id.toString()){
            return next(new Error("can't like your own posts"));
        }

        return user.favorite(post1).then(function(){
            return req.post.updateFavoriteCount(user).then(function(post){

                User.
                find({}).
                populate('users').
                exec(function(error, users) {
                    for(j = 0 ; j < users.length ; j++){
                        users[j].updateFollowingPostsforallusers(post);
                    }
                });

                return res.json(post);
            });
        });
    }).catch(next);
});


router.put('/posts/:post/follow' ,auth, function(req, res, next) {

    User.findById(req.payload.id).then(function(user){
        // console.log("user : " ,user._id);
        // console.log("req.post.author : " ,req.post.author);
        // console.log("req.post.author === user : " ,req.post.author.toString() === user._id.toString());


        if (!user) { return res.sendStatus(401); }
        if(req.post.author.toString() === user._id.toString()){
            return next(new Error("can't follow yourself"));
        }
        return user.follow(req.post.author);

    }).catch(next);



});

router.put('/posts/:post/unfollow',auth , function(req, res, next) {

    User.findById(req.payload.id).then(function(user){
        // console.log("user : " ,user._id);
        // console.log("req.post.author : " ,req.post.author);
        // console.log("req.post.author === user : " ,req.post.author.toString() === user._id.toString());
        if (!user) { return res.sendStatus(401); }
        // if(req.post.author.toString() === user._id.toString()){
        //     return next(new Error("can't follow yourself"));
        // }
        return user.unfollow(req.post.author);

    }).catch(next);


    // var profileId = req.profile._id;
    //
    // User.findById(req.payload.id).then(function(user){
    //     if (!user) { return res.sendStatus(401); }
    //
    //     return user.unfollow(profileId).then(function(){
    //         return res.json({profile: req.profile.toProfileJSONFor(user)});
    //     });
    // }).catch(next);


});




router.put('/posts/:post/edit', auth, function(req, res, next) {
    //
    // console.log("request post : ", req.post);//returns the current value(not the new one im trying to insert!!)
    // console.log("request post description: ", req.post.description);//returns the current value(not the new one im trying to insert!!)
    // // console.log("request body post description: ", req.body.post.description);///
    // console.log("request body: ", req.body);///returns keys and values with new values i want to update with
    // console.log("request body description: ", req.body.description);//returns only the value -the new one
    // // console.log("request body post description: ", req.body.post.description);
    // console.log("request body image: ", req.body.image);///leave it empty attemp



        if (typeof req.body.description !== 'undefined' ) {

            req.post.description = req.body.description;
            // User.findById(req.payload.id).then(function(user){
            //     console.log("user: ", user.myPosts);
            //
            //     user.myPosts.save();
            // });

         }

    if (typeof req.body.recipename !== 'undefined' ) {

        req.post.recipename = req.body.recipename;
    }
    if (typeof req.body.image !== 'undefined' ) {

        req.post.image = req.body.image;
    }
    if (typeof req.body.ingredients !== 'undefined' ) {

        req.post.ingredients = req.body.ingredients;
    }
    if (typeof req.body.initialdirections !== 'undefined' ) {

        req.post.initialdirections = req.body.initialdirections;
    }
    if (typeof req.body.detailedtext !== 'undefined' ) {

        req.post.detailedtext = req.body.detailedtext;
    }
    if (typeof req.body.detailedimage !== 'undefined' ) {

        req.post.detailedimage = req.body.detailedimage;
    }
    if (typeof req.body.type !== 'undefined' ) {

        req.post.type = req.body.type;
    }
    // User.findById(req.payload.id).then(function(user){
    //     console.log("user: ", user.myPosts);
    //     user.myPosts.save();
    // });
    // Story.
    // find(...).
    // populate({
    //     path: 'fans',
    //     match: { age: { $gte: 21 }},
    //     // Explicitly exclude `_id`, see http://bit.ly/2aEfTdB
    //     select: 'name -_id',
    //     options: { limit: 5 }
    // }).
    // exec()

    // User.findById({_id: req.payload.id}).
    // populate('following').
    // exec(function (error, users) {
    //     console.log("users.following.length: ", users.following.length);
    //     // a.includes(2)
    //     for(var i=0 ; i< users.following.length ; i++){
    //         //
    //         // users.upvote(function(err, comment){
    //         //      if (err) { return next(err); }
    //         //
    //         //      res.json(comment);
    //         //  });
    //         //  console.log("users.following[]" + i, users.following[i].myPosts[0]._id);
    //
    //         users.addToPostsIFollow(users.following[i].myPosts);
    //
    //
    //     }
    User.findById(req.payload.id).then(function(user){
        user.insertPost(req.post);
    });


    req.post.save();

});




router.post('/posts/:post/comments', auth , function(req, res, next) {
    var comment = new Comment(req.body);
    comment.post = req.post;
    comment.author = req.payload.username;

    comment.save(function(err, comment){
        if(err){ return next(err); }

        req.post.comments.push(comment);
        req.post.save(function(err, post) {
            if(err){ return next(err); }

            res.json(comment);
        });
    });
});



// router.param('username', function(req, res, next, username){
//     User.findOne({username: username}).then(function(user){
//         if (!user) { return res.sendStatus(404); }
//
//         req.profile = user;
//
//         return next();
//     }).catch(next);
// });
//
//
// router.get('/:username', auth, function(req, res, next){
//     if(req.payload){
//         User.findById(req.payload.id).then(function(user){
//             if(!user){ return res.json({profile: req.profile.toProfileJSONFor(false)}); }
//
//             return res.json({profile: req.profile.toProfileJSONFor(user)});
//         });
//     } else {
//         return res.json({profile: req.profile.toProfileJSONFor(false)});
//     }
// });



// upvote a comment
router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next) {
    // console.log("body: ", req.post);
    req.comment.upvote(function(err, comment){
        if (err) { return next(err); }

        res.json(comment);
    });
});



//
// router.post('/:username/follow', auth.required, function(req, res, next){
//     var profileId = req.profile._id;
//
//     User.findById(req.payload.id).then(function(user){
//         if (!user) { return res.sendStatus(401); }
//
//         return user.follow(profileId).then(function(){
//             return res.json({profile: req.profile.toProfileJSONFor(user)});
//         });
//     }).catch(next);
// });
//
//
// router.delete('/:username/follow', auth.required, function(req, res, next){
//     var profileId = req.profile._id;
//
//     User.findById(req.payload.id).then(function(user){
//         if (!user) { return res.sendStatus(401); }
//
//         return user.unfollow(profileId).then(function(){
//             return res.json({profile: req.profile.toProfileJSONFor(user)});
//         });
//     }).catch(next);
// });



router.post('/users', function(req, res, next){
    if(!req.body.username || !req.body.password){
        return res.status(400).json({message: 'Please fill out all fields'});
    }

    var user = new User();

    user.username = req.body.username;

    user.setPassword(req.body.password);

    user.save(function (err){
        if(err){ return next(err); }

        return res.json({token: user.generateJWT()})
    });
});


router.post('/users/login', function(req, res, next){
    if(!req.body.username || !req.body.password){
        return res.status(400).json({message: 'Please fill out all fields'});
    }

    passport.authenticate('local', function(err, user, info){
        if(err){ return next(err); }

        if(user){
            return res.json({token: user.generateJWT()});
        } else {
            return res.status(401).json(info);
        }
    })(req, res, next);
});


// router.get('/user', function(req, res, next){
//     console.log("req body: " , req.body);
//      User.findById(req.payload.id).then(function(user){
//         if(!user){ return res.sendStatus(401); }
//         return res.json({user: user.toAuthJSON()});
//     }).catch(next);
// });


router.get('/user',auth, function(req, res, next){
    // console.log("in user req:",req);
    // console.log("in user req body:",req.body);
    // console.log("in user req.payload.id:",req.payload.id);




    // { path: 'following', select: 'myPosts' }

    User.findById({_id: req.payload.id}).
        populate('following').
        exec(function (error, users) {
            // console.log("users.following.length: ", users.following.length);
            for(var i=0 ; i< users.following.length ; i++){

                // console.log("users.following[i].myPosts::", users.following[i].myPosts);

                console.log(users.following[i].myPosts[0]);
                users.addToPostsIFollow(users.following[i].myPosts);


            }

            // console.log("users.following: ", users.following);
            if(users.following.length === 0 ){
                users.postsImFollowing = [];
            }
            // //     // console.log(res.json({fo: users.postsImFollowing[0]}));
        // {article: article.toJSONFor(user)}
        // console.log("im here")
        // res.send('hi there');
        // return res.json({users: users.toJSONFor(user)});


        // res.json( users.toJSONFor());
            res.json(users.toJSONFor());

        // console.log("users im following: ", users);
    });

    // User.
    // findById({_id: req.payload.id}).
    // populate('following').
    // exec(function(error, users) {
    //
    //         if (!user) { return res.sendStatus(401); }
    //         user.addmyposts(user2.myPosts);
    //
    //
    //         // Date associated with image
    //     });


    // User.
    // findById({ _id : req.post.author }).
    // populate('users').
    // exec(function(error, user2) {
    //     console.log("find it:", user2);
    //     User.findById(req.payload.id).then(function(user){
    //         // console.log("user2 myposts::", user2.myPosts);
    //         if (!user) { return res.sendStatus(401); }
    //         user.addmyposts(user2.myPosts);
    //
    //
    //         // Date associated with image
    //     })});

    // User.
    // findById({ _id : req.post.author }).
    // populate('users').
    // exec(function(error, user2) {
    //     console.log("find it:", user2);
    //     User.findById(req.payload.id).then(function(user){
    //         // console.log("user2 myposts::", user2.myPosts);
    //         if (!user) { return res.sendStatus(401); }
    //         user.addmyposts(user2.myPosts);
    //
    //
    //         // Date associated with image
    //     })});

        //     User.
        // find({}).
        // populate('users').
        // exec(function(error, user2) {
        //     console.log("find it:", user2);
        //     User.findById(req.payload.id).then(function(user){
        //             console.log("user2 myposts::", user2.myPosts);
        //             if (!user) { return res.sendStatus(401); }
        //         user.addmyposts(user2.myPosts[0]);
        //
        //
        //     // Date associated with image
        // })});


        // user.follow(req.post.author);

    // }).catch(next);




    // console.log("me: " ,req.payload.username);
    // User.
    // find({}).
    // populate('users').
    // exec(function(error, user2) {
    //     console.log("find it:", user2[1].myPosts[0]);
    //
    //
    //     // Date associated with image
    // });


    // User.findById(req.payload.id).then(function(user){
    //     if (!user) { return res.sendStatus(401); }
    //
    //     console.log("check:", Post.find({author: {$in: user.following}}).populate('author'));
    //
    //     // Promise.all([
    //     //     Post.find({ author: {$in: user.following}})
    //     //         .populate('author')
    //     //         .exec(),
    //     //     Post.count({ author: {$in: user.following}})
    //     // ]);
    //     //     .then(function(results){
    //     //     var post = results[0];
    //     //     var postCount = results[1];
    //     //
    //     //     return res.json({
    //     //         posts: posts.map(function(post){
    //     //             return post.toJSONFor(user);
    //     //         }),
    //     //         postCount: postCount
    //     //     });
    //     // }).catch(next);
    // });
});


module.exports = router;
