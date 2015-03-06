describe("Router", function() {
  var router;
  var controllers;
  var authService;
  var menu;
  var routeMap;

  beforeEach(function() {
    routeMap = {
      '#/home': { form: 'frmHome', controller: 'home' },
      '#/secret': { form: 'frmSecret', controller: 'secret', authRequired: true }
    };
    controllers = {
      home: jasmine.createSpy('homeController'),
      secret: jasmine.createSpy('secretController')
    };
    authService = { currentUser: jasmine.createSpy('currentUser').and.returnValue(null) };
    menu = $('<div><ul><li class="home">H</li><li class="secret">S</li></ul></div>');

    $('body').append($(
      '<form id="frmHome"></form>' +
      '<form id="frmSecret"></form>'
    ));

    router = new Router({
      routeMap: routeMap,
      menu: menu,
      controllers: controllers,
      authService: authService
    });
  });

  afterEach(function() {
    $('#frmHome, #frmSecret').remove();
  });

  it("redirects to home when an authRequired route has no current user", function() {
    spyOn(router, 'routeTo');
    router.transitionTo('#/secret');
    expect(router.routeTo).toHaveBeenCalledWith('home');
    expect(controllers.secret).not.toHaveBeenCalled();
  });

  it("invokes the matching controller for the route", function() {
    router.transitionTo('#/home');
    expect(controllers.home).toHaveBeenCalled();
  });

  it("marks the route's menu item as active", function() {
    router.transitionTo('#/home');
    expect(menu.find('.home').hasClass('active')).toBe(true);
  });

  it("tolerates a route without a controller", function() {
    routeMap['#/empty'] = { form: 'frmHome', controller: 'nope' };
    expect(function() { router.transitionTo('#/empty'); }).not.toThrow();
  });

  it("dismisses any active alert on transition", function() {
    var alertView = { show: jasmine.createSpy('show'), dismiss: jasmine.createSpy('dismiss') };
    router = new Router({
      routeMap: routeMap,
      menu: menu,
      controllers: controllers,
      authService: authService,
      alertView: alertView
    });
    router.transitionTo('#/home');
    expect(alertView.dismiss).toHaveBeenCalled();
  });

  describe("afterAuth", function() {
    var alertView;

    beforeEach(function() {
      alertView = { show: jasmine.createSpy('show') };
      router = new Router({
        routeMap: routeMap,
        menu: menu,
        controllers: controllers,
        authService: authService,
        alertView: alertView
      });
      spyOn(router, 'routeTo');
    });

    it("routes to the destination when the promise resolves", function() {
      var deferred = $.Deferred();
      router.afterAuth(deferred.promise(), 'home');
      deferred.resolve({ uid: 'u-1' });
      expect(router.routeTo).toHaveBeenCalledWith('home');
      expect(alertView.show).not.toHaveBeenCalled();
    });

    it("shows the alert when the promise rejects", function() {
      var deferred = $.Deferred();
      router.afterAuth(deferred.promise(), 'home');
      deferred.reject({ code: 'DENIED', message: 'nope' });
      expect(alertView.show).toHaveBeenCalled();
      var opts = alertView.show.calls.mostRecent().args[0];
      expect(opts.title).toEqual('DENIED');
      expect(opts.className).toEqual('alert-danger');
      expect(router.routeTo).not.toHaveBeenCalled();
    });

  });

});

describe("AlertView", function() {
  var box;
  var titleEl;
  var detailEl;
  var view;

  beforeEach(function() {
    titleEl = { text: jasmine.createSpy("titleText") };
    detailEl = { text: jasmine.createSpy("detailText") };
    box = {
      removeClass: jasmine.createSpy("removeClass"),
      addClass: jasmine.createSpy("addClass"),
      children: jasmine.createSpy("children").and.callFake(function(selector) {
        return selector === "#alert-title" ? titleEl : detailEl;
      }),
      fadeIn: jasmine.createSpy("fadeIn"),
      fadeOut: jasmine.createSpy("fadeOut")
    };
    box.removeClass.and.returnValue(box);
    box.fadeIn.and.returnValue(box);
    view = new AlertView(box);
  });

  it("paints the box class from opts.className", function() {
    view.show({ title: "T", detail: "D", className: "alert-info" });
    expect(box.addClass).toHaveBeenCalledWith("alert alert-info");
  });

  it("places title and detail text into their children", function() {
    view.show({ title: "Hello", detail: "World", className: "alert-info" });
    expect(titleEl.text).toHaveBeenCalledWith("Hello");
    expect(detailEl.text).toHaveBeenCalledWith("World");
  });

  it("fades in then out", function() {
    view.show({ title: "T", detail: "D", className: "alert-info" });
    expect(box.fadeIn).toHaveBeenCalled();
    expect(box.fadeOut).toHaveBeenCalled();
  });

  it("dismiss stops any in-flight animation and hides the box", function() {
    box.stop = jasmine.createSpy("stop").and.returnValue(box);
    box.hide = jasmine.createSpy("hide");
    view.dismiss();
    expect(box.stop).toHaveBeenCalledWith(true, true);
    expect(box.hide).toHaveBeenCalled();
  });

});

describe("BoardRepository", function() {
  var userRef;
  var repo;

  beforeEach(function() {
    userRef = {
      push: jasmine.createSpy("push"),
      on: jasmine.createSpy("on"),
      once: jasmine.createSpy("once"),
      child: jasmine.createSpy("child")
    };
    repo = new BoardRepository(userRef);
  });

  it("delegates add to userRef.push", function() {
    var card = { id: 1, name: "First" };
    repo.add(card);
    expect(userRef.push).toHaveBeenCalled();
    expect(userRef.push.calls.mostRecent().args[0]).toBe(card);
  });

  it("subscribes onCardAdded via child_added", function() {
    repo.onCardAdded(function() {});
    expect(userRef.on).toHaveBeenCalled();
    expect(userRef.on.calls.mostRecent().args[0]).toEqual('child_added');
  });

  it("delivers each new card's value to onCardAdded callbacks", function() {
    var seen;
    userRef.on = function(event, cb) {
      cb({ val: function() { return { id: "9" }; } });
    };
    repo.onCardAdded(function(value) { seen = value; });
    expect(seen.id).toEqual("9");
  });

  it("delegates getAll to userRef.once value", function() {
    repo.getAll();
    expect(userRef.once).toHaveBeenCalled();
    expect(userRef.once.calls.mostRecent().args[0]).toEqual('value');
  });

  it("update merges changes into the child of fbKey", function() {
    var childRef = { update: jasmine.createSpy('childUpdate') };
    userRef.child.and.returnValue(childRef);
    repo.update('fb-1', { status: 'doing' });
    expect(userRef.child).toHaveBeenCalledWith('fb-1');
    expect(childRef.update.calls.mostRecent().args[0]).toEqual({ status: 'doing' });
  });

  it("remove deletes the child of fbKey", function() {
    var childRef = { remove: jasmine.createSpy('childRemove') };
    userRef.child.and.returnValue(childRef);
    repo.remove('fb-1');
    expect(userRef.child).toHaveBeenCalledWith('fb-1');
    expect(childRef.remove).toHaveBeenCalled();
  });

});

describe("AuthService", function() {
  var rootRef;
  var auth;

  beforeEach(function() {
    rootRef = {
      authWithOAuthPopup: jasmine.createSpy("authWithOAuthPopup"),
      authWithPassword: jasmine.createSpy("authWithPassword"),
      authAnonymously: jasmine.createSpy("authAnonymously"),
      createUser: jasmine.createSpy("createUser"),
      getAuth: jasmine.createSpy("getAuth").and.returnValue({ uid: "u-1" }),
      unauth: jasmine.createSpy("unauth"),
      onAuth: jasmine.createSpy("onAuth")
    };
    auth = new AuthService(rootRef);
  });

  it("delegates signInWith to authWithOAuthPopup", function() {
    auth.signInWith("github");
    expect(rootRef.authWithOAuthPopup).toHaveBeenCalled();
    expect(rootRef.authWithOAuthPopup.calls.mostRecent().args[0]).toEqual("github");
  });

  it("delegates signInWithPassword to authWithPassword", function() {
    var creds = { email: "a@b.com", password: "secret" };
    auth.signInWithPassword(creds);
    expect(rootRef.authWithPassword).toHaveBeenCalled();
    expect(rootRef.authWithPassword.calls.mostRecent().args[0]).toBe(creds);
  });

  it("delegates signInAnonymously to authAnonymously", function() {
    auth.signInAnonymously();
    expect(rootRef.authAnonymously).toHaveBeenCalled();
  });

  it("delegates createUser to rootRef.createUser", function() {
    var creds = { email: "a@b.com", password: "secret" };
    auth.createUser(creds);
    expect(rootRef.createUser).toHaveBeenCalled();
    expect(rootRef.createUser.calls.mostRecent().args[0]).toBe(creds);
  });

  it("resolves signInWith when Firebase yields a user", function(done) {
    rootRef.authWithOAuthPopup = function(provider, cb) {
      cb(null, { uid: "u-1" });
    };
    auth.signInWith("github").then(function(user) {
      expect(user.uid).toEqual("u-1");
      done();
    });
  });

  it("rejects signInWith when Firebase yields an error", function(done) {
    rootRef.authWithOAuthPopup = function(provider, cb) {
      cb({ code: "DENIED" });
    };
    auth.signInWith("github").fail(function(err) {
      expect(err.code).toEqual("DENIED");
      done();
    });
  });

  it("returns the current user from getAuth", function() {
    expect(auth.currentUser().uid).toEqual("u-1");
  });

  it("signs out by calling unauth", function() {
    auth.signOut();
    expect(rootRef.unauth).toHaveBeenCalled();
  });

  it("subscribes to auth changes via onAuth", function() {
    var listener = function() {};
    auth.onChange(listener);
    expect(rootRef.onAuth).toHaveBeenCalledWith(listener);
  });

  it("creates a user then signs them in with the same credentials", function(done) {
    var creds = { email: "a@b.com", password: "secret" };
    rootRef.createUser = function(c, cb) { cb(null); };
    rootRef.authWithPassword = function(c, cb) { cb(null, { uid: "u-9" }); };
    auth.signUpAndSignIn(creds).then(function(user) {
      expect(user.uid).toEqual("u-9");
      done();
    });
  });

});

