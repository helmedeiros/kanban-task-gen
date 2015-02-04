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
        var theForm = $(this);

        var userInfo = theForm.serializeObject();
        fillDefaultsFromPlaceholders(theForm, userInfo);
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

        theForm[0].reset();
    });
};

function fillDefaultsFromPlaceholders(form, data) {
    form.find('input[name], select[name]').each(function() {
        var input = $(this);
        var name = input.attr('name');
        var current = data[name];
        if (current !== undefined && current !== null && current !== '') {
            return;
        }
        var placeholder = input.attr('placeholder');
        if (placeholder) {
            data[name] = placeholder;
        }
    });
}
