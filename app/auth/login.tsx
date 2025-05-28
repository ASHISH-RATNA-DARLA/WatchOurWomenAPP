import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, User, Lock, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import TextInputWithValidation from '@/components/ui/TextInputWithValidation';
import PrimaryButton from '@/components/ui/PrimaryButton';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const validateEmail = (text: string) => {
    if (!text) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(text)) return 'Please enter a valid email address';
    return null;
  };

  const validatePassword = (text: string) => {
    if (!text) return 'Password is required';
    if (text.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleLogin = async () => {
    // Validate inputs
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError || passwordError) {
      setError('Please correct the errors in the form');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Call authentication service
      await signIn(email, password);

      // Navigate to home screen on success
      router.replace('/(tabs)/home');
    } catch (error) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRegister = () => {
    router.push('/auth/register');
  };

  const handleForgotPassword = () => {
    // In a real app, this would navigate to a password reset screen
    alert('Password reset functionality would be implemented here');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Shield size={40} color={Colors.primary} />
            <Text style={styles.logoText}>W.O.W</Text>
          </View>
          <Text style={styles.subtitle}>Watch Our Women</Text>

          <View style={styles.imageContainer}>
            <ImageWithFallback
              source="https://images.pexels.com/photos/7652053/pexels-photo-7652053.jpeg"
              fallbackSource="https://via.placeholder.com/200"
              style={styles.image}
              contentFit="cover"
            />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <TextInputWithValidation
              value={email}
              onChangeText={setEmail}
              placeholder="Email Address"
              icon={<User size={20} color={Colors.textTertiary} />}
              keyboardType="email-address"
              validate={validateEmail}
            />

            <TextInputWithValidation
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              icon={<Lock size={20} color={Colors.textTertiary} />}
              secureTextEntry
              validate={validatePassword}
            />

            <TouchableOpacity 
              style={styles.forgotPasswordLink}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <PrimaryButton
              title="Login"
              onPress={handleLogin}
              isLoading={isLoading}
              icon={<ChevronRight size={20} color={Colors.white} />}
              style={styles.loginButton}
            />

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={navigateToRegister}>
                <Text style={styles.registerLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  logoText: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  formTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.textPrimary,
    marginBottom: 24,
  },
  errorText: {
    color: Colors.error,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: Colors.errorLight,
    borderRadius: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 50,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 16,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginRight: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  registerLink: {
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
  },
});