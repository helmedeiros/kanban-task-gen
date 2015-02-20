function JsonUpload(deps) {
    this.page = deps.page;
    this.alertView = deps.alertView;
    this.fileInputSelector = deps.fileInputSelector;
    this.importer = deps.importer || new BoardImporter();
    this.getBoardRepository = deps.getBoardRepository || function() { return null; };
    this.analytics = deps.analytics || { track: function() {} };
    this.router = deps.router;
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
        var parsed;
        try {
            parsed = JSON.parse(e.target.result);
        } catch (err) {
            self.alertView.show({
                title: 'Could not read file',
                detail: 'The selected file is not valid JSON.',
                className: 'alert-danger'
            });
            return;
        }
        if (self.importer.isSnapshot(parsed)) {
            self.importSnapshot(parsed);
        } else {
            self.page.render(parsed);
            $("body").scrollTop($('#post-its').position().top);
        }
    };
    reader.readAsText(file);
};

JsonUpload.prototype.importSnapshot = function(parsed) {
    var self = this;
    var repo = this.getBoardRepository();
    this.importer.importInto(parsed, repo).then(function(count) {
        var board = parsed.board || {};
        self.analytics.track('board_imported', {
            boardId: board.id,
            name: board.name,
            cardCount: count
        });
        self.alertView.show({
            title: 'Snapshot imported',
            detail: count + ' card' + (count === 1 ? '' : 's') + ' added to your active board.',
            className: 'alert-success'
        });
        if (self.router) {
            self.router.routeTo('board');
        }
    });
};
