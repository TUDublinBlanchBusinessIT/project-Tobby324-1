import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/app/auth-context';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebase';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedCity, setEditedCity] = useState(user?.city || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0d7c8a" />
      </View>
    );
  }

  const handleEdit = () => {
    setEditedName(user.name);
    setEditedCity(user.city);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedName(user.name);
    setEditedCity(user.city);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editedName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    if (!editedCity.trim()) {
      Alert.alert('Error', 'City cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: editedName.trim(),
        city: editedCity.trim()
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  const handleProfilePictureUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload a profile picture');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setIsUploadingImage(true);

        // Upload to Firebase Storage
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();

        const storageRef = ref(storage, `profile-pictures/${user.uid}/${Date.now()}.jpg`);
        await uploadBytes(storageRef, blob);

        const downloadUrl = await getDownloadURL(storageRef);

        // Update user profile
        await updateProfile({ profilePicture: downloadUrl });

        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to upload profile picture');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const getAccountTypeLabel = (userType: string) => {
    switch (userType) {
      case 'borrower':
        return 'Borrower';
      case 'lender':
        return 'Lender';
      case 'both':
        return 'Borrower & Lender';
      default:
        return userType;
    }
  };

  const getAccountTypeBadgeColor = (userType: string) => {
    switch (userType) {
      case 'borrower':
        return '#2196f3';
      case 'lender':
        return '#4caf50';
      case 'both':
        return '#ff9800';
      default:
        return '#666';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSubtitle}>Manage your account</Text>
        {!isEditing && (
          <TouchableOpacity
            style={styles.editHeaderButton}
            onPress={handleEdit}
          >
            <Text style={styles.editHeaderButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <View style={styles.profilePictureContainer}>
            {user.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.profilePicture} />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <Text style={styles.profilePictureInitials}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {isUploadingImage && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={handleProfilePictureUpload}
            disabled={isUploadingImage}
          >
            <Text style={styles.changePhotoText}>
              {isUploadingImage ? 'Uploading...' : 'Change Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account Type Badge */}
        <View style={styles.accountTypeBadgeContainer}>
          <View style={[styles.accountTypeBadge, { backgroundColor: getAccountTypeBadgeColor(user.userType) }]}>
            <Text style={styles.accountTypeBadgeText}>{getAccountTypeLabel(user.userType)}</Text>
          </View>
        </View>

        {/* User Information */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Text style={styles.infoIcon}>👤</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editedName}
                    onChangeText={setEditedName}
                    placeholder="Your name"
                    editable={!isSaving}
                  />
                ) : (
                  <Text style={styles.infoValue}>{user.name}</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Text style={styles.infoIcon}>✉️</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Text style={styles.infoIcon}>📍</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                {isEditing ? (
                  <View>
                    <TextInput
                      style={styles.editInput}
                      value={editedCity}
                      onChangeText={setEditedCity}
                      placeholder="City"
                      editable={!isSaving}
                    />
                    <Text style={styles.countryText}>Ireland</Text>
                  </View>
                ) : (
                  <Text style={styles.infoValue}>{user.city}, Ireland</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Text style={styles.infoIcon}>🏷️</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Account Type</Text>
                <Text style={styles.infoValue}>{getAccountTypeLabel(user.userType)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {isEditing ? (
            <View style={styles.editActionsContainer}>
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.buttonDisabled]}
                onPress={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelButton, isSaving && styles.buttonDisabled]}
                onPress={handleCancelEdit}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
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
    position: 'relative',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },
  editHeaderButton: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'ios' ? 10 : 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editHeaderButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0d7c8a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePictureInitials: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    backgroundColor: '#0d7c8a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  changePhotoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  accountTypeBadgeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  accountTypeBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  accountTypeBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoSection: {
    paddingHorizontal: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  actionsSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  editActionsContainer: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: Platform.OS === 'ios' ? 12 : 10,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#4caf50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: Platform.OS === 'ios' ? 12 : 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    padding: 16,
    borderRadius: Platform.OS === 'ios' ? 12 : 10,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#f44336',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    borderWidth: 2,
    borderColor: '#0d7c8a',
  },
  countryText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});
