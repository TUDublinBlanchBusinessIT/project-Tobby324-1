import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/app/auth-context';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<'borrower' | 'lender' | 'both' | null>(null);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!userType) {
      Alert.alert('Error', 'Please select a user type');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, name, userType);
      Alert.alert('Success', 'Account created!');
    } catch (error) {
      Alert.alert('Error', 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedView style={styles.container}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
          />

          <ThemedText style={styles.label}>Full Name</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Your full name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />

          <ThemedText style={styles.label}>Email Address</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            editable={!loading}
          />

          <ThemedText style={styles.label}>Password</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="At least 8 characters"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <ThemedText style={styles.label}>Confirm Password</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <ThemedText style={styles.label}>I want to:</ThemedText>
          <View style={styles.userTypeContainer}>
            <TouchableOpacity
              style={[styles.userTypeButton, userType === 'borrower' && styles.userTypeButtonActive]}
              onPress={() => setUserType('borrower')}
              disabled={loading}
            >
              <ThemedText style={[styles.userTypeText, userType === 'borrower' && styles.userTypeTextActive]}>
                Borrow
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.userTypeButton, userType === 'lender' && styles.userTypeButtonActive]}
              onPress={() => setUserType('lender')}
              disabled={loading}
            >
              <ThemedText style={[styles.userTypeText, userType === 'lender' && styles.userTypeTextActive]}>
                Lend
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.userTypeButton, userType === 'both' && styles.userTypeButtonActive]}
              onPress={() => setUserType('both')}
              disabled={loading}
            >
              <ThemedText style={[styles.userTypeText, userType === 'both' && styles.userTypeTextActive]}>
                Both
              </ThemedText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <ThemedText style={styles.signinLink}>
              Already have an account? <ThemedText style={styles.signinLinkBold}>Sign In</ThemedText>
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 40,
    borderRadius: 60,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#000',
  },
  input: {
    backgroundColor: '#f0e8e8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  userTypeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  userTypeButtonActive: {
    backgroundColor: '#0d7c8a',
    borderColor: '#0d7c8a',
  },
  userTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  userTypeTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#0d7c8a',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  signinLink: {
    textAlign: 'center',
    color: '#0d7c8a',
    fontSize: 16,
  },
  signinLinkBold: {
    fontWeight: '600',
    color: '#0d7c8a',
  },
});
