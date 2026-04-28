import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
    Card, Title, Text, Button, FAB, Dialog, Portal,
    TextInput, ActivityIndicator, Icon, IconButton, Chip, Divider, Switch
} from 'react-native-paper';
import client from '../../api/client';

const BranchManagement = () => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [saving, setSaving] = useState(false);

    // Edit state
    const [editingBranch, setEditingBranch] = useState(null);

    // Form state
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [managerEmail, setManagerEmail] = useState('');
    const [managerPassword, setManagerPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

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

    const resetForm = () => {
        setName('');
        setLocation('');
        setIsActive(true);
        setManagerEmail('');
        setManagerPassword('');
        setConfirmPassword('');
        setEditingBranch(null);
    };

    const openAddDialog = () => {
        resetForm();
        setDialogVisible(true);
    };

    const openEditDialog = (branch) => {
        setEditingBranch(branch);
        setName(branch.name);
        setLocation(branch.location || '');
        setIsActive(branch.is_active);
        setDialogVisible(true);
    };

    const handleSave = async () => {
        if (!name.trim()) return;

        if (!editingBranch) {
            if (!managerEmail.trim() || !managerPassword || !confirmPassword) {
                Alert.alert('Validation Error', 'Please fill in all manager details for the new branch.');
                return;
            }
            if (managerPassword !== confirmPassword) {
                Alert.alert('Validation Error', 'Passwords do not match.');
                return;
            }
        }

        setSaving(true);
        try {
            if (editingBranch) {
                await client.patch(`core/branches/${editingBranch.id}/`, {
                    name: name.trim(),
                    location: location.trim(),
                    is_active: isActive,
                });
            } else {
                await client.post('core/branches/', {
                    name: name.trim(),
                    location: location.trim(),
                    is_active: true,
                    manager_email: managerEmail.trim(),
                    manager_password: managerPassword,
                });
            }
            setDialogVisible(false);
            resetForm();
            await fetchBranches();
        } catch (e) {
            console.error('Failed to save branch', e);
            Alert.alert('Error', 'Could not save the branch. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (branch) => {
        Alert.alert(
            'Delete Branch',
            `Delete "${branch.name}"? This may affect staff assignments and orders.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        try {
                            await client.delete(`core/branches/${branch.id}/`);
                            await fetchBranches();
                        } catch (e) {
                            console.error('Failed to delete branch', e);
                            Alert.alert('Error', 'Could not delete this branch. It may have active orders or staff.');
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
                    {/* Summary header */}
                    <View style={styles.statsCard}>
                        <View>
                            <Text style={styles.statsSubtitle}>Total Operational</Text>
                            <Text style={styles.statsTitle}>{branches.length} Branches</Text>
                        </View>
                        <Icon source="store" color="#FF7B54" size={40} />
                    </View>

                    {branches.map((branch) => (
                        <Card key={branch.id} style={styles.branchCard}>
                            <Card.Content style={styles.cardContent}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.titleRow}>
                                        <View style={styles.storeIcon}>
                                            <Icon source="store" color="#FF7B54" size={20} />
                                        </View>
                                        <View style={styles.branchInfo}>
                                            <Title style={styles.branchName}>{branch.name}</Title>
                                            <View style={styles.locationRow}>
                                                <Icon source="map-marker" color="#64748B" size={14} />
                                                <Text style={styles.locationText}> {branch.location || 'No location set'}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: branch.is_active ? '#D1FAE5' : '#FEE2E2' }]}>
                                        <Text style={{ color: branch.is_active ? '#065F46' : '#991B1B', fontSize: 11, fontWeight: '700' }}>
                                            {branch.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </Text>
                                    </View>
                                </View>
                            </Card.Content>
                            <View style={styles.cardActions}>
                                <IconButton
                                    icon="pencil-outline"
                                    size={20}
                                    iconColor="#6366F1"
                                    onPress={() => openEditDialog(branch)}
                                    style={styles.actionBtn}
                                />
                                <Divider style={styles.vertDivider} />
                                <IconButton
                                    icon="delete-outline"
                                    size={20}
                                    iconColor="#EF4444"
                                    onPress={() => confirmDelete(branch)}
                                    style={styles.actionBtn}
                                />
                            </View>
                        </Card>
                    ))}
                </ScrollView>
            )}

            <Portal>
                <Dialog
                    visible={dialogVisible}
                    onDismiss={() => { setDialogVisible(false); resetForm(); }}
                    style={styles.dialog}
                >
                    <Dialog.Title style={styles.dialogTitle}>
                        {editingBranch ? 'Edit Branch' : 'Add New Branch'}
                    </Dialog.Title>
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
                            label="Location / Address"
                            value={location}
                            onChangeText={setLocation}
                            mode="outlined"
                            style={styles.input}
                            activeOutlineColor="#FF7B54"
                        />
                        {editingBranch ? (
                            <View style={styles.switchRow}>
                                <Text style={styles.switchLabel}>Branch is Active</Text>
                                <Switch
                                    value={isActive}
                                    onValueChange={setIsActive}
                                    color="#FF7B54"
                                />
                            </View>
                        ) : (
                            <>
                                <TextInput
                                    label="Manager Email"
                                    value={managerEmail}
                                    onChangeText={setManagerEmail}
                                    mode="outlined"
                                    style={styles.input}
                                    activeOutlineColor="#FF7B54"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                                <TextInput
                                    label="Manager Password"
                                    value={managerPassword}
                                    onChangeText={setManagerPassword}
                                    mode="outlined"
                                    style={styles.input}
                                    activeOutlineColor="#FF7B54"
                                    secureTextEntry
                                />
                                <TextInput
                                    label="Confirm Password"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    mode="outlined"
                                    style={styles.input}
                                    activeOutlineColor="#FF7B54"
                                    secureTextEntry
                                />
                            </>
                        )}
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button
                            onPress={() => { setDialogVisible(false); resetForm(); }}
                            textColor="#64748B"
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleSave}
                            buttonColor="#FF7B54"
                            loading={saving}
                            disabled={saving}
                        >
                            {editingBranch ? 'Update Branch' : 'Create Branch'}
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
    scroll: { padding: 16, paddingBottom: 100 },
    statsCard: {
        backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    },
    statsSubtitle: { color: '#64748B', fontSize: 14, fontWeight: '600', marginBottom: 4 },
    statsTitle: { color: '#0F172A', fontSize: 28, fontWeight: 'bold' },
    branchCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
    },
    cardContent: { padding: 16, paddingBottom: 8 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    storeIcon: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF0EB',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    branchInfo: { flex: 1 },
    branchName: { fontSize: 17, fontWeight: '700', color: '#1E293B', lineHeight: 22 },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    locationText: { color: '#64748B', fontSize: 13 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
    cardActions: {
        flexDirection: 'row', justifyContent: 'flex-end',
        borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingRight: 4,
    },
    actionBtn: { margin: 0 },
    vertDivider: { width: 1, height: '60%', alignSelf: 'center', backgroundColor: '#E2E8F0' },
    dialog: { backgroundColor: '#FFFFFF', borderRadius: 16 },
    dialogTitle: { color: '#1E293B', fontWeight: 'bold' },
    input: { marginBottom: 12, backgroundColor: '#FFFFFF' },
    switchRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 4, paddingVertical: 8,
        borderTopWidth: 1, borderTopColor: '#F1F5F9',
    },
    switchLabel: { fontSize: 15, color: '#1E293B', fontWeight: '600' },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#FF7B54' },
});

export default BranchManagement;
