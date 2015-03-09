(function (Path) {
    "use strict";

    var config = window.KANBAN_CONFIG || {};
    var alertView = new AlertView($('#alert'));
    var storageProbe = new StorageProbe({});
    var storageWritable = storageProbe.probe();
    if (!storageWritable) {
        $('#storageBanner').removeAttr('hidden');
        $(document.body).addClass('has-storage-banner');
    }
    var storageErrorReported = false;
    function reportStorageError(info) {
        if (storageErrorReported) {
            return;
        }
        storageErrorReported = true;
        alertView.show({
            title: 'Local storage is full',
            detail: 'Your latest changes could not be saved. Use Share board to download a snapshot, then clear old cards before adding more.',
            className: 'alert-danger'
        });
        if (window.console && window.console.warn) {
            window.console.warn('Storage write failed', info);
        }
    }

    var authService = new LocalAuthService();
    var boardsCatalog = new BoardsCatalog({ errorReporter: reportStorageError });
    var activeBoard = boardsCatalog.getActive();
    var localRepository = new LocalStorageBoardRepository(boardsCatalog.cardNamespaceFor(activeBoard.id), reportStorageError);
    var localAnalytics = new LocalAnalytics({ errorReporter: reportStorageError });
    var analytics = new CompositeAnalytics([localAnalytics]);
    if (config.kissmetricsKey) {
        analytics.add(new KissmetricsAnalytics());
    }

    var routeMap = {
        '#/':              { form: 'frmHome',           controller: 'home' },
        '#/overview':      { form: 'frmOverview',       controller: 'overview' },
        '#/gettingstarted':{ form: 'frmGettingStarted', controller: 'gettingStarted' },
        '#/board':         { form: 'frmBoard',          controller: 'board' },
        '#/print':         { form: 'frmPrint',          controller: 'print' },
        '#/events':        { form: 'frmEvents',         controller: 'events' },
        '#/logout':        { form: 'frmHome',           controller: 'logout' }
    };

    var controllers = {};

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
        router: router
    });

    var gettingStartedController = new GettingStartedController({
        authService: authService,
        alertView: alertView,
        counter: counter,
        getBoardRepository: function () { return boardSession.repository; },
        analytics: analytics
    });

    var cardModal = new CardModal({
        el: $('.card-modal'),
        renderer: new PostItRenderer()
    });

    var boardController = new BoardController({
        renderer: new BoardCardRenderer(),
        getBoardRepository: function () { return boardSession.repository; },
        getActiveBoard: function () { return boardsCatalog.getActive(); },
        modal: cardModal,
        analytics: analytics,
        alertView: alertView
    });

    var printController = new PrintController({
        renderer: new PostItRenderer(),
        getBoardRepository: function () { return boardSession.repository; },
        targetSelector: '#print-cards'
    });

    var eventsController = new EventsController({ analytics: localAnalytics });

    var jsonUpload = new JsonUpload({
        page: page,
        alertView: alertView,
        fileInputSelector: '#jsonFile',
        getBoardRepository: function () { return boardSession.repository; },
        analytics: analytics,
        router: router
    });

    controllers.home = function (form) { homeController.attach(form); };
    controllers.gettingStarted = function (form) { gettingStartedController.attach(form); };
    controllers.board = function (form) { boardController.attach(form); };
    controllers.print = function (form) {
        printController.attach(form);
        form.find('.print-trigger').off('click.print').on('click.print', function () { window.print(); });
    };
    controllers.events = function (form) { eventsController.attach(form); };
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
        $('<option></option>').val('__rename__').text('✎ Rename current board…').appendTo(select);
        $('<option></option>').val('__delete__').text('× Delete current board…').appendTo(select);
        select.val(current.id);
        select.on('change', function () {
            var picked = select.val();
            if (picked === '__new__') {
                createNewBoard(catalog, current, select);
            } else if (picked === '__rename__') {
                renameCurrentBoard(catalog, current, select);
            } else if (picked === '__delete__') {
                deleteCurrentBoard(catalog, current, select);
            } else {
                switchToBoard(catalog, current, picked);
            }
        });
    }

    function createNewBoard(catalog, current, select) {
        var name = window.prompt('Name your new board');
        if (!name) {
            select.val(current.id);
            return;
        }
        var created = catalog.create(name);
        catalog.setActiveId(created.id);
        analytics.track('board_created', { boardId: created.id, name: created.name });
        window.location.reload();
    }

    function renameCurrentBoard(catalog, current, select) {
        var name = window.prompt('Rename "' + current.name + '" to:', current.name);
        if (!name || name === current.name) {
            select.val(current.id);
            return;
        }
        catalog.rename(current.id, name);
        analytics.track('board_renamed', { boardId: current.id, name: name });
        window.location.reload();
    }

    function switchToBoard(catalog, current, picked) {
        catalog.setActiveId(picked);
        analytics.track('board_switched', { fromBoardId: current.id, toBoardId: picked });
        window.location.reload();
    }

    function deleteCurrentBoard(catalog, current, select) {
        if (catalog.list().length <= 1) {
            window.alert('You need at least one board.');
            select.val(current.id);
            return;
        }
        if (!window.confirm('Delete "' + current.name + '"? All its cards will be removed.')) {
            select.val(current.id);
            return;
        }
        catalog.remove(current.id);
        analytics.track('board_deleted', { boardId: current.id, name: current.name });
        var remaining = catalog.list();
        if (remaining.length) {
            catalog.setActiveId(remaining[0].id);
        }
        window.location.reload();
    }

}(window.Path));
