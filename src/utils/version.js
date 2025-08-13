// utils/version.js
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const getAppVersion = () => {
  // Desde app.json/app.config.js
  const version = Constants.expoConfig?.version || Constants.manifest?.version || '0.1.0'; // ← Cambiar aquí
  
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