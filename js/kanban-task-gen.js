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

    var homeController = new HomeController({
        authService: authService,
        router: router
    });

    var gettingStartedController = new GettingStartedController({
        authService: authService,
        alertView: alertView,
        counter: counter,
        getBoardRepository: function () { return boardRepository; }
    });

    function readJsonFile(file) {
        var r = new FileReader();
        r.onload = function(e) {
            var contents = JSON.parse(e.target.result);
            page.parseStories(contents);
            $("body").scrollTop($('#post-its').position().top);
        };
        r.readAsText(file);
    }

    $(function() {
        $('#jsonFile')[0].addEventListener('change', function(evt) {
            var files = evt.target.files;

            if (files) {
                for (var i = 0; i < files.length; i++) {
                    readJsonFile(files[i]);
                }
            } else {
                alertView.show({
                    title: '',
                    detail: 'Failed to load files',
                    className: 'alert-danger'
                });
            }
        }, false);
    });

    controllers.home = function (form) {
        homeController.attach(form);
    };

    controllers.gettingStarted = function (form) {
        gettingStartedController.attach(form);
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

        authService.onChange(function (authData) {
            if (!authData) {
                return;
            }

            $('#post-its').empty();
            boardRepository = new BoardRepository(
                rootRef.child('users').child(authData.uid)
            );

            boardRepository.onCardAdded(function (data) {
                counter.observe(data.id);
                page.parseStories({ tasks: [data] });
            });
        });
    });

}(window.jQuery, window.Firebase, window.Path));
