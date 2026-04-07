import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Appbar, Text, Icon, ActivityIndicator, BottomNavigation, useTheme } from 'react-native-paper';
import client from '../api/client';

// Import Feature Screens
import BranchManagement from './admin/BranchManagement';
import StaffManagement from './admin/StaffManagement';
import ProductManagement from './admin/ProductManagement';
import RecipeManagement from './admin/RecipeManagement';
import InventoryMonitoring from './admin/InventoryMonitoring';
import OrderGlobalView from './admin/OrderGlobalView';
import BulkOrderApproval from './admin/BulkOrderApproval';
import DeliveryMonitoring from './admin/DeliveryMonitoring';
import PaymentMonitoring from './admin/PaymentMonitoring';
import AnalyticsReports from './admin/AnalyticsReports';
import ProductionInsights from './admin/ProductionInsights';
import NotificationControl from './admin/NotificationControl';

const INSIGHT_MODULE_IDS = ['analytics', 'production'];

const MODULES = [
    { id: 'branch', title: 'Branch\nManagement', icon: 'store', component: BranchManagement, color: '#FF7B54' },
    { id: 'staff', title: 'Staff\nManagement', icon: 'account-group', component: StaffManagement, color: '#4D96FF' },
    { id: 'products', title: 'Products\nControl', icon: 'package-variant', component: ProductManagement, color: '#9D4EDD' },
    { id: 'recipe', title: 'Ingredients\n& Recipes', icon: 'chef-hat', component: RecipeManagement, color: '#F4A261' },
    { id: 'inventory', title: 'Inventory\nMonitoring', icon: 'warehouse', component: InventoryMonitoring, color: '#2A9D8F' },
    { id: 'orders', title: 'Global\nOrders', icon: 'cart', component: OrderGlobalView, color: '#E76F51' },
    { id: 'bulk', title: 'Bulk Order\nApproval', icon: 'truck', component: BulkOrderApproval, color: '#E9C46A' },
    { id: 'delivery', title: 'Delivery\nTracking', icon: 'map-marker', component: DeliveryMonitoring, color: '#264653' },
    { id: 'payment', title: 'Payment\nMonitoring', icon: 'credit-card', component: PaymentMonitoring, color: '#FCA311' },
    { id: 'analytics', title: 'Analytics\n& Reports', icon: 'chart-bar', component: AnalyticsReports, color: '#118AB2' },
    { id: 'production', title: 'Production\nInsights', icon: 'trending-up', component: ProductionInsights, color: '#06D6A0' },
    { id: 'notifications', title: 'Alerts &\nNotifications', icon: 'bell', component: NotificationControl, color: '#EF476F' },
];

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)));

const getScoreTone = (score) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Strong';
    if (score >= 50) return 'Stable';
    return 'Needs focus';
};

const getAnalyticsInsight = (orders = []) => {
    if (!orders.length) {
        return {
            score: 0,
            title: 'Analytics Insight',
            detail: 'No delivered orders available yet.',
        };
    }

    const deliveredPaid = orders.filter((order) => order.status === 'DELIVERED' && order.payment_status).length;
    const score = clampScore((deliveredPaid / orders.length) * 100);

    return {
        score,
        title: `${getScoreTone(score)} analytics`,
        detail: `${deliveredPaid}/${orders.length} orders are delivered and paid.`,
    };
};

const getProductionInsight = (plan) => {
    if (!plan) {
        return {
            score: 0,
            title: 'Production Insight',
            detail: 'Production forecast is not available.',
        };
    }

    const requirementCount = plan.requirements ? Object.keys(plan.requirements).length : 0;
    const shortfallCount = plan.shortfalls?.length ?? 0;

    if (requirementCount === 0) {
        return {
            score: 100,
            title: 'Production ready',
            detail: 'No pending demand is blocking production.',
        };
    }

    const score = clampScore(((requirementCount - shortfallCount) / requirementCount) * 100);

    return {
        score,
        title: `${getScoreTone(score)} production`,
        detail: shortfallCount
            ? `${shortfallCount} ingredient shortfall(s) need action.`
            : 'All required ingredients are covered.',
    };
};

