/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Users table - central auth
  pgm.createTable('users', {
    id: { type: 'serial', primaryKey: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    name: { type: 'varchar(255)', notNull: true },
    phone: { type: 'varchar(50)' },
    role: { type: 'varchar(50)', notNull: true }, // customer, chef, driver, admin
    hashed_password: { type: 'text' }, // optional in demo mode
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });
  pgm.createIndex('users', 'email');
  pgm.createIndex('users', 'role');

  // Customers
  pgm.createTable('customers', {
    id: { type: 'serial', primaryKey: true },
    user_id: { type: 'integer', notNull: true, references: 'users', onDelete: 'CASCADE' },
    saved_addresses: { type: 'jsonb', default: '[]' },
    marketing_opt_in: { type: 'boolean', default: false },
    notes: { type: 'text' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });
  pgm.createIndex('customers', 'user_id');

  // Chefs
  pgm.createTable('chefs', {
    id: { type: 'serial', primaryKey: true },
    user_id: { type: 'integer', notNull: true, references: 'users', onDelete: 'CASCADE' },
    display_name: { type: 'varchar(255)', notNull: true },
    slug: { type: 'varchar(255)', notNull: true, unique: true },
    bio: { type: 'text' },
    cuisine_tags: { type: 'jsonb', default: '[]' },
    pickup_geo: { type: 'jsonb' }, // {lat, lng}
    prep_capacity_per_hour: { type: 'integer', default: 10 },
    availability_windows: { type: 'jsonb', default: '[]' },
    image_url: { type: 'varchar(500)' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });
  pgm.createIndex('chefs', 'user_id');
  pgm.createIndex('chefs', 'slug');

  // Drivers
  pgm.createTable('drivers', {
    id: { type: 'serial', primaryKey: true },
    user_id: { type: 'integer', notNull: true, references: 'users', onDelete: 'CASCADE' },
    vehicle_type: { type: 'varchar(50)' },
    shift_windows: { type: 'jsonb', default: '[]' },
    current_geo: { type: 'jsonb' }, // {lat, lng}
    status: { type: 'varchar(50)', default: 'offline' }, // offline, available, on_route
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });
  pgm.createIndex('drivers', 'user_id');
  pgm.createIndex('drivers', 'status');

  // Partners (external restaurants like Cooco, Hoang Gia Pho)
  pgm.createTable('partners', {
    id: { type: 'serial', primaryKey: true },
    name: { type: 'varchar(255)', notNull: true },
    slug: { type: 'varchar(255)', notNull: true, unique: true },
    url: { type: 'varchar(500)' },
    menu_json: { type: 'jsonb' },
    is_external: { type: 'boolean', default: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });
  pgm.createIndex('partners', 'slug');

  // Menu items
  pgm.createTable('menu_items', {
    id: { type: 'serial', primaryKey: true },
    chef_id: { type: 'integer', references: 'chefs', onDelete: 'CASCADE' },
    partner_id: { type: 'integer', references: 'partners', onDelete: 'CASCADE' },
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    price: { type: 'decimal(10,2)', notNull: true },
    prep_time_minutes: { type: 'integer', default: 30 },
    image_url: { type: 'varchar(500)' },
    active: { type: 'boolean', default: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });
  pgm.createIndex('menu_items', 'chef_id');
  pgm.createIndex('menu_items', 'partner_id');
  pgm.createIndex('menu_items', 'active');

  // Orders
  pgm.createTable('orders', {
    id: { type: 'serial', primaryKey: true },
    customer_id: { type: 'integer', notNull: true, references: 'customers', onDelete: 'CASCADE' },
    chef_id: { type: 'integer', references: 'chefs' },
    partner_id: { type: 'integer', references: 'partners' },
    status: { type: 'varchar(50)', default: 'pending' }, // pending, preparing, ready, on_route, delivered, cancelled
    delivery_address: { type: 'jsonb', notNull: true },
    subtotal: { type: 'decimal(10,2)', notNull: true },
    fees: { type: 'decimal(10,2)', default: 0 },
    tax: { type: 'decimal(10,2)', default: 0 },
    total: { type: 'decimal(10,2)', notNull: true },
    notes: { type: 'text' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });
  pgm.createIndex('orders', 'customer_id');
  pgm.createIndex('orders', 'chef_id');
  pgm.createIndex('orders', 'partner_id');
  pgm.createIndex('orders', 'status');
  pgm.createIndex('orders', 'created_at');

  // Order items
  pgm.createTable('order_items', {
    id: { type: 'serial', primaryKey: true },
    order_id: { type: 'integer', notNull: true, references: 'orders', onDelete: 'CASCADE' },
    menu_item_id: { type: 'integer', notNull: true, references: 'menu_items' },
    quantity: { type: 'integer', notNull: true, default: 1 },
    unit_price: { type: 'decimal(10,2)', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });
  pgm.createIndex('order_items', 'order_id');
  pgm.createIndex('order_items', 'menu_item_id');

  // Routes (batch deliveries)
  pgm.createTable('routes', {
    id: { type: 'serial', primaryKey: true },
    batch_id: { type: 'varchar(100)' },
    driver_id: { type: 'integer', references: 'drivers' },
    stops_json: { type: 'jsonb', default: '[]' },
    optimized_distance_km: { type: 'decimal(10,2)' },
    optimized_duration_min: { type: 'integer' },
    status: { type: 'varchar(50)', default: 'pending' }, // pending, in_progress, completed
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    completed_at: { type: 'timestamp' }
  });
  pgm.createIndex('routes', 'batch_id');
  pgm.createIndex('routes', 'driver_id');
  pgm.createIndex('routes', 'status');

  // Deliveries
  pgm.createTable('deliveries', {
    id: { type: 'serial', primaryKey: true },
    order_id: { type: 'integer', notNull: true, references: 'orders', onDelete: 'CASCADE' },
    driver_id: { type: 'integer', references: 'drivers' },
    route_id: { type: 'integer', references: 'routes' },
    status: { type: 'varchar(50)', default: 'pending' }, // pending, assigned, picked_up, on_route, delivered
    eta: { type: 'timestamp' },
    delivered_at: { type: 'timestamp' },
    distance_km: { type: 'decimal(10,2)' },
    duration_min: { type: 'integer' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });
  pgm.createIndex('deliveries', 'order_id');
  pgm.createIndex('deliveries', 'driver_id');
  pgm.createIndex('deliveries', 'route_id');
  pgm.createIndex('deliveries', 'status');

  // Payments
  pgm.createTable('payments', {
    id: { type: 'serial', primaryKey: true },
    order_id: { type: 'integer', notNull: true, references: 'orders', onDelete: 'CASCADE' },
    provider: { type: 'varchar(50)', default: 'stripe' },
    status: { type: 'varchar(50)', default: 'pending' }, // pending, processing, succeeded, failed
    intent_id: { type: 'varchar(255)' },
    amount: { type: 'decimal(10,2)', notNull: true },
    metadata: { type: 'jsonb' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });
  pgm.createIndex('payments', 'order_id');
  pgm.createIndex('payments', 'status');
  pgm.createIndex('payments', 'intent_id');
};

exports.down = (pgm) => {
  pgm.dropTable('payments');
  pgm.dropTable('deliveries');
  pgm.dropTable('routes');
  pgm.dropTable('order_items');
  pgm.dropTable('orders');
  pgm.dropTable('menu_items');
  pgm.dropTable('partners');
  pgm.dropTable('drivers');
  pgm.dropTable('chefs');
  pgm.dropTable('customers');
  pgm.dropTable('users');
};
