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
    var sampleStory;

    beforeEach(function() {
      sampleStory = {
        id: "42",
        priority: "1",
        name: "Sample story",
        specialist1: "BE",
        time1: "3",
        specialist2: "FE",
        time2: "2",
        sprint: "7"
      };
    });

    it("returns a .post-it element", function() {
      expect(page.buildPostIt(sampleStory).hasClass("post-it")).toBe(true);
    });

    it("renders id, priority, name and sprint from the story", function() {
      var postIt = page.buildPostIt(sampleStory);
      expect(postIt.find(".id").text()).toEqual(sampleStory.id);
      expect(postIt.find(".priority").text()).toEqual(sampleStory.priority);
      expect(postIt.find(".name").text()).toEqual(sampleStory.name);
      expect(postIt.find(".sprint").text()).toEqual(sampleStory.sprint);
    });

    it("renders both specialities", function() {
      var specialities = page.buildPostIt(sampleStory).find(".speciality");
      expect(specialities.length).toEqual(2);
      expect($(specialities[0]).text()).toEqual(sampleStory.specialist1);
      expect($(specialities[1]).text()).toEqual(sampleStory.specialist2);
    });
  });

  describe("parseStorySet", function() {

    it("returns an empty array when tasks are missing", function() {
      expect(page.parseStorySet({})).toEqual([]);
      expect(page.parseStorySet(null)).toEqual([]);
      expect(page.parseStorySet()).toEqual([]);
    });

    it("returns each story from the tasks map", function() {
      var rawJson = {
        tasks: {
          task1: { id: "1", name: "First" },
          task2: { id: "2", name: "Second" }
        }
      };
      var stories = page.parseStorySet(rawJson);
      expect(stories.length).toEqual(2);
      expect(stories[0].id).toEqual("1");
      expect(stories[1].id).toEqual("2");
    });

  });

});
