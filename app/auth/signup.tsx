import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/app/auth-context';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // Email validation regex
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation - minimum 8 characters
  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleSignup = async () => {
    // Validate all fields filled
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Validate password length
    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with your actual API signup call
      // const response = await fetch('YOUR_API/signup', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password })
      // });

      // For demo, auto-login after signup
      await login(email);
      Alert.alert('Success', 'Account created!');
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Signup failed');
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

        {/* Password Label */}
        <ThemedText style={styles.label}>Password</ThemedText>

        {/* Password Input */}
        <TextInput
          style={styles.input}
          placeholder="At least 8 characters"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        {/* Confirm Password Label */}
        <ThemedText style={styles.label}>Confirm Password</ThemedText>

        {/* Confirm Password Input */}
        <TextInput
          style={styles.input}
          placeholder="Confirm your password"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!loading}
        />

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </ThemedText>
        </TouchableOpacity>

        {/* Sign In Link */}
        <TouchableOpacity onPress={() => router.push('/auth/login')}>
          <ThemedText style={styles.signinLink}>
            Already have an account? <ThemedText style={styles.signinLinkBold}>Sign In</ThemedText>
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
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
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