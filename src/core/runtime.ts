import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * True when running inside the Expo Go app (scan-the-QR testing). Expo Go
 * doesn't include custom native modules such as React Native Firebase, so
 * features that need them are switched off there.
 */
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
