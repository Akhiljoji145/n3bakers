import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
    Card, Title, Text, Button, Dialog, Portal, TextInput,
    ActivityIndicator, Icon, FAB, Snackbar, IconButton, Divider
} from 'react-native-paper';
import client from '../../api/client';

const normalizeList = (data) => Array.isArray(data) ? data : data?.results || [];

const CategoryManagement = ({ onCatalogChange }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);

    // Edit state
    const [editingCategory, setEditingCategory] = useState(null);

    const [categoryName, setCategoryName] = useState('');
    const [categoryDescription, setCategoryDescription] = useState('');
    const [message, setMessage] = useState({ visible: false, text: '', error: false });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await client.get('core/categories/');
            setCategories(normalizeList(res.data));
        } catch (e) {
            console.error('Failed to fetch categories', e);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setCategoryName('');
        setCategoryDescription('');
        setEditingCategory(null);
    };

    const showMessage = (text, error = false) => {
        setMessage({ visible: true, text, error });
    };

    const openAddDialog = () => {
        resetForm();
        setDialogVisible(true);
    };

    const openEditDialog = (cat) => {
        setEditingCategory(cat);
        setCategoryName(cat.name);
        setCategoryDescription(cat.description || '');
        setDialogVisible(true);
    };

    const getErrorMessage = (error) => {
        const data = error.response?.data;
        if (error.response?.status === 401) return 'Your session expired. Please sign in again.';
        if (error.response?.status === 403) return 'You do not have permission to manage categories.';
        if (typeof data === 'string') return data;
        if (data?.name?.length) return data.name[0];
        if (data?.detail) return data.detail;
        return 'Failed to save category.';
    };

    const handleSave = async () => {
        const trimmedName = categoryName.trim();
        if (!trimmedName) {
            showMessage('Category name is required.', true);
            return;
        }

        setSaving(true);
        try {
            if (editingCategory) {
                await client.patch(`core/categories/${editingCategory.id}/`, {
                    name: trimmedName,
                    description: categoryDescription.trim(),
                });
                showMessage('Category updated successfully.');
            } else {
                await client.post('core/categories/', {
                    name: trimmedName,
                    description: categoryDescription.trim(),
                });
                showMessage('Category saved successfully.');
            }
            await fetchCategories();
            onCatalogChange?.();
            setDialogVisible(false);
            resetForm();
        } catch (e) {
            console.error('Failed to save category', e);
            showMessage(getErrorMessage(e), true);
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (cat) => {
        Alert.alert(
            'Delete Category',
            `Delete "${cat.name}"? All products in this category will also be deleted. This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        try {
                            await client.delete(`core/categories/${cat.id}/`);
                            showMessage('Category and its products deleted.');
                            await fetchCategories();
                            onCatalogChange?.();
                        } catch (e) {
                            console.error('Failed to delete category', e);
                            showMessage('Could not delete category. It may be in use.', true);
                        }
                    }
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator style={styles.loader} size="large" />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    {/* Stats header */}
                    <View style={styles.statsCard}>
                        <View>
                            <Text style={styles.statsSubtitle}>Bakery Menu</Text>
                            <Text style={styles.statsTitle}>{categories.length} Categories</Text>
                        </View>
                        <Icon source="tag-multiple" color="#7C3AED" size={40} />
                    </View>

                    {/* Category list */}
                    {categories.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Icon source="tag-off-outline" color="#CBD5E1" size={48} />
                            <Text style={styles.emptyText}>No categories yet.</Text>
                            <Text style={styles.emptyHint}>Add categories like Breads, Cakes, Pastries…</Text>
                        </View>
                    ) : (
                        categories.map((cat, index) => (
                            <React.Fragment key={cat.id}>
                                <View style={styles.catRow}>
                                    <View style={styles.catIcon}>
                                        <Icon source="tag" color="#7C3AED" size={20} />
                                    </View>
                                    <View style={styles.catInfo}>
                                        <Text style={styles.catName}>{cat.name}</Text>
                                        {cat.description ? (
                                            <Text style={styles.catDesc} numberOfLines={1}>{cat.description}</Text>
                                        ) : null}
                                    </View>
                                    <View style={styles.catActions}>
                                        <IconButton
                                            icon="pencil-outline"
                                            size={20}
                                            iconColor="#6366F1"
                                            onPress={() => openEditDialog(cat)}
                                            style={styles.iconBtn}
                                        />
                                        <IconButton
                                            icon="delete-outline"
                                            size={20}
                                            iconColor="#EF4444"
                                            onPress={() => confirmDelete(cat)}
                                            style={styles.iconBtn}
                                        />
                                    </View>
                                </View>
                                {index < categories.length - 1 && <Divider style={styles.divider} />}
                            </React.Fragment>
                        ))
                    )}
                </ScrollView>
            )}

            <Portal>
                <Dialog
                    visible={dialogVisible}
                    onDismiss={() => { setDialogVisible(false); resetForm(); }}
                    style={styles.dialog}
                >
                    <Dialog.Title style={styles.dialogTitle}>
                        {editingCategory ? 'Edit Category' : 'Add Category'}
                    </Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Category Name"
                            value={categoryName}
                            onChangeText={setCategoryName}
                            mode="outlined"
                            style={styles.input}
                            activeOutlineColor="#7C3AED"
                        />
                        <TextInput
                            label="Description (optional)"
                            value={categoryDescription}
                            onChangeText={setCategoryDescription}
                            mode="outlined"
                            style={[styles.input, styles.multilineInput]}
                            activeOutlineColor="#7C3AED"
                            multiline
                            numberOfLines={3}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button
                            onPress={() => { setDialogVisible(false); resetForm(); }}
                            disabled={saving}
                            textColor="#64748B"
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleSave}
                            buttonColor="#7C3AED"
                            loading={saving}
                            disabled={saving}
                        >
                            {editingCategory ? 'Update' : 'Save Category'}
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <FAB style={styles.fab} icon="plus" color="#FFFFFF" onPress={openAddDialog} />

            <Snackbar
                visible={message.visible}
                onDismiss={() => setMessage((prev) => ({ ...prev, visible: false }))}
                duration={3500}
                style={message.error ? styles.errorSnackbar : styles.successSnackbar}
            >
                {message.text}
            </Snackbar>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 16, paddingBottom: 100 },
    statsCard: {
        backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    },
    statsSubtitle: { color: '#64748B', fontSize: 14, fontWeight: '600', marginBottom: 4 },
    statsTitle: { color: '#0F172A', fontSize: 28, fontWeight: 'bold' },
    emptyBox: { alignItems: 'center', marginTop: 60, padding: 24 },
    emptyText: { fontSize: 16, color: '#94A3B8', fontWeight: '700', marginTop: 12 },
    emptyHint: { fontSize: 13, color: '#CBD5E1', marginTop: 6, textAlign: 'center' },
    catRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 16,
        borderRadius: 12,
    },
    catIcon: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3E8FF',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    catInfo: { flex: 1 },
    catName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    catDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
    catActions: { flexDirection: 'row', alignItems: 'center' },
    iconBtn: { margin: 0 },
    divider: { backgroundColor: '#F1F5F9', marginHorizontal: 16 },
    dialog: { backgroundColor: '#FFFFFF', borderRadius: 16 },
    dialogTitle: { color: '#1E293B', fontWeight: 'bold' },
    input: { marginBottom: 12, backgroundColor: '#FFFFFF' },
    multilineInput: { minHeight: 80, textAlignVertical: 'top' },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#7C3AED' },
    successSnackbar: { backgroundColor: '#15803D' },
    errorSnackbar: { backgroundColor: '#B91C1C' },
});

export default CategoryManagement;
