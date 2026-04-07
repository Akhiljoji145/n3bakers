import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Appbar, List, Divider } from 'react-native-paper';
import client from '../api/client';

const ProductionPlanningScreen = ({ onClose }) => {
    const [data, setData] = useState({ products_to_bake: [], ingredients_needed: [], pending_orders_count: 0 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPlan();
    }, []);

    const fetchPlan = async () => {
        setLoading(true);
        try {
            const response = await client.get('analytics/production-plan/');
            setData(response.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.header}>
                <Appbar.BackAction onPress={onClose} />
                <Appbar.Content title="Production Planning" />
                <Appbar.Action icon="refresh" onPress={fetchPlan} />
            </Appbar.Header>

            <ScrollView style={styles.scroll}>
                <Card style={styles.summaryCard}>
                    <Card.Content>
                        <Title>Target Orders Overview</Title>
                        <Paragraph>Pending Orders queued for production: {data.pending_orders_count}</Paragraph>
                    </Card.Content>
                </Card>

                <Title style={styles.sectionTitle}>What to Bake</Title>
                <Card style={styles.listCard}>
                    {data.products_to_bake.length === 0 ? <Paragraph style={styles.empty}>No baking needed.</Paragraph> : null}
                    {data.products_to_bake.map((product, idx) => (
                        <View key={idx}>
                            <List.Item
                                title={product.name}
                                description={`Total Quantity Required: ${product.quantity}`}
                                left={props => <List.Icon {...props} icon="bread-slice" />}
                            />
                            <Divider />
                        </View>
                    ))}
                </Card>

                <Title style={styles.sectionTitle}>Ingredients To Gather</Title>
                <Card style={styles.listCard}>
                    {data.ingredients_needed.length === 0 ? <Paragraph style={styles.empty}>Kitchen is fully stocked or clear.</Paragraph> : null}
                    {data.ingredients_needed.map((ingredient, idx) => (
                        <View key={idx}>
                            <List.Item
                                title={ingredient.name}
                                description={`Total Needed: ${ingredient.quantity} ${ingredient.unit}`}
                                left={props => <List.Icon {...props} icon="scale" />}
                            />
                            <Divider />
                        </View>
                    ))}
                </Card>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#fff',
        elevation: 4,
    },
    scroll: {
        padding: 10,
    },
    summaryCard: {
        marginBottom: 15,
        backgroundColor: '#fafafa',
        elevation: 2,
    },
    sectionTitle: {
        marginVertical: 10,
        fontWeight: 'bold',
        fontSize: 18,
    },
    listCard: {
        marginBottom: 20,
        elevation: 1,
    },
    empty: {
        padding: 15,
        fontStyle: 'italic',
        color: '#666',
    }
});

export default ProductionPlanningScreen;
