function BoardController(deps) {
    this.renderer = deps.renderer;
    this.getBoardRepository = deps.getBoardRepository;
    this.modal = deps.modal;
    this.cardsByFbKey = {};
}

BoardController.prototype.attach = function(form) {
    var self = this;
    var renderer = this.renderer;
    self.cardsByFbKey = {};
    form.find('.board-column-cards').empty();
    updateCounts(form);
    bindDragAndDrop(form, function(fbKey, newStatus) { self.changeStatus(fbKey, newStatus); });
    bindOpenOnClick(form, function(fbKey) { self.openCard(fbKey); });

    var repo = this.getBoardRepository();
    if (!repo) {
        return;
    }

    repo.getAll().then(function(rawCards) {
        if (rawCards) {
            for (var fbKey in rawCards) {
                if (rawCards.hasOwnProperty(fbKey)) {
                    var card = new Card(rawCards[fbKey]);
                    self.cardsByFbKey[fbKey] = card;
                    var column = form.find('.board-column[data-status="' + card.status + '"] .board-column-cards');
                    var el = renderer.render(card).attr('data-fb-key', fbKey).attr('draggable', 'true');
                    column.append(el);
                }
            }
        }
        updateCounts(form);
    });
};

BoardController.prototype.openCard = function(fbKey) {
    var card = this.cardsByFbKey[fbKey];
    if (!card || !this.modal) {
        return;
    }
    var self = this;
    this.modal.show(card, {
        onStatusChange: function(newStatus) {
            card.status = newStatus;
            self.changeStatus(fbKey, newStatus);
            moveCardToStatusColumn(fbKey, newStatus);
        }
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

    form.on('dragstart.board', '.board-card', function(e) {
        e.originalEvent.dataTransfer.setData('text/plain', $(this).attr('data-fb-key'));
        e.originalEvent.dataTransfer.effectAllowed = 'move';
        $(this).addClass('dragging');
    });

    form.on('dragend.board', '.board-card', function() {
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
        var card = form.find('.board-card[data-fb-key="' + fbKey + '"]');
        if (!card.length) {
            return;
        }
        col.find('.board-column-cards').append(card);
        card.attr('class', card.attr('class').replace(/status-\S+/, 'status-' + newStatus));
        card.find('.board-card-status').text(newStatus);
        updateCounts(form);
        onMove(fbKey, newStatus);
    });
}

function bindOpenOnClick(form, onOpen) {
    form.off('click.board-open');
    form.on('click.board-open', '.board-card', function(e) {
        if ($(e.target).closest('a, button, input, select').length) {
            return;
        }
        var fbKey = $(this).attr('data-fb-key');
        if (fbKey) {
            onOpen(fbKey);
        }
    });
}

function moveCardToStatusColumn(fbKey, newStatus) {
    var card = $('.board-card[data-fb-key="' + fbKey + '"]');
    if (!card.length) {
        return;
    }
    var form = card.closest('form');
    var nextCol = form.find('.board-column[data-status="' + newStatus + '"] .board-column-cards');
    nextCol.append(card);
    card.attr('class', card.attr('class').replace(/status-\S+/, 'status-' + newStatus));
    card.find('.board-card-status').text(newStatus);
    updateCounts(form);
}

function updateCounts(form) {
    form.find('.board-column').each(function() {
        var col = $(this);
        var count = col.find('.board-column-cards .board-card').length;
        var titleEl = col.find('.board-column-title');
        var base = titleEl.data('base');
        if (!base) {
            base = titleEl.text();
            titleEl.data('base', base);
        }
        titleEl.text(base + ' (' + count + ')');
    });
}
