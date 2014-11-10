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

});
