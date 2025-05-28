// Mock data for crime-prone areas (would come from backend in real app)
export const mockCrimeData = [
  {
    id: 1,
    latitude: 28.6150,
    longitude: 77.2250,
    crimeRate: 'high',
    severity: 'high',
    description: 'High crime area - multiple incidents reported'
  },
  {
    id: 2,
    latitude: 28.6200,
    longitude: 77.2100,
    crimeRate: 'medium',
    severity: 'medium',
    description: 'Medium risk area - occasional incidents'
  },
  {
    id: 3, 
    latitude: 28.6050,
    longitude: 77.2180,
    crimeRate: 'high',
    severity: 'high',
    description: 'High crime area - avoid at night'
  },
  {
    id: 4,
    latitude: 28.6250,
    longitude: 77.2220,
    crimeRate: 'medium',
    severity: 'medium',
    description: 'Medium risk area - stay vigilant'
  },
  {
    id: 5,
    latitude: 28.6300,
    longitude: 77.2150,
    crimeRate: 'low',
    severity: 'low',
    description: 'Low risk area - generally safe'
  }
];

// Mock safety gear products
export const safetyProducts = [
  {
    id: 1,
    name: 'Pepper Spray',
    price: 12.99,
    image: 'https://images.pexels.com/photos/5453811/pexels-photo-5453811.jpeg',
    description: 'Compact and easy to carry pepper spray with 10ft range.'
  },
  {
    id: 2,
    name: 'SOS Keychain',
    price: 19.99,
    image: 'https://images.pexels.com/photos/821754/pexels-photo-821754.jpeg',
    description: 'One-press SOS keychain with loud alarm and LED light.'
  },
  {
    id: 3,
    name: 'Smart ID Card',
    price: 24.99,
    image: 'https://images.pexels.com/photos/6177645/pexels-photo-6177645.jpeg',
    description: 'ID card with built-in SOS button and GPS tracker.'
  },
  {
    id: 4,
    name: 'Self Defense Manual',
    price: 9.99,
    image: 'https://images.pexels.com/photos/256450/pexels-photo-256450.jpeg',
    description: 'Comprehensive guide to self-defense techniques for women.'
  }
];

// Mock safety tips
export const safetyTips = [
  {
    id: 1,
    title: 'Share Your Location',
    description: 'Always share your live location with trusted contacts when traveling alone.',
    icon: 'map-pin',
  },
  {
    id: 2,
    title: 'Stay Alert',
    description: 'Avoid using headphones or being distracted by your phone in isolated areas.',
    icon: 'bell',
  },
  {
    id: 3,
    title: 'Use Well-Lit Routes',
    description: 'Choose well-lit and populated routes, especially at night.',
    icon: 'sun',
  },
  {
    id: 4,
    title: 'Keep Emergency Contacts Ready',
    description: 'Have emergency contacts on speed dial or easily accessible.',
    icon: 'phone',
  },
  {
    id: 5,
    title: 'Trust Your Instincts',
    description: 'If something feels wrong, trust your gut and move to a safer location.',
    icon: 'shield',
  },
];