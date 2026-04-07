import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Animated, Dimensions } from 'react-native';
import { Card, Title, Text, Button, FAB, Dialog, Portal, TextInput, ActivityIndicator, Chip, Icon } from 'react-native-paper';
import client from '../../api/client';

const ProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    
    // New Product State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prodRes, catRes] = await Promise.all([
                client.get('core/products/'),
                client.get('core/categories/')
            ]);
            setProducts(prodRes.data);
            setCategories(catRes.data);
        } catch (e) {
            console.error('Failed to fetch data', e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
             // In a real app we'd also handle image uploads, but skipping here to keep it MVP
            await client.post('core/products/', { 
                name, 
                description, 
                price: parseFloat(price), 
                category,
                is_available: true
            });
            setDialogVisible(false);
            setName('');
            setDescription('');
            setPrice('');
            fetchData();
        } catch (e) {
            console.error('Failed to create product', e);
        }
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator style={styles.loader} size="large" />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.statsCard}>
                        <View>
                            <Text style={styles.statsSubtitle}>Our Menu Offerings</Text>
                            <Text style={styles.statsTitle}>{products.length} Products</Text>
                        </View>
                        <Icon source="package-variant" color="#9D4EDD" size={40} />
                    </View>

                    {products.map(product => (
                        <Card key={product.id} style={styles.productCard}>
                            <Card.Content style={styles.cardContent}>
                                <View style={styles.productInfoRow}>
                                    <View style={styles.imagePlaceholder}>
                                        <Icon source="package-variant" color="#C4B5FD" size={24} />
                                    </View>
                                    <View style={styles.details}>
                                        <Title style={styles.productName}>{product.name}</Title>
                                        <Chip style={styles.catChip} textStyle={{ color: '#5B21B6', fontSize: 10, fontWeight: '700' }}>
                                            {categories.find(c => c.id === product.category)?.name || 'Uncategorized'}
                                        </Chip>
                                    </View>
                                    <View style={styles.priceTag}>
                                        <Text style={styles.priceText}>${product.price}</Text>
                                    </View>
                                </View>
                            </Card.Content>
                        </Card>
                    ))}
                </ScrollView>
            )}

            <Portal>
                <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Add New Product</Dialog.Title>
                    <Dialog.Content>
                        <TextInput label="Product Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} activeOutlineColor="#9D4EDD" />
                        <TextInput label="Description" value={description} onChangeText={setDescription} mode="outlined" style={styles.input} activeOutlineColor="#9D4EDD" multiline numberOfLines={2} />
                        <TextInput label="Price ($)" value={price} onChangeText={setPrice} mode="outlined" keyboardType="numeric" style={styles.input} activeOutlineColor="#9D4EDD" />
                        
                        <Text style={styles.sectionLabel}>Select Category:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                            {categories.map(c => (
                                <Chip key={c.id} selected={category === c.id} onPress={() => setCategory(c.id)} style={styles.selectChip} selectedColor="#9D4EDD">
                                    {c.name}
                                </Chip>
                            ))}
                        </ScrollView>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(false)} textColor="#64748B">Cancel</Button>
                        <Button mode="contained" onPress={handleCreate} buttonColor="#9D4EDD">Save Product</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <FAB style={styles.fab} icon="plus" color="#FFFFFF" onPress={() => setDialogVisible(true)} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 16, paddingBottom: 80 },
    statsCard: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    statsSubtitle: { color: '#64748B', fontSize: 14, fontWeight: '600', marginBottom: 4 },
    statsTitle: { color: '#0F172A', fontSize: 28, fontWeight: 'bold' },
    productCard: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardContent: { padding: 16 },
    productInfoRow: { flexDirection: 'row', alignItems: 'center' },
    imagePlaceholder: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    details: { flex: 1 },
    productName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4, lineHeight: 20 },
    catChip: { backgroundColor: '#DDD6FE', alignSelf: 'flex-start', height: 24, paddingVertical: 0 },
    priceTag: { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    priceText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
    dialog: { backgroundColor: '#FFFFFF', borderRadius: 16 },
    dialogTitle: { color: '#1E293B', fontWeight: 'bold' },
    input: { marginBottom: 12, backgroundColor: '#FFFFFF' },
    sectionLabel: { marginTop: 8, marginBottom: 8, color: '#475569', fontWeight: 'bold', fontSize: 14 },
    chipScroll: { flexDirection: 'row', marginBottom: 10 },
    selectChip: { marginRight: 8, backgroundColor: '#F1F5F9' },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#9D4EDD' }
});

export default ProductManagement;
