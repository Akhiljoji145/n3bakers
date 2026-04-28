import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, TextInput, Button, Title, Paragraph } from 'react-native-paper';
import client from '../api/client';
import { useCart } from '../context/CartContext';

const BulkOrderScreen = ({ onClose }) => {
    const { selectedBranch } = useCart();
    const [notes, setNotes] = useState('');
    const [scheduleDate, setScheduleDate] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Simplification for prototype: User enters their requested products in notes.
    // A fully fleshed out bulk order would have a grid of products with quantity inputs.

    const handleSubmitBulkOrder = async () => {
        if (!scheduleDate) {
            Alert.alert("Required", "Please provide a schedule date.");
            return;
        }

        if (!selectedBranch) {
            Alert.alert("Required", "Please select a branch first.");
            return;
        }

        setLoading(true);
        try {
            await client.post('orders/orders/', {
                status: 'PENDING',
                order_type: 'BULK',
                total_amount: 0, // Manager will update the price and approve
                payment_status: false,
                branch: selectedBranch,
                items: [], // Assume items will be processed from notes or added later by manager
                bulk_details: {
                    schedule_date: `${scheduleDate}T12:00:00Z`, // basic ISO string
                    notes: notes,
                    is_approved: false
                }
            });
            Alert.alert("Success", "Bulk request submitted! A manager will review it.");
            onClose();
        } catch (e) {
            console.error('Bulk order failed', e);
            Alert.alert("Error", "Failed to submit request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={onClose} />
                <Appbar.Content title="Bulk Order Request" />
            </Appbar.Header>
            <ScrollView style={styles.scroll}>
                <Title style={styles.title}>Event or Wholesale Ordering</Title>
                <Paragraph style={styles.paragraph}>
                    Please describe your requirements below. Include the items, approximate quantities, and any custom instructions.
                </Paragraph>

                <TextInput
                    label="Schedule Date (YYYY-MM-DD)"
                    value={scheduleDate}
                    onChangeText={setScheduleDate}
                    mode="outlined"
                    style={styles.input}
                    placeholder="e.g. 2026-12-25"
                />

                <TextInput
                    label="Requirements & Notes"
                    value={notes}
                    onChangeText={setNotes}
                    mode="outlined"
                    multiline
                    numberOfLines={6}
                    style={[styles.input, styles.multilineInput]}
                    placeholder="E.g., I need 500 chocolate cupcakes and 10 large customized cakes for a wedding..."
                />

                <Button 
                    mode="contained" 
                    onPress={handleSubmitBulkOrder} 
                    loading={loading}
                    style={styles.button}
                >
                    Submit Request
                </Button>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scroll: {
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    paragraph: {
        marginBottom: 20,
        color: '#666',
    },
    input: {
        marginBottom: 20,
    },
    multilineInput: {
        minHeight: 120,
        textAlignVertical: 'top',
    },
    button: {
        paddingVertical: 8,
        marginTop: 10,
    }
});

export default BulkOrderScreen;
