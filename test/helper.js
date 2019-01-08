async function tryCatch(promise, message) {
    try {
        await promise;
        throw null;
    } catch (error) {
        assert(error, "Expected an error but did not get one");
        try {
            assert(
                error.message.startsWith(PREFIX + message),
                "Expected an error starting with '" + PREFIX + message + "' but got '" + error.message + "' instead"
            );
        } catch (err) {
            assert(
                error.message.startsWith(PREFIX2 + message),
                "Expected an error starting with '" + PREFIX + message + "' but got '" + error.message + "' instead"
            );
        }
    }
}


module.exports = { 
    catchRevert: async function(promise) {
        await tryCatch(promise, "revert");
    },
    catchErr: async function(promise) {
        await tryCatch(promise, "");
    }
}