describe("LocalAuthService", function() {
  var auth;

  beforeEach(function() {
    auth = new LocalAuthService();
  });

  it("currentUser returns a stable local user", function() {
    expect(auth.currentUser().uid).toBeDefined();
  });

  it("signInAnonymously resolves with the local user", function(done) {
    auth.signInAnonymously().then(function(user) {
      expect(user.uid).toEqual(auth.currentUser().uid);
      done();
    });
  });

  it("onChange fires immediately with the current user", function() {
    var seen = null;
    auth.onChange(function(user) { seen = user; });
    expect(seen.uid).toEqual(auth.currentUser().uid);
  });

  it("signUpAndSignIn resolves with the local user", function(done) {
    auth.signUpAndSignIn().then(function(user) {
      expect(user.uid).toEqual(auth.currentUser().uid);
      done();
    });
  });

});

describe("LocalAnalytics", function() {
  var analytics;
  var store;

  beforeEach(function() {
    store = {};
    spyOn(window.localStorage, 'getItem').and.callFake(function(k) { return store[k] === undefined ? null : store[k]; });
    spyOn(window.localStorage, 'setItem').and.callFake(function(k, v) { store[k] = v; });
    spyOn(window.localStorage, 'removeItem').and.callFake(function(k) { delete store[k]; });
    analytics = new LocalAnalytics({ namespace: 'spec-events', limit: 5 });
  });

  it("track appends an event with name and properties", function() {
    analytics.track('card_created', { status: 'todo' });
    var list = analytics.list();
    expect(list.length).toEqual(1);
    expect(list[0].name).toEqual('card_created');
    expect(list[0].properties.status).toEqual('todo');
  });

  it("track stamps each event with a timestamp and unique id", function() {
    analytics.track('a');
    analytics.track('b');
    var list = analytics.list();
    expect(list[0].t).toBeDefined();
    expect(list[1].t).toBeDefined();
    expect(list[0].id).not.toEqual(list[1].id);
  });

  it("track preserves history across separate instances against the same namespace", function() {
    analytics.track('one');
    var other = new LocalAnalytics({ namespace: 'spec-events', limit: 5 });
    other.track('two');
    expect(other.list().map(function(e) { return e.name; })).toEqual(['one', 'two']);
  });

  it("track caps history at the limit", function() {
    for (var i = 0; i < 8; i++) {
      analytics.track('e', { i: i });
    }
    var list = analytics.list();
    expect(list.length).toEqual(5);
    expect(list[0].properties.i).toEqual(3);
    expect(list[4].properties.i).toEqual(7);
  });

  it("clear removes the log", function() {
    analytics.track('one');
    analytics.clear();
    expect(analytics.list()).toEqual([]);
  });

});

describe("CompositeAnalytics", function() {

  it("fans every track call out to each adapter", function() {
    var a = []; var b = [];
    var composite = new CompositeAnalytics([
      { track: function(n, p) { a.push({ n: n, p: p }); } },
      { track: function(n, p) { b.push({ n: n, p: p }); } }
    ]);
    composite.track('card_created', { status: 'todo' });
    expect(a).toEqual([{ n: 'card_created', p: { status: 'todo' } }]);
    expect(b).toEqual([{ n: 'card_created', p: { status: 'todo' } }]);
  });

  it("keeps calling adapters when one throws", function() {
    var calls = [];
    var composite = new CompositeAnalytics([
      { track: function() { throw new Error('boom'); } },
      { track: function(n) { calls.push(n); } }
    ]);
    composite.track('event_a');
    expect(calls).toEqual(['event_a']);
  });

  it("starts empty when no adapters are supplied", function() {
    var composite = new CompositeAnalytics();
    expect(function() { composite.track('x'); }).not.toThrow();
  });

  it("add registers another adapter at runtime", function() {
    var seen = [];
    var composite = new CompositeAnalytics();
    composite.add({ track: function(n) { seen.push(n); } });
    composite.track('later');
    expect(seen).toEqual(['later']);
  });

});

describe("KissmetricsAnalytics", function() {
  var fakeGlobal;
  var analytics;

  beforeEach(function() {
    fakeGlobal = {};
    analytics = new KissmetricsAnalytics({ global: fakeGlobal });
  });

  it("track pushes a record tuple to _kmq", function() {
    analytics.track('card_created', { status: 'todo' });
    expect(fakeGlobal._kmq).toEqual([['record', 'card_created', { status: 'todo' }]]);
  });

  it("track lazily initialises _kmq when missing", function() {
    expect(fakeGlobal._kmq).toBeUndefined();
    analytics.track('seen');
    expect(fakeGlobal._kmq.length).toEqual(1);
  });

  it("track preserves an existing _kmq queue from the snippet", function() {
    fakeGlobal._kmq = [['record', 'already_here']];
    analytics.track('next');
    expect(fakeGlobal._kmq.length).toEqual(2);
    expect(fakeGlobal._kmq[1][1]).toEqual('next');
  });

  it("identify pushes an identify tuple", function() {
    analytics.identify('helio@example.com');
    expect(fakeGlobal._kmq).toEqual([['identify', 'helio@example.com']]);
  });

  it("set pushes a set tuple with traits", function() {
    analytics.set({ plan: 'free' });
    expect(fakeGlobal._kmq).toEqual([['set', { plan: 'free' }]]);
  });

  it("track normalises a missing properties argument to {}", function() {
    analytics.track('plain');
    expect(fakeGlobal._kmq[0]).toEqual(['record', 'plain', {}]);
  });

});

describe("BoardsCatalog", function() {
  var catalog;
  var store;

  beforeEach(function() {
    store = {};
    spyOn(window.localStorage, 'getItem').and.callFake(function(k) { return store[k] === undefined ? null : store[k]; });
    spyOn(window.localStorage, 'setItem').and.callFake(function(k, v) { store[k] = v; });
    spyOn(window.localStorage, 'removeItem').and.callFake(function(k) { delete store[k]; });
    catalog = new BoardsCatalog({
      namespace: 'spec-boards',
      activeKey: 'spec-active',
      legacyCardKey: 'spec-cards',
      cardNamespacePrefix: 'spec-cards'
    });
  });

  it("seeds a default board on first use", function() {
    expect(catalog.list().length).toEqual(1);
    expect(catalog.list()[0].name).toEqual('My board');
  });

  it("create appends a new board with a unique id", function() {
    catalog.create('Personal');
    catalog.create('Work');
    var boards = catalog.list();
    expect(boards.length).toEqual(3);
    expect(boards[1].name).toEqual('Personal');
    expect(boards[2].name).toEqual('Work');
    expect(boards[1].id).not.toEqual(boards[2].id);
  });

  it("rename updates the board name in place", function() {
    var created = catalog.create('Personal');
    catalog.rename(created.id, 'Personal Tasks');
    var found = null;
    catalog.list().forEach(function(b) { if (b.id === created.id) { found = b; } });
    expect(found.name).toEqual('Personal Tasks');
  });

  it("remove drops the board and clears its card namespace", function() {
    var created = catalog.create('Personal');
    store[catalog.cardNamespaceFor(created.id)] = '{"k":{}}';
    catalog.remove(created.id);
    expect(catalog.list().length).toEqual(1);
    expect(store[catalog.cardNamespaceFor(created.id)]).toBeUndefined();
  });

  it("cardNamespaceFor maps default to the legacy key and new boards to prefixed keys", function() {
    expect(catalog.cardNamespaceFor('default')).toEqual('spec-cards');
    expect(catalog.cardNamespaceFor('b-123')).toEqual('spec-cards-b-123');
  });

  it("getActive returns the default board on first use", function() {
    expect(catalog.getActive().id).toEqual('default');
  });

  it("setActiveId persists the selection", function() {
    var created = catalog.create('Personal');
    catalog.setActiveId(created.id);
    expect(catalog.getActiveId()).toEqual(created.id);
    expect(catalog.getActive().id).toEqual(created.id);
  });

});

