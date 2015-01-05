function HomeController(deps) {
    this.authService = deps.authService;
    this.router = deps.router;
}

HomeController.prototype.attach = function(form) {
    var self = this;

    form.on('submit', function(e) {
        e.preventDefault();

        var userAndPass = $(this).serializeObject();
        userAndPass.password = '12345';

        self.router.afterAuth(self.authService.signUpAndSignIn(userAndPass), 'gettingstarted');
    });

    form.find('.bt-social').on('click', function(e) {
        e.preventDefault();

        var provider = $(this).data('provider');
        self.router.afterAuth(self.authService.signInWith(provider), 'gettingstarted');
    });
};
