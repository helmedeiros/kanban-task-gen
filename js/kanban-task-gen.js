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
            controller: 'gettingStarted'
        },

        '#/logout': {
            form: 'frmHome',
            controller: 'logout'
        }
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

    var counter = new Counter();
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


    controllers.home = function (form) {

        form.on('submit', function (e) {
            e.preventDefault();

            var userAndPass = $(this).serializeObject();
            userAndPass.password = '12345';

            router.afterAuth(authService.signUpAndSignIn(userAndPass), 'gettingstarted');
        });

        form.find('.bt-social').on('click', function (e) {
            e.preventDefault();

            var provider = $(this).data('provider');
            var socialLoginPromise = authService.signInWith(provider);

            router.afterAuth(socialLoginPromise, 'gettingstarted');
        });

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

            userInfo.id = counter.next();
            userInfo.specialist2 = '';
            userInfo.time2 = '';

            boardRepository.add(userInfo).then(function () {
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


    function prepRoute() {
        router.transitionTo(this.path);
    }

    for (var hash in routeMap) {
        if (routeMap.hasOwnProperty(hash)) {
            Path.map(hash).to(prepRoute);
        }
    }

    Path.root("#/");

    $(function () {

        Path.listen();

        authService.onChange(function globalOnAuth(authData) {

            if (authData) {
                $('#post-its').empty();

                boardRepository = new BoardRepository(
                    rootRef.child('users').child(authData.uid)
                );

                boardRepository.onCardAdded(function(data) {
                    counter.observe(data.id);
                    page.parseStories({'tasks' : [data]});
                });

            }

        });

    });

}(window.jQuery, window.Firebase, window.Path));