describe("LocalStorageBoardRepository", function() {
  var repo;
  var store;

  beforeEach(function() {
    store = {};
    spyOn(window.localStorage, 'getItem').and.callFake(function(k) { return store[k] || null; });
    spyOn(window.localStorage, 'setItem').and.callFake(function(k, v) { store[k] = v; });
    repo = new LocalStorageBoardRepository('spec-cards');
  });

  it("add persists a card readable by getAll", function(done) {
    repo.add({ id: '1', name: 'A', status: 'todo' });
    repo.getAll().then(function(rawCards) {
      var keys = [];
      for (var k in rawCards) {
        if (rawCards.hasOwnProperty(k)) {
          keys.push(k);
        }
      }
      expect(keys.length).toEqual(1);
      expect(rawCards[keys[0]].name).toEqual('A');
      done();
    });
  });

  it("onCardAdded fires for every card already stored", function() {
    repo.add({ id: '1', name: 'A' });
    repo.add({ id: '2', name: 'B' });
    var seen = [];
    repo.onCardAdded(function(card) { seen.push(card.id); });
    expect(seen.sort()).toEqual(['1', '2']);
  });

  it("onCardAdded also fires for cards added after subscription", function() {
    var seen = [];
    repo.onCardAdded(function(card) { seen.push(card.id); });
    repo.add({ id: '3', name: 'C' });
    expect(seen).toEqual(['3']);
  });

  it("update merges changes into the stored card", function(done) {
    repo.add({ id: '1', name: 'A', status: 'todo' });
    repo.getAll().then(function(rawCards) {
      var keys = Object.keys(rawCards);
      repo.update(keys[0], { status: 'done' });
      repo.getAll().then(function(updated) {
        expect(updated[keys[0]].status).toEqual('done');
        expect(updated[keys[0]].name).toEqual('A');
        done();
      });
    });
  });

  it("getAll on an empty namespace returns an empty object", function(done) {
    repo.getAll().then(function(rawCards) {
      expect(Object.keys(rawCards).length).toEqual(0);
      done();
    });
  });

  it("remove drops the entry from the stored map", function(done) {
    repo.add({ id: '1', name: 'A' });
    repo.getAll().then(function(rawCards) {
      var key = Object.keys(rawCards)[0];
      repo.remove(key).then(function() {
        repo.getAll().then(function(after) {
          expect(Object.keys(after).length).toEqual(0);
          done();
        });
      });
    });
  });

  it("remove of an unknown key is a no-op", function(done) {
    repo.add({ id: '1', name: 'A' });
    repo.remove('does-not-exist').then(function() {
      repo.getAll().then(function(after) {
        expect(Object.keys(after).length).toEqual(1);
        done();
      });
    });
  });

  it("notifies the error reporter when localStorage.setItem throws", function() {
    var reports = [];
    window.localStorage.setItem.and.callFake(function() { throw new Error('QuotaExceededError'); });
    repo = new LocalStorageBoardRepository('spec-cards', function(info) { reports.push(info); });
    var ok = repo.write({ k: {} });
    expect(ok).toBe(false);
    expect(reports.length).toEqual(1);
    expect(reports[0].source).toEqual('cards');
    expect(reports[0].namespace).toEqual('spec-cards');
    expect(reports[0].error).toBeDefined();
  });

});

describe("BoardSession", function() {
  var session;
  var target;
  var page;
  var counter;
  var userRef;
  var userRefForCalls;

  beforeEach(function() {
    target = $('<div></div>');
    page = { render: jasmine.createSpy('render') };
    counter = { observe: jasmine.createSpy('observe') };
    userRefForCalls = [];
    userRef = {
      push: jasmine.createSpy('push'),
      on: jasmine.createSpy('on'),
      once: jasmine.createSpy('once')
    };
    session = new BoardSession({
      userRefFor: function(authData) { userRefForCalls.push(authData); return userRef; },
      page: page,
      counter: counter,
      target: target
    });
  });

  it("empties the target on start", function() {
    target.append('<span></span>');
    session.start({ uid: 'u-1' });
    expect(target.children().length).toEqual(0);
  });

  it("constructs a repository from the user ref", function() {
    session.start({ uid: 'u-1' });
    expect(userRefForCalls.length).toEqual(1);
    expect(userRefForCalls[0].uid).toEqual('u-1');
    expect(session.repository).toBeDefined();
  });

  it("forwards onCardAdded data to counter.observe and page.render", function() {
    userRef.on.and.callFake(function(event, cb) {
      cb({ val: function() { return { id: 5, name: 'X' }; } });
    });
    session.start({ uid: 'u-1' });
    expect(counter.observe).toHaveBeenCalledWith(5);
    expect(page.render).toHaveBeenCalled();
  });

  it("uses a repositoryFactory when supplied", function() {
    var built = null;
    var fakeRepo = { onCardAdded: jasmine.createSpy('onCardAdded') };
    var withFactory = new BoardSession({
      repositoryFactory: function(authData) { built = authData; return fakeRepo; },
      page: page,
      counter: counter,
      target: target
    });
    withFactory.start({ uid: 'u-2' });
    expect(built.uid).toEqual('u-2');
    expect(withFactory.repository).toBe(fakeRepo);
    expect(fakeRepo.onCardAdded).toHaveBeenCalled();
  });

});

describe("JsonUpload", function() {
  var upload;
  var page;
  var alertView;

  beforeEach(function() {
    page = { render: jasmine.createSpy('render') };
    alertView = { show: jasmine.createSpy('show') };
    upload = new JsonUpload({
      page: page,
      alertView: alertView,
      fileInputSelector: '#nope-no-such-input'
    });
  });

  it("attach is a no-op when the file input is absent", function() {
    expect(function() { upload.attach(); }).not.toThrow();
  });

  it("readFile parses JSON contents and forwards to page.render", function() {
    var captured;
    spyOn(window, 'FileReader').and.returnValue({
      readAsText: function() { this.onload({ target: { result: '{"tasks":{"t1":{"id":"1"}}}' } }); },
      onload: null
    });
    page.render.and.callFake(function(data) { captured = data; });
    upload.readFile({});
    expect(captured.tasks.t1.id).toEqual('1');
  });

  it("readFile imports a snapshot into the active repository and tracks board_imported", function(done) {
    var added = [];
    var repo = {
      add: function(c) { added.push(c); var d = $.Deferred(); d.resolve('lc-' + added.length); return d.promise(); },
      getAll: function() { var d = $.Deferred(); d.resolve({}); return d.promise(); }
    };
    var tracked = [];
    var routed = [];
    upload = new JsonUpload({
      page: page,
      alertView: alertView,
      fileInputSelector: '#nope-no-such-input',
      getBoardRepository: function() { return repo; },
      analytics: { track: function(n, p) { tracked.push({ n: n, p: p }); } },
      router: { routeTo: function(r) { routed.push(r); } }
    });
    var snapshotJson = JSON.stringify({
      board: { id: 'b-9', name: 'Visiting' },
      exported_at: '2015-02-20T22:00:00.000Z',
      tasks: { k1: { id: '1', name: 'A', status: 'todo' }, k2: { id: '2', name: 'B', status: 'doing' } }
    });
    spyOn(window, 'FileReader').and.returnValue({
      readAsText: function() { this.onload({ target: { result: snapshotJson } }); },
      onload: null
    });
    upload.readFile({});
    setTimeout(function() {
      expect(page.render).not.toHaveBeenCalled();
      expect(added.length).toEqual(2);
      var imported = tracked.filter(function(e) { return e.n === 'board_imported'; })[0];
      expect(imported.p).toEqual({ boardId: 'b-9', name: 'Visiting', imported: 2, skipped: 0, failed: 0 });
      expect(routed).toEqual(['board']);
      var arg = alertView.show.calls.mostRecent().args[0];
      expect(arg.className).toEqual('alert-success');
      done();
    }, 0);
  });

  it("readFile alerts already up to date when every task is a duplicate", function(done) {
    var existing = { lc1: { id: '1', name: 'A' } };
    var repo = {
      add: function() { var d = $.Deferred(); d.resolve('lc-x'); return d.promise(); },
      getAll: function() { var d = $.Deferred(); d.resolve(existing); return d.promise(); }
    };
    var routed = [];
    upload = new JsonUpload({
      page: page,
      alertView: alertView,
      fileInputSelector: '#nope-no-such-input',
      getBoardRepository: function() { return repo; },
      router: { routeTo: function(r) { routed.push(r); } }
    });
    var snapshotJson = JSON.stringify({
      board: { id: 'b-9', name: 'Visiting' },
      tasks: { k1: { id: '1', name: 'A' } }
    });
    spyOn(window, 'FileReader').and.returnValue({
      readAsText: function() { this.onload({ target: { result: snapshotJson } }); },
      onload: null
    });
    upload.readFile({});
    setTimeout(function() {
      var arg = alertView.show.calls.mostRecent().args[0];
      expect(arg.className).toEqual('alert-info');
      expect(arg.title).toEqual('Already up to date');
      expect(routed).toEqual([]);
      done();
    }, 0);
  });

  it("readFile warns on invalid JSON instead of throwing", function() {
    spyOn(window, 'FileReader').and.returnValue({
      readAsText: function() { this.onload({ target: { result: 'not-json' } }); },
      onload: null
    });
    expect(function() { upload.readFile({}); }).not.toThrow();
    expect(alertView.show).toHaveBeenCalled();
    var arg = alertView.show.calls.mostRecent().args[0];
    expect(arg.className).toEqual('alert-danger');
  });

});

