/**
 * Hook for coupon management
 */
import { useState, useCallback } from 'react';
import * as storeApi from '../../../services/storeApi';

export const useCoupon = () => {
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [loadingCoupon, setLoadingCoupon] = useState(false);

  // Handle coupon code change
  const handleCouponChange = useCallback((event) => {
    const value = event.target.value;
    setCouponCode(value);
    if (couponError) setCouponError('');
    
    // Clear applied coupon if user changes the code
    if (appliedCoupon && value.trim().toUpperCase() !== appliedCoupon.code) {
      setAppliedCoupon(null);
    }
  }, [couponError, appliedCoupon]);

  // Apply coupon
  const applyCoupon = useCallback(async (totalAmount) => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError('Digite um código de cupom');
      return false;
    }

    setLoadingCoupon(true);
    setCouponError('');

    try {
      const data = await storeApi.validateCoupon(code, totalAmount);

      if (data.valid) {
        setAppliedCoupon({
          code: data.code,
          description: data.description,
          discount_type: data.discount_type,
          discount_value: Number(data.discount_value) || 0,
          discount_amount: Number(data.discount) || 0
        });
        setCouponError('');
        setLoadingCoupon(false);
        return true;
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Cupom inválido';
      setCouponError(errorMsg);
      setAppliedCoupon(null);
    }
    
    setLoadingCoupon(false);
    return false;
  }, [couponCode]);

  // Remove coupon
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  }, []);

  // Calculate discount amount
  const calculateDiscount = useCallback((subtotal, shippingCost = 0) => {
    if (!appliedCoupon) return 0;
    
    const total = subtotal + shippingCost;
    
    if (appliedCoupon.discount_type === 'percentage') {
      return (total * appliedCoupon.discount_value) / 100;
    }
    
    return Math.min(appliedCoupon.discount_amount || appliedCoupon.discount_value, total);
  }, [appliedCoupon]);

  return {
    couponCode,
    couponError,
    appliedCoupon,
    loadingCoupon,
    handleCouponChange,
    applyCoupon,
    removeCoupon,
    calculateDiscount,
    setCouponCode
  };
};

export default useCoupon;
