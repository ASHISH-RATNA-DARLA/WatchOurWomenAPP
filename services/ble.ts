// Mock BLE service that simulates connecting to a physical device
// In a real app, this would use react-native-ble-plx or similar

export async function mockConnectBLE() {
  // Simulate BLE connection delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate successful connection 80% of the time
  const isSuccessful = Math.random() > 0.2;
  
  if (isSuccessful) {
    return 'connected';
  } else {
    throw new Error('Failed to connect to BLE device');
  }
}

export async function mockDisconnectBLE() {
  // Simulate disconnection delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return 'disconnected';
}

export async function mockGetBLEStatus() {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Randomly return connected or disconnected
  return Math.random() > 0.5 ? 'connected' : 'disconnected';
}

export async function simulateButtonPress(pressCount: number) {
  // In a real app, this would be an actual event from the BLE device
  // For now, we just simulate the press behavior
  
  // Validate press count
  if (pressCount < 1 || pressCount > 3) {
    throw new Error('Invalid press count. Must be between 1 and 3.');
  }
  
  return {
    timestamp: new Date().toISOString(),
    pressCount,
    batteryLevel: Math.floor(Math.random() * 100),
  };
}