define(['utils/cookie'], function(Cookie) {

    /**
     * Constructor for the login check
     * @constructor
     */
    function LoginCheck() {
        this.cookie = Cookie;
    }

    /**
     * Returns the login status of the user
     * @returns {boolean}
     */
    LoginCheck.prototype.isUserLoggedIn = function() {
        return !!this.cookie.get("IDENTITY");
    };

    return new LoginCheck();
});
