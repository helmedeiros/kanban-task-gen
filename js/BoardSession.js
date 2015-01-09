function BoardSession(deps) {
    this.userRefFor = deps.userRefFor;
    this.page = deps.page;
    this.counter = deps.counter;
    this.target = deps.target;
    this.repository = null;
}

BoardSession.prototype.start = function(authData) {
    this.target.empty();
    this.repository = new BoardRepository(this.userRefFor(authData));
    var page = this.page;
    var counter = this.counter;
    this.repository.onCardAdded(function(data) {
        counter.observe(data.id);
        page.render({ tasks: [data] });
    });
};
