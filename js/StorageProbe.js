function StorageProbe(opts) {
    opts = opts || {};
    this.global = opts.global || window;
    this.key = opts.key || '__kanban-task-gen-probe';
}

StorageProbe.prototype = {

    probe: function() {
        var token = 'ok-' + (new Date()).getTime() + '-' + Math.floor(Math.random() * 100000);
        try {
            this.global.localStorage.setItem(this.key, token);
            var read = this.global.localStorage.getItem(this.key);
            this.global.localStorage.removeItem(this.key);
            return read === token;
        } catch (e) {
            return false;
        }
    }
};
