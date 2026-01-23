const mockSecureStore = {
    getItemAsync: jest.fn(() => Promise.resolve(null)),
    setItemAsync: jest.fn(() => Promise.resolve()),
    deleteItemAsync: jest.fn(() => Promise.resolve()),
    whenAvailableAsync: jest.fn(() => Promise.resolve(true)),
};

module.exports = mockSecureStore;
