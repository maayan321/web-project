angular.module('recipeNews', ['ui.router'])

.config([
    '$stateProvider',
    '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: '/home.html',
                controller: 'MainCtrl',
                resolve: {
                    postPromise: ['posts', function(posts){
                        return posts.getAll();
                    }]
                }
            })
            .state('posts', {
                url: '/posts/{id}',
                templateUrl: '/posts.html',
                controller: 'PostsCtrl',
                resolve: {
                    post: ['$stateParams', 'posts', function($stateParams, posts) {
                        return posts.get($stateParams.id);
                    }]
                }
            })

            .state('editPost', {
                url: '/posts/{id}/edit',
                templateUrl: '/editPost.html',
                controller: 'EditPostCtrl',
                resolve: {
                    post: ['$stateParams', 'posts', function($stateParams, posts) {
                        return posts.get($stateParams.id);
                    }]
                }
            })

            .state('follow', {
                url: '/posts/{id}/follow',
                templateUrl: '/follow.html',
                controller: 'PostsCtrl',
                resolve: {
                    post: ['$stateParams', 'posts', function($stateParams, posts) {
                        return posts.get($stateParams.id);
                    }]
                }
            })
            .state('addRecipe', {
                 url: '/addRecipe',
                templateUrl: '/addRecipe.html',
                controller: 'AddRecipeCtrl'
                // resolve: {
                //     post: ['$stateParams', 'posts', function($stateParams, posts) {
                //         return posts.get($stateParams.id);
                //     }]
                // }
            })


            .state('user', {
                url: '/user',
                templateUrl: '/user.html',
                controller: 'UserCtrl',
                resolve: {
                    postPromise: ['myPosts', function(myPosts){
                        return myPosts.getFollowedPosts();
                    }]
                }
            })

            .state('/users/login', {
                url: '/users/login',
                templateUrl: '/users/login.html',
                controller: 'AuthCtrl',
                onEnter: ['$state', 'auth', function($state, auth){
                    if(auth.isLoggedIn()){
                        $state.go('home');
                    }
                }]
            })
            .state('users', {
                url: '/users',
                templateUrl: '/users.html',
                controller: 'AuthCtrl',
                onEnter: ['$state', 'auth', function($state, auth){
                    if(auth.isLoggedIn()){
                        $state.go('home');
                    }
                }]
            });

        $urlRouterProvider.otherwise('home');
    }])

    .factory( 'myPosts', ['$http', 'auth', function($http, auth){
        var my = {
            myPosts: []
        };

        my.getFollowedPosts = function() {
            // my.myPosts = [];
            return $http.get('/user' , {
                headers: {Authorization: 'Bearer '+auth.getToken()}
            }).then(function(data){
                // my.myPosts=[];
                // my.myPosts = data.data.postsImFollowing.slice;
                console.log("DATA::", data.data.postsImFollowing);
                angular.copy(data.data.postsImFollowing, my.myPosts);
                for(var j = 0 ; j< data.data.postsImFollowing.length ; j++){
                    if( data.data.postsImFollowing[j] === null){
                        data.data.postsImFollowing.splice(j, 1);
                    }
                }
                for(var i = 0 ; i< data.data.postsImFollowing.length ; i++){
                    my.myPosts[i]= data.data.postsImFollowing[i];
                }

                // for(var k = 0 ; k<= data.data.postsImFollowing.length ; k++){
                //     if( my.myPosts[k] === null){
                //         data.data.postsImFollowing.splice(k, 1);
                //     }
                // }

                // my.myPosts.push.apply(my.myPosts, data.data.postsImFollowing);
                // angular.copy(data.data.postsImFollowing, my.myposts);

            });
        };
        return my;


}])
.factory( 'posts', ['$http', 'auth', function($http, auth){


    var o = {
        posts: []
    };

    o.getAll = function() {
        return $http.get('/posts').success(function(data){
            angular.copy(data, o.posts);
        });
    };
    o.create = function(post) {
        return $http.post('/posts', post, {
            headers: {Authorization: 'Bearer '+auth.getToken()}
        }).success(function(data){
            o.posts.push(data);
        });
    };


    // o.upvote = function(post) {
    //     return $http.put('/posts/' + post._id + '/upvote', null, {
    //         headers: {Authorization: 'Bearer '+auth.getToken()}
    //     }).success(function(data){
    //         post.upvotes += 1;
    //     });
    // };

    o.favorite = function(post) {
        console.log("trying to send http favorite");
        return $http.put('/posts/' + post._id + '/favorite', null, {
            headers: {Authorization: 'Bearer '+auth.getToken()}
        })
            .success(function(data){
                console.log("DATA::", data);

                post.upvotes = data.favoritesCount;
        });
    };

    o.followUser = function(post) {
        return $http.put('/posts/' + post._id + '/follow', null, {
            headers: {Authorization: 'Bearer '+auth.getToken()}
        });

    };
    o.UnFollowUser = function(post) {
        return $http.put('/posts/' + post._id + '/unfollow', null, {
            headers: {Authorization: 'Bearer '+auth.getToken()}
        });

    };

    o.get = function(id) {
        return $http.get('/posts/' + id).then(function(res){
            return res.data;
        });
    };

    o.addComment = function(id, comment) {
        return $http.post('/posts/' + id + '/comments', comment, {
            headers: {Authorization: 'Bearer '+auth.getToken()}
        });
    };

    o.updatePost = function (post, postToUpdate  ) {
        // console.log("the post im sending with http:", post);
        // console.log("the postToUpdate im sending with http:", postToUpdate);
        return $http.put('/posts/' + post._id + '/edit' , postToUpdate, {
            headers: {Authorization: 'Bearer '+auth.getToken()}
        });
            // headers: {Authorization: 'Bearer '+auth.getToken()}

        //     .success(function(data){
        //     comment.upvotes += 1;
        // });
    };

    o.upvoteComment = function(post, comment) {
        return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, {
            headers: {Authorization: 'Bearer '+auth.getToken()}
        }).then(function(data){
            comment.upvotes += 1;
        });
    };
    return o;
}])



    // .factory('users', ['$http', 'auth', function($http, auth){
    //
    //     var u = {
    //         users: []
    //     };
    //
    //     return u;
    // }])


    .factory('auth', ['$http', '$window', '$rootScope', function($http, $window, $rootScope){
        var auth = {
            saveToken: function (token){
                $window.localStorage['recipe-news-token'] = token;
            },
            getToken: function (){
                return $window.localStorage['recipe-news-token'];
            },
            isLoggedIn: function(){
                var token = auth.getToken();

                if(token){
                    var payload = JSON.parse($window.atob(token.split('.')[1]));
                    // console.log("payload: ", payload);
                    return payload.exp > Date.now() / 1000;
                } else {
                    return false;
                }
            },
            currentUser: function(){
                if(auth.isLoggedIn()){
                    var token = auth.getToken();
                    var payload = JSON.parse($window.atob(token.split('.')[1]));

                    return payload.username;
                }
            },

            register: function(user){
                return $http.post('/users', user).success(function(data){
                    auth.saveToken(data.token);
                });
            },
            logIn: function(user){
                return $http.post('/users/login', user).success(function(data){
                    auth.saveToken(data.token);
                });
            },
            logOut: function(){
                $window.localStorage.removeItem('recipe-news-token');
            }

        };

        return auth;
    }])

