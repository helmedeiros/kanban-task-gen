function BoardsCatalog(opts) {
    opts = opts || {};
    this.namespace = opts.namespace || 'kanban-task-gen-boards';
    this.activeKey = opts.activeKey || 'kanban-task-gen-active-board';
    this.legacyCardKey = opts.legacyCardKey || 'kanban-task-gen-cards';
    this.cardNamespacePrefix = opts.cardNamespacePrefix || 'kanban-task-gen-cards';
    this.ensureSeed();
}

BoardsCatalog.prototype = {

    ensureSeed: function() {
        var raw = null;
        try {
            raw = localStorage.getItem(this.namespace);
        } catch (e) {
            return;
        }
        if (raw) {
            return;
        }
        var seed = [{ id: 'default', name: 'My board', createdAt: now() }];
        this.writeBoards(seed);
    },

    readBoards: function() {
        var raw = null;
        try {
            raw = localStorage.getItem(this.namespace);
        } catch (e) {
            return [];
        }
        if (!raw) {
            return [];
        }
        try {
            return JSON.parse(raw);
        } catch (e) {
            return [];
        }
    },

    writeBoards: function(boards) {
        try {
            localStorage.setItem(this.namespace, JSON.stringify(boards));
        } catch (e) {
            return;
        }
    },

    list: function() {
        return this.readBoards();
    },

    create: function(name) {
        var boards = this.readBoards();
        var id = 'b-' + now();
        var board = { id: id, name: name || 'Untitled board', createdAt: now() };
        boards.push(board);
        this.writeBoards(boards);
        return board;
    },

    rename: function(id, newName) {
        var boards = this.readBoards();
        for (var i = 0; i < boards.length; i++) {
            if (boards[i].id === id) {
                boards[i].name = newName;
            }
        }
        this.writeBoards(boards);
    },

    remove: function(id) {
        var boards = this.readBoards();
        var kept = [];
        for (var i = 0; i < boards.length; i++) {
            if (boards[i].id !== id) {
                kept.push(boards[i]);
            }
        }
        this.writeBoards(kept);
        try {
            localStorage.removeItem(this.cardNamespaceFor(id));
        } catch (e) {
            return;
        }
    },

    cardNamespaceFor: function(id) {
        if (id === 'default') {
            return this.legacyCardKey;
        }
        return this.cardNamespacePrefix + '-' + id;
    },

    getActiveId: function() {
        var id = null;
        try {
            id = localStorage.getItem(this.activeKey);
        } catch (e) {
            id = null;
        }
        if (id) {
            return id;
        }
        var boards = this.readBoards();
        var fallback = boards.length ? boards[0].id : 'default';
        this.setActiveId(fallback);
        return fallback;
    },

    setActiveId: function(id) {
        try {
            localStorage.setItem(this.activeKey, id);
        } catch (e) {
            return;
        }
    },

    getActive: function() {
        var id = this.getActiveId();
        var boards = this.readBoards();
        for (var i = 0; i < boards.length; i++) {
            if (boards[i].id === id) {
                return boards[i];
            }
        }
        return boards[0] || null;
    }
};

function now() {
    return (new Date()).getTime();
}
