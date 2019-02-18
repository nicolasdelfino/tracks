module.exports = {
    "extends": "standard",
    rules: {
        "valid-typeof": 0,
        "prefer-promise-reject-errors": 0,
        "no-unused-vars": 0,
        "no-unused-expressions": 0,
        "semi": [2, "always"],
        "comma-dangle": 0,
        "space-before-function-paren": 0
    },
    globals: {
        Tracks: true,
        CustomEvent: true,
        MutationObserver: true,
        Element: true
    }
};