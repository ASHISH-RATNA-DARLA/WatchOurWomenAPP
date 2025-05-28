import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import Colors from '@/constants/Colors';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  icon?: React.ReactNode;
  style?: object;
  textStyle?: object;
  disabled?: boolean;
}

export default function PrimaryButton({
  title,
  onPress,
  isLoading = false,
  icon,
  style,
  textStyle,
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled || isLoading ? styles.buttonDisabled : {}, style]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={Colors.white} />
      ) : (
        <View style={styles.contentContainer}>
          <Text style={[styles.buttonText, textStyle]}>{title}</Text>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.gray,
    opacity: 0.8,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  iconContainer: {
    marginLeft: 8,
  },
});