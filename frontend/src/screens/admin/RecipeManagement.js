import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Text, Button, FAB, Dialog, Portal, TextInput, ActivityIndicator, Chip, Icon } from 'react-native-paper';
import client from '../../api/client';

const RecipeManagement = () => {
    const [ingredients, setIngredients] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Add Ingredient Dialog
    const [ingDialog, setIngDialog] = useState(false);
    const [ingName, setIngName] = useState('');
    const [ingUnit, setIngUnit] = useState('kg');

    // Add Recipe Dialog
    const [recDialog, setRecDialog] = useState(false);
    const [recProduct, setRecProduct] = useState(null);
    const [recIngredient, setRecIngredient] = useState(null);
    const [recQty, setRecQty] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ingRes, recRes, prodRes] = await Promise.all([
                client.get('inventory/ingredients/'),
                client.get('inventory/recipes/'),
                client.get('core/products/')
            ]);
            setIngredients(ingRes.data);
            setRecipes(recRes.data);
            setProducts(prodRes.data);
        } catch (e) {
            console.error('Failed to fetch recipes data', e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateIngredient = async () => {
        try {
            await client.post('inventory/ingredients/', { name: ingName, unit: ingUnit, sku: `ING-${Math.floor(Math.random()*1000)}` });
            setIngDialog(false);
            setIngName('');
            setIngUnit('kg');
            fetchData();
        } catch (e) { console.error(e); }
    };

    const handleCreateRecipe = async () => {
        try {
            await client.post('inventory/recipes/', { product: recProduct, ingredient: recIngredient, quantity: parseFloat(recQty) });
            setRecDialog(false);
            setRecQty('');
            fetchData();
        } catch (e) { console.error(e); }
    };

    return (
        <View style={styles.container}>
            {loading ? <ActivityIndicator style={styles.loader} size="large" color="#F4A261" /> : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.statsCard}>
                        <View>
                            <Text style={styles.statsSubtitle}>Production Backbone</Text>
                            <Text style={styles.statsTitle}>{recipes.length} Formulas</Text>
                        </View>
                        <Icon source="chef-hat" color="#F4A261" size={40} />
                    </View>

                    <Title style={styles.sectionHeader}>Raw Ingredients Catalog</Title>
                    <View style={styles.flexBox}>
                        {ingredients.map(ing => (
                            <Chip key={ing.id} style={styles.itemChip} icon={() => <Icon source="flask" size={14} color="#C2410C" />}>
                                {ing.name} ({ing.unit})
                            </Chip>
                        ))}
                    </View>
                    <Button icon="plus" mode="outlined" onPress={() => setIngDialog(true)} style={styles.addBtn} textColor="#C2410C">Add Ingredient</Button>

                    <Title style={styles.sectionHeader}>Defined Product Recipes</Title>
                    {products.filter(p => recipes.some(r => r.product === p.id)).map(product => (
                        <Card key={product.id} style={styles.recipeCard}>
                            <Card.Title title={product.name} left={(props) => <Icon source="card-text-outline" {...props} color="#F4A261" />} />
                            <Card.Content>
                                {recipes.filter(r => r.product === product.id).map(r => {
                                    const ing = ingredients.find(i => i.id === r.ingredient);
                                    return (
                                        <View key={r.id} style={styles.recipeRow}>
                                            <Text style={styles.recipeItemName}>• {ing?.name}</Text>
                                            <Text style={styles.recipeItemQty}>{r.quantity} {ing?.unit}</Text>
                                        </View>
                                    );
                                })}
                            </Card.Content>
                        </Card>
                    ))}
                    
                </ScrollView>
            )}

            {/* Ingredient Dialog */}
            <Portal>
                <Dialog visible={ingDialog} onDismiss={() => setIngDialog(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>New Ingredient</Dialog.Title>
                    <Dialog.Content>
                        <TextInput label="Ingredient Name" value={ingName} onChangeText={setIngName} mode="outlined" style={styles.input} activeOutlineColor="#F4A261" />
                        <TextInput label="Unit (e.g. kg, gram, liters)" value={ingUnit} onChangeText={setIngUnit} mode="outlined" style={styles.input} activeOutlineColor="#F4A261" />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setIngDialog(false)}>Cancel</Button>
                        <Button mode="contained" onPress={handleCreateIngredient} buttonColor="#F4A261">Save</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Recipe Form Dialog */}
            <Portal>
                <Dialog visible={recDialog} onDismiss={() => setRecDialog(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Link Recipe Formulation</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.label}>Select Product:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                            {products.map(p => <Chip key={p.id} selected={recProduct === p.id} onPress={() => setRecProduct(p.id)} style={styles.selectChip} selectedColor="#F4A261">{p.name}</Chip>)}
                        </ScrollView>

                        <Text style={styles.label}>Select Ingredient:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                            {ingredients.map(i => <Chip key={i.id} selected={recIngredient === i.id} onPress={() => setRecIngredient(i.id)} style={styles.selectChip} selectedColor="#F4A261">{i.name}</Chip>)}
                        </ScrollView>

                        <TextInput label="Quantity Required (per unit)" value={recQty} onChangeText={setRecQty} keyboardType="numeric" mode="outlined" style={styles.input} activeOutlineColor="#F4A261" />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setRecDialog(false)}>Cancel</Button>
                        <Button mode="contained" onPress={handleCreateRecipe} buttonColor="#F4A261">Add Recipe Link</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <FAB style={styles.fab} icon="pot-mix" color="#FFFFFF" onPress={() => setRecDialog(true)} label="Add Recipe Line" />
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
    sectionHeader: { fontSize: 18, fontWeight: '700', color: '#334155', marginTop: 10, marginBottom: 12 },
    flexBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    itemChip: { backgroundColor: '#FFEDD5', marginBottom: 8 },
    addBtn: { borderColor: '#FDBA74', alignSelf: 'flex-start', marginTop: 4, marginBottom: 20 },
    recipeCard: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 12 },
    recipeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    recipeItemName: { color: '#475569', fontSize: 15 },
    recipeItemQty: { color: '#0F172A', fontWeight: 'bold' },
    dialog: { backgroundColor: '#FFFFFF', borderRadius: 16 },
    dialogTitle: { color: '#1E293B', fontWeight: 'bold' },
    input: { marginBottom: 12, backgroundColor: '#FFFFFF' },
    label: { marginTop: 8, marginBottom: 8, color: '#475569', fontWeight: 'bold', fontSize: 14 },
    chipScroll: { flexDirection: 'row', marginBottom: 10 },
    selectChip: { marginRight: 8, backgroundColor: '#F1F5F9' },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#F4A261' }
});

export default RecipeManagement;
