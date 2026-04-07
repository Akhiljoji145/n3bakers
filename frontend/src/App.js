import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './screens/LoginScreen';
// Replace these with actual role dashboards later
import CustomerHome from './screens/CustomerHome';
import ManagerDashboard from './screens/ManagerDashboard';
import BakerDashboard from './screens/BakerDashboard';
import AdminDashboard from './screens/AdminDashboard';
import { CartProvider } from './context/CartContext';

const theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: '#D2691E', // Chocolate/Bakery brown
        accent: '#F4A460',
    },
};

export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkToken();
    }, []);

    const checkToken = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                setUser(JSON.parse(userData));
            }
        } catch (e) {
            console.log('Error reading token');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.clear();
        setUser(null);
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
                            <LoginScreen onLogin={setUser} />
                        </PaperProvider>
                    </CartProvider>
                </SafeAreaProvider>
            </View>
        );
    }

    // Role-based routing
    const Dashboard = user.role === 'CUSTOMER' ? CustomerHome : (user.role === 'BAKER' ? BakerDashboard : (user.role === 'ADMIN' ? AdminDashboard : ManagerDashboard));

    return (
        <View style={{ flex: 1 }}>
            <SafeAreaProvider>
                <CartProvider>
                    <PaperProvider theme={theme}>
                        <Dashboard onLogout={handleLogout} />
                    </PaperProvider>
                </CartProvider>
            </SafeAreaProvider>
        </View>
    );
}
