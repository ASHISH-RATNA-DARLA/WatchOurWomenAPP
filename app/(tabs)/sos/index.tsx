  import Colors from '@/constants/Colors';
import { mockConnectBLE, mockDisconnectBLE, mockGetBLEStatus, simulateButtonPress } from '@/services/ble';
import { sendEmergencyAlert } from '@/services/emergency';
import { getLocationAsync } from '@/services/location';
import { Battery, Bluetooth, RefreshCw } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SOSScreen() {
  const [bleStatus, setBleStatus] = useState('disconnected');
  const [isScanning, setIsScanning] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [lastButtonPress, setLastButtonPress] = useState(null);
  const [logs, setLogs] = useState([]);
  
  const pulseAnim = useSharedValue(1);
  
  // Animation for connected status
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseAnim.value }],
    };
  });

  // Check for BLE device on mount
  useEffect(() => {
    checkBLEStatus();
    
    // Clean up on unmount
    return () => {
      if (bleStatus === 'connected') {
        disconnectBLE();
      }
    };
  }, []);

  // Start animation when connected
  useEffect(() => {
    if (bleStatus === 'connected') {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1, // Infinite repeat
        true // Reverse
      );
      
      // Simulate receiving button presses from the device
      const interval = setInterval(async () => {
        if (bleStatus === 'connected') {
          try {
            // Randomly simulate a button press (1-3 presses)
            const pressCount = Math.floor(Math.random() * 3) + 1;
            const buttonData = await simulateButtonPress(pressCount);
            handleDeviceButtonPress(buttonData);
          } catch (error) {
            console.log('Error simulating button press:', error);
          }
        }
      }, 15000); // Simulate a press every 15 seconds
      
      return () => clearInterval(interval);
    } else {
      pulseAnim.value = 1;
    }
  }, [bleStatus]);

  const checkBLEStatus = async () => {
    try {
      addLog('Checking BLE device status...');
      const status = await mockGetBLEStatus();
      setBleStatus(status);
      addLog(`BLE device status: ${status}`);
      
      if (status === 'connected') {
        // Get mock device info
        setDeviceInfo({
          name: 'SOS Emergency Button',
          id: 'sos-device-001',
          batteryLevel: Math.floor(Math.random() * 100),
          lastSeen: new Date().toISOString(),
        });
      }
    } catch (error) {
      addLog(`Error checking BLE status: ${error.message}`);
    }
  };

  const scanForDevices = async () => {
    try {
      setIsScanning(true);
      addLog('Scanning for BLE devices...');
      
      // Simulate scanning delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate finding a device
      const mockDevice = {
        name: 'SOS Emergency Button',
        id: 'sos-device-001',
        rssi: -65,
        batteryLevel: Math.floor(Math.random() * 100),
      };
      
      addLog(`Found device: ${mockDevice.name}`);
      setIsScanning(false);
      
      // Ask user if they want to connect
      Alert.alert(
        'Device Found',
        `Do you want to connect to "${mockDevice.name}"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              addLog('Connection cancelled by user');
            }
          },
          {
            text: 'Connect',
            onPress: () => connectBLE()
          }
        ]
      );
    } catch (error) {
      setIsScanning(false);
      addLog(`Scanning error: ${error.message}`);
      Alert.alert('Scanning Error', error.message);
    }
  };

  const connectBLE = async () => {
    try {
      setBleStatus('connecting');
      addLog('Connecting to SOS device...');
      
      const status = await mockConnectBLE();
      setBleStatus(status);
      
      if (status === 'connected') {
        // Get mock device info
        const mockDeviceInfo = {
          name: 'SOS Emergency Button',
          id: 'sos-device-001',
          batteryLevel: Math.floor(Math.random() * 100),
          lastSeen: new Date().toISOString(),
        };
        
        setDeviceInfo(mockDeviceInfo);
        addLog(`Connected to ${mockDeviceInfo.name}`);
        
        // Show success message
        Alert.alert(
          'Connection Successful',
          `Connected to SOS device. The device will now send emergency alerts when the physical button is pressed.`,
          [{ text: 'OK' }]
        );
      } else {
        addLog('Failed to connect to SOS device');
      }
    } catch (error) {
      addLog(`Connection error: ${error.message}`);
      setBleStatus('error');
      Alert.alert('Connection Error', error.message);
    }
  };

  const disconnectBLE = async () => {
    try {
      addLog('Disconnecting from SOS device...');
      await mockDisconnectBLE();
      setBleStatus('disconnected');
      setDeviceInfo(null);
      addLog('Disconnected from SOS device');
    } catch (error) {
      addLog(`Disconnection error: ${error.message}`);
    }
  };

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [{ timestamp, message }, ...prev].slice(0, 10));
  };

  const handleDeviceButtonPress = async (buttonData) => {
    try {
      const { pressCount, batteryLevel, timestamp } = buttonData;
      
      // Update device info with new battery level
      if (deviceInfo) {
        setDeviceInfo({
          ...deviceInfo,
          batteryLevel,
          lastSeen: timestamp,
        });
      }
      
      // Update last button press info
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
          { backgroundColor: bleStatus === 'connected' ? Colors.success : Colors.error }
        ]}>
          <Text style={styles.statusText}>
            {bleStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      <View style={styles.deviceSection}>
        <Text style={styles.sectionTitle}>BLE SOS Button</Text>
        
        {bleStatus === 'connected' && deviceInfo ? (
          <Animated.View style={[styles.deviceInfoContainer, animatedStyle]}>
            <View style={styles.deviceHeader}>
              <Bluetooth size={24} color={Colors.primary} />
              <Text style={styles.deviceName}>{deviceInfo.name}</Text>
            </View>
            
            <View style={styles.deviceDetails}>
              <View style={styles.deviceDetail}>
                <Text style={styles.deviceDetailLabel}>Device ID:</Text>
                <Text style={styles.deviceDetailValue}>{deviceInfo.id}</Text>
              </View>
              
              <View style={styles.deviceDetail}>
                <Text style={styles.deviceDetailLabel}>Battery:</Text>
                <View style={styles.batteryContainer}>
                  <Battery size={16} color={
                    deviceInfo.batteryLevel > 50 ? Colors.success : 
                    deviceInfo.batteryLevel > 20 ? Colors.warning : Colors.error
                  } />
                  <Text style={styles.deviceDetailValue}>{deviceInfo.batteryLevel}%</Text>
                </View>
              </View>
              
              <View style={styles.deviceDetail}>
                <Text style={styles.deviceDetailLabel}>Last Seen:</Text>
                <Text style={styles.deviceDetailValue}>
                  {new Date(deviceInfo.lastSeen).toLocaleTimeString()}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.disconnectButton}
              onPress={disconnectBLE}
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
                onPress={scanForDevices}
                disabled={bleStatus === 'connecting'}
              >
                <RefreshCw size={20} color={Colors.white} />
                <Text style={styles.scanButtonText}>Scan for SOS Devices</Text>
              </TouchableOpacity>
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

      {bleStatus !== 'connected' && bleStatus !== 'connecting' && !isScanning && (
        <TouchableOpacity style={styles.reconnectButton} onPress={connectBLE}>
          <Text style={styles.reconnectText}>
            Connect to SOS Device
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

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