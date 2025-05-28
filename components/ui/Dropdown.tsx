import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  FlatList,
  TouchableWithoutFeedback,
  SafeAreaView,
} from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';
import Colors from '@/constants/Colors';

interface DropdownItem {
  label: string;
  value: string;
}

interface DropdownProps {
  label: string;
  items: DropdownItem[];
  value: string;
  onValueChange: (value: string) => void;
  containerStyle?: object;
  error?: string;
}

export default function Dropdown({
  label,
  items,
  value,
  onValueChange,
  containerStyle,
  error,
}: DropdownProps) {
  const [modalVisible, setModalVisible] = useState(false);
  
  const selectedItem = items.find(item => item.value === value);
  
  return (
    <>
      <View style={[styles.container, containerStyle]}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={[
            styles.selector,
            error ? styles.selectorError : null
          ]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={[
            styles.selectedText,
            !selectedItem && styles.placeholderText,
          ]}>
            {selectedItem ? selectedItem.label : `Select ${label}`}
          </Text>
          <ChevronDown size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
      
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{`Select ${label}`}</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <X size={20} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>
                
                <FlatList
                  data={items}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.option,
                        value === item.value && styles.selectedOption,
                      ]}
                      onPress={() => {
                        onValueChange(item.value);
                        setModalVisible(false);
                      }}
                    >
                      <Text style={[
                        styles.optionText,
                        value === item.value && styles.selectedOptionText,
                      ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.optionsContainer}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  selector: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  selectedText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
  },
  placeholderText: {
    color: Colors.textTertiary,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    paddingBottom: 16,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectedOption: {
    backgroundColor: Colors.primaryLight,
  },
  optionText: {
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    fontSize: 16,
  },
  selectedOptionText: {
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
  },
});