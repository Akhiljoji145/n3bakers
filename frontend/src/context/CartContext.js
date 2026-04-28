import React, { createContext, useCallback, useState, useContext, useEffect } from 'react';
import client from '../api/client';

const CartContext = createContext();
const normalizeList = (data) => Array.isArray(data) ? data : data?.results || [];

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [branches, setBranches] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(false);
    
    const fetchBranches = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setLoadingBranches(true);
        try {
            const response = await client.get('core/branches/');
            const branchList = normalizeList(response.data);
            setBranches(branchList);
            
            // Auto-select first active branch if none selected
            if (branchList.length > 0) {
                const firstActive = branchList.find(b => b.is_active);
                if (firstActive) setSelectedBranch(prev => prev || firstActive.id);
            }
        } catch (e) {
            console.error('Failed to fetch branches in context', e);
        } finally {
            if (!silent) setLoadingBranches(false);
        }
    }, []);
    
    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    const addToCart = (product) => {
        setCart(prev => {
            const exists = prev.find(item => item.product.id === product.id);
            if (exists) {
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity < 1) return removeFromCart(productId);
        setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
    };

    const clearCart = () => setCart([]);

    const totalCost = cart.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);

    return (
        <CartContext.Provider value={{ 
            cart, 
            addToCart, 
            removeFromCart, 
            updateQuantity, 
            clearCart, 
            totalCost,
            selectedBranch,
            setSelectedBranch,
            branches,
            loadingBranches,
            refreshBranches: fetchBranches
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
