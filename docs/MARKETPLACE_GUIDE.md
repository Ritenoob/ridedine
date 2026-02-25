# Home Cooks Marketplace - Feature Guide

## Overview

The RideNDine Home Cooks Marketplace is a modern, comprehensive food delivery platform connecting customers with local home chefs. Built with a mobile-first approach and following proven UX patterns from successful delivery apps.

## Key Features

### 🏠 For Customers

#### Marketplace Browse (`/marketplace`)

- Modern search interface with auto-complete
- Category chips for quick filtering (Vegan, Halal, Gluten-Free, etc.)
- "Today's Offers" promotional carousel
- Filter by: Best overall, Rating, Delivery fee, Delivery time, Price
- Featured home cooks with ratings, reviews, and delivery info
- Browse by cuisine type

**Cook Profile Pages (`/cook/:slug`)**

- Comprehensive cook information with bio and story
- Menu organized by categories
- Dish filtering by category
- Reviews and ratings display
- Hours of operation
- Certifications and specialties
- Service area and delivery info

**Dish Details**
- Full ingredient lists
- Allergen warnings
- Dietary information (Vegan, Halal, Gluten-Free, etc.)
- Nutritional info (calories, portion size, spice level)
- Prep time and availability
- Add to cart functionality

**Bottom Navigation**
- Home: Browse marketplace
- Services: Reserved for future rides feature
- Activity: Order tracking
- Offers: View promotions
- Account: User profile

### 👨‍🍳 Home Cook Profiles

Each cook profile includes:
- Kitchen name and bio
- Owner story
- Cuisine specialties
- Service radius
- Delivery and pickup options
- Operating hours
- Certifications
- Response time
- Acceptance rate
- Average delivery time
- Minimum order amount
- Featured badge (if applicable)
- Promotional offers

### 🍽️ Dish Information

Every dish includes:
- Name and description
- Price
- High-quality photo
- Category (Phở, Pasta, Tacos, etc.)
- Ingredients list
- Allergen warnings
- Dietary tags (Vegan, Halal, etc.)
- Portion size
- Servings
- Prep time
- Availability windows
- Calories
- Spice level
- Featured/popular badge

### 🏷️ Categories & Filters

**Quick Categories:**
- Home Cooks
- Meal Prep
- Family Meals
- Vegan
- Halal
- Gluten-Free
- Under $15
- Near You

**Sort Options:**
- Best Overall (popularity)
- Highest Rated
- Lowest Delivery Fee
- Under 30 min
- Price Range

**Cuisine Types:**
- Vietnamese
- Mexican
- Italian
- Middle Eastern
- Vegan
- And more...

### 💰 Promotions & Offers

- Time-based promotions
- Free delivery offers
- First order discounts
- Cook-specific specials
- Bundle deals

## Data Models

### Markets
```javascript
{
  id: 'market_hamilton_on',
  name: 'Hamilton, ON',
  currency: 'CAD',
  taxRate: 0.13,
  deliveryFeeBase: 2.99,
  serviceFeeRate: 0.10,
  minOrder: 10.00,
  active: true
}
```

### Cook Profiles
```javascript
{
  id: 'cook_2000',
  slug: 'hoang-gia-pho',
  kitchenName: 'Hoàng Gia Phở',
  bio: '...',
  story: '...',
  cuisineTypes: ['Vietnamese', 'Asian'],
  specialties: ['Phở', 'Bánh Mì'],
  rating: 4.9,
  reviewCount: 847,
  serviceRadiusKm: 10,
  deliveryFee: 2.99,
  minOrder: 15.00,
  avgDeliveryTime: 35,
  hours: { ... },
  certifications: [...],
  tags: ['Halal Options', 'Gluten-Free Options']
}
```

### Dishes
```javascript
{
  id: 'dish_1001',
  cookId: 'cook_2000',
  name: 'Phở Bò',
  description: '...',
  price: 14.99,
  category: 'Phở',
  ingredients: [...],
  allergens: ['Gluten (may contain)'],
  dietaryInfo: ['Dairy-Free', 'Halal Available'],
  portionSize: 'Large bowl',
  prepTime: 15,
  calories: 450,
  spiceLevel: 1,
  featured: true
}
```

## Demo Data

The marketplace includes comprehensive demo data:

- **5 Home Cooks:**
  - Hoàng Gia Phở (Vietnamese)
  - Maria's Mexican Kitchen (Mexican)
  - John's Italian Kitchen (Italian)
  - Sarah's Vegan Delights (Vegan)
  - Amir's Middle Eastern Cuisine (Middle Eastern/Halal)

- **20+ Dishes** across all cooks with full details
- **12 Categories** for filtering
- **3 Active Promotions**
- **Authentic Reviews** with ratings and comments
- **Grocery Items** (5 items for future feature)
- **Meal Kits** (2 kits for cook-at-home bundles)

