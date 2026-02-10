/**
 * RideNDine Cart Service
 * Manages shopping cart state using localStorage
 */

(function() {
  'use strict';

  const CART_STORAGE_KEY = 'ridendine_cart';

  window.CartService = {
    
    /**
     * Get all items in cart
     * @returns {Array} Cart items
     */
    getCart() {
      try {
        const cart = localStorage.getItem(CART_STORAGE_KEY);
        return cart ? JSON.parse(cart) : [];
      } catch (error) {
        console.error('Error reading cart:', error);
        return [];
      }
    },

    /**
     * Add item to cart
     * @param {Object} item - Item to add
     */
    addItem(item) {
      const cart = this.getCart();
      
      // Check if item already exists
      const existingIndex = cart.findIndex(i => 
        i.chefId === item.chefId && i.itemId === item.itemId
      );

      if (existingIndex >= 0) {
        // Increase quantity
        cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
      } else {
        // Add new item
        cart.push({
          ...item,
          quantity: item.quantity || 1,
          addedAt: new Date().toISOString()
        });
      }

      this.saveCart(cart);
      this.notifyChange();
      return cart;
    },

    /**
     * Remove item from cart
     * @param {string} chefId - Chef ID
     * @param {string} itemId - Item ID
     */
    removeItem(chefId, itemId) {
      let cart = this.getCart();
      cart = cart.filter(i => !(i.chefId === chefId && i.itemId === itemId));
      this.saveCart(cart);
      this.notifyChange();
      return cart;
    },

    /**
     * Update item quantity
     * @param {string} chefId - Chef ID
     * @param {string} itemId - Item ID
     * @param {number} quantity - New quantity
     */
    updateQuantity(chefId, itemId, quantity) {
      const cart = this.getCart();
      const item = cart.find(i => i.chefId === chefId && i.itemId === itemId);
      
      if (item) {
        if (quantity <= 0) {
          return this.removeItem(chefId, itemId);
        }
        item.quantity = quantity;
        this.saveCart(cart);
        this.notifyChange();
      }
      
      return cart;
    },

    /**
     * Clear entire cart
     */
    clearCart() {
      localStorage.removeItem(CART_STORAGE_KEY);
      this.notifyChange();
    },

    /**
     * Get cart count (total items)
     * @returns {number} Total items in cart
     */
    getCount() {
      const cart = this.getCart();
      return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    },

    /**
     * Get cart total price
     * @returns {number} Total price
     */
    getTotal() {
      const cart = this.getCart();
      return cart.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = item.quantity || 1;
        return sum + (price * quantity);
      }, 0);
    },

    /**
     * Get items grouped by chef
     * @returns {Object} Items grouped by chef
     */
    getItemsByChef() {
      const cart = this.getCart();
      return cart.reduce((acc, item) => {
        const chefId = item.chefId || 'unknown';
        if (!acc[chefId]) {
          acc[chefId] = {
            chefId: chefId,
            chefName: item.chefName || 'Unknown Chef',
            chefSlug: item.chefSlug || '',
            items: []
          };
        }
        acc[chefId].items.push(item);
        return acc;
      }, {});
    },

    /**
     * Save cart to localStorage
     * @param {Array} cart - Cart items
     */
    saveCart(cart) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    },

    /**
     * Notify listeners of cart changes
     */
    notifyChange() {
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('cartChanged', {
        detail: {
          count: this.getCount(),
          total: this.getTotal(),
          items: this.getCart()
        }
      }));

      // Update cart count in nav if it exists
      this.updateCartBadges();
    },

    /**
     * Update cart count badges in navigation
     */
    updateCartBadges() {
      const count = this.getCount();
      const badges = document.querySelectorAll('#cart-count, .cart-count');
      badges.forEach(badge => {
        badge.textContent = count;
      });
    }
  };

  // Initialize cart badges on page load
  document.addEventListener('DOMContentLoaded', () => {
    window.CartService.updateCartBadges();
  });

  // Also update when page becomes visible (for multiple tabs)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      window.CartService.updateCartBadges();
    }
  });

})();
