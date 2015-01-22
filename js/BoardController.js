function BoardController(deps) {
    this.renderer = deps.renderer;
    this.getBoardRepository = deps.getBoardRepository;
}

BoardController.prototype.attach = function(form) {
    var self = this;
    var renderer = this.renderer;
    form.find('.board-column-cards').empty();
    updateCounts(form);
    bindDragAndDrop(form, function(fbKey, newStatus) { self.changeStatus(fbKey, newStatus); });

    var repo = this.getBoardRepository();
    if (!repo) {
        return;
    }

    repo.getAll().then(function(rawCards) {
        if (rawCards) {
            for (var fbKey in rawCards) {
                if (rawCards.hasOwnProperty(fbKey)) {
                    var card = new Card(rawCards[fbKey]);
                    var column = form.find('.board-column[data-status="' + card.status + '"] .board-column-cards');
                    var postIt = renderer.render(card).attr('data-fb-key', fbKey).attr('draggable', 'true');
                    column.append(postIt);
                }
            }
        }
        updateCounts(form);
    });
};

BoardController.prototype.changeStatus = function(fbKey, newStatus) {
    var repo = this.getBoardRepository();
    if (repo) {
        repo.update(fbKey, { status: newStatus });
    }
};

function bindDragAndDrop(form, onMove) {
    form.off('dragstart.board dragover.board drop.board');

    form.on('dragstart.board', '.post-it', function(e) {
        e.originalEvent.dataTransfer.setData('text/plain', $(this).attr('data-fb-key'));
        e.originalEvent.dataTransfer.effectAllowed = 'move';
    });

    form.on('dragover.board', '.board-column', function(e) {
        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = 'move';
    });

    form.on('drop.board', '.board-column', function(e) {
        e.preventDefault();
        var fbKey = e.originalEvent.dataTransfer.getData('text/plain');
        var col = $(this);
        var newStatus = col.data('status');
        var postIt = form.find('.post-it[data-fb-key="' + fbKey + '"]');
        if (!postIt.length) {
            return;
        }
        col.find('.board-column-cards').append(postIt);
        postIt.attr('class', postIt.attr('class').replace(/status-\S+/, 'status-' + newStatus));
        postIt.find('.status').text(newStatus);
        updateCounts(form);
        onMove(fbKey, newStatus);
    });
}

function updateCounts(form) {
    form.find('.board-column').each(function() {
        var col = $(this);
        var count = col.find('.board-column-cards .post-it').length;
        var titleEl = col.find('.board-column-title');
        var base = titleEl.data('base');
        if (!base) {
            base = titleEl.text();
            titleEl.data('base', base);
        }
        titleEl.text(base + ' (' + count + ')');
    });
}
