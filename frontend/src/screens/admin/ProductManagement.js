import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, useWindowDimensions, FlatList, Alert, ScrollView } from 'react-native';
import {
    Card, Title, Text, Button, FAB, Dialog, Portal,
    TextInput, ActivityIndicator, Chip, Icon, IconButton
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import client from '../../api/client';

const ProductManagement = ({ catalogVersion = 0 }) => {
    const { width } = useWindowDimensions();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);

    // Edit state
    const [editingProduct, setEditingProduct] = useState(null);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    // Dropdown visibility
    const [menuVisible, setMenuVisible] = useState(false);

    const fetchData = useCallback(async ({ showLoader = true } = {}) => {
        if (showLoader) setLoading(true);
        try {
            const params = selectedBranch ? { branch_id: selectedBranch } : {};
            const [prodRes, catRes, branchRes] = await Promise.all([
                client.get('core/products/', { params }),
                client.get('core/categories/'),
                client.get('core/branches/'),
            ]);
            const normalizeList = (data) => Array.isArray(data) ? data : data?.results || [];
            setProducts(normalizeList(prodRes.data));
            setCategories(normalizeList(catRes.data));
            setBranches(normalizeList(branchRes.data));
        } catch (e) {
            console.error('Failed to fetch data', e);
        } finally {
            if (showLoader) setLoading(false);
        }
    }, [selectedBranch]);

    useEffect(() => {
        fetchData();
    }, [fetchData, catalogVersion]);

    const resetProductForm = () => {
        setName('');
        setDescription('');
        setPrice('');
        setCategory(null);
        setSelectedImage(null);
        setMenuVisible(false);
        setEditingProduct(null);
    };

    const openAddDialog = async () => {
        resetProductForm();
        setDialogVisible(true);
        await fetchData({ showLoader: false });
    };

    const openEditDialog = async (product) => {
        setEditingProduct(product);
        setName(product.name);
        setDescription(product.description || '');
        setPrice(String(product.price));
        setCategory(product.category);
        setSelectedImage(null); // Keep existing unless new one chosen
        setDialogVisible(true);
        await fetchData({ showLoader: false });
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });
        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        const trimmedName = name.trim();
        const trimmedPrice = price.trim();

        if (!trimmedName) {
            Alert.alert('Required', 'Product name is required.');
            return;
        }

        if (!trimmedPrice || Number.isNaN(Number(trimmedPrice))) {
            Alert.alert('Required', 'Enter a valid product price.');
            return;
        }

        if (!category) {
            Alert.alert('Required', 'Please select a category.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('name', trimmedName);
            formData.append('description', description.trim());
            formData.append('price', trimmedPrice);
            formData.append('category', String(category));
            formData.append('is_available', 'true');

            if (selectedImage) {
                const uriParts = selectedImage.split('.');
                const fileType = uriParts[uriParts.length - 1];
                formData.append('image', {
                    uri: selectedImage,
                    name: `photo.${fileType}`,
                    type: `image/${fileType}`,
                });
            }

            const headers = { 'Content-Type': 'multipart/form-data' };

            if (editingProduct) {
                await client.patch(`core/products/${editingProduct.id}/`, formData, { headers });
            } else {
                await client.post('core/products/', formData, { headers });
            }

            setDialogVisible(false);
            resetProductForm();
            await fetchData();
        } catch (e) {
            console.error('Failed to save product', e);
            Alert.alert('Error', 'Failed to save the product. Please try again.');
        }
    };

    const confirmDelete = (product) => {
        Alert.alert(
            'Delete Product',
            `Are you sure you want to delete "${product.name}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        try {
                            await client.delete(`core/products/${product.id}/`);
                            await fetchData();
                        } catch (e) {
                            console.error('Failed to delete product', e);
                            Alert.alert('Error', 'Could not delete the product. It may be linked to existing orders.');
                        }
                    }
                },
            ]
        );
    };

    const selectedCategory = categories.find((c) => String(c.id) === String(category));

    const numColumns = width > 600 ? 4 : 2;
    const cardWidth = (width - 32 - (numColumns - 1) * 12) / numColumns;

    const renderProduct = ({ item: product }) => (
        <Card style={[styles.productCard, { width: cardWidth }]}>
            <Card.Content style={styles.cardContent}>
                <View style={styles.imagePlaceholder}>
                    {product.image ? (
                        <Image
                            source={{ uri: product.image.startsWith('http') ? product.image : `${client.defaults.baseURL.replace('/api/', '')}${product.image}` }}
                            style={styles.productImageFull}
                        />
                    ) : (
                        <Icon source="package-variant" color="#C4B5FD" size={28} />
                    )}
                </View>
                <Title style={styles.productName} numberOfLines={1}>{product.name}</Title>
                <Chip
                    style={styles.catChip}
                    textStyle={{ color: '#5B21B6', fontSize: 9, fontWeight: '700' }}
                >
                    {categories.find((c) => String(c.id) === String(product.category))?.name || 'Uncategorized'}
                </Chip>
                <View style={styles.cardFooter}>
                    <View style={styles.priceTag}>
                        <Text style={styles.priceText}>₹{product.price}</Text>
                    </View>
                    {product.stock_quantity !== null && (
                        <View style={[styles.stockTag, { backgroundColor: product.stock_quantity < 5 ? '#FEF2F2' : '#F0FDF4' }]}>
                            <Text style={[styles.stockText, { color: product.stock_quantity < 5 ? '#EF4444' : '#16A34A' }]}>
                                {product.stock_quantity} left
                            </Text>
                        </View>
                    )}
                </View>
            </Card.Content>
            <View style={styles.cardActions}>
                <IconButton
                    icon="pencil-outline"
                    size={18}
                    iconColor="#6366F1"
                    style={styles.actionBtn}
                    onPress={() => openEditDialog(product)}
                />
                <IconButton
                    icon="delete-outline"
                    size={18}
                    iconColor="#EF4444"
                    style={styles.actionBtn}
                    onPress={() => confirmDelete(product)}
                />
            </View>
        </Card>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator style={styles.loader} size="large" />
            ) : (
                <FlatList
                    key={numColumns}
                    data={products}
                    renderItem={renderProduct}
                    numColumns={numColumns}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.scroll}
                    columnWrapperStyle={styles.columnWrapper}
                    ListHeaderComponent={
                    <>
                        <View style={styles.statsCard}>
                            <View>
                                <Text style={styles.statsSubtitle}>Our Menu Offerings</Text>
                                <Text style={styles.statsTitle}>{products.length} Products</Text>
                            </View>
                            <Icon source="package-variant" color="#9D4EDD" size={40} />
                        </View>

                        <View style={styles.branchSelectorSection}>
                            <Text style={styles.selectorLabel}>Branch Stock View:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.branchList}>
                                <Chip
                                    selected={selectedBranch === null}
                                    onPress={() => setSelectedBranch(null)}
                                    style={[styles.branchChip, selectedBranch === null && { backgroundColor: '#EDE9FE' }]}
                                    selectedColor="#7C3AED"
                                >
                                    Global
                                </Chip>
                                {branches.map((b) => (
                                    <Chip
                                        key={b.id}
                                        selected={selectedBranch === b.id}
                                        onPress={() => setSelectedBranch(b.id)}
                                        style={[styles.branchChip, selectedBranch === b.id && { backgroundColor: '#EDE9FE' }]}
                                        selectedColor="#7C3AED"
                                    >
                                        {b.name}
                                    </Chip>
                                ))}
                            </ScrollView>
                        </View>
                    </>
                    }
                />
            )}

            <Portal>
                <Dialog
                    visible={dialogVisible}
                    onDismiss={() => { setDialogVisible(false); resetProductForm(); }}
                    style={styles.dialog}
                >
                    <Dialog.Title style={styles.dialogTitle}>
                        {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </Dialog.Title>
                    <Dialog.ScrollArea>
                        <View style={styles.dialogPadding}>
                            <TextInput
                                label="Product Name"
                                value={name}
                                onChangeText={setName}
                                mode="outlined"
                                style={styles.input}
                                activeOutlineColor="#9D4EDD"
                            />
                            <TextInput
                                label="Description"
                                value={description}
                                onChangeText={setDescription}
                                mode="outlined"
                                style={[styles.input, styles.multilineInput]}
                                activeOutlineColor="#9D4EDD"
                                multiline
                                numberOfLines={3}
                            />
                            <TextInput
                                label="Price (₹)"
                                value={price}
                                onChangeText={setPrice}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                activeOutlineColor="#9D4EDD"
                            />
                            <Text style={styles.sectionLabel}>Product Image</Text>
                            <View style={styles.imagePickerContainer}>
                                {selectedImage ? (
                                    <View style={styles.previewContainer}>
                                        <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                                        <TouchableOpacity style={styles.removeBtn} onPress={() => setSelectedImage(null)}>
                                            <Icon source="close-circle" size={24} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ) : editingProduct?.image ? (
                                    <View style={styles.previewContainer}>
                                        <Image source={{ uri: editingProduct.image.startsWith('http') ? editingProduct.image : `${client.defaults.baseURL.replace('/api/', '')}${editingProduct.image}` }} style={styles.previewImage} />
                                        <Button mode="text" textColor="#9D4EDD" onPress={pickImage} style={{ marginTop: 4 }} compact>Change Image</Button>
                                    </View>
                                ) : (
                                    <Button
                                        mode="outlined"
                                        icon="image-plus"
                                        onPress={pickImage}
                                        style={styles.imageBtn}
                                        textColor="#9D4EDD"
                                    >
                                        Select Picture (Optional)
                                    </Button>
                                )}
                            </View>

                            <Text style={styles.sectionLabel}>Category</Text>
                            <TouchableOpacity
                                style={[styles.dropdownAnchor, menuVisible && styles.dropdownAnchorActive]}
                                onPress={() => setMenuVisible((visible) => !visible)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.dropdownValue}>
                                    <Icon
                                        source={selectedCategory ? 'tag-check' : 'tag-outline'}
                                        size={20}
                                        color={selectedCategory ? '#9D4EDD' : '#94A3B8'}
                                    />
                                    <Text
                                        style={selectedCategory ? styles.dropdownSelected : styles.dropdownPlaceholder}
                                        numberOfLines={1}
                                    >
                                        {selectedCategory ? selectedCategory.name : 'Select a category'}
                                    </Text>
                                </View>
                                <Icon source={menuVisible ? 'chevron-up' : 'chevron-down'} size={22} color="#64748B" />
                            </TouchableOpacity>
                            {menuVisible ? (
                                <View style={styles.categoryMenu}>
                                    {categories.length === 0 ? (
                                        <View style={styles.emptyCategoryMenu}>
                                            <Icon source="tag-off-outline" size={28} color="#CBD5E1" />
                                            <Text style={styles.menuEmptyText}>No categories available.</Text>
                                            <Text style={styles.menuEmptyHint}>Add a category first, then create products.</Text>
                                        </View>
                                    ) : (
                                        <ScrollView
                                            style={styles.categoryOptions}
                                            nestedScrollEnabled
                                            keyboardShouldPersistTaps="handled"
                                        >
                                            {categories.map((c) => {
                                                const isSelected = String(category) === String(c.id);

                                                return (
                                                    <TouchableOpacity
                                                        key={c.id}
                                                        style={[styles.categoryOption, isSelected && styles.categoryOptionSelected]}
                                                        onPress={() => { setCategory(c.id); setMenuVisible(false); }}
                                                        activeOpacity={0.8}
                                                    >
                                                        <Icon
                                                            source={isSelected ? 'check-circle' : 'tag-outline'}
                                                            color={isSelected ? '#9D4EDD' : '#64748B'}
                                                            size={22}
                                                        />
                                                        <View style={styles.categoryOptionText}>
                                                            <Text style={[styles.menuItemText, isSelected && styles.menuItemSelected]} numberOfLines={1}>
                                                                {c.name}
                                                            </Text>
                                                            {c.description ? (
                                                                <Text style={styles.categoryOptionDescription} numberOfLines={1}>
                                                                    {c.description}
                                                                </Text>
                                                            ) : null}
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>
                                    )}
                                </View>
                            ) : null}
                        </View>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button
                            onPress={() => { setDialogVisible(false); resetProductForm(); }}
                            textColor="#64748B"
                        >
                            Cancel
                        </Button>
                        <Button mode="contained" onPress={handleSave} buttonColor="#9D4EDD">
                            {editingProduct ? 'Update Product' : 'Save Product'}
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <FAB style={styles.fab} icon="plus" color="#FFFFFF" onPress={openAddDialog} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 16, paddingBottom: 80 },
    statsCard: {
        backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    },
    statsSubtitle: { color: '#64748B', fontSize: 14, fontWeight: '600', marginBottom: 4 },
    statsTitle: { color: '#0F172A', fontSize: 28, fontWeight: 'bold' },
    columnWrapper: { justifyContent: 'space-between', marginBottom: 12 },
    productCard: {
        backgroundColor: '#FFFFFF', borderRadius: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    cardContent: { padding: 12, alignItems: 'center' },
    imagePlaceholder: {
        width: '100%', height: 90, borderRadius: 8, backgroundColor: '#EDE9FE',
        justifyContent: 'center', alignItems: 'center', marginBottom: 8, overflow: 'hidden',
    },
    productImageFull: { width: '100%', height: '100%', resizeMode: 'cover' },
    productName: { fontSize: 12, fontWeight: '700', color: '#1E293B', marginBottom: 4, textAlign: 'center' },
    catChip: { backgroundColor: '#DDD6FE', paddingVertical: 0, height: 20, marginBottom: 6 },
    priceTag: { backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
    priceText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    stockTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: 'transparent' },
    stockText: { fontSize: 10, fontWeight: '800' },
    cardActions: {
        flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
        borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingVertical: 2,
    },
    actionBtn: { margin: 0 },
    dialog: { backgroundColor: '#FFFFFF', borderRadius: 16 },
    dialogTitle: { color: '#1E293B', fontWeight: 'bold' },
    dialogPadding: { paddingHorizontal: 4, paddingTop: 8, paddingBottom: 12 },
    input: { marginBottom: 12, backgroundColor: '#FFFFFF' },
    multilineInput: { minHeight: 80, textAlignVertical: 'top' },
    sectionLabel: { color: '#475569', fontWeight: '700', fontSize: 14, marginBottom: 8 },
    imagePickerContainer: { marginBottom: 20 },
    imageBtn: { borderStyle: 'dashed', borderWidth: 1, borderColor: '#DDD6FE' },
    previewContainer: { position: 'relative', width: '100%', height: 150, borderRadius: 12, overflow: 'hidden' },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    removeBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 12 },
    dropdownAnchor: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8,
        paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FFFFFF',
        marginBottom: 8,
    },
    dropdownAnchorActive: { borderColor: '#9D4EDD', backgroundColor: '#FAF5FF' },
    dropdownValue: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 8 },
    dropdownPlaceholder: { color: '#94A3B8', fontSize: 14 },
    dropdownSelected: { flex: 1, color: '#1E293B', fontSize: 14, fontWeight: '700' },
    categoryMenu: {
        borderWidth: 1, borderColor: '#E9D5FF', borderRadius: 12, backgroundColor: '#FFFFFF',
        marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    categoryOptions: { maxHeight: 220 },
    categoryOption: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 11,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    categoryOptionSelected: { backgroundColor: '#FAF5FF' },
    categoryOptionText: { flex: 1, marginLeft: 10 },
    categoryOptionDescription: { color: '#64748B', fontSize: 12, marginTop: 2 },
    emptyCategoryMenu: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 12 },
    menuItemText: { color: '#1E293B', fontSize: 14 },
    menuItemSelected: { color: '#9D4EDD', fontWeight: '700' },
    menuEmptyText: { color: '#94A3B8', fontSize: 13, fontWeight: '700', marginTop: 8 },
    menuEmptyHint: { color: '#CBD5E1', fontSize: 12, marginTop: 4, textAlign: 'center' },
    branchSelectorSection: { marginBottom: 16 },
    selectorLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, marginLeft: 4 },
    branchList: { flexDirection: 'row' },
    branchChip: { marginRight: 8, backgroundColor: '#FFFFFF' },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#9D4EDD' },
});

export default ProductManagement;
