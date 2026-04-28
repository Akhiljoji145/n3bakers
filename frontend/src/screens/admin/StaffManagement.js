import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import {
    Text, Button, FAB, Dialog, Portal,
    TextInput, ActivityIndicator, Chip, Icon, IconButton, Divider
} from 'react-native-paper';
import client from '../../api/client';

const ROLES = ['ADMIN', 'MANAGER', 'BAKER'];

const ROLE_META = {
    ADMIN:    { color: '#EF4444', bg: '#FEF2F2', icon: 'shield-crown',   desc: 'Full system access' },
    MANAGER:  { color: '#2563EB', bg: '#EFF6FF', icon: 'briefcase',      desc: 'Branch operations' },
    BAKER:    { color: '#D97706', bg: '#FFFBEB', icon: 'chef-hat',       desc: 'Kitchen & baking' },
    CUSTOMER: { color: '#10B981', bg: '#ECFDF5', icon: 'account',        desc: 'Customer account' },
};

const getRoleMeta = (role) => ROLE_META[role] || { color: '#94A3B8', bg: '#F1F5F9', icon: 'account', desc: '' };

const StaffManagement = () => {
    const [users, setUsers]       = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading]   = useState(false);
    const [saving, setSaving]     = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [activeFilter, setActiveFilter]   = useState('ALL');
    const [editingUser, setEditingUser]     = useState(null);

    // Form
    const [username, setUsername]       = useState('');
    const [email, setEmail]             = useState('');
    const [password, setPassword]       = useState('');
    const [role, setRole]               = useState('MANAGER');
    const [secondaryRole, setSecondaryRole] = useState(null);
    const [branch, setBranch]           = useState(null);
    const [showPass, setShowPass]       = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, branchRes] = await Promise.all([
                client.get('users/management/'),
                client.get('core/branches/'),
            ]);
            setUsers(usersRes.data);
            setBranches(branchRes.data);
        } catch (e) {
            console.error('Failed to fetch staff data', e);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setUsername('');
        setEmail('');
        setPassword('');
        setRole('MANAGER');
        setSecondaryRole(null);
        setBranch(null);
        setShowPass(false);
        setEditingUser(null);
    };

    const openAddDialog = () => { resetForm(); setDialogVisible(true); };

    const openEditDialog = (user) => {
        setEditingUser(user);
        setUsername(user.username);
        setEmail(user.email || '');
        setPassword(''); // Blank means do not update
        setRole(user.role);
        setSecondaryRole(user.secondary_role || null);
        setBranch(user.branch || null);
        setDialogVisible(true);
    };

    const handleSave = async () => {
        if (!username.trim() || (!editingUser && !password.trim())) {
            Alert.alert('Required', 'Username and password cannot be empty for new users.');
            return;
        }
        setSaving(true);
        try {
            const payload = { 
                username: username.trim(), 
                email: email.trim(),
                role, 
                secondary_role: secondaryRole || null, 
                branch 
            };
            if (password.trim()) payload.password = password;

            if (editingUser) {
                await client.patch(`users/management/${editingUser.id}/`, payload);
            } else {
                await client.post('users/register/', payload);
            }
            setDialogVisible(false);
            resetForm();
            await fetchData();
        } catch (e) {
            console.error('Failed to save user', e);
            Alert.alert('Error', 'Could not save staff member. Username may already exist.');
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (user) => {
        Alert.alert(
            `Remove ${user.username}?`,
            `This will revoke all access for "${user.username}". This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove', style: 'destructive', onPress: async () => {
                        try {
                            await client.delete(`users/management/${user.id}/`);
                            await fetchData();
                        } catch (e) {
                            Alert.alert('Error', 'Could not remove this staff member.');
                        }
                    }
                },
            ]
        );
    };

    // Filtered list
    const displayUsers = activeFilter === 'ALL'
        ? users
        : users.filter(u => u.role === activeFilter);

    // Stats per role
    const roleCounts = ROLES.reduce((acc, r) => ({ ...acc, [r]: users.filter(u => u.role === r).length }), {});

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#4D96FF" />
                    <Text style={styles.loadingText}>Loading staff…</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* ── Hero stats card ── */}
                    <View style={styles.heroCard}>
                        <View>
                            <Text style={styles.heroLabel}>Organization Members</Text>
                            <Text style={styles.heroCount}>{users.length} Staff</Text>
                        </View>
                        <Icon source="account-group" color="#4D96FF" size={44} />
                    </View>

                    {/* ── Role breakdown ── */}
                    <View style={styles.roleGrid}>
                        {ROLES.map(r => {
                            const meta  = getRoleMeta(r);
                            const count = roleCounts[r] || 0;
                            const isActive = activeFilter === r;
                            return (
                                <TouchableOpacity
                                    key={r}
                                    style={[styles.roleCard, { borderColor: isActive ? meta.color : 'transparent', borderWidth: 2, backgroundColor: meta.bg }]}
                                    onPress={() => setActiveFilter(isActive ? 'ALL' : r)}
                                    activeOpacity={0.75}
                                >
                                    <Icon source={meta.icon} color={meta.color} size={22} />
                                    <Text style={[styles.roleCardCount, { color: meta.color }]}>{count}</Text>
                                    <Text style={[styles.roleCardLabel, { color: meta.color }]}>{r}</Text>
                                    <Text style={styles.roleCardDesc}>{meta.desc}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* ── Filter bar ── */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {activeFilter === 'ALL' ? 'All Staff' : `${activeFilter}S`}
                        </Text>
                        <Text style={styles.sectionCount}>{displayUsers.length} member{displayUsers.length !== 1 ? 's' : ''}</Text>
                    </View>

                    {/* ── Staff list ── */}
                    {displayUsers.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Icon source="account-off-outline" color="#CBD5E1" size={48} />
                            <Text style={styles.emptyText}>No {activeFilter === 'ALL' ? 'staff' : activeFilter.toLowerCase() + 's'} yet.</Text>
                        </View>
                    ) : (
                        <View style={styles.listCard}>
                            {displayUsers.map((user, index) => {
                                const meta        = getRoleMeta(user.role);
                                const branchName  = user.branch ? branches.find(b => b.id === user.branch)?.name : null;
                                const initial     = user.username.charAt(0).toUpperCase();

                                return (
                                    <React.Fragment key={user.id}>
                                        <View style={styles.staffRow}>
                                            {/* Avatar */}
                                            <View style={[styles.avatar, { backgroundColor: meta.bg }]}>
                                                <Text style={[styles.avatarText, { color: meta.color }]}>{initial}</Text>
                                            </View>

                                            {/* Info block */}
                                            <View style={styles.staffInfo}>
                                                <Text style={styles.staffName}>{user.username}</Text>
                                                {user.email ? (
                                                    <View style={styles.emailRow}>
                                                        <Icon source="email-outline" color="#94A3B8" size={12} />
                                                        <Text style={styles.staffEmail}>{user.email}</Text>
                                                    </View>
                                                ) : null}
                                                <View style={styles.rolePills}>
                                                    <View style={[styles.rolePill, { backgroundColor: meta.bg }]}>
                                                        <Icon source={meta.icon} color={meta.color} size={12} />
                                                        <Text style={[styles.rolePillText, { color: meta.color }]}>{user.role}</Text>
                                                    </View>
                                                    {user.secondary_role && (() => {
                                                        const sec = getRoleMeta(user.secondary_role);
                                                        return (
                                                            <View style={[styles.rolePill, { backgroundColor: sec.bg }]}>
                                                                <Icon source={sec.icon} color={sec.color} size={12} />
                                                                <Text style={[styles.rolePillText, { color: sec.color }]}>{user.secondary_role}</Text>
                                                            </View>
                                                        );
                                                    })()}
                                                </View>
                                                <View style={styles.staffMeta}>
                                                    <View style={styles.metaItem}>
                                                        <Icon source="store-outline" color="#94A3B8" size={13} />
                                                        <Text style={styles.metaText}>
                                                            {branchName || 'Head Office'}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.metaDot} />
                                                    <View style={styles.metaItem}>
                                                        <Icon source="information-outline" color="#94A3B8" size={13} />
                                                        <Text style={styles.metaText}>{meta.desc}</Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* Actions — grouped in a column on the right */}
                                            <View style={styles.actionCol}>
                                                <IconButton
                                                    icon="pencil-outline"
                                                    size={18}
                                                    iconColor="#4D96FF"
                                                    onPress={() => openEditDialog(user)}
                                                    style={styles.actionBtn}
                                                />
                                                <IconButton
                                                    icon="delete-outline"
                                                    size={18}
                                                    iconColor="#EF4444"
                                                    onPress={() => confirmDelete(user)}
                                                    style={styles.actionBtn}
                                                />
                                            </View>
                                        </View>
                                        {index < displayUsers.length - 1 && (
                                            <Divider style={styles.rowDivider} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>
            )}

            {/* ── Add Staff Dialog ── */}
            <Portal>
                <Dialog visible={dialogVisible} onDismiss={() => { setDialogVisible(false); resetForm(); }} style={styles.dialog}>
                    <Dialog.Title style={styles.dialogTitle}>{editingUser ? 'Edit Staff Member' : 'Register Staff Member'}</Dialog.Title>
                    <Dialog.ScrollArea>
                        <ScrollView contentContainerStyle={styles.dialogPadding}>
                            <TextInput
                                label="Username"
                                value={username}
                                onChangeText={setUsername}
                                mode="outlined"
                                style={styles.input}
                                activeOutlineColor="#4D96FF"
                                autoCapitalize="none"
                            />
                            <TextInput
                                label="Email Address"
                                value={email}
                                onChangeText={setEmail}
                                mode="outlined"
                                style={styles.input}
                                activeOutlineColor="#4D96FF"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <TextInput
                                label="Password"
                                value={password}
                                onChangeText={setPassword}
                                mode="outlined"
                                secureTextEntry={!showPass}
                                style={styles.input}
                                activeOutlineColor="#4D96FF"
                                right={
                                    <TextInput.Icon
                                        icon={showPass ? 'eye-off' : 'eye'}
                                        onPress={() => setShowPass(v => !v)}
                                    />
                                }
                            />

                            <Text style={styles.fieldLabel}>Primary Role</Text>
                            <View style={styles.roleSelector}>
                                {ROLES.map(r => {
                                    const meta     = getRoleMeta(r);
                                    const selected = role === r;
                                    return (
                                        <TouchableOpacity
                                            key={r}
                                            style={[styles.roleSelectorItem, selected && { backgroundColor: meta.bg, borderColor: meta.color }]}
                                            onPress={() => {
                                                setRole(r);
                                                // Clear secondary if same
                                                if (secondaryRole === r) setSecondaryRole(null);
                                            }}
                                            activeOpacity={0.75}
                                        >
                                            <Icon source={meta.icon} color={selected ? meta.color : '#94A3B8'} size={20} />
                                            <Text style={[styles.roleSelectorText, selected && { color: meta.color, fontWeight: '700' }]}>{r}</Text>
                                            <Text style={styles.roleSelectorDesc}>{meta.desc}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Text style={styles.fieldLabel}>Secondary Role <Text style={styles.optionalLabel}>(optional)</Text></Text>
                            <View style={styles.roleSelector}>
                                <TouchableOpacity
                                    style={[styles.roleSelectorItem, !secondaryRole && { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }]}
                                    onPress={() => setSecondaryRole(null)}
                                    activeOpacity={0.75}
                                >
                                    <Icon source="close-circle-outline" color={!secondaryRole ? '#64748B' : '#94A3B8'} size={20} />
                                    <Text style={[styles.roleSelectorText, !secondaryRole && { color: '#64748B', fontWeight: '700' }]}>None</Text>
                                    <Text style={styles.roleSelectorDesc}>Single role only</Text>
                                </TouchableOpacity>
                                {ROLES.filter(r => r !== role).map(r => {
                                    const meta     = getRoleMeta(r);
                                    const selected = secondaryRole === r;
                                    return (
                                        <TouchableOpacity
                                            key={r}
                                            style={[styles.roleSelectorItem, selected && { backgroundColor: meta.bg, borderColor: meta.color }]}
                                            onPress={() => setSecondaryRole(r)}
                                            activeOpacity={0.75}
                                        >
                                            <Icon source={meta.icon} color={selected ? meta.color : '#94A3B8'} size={20} />
                                            <Text style={[styles.roleSelectorText, selected && { color: meta.color, fontWeight: '700' }]}>{r}</Text>
                                            <Text style={styles.roleSelectorDesc}>{meta.desc}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {branches.length > 0 && (
                                <>
                                    <Text style={styles.fieldLabel}>Branch Assignment</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.branchRow}>
                                        <Chip
                                            selected={branch === null}
                                            onPress={() => setBranch(null)}
                                            style={[styles.branchChip, branch === null && { backgroundColor: '#EEF2FF' }]}
                                            selectedColor="#4F46E5"
                                        >
                                            🏢 Head Office
                                        </Chip>
                                        {branches.map(b => (
                                            <Chip
                                                key={b.id}
                                                selected={branch === b.id}
                                                onPress={() => setBranch(b.id)}
                                                style={[styles.branchChip, branch === b.id && { backgroundColor: '#EEF2FF' }]}
                                                selectedColor="#4F46E5"
                                            >
                                                🏪 {b.name}
                                            </Chip>
                                        ))}
                                    </ScrollView>
                                </>
                            )}
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => { setDialogVisible(false); resetForm(); }} textColor="#64748B" disabled={saving}>
                            Cancel
                        </Button>
                        <Button mode="contained" onPress={handleSave} buttonColor="#4D96FF" loading={saving} disabled={saving}>
                            {editingUser ? 'Update Member' : 'Create Member'}
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <FAB style={styles.fab} icon="account-plus" color="#FFFFFF" onPress={openAddDialog} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#94A3B8', fontSize: 14 },
    scroll: { padding: 16, paddingBottom: 100 },

    /* Hero */
    heroCard: {
        backgroundColor: '#FFFFFF', borderRadius: 18, padding: 22,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, elevation: 3,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
    },
    heroLabel: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 4 },
    heroCount: { fontSize: 32, fontWeight: '900', color: '#0F172A' },

    /* Role grid */
    roleGrid: { flexDirection: 'row', gap: 10, marginBottom: 22 },
    roleCard: {
        flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', gap: 3,
    },
    roleCardCount: { fontSize: 24, fontWeight: '900' },
    roleCardLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
    roleCardDesc: { fontSize: 9, color: '#94A3B8', textAlign: 'center', marginTop: 2 },

    /* Section header */
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    sectionCount: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },

    /* Staff list */
    listCard: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6 },
    staffRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
    avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    avatarText: { fontSize: 20, fontWeight: '900' },
    staffInfo: { flex: 1, minWidth: 0 },
    staffName: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
    emailRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
    staffEmail: { fontSize: 12, color: '#64748B' },
    rolePills: { flexDirection: 'row', gap: 4, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 },
    staffTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    actionCol: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
    actionBtn: { margin: 0, padding: 0 },
    rolePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
    rolePillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
    staffMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: '#94A3B8' },
    metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#CBD5E1' },
    delBtn: { margin: 0 },
    rowDivider: { backgroundColor: '#F8FAFC', marginLeft: 76 },

    /* Empty */
    emptyBox: { alignItems: 'center', marginTop: 40, paddingBottom: 20 },
    emptyText: { fontSize: 15, color: '#CBD5E1', fontWeight: '700', marginTop: 12 },

    /* Dialog */
    dialog: { backgroundColor: '#FFFFFF', borderRadius: 20 },
    dialogTitle: { color: '#1E293B', fontWeight: '800' },
    dialogPadding: { paddingVertical: 8 },
    input: { marginBottom: 14, backgroundColor: '#FFFFFF' },
    fieldLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 10, marginTop: 4 },
    optionalLabel: { fontSize: 11, fontWeight: '400', color: '#94A3B8' },
    roleSelector: { gap: 8, marginBottom: 16 },
    roleSelectorItem: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 12, paddingHorizontal: 14,
        borderRadius: 12, backgroundColor: '#F8FAFC',
        borderWidth: 2, borderColor: 'transparent',
    },
    roleSelectorText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
    roleSelectorDesc: { fontSize: 11, color: '#94A3B8', marginLeft: 'auto' },
    branchRow: { marginBottom: 8 },
    branchChip: { marginRight: 8, backgroundColor: '#F1F5F9' },

    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#4D96FF' },
});

export default StaffManagement;