describe("BoardController", function() {
  var controller;
  var renderer;
  var repository;
  var form;

  beforeEach(function() {
    renderer = { render: function(card) { return $('<div class="board-card" data-card-id="' + card.id + '"><span class="board-card-status">' + card.status + '</span></div>'); } };
    repository = null;
    form = $(
      '<form>' +
      '<section class="board-column" data-status="todo"><h2 class="board-column-title">To do</h2><div class="board-column-cards"></div></section>' +
      '<section class="board-column" data-status="doing"><h2 class="board-column-title">Doing</h2><div class="board-column-cards"></div></section>' +
      '<section class="board-column" data-status="done"><h2 class="board-column-title">Done</h2><div class="board-column-cards"></div></section>' +
      '</form>'
    );
    controller = new BoardController({
      renderer: renderer,
      getBoardRepository: function() { return repository; }
    });
  });

  it("empties the columns even when the repository is missing", function() {
    form.find('.board-column[data-status="todo"] .board-column-cards').append('<div class="board-card"></div>');
    controller.attach(form);
    expect(form.find('.board-column-cards .board-card').length).toEqual(0);
  });

  it("distributes cards to columns by status", function(done) {
    repository = {
      getAll: function() {
        var deferred = $.Deferred();
        deferred.resolve({
          a: { id: '1', status: 'todo' },
          b: { id: '2', status: 'doing' },
          c: { id: '3', status: 'done' },
          d: { id: '4', status: 'doing' }
        });
        return deferred.promise();
      }
    };
    controller.attach(form);
    setTimeout(function() {
      expect(form.find('.board-column[data-status="todo"] .board-card').length).toEqual(1);
      expect(form.find('.board-column[data-status="doing"] .board-card').length).toEqual(2);
      expect(form.find('.board-column[data-status="done"] .board-card').length).toEqual(1);
      done();
    }, 0);
  });

  it("appends a card count to each column title", function(done) {
    repository = {
      getAll: function() {
        var deferred = $.Deferred();
        deferred.resolve({
          a: { id: '1', status: 'todo' },
          b: { id: '2', status: 'doing' },
          c: { id: '3', status: 'doing' }
        });
        return deferred.promise();
      }
    };
    controller.attach(form);
    setTimeout(function() {
      expect(form.find('.board-column[data-status="todo"] .board-column-title').text()).toEqual('To do (1)');
      expect(form.find('.board-column[data-status="doing"] .board-column-title').text()).toEqual('Doing (2)');
      expect(form.find('.board-column[data-status="done"] .board-column-title').text()).toEqual('Done (0)');
      done();
    }, 0);
  });

  it("changeStatus delegates to repository.update", function() {
    repository = { update: jasmine.createSpy('update') };
    controller.changeStatus('fb-1', 'done');
    expect(repository.update).toHaveBeenCalledWith('fb-1', { status: 'done' });
  });

  it("tracks a card_moved analytics event on changeStatus", function() {
    var tracked = [];
    var analytics = { track: function(name, props) { tracked.push({ name: name, props: props }); } };
    repository = { update: jasmine.createSpy('update') };
    controller = new BoardController({
      renderer: renderer,
      getBoardRepository: function() { return repository; },
      analytics: analytics
    });
    controller.cardsByFbKey['fb-1'] = { id: '1', status: 'todo' };
    controller.changeStatus('fb-1', 'done');
    expect(tracked[0].name).toEqual('card_moved');
    expect(tracked[0].props.from).toEqual('todo');
    expect(tracked[0].props.to).toEqual('done');
  });

  it("clicking a board card opens the modal with that card", function(done) {
    var openedCard = null;
    var modal = { show: function(card) { openedCard = card; } };
    controller = new BoardController({
      renderer: renderer,
      getBoardRepository: function() { return repository; },
      modal: modal
    });
    repository = {
      getAll: function() {
        var deferred = $.Deferred();
        deferred.resolve({ 'fb-1': { id: '1', name: 'X', status: 'todo' } });
        return deferred.promise();
      }
    };
    controller.attach(form);
    setTimeout(function() {
      form.find('.board-card[data-fb-key="fb-1"]').trigger('click');
      expect(openedCard).not.toBeNull();
      expect(openedCard.id).toEqual('1');
      done();
    }, 0);
  });

  it("modal delete invokes repository.remove and fires card_deleted", function(done) {
    var removed = [];
    var tracked = [];
    var lastShowOpts = null;
    var modal = { show: function(card, options) { lastShowOpts = options; } };
    var analytics = { track: function(name, props) { tracked.push({ name: name, props: props }); } };
    repository = {
      getAll: function() {
        var deferred = $.Deferred();
        deferred.resolve({ 'fb-1': { id: '1', name: 'X', status: 'doing' } });
        return deferred.promise();
      },
      remove: function(key) { removed.push(key); }
    };
    controller = new BoardController({
      renderer: renderer,
      getBoardRepository: function() { return repository; },
      modal: modal,
      analytics: analytics
    });
    $('body').append(form);
    controller.attach(form);
    setTimeout(function() {
      form.find('.board-card[data-fb-key="fb-1"]').trigger('click');
      lastShowOpts.onDelete();
      expect(removed).toEqual(['fb-1']);
      expect(form.find('.board-card[data-fb-key="fb-1"]').length).toEqual(0);
      var del = tracked.filter(function(e) { return e.name === 'card_deleted'; })[0];
      expect(del.props.status).toEqual('doing');
      form.remove();
      done();
    }, 0);
  });

  it("modal status change calls changeStatus and moves the card", function(done) {
    var updates = [];
    var lastShowOpts = null;
    var modal = { show: function(card, options) { lastShowOpts = options; } };
    var tracked = [];
    var analytics = { track: function(name, props) { tracked.push({ name: name, props: props }); } };
    controller = new BoardController({
      renderer: renderer,
      getBoardRepository: function() { return repository; },
      modal: modal,
      analytics: analytics
    });
    repository = {
      getAll: function() {
        var deferred = $.Deferred();
        deferred.resolve({ 'fb-1': { id: '1', name: 'X', status: 'todo' } });
        return deferred.promise();
      },
      update: function(key, changes) { updates.push({ key: key, changes: changes }); }
    };
    $('body').append(form);
    controller.attach(form);
    setTimeout(function() {
      form.find('.board-card[data-fb-key="fb-1"]').trigger('click');
      lastShowOpts.onStatusChange('done');
      expect(form.find('.board-column[data-status="done"] .board-card[data-fb-key="fb-1"]').length).toEqual(1);
      expect(updates).toEqual([{ key: 'fb-1', changes: { status: 'done' } }]);
      var move = tracked.filter(function(e) { return e.name === 'card_moved'; })[0];
      expect(move.props.from).toEqual('todo');
      expect(move.props.to).toEqual('done');
      form.remove();
      done();
    }, 0);
  });

  it("clicking Share board downloads a snapshot and fires board_shared", function(done) {
    var downloads = [];
    var tracked = [];
    var alerts = [];
    var analytics = { track: function(name, props) { tracked.push({ name: name, props: props }); } };
    var alertView = { show: function(opts) { alerts.push(opts); } };
    repository = {
      getAll: function() {
        var deferred = $.Deferred();
        deferred.resolve({ 'fb-1': { id: '1', status: 'todo' }, 'fb-2': { id: '2', status: 'done' } });
        return deferred.promise();
      }
    };
    controller = new BoardController({
      renderer: renderer,
      getBoardRepository: function() { return repository; },
      getActiveBoard: function() { return { id: 'b-1', name: 'Personal' }; },
      analytics: analytics,
      alertView: alertView,
      download: function(filename, payload, mimeType) { downloads.push({ filename: filename, payload: payload, mimeType: mimeType }); }
    });
    form = $(
      '<form>' +
      '<button class="board-share"></button>' +
      '<section class="board-column" data-status="todo"><h2 class="board-column-title">To do</h2><div class="board-column-cards"></div></section>' +
      '<section class="board-column" data-status="doing"><h2 class="board-column-title">Doing</h2><div class="board-column-cards"></div></section>' +
      '<section class="board-column" data-status="done"><h2 class="board-column-title">Done</h2><div class="board-column-cards"></div></section>' +
      '</form>'
    );
    controller.attach(form);
    setTimeout(function() {
      form.find('.board-share').trigger('click');
      setTimeout(function() {
        expect(downloads.length).toEqual(1);
        expect(downloads[0].mimeType).toEqual('application/json');
        expect(downloads[0].filename).toMatch(/^kanban-personal-\d{4}-\d{2}-\d{2}\.json$/);
        var parsed = JSON.parse(downloads[0].payload);
        expect(parsed.board).toEqual({ id: 'b-1', name: 'Personal' });
        expect(Object.keys(parsed.tasks).length).toEqual(2);
        var shared = tracked.filter(function(e) { return e.name === 'board_shared'; })[0];
        expect(shared.props).toEqual({ boardId: 'b-1', name: 'Personal', cardCount: 2 });
        var success = alerts.filter(function(a) { return a.className === 'alert-success'; })[0];
        expect(success.title).toEqual('Snapshot downloaded');
        done();
      }, 0);
    }, 0);
  });

  it("Share board on an empty board shows an info alert and skips download", function(done) {
    var downloads = [];
    var tracked = [];
    var alerts = [];
    var analytics = { track: function(name, props) { tracked.push({ name: name, props: props }); } };
    var alertView = { show: function(opts) { alerts.push(opts); } };
    repository = {
      getAll: function() {
        var deferred = $.Deferred();
        deferred.resolve({});
        return deferred.promise();
      }
    };
    controller = new BoardController({
      renderer: renderer,
      getBoardRepository: function() { return repository; },
      getActiveBoard: function() { return { id: 'b-1', name: 'Personal' }; },
      analytics: analytics,
      alertView: alertView,
      download: function(f, p, m) { downloads.push({ f: f, p: p, m: m }); }
    });
    form = $(
      '<form>' +
      '<button class="board-share"></button>' +
      '<section class="board-column" data-status="todo"><h2 class="board-column-title">To do</h2><div class="board-column-cards"></div></section>' +
      '<section class="board-column" data-status="doing"><h2 class="board-column-title">Doing</h2><div class="board-column-cards"></div></section>' +
      '<section class="board-column" data-status="done"><h2 class="board-column-title">Done</h2><div class="board-column-cards"></div></section>' +
      '</form>'
    );
    controller.attach(form);
    setTimeout(function() {
      form.find('.board-share').trigger('click');
      setTimeout(function() {
        expect(downloads.length).toEqual(0);
        expect(tracked.filter(function(e) { return e.name === 'board_shared'; }).length).toEqual(0);
        var info = alerts.filter(function(a) { return a.className === 'alert-info'; })[0];
        expect(info.title).toEqual('Nothing to share');
        done();
      }, 0);
    }, 0);
  });

  it("dropping a card into a column moves it and persists the new status", function(done) {
    var updates = [];
    repository = {
      getAll: function() {
        var deferred = $.Deferred();
        deferred.resolve({
          'fb-1': { id: '1', status: 'todo' }
        });
        return deferred.promise();
      },
      update: function(key, changes) { updates.push({ key: key, changes: changes }); }
    };
    controller.attach(form);
    setTimeout(function() {
      var dataTransfer = {
        _data: {},
        setData: function(k, v) { this._data[k] = v; },
        getData: function(k) { return this._data[k]; }
      };
      var dragstart = $.Event('dragstart');
      dragstart.originalEvent = { dataTransfer: dataTransfer };
      form.find('.board-card[data-fb-key="fb-1"]').trigger(dragstart);

      var drop = $.Event('drop');
      drop.originalEvent = { dataTransfer: dataTransfer };
      form.find('.board-column[data-status="done"]').trigger(drop);

      expect(form.find('.board-column[data-status="done"] .board-card[data-fb-key="fb-1"]').length).toEqual(1);
      expect(form.find('.board-column[data-status="todo"] .board-card').length).toEqual(0);
      expect(updates).toEqual([{ key: 'fb-1', changes: { status: 'done' } }]);
      done();
    }, 0);
  });

});

