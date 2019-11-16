const path = require("path");

module.exports = {
    testEnvironment: "node",

    modulePaths: [path.join(__dirname, "src")],

    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },

    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
    testPathIgnorePatterns: ["/node_modules/", "/lib/"],

    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

    collectCoverageFrom: ["src/**/{!(index),}.ts"]
};
