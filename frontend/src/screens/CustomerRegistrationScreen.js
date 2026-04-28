import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import { TextInput, Text, ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

const { width, height } = Dimensions.get('window');
const isWide = width > 768;

const CustomerRegistrationScreen = ({ onLogin, onShowLogin }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

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
    }, [fadeAnim, slideAnim, logoScaleAnim]);

    const shakeError = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
    };

    const handleRegistration = async () => {
        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim();

        if (!trimmedUsername || !trimmedEmail || !password.trim() || !confirmPassword.trim()) {
            setError('Please complete every field.');
            shakeError();
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            shakeError();
            return;
        }

        setLoading(true);
        setError('');

        try {
            await client.post('users/register/', {
                username: trimmedUsername,
                email: trimmedEmail,
                password,
            });

            const tokenResponse = await client.post('token/', {
                username: trimmedUsername,
                password,
            });

            const { access, refresh } = tokenResponse.data;
            await AsyncStorage.setItem('access_token', access);
            await AsyncStorage.setItem('refresh_token', refresh);

            const profileResponse = await client.get('users/profile/');
            const user = profileResponse.data;
            await AsyncStorage.setItem('user', JSON.stringify(user));

            onLogin(user);
        } catch (err) {
            const apiError = err.response?.data;
            if (apiError?.username?.[0]) {
                setError(apiError.username[0]);
            } else if (apiError?.email?.[0]) {
                setError(apiError.email[0]);
            } else if (apiError?.password?.[0]) {
                setError(apiError.password[0]);
            } else if (typeof apiError?.detail === 'string') {
                setError(apiError.detail);
            } else {
                setError('Unable to create customer account right now.');
            }
            shakeError();
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.root}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={isWide ? styles.wideLayout : styles.mobileLayout}>
                    <View style={isWide ? styles.brandPanel : styles.brandPanelMobile}>
                        <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScaleAnim }], opacity: fadeAnim }]}>
                            <View style={styles.logoBadge}>
                                <Image 
                                    source={require('../../assets/logo.jpeg')} 
                                    style={styles.logoImage} 
                                    resizeMode="contain" 
                                />
                            </View>
                            <Text style={styles.brandName}>N3 Bakers</Text>
                            <Text style={styles.brandTagline}>Create a customer account to browse and order.</Text>
                        </Animated.View>

                        {isWide && (
                            <Animated.View style={[styles.featureList, { opacity: fadeAnim }]}>
                                {[
                                    'Order from the customer catalog',
                                    'Track your orders in one place',
                                    'Manage your cart and checkout faster',
                                ].map((item) => (
                                    <View key={item} style={styles.featureItem}>
                                        <View style={styles.featureDot} />
                                        <Text style={styles.featureText}>{item}</Text>
                                    </View>
                                ))}
                            </Animated.View>
                        )}
                    </View>

                    <Animated.View
                        style={[
                            styles.formPanel,
                            {
                                opacity: fadeAnim,
                                transform: [
                                    { translateY: slideAnim },
                                    { translateX: shakeAnim },
                                ],
                            },
                        ]}
                    >
                        <Text style={styles.formTitle}>Customer registration</Text>
                        <Text style={styles.formSubtitle}>This signup creates customer accounts only.</Text>

                        <View style={[styles.inputWrapper, focusedField === 'username' && styles.inputFocused]}>
                            <TextInput
                                label="Username"
                                value={username}
                                onChangeText={(value) => {
                                    setUsername(value);
                                    setError('');
                                }}
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

                        <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputFocused, styles.fieldSpacing]}>
                            <TextInput
                                label="Email"
                                value={email}
                                onChangeText={(value) => {
                                    setEmail(value);
                                    setError('');
                                }}
                                mode="flat"
                                style={styles.input}
                                activeUnderlineColor="transparent"
                                underlineColor="transparent"
                                left={<TextInput.Icon icon="email-outline" color={focusedField === 'email' ? '#D2691E' : '#94A3B8'} />}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>

                        <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputFocused, styles.fieldSpacing]}>
                            <TextInput
                                label="Password"
                                value={password}
                                onChangeText={(value) => {
                                    setPassword(value);
                                    setError('');
                                }}
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
                                        onPress={() => setShowPassword((value) => !value)}
                                    />
                                }
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>

                        <View style={[styles.inputWrapper, focusedField === 'confirmPassword' && styles.inputFocused, styles.fieldSpacing]}>
                            <TextInput
                                label="Confirm password"
                                value={confirmPassword}
                                onChangeText={(value) => {
                                    setConfirmPassword(value);
                                    setError('');
                                }}
                                secureTextEntry={!showConfirmPassword}
                                mode="flat"
                                style={styles.input}
                                activeUnderlineColor="transparent"
                                underlineColor="transparent"
                                left={<TextInput.Icon icon="shield-check-outline" color={focusedField === 'confirmPassword' ? '#D2691E' : '#94A3B8'} />}
                                right={
                                    <TextInput.Icon
                                        icon={showConfirmPassword ? 'eye-off' : 'eye'}
                                        color="#94A3B8"
                                        onPress={() => setShowConfirmPassword((value) => !value)}
                                    />
                                }
                                onFocus={() => setFocusedField('confirmPassword')}
                                onBlur={() => setFocusedField(null)}
                                onSubmitEditing={handleRegistration}
                            />
                        </View>

                        {error ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                            onPress={handleRegistration}
                            activeOpacity={0.85}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Create account</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footerRow}>
                            <Text style={styles.footerText}>Already have an account?</Text>
                            <TouchableOpacity onPress={onShowLogin} activeOpacity={0.7}>
                                <Text style={styles.footerLink}>Sign in</Text>
                            </TouchableOpacity>
                        </View>
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
        marginBottom: 40,
    },
    logoBadge: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        overflow: 'hidden'
    },
    logoImage: {
        width: '100%',
        height: '100%',
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
        maxWidth: 320,
    },
    featureList: {
        width: '100%',
        maxWidth: 340,
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
    featureDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
        marginRight: 14,
    },
    featureText: {
        color: '#FFE4CC',
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },
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
    fieldSpacing: {
        marginTop: 12,
    },
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
    primaryButton: {
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
    primaryButtonDisabled: {
        backgroundColor: '#C4A882',
        shadowOpacity: 0,
        elevation: 0,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    footerRow: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        color: '#64748B',
        fontSize: 14,
    },
    footerLink: {
        color: '#D2691E',
        fontSize: 14,
        fontWeight: '700',
    },
});

export default CustomerRegistrationScreen;
