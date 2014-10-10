describe("PostIts", function() {
  var postIts;
  var configuration;
                          

  beforeEach(function() {
    postIts = new PostIts();
  });

  it("should make an AJAX request to the correct URL", function() {
  	configuration = { url: "fixtures/one-task.json",
  						remainingCallTime: 30000 
                        };

  	spyOn($, "ajax");
  	postIts.catchPostIts(configuration);
	expect($.ajax.mostRecentCall.args[0]["url"]).toEqual(configuration.url);
  });

});