describe("PrintController", function() {
  var controller;
  var renderer;
  var repository;
  var form;

  beforeEach(function() {
    renderer = { render: function(card) { return $('<div class="board-card" data-card-id="' + card.id + '"><span class="board-card-status">' + card.status + '</span></div>'); } };
    repository = null;
    form = $('<form><div id="print-cards"></div></form>');
    controller = new PrintController({
      renderer: renderer,
      getBoardRepository: function() { return repository; },
      targetSelector: '#print-cards'
    });
  });

  it("empties the target even when the repository is missing", function() {
    form.find('#print-cards').append('<div class="post-it"></div>');
    controller.attach(form);
    expect(form.find('#print-cards .post-it').length).toEqual(0);
  });

  it("renders every card into the target", function(done) {
    repository = {
      getAll: function() {
        var deferred = $.Deferred();
        deferred.resolve({
          'fb-1': { id: '1', status: 'todo' },
          'fb-2': { id: '2', status: 'doing' },
          'fb-3': { id: '3', status: 'done' }
        });
        return deferred.promise();
      }
    };
    controller.attach(form);
    setTimeout(function() {
      expect(form.find('#print-cards .post-it').length).toEqual(3);
      done();
    }, 0);
  });

});

describe("EventsController", function() {
  var controller;
  var analytics;
  var events;
  var form;
  var chartCalls;
  var chartFactory;

  beforeEach(function() {
    events = [];
    chartCalls = [];
    chartFactory = function(canvas, data) {
      chartCalls.push({ canvas: canvas, data: data });
      return { destroy: function() {} };
    };
    analytics = {
      list: function() { return events.slice(); },
      clear: function() { events = []; }
    };
    form = $(
      '<form>' +
      '<button class="events-clear"></button>' +
      '<div class="funnel-stages"></div>' +
      '<canvas class="funnel-chart"></canvas>' +
      '<div class="events-list"></div>' +
      '</form>'
    );
    controller = new EventsController({
      analytics: analytics,
      chartFactory: chartFactory,
      confirmClear: function() { return true; }
    });
  });

  it("shows an empty state when there are no events", function() {
    controller.attach(form);
    expect(form.find('.events-empty').length).toEqual(1);
    expect(form.find('.events-table').length).toEqual(0);
  });

  it("renders a row per event, most recent first", function() {
    events = [
      { t: 1, name: 'app_loaded', properties: { a: 1 } },
      { t: 2, name: 'card_created', properties: { status: 'todo' } }
    ];
    controller.attach(form);
    var names = form.find('.events-table tbody tr td:nth-child(2)').map(function() { return $(this).text(); }).toArray();
    expect(names).toEqual(['card_created', 'app_loaded']);
  });

  it("renders one stage card per AARRR stage", function() {
    controller.attach(form);
    expect(form.find('.funnel-stage').length).toEqual(5);
    expect(form.find('.funnel-stage--acquisition').length).toEqual(1);
    expect(form.find('.funnel-stage--revenue').length).toEqual(1);
  });

  it("populates stage counts from the funnel analyzer", function() {
    events = [
      { t: 1, name: 'app_loaded', properties: {} },
      { t: 2, name: 'card_created', properties: {} },
      { t: 3, name: 'card_created', properties: {} }
    ];
    controller.attach(form);
    expect(form.find('.funnel-stage--acquisition .funnel-stage-count').text()).toEqual('1');
    expect(form.find('.funnel-stage--activation .funnel-stage-count').text()).toEqual('2');
  });

  it("calls the chart factory with the canvas and a Bar dataset", function() {
    events = [{ t: 1, name: 'app_loaded', properties: {} }];
    controller.attach(form);
    expect(chartCalls.length).toEqual(1);
    expect(chartCalls[0].canvas).toBe(form.find('.funnel-chart')[0]);
    expect(chartCalls[0].data.labels.length).toEqual(5);
    expect(chartCalls[0].data.datasets[0].data[0]).toEqual(1);
  });

  it("Clear log button calls analytics.clear and re-renders to empty", function() {
    events = [{ t: 1, name: 'app_loaded', properties: {} }];
    controller.attach(form);
    expect(form.find('.events-table').length).toEqual(1);
    form.find('.events-clear').trigger('click');
    expect(events.length).toEqual(0);
    expect(form.find('.events-empty').length).toEqual(1);
  });

  it("Clear log skip when the confirm is cancelled", function() {
    events = [{ t: 1, name: 'app_loaded', properties: {} }];
    controller = new EventsController({
      analytics: analytics,
      chartFactory: chartFactory,
      confirmClear: function() { return false; }
    });
    controller.attach(form);
    form.find('.events-clear').trigger('click');
    expect(events.length).toEqual(1);
  });

});

