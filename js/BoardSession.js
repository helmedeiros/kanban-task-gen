function BoardSession(deps) {
    if (deps.repositoryFactory) {
        this.repositoryFactory = deps.repositoryFactory;
    } else {
        var userRefFor = deps.userRefFor;
        this.repositoryFactory = function(authData) {
            return new BoardRepository(userRefFor(authData));
        };
    }
    this.page = deps.page;
    this.counter = deps.counter;
    this.target = deps.target;
    this.repository = null;
}

BoardSession.prototype.start = function(authData) {
    this.target.empty();
    this.repository = this.repositoryFactory(authData);
    var page = this.page;
    var counter = this.counter;
    this.repository.onCardAdded(function(data) {
        counter.observe(data.id);
        page.render({ tasks: [data] });
    });
};
