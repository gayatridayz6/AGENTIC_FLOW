import '@testing-library/jest-dom';

beforeEach(() => {
  try {
    window.localStorage.clear();
  } catch (e) {
    // storage unavailable; nothing to reset
  }
});
