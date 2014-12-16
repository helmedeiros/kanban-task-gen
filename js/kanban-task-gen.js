(function (jQuery, Firebase, Path) {
    "use strict";

    var rootRef = new Firebase('https://kanban-task-gen.firebaseio.com/web/uauth');
    var authService = new AuthService(rootRef);

    var boardRepository;

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

    var controllers = {};

    var alertView = new AlertView($('#alert'));

    var router = new Router({
        routeMap: routeMap,
        menu: $('#nav'),
        controllers: controllers,
        authService: authService,
        alertView: alertView
    });

    var count = 0;
    var page = new Page();

    function readJsonFile(file) {
        var r = new FileReader();
        r.onload = function(e) {
            var contents = JSON.parse(e.target.result);
            page.parseStories(contents);
            $("body").scrollTop($('#post-its').position().top);
        };
        r.readAsText(file);
    }


    function handleAuthResponse(promise, route) {
        $.when(promise)
            .then(function () {

            router.routeTo(route);

        }, function (err) {
            console.log(err);
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

        form.on('submit', function (e) {
            e.preventDefault();

            var userAndPass = $(this).serializeObject();

            // hard-coded default; e-mail sign-up never asks for a password
            userAndPass.password = '12345';

            var loginPromise = authService.signUpAndSignIn(userAndPass);

            handleAuthResponse(loginPromise, 'gettingstarted');

        });

        form.find('.bt-social').on('click', function (e) {

            e.preventDefault();

            var $currentButton = $(this);
            var provider = $currentButton.data('provider');
            var socialLoginPromise;
            
            socialLoginPromise = authService.signInWith(provider);
            
            handleAuthResponse(socialLoginPromise, 'gettingstarted');

        });

    };

    controllers.overview = function () {

        // no action, so far

    };

    controllers.gettingStarted = function (form) {

        var user = authService.currentUser();

        if (!user) {
            authService.signInAnonymously();

            alertView.show({
                title: '',
                detail: 'Log in to store your post-its',
                className: 'alert-info'
            });
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

        form.on('submit', function (e) {
            e.preventDefault();
            var userInfo = $(this).serializeObject();

            count++;
            userInfo.id = count;
            userInfo.specialist2 = '';
            userInfo.time2 = '';

            boardRepository.add(userInfo).then(function onComplete() {
                alertView.show({
                    title: 'Successfully saved!',
                    detail: 'You are still logged in',
                    className: 'alert-success'
                });

            });

            $(this)[0].reset();
        });

    };


    controllers.logout = function () {
        authService.signOut();
    };


    /// Routing
    ////////////////////////////////////////

    function prepRoute() {
        router.transitionTo(this.path);
    }

    Path.map("#/").to(prepRoute);
    Path.map("#/overview").to(prepRoute);
    Path.map("#/gettingstarted").to(prepRoute);
    Path.map("#/logout").to(prepRoute);

    Path.root("#/");

    /// Initialize
    ////////////////////////////////////////

    $(function () {

        Path.listen();

        authService.onChange(function globalOnAuth(authData) {

            if (authData) {
                $('#post-its').empty();

                boardRepository = new BoardRepository(
                    rootRef.child('users').child(authData.uid)
                );

                boardRepository.onCardAdded(function(data) {
                    count = Math.max(count, Number(data.id) || 0);
                    page.parseStories({'tasks' : [data]});
                });

            }

        });

    });

}(window.jQuery, window.Firebase, window.Path));
