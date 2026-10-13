// Dynamic Expo config on top of app.json: adds the AdMob plugin with the app
// IDs taken from environment variables (set them as EAS environment
// variables, never commit them):
//
//   ADMOB_ANDROID_APP_ID   ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
//   ADMOB_IOS_APP_ID       ca-app-pub-XXXXXXXXXXXXXXXX~ZZZZZZZZZZ
//
// Development builds fall back to Google's sample app IDs. A production build
// without the ID for its platform fails on purpose, so a release can never
// ship with test IDs (which earn nothing).

const SAMPLE_APP_IDS = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
};

function appId(platform, envName) {
  const value = process.env[envName];
  if (value) return value;
  const isProduction = process.env.EAS_BUILD_PROFILE === 'production';
  const buildingThisPlatform = process.env.EAS_BUILD_PLATFORM === platform;
  if (isProduction && buildingThisPlatform) {
    throw new Error(`${envName} is not set. Add it as an EAS environment variable for production.`);
  }
  return SAMPLE_APP_IDS[platform];
}

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: appId('android', 'ADMOB_ANDROID_APP_ID'),
        iosAppId: appId('ios', 'ADMOB_IOS_APP_ID'),
        // Wait for consent (UMP) before Google measurement starts.
        delayAppMeasurementInit: true,
        // Google's SKAdNetwork ID. Add the full list from Google's docs before
        // the first iOS release with ads.
        skAdNetworkItems: ['cstr6suwn9.skadnetwork'],
      },
    ],
  ],
});
