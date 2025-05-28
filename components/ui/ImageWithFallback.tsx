import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Image, ImageProps } from 'expo-image';
import Colors from '@/constants/Colors';

interface ImageWithFallbackProps extends Omit<ImageProps, 'source'> {
  source: string | null;
  fallbackSource?: string;
  showLoadingIndicator?: boolean;
}

export default function ImageWithFallback({
  source,
  fallbackSource = 'https://via.placeholder.com/150',
  showLoadingIndicator = true,
  style,
  ...props
}: ImageWithFallbackProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoadStart = () => {
    setIsLoading(true);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <View style={[styles.container, style]}>
      <Image
        source={hasError || !source ? fallbackSource : source}
        style={[styles.image, style]}
        onLoadStart={handleLoadStart}
        onLoad={handleLoadEnd}
        onError={handleError}
        transition={300}
        {...props}
      />
      {isLoading && showLoadingIndicator && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} size="small" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
});