.controller('MainCtrl', [
    '$scope',
    'posts',
    'auth',
    '$rootScope',
    '$state',
    '$location',
    function($scope, posts, auth, $rootScope, $state, $location){
        $scope.test = 'Hello world!';

        $scope.posts = posts.posts;
        $scope.isLoggedIn = auth.isLoggedIn;






        $scope.addPost = function(){
            posts.create(post._id,{
                name : auth.currentUser(),
                recipename: $scope.recipename,
                image: $scope.image,
                description: $scope.description,
                ingredients: $scope.ingredients.split(","),
                initialdirections: $scope.initialdirections,
                // detaileddirections: $scope.detaileddirections=[],
                detailedtext: $scope.detailedtext.split(","),
                detailedimage: $scope.detailedimage.split(","),
                type: $scope.type




            });

            $scope.image = '';
            $scope.recipename = '';
            $scope.description = '';
            $scope.ingredients = '';
            $scope.directions = '';
            $scope.type = '';


        };

        $scope.incrementUpvotes = function(post) {
            posts.favorite(post).then(function(){
                // $route.reload();
                $location.path('/home');
            });
        };
    }])

    .controller('AddRecipeCtrl', [
        '$scope',
        'posts',
        'auth',
        function($scope, posts, auth){
            $scope.test = 'Hello world!';

            $scope.posts = posts.posts;
            $scope.isLoggedIn = auth.isLoggedIn;



            $scope.addPost = function(){
                posts.create({
                    name : auth.currentUser().toString(),
                    recipename: $scope.recipename,
                    image: $scope.image,
                    description: $scope.description,
                    ingredients: $scope.ingredients.split(","),
                    initialdirections: $scope.initialdirections,
                    // detaileddirections: $scope.detaileddirections=[],
                    detailedtext: $scope.detailedtext.split(","),
                    detailedimage: $scope.detailedimage.split(","),
                    type: $scope.type




                });

                $scope.image = '';
                $scope.recipename = '';
                $scope.description = '';
                $scope.ingredients = '';
                $scope.directions = '';
                $scope.type = '';


            };

            $scope.incrementUpvotes = function(post) {
                posts.favorite(post);
            };
        }])
    .controller('PostsCtrl', [
        '$scope',
        'posts',
        'post',
        'auth',
        function($scope, posts, post, auth){
            $scope.post = post;
            $scope.isLoggedIn = auth.isLoggedIn;

            $scope.followUser = function () {
                posts.followUser(post);
            };

            $scope.UnFollowUser = function () {
                posts.UnFollowUser(post);
            };

            $scope.addComment = function(){
                if($scope.body === '') { return; }
                posts.addComment(post._id, {
                    body: $scope.body,
                    author: 'user'
                }).success(function(comment) {
                    $scope.post.comments.push(comment);
                });
                $scope.body = '';
            };

            $scope.incrementUpvotes = function(comment){
                posts.upvoteComment(post, comment);
            };
        }])


    .controller('UserCtrl', [
        '$scope',

        'myPosts',
        function($scope, myPosts){



        // $scope.getFollowedPosts = function () {
        //     myPosts.getFollowedPosts();
        // };

            $scope.followedPosts = myPosts.myPosts;
        // console.log("followedPosts",  $scope.followedPosts);




        }])



