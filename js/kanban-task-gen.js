(function (Path) {
    "use strict";

    var authService = new LocalAuthService();
    var localRepository = new LocalStorageBoardRepository();

    var routeMap = {
        '#/':              { form: 'frmHome',           controller: 'home' },
        '#/overview':      { form: 'frmOverview',       controller: 'overview' },
        '#/gettingstarted':{ form: 'frmGettingStarted', controller: 'gettingStarted' },
        '#/board':         { form: 'frmBoard',          controller: 'board' },
        '#/print':         { form: 'frmPrint',          controller: 'print' },
        '#/logout':        { form: 'frmHome',           controller: 'logout' }
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

    var boardSession = new BoardSession({
        repositoryFactory: function () { return localRepository; },
        page: page,
        counter: counter,
        target: $('#post-its')
    });

    var homeController = new HomeController({
        authService: authService,
        router: router
    });

    var gettingStartedController = new GettingStartedController({
        authService: authService,
        alertView: alertView,
        counter: counter,
        getBoardRepository: function () { return boardSession.repository; }
    });

    var boardController = new BoardController({
        renderer: new BoardCardRenderer(),
        getBoardRepository: function () { return boardSession.repository; }
    });

    var printController = new PrintController({
        renderer: new PostItRenderer(),
        getBoardRepository: function () { return boardSession.repository; },
        targetSelector: '#print-cards'
    });

    var jsonUpload = new JsonUpload({
        page: page,
        alertView: alertView,
        fileInputSelector: '#jsonFile'
    });

    controllers.home = function (form) { homeController.attach(form); };
    controllers.gettingStarted = function (form) { gettingStartedController.attach(form); };
    controllers.board = function (form) { boardController.attach(form); };
    controllers.print = function (form) {
        printController.attach(form);
        form.find('.print-trigger').off('click.print').on('click.print', function () { window.print(); });
    };
    controllers.logout = function () { authService.signOut(); };

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
        jsonUpload.attach();

        authService.onChange(function (authData) {
            if (authData) {
                boardSession.start(authData);
            }
        });

        Path.listen();
    });

}(window.Path));
