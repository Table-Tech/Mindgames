// Stub out the AsyncStorage native module so stats / persistence tests can
// import their modules without crashing in the Jest environment.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
