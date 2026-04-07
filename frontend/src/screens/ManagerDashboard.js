import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { BottomNavigation, Appbar, useTheme } from 'react-native-paper';

// Imports for Manager Tabs
import POSBillingScreen from './manager/POSBillingScreen';
import OrderManagementScreen from './manager/OrderManagementScreen';
import ManagerInventoryScreen from './manager/ManagerInventoryScreen';
import ManagerReportsScreen from './manager/ManagerReportsScreen';

const ManagerDashboard = ({ onLogout }) => {
    const theme = useTheme();
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'pos', title: 'POS Billing', focusedIcon: 'cash-register' },
        { key: 'orders', title: 'Orders', focusedIcon: 'clipboard-list' },
        { key: 'inventory', title: 'Inventory', focusedIcon: 'warehouse' },
        { key: 'reports', title: 'Reports', focusedIcon: 'chart-bar' },
    ]);

    const renderScene = BottomNavigation.SceneMap({
        pos: () => <POSBillingScreen />,
        orders: () => <OrderManagementScreen />,
        inventory: () => <ManagerInventoryScreen />,
        reports: () => <ManagerReportsScreen />,
    });

    const getHeaderTitle = () => {
        return routes[index].title;
    };

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.header}>
                <Appbar.Content title={`Manager - ${getHeaderTitle()}`} titleStyle={styles.headerTitle} />
                <Appbar.Action icon="logout" onPress={onLogout} />
            </Appbar.Header>
            
            <BottomNavigation
                navigationState={{ index, routes }}
                onIndexChange={setIndex}
                renderScene={renderScene}
                barStyle={styles.bottomBar}
                activeIndicatorStyle={styles.activeIndicator}
                activeColor={theme.colors.primary}
                inactiveColor="#64748B"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        backgroundColor: '#FFFFFF',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    headerTitle: {
        fontWeight: 'bold',
        color: '#1E293B',
    },
    bottomBar: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    activeIndicator: {
        backgroundColor: '#FFF7ED', // Light orange matching primary theme generally
    }
});

export default ManagerDashboard;
