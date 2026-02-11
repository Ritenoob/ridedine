const db = require('./server/db');

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create admin user (sean@seanfinlay.ca / Admin0123)
    await db.query(`
      INSERT INTO users (email, name, phone, role, hashed_password)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['sean@seanfinlay.ca', 'Sean Finlay', '+1-555-0100', 'admin', null]);
    console.log('✅ Created admin user: sean@seanfinlay.ca');

    // Create sample chefs
    const chefs = [
      { email: 'mei@example.com', name: 'Mei Chen', displayName: 'Mei\'s Vietnamese Kitchen', slug: 'meis-vietnamese', cuisine: ['Vietnamese'], lat: 43.6532, lng: -79.3832 },
      { email: 'rosa@example.com', name: 'Rosa Garcia', displayName: 'Rosa\'s Tacos', slug: 'rosas-tacos', cuisine: ['Mexican'], lat: 43.6426, lng: -79.3871 },
      { email: 'giovanni@example.com', name: 'Giovanni Rossi', displayName: 'Giovanni\'s Italian', slug: 'giovannis-italian', cuisine: ['Italian'], lat: 43.6629, lng: -79.3957 }
    ];

    for (const chef of chefs) {
      const userResult = await db.query(`
        INSERT INTO users (email, name, phone, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `, [chef.email, chef.name, '+1-555-0000', 'chef']);

      await db.query(`
        INSERT INTO chefs (user_id, display_name, slug, bio, cuisine_tags, pickup_geo, prep_capacity_per_hour)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (slug) DO NOTHING
      `, [
        userResult.rows[0].id,
        chef.displayName,
        chef.slug,
        `Authentic ${chef.cuisine[0]} cuisine`,
        JSON.stringify(chef.cuisine),
        JSON.stringify({ lat: chef.lat, lng: chef.lng }),
        10
      ]);
    }
    console.log('✅ Created sample chefs');

    // Create sample drivers
    const drivers = [
      { email: 'driver1@example.com', name: 'John Driver', vehicle: 'car' },
      { email: 'driver2@example.com', name: 'Jane Driver', vehicle: 'bike' },
      { email: 'driver3@example.com', name: 'Mike Driver', vehicle: 'car' }
    ];

    for (const driver of drivers) {
      const userResult = await db.query(`
        INSERT INTO users (email, name, phone, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `, [driver.email, driver.name, '+1-555-0000', 'driver']);

      await db.query(`
        INSERT INTO drivers (user_id, vehicle_type, status, current_geo)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
      `, [
        userResult.rows[0].id,
        driver.vehicle,
        'available',
        JSON.stringify({ lat: 43.6532, lng: -79.3832 })
      ]);
    }
    console.log('✅ Created sample drivers');

    // Create partners (Cooco and Hoang Gia Pho)
    await db.query(`
      INSERT INTO partners (name, slug, url, is_external)
      VALUES 
        ($1, $2, $3, $4),
        ($5, $6, $7, $8)
      ON CONFLICT (slug) DO NOTHING
    `, [
      'Cooco Meal Plan', 'cooco', 'https://cooco.app/mealplan', true,
      'Hoang Gia Pho', 'hoang-gia-pho', 'https://hoang-gia-pho-site-of8l.vercel.app/hoang-gia-pho-delivery.html', true
    ]);
    console.log('✅ Created partner integrations');

    // Create sample customer
    const customerResult = await db.query(`
      INSERT INTO users (email, name, phone, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, ['customer@example.com', 'Test Customer', '+1-555-1234', 'customer']);

    await db.query(`
      INSERT INTO customers (user_id, saved_addresses, marketing_opt_in)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
    `, [
      customerResult.rows[0].id,
      JSON.stringify([{ address: '123 Main St, Toronto, ON', lat: 43.6532, lng: -79.3832 }]),
      true
    ]);
    console.log('✅ Created sample customer');

    // Add menu items for chefs
    const chefResult = await db.query(`SELECT id FROM chefs WHERE slug = 'meis-vietnamese'`);
    if (chefResult.rows.length > 0) {
      await db.query(`
        INSERT INTO menu_items (chef_id, name, description, price, prep_time_minutes, active)
        VALUES 
          ($1, $2, $3, $4, $5, $6),
          ($1, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING
      `, [
        chefResult.rows[0].id,
        'Pho Bo', 'Traditional Vietnamese beef noodle soup', 12.99, 20, true,
        'Banh Mi', 'Vietnamese sandwich with pork and vegetables', 8.99, 15, true
      ]);
    }
    console.log('✅ Created sample menu items');

    console.log('🎉 Database seeded successfully!');
    console.log('\n📝 Demo credentials:');
    console.log('   Email: sean@seanfinlay.ca');
    console.log('   Password: Admin0123');
    console.log('   (In DEMO_MODE, password is not required)\n');
  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  } finally {
    await db.shutdown();
  }
}

// Run seed if called directly
if (require.main === module) {
  seed().catch(console.error);
}

module.exports = seed;
