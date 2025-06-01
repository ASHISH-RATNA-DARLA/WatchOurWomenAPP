# App Permissions Documentation

This document explains the permissions used by the Women's Safety App and why they are necessary for the app's functionality.

## Android Permissions

| Permission | Purpose | User Benefit |
|------------|---------|--------------|
| `INTERNET` | Allows the app to connect to the internet | Enables map services, emergency alerts, and communication features |
| `BLUETOOTH`, `BLUETOOTH_ADMIN`, `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT` | Allows the app to connect to Bluetooth devices | Enables connection to SOS emergency devices and wearables |
| `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION` | Allows the app to access your location | Enables sending your precise location in emergency alerts and navigation features |
| `ACCESS_BACKGROUND_LOCATION` | Allows the app to access your location even when not in use | Powers the "Walk With Me" feature to monitor your journey in the background |
| `BATTERY_STATS` | Allows the app to monitor battery usage | Ensures emergency features work even in low battery situations |
| `ACCESS_NETWORK_STATE` | Allows the app to check network connectivity | Enables offline mode when no connection is available |
| `WRITE_EXTERNAL_STORAGE`, `READ_EXTERNAL_STORAGE` | Allows the app to read and write to device storage | Enables saving emergency evidence like photos and recordings |
| `CALL_PHONE` | Allows the app to initiate phone calls | Enables quick SOS calls to emergency contacts without manual dialing |
| `SEND_SMS`, `RECEIVE_SMS`, `READ_SMS` | Allows the app to send and receive SMS messages | Enables sending emergency SMS alerts with your location to trusted contacts |
| `CAMERA` | Allows the app to take pictures and videos | Enables capturing evidence in emergency situations |
| `RECORD_AUDIO` | Allows the app to record audio | Enables recording sound evidence during incidents |
| `READ_CONTACTS` | Allows the app to read your contacts | Makes it easy to select emergency contacts from your address book |

## iOS Permissions

| Permission | Purpose | User Benefit |
|------------|---------|--------------|
| `NSBluetoothAlwaysUsageDescription`, `NSBluetoothPeripheralUsageDescription` | Allows the app to connect to Bluetooth devices | Enables connection to SOS emergency devices and wearables |
| `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`, `NSLocationAlwaysUsageDescription` | Allows the app to access your location | Enables sending your precise location in emergency alerts and powers the "Walk With Me" feature |
| `NSCameraUsageDescription` | Allows the app to use the camera | Enables capturing photo and video evidence in emergency situations |
| `NSMicrophoneUsageDescription` | Allows the app to use the microphone | Enables recording audio evidence during incidents |
| `NSContactsUsageDescription` | Allows the app to access your contacts | Makes it easy to select emergency contacts from your address book |
| `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription` | Allows the app to access and save to your photo library | Enables saving emergency evidence |

## Privacy Considerations

We take your privacy seriously. Here's how we protect your data:

1. **Location data** is only shared when you explicitly trigger an emergency alert or activate the "Walk With Me" feature
2. **Contacts** are only accessed when you choose to add emergency contacts
3. **Camera and microphone** are only activated when you manually trigger evidence collection
4. **SMS and call features** are only used when you trigger an emergency alert
5. **All sensitive data** is stored locally on your device and is not shared with third parties

You can review and revoke any permission at any time through your device's settings.

## Permission Request Timing

The app will request permissions at appropriate times:
- Location permissions when you first use navigation or "Walk With Me" features
- Bluetooth permissions when connecting to emergency devices
- Camera/microphone permissions when using evidence collection features
- Contact permissions when adding emergency contacts
- SMS/call permissions when setting up emergency alerts

## Questions or Concerns

If you have any questions or concerns about how permissions are used in the app, please contact us at support@womensafetyapp.com.