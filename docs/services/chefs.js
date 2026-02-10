/**
 * RideNDine Chefs Service
 * Handles chef data fetching and caching
 */

(function() {
  'use strict';

  // Cache for chef data
  let chefsCache = null;
  let cacheTimestamp = 0;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  window.ChefsService = {
    
    /**
     * Get all chefs
     * @param {boolean} forceRefresh - Force refresh from API
     * @returns {Promise<Array>} List of chefs
     */
    async getChefs(forceRefresh = false) {
      // Return cached data if valid
      if (!forceRefresh && chefsCache && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        return chefsCache;
      }

      try {
        const response = await window.apiFetch('/api/chefs');
        
        if (!response.ok) {
          throw new Error('Failed to fetch chefs');
        }

        const chefs = await response.json();
        
        // Update cache
        chefsCache = chefs;
        cacheTimestamp = Date.now();
        
        return chefs;
      } catch (error) {
        console.error('Error fetching chefs:', error);
        // Fallback to static data
        return this.getStaticChefs();
      }
    },

    /**
     * Get chef by slug
     * @param {string} slug - Chef slug
     * @returns {Promise<Object>} Chef data
     */
    async getChefBySlug(slug) {
      try {
        const response = await window.apiFetch(`/api/chefs/slug/${slug}`);
        
        if (!response.ok) {
          // Try from cached data
          const chefs = await this.getChefs();
          return chefs.find(c => c.slug === slug) || null;
        }

        return await response.json();
      } catch (error) {
        console.error('Error fetching chef:', error);
        // Try from cached data
        const chefs = await this.getChefs();
        return chefs.find(c => c.slug === slug) || null;
      }
    },

    /**
     * Get static chef data (fallback for GitHub Pages)
     * @returns {Array} Static chef data
     */
    getStaticChefs() {
      return [
        {
          id: 'chef_2000',
          name: 'Hoàng Gia Phở',
          slug: 'hoang-gia-pho',
          specialty: 'Vietnamese',
          description: 'Authentic Vietnamese cuisine from generations of family recipes',
          rating: 4.9,
          status: 'active',
          menu: [
            { id: 'pho-bo', name: 'Phở Bò (Beef Pho)', description: 'Traditional Vietnamese beef noodle soup', price: 14.99, category: 'Phở', prepTime: 15 },
            { id: 'pho-ga', name: 'Phở Gà (Chicken Pho)', description: 'Light and flavorful chicken pho', price: 13.99, category: 'Phở', prepTime: 15 },
            { id: 'banh-mi', name: 'Bánh Mì Thịt Nướng', description: 'Vietnamese baguette with grilled pork', price: 8.99, category: 'Bánh Mì', prepTime: 8 },
            { id: 'bun-bo-hue', name: 'Bún Bò Huế', description: 'Spicy beef noodle soup from Hue', price: 15.99, category: 'Bún', prepTime: 18 },
            { id: 'goi-cuon', name: 'Gỏi Cuốn (Spring Rolls)', description: 'Fresh rice paper rolls - 2 pcs', price: 6.99, category: 'Appetizers', prepTime: 8 },
            { id: 'com-tam', name: 'Cơm Tấm (Broken Rice)', description: 'Grilled pork chop over broken rice', price: 13.99, category: 'Cơm', prepTime: 15 }
          ]
        },
        {
          id: 'chef_2001',
          name: 'Maria Garcia',
          slug: 'maria-garcia',
          specialty: 'Mexican',
          description: 'Traditional Mexican flavors from Oaxaca',
          rating: 4.8,
          status: 'active',
          menu: [
            { id: 'tacos', name: 'Tacos Al Pastor (3 pcs)', description: 'Marinated pork tacos with pineapple', price: 11.99, category: 'Tacos', prepTime: 10 },
            { id: 'quesadillas', name: 'Quesadillas', description: 'Cheese quesadillas with choice of protein', price: 9.99, category: 'Mains', prepTime: 8 },
            { id: 'burrito', name: 'Burrito Bowl', description: 'Rice bowl with beans, protein, and toppings', price: 13.99, category: 'Mains', prepTime: 12 },
            { id: 'enchiladas', name: 'Enchiladas (3 pcs)', description: 'Rolled tortillas with sauce and cheese', price: 14.99, category: 'Mains', prepTime: 15 }
          ]
        },
        {
          id: 'chef_2002',
          name: 'John Smith',
          slug: 'john-smith',
          specialty: 'Italian',
          description: 'Northern Italian cuisine with modern twists',
          rating: 4.9,
          status: 'active',
          menu: [
            { id: 'margherita', name: 'Margherita Pizza', description: 'Classic pizza with tomato and mozzarella', price: 14.99, category: 'Pizza', prepTime: 18 },
            { id: 'carbonara', name: 'Spaghetti Carbonara', description: 'Pasta with eggs, cheese, and guanciale', price: 15.99, category: 'Pasta', prepTime: 15 },
            { id: 'alfredo', name: 'Fettuccine Alfredo', description: 'Creamy pasta with Parmesan cheese', price: 14.99, category: 'Pasta', prepTime: 12 },
            { id: 'lasagna', name: 'Lasagna Bolognese', description: 'Layered pasta with meat sauce', price: 16.99, category: 'Mains', prepTime: 20 }
          ]
        }
      ];
    },

    /**
     * Clear cache
     */
    clearCache() {
      chefsCache = null;
      cacheTimestamp = 0;
    }
  };

})();
