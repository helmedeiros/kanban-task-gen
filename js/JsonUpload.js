function JsonUpload(deps) {
    this.page = deps.page;
    this.alertView = deps.alertView;
    this.fileInputSelector = deps.fileInputSelector;
}

JsonUpload.prototype.attach = function() {
    var self = this;
    var node = $(this.fileInputSelector)[0];
    if (!node) {
        return;
    }
    node.addEventListener('change', function(evt) {
        var files = evt.target.files;
        if (!files || !files.length) {
            self.alertView.show({
                title: '',
                detail: 'Failed to load files',
                className: 'alert-danger'
            });
            return;
        }
        for (var i = 0; i < files.length; i++) {
            self.readFile(files[i]);
        }
    }, false);
};

JsonUpload.prototype.readFile = function(file) {
    var self = this;
    var reader = new FileReader();
    reader.onload = function(e) {
        self.page.parseStories(JSON.parse(e.target.result));
        $("body").scrollTop($('#post-its').position().top);
    };
    reader.readAsText(file);
};
