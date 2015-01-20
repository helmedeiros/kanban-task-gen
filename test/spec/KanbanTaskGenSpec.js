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

});

describe("BoardRepository", function() {
  var userRef;
  var repo;

  beforeEach(function() {
    userRef = {
      push: jasmine.createSpy("push"),
      on: jasmine.createSpy("on"),
      once: jasmine.createSpy("once")
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

});

describe("BoardController", function() {
  var controller;
  var renderer;
  var repository;
  var form;

  beforeEach(function() {
    renderer = { render: function(card) { return $('<div class="post-it" data-card-id="' + card.id + '"></div>'); } };
    repository = null;
    form = $(
      '<form>' +
      '<section class="board-column" data-status="todo"><div class="board-column-cards"></div></section>' +
      '<section class="board-column" data-status="doing"><div class="board-column-cards"></div></section>' +
      '<section class="board-column" data-status="done"><div class="board-column-cards"></div></section>' +
      '</form>'
    );
    controller = new BoardController({
      renderer: renderer,
      getBoardRepository: function() { return repository; }
    });
  });

  it("empties the columns even when the repository is missing", function() {
    form.find('.board-column[data-status="todo"] .board-column-cards').append('<div class="post-it"></div>');
    controller.attach(form);
    expect(form.find('.board-column-cards .post-it').length).toEqual(0);
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
      expect(form.find('.board-column[data-status="todo"] .post-it').length).toEqual(1);
      expect(form.find('.board-column[data-status="doing"] .post-it').length).toEqual(2);
      expect(form.find('.board-column[data-status="done"] .post-it').length).toEqual(1);
      done();
    }, 0);
  });

});

describe("HomeController", function() {
  var controller;
  var authService;
  var router;
  var form;

  beforeEach(function() {
    authService = {
      signUpAndSignIn: jasmine.createSpy('signUpAndSignIn').and.returnValue('signup-promise'),
      signInWith: jasmine.createSpy('signInWith').and.returnValue('social-promise')
    };
    router = { afterAuth: jasmine.createSpy('afterAuth') };
    form = $('<form><button class="bt-social" data-provider="github"></button></form>');
    form.serializeObject = function() { return { email: 'a@b.com' }; };

    controller = new HomeController({
      authService: authService,
      router: router
    });
    controller.attach(form);
  });

  it("signs up and routes after the e-mail submit", function() {
    spyOn($.fn, 'serializeObject').and.returnValue({ email: 'a@b.com' });
    form.trigger('submit');
    expect(authService.signUpAndSignIn).toHaveBeenCalled();
    expect(router.afterAuth).toHaveBeenCalledWith('signup-promise', 'gettingstarted');
  });

  it("signs in with the provider after a social click", function() {
    form.find('.bt-social').trigger('click');
    expect(authService.signInWith).toHaveBeenCalledWith('github');
    expect(router.afterAuth).toHaveBeenCalledWith('social-promise', 'gettingstarted');
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
    boardRepository = { add: jasmine.createSpy('add').and.returnValue($.Deferred().promise()) };
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
