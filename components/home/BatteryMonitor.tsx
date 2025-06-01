  import Colors from '@/constants/Colors';
import { AlertCircle, Battery, BatteryCharging, BatteryWarning } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface BatteryMonitorProps {
  level: number | null;
  isCharging?: boolean;
  error?: string | null;
}

export default function BatteryMonitor({ level, isCharging = false, error = null }: BatteryMonitorProps) {
  // Handle error state
  if (error || level === null) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <AlertCircle size={24} color={Colors.error} />
          <Text style={styles.title}>Battery Status</Text>
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || "Unable to fetch battery data"}
          </Text>
        </View>
      </View>
    );
  }

  // Determine color based on battery level
  const getBatteryColor = () => {
    if (level <= 10) return Colors.error;
    if (level <= 25) return Colors.warning;
    return Colors.success;
  };

  // Determine icon based on battery level and charging status
  const getBatteryIcon = () => {
    if (isCharging) {
      return <BatteryCharging size={24} color={Colors.success} />;
    } else if (level <= 10) {
      return <BatteryWarning size={24} color={Colors.error} />;
    }
    return <Battery size={24} color={getBatteryColor()} />;
  };

  // Get warning message based on battery level and charging status
  const getWarningMessage = () => {
    if (isCharging) {
      return level <= 25 ? 'Battery is charging. Keep connected until fully charged.' : null;
    } else if (level <= 10) {
      return 'Battery critically low. Emergency contacts notified.';
    } else if (level <= 25) {
      return 'Battery low. Consider charging soon.';
    }
    return null;
  };

  const warningMessage = getWarningMessage();

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        {getBatteryIcon()}
        <Text style={styles.title}>Battery Status</Text>
      </View>
      
      <View style={styles.levelContainer}>
        <View style={styles.barContainer}>
          <View 
            style={[
              styles.levelBar, 
              { 
                width: `${level}%`, 
                backgroundColor: isCharging ? Colors.success : getBatteryColor() 
              }
            ]} 
          />
        </View>
        <View style={styles.statusContainer}>
          <Text style={[styles.levelText, { color: isCharging ? Colors.success : getBatteryColor() }]}>
            {level}%
          </Text>
          {isCharging && (
            <Text style={styles.chargingText}>Charging</Text>
          )}
        </View>
      </View>
      
      {warningMessage && (
        <View style={[
          styles.warningContainer, 
          { 
            backgroundColor: isCharging ? Colors.successLight : 
                            level <= 10 ? Colors.errorLight : 
                            Colors.warningLight 
          }
        ]}>
          <Text style={[
            styles.warningText,
            { 
              color: isCharging ? Colors.success : 
                     level <= 10 ? Colors.error : 
                     Colors.warning 
            }
          ]}>
            {warningMessage}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  barContainer: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.lightGray,
    borderRadius: 5,
    marginRight: 8,
    overflow: 'hidden',
  },
  levelBar: {
    height: '100%',
    borderRadius: 5,
  },
  statusContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    minWidth: 70,
  },
  levelText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    textAlign: 'right',
  },
  chargingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.success,
    marginTop: 2,
  },
  warningContainer: {
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  warningText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  errorContainer: {
    backgroundColor: Colors.errorLight,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
  },
});