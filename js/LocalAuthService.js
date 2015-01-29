function LocalAuthService() {
    this.user = { uid: 'local-user' };
}

LocalAuthService.prototype = {

    signInWith: function() {
        return this.signInAnonymously();
    },

    signInWithPassword: function() {
        return this.signInAnonymously();
    },

    signInAnonymously: function() {
        var deferred = $.Deferred();
        deferred.resolve(this.user);
        return deferred.promise();
    },

    createUser: function() {
        var deferred = $.Deferred();
        deferred.resolve();
        return deferred.promise();
    },

    signUpAndSignIn: function() {
        return this.signInAnonymously();
    },

    currentUser: function() {
        return this.user;
    },

    signOut: function() {
        return;
    },

    onChange: function(callback) {
        callback(this.user);
    }
};
