(function (Path) {
    "use strict";

    var authService = new LocalAuthService();
    var boardsCatalog = new BoardsCatalog({});
    var activeBoard = boardsCatalog.getActive();
    var localRepository = new LocalStorageBoardRepository(boardsCatalog.cardNamespaceFor(activeBoard.id));
    var analytics = new LocalAnalytics({});

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

    var cardModal = new CardModal({
        el: $('.card-modal'),
        renderer: new PostItRenderer()
    });

    var boardController = new BoardController({
        renderer: new BoardCardRenderer(),
        getBoardRepository: function () { return boardSession.repository; },
        modal: cardModal
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
        renderBoardSwitcher(boardsCatalog, activeBoard);

        analytics.track('app_loaded', { boardId: activeBoard.id, boardCount: boardsCatalog.list().length });

        authService.onChange(function (authData) {
            if (authData) {
                boardSession.start(authData);
            }
        });

        Path.listen();
    });

    function renderBoardSwitcher(catalog, current) {
        var select = $('#boardSwitcher');
        if (!select.length) {
            return;
        }
        select.empty();
        var boards = catalog.list();
        for (var i = 0; i < boards.length; i++) {
            $('<option></option>').val(boards[i].id).text(boards[i].name).appendTo(select);
        }
        $('<option></option>').val('__new__').text('+ New board…').appendTo(select);
        select.val(current.id);
        select.on('change', function () {
            var picked = select.val();
            if (picked === '__new__') {
                var name = window.prompt('Name your new board');
                if (!name) {
                    select.val(current.id);
                    return;
                }
                var created = catalog.create(name);
                catalog.setActiveId(created.id);
                analytics.track('board_created', { boardId: created.id, name: created.name });
            } else {
                catalog.setActiveId(picked);
                analytics.track('board_switched', { fromBoardId: current.id, toBoardId: picked });
            }
            window.location.reload();
        });
    }

}(window.Path));
