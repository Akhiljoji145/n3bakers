import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import LoginScreen from './screens/LoginScreen';
import CustomerRegistrationScreen from './screens/CustomerRegistrationScreen';
// Replace these with actual role dashboards later
import CustomerHome from './screens/CustomerHome';
import ManagerDashboard from './screens/ManagerDashboard';
import BakerDashboard from './screens/BakerDashboard';
import AdminDashboard from './screens/AdminDashboard';
import { CartProvider } from './context/CartContext';
import client, { setLogoutCallback } from './api/client';

const theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: '#D2691E', // Chocolate/Bakery brown
        accent: '#F4A460',
    },
};

// Configure how to handle notifications when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export default function App() {
    const [user, setUser] = useState(null);
    const [activeRole, setActiveRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authScreen, setAuthScreen] = useState('login');

    useEffect(() => {
        checkToken();
        requestPermissions();
        
        // Set up global logout handler for unrecoverable session errors (like expired refresh token)
        setLogoutCallback(() => {
            setUser(null);
            setActiveRole(null);
            setAuthScreen('login');
        });
    }, []);

    const requestPermissions = async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            console.log('Notification permissions not granted');
        }
    };

    const checkToken = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsed = JSON.parse(userData);
                setUser(parsed);
                setActiveRole(parsed.role);
            }
        } catch (e) {
            console.log('Error reading token');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = (userData) => {
        setUser(userData);
        setActiveRole(userData.role);
    };

    const handleLogout = async () => {
        await AsyncStorage.clear();
        setAuthScreen('login');
        setUser(null);
        setActiveRole(null);
    };

    const handleSwitchRole = () => {
        if (!user?.secondary_role) return;
        setActiveRole(prev =>
            prev === user.role ? user.secondary_role : user.role
        );
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#D2691E" />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={{ flex: 1 }}>
                <SafeAreaProvider>
                    <CartProvider>
                        <PaperProvider theme={theme}>
                            {authScreen === 'register' ? (
                                <CustomerRegistrationScreen
                                    onLogin={handleLogin}
                                    onShowLogin={() => setAuthScreen('login')}
                                />
                            ) : (
                                <LoginScreen
                                    onLogin={handleLogin}
                                    onShowRegister={() => setAuthScreen('register')}
                                />
                            )}
                        </PaperProvider>
                    </CartProvider>
                </SafeAreaProvider>
            </View>
        );
    }

    // Role-based routing — uses activeRole so dual-role users can switch
    const resolvedRole = activeRole || user.role;
    const Dashboard = resolvedRole === 'CUSTOMER' ? CustomerHome
        : resolvedRole === 'BAKER' ? BakerDashboard
        : resolvedRole === 'ADMIN' ? AdminDashboard
        : ManagerDashboard;

    return (
        <View style={{ flex: 1 }}>
            <SafeAreaProvider>
                <CartProvider>
                    <PaperProvider theme={theme}>
                        <Dashboard
                            onLogout={handleLogout}
                            user={user}
                            activeRole={resolvedRole}
                            onSwitchRole={user.secondary_role ? handleSwitchRole : null}
                        />
                    </PaperProvider>
                </CartProvider>
            </SafeAreaProvider>
        </View>
    );
}
