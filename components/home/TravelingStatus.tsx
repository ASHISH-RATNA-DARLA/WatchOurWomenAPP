import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { MapPin } from 'lucide-react-native';
import Colors from '@/constants/Colors';

export default function TravelingStatus() {
  const pulseAnim = useSharedValue(1);
  
  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 800, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.in(Easing.ease) })
      ),
      -1, // Infinite repeat
      true // Reverse
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseAnim.value }],
      opacity: pulseAnim.value * 0.8,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, animatedStyle]}>
          <MapPin size={20} color={Colors.primary} />
        </Animated.View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Travel Mode Active</Text>
          <Text style={styles.subtitle}>Sharing location with emergency contacts</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.primary,
    opacity: 0.8,
  },
});