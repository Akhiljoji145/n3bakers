import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { BottomNavigation, Appbar, Text, Icon, useTheme } from 'react-native-paper';

// Imports for Manager Tabs
import OrderManagementScreen from './manager/OrderManagementScreen';
import ManagerInventoryScreen from './manager/ManagerInventoryScreen';
import ManagerReportsScreen from './manager/ManagerReportsScreen';
import CustomOrderScreen from './manager/CustomOrderScreen';
import NotificationCenter from './NotificationCenter';
import useNotifications from '../hooks/useNotifications';
import useAutoRefresh from '../hooks/useAutoRefresh';

const ManagerDashboard = ({ onLogout, user, activeRole, onSwitchRole }) => {
    const theme = useTheme();
    const [index, setIndex] = useState(0);

    // Background polling and sound logic
    // This hook fetches notifications every 15s and plays sound for new ones
    const { unreadCount } = useNotifications({ limit: 5 });

    const [routes] = useState([
        { key: 'orders', title: 'Orders', focusedIcon: 'clipboard-list' },
        { key: 'custom', title: 'Custom', focusedIcon: 'pencil' },
        { key: 'inventory', title: 'Inventory', focusedIcon: 'warehouse' },
        { key: 'reports', title: 'Reports', focusedIcon: 'chart-bar' },
        { key: 'notifications', title: 'Alerts', focusedIcon: 'bell' },
    ]);

    const renderScene = BottomNavigation.SceneMap({
        orders: () => <OrderManagementScreen />,
        custom: () => <CustomOrderScreen />,
        inventory: () => <ManagerInventoryScreen />,
        reports: () => <ManagerReportsScreen />,
        notifications: () => <NotificationCenter />,
    });

    const getHeaderTitle = () => routes[index].title;

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.header}>
                <Appbar.Content
                    title={`Manager - ${getHeaderTitle()}`}
                    titleStyle={styles.headerTitle}
                />
                {onSwitchRole && (
                    <TouchableOpacity
                        onPress={onSwitchRole}
                        style={styles.switchRoleBtn}
                        activeOpacity={0.8}
                    >
                        <Icon source="swap-horizontal" size={14} color="#4D96FF" />
                        <Text style={styles.switchRoleBtnText}>
                            {user.role === activeRole ? user.secondary_role : user.role}
                        </Text>
                    </TouchableOpacity>
                )}
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
    switchRoleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        marginRight: 4,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    switchRoleBtnText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#4D96FF',
        letterSpacing: 0.4,
    },
    bottomBar: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    activeIndicator: {
        backgroundColor: '#FFF7ED',
    },
});

export default ManagerDashboard;
