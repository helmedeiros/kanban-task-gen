function AlertView(box) {
    this.box = box;
}

AlertView.prototype = {

    show: function(opts) {
        var className = 'alert ' + opts.className;
        this.box.removeClass().addClass(className);
        this.box.children('#alert-title').text(opts.title);
        this.box.children('#alert-detail').text(opts.detail);
        this.box.fadeIn(2000).fadeOut(4000);
    }
};
