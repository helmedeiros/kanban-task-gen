function KissmetricsAnalytics(opts) {
    opts = opts || {};
    this.queueName = opts.queueName || '_kmq';
    this.global = opts.global || window;
}

KissmetricsAnalytics.prototype = {

    track: function(name, properties) {
        this._queue().push(['record', name, properties || {}]);
    },

    identify: function(userId) {
        this._queue().push(['identify', userId]);
    },

    set: function(traits) {
        this._queue().push(['set', traits || {}]);
    },

    _queue: function() {
        if (!this.global[this.queueName]) {
            this.global[this.queueName] = [];
        }
        return this.global[this.queueName];
    }
};
