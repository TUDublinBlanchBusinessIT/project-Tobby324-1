import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Switch,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/app/auth-context';
import { auth } from '@/config/firebase';
import { createItem, uploadItemImage } from '@/services/firebase-service';

export default function AddItemScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Tools');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [pricePerDay, setPricePerDay] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [pricingType, setPricingType] = useState<'day' | 'hour'>('day');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const categories = ['Tools', 'Sports', 'Outdoor', 'Electronics', 'Other'];

  async function handlePickImage() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  }

  async function handleSubmit() {
    // Validation
    if (!title.trim()) {
      Alert.alert('Missing Information', 'Please enter an item title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Missing Information', 'Please enter a description');
      return;
    }

    if (!isFree && pricingType === 'day' && !pricePerDay) {
      Alert.alert('Missing Information', 'Please enter price per day or mark as free');
      return;
    }

    if (!isFree && pricingType === 'hour' && !pricePerHour) {
      Alert.alert('Missing Information', 'Please enter price per hour or mark as free');
      return;
    }

    if (!imageUri) {
      Alert.alert('Missing Information', 'Please add an image of your item');
      return;
    }

    if (!auth.currentUser || !user) {
      Alert.alert('Error', 'You must be logged in to add items');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload image first
      const tempItemId = Date.now().toString();
      const imageUrl = await uploadItemImage(imageUri, tempItemId);

      // Get the actual price based on pricing type
      const actualPrice = isFree
        ? 0
        : pricingType === 'day'
          ? parseFloat(pricePerDay)
          : parseFloat(pricePerHour);

      // Calculate price per day (for sorting/filtering purposes)
      const finalPricePerDay = isFree
        ? 0
        : pricingType === 'day'
          ? parseFloat(pricePerDay)
          : parseFloat(pricePerHour) * 24;

      // Create item
      await createItem({
        title: title.trim(),
        description: description.trim(),
        category,
        imageUrl,
        price: actualPrice,
        pricePerDay: finalPricePerDay,
        pricingType,
        isFree,
        ownerId: auth.currentUser.uid,
        ownerName: user.name,
        ownerAvatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name),
        available: true
      });

      Alert.alert(
        'Success!',
        'Your item has been listed successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setTitle('');
              setDescription('');
              setImageUri(null);
              setIsFree(false);
              setPricePerDay('');
              setPricePerHour('');
              setCategory('Tools');
              router.push('/(tabs)/my-items');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating item:', error);
      Alert.alert('Error', 'Failed to create item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Add New Item</Text>
          <Text style={styles.headerSubtitle}>Share an item you'd like to lend out</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Image Upload Section */}
        <View style={styles.imageSection}>
          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={handlePickImage}
              >
                <Text style={styles.changeImageText}>📷 Change Image</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.imagePlaceholder}
              onPress={handlePickImage}
            >
              <View style={styles.imagePlaceholderContent}>
                <Image
                  source={{ uri: 'https://via.placeholder.com/150' }}
                  style={styles.placeholderImage}
                />
                <Text style={styles.changeImageLink}>📷 Change Image</Text>
                <Text style={styles.imageUploadHint}>Image upload coming soon</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Item Title */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Item Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Electric Drill, Mountain Bike"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Category */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Category <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
          >
            <Text style={styles.dropdownText}>{category}</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>

          {showCategoryDropdown && (
            <View style={styles.dropdownMenu}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategoryDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Description <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your item, its condition, and any special notes for borrowers..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Pricing Section */}
        <View style={styles.formGroup}>
          <View style={styles.pricingHeader}>
            <Text style={styles.label}>Pricing</Text>
            <View style={styles.freeToggle}>
              <Text style={styles.freeLabel}>Free</Text>
              <Switch
                value={isFree}
                onValueChange={setIsFree}
                trackColor={{ false: '#767577', true: '#00c853' }}
                thumbColor={isFree ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {!isFree && (
            <>
              <View style={styles.pricingTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.pricingTypeButton,
                    pricingType === 'day' && styles.pricingTypeButtonActive
                  ]}
                  onPress={() => setPricingType('day')}
                >
                  <Text style={[
                    styles.pricingTypeText,
                    pricingType === 'day' && styles.pricingTypeTextActive
                  ]}>
                    Per Day
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pricingTypeButton,
                    pricingType === 'hour' && styles.pricingTypeButtonActive
                  ]}
                  onPress={() => setPricingType('hour')}
                >
                  <Text style={[
                    styles.pricingTypeText,
                    pricingType === 'hour' && styles.pricingTypeTextActive
                  ]}>
                    Per Hour
                  </Text>
                </TouchableOpacity>
              </View>

              {pricingType === 'day' ? (
                <View style={styles.priceInputContainer}>
                  <Text style={styles.currencySymbol}>€</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0.00"
                    value={pricePerDay}
                    onChangeText={setPricePerDay}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.priceUnit}>/day</Text>
                </View>
              ) : (
                <View style={styles.priceInputContainer}>
                  <Text style={styles.currencySymbol}>€</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0.00"
                    value={pricePerHour}
                    onChangeText={setPricePerHour}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.priceUnit}>/hour</Text>
                </View>
              )}
            </>
          )}

          {isFree && (
            <View style={styles.freeNotice}>
              <Text style={styles.freeNoticeText}>
                Free to lend - Borrowers won't be charged for this item
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.addButton, isSubmitting && styles.addButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>Add Item</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#0d7c8a',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 60,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    backgroundColor: '#f8e7f0',
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePlaceholder: {
    width: '100%',
    alignItems: 'center',
  },
  imagePlaceholderContent: {
    alignItems: 'center',
  },
  placeholderImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    marginBottom: 15,
  },
  changeImageLink: {
    fontSize: 16,
    color: '#0d7c8a',
    fontWeight: '600',
    marginBottom: 5,
  },
  imageUploadHint: {
    fontSize: 12,
    color: '#666',
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 15,
  },
  changeImageButton: {
    backgroundColor: '#0d7c8a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  formGroup: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#f44336',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
    }),
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownText: {
    fontSize: 15,
    color: '#333',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#333',
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  freeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  freeLabel: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
    marginRight: 8,
  },
  pricingTypeContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  pricingTypeButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pricingTypeButtonActive: {
    backgroundColor: '#0d7c8a',
  },
  pricingTypeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  pricingTypeTextActive: {
    color: '#fff',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  currencySymbol: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    marginRight: 5,
  },
  priceInput: {
    flex: 1,
    fontSize: 18,
    color: '#333',
    padding: 0,
  },
  priceUnit: {
    fontSize: 14,
    color: '#666',
  },
  freeNotice: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#00c853',
  },
  freeNoticeText: {
    fontSize: 13,
    color: '#2e7d32',
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  addButton: {
    backgroundColor: '#0d7c8a',
    padding: 16,
    borderRadius: Platform.OS === 'ios' ? 12 : 10,
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#0d7c8a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