describe("FunnelAnalyzer", function() {
  var analyzer;

  beforeEach(function() {
    analyzer = new FunnelAnalyzer();
  });

  function at(year, month, day, name, properties) {
    return { t: new Date(year, month - 1, day, 12, 0, 0).getTime(), name: name, properties: properties || {} };
  }

  it("returns zeroed counts for an empty event log", function() {
    expect(analyzer.compute([])).toEqual({ acquisition: 0, activation: 0, retention: 0, referral: 0, revenue: 0 });
  });

  it("counts acquisition from app_loaded events", function() {
    var counts = analyzer.compute([at(2015, 2, 12, 'app_loaded'), at(2015, 2, 12, 'app_loaded')]);
    expect(counts.acquisition).toEqual(2);
  });

  it("counts activation from card_created events", function() {
    var counts = analyzer.compute([
      at(2015, 2, 12, 'card_created'),
      at(2015, 2, 12, 'card_moved'),
      at(2015, 2, 12, 'card_created')
    ]);
    expect(counts.activation).toEqual(2);
  });

  it("counts referral from board_shared and share_clicked", function() {
    var counts = analyzer.compute([
      at(2015, 2, 12, 'board_shared'),
      at(2015, 2, 12, 'share_clicked')
    ]);
    expect(counts.referral).toEqual(2);
  });

  it("counts retention as distinct session days minus one", function() {
    var counts = analyzer.compute([
      at(2015, 2, 12, 'app_loaded'),
      at(2015, 2, 12, 'app_loaded'),
      at(2015, 2, 13, 'app_loaded'),
      at(2015, 2, 16, 'app_loaded')
    ]);
    expect(counts.retention).toEqual(2);
  });

  it("returns zero retention when only one session day exists", function() {
    var counts = analyzer.compute([
      at(2015, 2, 12, 'app_loaded'),
      at(2015, 2, 12, 'app_loaded')
    ]);
    expect(counts.retention).toEqual(0);
  });

  it("computes conversion rates as a percentage of acquisition", function() {
    var counts = { acquisition: 10, activation: 5, retention: 2, referral: 1, revenue: 0 };
    var rates = analyzer.conversion(counts);
    expect(rates.activation).toEqual(50);
    expect(rates.retention).toEqual(20);
    expect(rates.referral).toEqual(10);
    expect(rates.revenue).toEqual(0);
  });

  it("returns event counts sorted by frequency desc then name asc", function() {
    var dist = analyzer.distribution([
      at(2015, 2, 12, 'app_loaded'),
      at(2015, 2, 12, 'card_created'),
      at(2015, 2, 12, 'card_moved'),
      at(2015, 2, 12, 'card_created'),
      at(2015, 2, 12, 'card_created')
    ]);
    expect(dist).toEqual([
      { name: 'card_created', count: 3 },
      { name: 'app_loaded', count: 1 },
      { name: 'card_moved', count: 1 }
    ]);
  });

  it("returns an empty distribution for no events", function() {
    expect(analyzer.distribution([])).toEqual([]);
  });

  it("groups sessions and card-creation activity by day, ascending", function() {
    var series = analyzer.sessionsByDay([
      at(2015, 2, 13, 'app_loaded'),
      at(2015, 2, 12, 'app_loaded'),
      at(2015, 2, 12, 'app_loaded'),
      at(2015, 2, 12, 'card_created'),
      at(2015, 2, 12, 'card_created'),
      at(2015, 2, 13, 'app_loaded'),
      at(2015, 2, 11, 'app_loaded')
    ]);
    expect(series.length).toEqual(3);
    expect(series[0]).toEqual({ day: '2015-02-11', sessions: 1, cards: 0 });
    expect(series[1]).toEqual({ day: '2015-02-12', sessions: 2, cards: 2 });
    expect(series[2]).toEqual({ day: '2015-02-13', sessions: 2, cards: 0 });
  });

  it("includes days with only card activity but no sessions", function() {
    var series = analyzer.sessionsByDay([
      at(2015, 2, 12, 'card_created')
    ]);
    expect(series).toEqual([{ day: '2015-02-12', sessions: 0, cards: 1 }]);
  });

  it("returns an empty series when no sessions exist", function() {
    expect(analyzer.sessionsByDay([])).toEqual([]);
  });

  it("guards against divide-by-zero in conversion rates", function() {
    var rates = analyzer.conversion({ acquisition: 0, activation: 0, retention: 0, referral: 0, revenue: 0 });
    expect(rates.activation).toEqual(0);
    expect(rates.retention).toEqual(0);
    expect(rates.referral).toEqual(0);
    expect(rates.revenue).toEqual(0);
  });

});

describe("BoardSnapshot", function() {
  var snapshot;
  var fixedNow;

  beforeEach(function() {
    snapshot = new BoardSnapshot();
    fixedNow = new Date(Date.UTC(2015, 1, 18, 22, 15, 0));
  });

  it("builds a snapshot containing board info, exported_at and tasks", function() {
    var built = snapshot.build({ id: 'b-1', name: 'Personal' }, { 'k1': { title: 'A', status: 'todo' } }, fixedNow);
    expect(built.board).toEqual({ id: 'b-1', name: 'Personal' });
    expect(built.exported_at).toEqual('2015-02-18T22:15:00.000Z');
    expect(built.tasks).toEqual({ 'k1': { title: 'A', status: 'todo' } });
  });

  it("serializes to pretty-printed JSON", function() {
    var text = snapshot.serialize({ id: 'b-1', name: 'P' }, { 'k': { title: 't' } }, fixedNow);
    expect(text.indexOf('\n')).toBeGreaterThan(0);
    expect(JSON.parse(text).board.name).toEqual('P');
  });

  it("produces a kebab-case filename with the export date", function() {
    expect(snapshot.filename({ name: 'My Personal Board!' }, fixedNow)).toEqual('kanban-my-personal-board-2015-02-18.json');
  });

  it("falls back to a default slug when the name is empty", function() {
    expect(snapshot.filename({ name: '' }, fixedNow)).toEqual('kanban-board-2015-02-18.json');
    expect(snapshot.filename({ name: '!!!' }, fixedNow)).toEqual('kanban-board-2015-02-18.json');
  });

  it("counts cards in the snapshot", function() {
    expect(snapshot.cardCount({})).toEqual(0);
    expect(snapshot.cardCount({ a: {}, b: {}, c: {} })).toEqual(3);
  });

});

describe("BoardImporter", function() {
  var importer;

  beforeEach(function() {
    importer = new BoardImporter();
  });

  function fakeRepo(initial) {
    var stored = {};
    if (initial) {
      for (var k in initial) {
        if (initial.hasOwnProperty(k)) {
          stored[k] = initial[k];
        }
      }
    }
    return {
      added: [],
      add: function(card) {
        this.added.push(card);
        var key = 'lc-' + this.added.length;
        stored[key] = card;
        var d = $.Deferred();
        d.resolve(key);
        return d.promise();
      },
      getAll: function() {
        var d = $.Deferred();
        d.resolve(stored);
        return d.promise();
      }
    };
  }

  it("isSnapshot recognises payloads with board and tasks", function() {
    expect(importer.isSnapshot({ board: {}, tasks: {} })).toBe(true);
    expect(importer.isSnapshot({ tasks: {} })).toBe(false);
    expect(importer.isSnapshot({ board: {} })).toBe(false);
    expect(importer.isSnapshot(null)).toBe(false);
    expect(importer.isSnapshot(undefined)).toBe(false);
  });

  it("importInto resolves with zero counts when payload is not a snapshot", function(done) {
    importer.importInto({ tasks: { a: {} } }, fakeRepo()).then(function(r) {
      expect(r).toEqual({ imported: 0, skipped: 0, failed: 0 });
      done();
    });
  });

  it("importInto resolves with zero counts when tasks is empty", function(done) {
    importer.importInto({ board: { id: 'b-1' }, tasks: {} }, fakeRepo()).then(function(r) {
      expect(r).toEqual({ imported: 0, skipped: 0, failed: 0 });
      done();
    });
  });

  it("importInto calls repo.add for each task and counts them as imported", function(done) {
    var repo = fakeRepo();
    var snapshot = {
      board: { id: 'b-1', name: 'P' },
      tasks: {
        k1: { id: '1', name: 'A', status: 'todo' },
        k2: { id: '2', name: 'B', status: 'doing' }
      }
    };
    importer.importInto(snapshot, repo).then(function(r) {
      expect(r).toEqual({ imported: 2, skipped: 0, failed: 0 });
      expect(repo.added.length).toEqual(2);
      done();
    });
  });

  it("importInto skips a task whose id and name already exist in the repo", function(done) {
    var repo = fakeRepo({ existing: { id: '1', name: 'A', status: 'todo' } });
    var snapshot = {
      board: { id: 'b-1', name: 'P' },
      tasks: {
        k1: { id: '1', name: 'A', status: 'todo' },
        k2: { id: '2', name: 'B', status: 'doing' }
      }
    };
    importer.importInto(snapshot, repo).then(function(r) {
      expect(r).toEqual({ imported: 1, skipped: 1, failed: 0 });
      expect(repo.added.length).toEqual(1);
      expect(repo.added[0].name).toEqual('B');
      done();
    });
  });

  it("importInto counts a rejected add as failed", function(done) {
    var repo = {
      add: function() { var d = $.Deferred(); d.reject({ reason: 'storage' }); return d.promise(); },
      getAll: function() { var d = $.Deferred(); d.resolve({}); return d.promise(); }
    };
    var snapshot = { board: { id: 'b-1' }, tasks: { k1: { id: '1', name: 'A' } } };
    importer.importInto(snapshot, repo).then(function(r) {
      expect(r).toEqual({ imported: 0, skipped: 0, failed: 1 });
      done();
    });
  });

  it("importInto resolves with zero counts when repository is missing", function(done) {
    importer.importInto({ board: { id: 'b-1' }, tasks: { a: {} } }, null).then(function(r) {
      expect(r).toEqual({ imported: 0, skipped: 0, failed: 0 });
      done();
    });
  });

});

