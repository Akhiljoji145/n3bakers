import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, useWindowDimensions, FlatList, Image, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Button, Appbar, Badge, FAB, Text, Icon, ActivityIndicator, Portal, Dialog } from 'react-native-paper';
import client from '../api/client';
import { useCart } from '../context/CartContext';
import useNotifications from '../hooks/useNotifications';
import useAutoRefresh from '../hooks/useAutoRefresh';
import CartScreen from './CartScreen';
import BulkOrderScreen from './BulkOrderScreen';
import CustomerOrdersScreen from './CustomerOrdersScreen';

const normalizeList = (data) => Array.isArray(data) ? data : data?.results || [];
const CUSTOMER_DASHBOARD_REFRESH_INTERVAL_MS = 15000;
const CustomerHome = ({ onLogout }) => {
    const { width } = useWindowDimensions();
    const [products, setProducts] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [showBulkOrder, setShowBulkOrder] = useState(false);
    const [showOrders, setShowOrders] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    
    // Enable real-time notifications with sound
    // This hook will automatically play the sound when a new unread notification arrives (e.g., status change)
    const { unreadCount } = useNotifications({ limit: 5 });

    const { 
        cart, 
        addToCart, 
        selectedBranch, 
        setSelectedBranch, 
        branches, 
        loadingBranches,
        refreshBranches,
    } = useCart();

    const cartCount = (cart || []).reduce((sum, item) => sum + (item.quantity || 0), 0);

    const fetchProducts = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setLoadingProducts(true);
        try {
            const prodRes = await client.get('core/products/', {
                params: { branch_id: selectedBranch }
            });
            setProducts(normalizeList(prodRes.data));
        } catch (e) {
            console.error(e);
            if (!silent) setProducts([]);
        } finally {
            if (!silent) setLoadingProducts(false);
        }
    }, [selectedBranch]);

    const refreshCustomerDashboard = useCallback(async ({ silent = false } = {}) => {
        await Promise.all([
            fetchProducts({ silent }),
            refreshBranches?.({ silent }),
        ]);
    }, [fetchProducts, refreshBranches]);

    useEffect(() => {
        refreshCustomerDashboard();
        const intervalId = setInterval(() => {
            refreshCustomerDashboard({ silent: true });
        }, CUSTOMER_DASHBOARD_REFRESH_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [refreshCustomerDashboard]);

    const handleAutoRefresh = useCallback(() => {
        refreshCustomerDashboard({ silent: true });
    }, [refreshCustomerDashboard]);

    useAutoRefresh(handleAutoRefresh, [handleAutoRefresh]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refreshCustomerDashboard({ silent: true });
        } finally {
            setRefreshing(false);
        }
    }, [refreshCustomerDashboard]);

    const currentBranchName = (branches || []).find(b => b.id === selectedBranch)?.name || 'Select Branch';

    if (showCart) {
        return <CartScreen onClose={() => setShowCart(false)} />;
    }

    if (showBulkOrder) {
        return <BulkOrderScreen onClose={() => setShowBulkOrder(false)} />;
    }

    if (showOrders) {
        return <CustomerOrdersScreen onClose={() => setShowOrders(false)} />;
    }

    const availableProducts = (products || []).filter(p => p.is_available);

    const numColumns = width > 600 ? 4 : 2;
    const cardWidth = (width - 32 - (numColumns - 1) * 12) / numColumns;

    const renderProduct = ({ item: product }) => (
        <Card key={product.id} style={[styles.card, { width: cardWidth }]}>
            {product.image ? (
                <Card.Cover 
                    source={{ uri: product.image.startsWith('http') ? product.image : `${client.defaults.baseURL.replace('/api/', '')}${product.image}` }} 
                    style={styles.cardImage} 
                />
            ) : (
                <View style={styles.imagePlaceholder}>
                    <Icon source="package-variant" size={48} color="#D2691E20" />
                </View>
            )}
            <Card.Content style={styles.cardContent}>
                <View style={styles.titleRow}>
                    <Title style={styles.productName} numberOfLines={1}>{product.name}</Title>
                </View>
                <Text style={styles.price}>₹ {product.price}</Text>
                <View style={styles.stockRow}>
                    <Icon source="package-variant-closed" size={14} color={product.stock_quantity > 0 ? "#10B981" : "#EF4444"} />
                    <Text style={[styles.stockText, { color: product.stock_quantity > 0 ? "#10B981" : "#EF4444" }]}>
                        {product.stock_quantity > 0 ? `${product.stock_quantity} available` : 'Out of Stock'}
                    </Text>
                </View>
                <Paragraph style={styles.description} numberOfLines={1}>
                    {product.description || 'Fresh bakes'}
                </Paragraph>
            </Card.Content>
            <Card.Actions style={styles.cardActions}>
                <Button 
                    mode="contained" 
                    onPress={() => addToCart(product)}
                    style={styles.actionBtn}
                    buttonColor={product.stock_quantity > 0 ? "#D2691E" : "#94A3B8"}
                    icon={product.stock_quantity > 0 ? "plus" : "close-circle"}
                    disabled={product.stock_quantity <= 0}
                    compact
                >
                    {product.stock_quantity > 0 ? 'Add' : 'Sold Out'}
                </Button>
            </Card.Actions>
        </Card>
    );

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.header}>
                <View style={styles.headerBrand}>
                    <Image 
                        source={require('../../assets/logo.jpeg')} 
                        style={styles.headerLogo} 
                        resizeMode="contain" 
                    />
                    <Text style={styles.headerTitle}>N3 BAKERS</Text>
                </View>
                <View>
                    <Appbar.Action
                        icon="refresh"
                        onPress={onRefresh}
                        disabled={loadingProducts || refreshing}
                    />
                </View>
                <View>
                    <Appbar.Action icon="receipt" onPress={() => setShowOrders(true)} />
                    <Badge style={styles.notifBadge} visible={unreadCount > 0}>{unreadCount}</Badge>
                </View>
                <View>
                    <Appbar.Action icon="cart" onPress={() => setShowCart(true)} />
                    <Badge style={styles.cartBadge} visible={cartCount > 0}>{cartCount}</Badge>
                </View>
                <Appbar.Action icon="logout" onPress={onLogout} />
            </Appbar.Header>

            <View style={styles.branchBar}>
                <Text style={styles.branchLabel}>Ordering from:</Text>
                {loadingBranches ? (
                    <ActivityIndicator size="small" color="#D2691E" />
                ) : (
                    <>
                        <TouchableOpacity 
                            style={styles.branchPicker} 
                            onPress={() => setMenuVisible(true)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.branchName}>{currentBranchName}</Text>
                            <Icon source="chevron-down" size={20} color="#D2691E" />
                        </TouchableOpacity>

                        {/* Branch Selection Dialog */}
                        <Portal>
                            <Dialog visible={menuVisible} onDismiss={() => setMenuVisible(false)} style={{ backgroundColor: '#FFFFFF', borderRadius: 16 }}>
                                <Dialog.Title style={{ fontWeight: '800', color: '#1E293B' }}>Select Branch</Dialog.Title>
                                <Dialog.ScrollArea>
                                    <View style={{ paddingVertical: 8 }}>
                                        {branches.length === 0 ? (
                                            <Text style={{ textAlign: 'center', color: '#94A3B8', padding: 20 }}>No active branches found.</Text>
                                        ) : (
                                            (branches || []).map(b => (
                                                <TouchableOpacity
                                                    key={b.id}
                                                    onPress={() => {
                                                        setSelectedBranch(b.id);
                                                        setMenuVisible(false);
                                                    }}
                                                    disabled={!b.is_active}
                                                    style={{
                                                        flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8,
                                                        opacity: b.is_active ? 1 : 0.5,
                                                        backgroundColor: selectedBranch === b.id ? '#FFF7ED' : 'transparent',
                                                        borderRadius: 8,
                                                        marginBottom: 4
                                                    }}
                                                >
                                                    <Icon 
                                                        source={selectedBranch === b.id ? "check-circle" : "store-outline"} 
                                                        color={selectedBranch === b.id ? "#D2691E" : "#64748B"} 
                                                        size={24} 
                                                    />
                                                    <View style={{ marginLeft: 12 }}>
                                                        <Text style={{ fontSize: 16, fontWeight: selectedBranch === b.id ? '700' : '500', color: selectedBranch === b.id ? '#D2691E' : '#1E293B' }}>
                                                            {b.name}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </View>
                                </Dialog.ScrollArea>
                                <Dialog.Actions>
                                    <Button onPress={() => setMenuVisible(false)} textColor="#64748B">Cancel</Button>
                                </Dialog.Actions>
                            </Dialog>
                        </Portal>
                    </>
                )}
            </View>

            {loadingProducts && products.length === 0 ? (
                <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#D2691E" />
            ) : availableProducts.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon source="bread-slice" size={64} color="#E2E8F0" />
                    <Paragraph style={styles.empty}>No products available right now.</Paragraph>
                </View>
            ) : (
                <FlatList
                    key={numColumns} // Force re-render when column count changes
                    data={availableProducts}
                    renderItem={renderProduct}
                    numColumns={numColumns}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.scroll}
                    columnWrapperStyle={styles.columnWrapper}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D2691E']} />}
                />
            )}

            <FAB
                style={styles.fab}
                icon="party-popper"
                label="Event / Bulk Order"
                color="#FFFFFF"
                onPress={() => setShowBulkOrder(true)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { backgroundColor: '#FFFFFF', elevation: 0, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    headerTitle: { fontWeight: '900', color: '#1E293B', fontSize: 18, marginLeft: 8 },
    headerBrand: { flexDirection: 'row', alignItems: 'center', marginLeft: 16, flex: 1 },
    headerLogo: { width: 32, height: 32, borderRadius: 16 },
    branchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF7ED', borderBottomWidth: 1, borderBottomColor: '#FFEDD5' },
    branchLabel: { fontSize: 13, color: '#9A3412', marginRight: 8, fontWeight: '600' },
    branchPicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#FED7AA' },
    branchName: { fontSize: 14, fontWeight: '700', color: '#D2691E', marginRight: 4 },
    scroll: { padding: 12, paddingBottom: 100 },
    columnWrapper: { justifyContent: 'space-between', marginBottom: 12 },
    card: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFFFFF', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
    cardImage: { height: 120 },
    imagePlaceholder: { height: 120, backgroundColor: '#FDF2F8', justifyContent: 'center', alignItems: 'center' },
    cardContent: { paddingVertical: 8, paddingHorizontal: 12 },
    titleRow: { marginBottom: 2 },
    productName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    price: { fontSize: 15, fontWeight: '900', color: '#D2691E', marginBottom: 2 },
    stockRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    stockText: { fontSize: 11, fontWeight: '700', marginLeft: 4 },
    description: { fontSize: 12, color: '#64748B', lineHeight: 16, marginBottom: 4 },
    cardActions: { paddingHorizontal: 8, paddingBottom: 8, justifyContent: 'center' },
    actionBtn: { borderRadius: 8, flex: 1 },
    buyBtn: { flex: 1, maxWidth: 140 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    empty: { textAlign: 'center', marginTop: 16, color: '#94A3B8', fontSize: 16 },
    cartBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: '#D2691E' },
    notifBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: '#EF4444' },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#D2691E' },
});

export default CustomerHome;
