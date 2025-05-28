import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, User, Mail, Lock, Phone, Upload, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import Dropdown from '@/components/ui/Dropdown';

const RELATIONS = [
  { label: 'Father', value: 'father' },
  { label: 'Mother', value: 'mother' },
  { label: 'Brother', value: 'brother' },
  { label: 'Sister', value: 'sister' },
  { label: 'Husband', value: 'husband' },
  { label: 'Other', value: 'other' },
];

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [relation, setRelation] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const { signUp } = useAuth();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to upload a profile image.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setUploading(true);
      try {
        // In a real app, you would upload to S3 here
        // For demo, just simulate a delay and set the image
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProfileImage(result.assets[0].uri);
      } catch (error) {
        alert('Failed to upload image.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRegister = async () => {
    // Basic validation
    if (!name || !email || !password || !relation || !contactName || !contactPhone) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Validate phone format
    const phoneRegex = /^\+?[0-9]{10,12}$/;
    if (!phoneRegex.test(contactPhone)) {
      setError('Please enter a valid phone number');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Call registration service
      await signUp({
        name,
        email,
        password,
        profileImage,
        emergencyContact: {
          relation,
          name: contactName,
          phone: contactPhone,
        },
      });

      // Navigate to home screen on success
      router.replace('/(tabs)/home');
    } catch (error) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={navigateToLogin} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.primary} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Shield size={30} color={Colors.primary} />
              <Text style={styles.logoText}>W.O.W</Text>
            </View>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Create Account</Text>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <TouchableOpacity onPress={pickImage} style={styles.imageUploadContainer}>
              {profileImage ? (
                <Image
                  source={profileImage}
                  style={styles.profileImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  {uploading ? (
                    <ActivityIndicator color={Colors.primary} />
                  ) : (
                    <>
                      <Upload size={24} color={Colors.primary} />
                      <Text style={styles.uploadText}>Upload Photo</Text>
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <User size={20} color={Colors.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={Colors.textTertiary}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Mail size={20} color={Colors.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color={Colors.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <Text style={styles.sectionTitle}>Emergency Contact</Text>

            <Dropdown
              label="Relation"
              items={RELATIONS}
              value={relation}
              onValueChange={setRelation}
              containerStyle={styles.dropdownContainer}
            />

            <View style={styles.inputContainer}>
              <User size={20} color={Colors.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="Contact Name"
                placeholderTextColor={Colors.textTertiary}
                value={contactName}
                onChangeText={setContactName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Phone size={20} color={Colors.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="Contact Phone Number"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="phone-pad"
                value={contactPhone}
                onChangeText={setContactPhone}
              />
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.registerButtonText}>Register</Text>
                  <ChevronRight size={20} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text style={styles.loginLink}>Login</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    padding: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
    marginLeft: 4,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
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
  imageUploadContainer: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
    marginTop: 4,
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
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 16,
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 16,
  },
  registerButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginRight: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  loginLink: {
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
  },
});