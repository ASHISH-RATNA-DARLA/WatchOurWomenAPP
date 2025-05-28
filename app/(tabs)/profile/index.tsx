import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, CircleUser as UserCircle, Bell, Battery, Phone, ChevronRight, LogOut, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import EmergencyContactCard from '@/components/profile/EmergencyContactCard';
import { useAuth } from '@/contexts/AuthContext';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import EmptyState from '@/components/ui/EmptyState';
import PrimaryButton from '@/components/ui/PrimaryButton';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [batteryAlerts, setBatteryAlerts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false); // For demo purposes
  
  const handleSignOut = () => {
    signOut();
    router.replace('/auth/login');
  };
  
  const handleEditProfile = () => {
    // Navigate to edit profile screen
    alert('Edit Profile (not implemented in this demo)');
  };
  
  const handleManageContacts = () => {
    // Navigate to manage contacts screen
    alert('Manage Contacts (not implemented in this demo)');
  };
  
  const toggleGPS = () => {
    setGpsEnabled(!gpsEnabled);
  };
  
  const toggleBatteryAlerts = () => {
    setBatteryAlerts(!batteryAlerts);
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate a refresh
    setTimeout(() => {
      setRefreshing(false);
      // Toggle empty state for demo purposes
      setShowEmptyState(!showEmptyState);
    }, 1500);
  };

  const handleAddContact = () => {
    alert('Add Emergency Contact (not implemented in this demo)');
    setShowEmptyState(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.profileCard}>
          <ImageWithFallback
            source={user?.profileImage || "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg"}
            fallbackSource="https://via.placeholder.com/80"
            style={styles.profileImage}
            contentFit="cover"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Sarah Johnson'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'sarah@example.com'}</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <UserCircle size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          </View>
          
          {showEmptyState ? (
            <EmptyState
              icon={<UserCircle size={40} color={Colors.textTertiary} />}
              title="No Emergency Contacts"
              message="Add emergency contacts who will be notified in case of an emergency."
              actionLabel="Add Contact"
              onAction={handleAddContact}
            />
          ) : (
            <>
              <EmergencyContactCard 
                name="Robert Johnson"
                relation="Father"
                phone="+1 (555) 123-4567"
                onEdit={() => alert('Edit contact (not implemented in this demo)')}
              />
              
              <PrimaryButton
                title="Manage Contacts"
                onPress={handleManageContacts}
                style={styles.manageButton}
                textStyle={styles.manageButtonText}
                icon={<Plus size={16} color={Colors.primary} />}
              />
            </>
          )}
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Notifications & Settings</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Battery size={20} color={Colors.textPrimary} />
              <Text style={styles.settingText}>Low Battery Alerts</Text>
            </View>
            <Switch
              value={batteryAlerts}
              onValueChange={toggleBatteryAlerts}
              trackColor={{ false: Colors.lightGray, true: Colors.primaryLight }}
              thumbColor={batteryAlerts ? Colors.primary : Colors.gray}
              ios_backgroundColor={Colors.lightGray}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Phone size={20} color={Colors.textPrimary} />
              <Text style={styles.settingText}>Background GPS Tracking</Text>
            </View>
            <Switch
              value={gpsEnabled}
              onValueChange={toggleGPS}
              trackColor={{ false: Colors.lightGray, true: Colors.primaryLight }}
              thumbColor={gpsEnabled ? Colors.primary : Colors.gray}
              ios_backgroundColor={Colors.lightGray}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleSignOut}
          >
            <LogOut size={20} color={Colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>W.O.W - Watch Our Women</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  editButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.primaryLight,
    borderRadius: 4,
  },
  editButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
  },
  section: {
    backgroundColor: Colors.white,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  manageButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 4,
  },
  manageButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    marginLeft: 8,
    fontFamily: 'Inter-Medium',
    color: Colors.error,
  },
  versionInfo: {
    alignItems: 'center',
    padding: 24,
  },
  versionText: {
    fontFamily: 'Inter-Regular',
    color: Colors.textTertiary,
    fontSize: 12,
  },
});