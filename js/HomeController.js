function HomeController(deps) {
    this.router = deps.router;
}

HomeController.prototype.attach = function(form) {
    var self = this;

    form.find('.home-cta').off('click.home').on('click.home', function(e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) {
            return;
        }
        e.preventDefault();
        self.router.routeTo('board');
    });
};
