import Colors from '@/constants/Colors';
import { sendEmergencyAlert } from '@/services/emergency';
import { getLocationAsync } from '@/services/location';
import { Buffer } from 'buffer';
import { Battery, Bluetooth, RefreshCw } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// BLE Service and Characteristic UUIDs - ALIGNED WITH YOUR BLE DEVICE
const SERVICE_UUID = '0000180F-0000-1000-8000-00805f9b34fb';        // Battery Service
const CHARACTERISTIC_UUID = '00002A19-0000-1000-8000-00805f9b34fb';  // Battery Level Characteristic

function SOSScreen() {
  // Create BLE manager with useRef to ensure it's only created once
  const managerRef = useRef<BleManager | null>(null);
  
  // Initialize state variables
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [lastButtonPress, setLastButtonPress] = useState<{
    pressCount: number;
    emergencyCode: string;
    timestamp: string;
  } | null>(null);
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string }>>([]);
  
  const pulseAnim = useSharedValue(1);
  
  // Animation for connected status
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseAnim.value }],
    };
  });

  // Initialize BLE manager and request permissions on mount
  useEffect(() => {
    if (!managerRef.current) {
      try {
        const BleManagerModule = require('react-native-ble-plx').BleManager;
        managerRef.current = new BleManagerModule();
        addLog('BLE manager initialized successfully');
      } catch (error) {
        console.error('Failed to initialize BLE manager:', error);
        addLog(`BLE initialization error: ${error.message || 'Unknown error'}`);
        Alert.alert(
          'BLE Error',
          'Failed to initialize Bluetooth. Please ensure Bluetooth is enabled on your device.',
          [{ text: 'OK' }]
        );
      }
    }
    
    requestPermissions();
    
    // Clean up on unmount
    return () => {
      if (connectedDevice) {
        disconnectFromDevice();
      }
      
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
      }
    };
  }, []);

  // Start animation when connected
  useEffect(() => {
    if (connectedDevice) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      pulseAnim.value = 1;
    }
  }, [connectedDevice]);

  // Request necessary permissions for BLE
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );
        
        if (allGranted) {
          addLog('All permissions granted');
        } else {
          addLog('Some permissions were denied');
          Alert.alert(
            'Permissions Required',
            'Bluetooth and location permissions are required for SOS device connection.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        addLog(`Error requesting permissions: ${error.message}`);
      }
    }
  };

  // Start scanning for BLE devices
  const startScan = async () => {
    try {
      if (!managerRef.current) {
        try {
          const BleManagerModule = require('react-native-ble-plx').BleManager;
          managerRef.current = new BleManagerModule();
          addLog('BLE manager initialized on demand');
        } catch (initError) {
          addLog('BLE manager initialization failed');
          Alert.alert(
            'BLE Error', 
            'Bluetooth manager could not be initialized. Please ensure Bluetooth is enabled and restart the app.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
      
      // Check if Bluetooth is powered on
      const state = await managerRef.current.state();
      if (state !== 'PoweredOn') {
        addLog(`Bluetooth is not powered on (state: ${state})`);
        Alert.alert(
          'Bluetooth Not Ready', 
          'Please enable Bluetooth on your device and try again.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      setDevices([]);
      setIsScanning(true);
      addLog('Scanning for SOS devices...');
      
      managerRef.current.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          addLog(`Scan error: ${error.message}`);
          Alert.alert('Scan Error', error.message);
          setIsScanning(false);
          return;
        }
        
        // Filter for devices with names containing "SOS" or "XIAO_SOS" (matching your BLE device name)
        if (device?.name && (device.name.includes('SOS') || device.name.includes('XIAO_SOS'))) {
          setDevices(prev => {
            if (!prev.find(d => d.id === device.id)) {
              addLog(`Found SOS device: ${device.name} (${device.id})`);
              return [...prev, device];
            }
            return prev;
          });
        }
      });
      
      // Stop scan after 15 seconds
      setTimeout(() => {
        if (managerRef.current) {
          managerRef.current.stopDeviceScan();
        }
        setIsScanning(false);
        addLog('Scan completed');
        
        if (devices.length === 0) {
          addLog('No SOS devices found');
          Alert.alert(
            'No Devices', 
            'No SOS devices were found. Please make sure your XIAO_SOS device is powered on and in range.',
            [{ text: 'OK' }]
          );
        }
      }, 15000);
    } catch (error) {
      setIsScanning(false);
      addLog(`Error starting scan: ${error.message}`);
      Alert.alert('Scan Error', error.message);
    }
  };

  // Connect to a BLE device
  const connectToDevice = async (device: Device) => {
    try {
      if (!managerRef.current) {
        addLog('BLE manager not initialized');
        Alert.alert('BLE Error', 'Bluetooth manager is not initialized. Please restart the app.');
        return;
      }
      
      if (connectedDevice && connectedDevice.id === device.id) {
        addLog(`Already connected to ${device.name || 'device'}`);
        Alert.alert('Already Connected', 'You are already connected to this device.');
        return;
      }
      
      // Disconnect from any existing device first
      if (connectedDevice) {
        addLog('Disconnecting from previous device before connecting to new one');
        await disconnectFromDevice();
      }
      
      addLog(`Connecting to ${device.name || 'device'} (${device.id})...`);
      
      // Connect to the device with timeout
      const connectPromise = device.connect({ timeout: 15000 });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 15000)
      );
      
      const connected = await Promise.race([connectPromise, timeoutPromise]) as Device;
      addLog('Device connected, discovering services...');
      
      // Discover services and characteristics
      const discoverPromise = connected.discoverAllServicesAndCharacteristics();
      const discoverTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Service discovery timeout')), 15000)
      );
      
      await Promise.race([discoverPromise, discoverTimeoutPromise]);
      addLog('Services discovered successfully');
      
      // Set the connected device
      setConnectedDevice(connected);
      
      // Set up monitoring for the exact service and characteristic used by your BLE device
      try {
        addLog(`Monitoring characteristic: ${CHARACTERISTIC_UUID} on service: ${SERVICE_UUID}`);
        
        connected.monitorCharacteristicForService(
          SERVICE_UUID,
          CHARACTERISTIC_UUID,
          (error, characteristic) => {
            if (error) {
              console.error('Monitoring error:', error);
              addLog(`Monitoring error: ${error.message}`);
              return;
            }
            
            if (characteristic?.value) {
              try {
                // Decode the characteristic value as a string (matching your BLE device's format)
                const decodedString = Buffer.from(characteristic.value, 'base64').toString('ascii');
                addLog(`Received emergency code: ${decodedString}`);
                
                // Handle the specific emergency codes sent by your BLE device
                switch (decodedString) {
                  case "100":
                    handleButtonPress(1, "100", "Police Emergency");
                    break;
                  case "108":
                    handleButtonPress(2, "108", "Medical Emergency");
                    break;
                  case "112":
                    handleButtonPress(3, "112", "National Emergency");
                    break;
                  case "Multiple Presses":
                    handleButtonPress(4, "Multiple", "Multiple Button Presses");
                    break;
                  default:
                    // Handle any other codes that might be sent
                    addLog(`Unknown emergency code received: ${decodedString}`);
                    handleButtonPress(0, decodedString, "Unknown Emergency");
                }
              } catch (decodeError) {
                console.error('Error decoding emergency code:', decodeError);
                addLog(`Error decoding emergency data: ${decodeError.message}`);
              }
            }
          }
        );
        
        addLog('Successfully set up monitoring for SOS button presses');
        
        // Show success message
        Alert.alert(
          'Connected Successfully',
          `Connected to ${device.name || 'SOS device'}. The device will now send emergency alerts when the physical button is pressed.\n\n• 1 press: Police (100)\n• 2 presses: Medical (108)\n• 3 presses: National Emergency (112)`,
          [{ text: 'OK' }]
        );
        
      } catch (monitorError) {
        console.error('Error setting up monitoring:', monitorError);
        addLog(`Error setting up monitoring: ${monitorError.message}`);
        Alert.alert(
          'Monitoring Error',
          'Connected to device but failed to set up emergency monitoring. Please try reconnecting.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('Connection error:', error);
      addLog(`Connection error: ${error.message}`);
      
      // Clean up any partial connection
      if (connectedDevice) {
        try {
          await connectedDevice.cancelConnection();
        } catch (cleanupError) {
          console.error('Error during connection cleanup:', cleanupError);
        }
        setConnectedDevice(null);
      }
      
      Alert.alert('Connection Failed', `Failed to connect to ${device.name || 'SOS device'}.\n\n${error.message}`);
    }
  };

  // Disconnect from the device
  const disconnectFromDevice = async () => {
    if (connectedDevice) {
      try {
        addLog(`Disconnecting from ${connectedDevice.name || 'device'}...`);
        
        const deviceToDisconnect = connectedDevice;
        
        // Reset state variables first
        setConnectedDevice(null);
        setAlertMessage('');
        setLastButtonPress(null);
        
        // Check if the device is still connected before trying to disconnect
        try {
          const isConnected = await deviceToDisconnect.isConnected();
          if (isConnected) {
            const disconnectPromise = deviceToDisconnect.cancelConnection();
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Disconnect timeout')), 5000)
            );
            
            await Promise.race([disconnectPromise, timeoutPromise]);
            addLog('Device disconnected successfully');
          } else {
            addLog('Device was already disconnected');
          }
        } catch (connectionCheckError) {
          console.warn('Error checking connection status:', connectionCheckError);
          try {
            await deviceToDisconnect.cancelConnection();
          } catch (forcedDisconnectError) {
            console.warn('Forced disconnect error:', forcedDisconnectError);
          }
          addLog('Forced device disconnection');
        }
      } catch (error) {
        addLog(`Disconnection error: ${error.message}`);
        console.error('Disconnection error:', error);
        
        if (error.message !== 'Disconnect timeout') {
          Alert.alert('Disconnection Error', error.message);
        }
      }
    }
  };

  // Add a log entry
  const addLog = (message: string) => {
    try {
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [{ timestamp, message }, ...prev].slice(0, 15)); // Increased log history
    } catch (error) {
      console.error('Error adding log:', error);
    }
  };

  // Handle button press from the device - ALIGNED WITH YOUR BLE DEVICE CODES
  const handleButtonPress = async (pressCount: number, emergencyCode: string, emergencyType: string) => {
    try {
      // Update last button press info
      const timestamp = new Date().toISOString();
      setLastButtonPress({
        pressCount,
        emergencyCode,
        timestamp,
      });
      
      // Set alert message for UI
      setAlertMessage(`🚨 ${emergencyType} Alert Received (Code: ${emergencyCode})`);
      
      // Log the button press
      addLog(`SOS Alert: ${emergencyType} (${emergencyCode}) - ${pressCount} press(es)`);
      
      // Map emergency codes to appropriate services
      let serviceType = '';
      let phoneNumber = '';
      
      switch (emergencyCode) {
        case "100":
          serviceType = 'Police';
          phoneNumber = '100';
          break;
        case "108":
          serviceType = 'Medical';
          phoneNumber = '108';
          break;
        case "112":
          serviceType = 'National Emergency';
          phoneNumber = '112';
          break;
        default:
          serviceType = 'General Emergency';
          phoneNumber = '112';
      }
      
      // Show confirmation dialog
      Alert.alert(
        'Emergency Alert Detected',
        `SOS Device sent: ${emergencyType} (Code: ${emergencyCode})\n\nThis indicates a ${serviceType} emergency. Do you want to send the alert to emergency services?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              addLog(`${serviceType} emergency alert cancelled by user`);
              setAlertMessage(`⚠️ ${emergencyType} alert cancelled`);
            }
          },
          {
            text: 'Send Alert',
            style: 'destructive',
            onPress: async () => {
              try {
                // Get current location
                addLog('Getting current location for emergency alert...');
                const location = await getLocationAsync();
                
                // Prepare alert data
                const alertData = {
                  type: serviceType,
                  emergencyCode: emergencyCode,
                  phoneNumber: phoneNumber,
                  timestamp: new Date().toISOString(),
                  deviceId: connectedDevice?.id,
                  deviceName: connectedDevice?.name || 'XIAO_SOS',
                };
                
                // Add location if available
                if (location) {
                  alertData.location = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  };
                  addLog('Emergency alert prepared with location data');
                } else {
                  addLog('Emergency alert prepared without location data');
                }
                
                // Send emergency alert
                await sendEmergencyAlert(alertData);
                addLog(`${serviceType} emergency alert sent successfully`);
                
                // Update UI
                setAlertMessage(`✅ ${emergencyType} alert sent to emergency services`);
                
                // Show confirmation
                Alert.alert(
                  'Alert Sent Successfully',
                  `${serviceType} emergency alert has been sent to emergency services (${phoneNumber}).\n\nEmergency responders will be notified of your location and situation.`,
                  [{ text: 'OK' }]
                );
              } catch (alertError) {
                console.error('Error sending emergency alert:', alertError);
                addLog(`Error sending emergency alert: ${alertError.message}`);
                
                Alert.alert(
                  'Alert Error',
                  `Failed to send emergency alert: ${alertError.message}\n\nPlease manually call ${phoneNumber} for immediate assistance.`,
                  [{ text: 'OK' }]
                );
              }
            }
          }
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error handling button press:', error);
      addLog(`Error handling SOS button press: ${error.message}`);
      Alert.alert('Error', 'Failed to process emergency button press. Please manually call emergency services if needed.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>SOS Device Monitor</Text>
        <View style={[
          styles.statusIndicator, 
          { backgroundColor: connectedDevice ? Colors.success : Colors.error }
        ]}>
          <Text style={styles.statusText}>
            {connectedDevice ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      <View style={styles.deviceSection}>
        <Text style={styles.sectionTitle}>XIAO ESP32C3 SOS Button</Text>
        
        {connectedDevice ? (
          <Animated.View style={[styles.deviceInfoContainer, animatedStyle]}>
            <View style={styles.deviceHeader}>
              <Bluetooth size={24} color={Colors.primary} />
              <Text style={styles.deviceName}>{connectedDevice.name || 'XIAO_SOS'}</Text>
            </View>
            
            <View style={styles.deviceDetails}>
              <View style={styles.deviceDetail}>
                <Text style={styles.deviceDetailLabel}>Device ID:</Text>
                <Text style={styles.deviceDetailValue}>{connectedDevice.id}</Text>
              </View>
              
              <View style={styles.deviceDetail}>
                <Text style={styles.deviceDetailLabel}>Service:</Text>
                <Text style={styles.deviceDetailValue}>Battery Service (0x180F)</Text>
              </View>
              
              <View style={styles.deviceDetail}>
                <Text style={styles.deviceDetailLabel}>Status:</Text>
                <Text style={[styles.deviceDetailValue, { color: Colors.success }]}>
                  Monitoring Emergency Signals
                </Text>
              </View>
              
              {alertMessage && (
                <View style={styles.alertMessageContainer}>
                  <Text style={styles.alertMessageText}>{alertMessage}</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.disconnectButton}
              onPress={disconnectFromDevice}
            >
              <Text style={styles.disconnectText}>Disconnect Device</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.noDeviceContainer}>
            <Text style={styles.instruction}>
              Connect to your XIAO ESP32C3 SOS button device via Bluetooth to enable emergency monitoring.
            </Text>
            
            <View style={styles.pressInstructions}>
              <Text style={styles.pressInstructionTitle}>Emergency Codes:</Text>
              <Text style={styles.pressInstruction}>• 1 Press → Police (Code: 100)</Text>
              <Text style={styles.pressInstruction}>• 2 Presses → Medical (Code: 108)</Text>
              <Text style={styles.pressInstruction}>• 3 Presses → National Emergency (Code: 112)</Text>
            </View>
            
            {isScanning ? (
              <View style={styles.scanningContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.scanningText}>Scanning for XIAO_SOS devices...</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={startScan}
                disabled={isScanning}
              >
                <RefreshCw size={20} color={Colors.white} />
                <Text style={styles.scanButtonText}>Scan for SOS Devices</Text>
              </TouchableOpacity>
            )}
            
            {devices.length > 0 && (
              <View style={styles.deviceList}>
                <Text style={styles.deviceListTitle}>Available SOS Devices:</Text>
                <FlatList
                  data={devices}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.deviceItem}>
                      <View style={styles.deviceItemInfo}>
                        <Text style={styles.deviceItemName}>{item.name || 'XIAO_SOS Device'}</Text>
                        <Text style={styles.deviceItemId}>ID: {item.id}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.connectButton}
                        onPress={() => connectToDevice(item)}
                      >
                        <Text style={styles.connectButtonText}>Connect</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  style={styles.flatList}
                />
              </View>
            )}
          </View>
        )}
      </View>
      
      {lastButtonPress && (
        <View style={styles.lastActionContainer}>
          <Text style={styles.lastActionTitle}>Last Emergency Signal</Text>
          <Text style={styles.lastActionText}>
            Code: {lastButtonPress.emergencyCode} ({lastButtonPress.pressCount} press{lastButtonPress.pressCount !== 1 ? 'es' : ''})
          </Text>
          <Text style={styles.lastActionTime}>
            Received: {new Date(lastButtonPress.timestamp).toLocaleString()}
          </Text>
        </View>
      )}

      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>Activity Log</Text>
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <Text key={index} style={styles.logEntry}>
              [{log.timestamp}] {log.message}
            </Text>
          ))
        ) : (
          <Text style={styles.noLogsText}>No activity yet...</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

export default SOSScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.white,
  },
  deviceSection: {
    padding: 16,
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  deviceInfoContainer: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deviceName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
    marginLeft: 8,
  },
  deviceDetails: {
    marginBottom: 16,
  },
  deviceDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  deviceDetailLabel: {
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
    fontSize: 14,
  },
  deviceDetailValue: {
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    fontSize: 14,
  },
  disconnectButton: {
    backgroundColor: Colors.error,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disconnectText: {
    fontFamily: 'Inter-Medium',
    color: Colors.white,
    fontSize: 16,
  },
  noDeviceContainer: {
    alignItems: 'center',
    padding: 16,
  },
  instruction: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  pressInstructions: {
    marginBottom: 24,
    alignSelf: 'flex-start',
    width: '100%',
  },
  pressInstructionTitle: {
    fontFamily: 'Inter-Bold',
    color: Colors.textPrimary,
    marginBottom: 12,
    fontSize: 16,
  },
  pressInstruction: {
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    marginBottom: 8,
    fontSize: 14,
  },
  scanningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  scanningText: {
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
    marginTop: 12,
    fontSize: 16,
  },
  scanButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    marginTop: 12,
  },
  scanButtonText: {
    fontFamily: 'Inter-Medium',
    color: Colors.white,
    marginLeft: 8,
    fontSize: 16,
  },
  lastActionContainer: {
    backgroundColor: Colors.primaryLight,
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  lastActionTitle: {
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
    marginBottom: 6,
    fontSize: 16,
  },
  lastActionText: {
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    fontSize: 14,
  },
  lastActionTime: {
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  logContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  logEntry: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
    lineHeight: 16,
  },
  noLogsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
  deviceList: {
    marginTop: 20,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
  },
  deviceListTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color