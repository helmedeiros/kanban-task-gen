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
    bindCycleOnClick(form, function(fbKey, newStatus) { self.changeStatus(fbKey, newStatus); });

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
    form.off('dragstart.board dragend.board dragenter.board dragleave.board dragover.board drop.board');

    form.on('dragstart.board', '.post-it', function(e) {
        e.originalEvent.dataTransfer.setData('text/plain', $(this).attr('data-fb-key'));
        e.originalEvent.dataTransfer.effectAllowed = 'move';
        $(this).addClass('dragging');
    });

    form.on('dragend.board', '.post-it', function() {
        $(this).removeClass('dragging');
        form.find('.board-column.drag-over').removeClass('drag-over');
    });

    form.on('dragenter.board', '.board-column', function(e) {
        e.preventDefault();
        $(this).addClass('drag-over');
    });

    form.on('dragleave.board', '.board-column', function(e) {
        if (e.target === this) {
            $(this).removeClass('drag-over');
        }
    });

    form.on('dragover.board', '.board-column', function(e) {
        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = 'move';
    });

    form.on('drop.board', '.board-column', function(e) {
        e.preventDefault();
        var col = $(this).removeClass('drag-over');
        var fbKey = e.originalEvent.dataTransfer.getData('text/plain');
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

var STATUS_CYCLE = { todo: 'doing', doing: 'done', done: 'todo' };

function bindCycleOnClick(form, onMove) {
    form.off('click.board-cycle');
    form.on('click.board-cycle', '.post-it', function(e) {
        if ($(e.target).closest('a, button, input, select').length) {
            return;
        }
        var postIt = $(this);
        var fbKey = postIt.attr('data-fb-key');
        if (!fbKey) {
            return;
        }
        var col = postIt.closest('.board-column');
        var current = col.data('status');
        var next = STATUS_CYCLE[current];
        if (!next) {
            return;
        }
        var nextCol = form.find('.board-column[data-status="' + next + '"] .board-column-cards');
        nextCol.append(postIt);
        postIt.attr('class', postIt.attr('class').replace(/status-\S+/, 'status-' + next));
        postIt.find('.status').text(next);
        updateCounts(form);
        onMove(fbKey, next);
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