describe("HomeController", function() {
  var controller;
  var router;
  var form;

  beforeEach(function() {
    router = { routeTo: jasmine.createSpy('routeTo') };
    form = $('<form><a class="home-cta" href="#/board">Open your board</a></form>');
    controller = new HomeController({ router: router });
    controller.attach(form);
  });

  it("clicking the CTA routes to the board", function() {
    form.find('.home-cta').trigger('click');
    expect(router.routeTo).toHaveBeenCalledWith('board');
  });

  it("modified-click on the CTA does not hijack the browser", function() {
    var ev = $.Event('click');
    ev.metaKey = true;
    form.find('.home-cta').trigger(ev);
    expect(router.routeTo).not.toHaveBeenCalled();
    expect(ev.isDefaultPrevented()).toBe(false);
  });

});

describe("GettingStartedController", function() {
  var controller;
  var authService;
  var alertView;
  var counter;
  var boardRepository;
  var form;

  beforeEach(function() {
    authService = {
      currentUser: jasmine.createSpy('currentUser').and.returnValue(null),
      signInAnonymously: jasmine.createSpy('signInAnonymously')
    };
    alertView = { show: jasmine.createSpy('show') };
    counter = { next: jasmine.createSpy('next').and.returnValue(7) };
    boardRepository = { add: jasmine.createSpy('add').and.callFake(function() { return $.Deferred().resolve('fb-1').promise(); }) };
    form = $('<form></form>');
    form.serializeObject = function() { return { name: 'A' }; };

    controller = new GettingStartedController({
      authService: authService,
      alertView: alertView,
      counter: counter,
      getBoardRepository: function() { return boardRepository; }
    });
  });

  it("signs in anonymously when no user is present", function() {
    controller.attach(form);
    expect(authService.signInAnonymously).toHaveBeenCalled();
    expect(alertView.show).toHaveBeenCalled();
  });

  it("skips the anonymous sign-in when a user is already present", function() {
    authService.currentUser.and.returnValue({ uid: 'u-1' });
    controller.attach(form);
    expect(authService.signInAnonymously).not.toHaveBeenCalled();
  });

  it("assigns counter.next() to userInfo.id on submit", function() {
    spyOn($.fn, 'serializeObject').and.returnValue({ name: 'A' });
    controller.attach(form);
    form.trigger('submit');
    expect(counter.next).toHaveBeenCalled();
    expect(boardRepository.add.calls.mostRecent().args[0].id).toEqual(7);
  });

  it("preserves status from the serialized form values", function() {
    spyOn($.fn, 'serializeObject').and.returnValue({ name: 'A', status: 'doing' });
    controller.attach(form);
    form.trigger('submit');
    expect(boardRepository.add.calls.mostRecent().args[0].status).toEqual('doing');
  });

  it("fills blank fields with the input's placeholder text", function() {
    form = $(
      '<form>' +
      '<input name="priority" placeholder="3">' +
      '<input name="sprint" placeholder="9">' +
      '<input name="specialist1" placeholder="DBA">' +
      '<input name="time1" placeholder="1h">' +
      '</form>'
    );
    form.serializeObject = function() {
      return { name: 'A', priority: '', sprint: '', specialist1: '', time1: '' };
    };
    controller.attach(form);
    form.trigger('submit');
    var sent = boardRepository.add.calls.mostRecent().args[0];
    expect(sent.priority).toEqual('3');
    expect(sent.sprint).toEqual('9');
    expect(sent.specialist1).toEqual('DBA');
    expect(sent.time1).toEqual('1h');
  });

  it("keeps the user-supplied value when present and does not overwrite with placeholder", function() {
    form = $('<form><input name="priority" placeholder="3"></form>');
    form.serializeObject = function() { return { name: 'A', priority: '7' }; };
    controller.attach(form);
    form.trigger('submit');
    expect(boardRepository.add.calls.mostRecent().args[0].priority).toEqual('7');
  });

  it("tracks a card_created analytics event after the save succeeds", function() {
    var tracked = [];
    var analytics = { track: function(name, props) { tracked.push({ name: name, props: props }); } };
    spyOn($.fn, 'serializeObject').and.returnValue({ name: 'A', status: 'doing' });
    controller = new GettingStartedController({
      authService: authService,
      alertView: alertView,
      counter: counter,
      getBoardRepository: function() { return boardRepository; },
      analytics: analytics
    });
    controller.attach(form);
    form.trigger('submit');
    expect(tracked.length).toEqual(1);
    expect(tracked[0].name).toEqual('card_created');
    expect(tracked[0].props.status).toEqual('doing');
  });

  it("does not track card_created when the storage write fails", function() {
    var tracked = [];
    var analytics = { track: function(name, props) { tracked.push({ name: name, props: props }); } };
    boardRepository = { add: jasmine.createSpy('add').and.callFake(function() { return $.Deferred().reject({ reason: 'storage' }).promise(); }) };
    spyOn($.fn, 'serializeObject').and.returnValue({ name: 'A', status: 'doing' });
    controller = new GettingStartedController({
      authService: authService,
      alertView: alertView,
      counter: counter,
      getBoardRepository: function() { return boardRepository; },
      analytics: analytics
    });
    controller.attach(form);
    form.trigger('submit');
    expect(tracked.length).toEqual(0);
  });

});

describe("Counter", function() {
  var counter;

  beforeEach(function() {
    counter = new Counter();
  });

  it("starts at zero and bumps one per next call", function() {
    expect(counter.next()).toEqual(1);
    expect(counter.next()).toEqual(2);
    expect(counter.next()).toEqual(3);
  });

  it("observe sets value to the max seen", function() {
    counter.observe(5);
    expect(counter.next()).toEqual(6);
    counter.observe(2);
    expect(counter.next()).toEqual(7);
  });

  it("observe tolerates string ids", function() {
    counter.observe("9");
    expect(counter.next()).toEqual(10);
  });

  it("observe ignores non-numeric input", function() {
    counter.observe("nope");
    counter.observe(undefined);
    expect(counter.next()).toEqual(1);
  });

});

describe("Card", function() {

  it("copies fields from the raw object", function() {
    var raw = {
      id: "7",
      priority: "2",
      name: "Title",
      specialist1: "BE",
      time1: "3",
      specialist2: "FE",
      time2: "1",
      sprint: "4"
    };
    var card = new Card(raw);
    expect(card.id).toEqual(raw.id);
    expect(card.priority).toEqual(raw.priority);
    expect(card.name).toEqual(raw.name);
    expect(card.specialist1).toEqual(raw.specialist1);
    expect(card.time1).toEqual(raw.time1);
    expect(card.specialist2).toEqual(raw.specialist2);
    expect(card.time2).toEqual(raw.time2);
    expect(card.sprint).toEqual(raw.sprint);
  });

  it("tolerates a missing raw object", function() {
    var card = new Card();
    expect(card.id).toBeUndefined();
    expect(card.name).toBeUndefined();
  });

  it("identifier returns the card id", function() {
    expect(new Card({ id: "abc" }).identifier()).toEqual("abc");
  });

  it("status defaults to 'todo' when missing", function() {
    expect(new Card().status).toEqual('todo');
    expect(new Card({ id: '1' }).status).toEqual('todo');
  });

  it("status uses the input value when present", function() {
    expect(new Card({ id: '1', status: 'doing' }).status).toEqual('doing');
  });

});

