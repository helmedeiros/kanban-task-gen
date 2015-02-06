function LocalAnalytics(opts) {
    opts = opts || {};
    this.namespace = opts.namespace || 'kanban-task-gen-events';
    this.limit = opts.limit || 500;
}

LocalAnalytics.prototype = {

    read: function() {
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
            var parsed = JSON.parse(raw);
            return parsed instanceof Array ? parsed : [];
        } catch (e) {
            return [];
        }
    },

    write: function(events) {
        try {
            localStorage.setItem(this.namespace, JSON.stringify(events));
        } catch (e) {
            return;
        }
    },

    track: function(name, properties) {
        var events = this.read();
        events.push({
            name: name,
            properties: properties || {},
            t: (new Date()).getTime(),
            id: 'e-' + (new Date()).getTime() + '-' + Math.floor(Math.random() * 100000)
        });
        if (events.length > this.limit) {
            events = events.slice(events.length - this.limit);
        }
        this.write(events);
    },

    list: function() {
        return this.read();
    },

    clear: function() {
        try {
            localStorage.removeItem(this.namespace);
        } catch (e) {
            return;
        }
    }
};
