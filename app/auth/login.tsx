import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/app/auth-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // Email validation regex
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await login(email);
      Alert.alert('Success', 'Login successful!');
    } catch (error) {
      Alert.alert('Error', 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <ThemedView style={styles.container}>
        {/* Logo */}
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
        />

        {/* Email Label */}
        <ThemedText style={styles.label}>Email Address</ThemedText>

        {/* Email Input */}
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          editable={!loading}
        />

        {/* Sign In Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>
            {loading ? 'Signing in...' : 'Sign In'}
          </ThemedText>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <TouchableOpacity onPress={() => router.push('/auth/signup')}>
          <ThemedText style={styles.signupLink}>
            Don't have an account? <ThemedText style={styles.signupLinkBold}>Sign up</ThemedText>
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
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
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#0d7c8a',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  signupLink: {
    textAlign: 'center',
    color: '#0d7c8a',
    fontSize: 16,
  },
  signupLinkBold: {
    fontWeight: '600',
    color: '#0d7c8a',
  },
});