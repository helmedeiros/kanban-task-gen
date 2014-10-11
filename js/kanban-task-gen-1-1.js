console.log('Kanban Task Gen v1.1');

(function (jQuery, Firebase, Path) {
    "use strict";

    // the main firebase reference
    var rootRef = new Firebase('https://kanban-task-gen.firebaseio.com/web/uauth');

    var userRef;

    // pair our routes to our form elements and controller
    var routeMap = {
        '#/': {
            form: 'frmHome',
            controller: 'home'
        },
            '#/overview': {
            form: 'frmOverview',
            controller: 'overview'
        },
            '#/gettingstarted': {
            form: 'frmGettingStarted',
            controller: 'gettingStarted',
            authRequired: true // must be logged in to get here
        },
    };

    // create the object to store our controllers
    var controllers = {};

    // store the active form shown on the page
    var activeForm = null;

    var alertBox = $('#alert');

    var menu = $('#nav');

    var count = 0;

    function routeTo(route) {
        window.location.href = '#/' + route;
    }

    // Handle third party login providers
    // returns a promise
    function thirdPartyLogin(provider) {
        var deferred = $.Deferred();

        rootRef.authWithOAuthPopup(provider, function (err, user) {
            if (err) {
                deferred.reject(err);
            }

            if (user) {
                _kmq.push(['record', 'Signed In', {'provider':provider}]);

                deferred.resolve(user);
            }
        });

        return deferred.promise();
    };

    // Handle Email/Password login
    // returns a promise
    function authWithPassword(userObj) {
        var deferred = $.Deferred();
        
        rootRef.authWithPassword(userObj, function onAuth(err, user) {
            if (err) {
                deferred.reject(err);
            }

            if (user) {
                deferred.resolve(user);
            }

        });

        return deferred.promise();
    }

    // create a user but not login
    // returns a promsie
    function createUser(userObj) {
        var deferred = $.Deferred();
        rootRef.createUser(userObj, function (err) {

            if (!err) {
                deferred.resolve();
            } else {
                deferred.reject(err);
            }

        });

        return deferred.promise();
    }

    // Create a user and then login in
    // returns a promise
    function createUserAndLogin(userObj) {
        return createUser(userObj)
            .then(function () {
            return authWithPassword(userObj);
        });
    }

    // authenticate anonymously
    // returns a promise
    function authAnonymously() {
        var deferred = $.Deferred();
        rootRef.authAnonymously(function (err, authData) {

            if (authData) {
                deferred.resolve(authData);
            }

            if (err) {
                deferred.reject(err);
            }

        });

        return deferred.promise();
    }

    // route to the specified route if sucessful
    // if there is an error, show the alert
    function handleAuthResponse(promise, route) {
        $.when(promise)
            .then(function (authData) {

            // route
            routeTo(route);

        }, function (err) {
            console.log(err);
            // pop up error
            showAlert({
                title: err.code,
                detail: err.message,
                className: 'alert-danger'
            });

        });
    }

    // options for showing the alert box
    function showAlert(opts) {
        var title = opts.title;
        var detail = opts.detail;
        var className = 'alert ' + opts.className;


        

        alertBox.removeClass().addClass(className);
        alertBox.children('#alert-title').text(title);
        alertBox.children('#alert-detail').text(detail);
    }

    /// Controllers
    ////////////////////////////////////////

    controllers.home = function (form) {
        

        // Form submission for logging in
        form.on('submit', function (e) {

            var user = $(this).serializeObject();
            var loginPromise = authWithPassword(userAndPass);
            e.preventDefault();

            handleAuthResponse(loginPromise, 'gettingstarted');

        });

        // Social buttons
        form.find('.bt-social').on('click', function (e) {

            var $currentButton = $(this);
            var provider = $currentButton.data('provider');
            var socialLoginPromise;
            e.preventDefault();

            socialLoginPromise = thirdPartyLogin(provider);
            handleAuthResponse(socialLoginPromise, '');

        });

        form.find('#btAnon').on('click', function (e) {
            e.preventDefault();
            handleAuthResponse(authAnonymously(), 'profilex');
        });

    };

    // logout immediately when the controller is invoked
    controllers.logout = function (form) {
        rootRef.unauth();
    };

    controllers.overview = function (form) {

        

    };

    controllers.gettingStarted = function (form) {
        
        // Check the current user
        var user = rootRef.getAuth();
        
        // If no current user send to register page
        if (!user) {
            routeTo('home');
            return;
        }

        // Save user's info to Firebase
        form.on('submit', function (e) {
            e.preventDefault();
            var userInfo = $(this).serializeObject();

            count++;
            userInfo.id = count;
            userInfo.specialist2 = '';
            userInfo.time2 = '';

            userRef.push(userInfo, function onComplete() {

                // show the message if write is successful
                showAlert({
                    title: 'Successfully saved!',
                    detail: 'You are still logged in',
                    className: 'alert-success'
                });

            });
        });

    };

    /// Routing
    ////////////////////////////////////////

    // Handle transitions between routes
    function transitionRoute(path) {
        // grab the config object to get the form element and controller
        var formRoute = routeMap[path];
        var currentUser = rootRef.getAuth();

        
        // if authentication is required and there is no
        // current user then go to the register page and
        // stop executing
        if (formRoute.authRequired && !currentUser) {
            routeTo('home');
            return;
        }

        // wrap the upcoming form in jQuery
        var upcomingForm = $('#' + formRoute.form);


        // if there is no active form then make the current one active
        if (!activeForm) {
            activeForm = upcomingForm;
        }


        // hide old form and show new form
        activeForm.hide();
        upcomingForm.show().hide().fadeIn(750);

        // remove any listeners on the soon to be switched form
        activeForm.off();

        // set the new form as the active form
        activeForm = upcomingForm;

        menu.find('li').removeClass('active');
        menu.find('.' + formRoute.controller).addClass("active");

        // invoke the controller
        controllers[formRoute.controller](activeForm);
    }

    // Set up the transitioning of the route
    function prepRoute() {
        transitionRoute(this.path);
    }


    /// Routes
    ///  #/         - Home
    //   #/overview - Overview
    //   #/gettingstarted - Getting started
    
    Path.map("#/").to(prepRoute);
    Path.map("#/overview").to(prepRoute);
    Path.map("#/gettingstarted").to(prepRoute);
    Path.map("#/logout").to(prepRoute);

    Path.root("#/");

    /// Initialize
    ////////////////////////////////////////

    $(function () {

        // Start the router
        Path.listen();

        // whenever authentication happens send a popup
        rootRef.onAuth(function globalOnAuth(authData) {

            if (authData) {
                $('#post-its').empty();

                _kmq.push(['identify', authData.uid]);

                // Load user info
                userRef = rootRef.child('users').child(authData.uid);
                userRef.once('value', function (snap) {
                    var user = snap.val();
                    if (!user) {
                        return;
                    }
                });

                userRef.on('child_added', function(snapshot) {
                    var data = snapshot.val();

                    count = data.id;

                    var page = new Page();
                    page.parseStories({'tasks' : [data]});

                }, function (errorObject){
                    console.log('The read failed: ' + errorObject.code);

                });

            } else {
                showAlert({
                    title: 'You are not logged in',
                    detail: '',
                    className: 'alert-info'
                });
            }

        });

    });

}(window.jQuery, window.Firebase, window.Path))