////EDIT POST
    .controller('EditPostCtrl', [
        '$scope',
        'posts',
        'post',
        'auth',
        function($scope, posts, post, auth){
            $scope.post = post;
            $scope.isLoggedIn = auth.isLoggedIn;

            // $scope.recipe = recipeService.recipes[$routeParams.id];
            // console.log("the post to edit:", post);
            // console.log("the post id:" , post._id);
            //
            // console.log("current user: ", auth.currentUser());
            // console.log("property: ",auth.userProperty);
            // console.log("token: ", auth.getToken());
            // console.log("post name: ", post.name);
            // console.log("are equal? : ", auth.currentUser() === post.name);





            $scope.canUpdate = function () {
                if(auth.currentUser() === $scope.post.name){
                    return true;
                }else{

                    return false;}
            };



            $scope.updatePost = function () {
                posts.updatePost(post,
                    {
                        recipename : $scope.recipename,
                        image : $scope.image,
                        description : $scope.description,
                        ingredients : $scope.ingredients,
                        initialdirections : $scope.initialdirections,
                        detailedtext: $scope.detailedtext,
                        detailedimage: $scope.detailedimage,
                        type : $scope.type

                    });
            };



        }])

    .controller('AuthCtrl', [
        '$scope',
        '$state',
        'auth',
        function($scope, $state, auth){
            $scope.user = {};

            $scope.register = function(){
                auth.register($scope.user).error(function(error){
                    $scope.error = error;
                }).then(function(){
                    $state.go('home');
                });
            };

            $scope.logIn = function(){
                auth.logIn($scope.user).error(function(error){
                    $scope.error = error;
                }).then(function(){
                    $state.go('home');
                });
            };

            $scope.getMyInfo = function () {
                auth.getUserInfo($scope.user).error(function(error){
                    $scope.error = error;
                });
            }
        }])


    .controller('NavCtrl', [
        '$scope',
        'auth',
        function($scope, auth){
            $scope.isLoggedIn = auth.isLoggedIn;
            $scope.currentUser = auth.currentUser;
            $scope.logOut = auth.logOut;
        }]);