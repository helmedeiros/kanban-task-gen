function BoardCardRenderer() {}

BoardCardRenderer.prototype.render = function(card) {
    var el = $('<div class="board-card"></div>');
    el.addClass('status-' + card.status);
    el.attr('data-card-id', card.identifier());

    el.append($('<span class="board-card-id">#' + card.id + '</span>'));
    el.append($('<span class="board-card-title"></span>').text(card.name || ''));

    var meta = $('<div class="board-card-meta"></div>');
    if (card.priority) {
        meta.append($('<span class="board-card-priority">P' + card.priority + '</span>'));
    }
    if (card.sprint) {
        meta.append($('<span class="board-card-sprint">S' + card.sprint + '</span>'));
    }
    meta.append($('<span class="board-card-status">' + card.status + '</span>'));

    el.append(meta);
    return el;
};
