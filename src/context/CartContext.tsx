import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { CartItem, PricingModel, ServiceCategoryKey } from '../types';

interface AddToCartPayload {
  serviceId: string;
  serviceName: string;
  categoryKey: ServiceCategoryKey;
  packageId?: string;
  packageName?: string;
  pricingModel?: PricingModel;
  hourlyRateSar?: number;
  unitPriceSar?: number;
  durationHours?: number;
  quantity?: number;
  selectedAddonIds?: string[];
  imageUrl?: string;
  deliveryTimeframe?: string;
  addonsTotalSar?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (payload: AddToCartPayload) => void;
  updateItemDuration: (id: string, durationHours: number) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  subtotalSar: number;
  approvedFeesSar: number;
  totalSar: number;
  itemCount: number;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  setApprovedFeesSar: (fees: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'lumir_cart_v2';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.warn('Failed to parse cart from localStorage:', err);
    }
    return [];
  });

  const [approvedFeesSar, setApprovedFeesSar] = useState<number>(0);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  // Synchronize cart to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Failed to persist cart to localStorage:', err);
    }
  }, [items]);

  const calculateItemPrice = (
    pricingModel: PricingModel | undefined,
    hourlyRateSar: number | undefined,
    unitPriceSar: number | undefined,
    durationHours: number | undefined,
    quantity: number = 1,
    addonsTotal: number = 0
  ): number => {
    const qty = Math.max(1, quantity);
    let base = 0;
    if (pricingModel === 'hourly' && hourlyRateSar !== undefined) {
      const hours = Math.max(1, durationHours || 4);
      base = hourlyRateSar * hours;
    } else {
      base = unitPriceSar || 0;
    }
    return (base + addonsTotal) * qty;
  };

  const addToCart = (payload: AddToCartPayload) => {
    const qty = Math.max(1, payload.quantity || 1);
    const duration = payload.durationHours || 4;
    const addonsTotal = payload.addonsTotalSar || 0;

    const calculatedPrice = calculateItemPrice(
      payload.pricingModel,
      payload.hourlyRateSar,
      payload.unitPriceSar,
      duration,
      qty,
      addonsTotal
    );

    const newItem: CartItem = {
      id: `cart-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      serviceId: payload.serviceId,
      serviceName: payload.serviceName,
      categoryKey: payload.categoryKey,
      packageId: payload.packageId,
      packageName: payload.packageName,
      pricingModel: payload.pricingModel || 'package',
      hourlyRateSar: payload.hourlyRateSar,
      unitPriceSar: payload.unitPriceSar,
      durationHours: duration,
      quantity: qty,
      priceSar: calculatedPrice,
      deliveryTimeframe: payload.deliveryTimeframe,
      imageUrl: payload.imageUrl,
      selectedAddonIds: payload.selectedAddonIds || [],
      addedAt: new Date().toISOString()
    };

    setItems((prev) => {
      // Check if duplicate item exists (same service, package, and pricing)
      const existingIdx = prev.findIndex(
        (it) =>
          it.serviceId === newItem.serviceId &&
          it.packageId === newItem.packageId &&
          it.pricingModel === newItem.pricingModel &&
          it.durationHours === newItem.durationHours &&
          JSON.stringify(it.selectedAddonIds?.sort()) === JSON.stringify(newItem.selectedAddonIds?.sort())
      );

      if (existingIdx !== -1) {
        const copy = [...prev];
        const current = copy[existingIdx];
        const newQty = (current.quantity || 1) + qty;
        const newPrice = calculateItemPrice(
          current.pricingModel,
          current.hourlyRateSar,
          current.unitPriceSar,
          current.durationHours,
          newQty,
          addonsTotal
        );
        copy[existingIdx] = {
          ...current,
          quantity: newQty,
          priceSar: newPrice
        };
        return copy;
      }

      return [newItem, ...prev];
    });

    // Auto open drawer or feedback
    setIsCartDrawerOpen(true);
  };

  const updateItemDuration = (id: string, newDuration: number) => {
    if (newDuration < 1) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const qty = item.quantity || 1;
        const newPrice = calculateItemPrice(
          item.pricingModel,
          item.hourlyRateSar,
          item.unitPriceSar,
          newDuration,
          qty,
          0 // Addons can be factored in
        );
        return {
          ...item,
          durationHours: newDuration,
          priceSar: newPrice
        };
      })
    );
  };

  const updateItemQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newPrice = calculateItemPrice(
          item.pricingModel,
          item.hourlyRateSar,
          item.unitPriceSar,
          item.durationHours,
          newQuantity,
          0
        );
        return {
          ...item,
          quantity: newQuantity,
          priceSar: newPrice
        };
      })
    );
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
  };

  const subtotalSar = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.priceSar || 0), 0);
  }, [items]);

  const totalSar = useMemo(() => {
    return subtotalSar + (approvedFeesSar || 0);
  }, [subtotalSar, approvedFeesSar]);

  const itemCount = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.quantity || 1), 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateItemDuration,
        updateItemQuantity,
        removeFromCart,
        clearCart,
        subtotalSar,
        approvedFeesSar,
        totalSar,
        itemCount,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        setApprovedFeesSar
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
