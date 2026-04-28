import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Text, ActivityIndicator, Icon, Surface, Button, Portal, Dialog, TextInput, IconButton } from 'react-native-paper';
import client from '../../api/client';

const normalizeList = (data) => Array.isArray(data) ? data : data?.results || [];
const PRODUCT_STOCK_UNIT_LABEL = 'units';

const ManagerInventoryScreen = () => {
    const [products, setProducts] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [branchProductStock, setBranchProductStock] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editVisible, setEditVisible] = useState(false);
    const [productEditVisible, setProductEditVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantityInput, setQuantityInput] = useState('');
    const [thresholdInput, setThresholdInput] = useState('');
    const [unitInput, setUnitInput] = useState('');
    const [productQuantityInput, setProductQuantityInput] = useState('');

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const [inventoryRes, productsRes, ingredientsRes, branchProductStockRes] = await Promise.all([
                client.get('inventory/branch-inventory/'),
                client.get('core/products/'),
                client.get('inventory/ingredients/'),
                client.get('inventory/branch-product-stock/'),
            ]);
            setInventory(normalizeList(inventoryRes.data));
            setProducts(normalizeList(productsRes.data));
            setIngredients(normalizeList(ingredientsRes.data));
            setBranchProductStock(normalizeList(branchProductStockRes.data));
        } catch (e) {
            console.error('Fetch inventory error', e);
            setInventory([]);
            setProducts([]);
            setIngredients([]);
            setBranchProductStock([]);
        } finally {
            setLoading(false);
        }
    };

    const openEditDialog = (item) => {
        setSelectedItem(item);
        setQuantityInput(String(item.quantity ?? '0'));
        setThresholdInput(String(item.low_stock_threshold ?? '0'));
        setUnitInput(item.unit || '');
        setEditVisible(true);
    };

    const openCreateDialog = (ingredient) => {
        setSelectedItem({
            ingredient: ingredient.id,
            ingredient_name: ingredient.name,
            unit: ingredient.unit,
        });
        setQuantityInput('0');
        setThresholdInput('0');
        setUnitInput(ingredient.unit || '');
        setEditVisible(true);
    };

    const closeEditDialog = () => {
        setEditVisible(false);
        setSelectedItem(null);
        setQuantityInput('');
        setThresholdInput('');
        setUnitInput('');
    };

    const saveInventoryUpdate = async () => {
        if (!selectedItem) return;
        setSaving(true);
        try {
            const payload = {
                ingredient: selectedItem.ingredient,
                quantity: parseFloat(quantityInput || '0'),
                low_stock_threshold: parseFloat(thresholdInput || '0'),
            };
            if (selectedItem.id) {
                await client.patch(`inventory/branch-inventory/${selectedItem.id}/`, payload);
            } else {
                await client.post('inventory/branch-inventory/', payload);
            }

            if (unitInput && unitInput !== selectedItem.unit) {
                await client.patch(`inventory/ingredients/${selectedItem.ingredient}/`, { unit: unitInput });
            }

            closeEditDialog();
            fetchInventory();
        } catch (e) {
            console.error('Update inventory failed', e);
        } finally {
            setSaving(false);
        }
    };

    const openProductEditDialog = (item) => {
        setSelectedProduct(item);
        setProductQuantityInput(String(item.availableUnits ?? '0'));
        setProductEditVisible(true);
    };

    const closeProductEditDialog = () => {
        setProductEditVisible(false);
        setSelectedProduct(null);
        setProductQuantityInput('');
    };

    const saveProductUpdate = async () => {
        if (!selectedProduct) return;
        setSaving(true);
        try {
            const payload = {
                product: selectedProduct.id,
                quantity: Math.max(0, Math.floor(Number(productQuantityInput || '0'))),
            };
            if (selectedProduct.stockId) {
                await client.patch(`inventory/branch-product-stock/${selectedProduct.stockId}/`, payload);
            } else {
                await client.post('inventory/branch-product-stock/', payload);
            }
            closeProductEditDialog();
            fetchInventory();
        } catch (e) {
            console.error('Update product stock failed', e);
        } finally {
            setSaving(false);
        }
    };

    const buildAvailability = () => {
        const branchStockMap = branchProductStock.reduce((acc, stock) => {
            acc[stock.product] = stock;
            return acc;
        }, {});

        return (products || [])
            .filter(product => product.is_available)
            .map(product => {
                const directStock = branchStockMap[product.id];

                return {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    availableUnits: directStock ? Number(directStock.quantity) : 0,
                    stockId: directStock?.id || null,
                    hasStockRow: Boolean(directStock),
                };
            });
    };

    const getStatusBlock = (availableUnits) => {
        if (availableUnits <= 0) {
            return { color: '#EF4444', text: 'OUT OF STOCK', icon: 'alert-circle' };
        }
        if (availableUnits <= 5) {
            return { color: '#F59E0B', text: 'LOW STOCK', icon: 'alert' };
        }
        return { color: '#10B981', text: 'AVAILABLE', icon: 'check-circle' };
    };

    const availability = buildAvailability();
    const inventoryIngredientIds = new Set(inventory.map(item => item.ingredient));
    const missingIngredients = ingredients.filter(item => !inventoryIngredientIds.has(item.id));

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator style={styles.loader} size="large" color="#D2691E" />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Surface style={styles.alertSurface} elevation={1}>
                        <Icon source="information" size={24} color="#3B82F6" />
                        <Text style={styles.alertText}>
                            This view shows product units entered for this branch. Use the pencil button to add or update available product units in stock.
                        </Text>
                    </Surface>

                    <Title style={styles.sectionTitle}>Branch Product Availability</Title>
                    
                    {availability.length === 0 ? (
                        <Text style={styles.empty}>No products available to calculate for this branch yet.</Text>
                    ) : (
                        <View style={styles.grid}>
                            {availability.map(item => {
                                const status = getStatusBlock(item.availableUnits);
                                return (
                                    <Card key={item.id} style={styles.itemCard}>
                                        <View style={[styles.cardHeader, { backgroundColor: `${status.color}10`, position: 'relative' }]}>
                                            <Icon source={status.icon} color={status.color} size={20} />
                                            <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                                            <IconButton
                                                icon="pencil"
                                                size={16}
                                                iconColor={status.color}
                                                style={{ position: 'absolute', right: -4, top: -4, margin: 0 }}
                                                onPress={() => openProductEditDialog(item)}
                                            />
                                        </View>
                                        <Card.Content style={styles.content}>
                                            <Text style={styles.ingredientName}>{item.name}</Text>
                                            <View style={styles.qtyBox}>
                                                <Text style={styles.qtyValue}>
                                                    {item.availableUnits}
                                                </Text>
                                                <Text style={[styles.subText, { marginLeft: 4 }]}>{PRODUCT_STOCK_UNIT_LABEL}</Text>
                                            </View>
                                            <Text style={styles.subText}>Price: Rs.{item.price}</Text>
                                            <Text style={styles.subText}>
                                                {item.hasStockRow
                                                    ? 'Saved in branch product stock.'
                                                    : 'No branch stock row yet. Edit to add units.'}
                                            </Text>
                                        </Card.Content>
                                    </Card>
                                );
                            })}
                        </View>
                    )}

                    <View style={styles.sectionHeader}>
                        <Title style={styles.sectionTitle}>Ingredient Stock</Title>
                        <Button mode="text" icon="refresh" onPress={fetchInventory} textColor="#D2691E">
                            Refresh
                        </Button>
                    </View>

                    {inventory.length === 0 ? (
                        <Text style={styles.empty}>No ingredient stock has been added for this branch yet.</Text>
                    ) : (
                        inventory.map(item => (
                            <Card key={`stock-${item.id}`} style={styles.stockCard}>
                                <Card.Content style={styles.stockRow}>
                                    <View style={styles.stockInfo}>
                                        <Text style={styles.stockName}>{item.ingredient_name}</Text>
                                        <Text style={styles.stockMeta}>
                                            Qty: {parseFloat(item.quantity || 0).toFixed(2)} {item.unit} | Min: {parseFloat(item.low_stock_threshold || 0).toFixed(2)} {item.unit}
                                        </Text>
                                    </View>
                                    <Button mode="contained-tonal" icon="pencil" onPress={() => openEditDialog(item)}>
                                        Edit
                                    </Button>
                                </Card.Content>
                            </Card>
                        ))
                    )}

                    <Title style={styles.sectionTitle}>Add Missing Ingredient Stock</Title>
                    {missingIngredients.length === 0 ? (
                        <Text style={styles.empty}>All known ingredients already have stock rows for this branch.</Text>
                    ) : (
                        missingIngredients.map(item => (
                            <Card key={`missing-${item.id}`} style={styles.stockCard}>
                                <Card.Content style={styles.stockRow}>
                                    <View style={styles.stockInfo}>
                                        <Text style={styles.stockName}>{item.name}</Text>
                                        <Text style={styles.stockMeta}>Unit: {item.unit}</Text>
                                    </View>
                                    <Button mode="contained" icon="plus" onPress={() => openCreateDialog(item)}>
                                        Add
                                    </Button>
                                </Card.Content>
                            </Card>
                        ))
                    )}
                </ScrollView>
            )}

            <Portal>
                <Dialog visible={editVisible} onDismiss={closeEditDialog} style={styles.dialog}>
                    <Dialog.Title>Edit Stock</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.dialogLabel}>{selectedItem?.ingredient_name || ''}</Text>
                        <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Available Quantity</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Button mode="outlined" onPress={() => setQuantityInput(String(Math.max(0, Number((parseFloat(quantityInput || '0') - 1).toFixed(2)))))}>-</Button>
                            <TextInput
                                mode="outlined"
                                keyboardType="numeric"
                                value={quantityInput}
                                onChangeText={setQuantityInput}
                                style={{ flex: 1, marginHorizontal: 8, marginTop: -6 }}
                            />
                            <Button mode="outlined" onPress={() => setQuantityInput(String(Number((parseFloat(quantityInput || '0') + 1).toFixed(2))))}>+</Button>
                        </View>
                        
                        <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Low Stock Threshold</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Button mode="outlined" onPress={() => setThresholdInput(String(Math.max(0, Number((parseFloat(thresholdInput || '0') - 1).toFixed(2)))))}>-</Button>
                            <TextInput
                                mode="outlined"
                                keyboardType="numeric"
                                value={thresholdInput}
                                onChangeText={setThresholdInput}
                                style={{ flex: 1, marginHorizontal: 8, marginTop: -6 }}
                            />
                            <Button mode="outlined" onPress={() => setThresholdInput(String(Number((parseFloat(thresholdInput || '0') + 1).toFixed(2))))}>+</Button>
                        </View>
                        <TextInput
                            label="Unit (e.g. kg, pcs)"
                            mode="outlined"
                            value={unitInput}
                            onChangeText={setUnitInput}
                            style={styles.dialogInput}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={closeEditDialog} disabled={saving}>Cancel</Button>
                        <Button onPress={saveInventoryUpdate} loading={saving} disabled={saving}>Update</Button>
                    </Dialog.Actions>
                </Dialog>
                
                <Dialog visible={productEditVisible} onDismiss={closeProductEditDialog} style={styles.dialog}>
                    <Dialog.Title>Edit Product Stock</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.dialogLabel}>{selectedProduct?.name || ''}</Text>
                        <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Available Units</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Button mode="outlined" onPress={() => setProductQuantityInput(String(Math.max(0, Number((parseFloat(productQuantityInput || '0') - 1).toFixed(2)))))}>-</Button>
                            <TextInput
                                mode="outlined"
                                keyboardType="numeric"
                                value={productQuantityInput}
                                onChangeText={setProductQuantityInput}
                                style={{ flex: 1, marginHorizontal: 8, marginTop: -6 }}
                            />
                            <Button mode="outlined" onPress={() => setProductQuantityInput(String(Number((parseFloat(productQuantityInput || '0') + 1).toFixed(2))))}>+</Button>
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={closeProductEditDialog} disabled={saving}>Cancel</Button>
                        <Button onPress={saveProductUpdate} loading={saving} disabled={saving}>Update</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 16 },
    alertSurface: { padding: 16, backgroundColor: '#EFF6FF', borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    alertText: { marginLeft: 12, color: '#1E3A8A', flex: 1, lineHeight: 20 },
    sectionTitle: { marginBottom: 16, fontWeight: 'bold', fontSize: 18, color: '#1E293B' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    empty: { textAlign: 'center', color: '#94A3B8', marginTop: 30 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    itemCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 16, elevation: 2, overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', padding: 8, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    statusText: { marginLeft: 6, fontWeight: 'bold', fontSize: 12 },
    content: { padding: 16, alignItems: 'center' },
    ingredientName: { fontSize: 16, fontWeight: '600', color: '#334155', textAlign: 'center', marginBottom: 12 },
    qtyBox: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8 },
    qtyValue: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
    subText: { fontSize: 12, color: '#94A3B8' },
    stockCard: { marginBottom: 12, borderRadius: 12, backgroundColor: '#FFFFFF' },
    stockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    stockInfo: { flex: 1, paddingRight: 12 },
    stockName: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
    stockMeta: { fontSize: 12, color: '#64748B' },
    dialog: { backgroundColor: '#FFFFFF' },
    dialogLabel: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
    dialogInput: { marginBottom: 12 },
});

export default ManagerInventoryScreen;
