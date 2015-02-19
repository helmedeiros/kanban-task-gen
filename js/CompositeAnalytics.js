function CompositeAnalytics(adapters) {
    this.adapters = adapters || [];
}

CompositeAnalytics.prototype = {

    track: function(name, properties) {
        for (var i = 0; i < this.adapters.length; i++) {
            try {
                this.adapters[i].track(name, properties);
            } catch (e) {
                if (window.console && window.console.warn) {
                    window.console.warn('Analytics adapter failed for ' + name + ': ' + e);
                }
            }
        }
    },

    add: function(adapter) {
        this.adapters.push(adapter);
    }
};
