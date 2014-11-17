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

  describe("buildPostIt", function() {
    var sampleCard;

    beforeEach(function() {
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

    it("returns a .post-it element", function() {
      expect(page.buildPostIt(sampleCard).hasClass("post-it")).toBe(true);
    });

    it("renders id, priority, name and sprint from the card", function() {
      var postIt = page.buildPostIt(sampleCard);
      expect(postIt.find(".id").text()).toEqual(sampleCard.id);
      expect(postIt.find(".priority").text()).toEqual(sampleCard.priority);
      expect(postIt.find(".name").text()).toEqual(sampleCard.name);
      expect(postIt.find(".sprint").text()).toEqual(sampleCard.sprint);
    });

    it("renders both specialities", function() {
      var specialities = page.buildPostIt(sampleCard).find(".speciality");
      expect(specialities.length).toEqual(2);
      expect($(specialities[0]).text()).toEqual(sampleCard.specialist1);
      expect($(specialities[1]).text()).toEqual(sampleCard.specialist2);
    });
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

});
