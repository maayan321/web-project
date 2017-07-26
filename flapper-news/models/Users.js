var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var uniqueValidator = require('mongoose-unique-validator');
// var User = mongoose.model('User');
// var Post = mongoose.model('Post');

 var secret = 'Dumbledor';
// var Post = mongoose.model('Post');

var PostSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // author: {type: String},
    name: {type: String},
    recipename: {type: String},
    image : {type: String},
    description : {type: String},
    ingredients : [{type: String}],
    initialdirections: {type: String},
    detailedtext : [{type: String}],
    detailedimage : [{type: String}],
    upvotes: {type: Number, default: 0},
    favoritesCount: {type: Number, default: 0},
    type : {type: String},
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
});


PostSchema.methods.toJSONFor = function(user){
    return {
        recipename: this.recipename,
        image :this.image,
        description: this.description,
        ingredients : this.ingredients,
        initialdirections : this.initialdirections,
        detailedtext : this.detailedtext,
        detailedimage : this.detailedimage,
        upvotes: this.upvotes,
        type :this.type,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        favorited: user ? user.isFavorite(this._id) : false,
        favoritesCount: this.favoritesCount,
        author: this.author


    };
};
// var copiedObjectWithId = JSON.parse(JSON.stringify(objectToCopy));


PostSchema.methods.updateFavoriteCount = function(user) {
    // console.log("im in PostSchema.methods.updateFavoriteCount 1");
    // console.log("user:::::" , user);
    var post = this;

    return mongoose.model('User').count({favorites: {$in: [post._id]}}).then(function(count){
        // console.log("im in PostSchema.methods.updateFavoriteCount 2");
        // for(i=0 ; i< user.postsImFollowing.length ; i++){
        //     // console.log("user.postsImFollowing[i]._id: ", user.postsImFollowing[i]._id);
        //     // console.log("post._id:" , post._id);
        //     // console.log("post._id===user.postsImFollowing[i]._id:" , post._id===user.postsImFollowing[i]._id);
        //     // console.log("user.postsImFollowing[i]._id.toString() === post._id.toString():" , user.postsImFollowing[i]._id.toString() === post._id.toString());
        //     if(user.postsImFollowing[i]._id.toString() === post._id.toString()){
        //         console.log("count: ", count);
        //         // user.postsImFollowing[i] = {}
        //         user.postsImFollowing[i].favoritesCount = Number(count);
        //         // console.log(" user.postsImFollowing[i].favoritesCount: ",  user.postsImFollowing[i].favoritesCount);
        //         user.save();
        //     }
        // }

        post.favoritesCount = count;
        // console.log("im in PostSchema.methods.updateFavoriteCount 3");

        // for(i=0 ; i< user.postsImFollowing.length ; i++){
        //     // console.log("user.postsImFollowing[i]._id: ", user.postsImFollowing[i]._id);
        //     // console.log("post._id:" , post._id);
        //     // console.log("post._id===user.postsImFollowing[i]._id:" , post._id===user.postsImFollowing[i]._id);
        //     // console.log("user.postsImFollowing[i]._id.toString() === post._id.toString():" , user.postsImFollowing[i]._id.toString() === post._id.toString());
        //     if(user.postsImFollowing[i]._id.toString() === post._id.toString()){
        //         console.log("count: ", count);
        //         // user.postsImFollowing[i] = {}
        //         user.postsImFollowing.splice(i,1);
        //         // user.postsImFollowing[i].favoritesCount = Number(count);
        //          var copiedObjectWithId = JSON.parse(JSON.stringify(post));
        //          console.log("copiedObjectWithId:" , copiedObjectWithId);
        //             user.postsImFollowing.push(copiedObjectWithId);
        //         // console.log(" user.postsImFollowing[i].favoritesCount: ",  user.postsImFollowing[i].favoritesCount);
        //         user.save();
        //     }
        // }


        return post.save();
    });
};


// UserSchema.methods.count = function (cb) {
//     conditions: Object, callback?: (err: any, count: number) => void: Query<number>;
// }

PostSchema.methods.upvote = function(cb) {
    // console.log("cb: ", cb);
    this.upvotes += 1;
    this.save(cb);
};

