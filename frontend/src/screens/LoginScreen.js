import React, { useState, useRef, useEffect } from 'react';
import {
    View, StyleSheet, Animated, Dimensions,
    KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity
} from 'react-native';
import { TextInput, Text, ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

const { width, height } = Dimensions.get('window');
const isWide = width > 768;

const ROLE_HINTS = [
    { role: 'Admin', username: 'admin_test', icon: '👑' },
    { role: 'Manager', username: 'manager_test', icon: '👨‍💼' },
    { role: 'Baker', username: 'baker_test', icon: '👨‍🍳' },
    { role: 'Customer', username: 'customer_test', icon: '🛍️' },
];

const LoginScreen = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
            Animated.spring(logoScaleAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        ]).start();
    }, []);

    const shakeError = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
    };

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            setError('Please enter both username and password.');
            shakeError();
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await client.post('token/', { username, password });
            const { access, refresh } = response.data;
            await AsyncStorage.setItem('access_token', access);
            await AsyncStorage.setItem('refresh_token', refresh);

            const profileResponse = await client.get('users/profile/');
            const user = profileResponse.data;
            await AsyncStorage.setItem('user', JSON.stringify(user));

            onLogin(user);
        } catch (err) {
            setError('Incorrect username or password. Please try again.');
            shakeError();
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const quickFill = (hint) => {
        setUsername(hint.username);
        setPassword('password123');
        setError('');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.root}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={isWide ? styles.wideLayout : styles.mobileLayout}>

                    {/* Left Panel — Branding */}
                    <View style={isWide ? styles.brandPanel : styles.brandPanelMobile}>
                        <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScaleAnim }], opacity: fadeAnim }]}>
                            <View style={styles.logoBadge}>
                                <Text style={styles.logoEmoji}>🥐</Text>
                            </View>
                            <Text style={styles.brandName}>N3 Bakers</Text>
                            <Text style={styles.brandTagline}>Freshly baked. Masterfully managed.</Text>
                        </Animated.View>

                        {isWide && (
                            <Animated.View style={[styles.featureList, { opacity: fadeAnim }]}>
                                {[
                                    { icon: '🏪', text: 'Multi-Branch Management' },
                                    { icon: '📊', text: 'Real-time Analytics Dashboard' },
                                    { icon: '🧾', text: 'Fast POS Billing System' },
                                    { icon: '📦', text: 'Smart Inventory Tracking' },
                                ].map((feat, i) => (
                                    <View key={i} style={styles.featureItem}>
                                        <Text style={styles.featureIcon}>{feat.icon}</Text>
                                        <Text style={styles.featureText}>{feat.text}</Text>
                                    </View>
                                ))}
                            </Animated.View>
                        )}
                    </View>

                    {/* Right Panel — Login Form */}
                    <Animated.View
                        style={[
                            styles.formPanel,
                            {
                                opacity: fadeAnim,
                                transform: [
                                    { translateY: slideAnim },
                                    { translateX: shakeAnim }
                                ]
                            }
                        ]}
                    >
                        <Text style={styles.formTitle}>Welcome back</Text>
                        <Text style={styles.formSubtitle}>Sign in to your workspace</Text>

                        {/* Quick Fill Hints */}
                        <View style={styles.hintsRow}>
                            <Text style={styles.hintsLabel}>Quick fill:</Text>
                            {ROLE_HINTS.map(hint => (
                                <TouchableOpacity
                                    key={hint.role}
                                    style={styles.hintChip}
                                    onPress={() => quickFill(hint)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.hintChipText}>{hint.icon} {hint.role}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Username */}
                        <View style={[styles.inputWrapper, focusedField === 'username' && styles.inputFocused]}>
                            <TextInput
                                label="Username"
                                value={username}
                                onChangeText={t => { setUsername(t); setError(''); }}
                                mode="flat"
                                style={styles.input}
                                activeUnderlineColor="transparent"
                                underlineColor="transparent"
                                left={<TextInput.Icon icon="account" color={focusedField === 'username' ? '#D2691E' : '#94A3B8'} />}
                                autoCapitalize="none"
                                autoCorrect={false}
                                onFocus={() => setFocusedField('username')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>

                        {/* Password */}
                        <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputFocused, { marginTop: 12 }]}>
                            <TextInput
                                label="Password"
                                value={password}
                                onChangeText={t => { setPassword(t); setError(''); }}
                                secureTextEntry={!showPassword}
                                mode="flat"
                                style={styles.input}
                                activeUnderlineColor="transparent"
                                underlineColor="transparent"
                                left={<TextInput.Icon icon="lock" color={focusedField === 'password' ? '#D2691E' : '#94A3B8'} />}
                                right={
                                    <TextInput.Icon
                                        icon={showPassword ? 'eye-off' : 'eye'}
                                        color="#94A3B8"
                                        onPress={() => setShowPassword(v => !v)}
                                    />
                                }
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                onSubmitEditing={handleLogin}
                            />
                        </View>

                        {/* Error Message */}
                        {error ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>⚠️ {error}</Text>
                            </View>
                        ) : null}

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                            onPress={handleLogin}
                            activeOpacity={0.85}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.loginBtnText}>Sign In →</Text>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.passwordHint}>Default password for test accounts: password123</Text>
                    </Animated.View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#FFF8F4',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        minHeight: isWide ? height : undefined,
    },
    wideLayout: {
        flex: 1,
        flexDirection: 'row',
        minHeight: height,
    },
    mobileLayout: {
        flex: 1,
        flexDirection: 'column',
    },

    // Brand Panel
    brandPanel: {
        flex: 1,
        backgroundColor: '#D2691E',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 48,
        position: 'relative',
        overflow: 'hidden',
    },
    brandPanelMobile: {
        backgroundColor: '#D2691E',
        paddingVertical: 48,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoBadge: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#FFFFFF20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#FFFFFF40',
    },
    logoEmoji: {
        fontSize: 48,
    },
    brandName: {
        fontSize: 36,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    brandTagline: {
        fontSize: 15,
        color: '#FFE4CC',
        marginTop: 8,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    featureList: {
        width: '100%',
        maxWidth: 320,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#FFFFFF15',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
    },
    featureIcon: {
        fontSize: 24,
        marginRight: 14,
    },
    featureText: {
        color: '#FFE4CC',
        fontSize: 15,
        fontWeight: '600',
    },

    // Form Panel
    formPanel: {
        flex: isWide ? 1 : undefined,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        padding: isWide ? 56 : 28,
        maxWidth: isWide ? 560 : undefined,
        borderTopLeftRadius: isWide ? 0 : 28,
        borderTopRightRadius: isWide ? 0 : 28,
        ...(isWide ? {} : { marginTop: -24 }),
        shadowColor: '#000',
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.07,
        shadowRadius: 20,
        elevation: 8,
    },
    formTitle: {
        fontSize: 30,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 6,
    },
    formSubtitle: {
        fontSize: 16,
        color: '#64748B',
        marginBottom: 28,
    },

    // Quick Fill Hints
    hintsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 20,
    },
    hintsLabel: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
    },
    hintChip: {
        backgroundColor: '#FFF7ED',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FED7AA',
    },
    hintChipText: {
        fontSize: 12,
        color: '#92400E',
        fontWeight: '600',
    },

    // Inputs
    inputWrapper: {
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
    },
    inputFocused: {
        borderColor: '#D2691E',
        backgroundColor: '#FFF7ED',
    },
    input: {
        backgroundColor: 'transparent',
        height: 56,
    },

    // Error
    errorBox: {
        marginTop: 12,
        backgroundColor: '#FEF2F2',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '600',
    },

    // Login Button
    loginBtn: {
        marginTop: 24,
        backgroundColor: '#D2691E',
        borderRadius: 14,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#D2691E',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    loginBtnDisabled: {
        backgroundColor: '#C4A882',
        shadowOpacity: 0,
        elevation: 0,
    },
    loginBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    passwordHint: {
        marginTop: 20,
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 12,
    },
});

export default LoginScreen;