describe("PostItRenderer", function() {
  var renderer;
  var sampleCard;

  beforeEach(function() {
    renderer = new PostItRenderer();
    sampleCard = new Card({
      id: "42",
      priority: "1",
      name: "Sample card",
      specialist1: "BE",
      time1: "3",
      specialist2: "FE",
      time2: "2",
      sprint: "7"
    });
  });

  it("renders a .post-it element", function() {
    expect(renderer.render(sampleCard).hasClass("post-it")).toBe(true);
  });

  it("tags the root with data-card-id", function() {
    expect(renderer.render(sampleCard).attr("data-card-id")).toEqual(sampleCard.id);
  });

  it("adds a status- class derived from the card status", function() {
    var doing = new Card({ id: '1', status: 'doing' });
    expect(renderer.render(doing).hasClass('status-doing')).toBe(true);
  });

  it("renders a .status label with the card status text", function() {
    var doing = new Card({ id: '1', status: 'doing' });
    expect(renderer.render(doing).find('.status').text()).toEqual('doing');
  });

  it("places id, priority, name and sprint in the card", function() {
    var postIt = renderer.render(sampleCard);
    expect(postIt.find(".id").text()).toEqual(sampleCard.id);
    expect(postIt.find(".priority").text()).toEqual(sampleCard.priority);
    expect(postIt.find(".name").text()).toEqual(sampleCard.name);
    expect(postIt.find(".sprint").text()).toEqual(sampleCard.sprint);
  });

  it("places both specialities in the card", function() {
    var specialities = renderer.render(sampleCard).find(".speciality");
    expect(specialities.length).toEqual(2);
    expect($(specialities[0]).text()).toEqual(sampleCard.specialist1);
    expect($(specialities[1]).text()).toEqual(sampleCard.specialist2);
  });

});

describe("CardModal", function() {
  var modal;
  var rendererSpy;
  var el;

  beforeEach(function() {
    rendererSpy = { render: jasmine.createSpy('render').and.callFake(function(card) {
      return $('<div class="rendered-card" data-card-id="' + card.id + '"></div>');
    }) };
    el = $(
      '<div class="card-modal" aria-hidden="true">' +
      '<div class="card-modal-backdrop"></div>' +
      '<div class="card-modal-dialog">' +
      '<button class="card-modal-close"></button>' +
      '<div class="card-modal-body"></div>' +
      '<div class="card-modal-actions"></div>' +
      '</div></div>'
    );
    modal = new CardModal({ el: el, renderer: rendererSpy });
  });

  it("show renders the card into the modal body and opens it", function() {
    modal.show({ id: 'x', status: 'todo' });
    expect(rendererSpy.render).toHaveBeenCalled();
    expect(el.find('.card-modal-body .rendered-card').length).toEqual(1);
    expect(el.hasClass('is-open')).toBe(true);
  });

  it("hide closes the modal and empties the body", function() {
    modal.show({ id: 'x', status: 'todo' });
    modal.hide();
    expect(el.hasClass('is-open')).toBe(false);
    expect(el.find('.card-modal-body').children().length).toEqual(0);
  });

  it("clicking the close button hides the modal", function() {
    modal.show({ id: 'x', status: 'todo' });
    el.find('.card-modal-close').trigger('click');
    expect(el.hasClass('is-open')).toBe(false);
  });

  it("clicking the backdrop hides the modal", function() {
    modal.show({ id: 'x', status: 'todo' });
    el.find('.card-modal-backdrop').trigger('click');
    expect(el.hasClass('is-open')).toBe(false);
  });

  it("renders status buttons with the current one marked when onStatusChange is provided", function() {
    modal.show({ id: 'x', status: 'doing' }, { onStatusChange: function() {} });
    var buttons = el.find('.card-modal-status');
    expect(buttons.length).toEqual(3);
    expect(buttons.filter('.is-current').attr('data-status')).toEqual('doing');
  });

  it("clicking a status button calls onStatusChange and hides the modal", function() {
    var picked = null;
    modal.show({ id: 'x', status: 'todo' }, { onStatusChange: function(s) { picked = s; } });
    el.find('.card-modal-status[data-status="done"]').trigger('click');
    expect(picked).toEqual('done');
    expect(el.hasClass('is-open')).toBe(false);
  });

  it("renders a delete button only when onDelete is provided", function() {
    modal.show({ id: 'x', status: 'todo' });
    expect(el.find('.card-modal-delete').length).toEqual(0);
    modal.show({ id: 'x', status: 'todo' }, { onDelete: function() {}, confirmDelete: function() { return true; } });
    expect(el.find('.card-modal-delete').length).toEqual(1);
  });

  it("clicking delete with a confirming prompt invokes onDelete and hides the modal", function() {
    var calls = 0;
    modal.show({ id: 'x', status: 'todo' }, {
      onDelete: function() { calls += 1; },
      confirmDelete: function() { return true; }
    });
    el.find('.card-modal-delete').trigger('click');
    expect(calls).toEqual(1);
    expect(el.hasClass('is-open')).toBe(false);
  });

  it("clicking delete with a cancelled prompt does nothing", function() {
    var calls = 0;
    modal.show({ id: 'x', status: 'todo' }, {
      onDelete: function() { calls += 1; },
      confirmDelete: function() { return false; }
    });
    el.find('.card-modal-delete').trigger('click');
    expect(calls).toEqual(0);
    expect(el.hasClass('is-open')).toBe(true);
  });

});

describe("BoardCardRenderer", function() {
  var renderer;

  beforeEach(function() {
    renderer = new BoardCardRenderer();
  });

  it("renders a .board-card root", function() {
    var el = renderer.render(new Card({ id: '1', name: 'A', status: 'todo' }));
    expect(el.hasClass('board-card')).toBe(true);
  });

  it("adds the status-{value} class on the root", function() {
    var el = renderer.render(new Card({ id: '1', name: 'A', status: 'doing' }));
    expect(el.hasClass('status-doing')).toBe(true);
  });

  it("tags data-card-id from the card identifier", function() {
    var el = renderer.render(new Card({ id: '42' }));
    expect(el.attr('data-card-id')).toEqual('42');
  });

  it("renders id, title and status text", function() {
    var el = renderer.render(new Card({ id: '7', name: 'Hello', status: 'todo' }));
    expect(el.find('.board-card-id').text()).toEqual('#7');
    expect(el.find('.board-card-title').text()).toEqual('Hello');
    expect(el.find('.board-card-status').text()).toEqual('todo');
  });

  it("renders priority and sprint when present", function() {
    var el = renderer.render(new Card({ id: '1', priority: '2', sprint: '5', status: 'todo' }));
    expect(el.find('.board-card-priority').text()).toEqual('P2');
    expect(el.find('.board-card-sprint').text()).toEqual('S5');
  });

  it("omits priority and sprint when missing", function() {
    var el = renderer.render(new Card({ id: '1', status: 'todo' }));
    expect(el.find('.board-card-priority').length).toEqual(0);
    expect(el.find('.board-card-sprint').length).toEqual(0);
  });

});

describe("Page", function() {
  var page;

  beforeEach(function() {
    page = new Page();
  });

  describe("parseCardSet", function() {

    it("returns an empty array when tasks are missing", function() {
      expect(page.parseCardSet({})).toEqual([]);
      expect(page.parseCardSet(null)).toEqual([]);
      expect(page.parseCardSet()).toEqual([]);
    });

    it("returns each card from the tasks map", function() {
      var rawJson = {
        tasks: {
          task1: { id: "1", name: "First" },
          task2: { id: "2", name: "Second" }
        }
      };
      var cards = page.parseCardSet(rawJson);
      expect(cards.length).toEqual(2);
      expect(cards[0].id).toEqual("1");
      expect(cards[1].id).toEqual("2");
    });

  });

  describe("render", function() {
    var target;

    beforeEach(function() {
      target = $('<div></div>');
      page = new Page(undefined, target);
    });

    it("renders one post-it per card", function() {
      spyOn(page.renderer, "render").and.returnValue($('<div></div>'));
      page.render({
        tasks: {
          a: { id: "1" },
          b: { id: "2" },
          c: { id: "3" }
        }
      });
      expect(page.renderer.render.calls.count()).toEqual(3);
    });

    it("appends rendered post-its to its target", function() {
      page.render({
        tasks: {
          a: { id: "1", name: "First" },
          b: { id: "2", name: "Second" }
        }
      });
      expect(target.children('.post-it').length).toEqual(2);
    });

    it("does nothing when there are no cards", function() {
      spyOn(page.renderer, "render");
      page.render({});
      expect(page.renderer.render).not.toHaveBeenCalled();
      expect(target.children().length).toEqual(0);
    });

    it("marks the 7th and 8th cards of every block of 8 as page-end", function() {
      var tasks = {};
      for (var i = 1; i <= 16; i++) {
        tasks['k' + i] = { id: String(i) };
      }
      page.render({ tasks: tasks });
      var postIts = target.children('.post-it');
      expect(postIts.length).toEqual(16);
      [0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13].forEach(function(idx) {
        expect($(postIts[idx]).hasClass('page-end')).toBe(false);
      });
      [6, 7, 14, 15].forEach(function(idx) {
        expect($(postIts[idx]).hasClass('page-end')).toBe(true);
      });
    });

  });

});
