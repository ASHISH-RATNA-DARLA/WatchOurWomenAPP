import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Phone, CreditCard as Edit } from 'lucide-react-native';
import Colors from '@/constants/Colors';

interface EmergencyContactCardProps {
  name: string;
  relation: string;
  phone: string;
  onEdit?: () => void;
}

export default function EmergencyContactCard({
  name,
  relation,
  phone,
  onEdit,
}: EmergencyContactCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.relation}>{relation}</Text>
        <View style={styles.phoneContainer}>
          <Phone size={14} color={Colors.textSecondary} />
          <Text style={styles.phone}>{phone}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.editButton}
        onPress={onEdit || (() => {})}
      >
        <Edit size={16} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  relation: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phone: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  editButton: {
    padding: 8,
  },
});