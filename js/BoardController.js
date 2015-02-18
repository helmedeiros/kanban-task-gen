function BoardController(deps) {
    this.renderer = deps.renderer;
    this.getBoardRepository = deps.getBoardRepository;
    this.modal = deps.modal;
    this.analytics = deps.analytics || { track: function() {} };
    this.snapshot = deps.snapshot || new BoardSnapshot();
    this.getActiveBoard = deps.getActiveBoard || function() { return { id: 'default', name: 'Board' }; };
    this.download = deps.download || defaultDownload;
    this.alertView = deps.alertView || { show: function() {} };
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
    bindShare(form, function() { self.shareBoard(); });

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

BoardController.prototype.shareBoard = function() {
    var self = this;
    var repo = this.getBoardRepository();
    if (!repo) {
        return;
    }
    repo.getAll().then(function(rawCards) {
        var cards = rawCards || {};
        var board = self.getActiveBoard();
        var count = self.snapshot.cardCount(cards);
        if (count === 0) {
            self.alertView.show({
                title: 'Nothing to share',
                detail: 'Add at least one card to ' + board.name + ' before sharing.',
                className: 'alert-info'
            });
            return;
        }
        var now = new Date();
        var payload = self.snapshot.serialize(board, cards, now);
        var filename = self.snapshot.filename(board, now);
        self.download(filename, payload, 'application/json');
        self.analytics.track('board_shared', {
            boardId: board.id,
            name: board.name,
            cardCount: count
        });
        self.alertView.show({
            title: 'Snapshot downloaded',
            detail: count + ' card' + (count === 1 ? '' : 's') + ' from ' + board.name + ' saved to ' + filename,
            className: 'alert-success'
        });
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
            self.changeStatus(fbKey, newStatus);
            moveCardToStatusColumn(fbKey, newStatus);
        },
        onDelete: function() {
            self.deleteCard(fbKey);
        }
    });
};

BoardController.prototype.deleteCard = function(fbKey) {
    var card = this.cardsByFbKey[fbKey];
    var priorStatus = card ? card.status : null;
    var repo = this.getBoardRepository();
    if (repo) {
        repo.remove(fbKey);
    }
    delete this.cardsByFbKey[fbKey];
    var el = $('.board-card[data-fb-key="' + fbKey + '"]');
    var form = el.closest('form');
    el.remove();
    if (form.length) {
        updateCounts(form);
    }
    this.analytics.track('card_deleted', { fbKey: fbKey, status: priorStatus });
};

BoardController.prototype.changeStatus = function(fbKey, newStatus) {
    var card = this.cardsByFbKey[fbKey];
    var fromStatus = card ? card.status : null;
    if (card) {
        card.status = newStatus;
    }
    var repo = this.getBoardRepository();
    if (repo) {
        repo.update(fbKey, { status: newStatus });
    }
    this.analytics.track('card_moved', { fbKey: fbKey, from: fromStatus, to: newStatus });
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

function bindShare(form, onShare) {
    form.find('.board-share').off('click.share').on('click.share', function(e) {
        e.preventDefault();
        onShare();
    });
}

function defaultDownload(filename, payload, mimeType) {
    var blob = new Blob([payload], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 0);
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
