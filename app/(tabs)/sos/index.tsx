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

// We'll create the BLE manager instance inside the component to ensure it's only initialized when needed

function SOSScreen() {
  // Create BLE manager with useRef to ensure it's only created once
  const managerRef = useRef<BleManager | null>(null);
  
  // Initialize other state variables
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [lastButtonPress, setLastButtonPress] = useState<{
    pressCount: number;
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
    // Create BLE manager instance - using a more reliable initialization approach
    if (!managerRef.current) {
      try {
        // Import the BleManager dynamically to ensure it's fully loaded
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
    
    // Request permissions
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
        -1, // Infinite repeat
        true // Reverse
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
      // Check if BLE manager is initialized
      if (!managerRef.current) {
        // Try to initialize BLE manager again if it failed the first time
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
      addLog('Scanning for BLE devices...');
      
      managerRef.current.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          addLog(`Scan error: ${error.message}`);
          Alert.alert('Scan Error', error.message);
          setIsScanning(false);
          return;
        }
        
        // Filter for devices with names containing "SOS" or "XIAO_SOS"
        // You can adjust this filter based on your actual device name
        if (device?.name && (device.name.includes('SOS') || device.name.includes('XIAO_SOS'))) {
          setDevices(prev => {
            if (!prev.find(d => d.id === device.id)) {
              addLog(`Found device: ${device.name || 'Unnamed'} (${device.id})`);
              return [...prev, device];
            }
            return prev;
          });
        }
      });
      
      // Stop scan after 15 seconds (increased from 10 to give more time to find devices)
      setTimeout(() => {
        if (managerRef.current) {
          managerRef.current.stopDeviceScan();
        }
        setIsScanning(false);
        addLog('Scan completed');
        
        // If no devices found, show message
        if (devices.length === 0) {
          addLog('No SOS devices found');
          Alert.alert(
            'No Devices', 
            'No SOS devices were found. Please make sure your device is powered on and in range.',
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
      // Check if BLE manager is initialized
      if (!managerRef.current) {
        addLog('BLE manager not initialized');
        Alert.alert('BLE Error', 'Bluetooth manager is not initialized. Please restart the app.');
        return;
      }
      
      // Check if device is already connected
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
      
      // Discover services and characteristics with timeout
      const discoverPromise = connected.discoverAllServicesAndCharacteristics();
      const discoverTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Service discovery timeout')), 15000)
      );
      
      await Promise.race([discoverPromise, discoverTimeoutPromise]);
      addLog('Services discovered');
      
      // Set the connected device
      setConnectedDevice(connected);
      
      try {
        // First, try to read the battery level to check if the service is available
        try {
          const batteryCharacteristic = await connected.readCharacteristicForService(
            '0000180F-0000-1000-8000-00805f9b34fb', // Battery Service
            '00002A19-0000-1000-8000-00805f9b34fb'  // Battery Level
          );
          
          if (batteryCharacteristic?.value) {
            const initialBatteryValue = Buffer.from(batteryCharacteristic.value, 'base64')[0];
            setBatteryLevel(initialBatteryValue);
            addLog(`Initial battery level: ${initialBatteryValue}%`);
          }
        } catch (readError) {
          // If reading fails, the service might not be available
          console.warn('Could not read battery level:', readError);
          addLog('Battery service not available, will try alternative services');
        }
        
        // Set up monitoring for button presses
        // Try multiple service/characteristic combinations to increase compatibility
        
        // First try the standard Battery service
        const batteryMonitor = connected.monitorCharacteristicForService(
          '0000180F-0000-1000-8000-00805f9b34fb', // Battery Service
          '00002A19-0000-1000-8000-00805f9b34fb', // Battery Level
          (error, characteristic) => {
            if (error) {
              console.error('Battery monitoring error:', error);
              addLog(`Battery monitoring error: ${error.message}`);
              return;
            }
            
            if (characteristic?.value) {
              try {
                // Decode the characteristic value
                const batteryValue = Buffer.from(characteristic.value, 'base64')[0];
                setBatteryLevel(batteryValue);
                
                // In a real implementation, the device would send a specific value for button presses
                // Here we're detecting button presses based on battery level changes
                if (batteryValue >= 1 && batteryValue <= 3) {
                  handleButtonPress(batteryValue);
                  setAlertMessage(`⚠ Alert Received: ${batteryValue} press(es) detected`);
                }
              } catch (decodeError) {
                console.error('Error decoding battery value:', decodeError);
                addLog(`Error decoding battery data: ${decodeError.message}`);
              }
            }
          }
        );
        
        // Also try a custom SOS service if available (for devices specifically designed for this app)
        // This is a made-up UUID that a real SOS device might use
        try {
          connected.monitorCharacteristicForService(
            '00000001-0000-1000-8000-00805f9b34fb', // Custom SOS Service
            '00000002-0000-1000-8000-00805f9b34fb', // SOS Button Characteristic
            (error, characteristic) => {
              if (error) {
                // Just log this error, don't alert as this is a fallback service
                console.warn('SOS service monitoring error:', error);
                return;
              }
              
              if (characteristic?.value) {
                try {
                  // Decode the characteristic value
                  const buttonValue = Buffer.from(characteristic.value, 'base64')[0];
                  addLog(`SOS button value received: ${buttonValue}`);
                  
                  // Process the button press
                  handleButtonPress(buttonValue);
                  setAlertMessage(`⚠ Emergency Alert: ${buttonValue} press(es) detected`);
                } catch (decodeError) {
                  console.error('Error decoding SOS button value:', decodeError);
                }
              }
            }
          );
          addLog('Monitoring SOS button service');
        } catch (sosMonitorError) {
          // This is expected to fail on devices that don't have this service
          console.warn('SOS service not available:', sosMonitorError);
        }
      } catch (monitorError) {
        console.error('Error setting up monitoring:', monitorError);
        addLog(`Error setting up monitoring: ${monitorError.message}`);
        // Continue even if monitoring setup fails
      }
      
      // Show success message
      Alert.alert(
        'Connected',
        `Connected to ${device.name || 'SOS device'}. The device will now send emergency alerts when the physical button is pressed.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Connection error:', error);
      addLog(`Connection error: ${error.message}`);
      
      // Make sure we clean up any partial connection
      if (connectedDevice) {
        try {
          await connectedDevice.cancelConnection();
        } catch (cleanupError) {
          console.error('Error during connection cleanup:', cleanupError);
        }
        setConnectedDevice(null);
      }
      
      Alert.alert('Connection Failed', error.message);
    }
  };

  // Disconnect from the device
  const disconnectFromDevice = async () => {
    if (connectedDevice) {
      try {
        addLog(`Disconnecting from ${connectedDevice.name || 'device'}...`);
        
        // Create a local reference to the device to avoid race conditions
        const deviceToDisconnect = connectedDevice;
        
        // Reset state variables first to update UI immediately
        setConnectedDevice(null);
        setBatteryLevel(null);
        setAlertMessage('');
        
        // Check if the device is still connected before trying to disconnect
        try {
          const isConnected = await deviceToDisconnect.isConnected();
          if (isConnected) {
            // Set a timeout to ensure the disconnect operation doesn't hang
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
          // Try to disconnect anyway
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
        
        // No need to reset state variables again as we did it at the beginning
        
        // Only show an alert for significant errors
        if (error.message !== 'Disconnect timeout') {
          Alert.alert('Disconnection Error', error.message);
        }
      } finally {
        // Ensure the BLE manager is still scanning for devices if needed
        if (isScanning && managerRef.current) {
          addLog('Resuming scan after disconnection');
          try {
            managerRef.current.startDeviceScan(null, null, (error, device) => {
              // Scan callback logic (simplified to avoid duplication)
              if (!error && device?.name && 
                  (device.name.includes('SOS') || device.name.includes('XIAO_SOS'))) {
                setDevices(prev => {
                  if (!prev.find(d => d.id === device.id)) {
                    return [...prev, device];
                  }
                  return prev;
                });
              }
            });
          } catch (scanError) {
            console.warn('Error resuming scan:', scanError);
          }
        }
      }
    }
  };

  // Add a log entry
  const addLog = (message: string) => {
    try {
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [{ timestamp, message }, ...prev].slice(0, 10));
    } catch (error) {
      console.error('Error adding log:', error);
    }
  };

  // Handle button press from the device
  const handleButtonPress = async (pressCount: number) => {
    try {
      // Update last button press info
      const timestamp = new Date().toISOString();
      setLastButtonPress({
        pressCount,
        timestamp,
      });
      
      // Log the button press
      addLog(`SOS button pressed ${pressCount} time(s)`);
      
      // Determine emergency type based on press count
      let emergencyType = '';
      let phoneNumber = '';
      
      switch (pressCount) {
        case 1:
          emergencyType = 'Police';
          phoneNumber = '100';
          break;
        case 2:
          emergencyType = 'Medical';
          phoneNumber = '108';
          break;
        case 3:
          emergencyType = 'National Emergency';
          phoneNumber = '112';
          break;
        default:
          emergencyType = 'General';
          phoneNumber = '112';
      }
      
      // Show confirmation dialog
      Alert.alert(
        'Emergency Alert Received',
        `The SOS button was pressed ${pressCount} time(s), indicating a ${emergencyType} emergency. Do you want to send an alert?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              addLog(`${emergencyType} emergency cancelled by user`);
            }
          },
          {
            text: 'Send Alert',
            style: 'destructive',
            onPress: async () => {
              // Get current location
              const location = await getLocationAsync();
              
              // Send alert to emergency contact with location
              if (location) {
                sendEmergencyAlert({
                  type: emergencyType,
                  location: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  },
                  timestamp: new Date().toISOString(),
                });
                addLog('Emergency alert sent with location data');
              } else {
                sendEmergencyAlert({
                  type: emergencyType,
                  timestamp: new Date().toISOString(),
                });
                addLog('Emergency alert sent without location data');
              }
              
              // Show confirmation to user
              Alert.alert(
                'Alert Sent',
                `${emergencyType} emergency alert has been sent. Emergency services will be notified.`,
                [{ text: 'OK' }]
              );
            }
          }
        ],
        { cancelable: false }
      );
    } catch (error) {
      addLog(`Error handling button press: ${error.message}`);
      Alert.alert('Error', 'Failed to process emergency button press');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>SOS Device Connection</Text>
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
        <Text style={styles.sectionTitle}>BLE SOS Button</Text>
        
        {connectedDevice ? (
          <Animated.View style={[styles.deviceInfoContainer, animatedStyle]}>
            <View style={styles.deviceHeader}>
              <Bluetooth size={24} color={Colors.primary} />
              <Text style={styles.deviceName}>{connectedDevice.name || 'SOS Device'}</Text>
            </View>
            
            <View style={styles.deviceDetails}>
              <View style={styles.deviceDetail}>
                <Text style={styles.deviceDetailLabel}>Device ID:</Text>
                <Text style={styles.deviceDetailValue}>{connectedDevice.id}</Text>
              </View>
              
              {batteryLevel !== null && (
                <View style={styles.deviceDetail}>
                  <Text style={styles.deviceDetailLabel}>Battery:</Text>
                  <View style={styles.batteryContainer}>
                    <Battery size={16} color={
                      batteryLevel > 50 ? Colors.success : 
                      batteryLevel > 20 ? Colors.warning : Colors.error
                    } />
                    <Text style={styles.deviceDetailValue}>{batteryLevel}%</Text>
                  </View>
                </View>
              )}
              
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
              Connect to a physical SOS button device via Bluetooth to enable emergency alerts.
            </Text>
            
            <View style={styles.pressInstructions}>
              <Text style={styles.pressInstruction}>• Press 1x: Police (100)</Text>
              <Text style={styles.pressInstruction}>• Press 2x: Medical (108)</Text>
              <Text style={styles.pressInstruction}>• Press 3x: National Emergency (112)</Text>
            </View>
            
            {isScanning ? (
              <View style={styles.scanningContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.scanningText}>Scanning for devices...</Text>
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
                <Text style={styles.deviceListTitle}>Available Devices:</Text>
                <FlatList
                  data={devices}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.deviceItem}>
                      <View style={styles.deviceItemInfo}>
                        <Text style={styles.deviceItemName}>{item.name || 'Unnamed Device'}</Text>
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
          <Text style={styles.lastActionTitle}>Last Button Press</Text>
          <Text style={styles.lastActionText}>
            Pressed {lastButtonPress.pressCount} time(s) at {new Date(lastButtonPress.timestamp).toLocaleTimeString()}
          </Text>
        </View>
      )}

      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>Activity Log</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logEntry}>
            [{log.timestamp}] {log.message}
          </Text>
        ))}
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
    marginBottom: 8,
  },
  deviceDetailLabel: {
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
  },
  deviceDetailValue: {
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disconnectButton: {
    backgroundColor: Colors.error,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  disconnectText: {
    fontFamily: 'Inter-Medium',
    color: Colors.white,
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
    marginBottom: 16,
  },
  pressInstructions: {
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  pressInstruction: {
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  scanningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  scanningText: {
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
    marginTop: 8,
  },
  scanButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  scanButtonText: {
    fontFamily: 'Inter-Medium',
    color: Colors.white,
    marginLeft: 8,
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
    marginBottom: 4,
  },
  lastActionText: {
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
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
    marginBottom: 8,
  },
  logEntry: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  reconnectButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  reconnectText: {
    fontFamily: 'Inter-Medium',
    color: Colors.white,
  },
  // New styles for BLE device list
  deviceList: {
    marginTop: 16,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
  },
  deviceListTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  flatList: {
    maxHeight: 200,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  deviceItemInfo: {
    flex: 1,
  },
  deviceItemName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  deviceItemId: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  connectButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  connectButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.white,
  },
  // Alert message container
  alertMessageContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: Colors.errorLight,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  alertMessageText: {
    fontFamily: 'Inter-Medium',
    color: Colors.error,
  },
});