PostSchema.methods.update = function(cb) {
    // console.log("cb: ", cb);
    // this.description = 'updated by alex';
    // console.log("cb description: ", cb.req);
    this.save(cb);
};





mongoose.model('Post', PostSchema);



var UserSchema = new mongoose.Schema({
    username: {type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/^[a-zA-Z0-9]+$/, 'is invalid'], index: true},
    // email: {type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true},    bio: String,
    postsImFollowing:[PostSchema],
    myPosts: [PostSchema],
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    hash: String,
    salt: String
}, {timestamps: true});

UserSchema.plugin(uniqueValidator, {message: 'is already taken.'});




UserSchema.methods.validPassword = function(password) {
    var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha512').toString('base64');

    return this.hash === hash;
};


UserSchema.methods.setPassword = function(password){
    this.salt = crypto.randomBytes(16).toString('hex');

    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha512').toString('base64');
};

UserSchema.methods.generateJWT = function() {
    var today = new Date();
    var exp = new Date(today);
    exp.setDate(today.getDate() + 60);

    return jwt.sign({
        id: this._id,
        username: this.username,
        exp: parseInt(exp.getTime() / 1000),
    }, secret);
};

UserSchema.methods.toAuthJSON = function(){
    return {
        username: this.username,
        // email: this.email,
        token: this.generateJWT()
        // bio: this.bio,
        // image: this.image
    };
};


UserSchema.methods.toJSONFor = function(){
    return {
        postsImFollowing: this.postsImFollowing,

        // my.
        // username: this.username,
        // // bio: this.bio,
        // // image: this.image || 'https://static.productionready.io/images/smiley-cyrus.jpg',
        // following: user ? user.isFollowing(this._id) : false
    };
};

// UserSchema.methods.addmyposts = function(postar){
//     for(i =0 ; i<= postar.length ; i++) {
//         console.log("index of: ",this.postsImFollowing.indexOf(postar[i] ));
//         if(this.postsImFollowing.indexOf(postar[i]) === -1) {
//             this.postsImFollowing.push(postar[i]);
//         }
//     }
//
//
//
//     return this.save();
// };


UserSchema.methods.addToPostsIFollow = function(postar){
    // console.log("im hereee");

    // this.postsImFollowing = [];////not sureeee!!!!!!!!!!!!

    for(i =0 ; i< postar.length ; i++) {
// console.log("check contains : ", checkifcontains(this.postsImFollowing,postar[i]));

//         console.log("this.postsImFollowing id::::" , this.postsImFollowing[i]._id);
//
//         console.log("checkifcontains(this.postsImFollowing, postar[i]): " ,checkifcontains(this.postsImFollowing, postar[i]));
// console.log("postar" , postar[i]._id);
        if(checkifcontains(this.postsImFollowing, postar[i])) {
            this.postsImFollowing.push(postar[i]);
        }
    }
    // console.log(" this.postsImFollowing author", this.postsImFollowing.author)
    return this.save();
};

checkifcontains = function (arr, obj) {
    // console.log("im herein check");
    // console.log("arr length: ", arr.length);

    flag = true;
    var j;
    if(arr.length > 0 ){



        for (j = 0; j < arr.length; j++) {
            // console.log("im herein for loop");
            //
            // console.log("arr[i]._id", arr[j]._id);
            // console.log("obj._id", obj._id);
            //
            //
            // // console.log(" arr author: ", arr[i].author);
            // console.log(" arr image: ", arr[j].toString());
            // console.log(" obj image: ", obj.toString());
            if (arr[j]._id.toString() === obj._id.toString()) {
                flag = false;
            }


    }
    }else {
        flag = true;
    }
return flag
};

