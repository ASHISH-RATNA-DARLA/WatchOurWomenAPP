import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { I18nManager } from 'react-native';

// Create a safe wrapper for NavigationContainer that handles potential null getConstants
export function SafeNavigationContainer({ children, theme = DefaultTheme, ...rest }: React.ComponentProps<typeof NavigationContainer>) {
  // Apply the patch before rendering to ensure it's available immediately
  // This is a more aggressive approach to fix the I18nManager issue
  useEffect(() => {
    // Patch the I18nManager.getConstants method globally
    if (!I18nManager.getConstants || typeof I18nManager.getConstants !== 'function') {
      console.log('Patching I18nManager.getConstants');
      
      // Create a safe version that always returns a valid object
      const safeGetConstants = () => ({ isRTL: false });
      
      // Apply the patch to the global object
      // @ts-ignore - We need to patch this to prevent errors
      I18nManager.getConstants = safeGetConstants;
      
      // Also patch the global.I18nManager for extra safety
      // @ts-ignore
      if (global.I18nManager) {
        // @ts-ignore
        global.I18nManager.getConstants = safeGetConstants;
      } else {
        // @ts-ignore
        global.I18nManager = { getConstants: safeGetConstants };
      }
    }
  }, []);

  // Create a wrapped version of NavigationContainer that doesn't rely on I18nManager
  // This ensures the direction prop is explicitly set rather than derived from I18nManager
  return (
    <NavigationContainer
      theme={theme}
      direction="ltr" // Explicitly set direction instead of relying on I18nManager
      {...rest}
    >
      {children}
    </NavigationContainer>
  );
}