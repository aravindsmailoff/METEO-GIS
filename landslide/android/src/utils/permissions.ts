import { PermissionsAndroid, Platform } from 'react-native';

export async function requestAndroidNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      {
        title: 'Enable Severe Weather Alerts',
        message:
          'Receive instant alerts when a RED or ORANGE IMD district warning is issued for your selected territory.',
        buttonPositive: 'Enable Alerts',
        buttonNegative: 'Not Now',
      }
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}
