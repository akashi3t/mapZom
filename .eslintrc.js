module.exports = {
  "env": {
    "browser": true
  },
  "globals": {
    "google": true,
    "TinyAnimate": true
  },
  "extends": "airbnb-base/legacy",
  "rules": {
    // rules to override from airbnb/legacy
    "object-curly-spacing": ["error", "never"],
    "curly": ["error"],

    // rules from airbnb that we won't be using
    "func-names": 0,
    "no-use-before-define": 0,
    "no-unused-vars": 0,
    "vars-on-top": 0,
    "no-console": 0,
    "no-param-reassign": 0,

    // extra rules not present in airbnb
    "max-len": ["error", 80],
  }
};
