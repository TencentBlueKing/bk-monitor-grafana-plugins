/*
 * ⚠️⚠️⚠️ THIS FILE WAS SCAFFOLDED BY `@grafana/create-plugin`. DO NOT EDIT THIS FILE DIRECTLY. ⚠️⚠️⚠️
 *
 * In order to extend the configuration follow the steps in
 * https://grafana.com/developers/plugin-tools/create-a-plugin/extend-a-plugin/extend-configurations#extend-the-jest-config
 */

import '@testing-library/jest-dom';

// https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
Object.defineProperty(global, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

HTMLCanvasElement.prototype.getContext = () => {};
