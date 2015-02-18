function BoardSnapshot() {}

BoardSnapshot.prototype = {

    build: function(board, cards, now) {
        var exportedAt = (now || new Date()).toISOString();
        var tasks = {};
        for (var key in cards) {
            if (cards.hasOwnProperty(key)) {
                tasks[key] = cards[key];
            }
        }
        return {
            board: { id: board.id, name: board.name },
            exported_at: exportedAt,
            tasks: tasks
        };
    },

    serialize: function(board, cards, now) {
        return JSON.stringify(this.build(board, cards, now), null, 2);
    },

    filename: function(board, now) {
        var when = (now || new Date()).toISOString().split('T')[0];
        var slug = String(board.name || 'board')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        if (!slug) {
            slug = 'board';
        }
        return 'kanban-' + slug + '-' + when + '.json';
    },

    cardCount: function(cards) {
        var n = 0;
        for (var k in cards) {
            if (cards.hasOwnProperty(k)) {
                n++;
            }
        }
        return n;
    }
};
