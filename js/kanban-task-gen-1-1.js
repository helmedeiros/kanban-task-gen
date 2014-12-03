(function (jQuery, Firebase, Path) {
    "use strict";

    // the main firebase reference
    var rootRef = new Firebase('https://kanban-task-gen.firebaseio.com/web/uauth');
    var authService = new AuthService(rootRef);

    var boardRepository;

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
            authRequired: false // if 'true', must be logged in to get here
        },

    };

    // create the object to store our controllers
    var controllers = {};

    // store the active form shown on the page
    var activeForm = null;

    var alertView = new AlertView($('#alert'));

    var menu = $('#nav');

    var count = 0;


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
            alertView.show({
                title: err.code,
                detail: err.message,
                className: 'alert-danger'
            });

        });
    }

    /// Controllers
    ////////////////////////////////////////

    controllers.home = function (form) {
        

        // Form submission for logging in
        form.on('submit', function (e) {
            e.preventDefault();

            var userAndPass = $(this).serializeObject();
            
            // set a default password
            userAndPass.password = '12345';

            var loginPromise = authService.signUpAndSignIn(userAndPass);
            

            handleAuthResponse(loginPromise, 'gettingstarted');

        });

        // Social buttons
        form.find('.bt-social').on('click', function (e) {

            e.preventDefault();

            var $currentButton = $(this);
            var provider = $currentButton.data('provider');
            var socialLoginPromise;
            
            socialLoginPromise = authService.signInWith(provider);
            
            handleAuthResponse(socialLoginPromise, 'gettingstarted');

        });

    };

    controllers.overview = function (form) {

        // no action, so far

    };

    controllers.gettingStarted = function (form) {
        
        // Check the current user
        var user = authService.currentUser();
        
        // If no current user authenticate anonymously
        if (!user) {
            
            authService.signInAnonymously();

            // pop up error
            alertView.show({
                title: '',
                detail: 'Log in to store your post-its',
                className: 'alert-info'
            });
        }

        function readJsonFile(file) {
            var r = new FileReader();
            r.onload = function(e) {
                var contents = JSON.parse(e.target.result);
                var page = new Page();
                page.parseStories(contents);
                $("body").scrollTop($('#post-its').position().top);
            };
            r.readAsText(file);
        }

        $('#jsonFile')[0].addEventListener('change', function(evt) {
            var files = evt.target.files;

            if (files) {
                for (var i = 0; i < files.length; i++) {
                    readJsonFile(files[i]);
                }

            } else {
                alert("Failed to load files");
            }
        }, false);

        // Save userInfo to Firebase
        form.on('submit', function (e) {
            e.preventDefault();
            var userInfo = $(this).serializeObject();

            count++;
            userInfo.id = count;
            userInfo.specialist2 = '';
            userInfo.time2 = '';

            boardRepository.add(userInfo).then(function onComplete() {

                // show the message if write is successful
                alertView.show({
                    title: 'Successfully saved!',
                    detail: 'You are still logged in',
                    className: 'alert-success'
                });

            });

            $(this)[0].reset();
        });

    };


    // logout immediately when the controller is invoked
    controllers.logout = function (form) {
        authService.signOut();
    };


    /// Routing
    ////////////////////////////////////////

    function routeTo(route) {
        window.location.href = '#/' + route;
    }

    // Handle transitions between routes
    function transitionRoute(path) {
        // grab the config object to get the form element and controller
        var formRoute = routeMap[path];
        var currentUser = authService.currentUser();
        
        var pageName = formRoute.controller;

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
        upcomingForm.show().hide().fadeIn(500);

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
        authService.onChange(function globalOnAuth(authData) {

            if (authData) {
                $('#post-its').empty();

                boardRepository = new BoardRepository(
                    rootRef.child('users').child(authData.uid)
                );

                boardRepository.onCardAdded(function(data) {
                    count = data.id;
                    var page = new Page();
                    page.parseStories({'tasks' : [data]});
                });

            }

        });

    });

}(window.jQuery, window.Firebase, window.Path));
