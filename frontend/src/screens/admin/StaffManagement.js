import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Text, Button, FAB, Dialog, Portal, TextInput, ActivityIndicator, Chip, Icon } from 'react-native-paper';
import client from '../../api/client';

const StaffManagement = () => {
    const [users, setUsers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    
    // New User State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('MANAGER');
    const [branch, setBranch] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, branchRes] = await Promise.all([
                client.get('users/management/'),
                client.get('core/branches/')
            ]);
            setUsers(usersRes.data);
            setBranches(branchRes.data);
        } catch (e) {
            console.error('Failed to fetch staff data', e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            await client.post('users/register/', { username, password, role, branch });
            setDialogVisible(false);
            setUsername('');
            setPassword('');
            fetchData();
        } catch (e) {
            console.error('Failed to create user', e);
        }
    };

    const getRoleColor = (r) => {
        if (r === 'ADMIN') return '#EF4444';
        if (r === 'MANAGER') return '#3B82F6';
        if (r === 'BAKER') return '#F59E0B';
        return '#10B981'; // CUSTOMER
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator style={styles.loader} size="large" />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.statsCard}>
                        <View>
                            <Text style={styles.statsSubtitle}>Organization Members</Text>
                            <Text style={styles.statsTitle}>{users.length} Staff</Text>
                        </View>
                        <Icon source="account-group" color="#4D96FF" size={40} />
                    </View>

                    {users.map(user => (
                        <Card key={user.id} style={styles.userCard}>
                            <Card.Content style={styles.cardContent}>
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
                                </View>
                                <View style={styles.userInfo}>
                                    <Title style={styles.username}>{user.username}</Title>
                                    <View style={styles.badgeRow}>
                                        <Chip style={[styles.roleChip, { backgroundColor: `${getRoleColor(user.role)}20` }]} textStyle={{ color: getRoleColor(user.role), fontSize: 10, fontWeight: 'bold' }}>
                                            {user.role}
                                        </Chip>
                                        <View style={styles.infoItem}>
                                            <View style={{ marginRight: 4 }}><Icon source="store" color="#64748B" size={14} /></View>
                                            <Text style={styles.infoText}>{user.branch ? branches.find(b => b.id === user.branch)?.name : 'Internal (HQ)'}</Text>
                                        </View>
                                    </View>
                                </View>
                            </Card.Content>
                        </Card>
                    ))}
                </ScrollView>
            )}

            <Portal>
                <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>Register Staff Member</Dialog.Title>
                    <Dialog.Content>
                        <TextInput label="Username" value={username} onChangeText={setUsername} mode="outlined" style={styles.input} activeOutlineColor="#4D96FF" />
                        <TextInput label="Password" value={password} onChangeText={setPassword} mode="outlined" secureTextEntry style={styles.input} activeOutlineColor="#4D96FF" />
                        
                        <Text style={styles.sectionLabel}>Select Role:</Text>
                        <View style={styles.chipGroup}>
                            {['ADMIN', 'MANAGER', 'BAKER'].map(r => (
                                <Chip key={r} selected={role === r} onPress={() => setRole(r)} style={styles.selectChip} selectedColor="#4D96FF">
                                    {r}
                                </Chip>
                            ))}
                        </View>

                        {branches.length > 0 && (
                            <>
                                <Text style={styles.sectionLabel}>Assign to Branch:</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.branchScroll}>
                                    <Chip selected={branch === null} onPress={() => setBranch(null)} style={styles.selectChip} selectedColor="#4D96FF">HQ / None</Chip>
                                    {branches.map(b => (
                                        <Chip key={b.id} selected={branch === b.id} onPress={() => setBranch(b.id)} style={styles.selectChip} selectedColor="#4D96FF">
                                            {b.name}
                                        </Chip>
                                    ))}
                                </ScrollView>
                            </>
                        )}
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(false)} textColor="#64748B">Cancel</Button>
                        <Button mode="contained" onPress={handleCreate} buttonColor="#4D96FF">Create User</Button>
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
    userCard: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardContent: { padding: 16, flexDirection: 'row', alignItems: 'center' },
    avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    avatarText: { fontSize: 20, fontWeight: 'bold', color: '#4D96FF' },
    userInfo: { flex: 1 },
    username: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 4, lineHeight: 22 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    roleChip: { height: 24, paddingVertical: 0 },
    infoItem: { flexDirection: 'row', alignItems: 'center' },
    infoText: { color: '#64748B', fontSize: 13 },
    dialog: { backgroundColor: '#FFFFFF', borderRadius: 16 },
    dialogTitle: { color: '#1E293B', fontWeight: 'bold' },
    input: { marginBottom: 12, backgroundColor: '#FFFFFF' },
    sectionLabel: { marginTop: 12, marginBottom: 8, color: '#475569', fontWeight: 'bold', fontSize: 14 },
    chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    branchScroll: { flexDirection: 'row' },
    selectChip: { marginRight: 8, backgroundColor: '#F1F5F9' },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#4D96FF' }
});

export default StaffManagement;
