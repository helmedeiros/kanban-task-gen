function Router(options) {
    this.routeMap = options.routeMap;
    this.menu = options.menu;
    this.controllers = options.controllers;
    this.authService = options.authService;
    this.alertView = options.alertView;
    this.activeForm = null;
}

Router.prototype = {

    routeTo: function(route) {
        window.location.href = '#/' + route;
    },

    afterAuth: function(promise, route) {
        var self = this;
        return $.when(promise).then(function() {
            self.routeTo(route);
        }, function(err) {
            self.alertView.show({
                title: err.code,
                detail: err.message,
                className: 'alert-danger'
            });
        });
    },

    transitionTo: function(path) {
        var formRoute = this.routeMap[path];
        var currentUser = this.authService.currentUser();

        if (formRoute.authRequired && !currentUser) {
            this.routeTo('home');
            return;
        }

        var upcomingForm = $('#' + formRoute.form);

        if (!this.activeForm) {
            this.activeForm = upcomingForm;
        }

        this.activeForm.hide();
        upcomingForm.show().hide().fadeIn(500);
        this.activeForm.off();
        this.activeForm = upcomingForm;

        this.menu.find('li').removeClass('active');
        this.menu.find('.' + formRoute.controller).addClass('active');

        this.controllers[formRoute.controller](this.activeForm);
    }
};
