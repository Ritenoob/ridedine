import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import React from 'react';

globalThis.React = React;

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Extend Vitest expect with jest-dom matchers
expect.extend({});
