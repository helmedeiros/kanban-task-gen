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

});

describe("PostItRenderer", function() {
  var renderer;
  var sampleCard;

  beforeEach(function() {
    renderer = new PostItRenderer();
    sampleCard = {
      id: "42",
      priority: "1",
      name: "Sample card",
      specialist1: "BE",
      time1: "3",
      specialist2: "FE",
      time2: "2",
      sprint: "7"
    };
  });

  it("renders a .post-it element", function() {
    expect(renderer.render(sampleCard).hasClass("post-it")).toBe(true);
  });

  it("tags the root with data-card-id", function() {
    expect(renderer.render(sampleCard).attr("data-card-id")).toEqual(sampleCard.id);
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
  var configuration;

  beforeEach(function() {
    page = new Page();
  });

  it("should make an AJAX request to the correct URL", function() {
    configuration = { url: "fixtures/one-task.json" };

    spyOn($, "ajax");
    page.catchPostIts(configuration);
    expect($.ajax.calls.mostRecent().args[0].url).toEqual(configuration.url);
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

  describe("parseStories", function() {

    it("renders one post-it per card", function() {
      spyOn(page.renderer, "render").and.returnValue($('<div></div>'));
      page.parseStories({
        tasks: {
          a: { id: "1" },
          b: { id: "2" },
          c: { id: "3" }
        }
      });
      expect(page.renderer.render.calls.count()).toEqual(3);
    });

    it("does nothing when there are no cards", function() {
      spyOn(page.renderer, "render");
      page.parseStories({});
      expect(page.renderer.render).not.toHaveBeenCalled();
    });

  });

});
