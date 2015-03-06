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
    this.importer.importInto(parsed, repo).then(function(result) {
        var board = parsed.board || {};
        self.analytics.track('board_imported', {
            boardId: board.id,
            name: board.name,
            imported: result.imported,
            skipped: result.skipped,
            failed: result.failed
        });
        self.alertView.show(buildImportAlert(result, board));
        if (result.imported > 0 && self.router) {
            self.router.routeTo('board');
        }
    });
};

function buildImportAlert(result, board) {
    var name = board && board.name ? '"' + board.name + '"' : 'this board';
    if (result.failed > 0 && result.imported === 0) {
        return {
            title: 'Import failed',
            detail: 'Could not save any cards from ' + name + '. Your local storage may be full.',
            className: 'alert-danger'
        };
    }
    if (result.imported === 0 && result.skipped > 0) {
        return {
            title: 'Already up to date',
            detail: 'All ' + result.skipped + ' card' + plural(result.skipped) + ' from ' + name + ' were already on your board.',
            className: 'alert-info'
        };
    }
    if (result.imported === 0) {
        return {
            title: 'Nothing to import',
            detail: 'The selected file did not contain any cards.',
            className: 'alert-info'
        };
    }
    var parts = [result.imported + ' card' + plural(result.imported) + ' added'];
    if (result.skipped > 0) {
        parts.push(result.skipped + ' skipped as duplicate' + plural(result.skipped));
    }
    if (result.failed > 0) {
        parts.push(result.failed + ' failed');
    }
    return {
        title: 'Snapshot imported',
        detail: parts.join(', ') + ' from ' + name + '.',
        className: 'alert-success'
    };
}

function plural(n) { return n === 1 ? '' : 's'; }
