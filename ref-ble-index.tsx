import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  PermissionsAndroid,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

const manager = new BleManager();

export default function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
    }

    return () => {
      manager.destroy();
    };
  }, []);

  const startScan = async () => {
    setDevices([]);
    setIsScanning(true);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error(error);
        Alert.alert('Scan error', error.message);
        setIsScanning(false);
        return;
      }

      if (device?.name?.includes('XIAO_SOS')) {
        setDevices((prev) => {
          if (!prev.find((d) => d.id === device.id)) {
            return [...prev, device];
          }
          return prev;
        });
      }
    });

    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 5000);
  };

  const connectToDevice = async (device: Device) => {
    try {
      const connected = await device.connect();
      await connected.discoverAllServicesAndCharacteristics();

      setConnectedDevice(connected);

      connected.monitorCharacteristicForService(
        '0000180F-0000-1000-8000-00805f9b34fb', // Battery Service
        '00002A19-0000-1000-8000-00805f9b34fb', // Battery Level
        (error, characteristic) => {
          if (error) {
            console.error(error);
            return;
          }

          if (characteristic?.value) {
            const decoded = Buffer.from(characteristic.value, 'base64').toString('ascii');
            setAlertMessage(`⚠ Alert Received: ${decoded}`);
          }
        }
      );

      Alert.alert('Connected', device.name ?? device.id);
    } catch (err) {
      console.error(err);
      Alert.alert('Connection Failed', (err as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title={isScanning ? '🔍 Scanning...' : '🔍 Scan BLE Devices'}
        onPress={startScan}
        disabled={isScanning}
      />

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.deviceItem}>
            <Text>{item.name ?? 'Unnamed'} ({item.id})</Text>
            <Button title="Connect" onPress={() => connectToDevice(item)} />
          </View>
        )}
      />

      {connectedDevice && (
        <Text style={styles.connected}>
          📱 Connected to: {connectedDevice.name ?? connectedDevice.id}
        </Text>
      )}

      {alertMessage && <Text style={styles.alert}>{alertMessage}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  deviceItem: { paddingVertical: 10, borderBottomColor: '#ccc', borderBottomWidth: 1 },
  connected: { marginTop: 20, fontSize: 16, color: 'green' },
  alert: { marginTop: 20, fontSize: 18, color: 'red', fontWeight: 'bold' },
});