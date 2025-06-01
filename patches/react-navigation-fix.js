// This file patches React Navigation to fix the I18nManager issue
// It should be imported before any React Navigation components are used

// More aggressive patching approach for I18nManager
(function patchI18nManager() {
  try {
    console.log('[PATCH] Applying I18nManager patch');
    
    // Create a safe version of getConstants that always returns a valid object
    const safeGetConstants = () => ({ isRTL: false });
    
    // Patch global.I18nManager first
    if (typeof global !== 'undefined') {
      if (!global.I18nManager) {
        global.I18nManager = { getConstants: safeGetConstants };
      } else if (typeof global.I18nManager.getConstants !== 'function') {
        global.I18nManager.getConstants = safeGetConstants;
      }
    }
    
    // Try to patch the React Native I18nManager module
    try {
      const I18nManager = require('react-native').I18nManager;
      if (I18nManager && typeof I18nManager.getConstants !== 'function') {
        I18nManager.getConstants = safeGetConstants;
      }
    } catch (e) {
      console.warn('[PATCH] Could not patch React Native I18nManager module', e);
    }
    
    // Patch NavigationContainer's direction prop handling
    try {
      // This is a more aggressive approach that monkey-patches React Navigation
      // to avoid using I18nManager.getConstants() altogether
      const NavigationContainer = require('@react-navigation/native').NavigationContainer;
      if (NavigationContainer && NavigationContainer.prototype) {
        const originalRender = NavigationContainer.prototype.render;
        NavigationContainer.prototype.render = function patchedRender() {
          // Force LTR direction if not explicitly specified
          if (this.props && this.props.direction === undefined) {
            this.props.direction = 'ltr';
          }
          return originalRender.apply(this, arguments);
        };
      }
    } catch (e) {
      console.warn('[PATCH] Could not patch NavigationContainer', e);
    }
    
    console.log('[PATCH] I18nManager patch applied successfully');
  } catch (error) {
    console.error('[PATCH] Failed to apply I18nManager patch', error);
  }
})();