const AdminDashboard = ({ onLogout }) => {
    const theme = useTheme();
    const [tabIndex, setTabIndex] = useState(0);
    const [activeModule, setActiveModule] = useState(null);
    const [insights, setInsights] = useState({
        analytics: { loading: true, score: 0, title: 'Analytics Insight', detail: 'Loading analytics data...' },
        production: { loading: true, score: 0, title: 'Production Insight', detail: 'Loading production data...' },
    });
    const [routes] = useState([
        { key: 'home', title: 'Home', focusedIcon: 'view-dashboard' },
        { key: 'branch', title: 'Branch', focusedIcon: 'store' },
        { key: 'staff', title: 'Staff', focusedIcon: 'account-group' },
        { key: 'inventory', title: 'Inventory', focusedIcon: 'warehouse' },
        { key: 'orders', title: 'Orders', focusedIcon: 'cart' },
    ]);

    useEffect(() => {
        loadInsights();
    }, []);

    const loadInsights = async () => {
        setInsights((current) => ({
            analytics: { ...current.analytics, loading: true },
            production: { ...current.production, loading: true },
        }));

        const [ordersResult, planResult] = await Promise.allSettled([
            client.get('orders/orders/'),
            client.get('analytics/production-plan/'),
        ]);

        setInsights({
            analytics: ordersResult.status === 'fulfilled'
                ? { loading: false, ...getAnalyticsInsight(ordersResult.value.data) }
                : {
                    loading: false,
                    score: 0,
                    title: 'Analytics unavailable',
                    detail: 'Could not load analytics right now.',
                },
            production: planResult.status === 'fulfilled'
                ? { loading: false, ...getProductionInsight(planResult.value.data) }
                : {
                    loading: false,
                    score: 0,
                    title: 'Production unavailable',
                    detail: 'Could not load production insight right now.',
                },
        });
    };

    const insightModules = MODULES.filter((mod) => INSIGHT_MODULE_IDS.includes(mod.id));

    const renderInsightCards = () => (
        <View style={styles.insightSection}>
            <View style={styles.insightHeaderRow}>
                <View>
                    <Text style={styles.sectionEyebrow}>Insights</Text>
                    <Text style={styles.sectionTitle}>Analytics and production ratings</Text>
                </View>
                <TouchableOpacity onPress={loadInsights} activeOpacity={0.8} style={styles.refreshPill}>
                    <Icon source="refresh" size={16} color="#1E293B" />
                    <Text style={styles.refreshPillText}>Refresh</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.insightRow}>
                {insightModules.map((mod) => {
                    const insight = insights[mod.id];
                    return (
                        <TouchableOpacity
                            key={mod.id}
                            style={styles.insightCard}
                            activeOpacity={0.9}
                            onPress={() => setActiveModule(mod)}
                        >
                            <View style={[styles.scoreRing, { borderColor: mod.color, backgroundColor: `${mod.color}14` }]}>
                                {insight.loading ? (
                                    <ActivityIndicator size="small" color={mod.color} />
                                ) : (
                                    <>
                                        <Text style={[styles.scoreValue, { color: mod.color }]}>{insight.score}</Text>
                                        <Text style={styles.scoreBase}>/100</Text>
                                    </>
                                )}
                            </View>

                            <Text style={styles.insightCardTitle}>{mod.title.replace('\n', ' ')}</Text>
                            <Text style={styles.insightCardStatus}>{insight.title}</Text>
                            <Text style={styles.insightCardDetail}>{insight.detail}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    const renderHomeScene = () => (
        <ScrollView contentContainerStyle={styles.gridContainer}>
            <View style={styles.heroSection}>
                <Text style={styles.heroTitle}>Superuser Control Center</Text>
                <Text style={styles.heroSub}>Oversee operations, track growth, and manage your bakery empire.</Text>
            </View>
            {renderInsightCards()}
        </ScrollView>
    );

    const renderScene = ({ route }) => {
        switch (route.key) {
            case 'home':
                return renderHomeScene();
            case 'branch':
                return <BranchManagement />;
            case 'staff':
                return <StaffManagement />;
            case 'inventory':
                return <InventoryMonitoring />;
            case 'orders':
                return <OrderGlobalView />;
            default:
                return null;
        }
    };

    const getHeaderTitle = () => {
        return tabIndex === 0 ? 'Admin Portal' : `Admin - ${routes[tabIndex].title}`;
    };

    const renderActiveModule = () => {
        if (!activeModule) return null;
        const ActiveComponent = activeModule.component;
        return (
            <View style={styles.moduleContainer}>
                <Appbar.Header style={styles.moduleHeader}>
                    <Appbar.BackAction onPress={() => setActiveModule(null)} />
                    <Appbar.Content title={activeModule.title.replace('\n', ' ')} />
                </Appbar.Header>
                <ActiveComponent />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {activeModule ? (
                renderActiveModule()
            ) : (
                <>
                    <Appbar.Header style={styles.mainHeader}>
                        <Appbar.Content title={getHeaderTitle()} titleStyle={styles.mainHeaderTitle} />
                        <Appbar.Action icon="logout" onPress={onLogout} />
                    </Appbar.Header>

                    <BottomNavigation
                        navigationState={{ index: tabIndex, routes }}
                        onIndexChange={setTabIndex}
                        renderScene={renderScene}
                        barStyle={styles.bottomBar}
                        activeIndicatorStyle={styles.activeIndicator}
                        activeColor={theme.colors.primary}
                        inactiveColor="#64748B"
                    />
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    mainHeader: {
        backgroundColor: '#FFFFFF',
        elevation: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    mainHeaderTitle: {
        fontWeight: '700',
        color: '#1E293B',
    },
    gridContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    heroSection: {
        marginBottom: 30,
        padding: 20,
        backgroundColor: '#1E293B',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    heroTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    heroSub: {
        color: '#94A3B8',
        fontSize: 14,
        lineHeight: 20,
    },
    insightSection: {
        marginBottom: 26,
    },
    insightHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionEyebrow: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
    },
    refreshPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E2E8F0',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
    },
    refreshPillText: {
        marginLeft: 6,
        fontSize: 12,
        fontWeight: '700',
        color: '#1E293B',
    },
    insightRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
    },
    insightCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 14,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.07,
        shadowRadius: 14,
        elevation: 4,
    },
    scoreRing: {
        width: 124,
        height: 124,
        borderRadius: 62,
        borderWidth: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
    },
    scoreValue: {
        fontSize: 34,
        fontWeight: '900',
        lineHeight: 38,
    },
    scoreBase: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
    },
    insightCardTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 6,
    },
    insightCardStatus: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 8,
        textAlign: 'center',
    },
    insightCardDetail: {
        fontSize: 13,
        lineHeight: 19,
        color: '#64748B',
        textAlign: 'center',
    },
    moduleContainer: {
        flex: 1,
    },
    moduleHeader: {
        backgroundColor: '#FFFFFF',
        elevation: 2,
    },
    bottomBar: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    activeIndicator: {
        backgroundColor: '#FFF7ED',
    }
});

export default AdminDashboard;
