import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Battery, BatteryWarning } from 'lucide-react-native';
import Colors from '@/constants/Colors';

interface BatteryMonitorProps {
  level: number;
}

export default function BatteryMonitor({ level }: BatteryMonitorProps) {
  // Determine color based on battery level
  const getBatteryColor = () => {
    if (level <= 10) return Colors.error;
    if (level <= 25) return Colors.warning;
    return Colors.success;
  };

  // Determine icon based on battery level
  const getBatteryIcon = () => {
    if (level <= 10) {
      return <BatteryWarning size={24} color={Colors.error} />;
    }
    return <Battery size={24} color={getBatteryColor()} />;
  };

  // Get warning message based on battery level
  const getWarningMessage = () => {
    if (level <= 10) {
      return 'Battery critically low. Emergency contacts notified.';
    }
    if (level <= 25) {
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
                backgroundColor: getBatteryColor() 
              }
            ]} 
          />
        </View>
        <Text style={[styles.levelText, { color: getBatteryColor() }]}>
          {level}%
        </Text>
      </View>
      
      {warningMessage && (
        <View style={[
          styles.warningContainer, 
          { backgroundColor: level <= 10 ? Colors.errorLight : Colors.warningLight }
        ]}>
          <Text style={[
            styles.warningText,
            { color: level <= 10 ? Colors.error : Colors.warning }
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
  levelText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    width: 40,
    textAlign: 'right',
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
});