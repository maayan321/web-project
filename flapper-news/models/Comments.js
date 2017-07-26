var mongoose = require('mongoose');

// var CommentSchema = new mongoose.Schema({
//     body: String,
//     author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     upvotes: {type: Number, default: 0},
//     post: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }
// });
//
// CommentSchema.methods.upvote = function(cb) {
//     this.upvotes += 1;
//     this.save(cb);
// };



var CommentSchema = new mongoose.Schema({
    body: String,
    author: String,
    upvotes: {type: Number, default: 0},
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }
}, {timestamps: true});

// Requires population of author
CommentSchema.methods.toJSONFor = function(user){
    return {
        id: this._id,
        body: this.body,
        upvotes :{type: Number, default: 0},
        createdAt: this.createdAt,
        author:this.author
    };
};

CommentSchema.methods.upvote = function(cb) {
    this.upvotes += 1;
    this.save(cb);
};

mongoose.model('Comment', CommentSchema);