## Technical Implementation

### Client-Side Architecture

The marketplace is built to work standalone on GitHub Pages without a backend:

**Data Layer (demo data file not included in this repo):**
- All data stored in JavaScript objects
- Helper functions for search, filter, sort
- Exposed globally as `window.RideNDineDemoData`

**Pages:**
- `marketplace.html` - Browse page with search and filters
- `cook-detail.html` - Cook profile with menu
- `landing.html` - Updated with marketplace link

**Components:**
- Search header with location selector
- Horizontal category chips
- Offers carousel
- Cook cards with ratings
- Filter chips row
- Bottom navigation bar
- Dish detail modal

### Responsive Design

Mobile-first approach with breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Navigation

The router supports:
- Dynamic routing with parameters (`/cook/:slug`)
- History API for SPA navigation
- Before/after navigation hooks
- Base path detection for GitHub Pages

## Using the Marketplace

### Browsing Cooks

1. Visit `/marketplace`
2. Use search bar to find specific cuisines or dishes
3. Click category chips to filter (e.g., "Vegan", "Halal")
4. Apply additional filters (rating, delivery fee, etc.)
5. Browse featured cooks or cuisine categories

### Viewing Cook Profile

1. Click on any cook card
2. Navigate to `/cook/:slug` (e.g., `/cook/hoang-gia-pho`)
3. View menu organized by categories
4. Click "About" tab for cook's story
5. Click "Reviews" tab for customer feedback
6. Click "Info" tab for delivery details

### Viewing Dish Details

1. On cook profile page, click any dish card
2. Modal opens with full dish information
3. View ingredients, allergens, dietary info
4. Adjust quantity with +/- buttons
5. Click "Add to Cart" (placeholder for now)

### Filtering & Search

**Search:**
- Type in search bar
- Searches across cook names, bios, tags, cuisine types, dish names

**Category Filter:**
- Click category chip
- Updates cook list instantly
- Maintains scroll position

**Sort Filter:**
- Click sort option
- Re-orders cooks by selected criteria

## Future Enhancements

### Phase 1 (Next)
- [ ] Cart service integration
- [ ] Checkout flow with Stripe
- [ ] Real order creation

### Phase 2
- [ ] Cook portal for menu management
- [ ] Order acceptance workflow
- [ ] Driver dispatch system

### Phase 3
- [ ] Grocery shopping integration
- [ ] Meal kits marketplace
- [ ] Savings calculator

### Phase 4
- [ ] Real-time order tracking
- [ ] In-app chat
- [ ] Push notifications

### Phase 5 (Long-term)
- [ ] Rides integration (shared dispatch)
- [ ] Subscription meal plans
- [ ] Gift cards & loyalty program

## API Reference

### Global Data Object

```javascript
window.RideNDineDemoData = {
  markets: [...],
  cooks: [...],
  dishes: [...],
  categories: [...],
  promotions: [...],
  reviews: [...],
  groceryItems: [...],
  mealKits: [...],
  
  // Helper methods
  getCookById(id),
  getCookBySlug(slug),
  getDishesByCook(cookId),
  getDishesByCategory(category),
  getFeaturedCooks(),
  getFeaturedDishes(),
  getActivePromotions(),
  getReviewsByCook(cookId),
  searchCooks(query),
  searchDishes(query),
  filterCooks(filters)
}
```

### Filter Options

```javascript
// Example filter usage
const filtered = RideNDineDemoData.filterCooks({
  cuisineType: 'Vietnamese',
  minRating: 4.5,
  maxDeliveryFee: 3.00,
  dietary: 'Vegan',
  fulfillmentMethod: 'delivery',
  sortBy: 'rating' // or 'delivery_fee', 'delivery_time', 'popular'
});
```

## Performance

- **Lazy Loading**: Images loaded on demand
- **Efficient Rendering**: Virtual scrolling for large lists
- **Debounced Search**: 300ms delay to reduce re-renders
- **Cached Queries**: Search results cached temporarily
- **Minimal Dependencies**: Pure JavaScript, no frameworks

## Accessibility

- Semantic HTML5 elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management
- Screen reader friendly
- Color contrast compliance (WCAG AA)

## SEO Optimization

- Proper title tags for each page
- Meta descriptions
- OpenGraph tags
- Structured data (future)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- iOS Safari (iOS 12+)
- Chrome Mobile (latest)

## Deployment

The marketplace works on:
- Local development (with or without backend)
- GitHub Pages (standalone)
- Any static hosting (Netlify, Vercel, etc.)
- With backend (when available)

Deployment instructions for the GitHub Pages demo are not included in this repo.

## Credits

Built with ❤️ for RideNDine by the development team.

Inspired by modern delivery apps: Uber Eats, DoorDash, Skip the Dishes, and Deliveroo.
