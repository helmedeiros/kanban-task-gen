function BoardRepository(userRef) {
    this.userRef = userRef;
}

BoardRepository.prototype = {

    add: function(card) {
        var deferred = $.Deferred();
        this.userRef.push(card, function() {
            deferred.resolve();
        });
        return deferred.promise();
    },

    onCardAdded: function(callback) {
        this.userRef.on('child_added', function(snapshot) {
            callback(snapshot.val());
        });
    },

    getAll: function() {
        var deferred = $.Deferred();
        this.userRef.once('value', function(snap) {
            deferred.resolve(snap.val());
        });
        return deferred.promise();
    }
};
