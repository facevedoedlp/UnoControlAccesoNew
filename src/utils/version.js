// utils/version.js
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const getAppVersion = () => {
  // Desde app.json/app.config.js
  const version = Constants.expoConfig?.version || Constants.manifest?.version || '0.0.0';
  
  // Build number/version code
  const buildNumber = Platform.OS === 'ios' 
    ? Constants.expoConfig?.ios?.buildNumber || '1'
    : Constants.expoConfig?.android?.versionCode || 1;

  return {
    version: version,
    buildNumber: buildNumber,
    fullVersion: `${version} (${buildNumber})`,
    platform: Platform.OS
  };
};

export const getBuildInfo = () => {
  const appVersion = getAppVersion();
  
  return {
    ...appVersion,
    buildDate: Constants.expoConfig?.extra?.buildDate || 'Unknown',
    environment: Constants.expoConfig?.extra?.environment || 'development',
    expoVersion: Constants.expoVersion,
    deviceInfo: {
      platform: Platform.OS,
      version: Platform.Version
    }
  };
};

export const getVersionString = () => {
  const { version, buildNumber, platform } = getAppVersion();
  return `v${version} (${buildNumber}) - ${platform.toUpperCase()}`;
};