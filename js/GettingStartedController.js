function GettingStartedController(deps) {
    this.authService = deps.authService;
    this.alertView = deps.alertView;
    this.counter = deps.counter;
    this.getBoardRepository = deps.getBoardRepository;
}

GettingStartedController.prototype.attach = function(form) {
    var self = this;

    if (!this.authService.currentUser()) {
        this.authService.signInAnonymously();
        this.alertView.show({
            title: '',
            detail: 'Log in to store your post-its',
            className: 'alert-info'
        });
    }

    form.on('submit', function(e) {
        e.preventDefault();

        var userInfo = $(this).serializeObject();
        userInfo.id = self.counter.next();
        userInfo.specialist2 = '';
        userInfo.time2 = '';

        self.getBoardRepository().add(userInfo).then(function() {
            self.alertView.show({
                title: 'Successfully saved!',
                detail: 'You are still logged in',
                className: 'alert-success'
            });
        });

        $(this)[0].reset();
    });
};
