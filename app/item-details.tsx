import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform
} from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getItem, createRequest, Item } from '@/services/firebase-service';
import { auth } from '@/config/firebase';
import { useAuth } from './auth-context';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ItemDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000)); // +1 day
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    loadItem();
  }, [id]);

  async function loadItem() {
    try {
      if (!id) return;
      const itemData = await getItem(id);
      setItem(itemData);
    } catch (error) {
      console.error('Error loading item:', error);
      Alert.alert('Error', 'Failed to load item details');
    } finally {
      setIsLoading(false);
    }
  }

  function calculateDays() {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  function calculateTotalCost() {
    if (!item) return 0;
    if (item.isFree) return 0;
    const days = calculateDays();

    // Calculate based on actual pricing type
    if (item.pricingType === 'hour') {
      // For hourly pricing, calculate total hours and multiply by hourly rate
      const hours = days * 24;
      return hours * item.price;
    } else {
      // For daily pricing, multiply days by daily rate
      return days * item.price;
    }
  }

  async function handleRequestBorrow() {
    if (!item || !auth.currentUser || !user) return;

    if (item.ownerId === auth.currentUser.uid) {
      Alert.alert('Cannot Borrow', 'You cannot borrow your own item');
      return;
    }

    if (startDate >= endDate) {
      Alert.alert('Invalid Dates', 'End date must be after start date');
      return;
    }

    setIsSubmitting(true);
    try {
      await createRequest({
        itemId: item.id,
        itemName: item.title,
        borrowerId: auth.currentUser.uid,
        borrowerName: user.name,
        lenderId: item.ownerId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'pending'
      });

      Alert.alert(
        'Request Sent!',
        'Your borrow request has been sent to the owner. You will be notified when they respond.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error creating request:', error);
      Alert.alert('Error', 'Failed to send request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0d7c8a" />
        <Text style={styles.loadingText}>Loading item...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Item not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwnItem = item.ownerId === auth.currentUser?.uid;
  const days = calculateDays();
  const totalCost = calculateTotalCost();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />

        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            </View>
            <Text style={styles.price}>
              {item.isFree ? 'Free' : `€${item.price}/${item.pricingType}`}
            </Text>
          </View>

          <View style={styles.ownerSection}>
            <Image source={{ uri: item.ownerAvatar }} style={styles.ownerAvatar} />
            <View>
              <Text style={styles.ownerLabel}>Owner</Text>
              <Text style={styles.ownerName}>
                {isOwnItem ? 'You' : item.ownerName}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>

          {!isOwnItem && item.available && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Request to Borrow</Text>

              <View style={styles.dateSection}>
                <Text style={styles.dateLabel}>Start Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={styles.dateText}>
                    {startDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>

              {showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowStartPicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setStartDate(selectedDate);
                      if (selectedDate >= endDate) {
                        setEndDate(new Date(selectedDate.getTime() + 86400000));
                      }
                    }
                  }}
                />
              )}

              <View style={styles.dateSection}>
                <Text style={styles.dateLabel}>End Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={styles.dateText}>
                    {endDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>

              {showEndPicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  minimumDate={startDate}
                  onChange={(event, selectedDate) => {
                    setShowEndPicker(Platform.OS === 'ios');
                    if (selectedDate) setEndDate(selectedDate);
                  }}
                />
              )}

              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Duration:</Text>
                  <Text style={styles.summaryValue}>{days} day{days !== 1 ? 's' : ''}</Text>
                </View>
                {!item.isFree && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Cost:</Text>
                    <Text style={styles.summaryValue}>€{totalCost.toFixed(2)}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {!item.available && (
            <View style={styles.unavailableBox}>
              <Text style={styles.unavailableText}>This item is currently unavailable</Text>
            </View>
          )}

          {isOwnItem && (
            <View style={styles.ownItemBox}>
              <Text style={styles.ownItemText}>This is your item</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {!isOwnItem && item.available && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.requestButton, isSubmitting && styles.requestButtonDisabled]}
            onPress={handleRequestBorrow}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.requestButtonText}>Send Request</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#0d7c8a',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  itemImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#e0e0e0',
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  categoryBadge: {
    backgroundColor: '#e8d5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#8b5a8b',
    fontWeight: '600',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0d7c8a',
  },
  ownerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 20,
  },
  ownerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#e0e0e0',
  },
  ownerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  dateSection: {
    marginBottom: 15,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  summaryBox: {
    backgroundColor: '#f0f9fa',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0d7c8a',
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0d7c8a',
  },
  unavailableBox: {
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffa500',
  },
  unavailableText: {
    fontSize: 15,
    color: '#f57c00',
    fontWeight: '600',
  },
  ownItemBox: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  ownItemText: {
    fontSize: 15,
    color: '#1976d2',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  requestButton: {
    flex: 2,
    backgroundColor: '#0d7c8a',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestButtonDisabled: {
    opacity: 0.6,
  },
  requestButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
