import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Text, Button, List, FAB, Dialog, Portal, TextInput, ActivityIndicator, Icon } from 'react-native-paper';
import client from '../../api/client';

const BranchManagement = () => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    
    // New Branch State
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const res = await client.get('core/branches/');
            setBranches(res.data);
        } catch (e) {
            console.error('Failed to fetch branches', e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            await client.post('core/branches/', { name, location, is_active: true });
            setDialogVisible(false);
            setName('');
            setLocation('');
            fetchBranches();
        } catch (e) {
            console.error('Failed to create branch', e);
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
                            <Text style={styles.statsSubtitle}>Total Operational</Text>
                            <Text style={styles.statsTitle}>{branches.length} Branches</Text>
                        </View>
                        <Icon source="store" color="#FF7B54" size={40} />
                    </View>

                    {branches.map(branch => (
                        <Card key={branch.id} style={styles.branchCard}>
                            <Card.Content style={styles.cardContent}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.titleRow}>
                                        <View style={{ marginRight: 8 }}><Icon source="store" color="#334155" size={20} /></View>
                                        <Title style={styles.branchName}>{branch.name}</Title>
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: branch.is_active ? '#D1FAE5' : '#FEE2E2' }]}>
                                        <Text style={{ color: branch.is_active ? '#065F46' : '#991B1B', fontSize: 12, fontWeight: '600' }}>
                                            {branch.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.locationRow}>
                                    <View style={{ marginRight: 6 }}><Icon source="map-marker" color="#64748B" size={16} /></View>
                                    <Text style={styles.locationText}>{branch.location}</Text>
                                </View>
                            </Card.Content>
                        </Card>
                    ))}
                </ScrollView>
            )}

            <Portal>
                <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Add New Branch</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Branch Name"
                            value={name}
                            onChangeText={setName}
                            mode="outlined"
                            style={styles.input}
                            activeOutlineColor="#FF7B54"
                        />
                        <TextInput
                            label="Location Context"
                            value={location}
                            onChangeText={setLocation}
                            mode="outlined"
                            style={styles.input}
                            activeOutlineColor="#FF7B54"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(false)} textColor="#64748B">Cancel</Button>
                        <Button mode="contained" onPress={handleCreate} buttonColor="#FF7B54">Create Branch</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <FAB
                style={styles.fab}
                icon="plus"
                color="#FFFFFF"
                onPress={() => setDialogVisible(true)}
            />
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
        marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3
    },
    statsSubtitle: { color: '#64748B', fontSize: 14, fontWeight: '600', marginBottom: 4 },
    statsTitle: { color: '#0F172A', fontSize: 28, fontWeight: 'bold' },
    branchCard: { 
        backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
    },
    cardContent: { padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    titleRow: { flexDirection: 'row', alignItems: 'center' },
    branchName: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    locationRow: { flexDirection: 'row', alignItems: 'center' },
    locationText: { color: '#64748B', fontSize: 14 },
    dialog: { backgroundColor: '#FFFFFF', borderRadius: 16 },
    dialogTitle: { color: '#1E293B', fontWeight: 'bold' },
    input: { marginBottom: 12, backgroundColor: '#FFFFFF' },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#FF7B54' }
});

export default BranchManagement;