UserSchema.methods.favorite = function(post1){
    // console.log("index of id: ", this.favorites.indexOf(id));


    // for(i=0 ; i< this.postsImFollowing.length ; i++){
    //     // console.log("user.postsImFollowing[i]._id: ", user.postsImFollowing[i]._id);
    //     // console.log("post._id:" , post._id);
    //     // console.log("post._id===user.postsImFollowing[i]._id:" , post._id===user.postsImFollowing[i]._id);
    //     // console.log("user.postsImFollowing[i]._id.toString() === post._id.toString():" , user.postsImFollowing[i]._id.toString() === post._id.toString());
    //     if(this.postsImFollowing[i]._id.toString() === post1._id.toString()){
    //         console.log("count: ", count);
    //         // user.postsImFollowing[i] = {}
    //         this.postsImFollowing[i].favoritesCount = post1.favoritesCount;
    //         // console.log(" user.postsImFollowing[i].favoritesCount: ",  user.postsImFollowing[i].favoritesCount);
    //
    //     }
    // }



    // for(i=0 ; i< this.postsImFollowing.length ; i++){
    //     // console.log("user.postsImFollowing[i]._id: ", user.postsImFollowing[i]._id);
    //     // console.log("post._id:" , post._id);
    //     // console.log("post._id===user.postsImFollowing[i]._id:" , post._id===user.postsImFollowing[i]._id);
    //     // console.log("user.postsImFollowing[i]._id.toString() === post._id.toString():" , user.postsImFollowing[i]._id.toString() === post._id.toString());
    //     if(this.postsImFollowing[i]._id.toString() === post1._id.toString()){
    //         console.log("count: ", count);
    //         // user.postsImFollowing[i] = {}
    //         this.postsImFollowing[i].favoritesCount = post1.favoritesCount;
    //         // console.log(" user.postsImFollowing[i].favoritesCount: ",  user.postsImFollowing[i].favoritesCount);
    //
    //     }
    // }
    // var copiedObjectWithId = JSON.parse(JSON.stringify(objectToCopy));

    if(this.favorites.indexOf(post1._id) === -1){

        this.favorites.push(post1._id);

        // for(i=0 ; i< this.postsImFollowing.length ; i++){
        //     if(this.postsImFollowing[i]._id.toString() === post1._id.toString()){
        //         // user.postsImFollowing[i] = {}
        //         this.postsImFollowing[i].favoritesCount = post1.favoritesCount;
        //         // console.log(" user.postsImFollowing[i].favoritesCount: ",  user.postsImFollowing[i].favoritesCount);
        //
        //     }
        // }

    }else if(this.favorites.indexOf(post1._id) !== -1){
        this.favorites.remove( post1._id );

    }


    return this.save();
};

UserSchema.methods.unfavorite = function(id){
    this.favorites.remove( id );
    return this.save();
};

UserSchema.methods.isFavorite = function(id){
    return this.favorites.some(function(favoriteId){
        return favoriteId.toString() === id.toString();
    });
};

UserSchema.methods.follow= function(id){
    if(this.following.indexOf(id) === -1){
        this.following.push(id);
    }

    return this.save();
};


UserSchema.methods.insertPost= function(post){
    var i;
    for(i=0 ; i< this.myPosts.length ; i++ ){
        if(this.myPosts[i]._id.toString() === post._id.toString()){
            this.myPosts.splice(i,1);
        }
    }
        this.myPosts.push(post);


    return this.save();
};


UserSchema.methods.updateFollowingPosts= function(post){
    var i;
    for(i=0 ; i< this.postsImFollowing.length ; i++ ){
        if(this.postsImFollowing[i]._id.toString() === post._id.toString()){
            this.postsImFollowing.splice(i,1);
            this.postsImFollowing.push(post);
        }
    }



    return this.save();
};


UserSchema.methods.updateFollowingPostsforallusers= function(post){
    var i;
    for(i=0 ; i< this.postsImFollowing.length ; i++ ){
        if(this.postsImFollowing[i]._id.toString() === post._id.toString()){
            this.postsImFollowing.splice(i,1);
            this.postsImFollowing.push(post);
        }
    }



    return this.save();
};

// UserSchema.methods.follow= function(cb) {
//     console.log("cb: ", cb);
//     this.following.push(cb);
//     this.save(cb);
// };


UserSchema.methods.unfollow = function(id){
    this.following.remove(id);
    return this.save();
};

UserSchema.methods.isFollowing = function(id){
    return this.following.some(function(followId){
        return followId.toString() === id.toString();
    });
};

mongoose.model('User', UserSchema);