function LocalStorageBoardRepository(namespace, errorReporter) {
    this.namespace = namespace || 'kanban-task-gen-cards';
    this.errorReporter = errorReporter || function() {};
    this.callbacks = [];
}

LocalStorageBoardRepository.prototype = {

    read: function() {
        var raw = null;
        try {
            raw = localStorage.getItem(this.namespace);
        } catch (e) {
            return {};
        }
        if (!raw) {
            return {};
        }
        try {
            return JSON.parse(raw);
        } catch (e) {
            return {};
        }
    },

    write: function(data) {
        try {
            localStorage.setItem(this.namespace, JSON.stringify(data));
            return true;
        } catch (e) {
            this.errorReporter({ source: 'cards', namespace: this.namespace, error: e });
            return false;
        }
    },

    add: function(card) {
        var deferred = $.Deferred();
        var all = this.read();
        var key = 'lc-' + (new Date()).getTime() + '-' + Math.floor(Math.random() * 100000);
        all[key] = card;
        this.write(all);
        for (var i = 0; i < this.callbacks.length; i++) {
            this.callbacks[i](card);
        }
        deferred.resolve();
        return deferred.promise();
    },

    onCardAdded: function(callback) {
        this.callbacks.push(callback);
        var all = this.read();
        for (var key in all) {
            if (all.hasOwnProperty(key)) {
                callback(all[key]);
            }
        }
    },

    getAll: function() {
        var deferred = $.Deferred();
        deferred.resolve(this.read());
        return deferred.promise();
    },

    update: function(key, changes) {
        var deferred = $.Deferred();
        var all = this.read();
        if (all[key]) {
            for (var field in changes) {
                if (changes.hasOwnProperty(field)) {
                    all[key][field] = changes[field];
                }
            }
            this.write(all);
        }
        deferred.resolve();
        return deferred.promise();
    },

    remove: function(key) {
        var deferred = $.Deferred();
        var all = this.read();
        if (all[key]) {
            delete all[key];
            this.write(all);
        }
        deferred.resolve();
        return deferred.promise();
    }
};
