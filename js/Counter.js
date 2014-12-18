function Counter() {
    this.value = 0;
}

Counter.prototype = {

    next: function() {
        this.value += 1;
        return this.value;
    },

    observe: function(id) {
        this.value = Math.max(this.value, Number(id) || 0);
    }
};
