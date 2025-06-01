import * as Contacts from 'expo-contacts';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';

/**
 * Permission groups for different app features
 */
export const PermissionGroups = {
  LOCATION: 'location',
  BLUETOOTH: 'bluetooth',
  CONTACTS: 'contacts',
  CAMERA: 'camera',
  MICROPHONE: 'microphone',
  STORAGE: 'storage',
  SMS: 'sms',
  CALL: 'call',
  BACKGROUND_LOCATION: 'backgroundLocation',
};

/**
 * Request a group of permissions based on feature needs
 * @param permissionGroup The group of permissions to request
 * @param rationale Optional explanation to show to the user
 * @returns Whether all permissions were granted
 */
export async function requestPermissionGroup(
  permissionGroup: string,
  rationale?: string
): Promise<boolean> {
  try {
    // Default rationale if none provided
    const defaultRationale = 'This permission is required for the safety features of this app to work properly.';
    const permissionRationale = rationale || defaultRationale;

    if (Platform.OS === 'android') {
      return await requestAndroidPermissions(permissionGroup, permissionRationale);
    } else if (Platform.OS === 'ios') {
      return await requestIOSPermissions(permissionGroup);
    }
    
    return false;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
}

/**
 * Request Android permissions based on feature group
 */
async function requestAndroidPermissions(
  permissionGroup: string,
  rationale: string
): Promise<boolean> {
  let permissions: string[] = [];

  switch (permissionGroup) {
    case PermissionGroups.LOCATION:
      permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ];
      break;
    case PermissionGroups.BLUETOOTH:
      permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ];
      break;
    case PermissionGroups.CONTACTS:
      permissions = [PermissionsAndroid.PERMISSIONS.READ_CONTACTS];
      break;
    case PermissionGroups.CAMERA:
      permissions = [PermissionsAndroid.PERMISSIONS.CAMERA];
      break;
    case PermissionGroups.MICROPHONE:
      permissions = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
      break;
    case PermissionGroups.STORAGE:
      permissions = [
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ];
      break;
    case PermissionGroups.SMS:
      permissions = [
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.READ_SMS,
      ];
      break;
    case PermissionGroups.CALL:
      permissions = [PermissionsAndroid.PERMISSIONS.CALL_PHONE];
      break;
    case PermissionGroups.BACKGROUND_LOCATION:
      // Background location requires special handling
      const foregroundGranted = await requestAndroidPermissions(
        PermissionGroups.LOCATION,
        'Location permission is needed for emergency features'
      );
      
      if (!foregroundGranted) {
        return false;
      }
      
      // Request background location separately with additional explanation
      try {
        const backgroundGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
          {
            title: 'Background Location Permission',
            message: 
              'The app needs access to your location in the background for the "Walk With Me" ' +
              'feature to work properly. This allows us to monitor your journey and send alerts ' +
              'if needed, even when the app is not open.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return backgroundGranted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        console.error('Error requesting background location permission:', error);
        return false;
      }
    default:
      return false;
  }

  try {
    const results = await PermissionsAndroid.requestMultiple(permissions);
    return Object.values(results).every(
      status => status === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (error) {
    console.error(`Error requesting ${permissionGroup} permissions:`, error);
    return false;
  }
}

/**
 * Request iOS permissions based on feature group
 */
async function requestIOSPermissions(permissionGroup: string): Promise<boolean> {
  switch (permissionGroup) {
    case PermissionGroups.LOCATION:
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
      
    case PermissionGroups.BACKGROUND_LOCATION:
      const foreground = await Location.requestForegroundPermissionsAsync();
      if (foreground.status !== 'granted') {
        return false;
      }
      const background = await Location.requestBackgroundPermissionsAsync();
      return background.status === 'granted';
      
    case PermissionGroups.CONTACTS:
      const { status: contactStatus } = await Contacts.requestPermissionsAsync();
      return contactStatus === 'granted';
      
    case PermissionGroups.CAMERA:
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      return cameraStatus === 'granted';
      
    case PermissionGroups.MICROPHONE:
      // On iOS, microphone permission is typically requested when needed by the API
      return true;
      
    // For other permissions on iOS, they're typically requested when the feature is used
    default:
      return true;
  }
}

/**
 * Show an alert explaining why a permission is needed and offering to open settings
 */
export function showPermissionExplanation(
  permissionName: string,
  explanation: string
): void {
  Alert.alert(
    `${permissionName} Permission Required`,
    `${explanation}\n\nWould you like to open settings to enable this permission?`,
    [
      {
        text: 'Not Now',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: () => Linking.openSettings(),
      },
    ]
  );
}

/**
 * Check if a permission group is already granted
 */
export async function checkPermissionStatus(
  permissionGroup: string
): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      return await checkAndroidPermissionStatus(permissionGroup);
    } else if (Platform.OS === 'ios') {
      return await checkIOSPermissionStatus(permissionGroup);
    }
    return false;
  } catch (error) {
    console.error('Error checking permission status:', error);
    return false;
  }
}

/**
 * Check Android permission status
 */
async function checkAndroidPermissionStatus(permissionGroup: string): Promise<boolean> {
  let permissions: string[] = [];
  
  switch (permissionGroup) {
    case PermissionGroups.LOCATION:
      permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ];
      break;
    case PermissionGroups.BLUETOOTH:
      permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ];
      break;
    case PermissionGroups.CONTACTS:
      permissions = [PermissionsAndroid.PERMISSIONS.READ_CONTACTS];
      break;
    case PermissionGroups.CAMERA:
      permissions = [PermissionsAndroid.PERMISSIONS.CAMERA];
      break;
    case PermissionGroups.MICROPHONE:
      permissions = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
      break;
    case PermissionGroups.STORAGE:
      permissions = [
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ];
      break;
    case PermissionGroups.SMS:
      permissions = [
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.READ_SMS,
      ];
      break;
    case PermissionGroups.CALL:
      permissions = [PermissionsAndroid.PERMISSIONS.CALL_PHONE];
      break;
    case PermissionGroups.BACKGROUND_LOCATION:
      permissions = [PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION];
      break;
    default:
      return false;
  }
  
  try {
    const results = await Promise.all(
      permissions.map(permission => PermissionsAndroid.check(permission))
    );
    return results.every(result => result === true);
  } catch (error) {
    console.error(`Error checking ${permissionGroup} permission status:`, error);
    return false;
  }
}

/**
 * Check iOS permission status
 */
async function checkIOSPermissionStatus(permissionGroup: string): Promise<boolean> {
  switch (permissionGroup) {
    case PermissionGroups.LOCATION:
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
      
    case PermissionGroups.BACKGROUND_LOCATION:
      const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
      return bgStatus === 'granted';
      
    case PermissionGroups.CONTACTS:
      const { status: contactStatus } = await Contacts.getPermissionsAsync();
      return contactStatus === 'granted';
      
    case PermissionGroups.CAMERA:
      const { status: cameraStatus } = await ImagePicker.getCameraPermissionsAsync();
      return cameraStatus === 'granted';
      
    // For other iOS permissions, we'll assume they're not pre-checkable
    default:
      return true;
  }
}