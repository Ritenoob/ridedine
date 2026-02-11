/**
 * Client-Side Demo Data for RideNDine Marketplace
 * 
 * This provides a comprehensive data layer for the marketplace expansion,
 * allowing the app to work standalone on GitHub Pages without a backend.
 * 
 * Features:
 * - Home cooks marketplace data
 * - Multi-market support
 * - Dishes with allergen information
 * - Categories and filters
 * - Promotions and offers
 * - Reviews and ratings
 * - Grocery items and meal kits
 */

(function() {
  'use strict';

  // Market configurations
  const markets = [
    {
      id: 'market_hamilton_on',
      name: 'Hamilton, ON',
      currency: 'CAD',
      currencySymbol: '$',
      taxRate: 0.13, // HST
      deliveryFeeBase: 2.99,
      serviceFeeRate: 0.10,
      minOrder: 10.00,
      active: true,
      timezone: 'America/Toronto',
      coordinates: { lat: 43.2557, lng: -79.8711 }
    }
  ];

  // Home cook profiles with enhanced marketplace data
  const cooks = [
    {
      id: 'cook_2000',
      userId: 'user_2000',
      marketId: 'market_hamilton_on',
      slug: 'hoang-gia-pho',
      kitchenName: 'Hoàng Gia Phở',
      ownerName: 'Hoang Family',
      bio: 'Authentic Vietnamese cuisine from generations of family recipes. Our pho broth is simmered for 24 hours with traditional spices.',
      story: 'For over 30 years, the Hoang family has been serving authentic Vietnamese cuisine in Hamilton. Our recipes have been passed down through three generations, bringing the flavors of Hanoi to Ontario.',
      avatar: './assets/chefs/hoang-gia-pho.jpg',
      coverPhoto: './assets/chefs/hoang-gia-pho-cover.jpg',
      tags: ['Vietnamese', 'Authentic', 'Family Recipes', 'Halal Options', 'Gluten-Free Options'],
      cuisineTypes: ['Vietnamese', 'Asian'],
      specialties: ['Phở', 'Bánh Mì', 'Bún'],
      location: {
        area: 'East Hamilton',
        coordinates: { lat: 43.2238, lng: -79.7654 }
      },
      serviceRadiusKm: 10,
      status: 'active',
      rating: 4.9,
      reviewCount: 847,
      orderCount: 2340,
      responseTime: 8, // minutes
      acceptanceRate: 98,
      fulfillmentMethods: ['delivery', 'pickup'],
      hours: {
        monday: { open: '11:00', close: '21:00' },
        tuesday: { open: '11:00', close: '21:00' },
        wednesday: { open: '11:00', close: '21:00' },
        thursday: { open: '11:00', close: '21:00' },
        friday: { open: '11:00', close: '22:00' },
        saturday: { open: '11:00', close: '22:00' },
        sunday: { open: '12:00', close: '20:00' }
      },
      certifications: ['Food Handler Certification', 'Home Kitchen Approved'],
      kitchenPhotos: [
        './assets/kitchen/hoang-1.jpg',
        './assets/kitchen/hoang-2.jpg',
        './assets/kitchen/hoang-3.jpg'
      ],
      deliveryFee: 2.99,
      minOrder: 15.00,
      avgDeliveryTime: 35, // minutes
      featured: true,
      promoBadge: 'Free Delivery on Orders $30+',
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'cook_2001',
      userId: 'user_2001',
      marketId: 'market_hamilton_on',
      slug: 'maria-garcia-mexican',
      kitchenName: 'Maria\'s Mexican Kitchen',
      ownerName: 'Maria Garcia',
      bio: 'Traditional Mexican flavors from Oaxaca, made with love and authentic ingredients.',
      story: 'Growing up in Oaxaca, Mexico, I learned to cook from my abuela. Each dish I prepare honors her memory and brings the authentic taste of Mexico to Hamilton.',
      avatar: './assets/chefs/maria-garcia.jpg',
      coverPhoto: './assets/chefs/maria-cover.jpg',
      tags: ['Mexican', 'Authentic', 'Vegetarian Options', 'Spicy', 'Gluten-Free Options'],
      cuisineTypes: ['Mexican', 'Latin American'],
      specialties: ['Tacos', 'Mole', 'Tamales'],
      location: {
        area: 'West Hamilton',
        coordinates: { lat: 43.2501, lng: -79.8796 }
      },
      serviceRadiusKm: 8,
      status: 'active',
      rating: 4.8,
      reviewCount: 623,
      orderCount: 1580,
      responseTime: 10,
      acceptanceRate: 96,
      fulfillmentMethods: ['delivery', 'pickup'],
      hours: {
        monday: { open: '12:00', close: '20:00' },
        tuesday: { open: '12:00', close: '20:00' },
        wednesday: { open: '12:00', close: '20:00' },
        thursday: { open: '12:00', close: '21:00' },
        friday: { open: '12:00', close: '22:00' },
        saturday: { open: '11:00', close: '22:00' },
        sunday: { closed: true }
      },
      certifications: ['Food Handler Certification'],
      kitchenPhotos: ['./assets/kitchen/maria-1.jpg'],
      deliveryFee: 3.49,
      minOrder: 12.00,
      avgDeliveryTime: 40,
      featured: true,
      promoBadge: '20% Off First Order',
      createdAt: '2024-02-20T14:00:00Z'
    },
    {
      id: 'cook_2002',
      userId: 'user_2002',
      marketId: 'market_hamilton_on',
      slug: 'johns-italian-kitchen',
      kitchenName: 'John\'s Italian Kitchen',
      ownerName: 'John Smith',
      bio: 'Northern Italian cuisine with modern twists. Fresh pasta made daily.',
      story: 'After training in Milan, I bring authentic Italian techniques to Hamilton. Every pasta dish is handmade with imported Italian flour.',
      avatar: './assets/chefs/john-smith.jpg',
      coverPhoto: './assets/chefs/john-cover.jpg',
      tags: ['Italian', 'Pasta', 'Fresh Made', 'Vegetarian Friendly'],
      cuisineTypes: ['Italian', 'Mediterranean'],
      specialties: ['Pasta', 'Pizza', 'Risotto'],
      location: {
        area: 'Central Hamilton',
        coordinates: { lat: 43.2558, lng: -79.8690 }
      },
      serviceRadiusKm: 12,
      status: 'active',
      rating: 4.9,
      reviewCount: 1024,
      orderCount: 2890,
      responseTime: 6,
      acceptanceRate: 99,
      fulfillmentMethods: ['delivery', 'pickup'],
      hours: {
        monday: { closed: true },
        tuesday: { open: '16:00', close: '22:00' },
        wednesday: { open: '16:00', close: '22:00' },
        thursday: { open: '16:00', close: '22:00' },
        friday: { open: '16:00', close: '23:00' },
        saturday: { open: '15:00', close: '23:00' },
        sunday: { open: '15:00', close: '21:00' }
      },
      certifications: ['Food Handler Certification', 'Culinary Arts Diploma'],
      kitchenPhotos: ['./assets/kitchen/john-1.jpg', './assets/kitchen/john-2.jpg'],
      deliveryFee: 2.49,
      minOrder: 18.00,
      avgDeliveryTime: 30,
      featured: true,
      promoBadge: null,
      createdAt: '2023-11-10T09:00:00Z'
    },
    {
      id: 'cook_2003',
      userId: 'user_2003',
      marketId: 'market_hamilton_on',
      slug: 'sarahs-vegan-delights',
      kitchenName: 'Sarah\'s Vegan Delights',
      ownerName: 'Sarah Johnson',
      bio: 'Plant-based comfort food that everyone will love. Delicious vegan meals for the whole family.',
      story: 'I became vegan 10 years ago and discovered that plant-based food can be incredibly delicious. My mission is to show that vegan food is for everyone!',
      avatar: './assets/chefs/sarah-johnson.jpg',
      coverPhoto: './assets/chefs/sarah-cover.jpg',
      tags: ['Vegan', 'Plant-Based', 'Healthy', 'Gluten-Free Options', 'Organic'],
      cuisineTypes: ['Vegan', 'Health Food'],
      specialties: ['Buddha Bowls', 'Vegan Burgers', 'Smoothie Bowls'],
      location: {
        area: 'Downtown Hamilton',
        coordinates: { lat: 43.2567, lng: -79.8664 }
      },
      serviceRadiusKm: 10,
      status: 'active',
      rating: 4.7,
      reviewCount: 456,
      orderCount: 980,
      responseTime: 12,
      acceptanceRate: 94,
      fulfillmentMethods: ['delivery', 'pickup'],
      hours: {
        monday: { open: '10:00', close: '19:00' },
        tuesday: { open: '10:00', close: '19:00' },
        wednesday: { open: '10:00', close: '19:00' },
        thursday: { open: '10:00', close: '19:00' },
        friday: { open: '10:00', close: '19:00' },
        saturday: { open: '10:00', close: '18:00' },
        sunday: { open: '11:00', close: '17:00' }
      },
      certifications: ['Food Handler Certification', 'Plant-Based Nutrition Certification'],
      kitchenPhotos: ['./assets/kitchen/sarah-1.jpg'],
      deliveryFee: 3.99,
      minOrder: 10.00,
      avgDeliveryTime: 35,
      featured: false,
      promoBadge: 'New Chef - 15% Off',
      createdAt: '2024-03-01T11:00:00Z'
    },
    {
      id: 'cook_2004',
      userId: 'user_2004',
      marketId: 'market_hamilton_on',
      slug: 'amirs-middle-eastern',
      kitchenName: 'Amir\'s Middle Eastern Cuisine',
      ownerName: 'Amir Hassan',
      bio: 'Authentic halal Middle Eastern dishes. Specializing in shawarma, falafel, and traditional mezze.',
      story: 'My family has run restaurants in Lebanon for generations. I bring those same recipes and traditions to Hamilton, using only halal ingredients.',
      avatar: './assets/chefs/amir-hassan.jpg',
      coverPhoto: './assets/chefs/amir-cover.jpg',
      tags: ['Middle Eastern', 'Halal', 'Mediterranean', 'Vegetarian Options', 'Family Recipes'],
      cuisineTypes: ['Middle Eastern', 'Mediterranean', 'Lebanese'],
      specialties: ['Shawarma', 'Falafel', 'Mezze'],
      location: {
        area: 'North Hamilton',
        coordinates: { lat: 43.2676, lng: -79.8580 }
      },
      serviceRadiusKm: 15,
      status: 'active',
      rating: 4.9,
      reviewCount: 732,
      orderCount: 1890,
      responseTime: 9,
      acceptanceRate: 97,
      fulfillmentMethods: ['delivery', 'pickup'],
      hours: {
        monday: { open: '11:00', close: '22:00' },
        tuesday: { open: '11:00', close: '22:00' },
        wednesday: { open: '11:00', close: '22:00' },
        thursday: { open: '11:00', close: '22:00' },
        friday: { open: '11:00', close: '23:00' },
        saturday: { open: '11:00', close: '23:00' },
        sunday: { open: '12:00', close: '21:00' }
      },
      certifications: ['Food Handler Certification', 'Halal Certification'],
      kitchenPhotos: ['./assets/kitchen/amir-1.jpg', './assets/kitchen/amir-2.jpg'],
      deliveryFee: 2.99,
      minOrder: 12.00,
      avgDeliveryTime: 32,
      featured: true,
      promoBadge: null,
      createdAt: '2024-01-05T08:00:00Z'
    }
  ];

  // Dishes with detailed information including allergens
  const dishes = [
    // Hoàng Gia Phở dishes
    {
      id: 'dish_1001',
      cookId: 'cook_2000',
      name: 'Phở Bò (Beef Noodle Soup)',
      description: 'Traditional Vietnamese beef noodle soup with rice noodles, tender beef slices, and aromatic herbs in a 24-hour simmered beef bone broth',
      price: 14.99,
      category: 'Phở',
      photos: ['./assets/dishes/pho-bo.jpg'],
      ingredients: ['Rice noodles', 'Beef', 'Beef broth', 'Star anise', 'Ginger', 'Onions', 'Cilantro', 'Bean sprouts', 'Lime', 'Thai basil'],
      allergens: ['Gluten (may contain)'],
      dietaryInfo: ['Dairy-Free', 'Halal Available'],
      portionSize: 'Large bowl (approx. 650ml)',
      servings: 1,
      prepTime: 15,
      availabilityWindows: ['11:00-21:00'],
      inventoryCount: 50,
      spiceLevel: 1, // 0-5 scale
      calories: 450,
      tags: ['Popular', 'Signature Dish'],
      featured: true
    },
    {
      id: 'dish_1002',
      cookId: 'cook_2000',
      name: 'Bánh Mì Thịt Nướng',
      description: 'Vietnamese sandwich with grilled lemongrass pork, pickled vegetables, cilantro, and house-made sauce on a crispy baguette',
      price: 8.99,
      category: 'Bánh Mì',
      photos: ['./assets/dishes/banh-mi.jpg'],
      ingredients: ['Baguette', 'Grilled pork', 'Pickled daikon', 'Pickled carrots', 'Cucumber', 'Cilantro', 'Jalapeño', 'Mayonnaise', 'Soy sauce'],
      allergens: ['Gluten', 'Soy', 'Eggs'],
      dietaryInfo: [],
      portionSize: '8-inch sandwich',
      servings: 1,
      prepTime: 8,
      availabilityWindows: ['11:00-21:00'],
      inventoryCount: 30,
      spiceLevel: 2,
      calories: 520,
      tags: ['Quick Bite', 'Under $10'],
      featured: false
    },
    {
      id: 'dish_1003',
      cookId: 'cook_2000',
      name: 'Bún Thịt Nướng',
      description: 'Grilled lemongrass pork over vermicelli noodles with fresh herbs, pickled vegetables, and nuoc cham dressing',
      price: 13.99,
      category: 'Bún',
      photos: ['./assets/dishes/bun-thit-nuong.jpg'],
      ingredients: ['Vermicelli noodles', 'Grilled pork', 'Lettuce', 'Cucumber', 'Mint', 'Cilantro', 'Peanuts', 'Nuoc cham sauce'],
      allergens: ['Peanuts', 'Fish sauce'],
      dietaryInfo: ['Dairy-Free'],
      portionSize: 'Large bowl',
      servings: 1,
      prepTime: 12,
      availabilityWindows: ['11:00-21:00'],
      inventoryCount: 40,
      spiceLevel: 1,
      calories: 580,
      tags: ['Healthy', 'High Protein'],
      featured: false
    },
    {
      id: 'dish_1004',
      cookId: 'cook_2000',
      name: 'Gỏi Cuốn (Fresh Spring Rolls)',
      description: 'Fresh Vietnamese spring rolls with shrimp, pork, herbs, and vermicelli wrapped in rice paper, served with peanut sauce',
      price: 6.99,
      category: 'Appetizers',
      photos: ['./assets/dishes/goi-cuon.jpg'],
      ingredients: ['Rice paper', 'Shrimp', 'Pork', 'Vermicelli', 'Lettuce', 'Mint', 'Cilantro', 'Peanut sauce'],
      allergens: ['Shellfish', 'Peanuts'],
      dietaryInfo: ['Dairy-Free'],
      portionSize: '2 rolls',
      servings: 1,
      prepTime: 8,
      availabilityWindows: ['11:00-21:00'],
      inventoryCount: 25,
      spiceLevel: 0,
      calories: 240,
      tags: ['Appetizer', 'Light', 'Under $10'],
      featured: true
    },
    {
      id: 'dish_1005',
      cookId: 'cook_2000',
      name: 'Phở Chay (Vegetarian Phở)',
      description: 'Vegetarian Vietnamese noodle soup with tofu, mushrooms, and vegetables in a flavorful vegetable broth',
      price: 12.99,
      category: 'Phở',
      photos: ['./assets/dishes/pho-chay.jpg'],
      ingredients: ['Rice noodles', 'Tofu', 'Mushrooms', 'Bok choy', 'Bean sprouts', 'Vegetable broth', 'Herbs'],
      allergens: ['Soy'],
      dietaryInfo: ['Vegan', 'Dairy-Free'],
      portionSize: 'Large bowl',
      servings: 1,
      prepTime: 12,
      availabilityWindows: ['11:00-21:00'],
      inventoryCount: 35,
      spiceLevel: 1,
      calories: 380,
      tags: ['Vegan', 'Healthy'],
      featured: false
    },

    // Maria's Mexican Kitchen dishes
    {
      id: 'dish_1006',
      cookId: 'cook_2001',
      name: 'Tacos Al Pastor',
      description: 'Three authentic tacos with marinated pork, pineapple, onions, and cilantro on corn tortillas',
      price: 11.99,
      category: 'Tacos',
      photos: ['./assets/dishes/tacos-al-pastor.jpg'],
      ingredients: ['Corn tortillas', 'Pork', 'Pineapple', 'Onions', 'Cilantro', 'Lime', 'Salsa'],
      allergens: [],
      dietaryInfo: ['Gluten-Free', 'Dairy-Free'],
      portionSize: '3 tacos',
      servings: 1,
      prepTime: 10,
      availabilityWindows: ['12:00-22:00'],
      inventoryCount: 45,
      spiceLevel: 2,
      calories: 480,
      tags: ['Popular', 'Gluten-Free'],
      featured: true
    },
    {
      id: 'dish_1007',
      cookId: 'cook_2001',
      name: 'Chicken Burrito Bowl',
      description: 'Seasoned chicken with rice, black beans, salsa, guacamole, cheese, and sour cream',
      price: 13.99,
      category: 'Mains',
      photos: ['./assets/dishes/burrito-bowl.jpg'],
      ingredients: ['Rice', 'Black beans', 'Chicken', 'Salsa', 'Guacamole', 'Cheese', 'Sour cream', 'Lettuce'],
      allergens: ['Dairy'],
      dietaryInfo: [],
      portionSize: 'Large bowl',
      servings: 1,
      prepTime: 12,
      availabilityWindows: ['12:00-22:00'],
      inventoryCount: 40,
      spiceLevel: 2,
      calories: 650,
      tags: ['Filling', 'High Protein'],
      featured: false
    },
    {
      id: 'dish_1008',
      cookId: 'cook_2001',
      name: 'Mole Enchiladas',
      description: 'Three cheese enchiladas topped with authentic Oaxacan mole sauce, served with rice and beans',
      price: 14.99,
      category: 'Mains',
      photos: ['./assets/dishes/mole-enchiladas.jpg'],
      ingredients: ['Corn tortillas', 'Cheese', 'Mole sauce', 'Rice', 'Beans', 'Onions'],
      allergens: ['Dairy', 'Nuts (in mole)'],
      dietaryInfo: ['Vegetarian'],
      portionSize: '3 enchiladas with sides',
      servings: 1,
      prepTime: 15,
      availabilityWindows: ['12:00-22:00'],
      inventoryCount: 30,
      spiceLevel: 3,
      calories: 720,
      tags: ['Signature Dish', 'Vegetarian'],
      featured: true
    },
    {
      id: 'dish_1009',
      cookId: 'cook_2001',
      name: 'Guacamole & Chips',
      description: 'Fresh-made guacamole with avocado, tomatoes, onions, cilantro, and lime, served with crispy tortilla chips',
      price: 7.99,
      category: 'Appetizers',
      photos: ['./assets/dishes/guacamole.jpg'],
      ingredients: ['Avocado', 'Tomatoes', 'Onions', 'Cilantro', 'Lime', 'Jalapeño', 'Tortilla chips'],
      allergens: [],
      dietaryInfo: ['Vegan', 'Gluten-Free'],
      portionSize: 'Regular',
      servings: 1-2,
      prepTime: 5,
      availabilityWindows: ['12:00-22:00'],
      inventoryCount: 35,
      spiceLevel: 1,
      calories: 320,
      tags: ['Appetizer', 'Vegan', 'Under $10'],
      featured: false
    },

    // John's Italian Kitchen dishes
    {
      id: 'dish_1010',
      cookId: 'cook_2002',
      name: 'Spaghetti Carbonara',
      description: 'Classic Roman pasta with guanciale, eggs, Pecorino Romano, and black pepper. Made with fresh handmade spaghetti.',
      price: 15.99,
      category: 'Pasta',
      photos: ['./assets/dishes/carbonara.jpg'],
      ingredients: ['Fresh spaghetti', 'Guanciale', 'Eggs', 'Pecorino Romano cheese', 'Black pepper'],
      allergens: ['Gluten', 'Eggs', 'Dairy'],
      dietaryInfo: [],
      portionSize: 'Large plate',
      servings: 1,
      prepTime: 15,
      availabilityWindows: ['16:00-23:00'],
      inventoryCount: 25,
      spiceLevel: 0,
      calories: 680,
      tags: ['Signature Dish', 'Handmade Pasta'],
      featured: true
    },
    {
      id: 'dish_1011',
      cookId: 'cook_2002',
      name: 'Margherita Pizza',
      description: 'Classic Neapolitan pizza with San Marzano tomatoes, fresh mozzarella, basil, and extra virgin olive oil',
      price: 14.99,
      category: 'Pizza',
      photos: ['./assets/dishes/margherita.jpg'],
      ingredients: ['Pizza dough', 'San Marzano tomatoes', 'Fresh mozzarella', 'Basil', 'Olive oil'],
      allergens: ['Gluten', 'Dairy'],
      dietaryInfo: ['Vegetarian'],
      portionSize: '12-inch pizza',
      servings: 1-2,
      prepTime: 18,
      availabilityWindows: ['16:00-23:00'],
      inventoryCount: 30,
      spiceLevel: 0,
      calories: 890,
      tags: ['Popular', 'Vegetarian'],
      featured: true
    },
    {
      id: 'dish_1012',
      cookId: 'cook_2002',
      name: 'Mushroom Risotto',
      description: 'Creamy Arborio rice with porcini mushrooms, white wine, Parmesan, and truffle oil',
      price: 16.99,
      category: 'Mains',
      photos: ['./assets/dishes/risotto.jpg'],
      ingredients: ['Arborio rice', 'Porcini mushrooms', 'White wine', 'Parmesan', 'Truffle oil', 'Vegetable broth'],
      allergens: ['Dairy', 'Alcohol'],
      dietaryInfo: ['Vegetarian', 'Gluten-Free'],
      portionSize: 'Large bowl',
      servings: 1,
      prepTime: 20,
      availabilityWindows: ['16:00-23:00'],
      inventoryCount: 20,
      spiceLevel: 0,
      calories: 520,
      tags: ['Vegetarian', 'Gluten-Free', 'Gourmet'],
      featured: false
    },
    {
      id: 'dish_1013',
      cookId: 'cook_2002',
      name: 'Tiramisu',
      description: 'Classic Italian dessert with espresso-soaked ladyfingers, mascarpone cream, and cocoa powder',
      price: 7.99,
      category: 'Desserts',
      photos: ['./assets/dishes/tiramisu.jpg'],
      ingredients: ['Ladyfingers', 'Espresso', 'Mascarpone', 'Eggs', 'Sugar', 'Cocoa powder', 'Marsala wine'],
      allergens: ['Gluten', 'Eggs', 'Dairy', 'Alcohol'],
      dietaryInfo: [],
      portionSize: 'Regular slice',
      servings: 1,
      prepTime: 5,
      availabilityWindows: ['16:00-23:00'],
      inventoryCount: 15,
      spiceLevel: 0,
      calories: 420,
      tags: ['Dessert', 'Classic'],
      featured: false
    },

    // Sarah's Vegan Delights dishes
    {
      id: 'dish_1014',
      cookId: 'cook_2003',
      name: 'Buddha Bowl',
      description: 'Quinoa, roasted chickpeas, sweet potato, kale, avocado, and tahini dressing',
      price: 12.99,
      category: 'Bowls',
      photos: ['./assets/dishes/buddha-bowl.jpg'],
      ingredients: ['Quinoa', 'Chickpeas', 'Sweet potato', 'Kale', 'Avocado', 'Tahini', 'Lemon'],
      allergens: ['Sesame'],
      dietaryInfo: ['Vegan', 'Gluten-Free', 'High Protein'],
      portionSize: 'Large bowl',
      servings: 1,
      prepTime: 10,
      availabilityWindows: ['10:00-19:00'],
      inventoryCount: 35,
      spiceLevel: 0,
      calories: 480,
      tags: ['Vegan', 'Healthy', 'Popular'],
      featured: true
    },
    {
      id: 'dish_1015',
      cookId: 'cook_2003',
      name: 'Beyond Burger',
      description: 'Plant-based burger with lettuce, tomato, pickles, and special sauce on a whole wheat bun, served with sweet potato fries',
      price: 14.99,
      category: 'Burgers',
      photos: ['./assets/dishes/vegan-burger.jpg'],
      ingredients: ['Beyond burger patty', 'Whole wheat bun', 'Lettuce', 'Tomato', 'Pickles', 'Vegan mayo', 'Sweet potato'],
      allergens: ['Gluten', 'Soy'],
      dietaryInfo: ['Vegan'],
      portionSize: 'Burger + fries',
      servings: 1,
      prepTime: 12,
      availabilityWindows: ['10:00-19:00'],
      inventoryCount: 30,
      spiceLevel: 0,
      calories: 620,
      tags: ['Vegan', 'High Protein'],
      featured: false
    },
    {
      id: 'dish_1016',
      cookId: 'cook_2003',
      name: 'Açaí Smoothie Bowl',
      description: 'Açaí berry smoothie topped with granola, fresh berries, banana, and almond butter',
      price: 10.99,
      category: 'Breakfast',
      photos: ['./assets/dishes/acai-bowl.jpg'],
      ingredients: ['Açaí berries', 'Banana', 'Granola', 'Strawberries', 'Blueberries', 'Almond butter', 'Coconut'],
      allergens: ['Tree nuts', 'Oats'],
      dietaryInfo: ['Vegan', 'Organic'],
      portionSize: 'Large bowl',
      servings: 1,
      prepTime: 8,
      availabilityWindows: ['10:00-19:00'],
      inventoryCount: 25,
      spiceLevel: 0,
      calories: 380,
      tags: ['Breakfast', 'Vegan', 'Healthy', 'Under $15'],
      featured: true
    },

    // Amir's Middle Eastern dishes
    {
      id: 'dish_1017',
      cookId: 'cook_2004',
      name: 'Chicken Shawarma Plate',
      description: 'Marinated chicken shawarma served with rice, salad, hummus, and pita bread',
      price: 13.99,
      category: 'Mains',
      photos: ['./assets/dishes/shawarma-plate.jpg'],
      ingredients: ['Chicken', 'Rice', 'Lettuce', 'Tomatoes', 'Cucumbers', 'Hummus', 'Pita bread', 'Tahini sauce'],
      allergens: ['Sesame', 'Gluten'],
      dietaryInfo: ['Halal', 'High Protein'],
      portionSize: 'Large plate',
      servings: 1,
      prepTime: 12,
      availabilityWindows: ['11:00-23:00'],
      inventoryCount: 40,
      spiceLevel: 2,
      calories: 680,
      tags: ['Halal', 'Popular', 'High Protein'],
      featured: true
    },
    {
      id: 'dish_1018',
      cookId: 'cook_2004',
      name: 'Falafel Wrap',
      description: 'Crispy falafel with hummus, tahini, pickled vegetables, and fresh herbs in a warm pita',
      price: 9.99,
      category: 'Wraps',
      photos: ['./assets/dishes/falafel-wrap.jpg'],
      ingredients: ['Falafel', 'Pita bread', 'Hummus', 'Tahini', 'Pickled turnips', 'Tomatoes', 'Lettuce', 'Parsley'],
      allergens: ['Sesame', 'Gluten'],
      dietaryInfo: ['Vegan', 'Halal'],
      portionSize: 'Large wrap',
      servings: 1,
      prepTime: 8,
      availabilityWindows: ['11:00-23:00'],
      inventoryCount: 35,
      spiceLevel: 1,
      calories: 450,
      tags: ['Vegan', 'Halal', 'Under $10'],
      featured: false
    },
    {
      id: 'dish_1019',
      cookId: 'cook_2004',
      name: 'Mezze Platter',
      description: 'Assorted mezze including hummus, baba ghanoush, tabbouleh, falafel, and pita bread',
      price: 16.99,
      category: 'Appetizers',
      photos: ['./assets/dishes/mezze-platter.jpg'],
      ingredients: ['Hummus', 'Baba ghanoush', 'Tabbouleh', 'Falafel', 'Olives', 'Pita bread', 'Tahini'],
      allergens: ['Sesame', 'Gluten'],
      dietaryInfo: ['Vegan', 'Halal'],
      portionSize: 'Large platter (serves 2-3)',
      servings: 2-3,
      prepTime: 15,
      availabilityWindows: ['11:00-23:00'],
      inventoryCount: 20,
      spiceLevel: 0,
      calories: 780,
      tags: ['Appetizer', 'Vegan', 'Halal', 'Sharing'],
      featured: true
    },
    {
      id: 'dish_1020',
      cookId: 'cook_2004',
      name: 'Beef Kofta Kabobs',
      description: 'Grilled ground beef kabobs with Middle Eastern spices, served with rice and salad',
      price: 15.99,
      category: 'Mains',
      photos: ['./assets/dishes/kofta.jpg'],
      ingredients: ['Ground beef', 'Onions', 'Parsley', 'Spices', 'Rice', 'Salad', 'Tahini sauce'],
      allergens: ['Sesame'],
      dietaryInfo: ['Halal', 'High Protein', 'Dairy-Free'],
      portionSize: '3 skewers with sides',
      servings: 1,
      prepTime: 15,
      availabilityWindows: ['11:00-23:00'],
      inventoryCount: 30,
      spiceLevel: 2,
      calories: 720,
      tags: ['Halal', 'High Protein'],
      featured: false
    }
  ];

  // Category definitions for filtering
  const categories = [
    { id: 'cat_home_cooks', name: 'Home Cooks', icon: '👨‍🍳', description: 'All home chefs' },
    { id: 'cat_meal_prep', name: 'Meal Prep', icon: '📦', description: 'Meals for the week' },
    { id: 'cat_family_meals', name: 'Family Meals', icon: '👨‍👩‍👧‍👦', description: 'Large portions for families' },
    { id: 'cat_vegan', name: 'Vegan', icon: '🌱', description: 'Plant-based meals' },
    { id: 'cat_halal', name: 'Halal', icon: '🥙', description: 'Halal certified' },
    { id: 'cat_gluten_free', name: 'Gluten-Free', icon: '🌾', description: 'No gluten' },
    { id: 'cat_under_15', name: 'Under $15', icon: '💵', description: 'Budget-friendly' },
    { id: 'cat_near_you', name: 'Near You', icon: '📍', description: 'Closest to you' },
    { id: 'cat_vietnamese', name: 'Vietnamese', icon: '🍜', description: 'Vietnamese cuisine' },
    { id: 'cat_mexican', name: 'Mexican', icon: '🌮', description: 'Mexican cuisine' },
    { id: 'cat_italian', name: 'Italian', icon: '🍝', description: 'Italian cuisine' },
    { id: 'cat_middle_eastern', name: 'Middle Eastern', icon: '🧆', description: 'Middle Eastern cuisine' }
  ];

  // Promotions and offers
  const promotions = [
    {
      id: 'promo_001',
      marketId: 'market_hamilton_on',
      type: 'delivery_discount',
      title: 'Free Delivery Weekend',
      description: 'Free delivery on all orders over $30 this weekend!',
      rules: { minOrder: 30, deliveryDiscount: 100 },
      activePeriod: { start: '2026-02-14T00:00:00Z', end: '2026-02-16T23:59:59Z' },
      cookIds: null, // applies to all cooks
      imageUrl: './assets/promos/free-delivery.jpg',
      featured: true
    },
    {
      id: 'promo_002',
      marketId: 'market_hamilton_on',
      type: 'percentage_discount',
      title: '20% Off First Order',
      description: 'New to RideNDine? Get 20% off your first order!',
      rules: { percentageOff: 20, maxDiscount: 15, firstOrderOnly: true },
      activePeriod: { start: '2026-02-01T00:00:00Z', end: '2026-02-28T23:59:59Z' },
      cookIds: null,
      imageUrl: './assets/promos/first-order.jpg',
      featured: true
    },
    {
      id: 'promo_003',
      marketId: 'market_hamilton_on',
      type: 'cook_special',
      title: 'Hoàng Gia Phở Special',
      description: 'Buy 2 Phở, get 1 free appetizer!',
      rules: { cookId: 'cook_2000', minItems: 2, freeItem: 'appetizer' },
      activePeriod: { start: '2026-02-11T00:00:00Z', end: '2026-02-18T23:59:59Z' },
      cookIds: ['cook_2000'],
      imageUrl: './assets/promos/pho-special.jpg',
      featured: true
    }
  ];

  // Reviews and ratings
  const reviews = [
    {
      id: 'review_001',
      cookId: 'cook_2000',
      customerId: 'customer_1001',
      customerName: 'Sarah J.',
      rating: 5,
      comment: 'Best phở in Hamilton! The broth is incredible and reminds me of my trip to Vietnam. Delivery was fast too!',
      orderId: 'order_4567',
      helpful: 42,
      createdAt: '2026-02-08T18:30:00Z',
      verified: true
    },
    {
      id: 'review_002',
      cookId: 'cook_2000',
      customerId: 'customer_1002',
      customerName: 'Michael C.',
      rating: 5,
      comment: 'Authentic Vietnamese food. The spring rolls are fresh and delicious. Will definitely order again!',
      orderId: 'order_4568',
      helpful: 38,
      createdAt: '2026-02-07T12:15:00Z',
      verified: true
    },
    {
      id: 'review_003',
      cookId: 'cook_2001',
      customerId: 'customer_1003',
      customerName: 'Emily R.',
      rating: 5,
      comment: 'Maria\'s tacos are absolutely amazing! So authentic and flavorful. The al pastor is my favorite!',
      orderId: 'order_4569',
      helpful: 31,
      createdAt: '2026-02-09T19:45:00Z',
      verified: true
    },
    {
      id: 'review_004',
      cookId: 'cook_2002',
      customerId: 'customer_1004',
      customerName: 'James W.',
      rating: 5,
      comment: 'John makes the best carbonara outside of Italy. The pasta is perfectly al dente and the sauce is silky smooth.',
      orderId: 'order_4570',
      helpful: 45,
      createdAt: '2026-02-06T20:30:00Z',
      verified: true
    }
  ];

  // Grocery items for grocery tie-in feature
  const groceryItems = [
    {
      id: 'grocery_001',
      marketId: 'market_hamilton_on',
      name: 'Organic Chicken Breast',
      category: 'Meat & Poultry',
      price: 8.99,
      unit: 'lb',
      image: './assets/grocery/chicken-breast.jpg',
      tags: ['Organic', 'High Protein'],
      inStock: true
    },
    {
      id: 'grocery_002',
      marketId: 'market_hamilton_on',
      name: 'Rice Noodles',
      category: 'Pantry',
      price: 3.99,
      unit: 'pack',
      image: './assets/grocery/rice-noodles.jpg',
      tags: ['Gluten-Free', 'Asian'],
      inStock: true
    },
    {
      id: 'grocery_003',
      marketId: 'market_hamilton_on',
      name: 'Fresh Basil',
      category: 'Produce',
      price: 2.49,
      unit: 'bunch',
      image: './assets/grocery/basil.jpg',
      tags: ['Fresh', 'Herbs'],
      inStock: true
    },
    {
      id: 'grocery_004',
      marketId: 'market_hamilton_on',
      name: 'Avocados (3 pack)',
      category: 'Produce',
      price: 4.99,
      unit: 'pack',
      image: './assets/grocery/avocados.jpg',
      tags: ['Fresh', 'Healthy'],
      inStock: true
    },
    {
      id: 'grocery_005',
      marketId: 'market_hamilton_on',
      name: 'Olive Oil (Extra Virgin)',
      category: 'Pantry',
      price: 12.99,
      unit: 'bottle',
      image: './assets/grocery/olive-oil.jpg',
      tags: ['Premium', 'Mediterranean'],
      inStock: true
    }
  ];

  // Meal kits (cook-at-home bundles)
  const mealKits = [
    {
      id: 'kit_001',
      marketId: 'market_hamilton_on',
      cookId: 'cook_2000',
      name: 'DIY Phở Kit',
      description: 'Everything you need to make authentic Vietnamese Phở at home',
      price: 24.99,
      savingsVsDelivery: 8.00,
      servings: 4,
      prepTime: 30,
      difficulty: 'Medium',
      recipe: {
        steps: [
          'Simmer broth with spices for 20 minutes',
          'Cook rice noodles according to package',
          'Slice beef thinly',
          'Assemble bowl with noodles, broth, beef, and herbs',
          'Garnish with lime, basil, and bean sprouts'
        ],
        cookTime: 30,
        totalTime: 35
      },
      groceryList: ['Rice noodles', 'Beef broth', 'Beef slices', 'Star anise', 'Ginger', 'Bean sprouts', 'Thai basil', 'Lime'],
      imageUrl: './assets/kits/pho-kit.jpg',
      tags: ['Vietnamese', 'Family Meal'],
      inStock: true
    },
    {
      id: 'kit_002',
      marketId: 'market_hamilton_on',
      cookId: 'cook_2002',
      name: 'Fresh Pasta Night Kit',
      description: 'Make restaurant-quality carbonara at home with fresh ingredients',
      price: 19.99,
      savingsVsDelivery: 6.00,
      servings: 2,
      prepTime: 20,
      difficulty: 'Easy',
      recipe: {
        steps: [
          'Cook fresh spaghetti in salted boiling water',
          'Crisp guanciale in a pan',
          'Mix eggs and Pecorino Romano',
          'Toss hot pasta with guanciale and egg mixture',
          'Season with black pepper'
        ],
        cookTime: 20,
        totalTime: 25
      },
      groceryList: ['Fresh spaghetti', 'Guanciale', 'Eggs', 'Pecorino Romano', 'Black pepper'],
      imageUrl: './assets/kits/pasta-kit.jpg',
      tags: ['Italian', 'Quick Meal'],
      inStock: true
    }
  ];

  // Expose data globally
  window.RideNDineDemoData = {
    markets,
    cooks,
    dishes,
    categories,
    promotions,
    reviews,
    groceryItems,
    mealKits,
    
    // Helper functions
    getCookById: (id) => cooks.find(c => c.id === id),
    getCookBySlug: (slug) => cooks.find(c => c.slug === slug),
    getDishesByCook: (cookId) => dishes.filter(d => d.cookId === cookId),
    getDishesByCategory: (category) => dishes.filter(d => d.category === category),
    getFeaturedCooks: () => cooks.filter(c => c.featured),
    getFeaturedDishes: () => dishes.filter(d => d.featured),
    getActivePromotions: () => {
      const now = new Date();
      return promotions.filter(p => {
        const start = new Date(p.activePeriod.start);
        const end = new Date(p.activePeriod.end);
        return now >= start && now <= end;
      });
    },
    getReviewsByCook: (cookId) => reviews.filter(r => r.cookId === cookId),
    searchCooks: (query) => {
      const lowerQuery = query.toLowerCase();
      return cooks.filter(c => 
        c.kitchenName.toLowerCase().includes(lowerQuery) ||
        c.bio.toLowerCase().includes(lowerQuery) ||
        c.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
        c.cuisineTypes.some(ct => ct.toLowerCase().includes(lowerQuery))
      );
    },
    searchDishes: (query) => {
      const lowerQuery = query.toLowerCase();
      return dishes.filter(d => 
        d.name.toLowerCase().includes(lowerQuery) ||
        d.description.toLowerCase().includes(lowerQuery) ||
        d.category.toLowerCase().includes(lowerQuery)
      );
    },
    filterCooks: (filters) => {
      let filtered = [...cooks];
      
      if (filters.cuisineType) {
        filtered = filtered.filter(c => c.cuisineTypes.includes(filters.cuisineType));
      }
      
      if (filters.minRating) {
        filtered = filtered.filter(c => c.rating >= filters.minRating);
      }
      
      if (filters.maxDeliveryFee) {
        filtered = filtered.filter(c => c.deliveryFee <= filters.maxDeliveryFee);
      }
      
      if (filters.dietary) {
        filtered = filtered.filter(c => c.tags.includes(filters.dietary));
      }
      
      if (filters.fulfillmentMethod) {
        filtered = filtered.filter(c => c.fulfillmentMethods.includes(filters.fulfillmentMethod));
      }
      
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'rating':
            filtered.sort((a, b) => b.rating - a.rating);
            break;
          case 'delivery_fee':
            filtered.sort((a, b) => a.deliveryFee - b.deliveryFee);
            break;
          case 'delivery_time':
            filtered.sort((a, b) => a.avgDeliveryTime - b.avgDeliveryTime);
            break;
          case 'popular':
            filtered.sort((a, b) => b.orderCount - a.orderCount);
            break;
        }
      }
      
      return filtered;
    }
  };

  console.log('[RideNDine] Demo data loaded successfully');
  console.log(`  - ${markets.length} markets`);
  console.log(`  - ${cooks.length} home cooks`);
  console.log(`  - ${dishes.length} dishes`);
  console.log(`  - ${categories.length} categories`);
  console.log(`  - ${promotions.length} promotions`);
  console.log(`  - ${groceryItems.length} grocery items`);
  console.log(`  - ${mealKits.length} meal kits`);

})();
