/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
      tsconfig: { jsx: "react-jsx" }
    }],
  },
  moduleFileExtensions: ["ts","tsx","js","jsx"],
  testMatch: ["**/__tests__/**/*.test.(ts|tsx|js|jsx)"],
  moduleNameMapper: { "\\.(css|less|scss|sass)$": "identity-obj-proxy" },
};