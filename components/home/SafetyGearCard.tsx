import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { ShoppingBag, Info } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import ImageWithFallback from '@/components/ui/ImageWithFallback';

interface SafetyGearCardProps {
  title: string;
  image: string;
  description?: string;
  onPress?: () => void;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 cards per row with margins

export default function SafetyGearCard({ title, image, description, onPress }: SafetyGearCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      alert(`View ${title} details`);
    }
  };
  
  const toggleInfo = (e) => {
    e.stopPropagation();
    setShowInfo(!showInfo);
  };
  
  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <ImageWithFallback
        source={image}
        fallbackSource="https://via.placeholder.com/160?text=Safety+Gear"
        style={styles.image}
        contentFit="cover"
      />
      <View style={styles.overlay} />
      
      {description && (
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={toggleInfo}
        >
          <Info size={16} color={Colors.white} />
        </TouchableOpacity>
      )}
      
      {showInfo && description ? (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>{description}</Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.orderButton}>
            <ShoppingBag size={14} color={Colors.white} />
            <Text style={styles.orderText}>Quick Buy</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  contentContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  orderText: {
    marginLeft: 4,
    fontFamily: 'Inter-Medium',
    color: Colors.white,
    fontSize: 12,
  },
  infoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  infoContainer: {
    flex: 1,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
  },
  infoText: {
    color: Colors.white,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    textAlign: 'center',
  },
});