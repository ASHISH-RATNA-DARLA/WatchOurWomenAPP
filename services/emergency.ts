// Mock emergency services

export function callEmergencyNumber(phoneNumber: string) {
  // In a real app, this would use Linking to call the number
  console.log(`Calling emergency number: ${phoneNumber}`);
  
  // Return mock success response
  return {
    success: true,
    message: `Called emergency number ${phoneNumber}`,
  };
}

export async function sendEmergencyAlert(data: {
  type: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}) {
  // Simulate API call to send alert to emergency contact
  console.log('Sending emergency alert:', data);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Return mock response
  return {
    success: true,
    sentTo: 'emergency contact',
    alertId: `alert-${Date.now()}`,
  };
}

export async function notifyLowBattery(level: number) {
  // Simulate API call to notify about low battery
  console.log(`Notifying about low battery: ${level}%`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return mock response
  return {
    success: true,
    notified: true,
  };
}