/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Add rating to chefs table
  pgm.addColumns('chefs', {
    rating: { type: 'decimal(3,2)', default: 0 },
    total_reviews: { type: 'integer', default: 0 }
  });
  
  // Add dietary tags and available status to menu_items
  pgm.addColumns('menu_items', {
    dietary_tags: { type: 'jsonb', default: '[]' }, // ['vegan', 'halal', 'gluten-free', etc.]
    category: { type: 'varchar(100)' } // 'appetizer', 'main', 'dessert', etc.
  });
  
  // Add tracking token to orders
  pgm.addColumns('orders', {
    tracking_token: { type: 'varchar(50)', unique: true },
    estimated_delivery_time: { type: 'timestamp' },
    actual_delivery_time: { type: 'timestamp' }
  });
  
  // Create index on tracking_token for fast lookups
  pgm.createIndex('orders', 'tracking_token');
  
  // Create revenue_metrics table
  pgm.createTable('revenue_metrics', {
    id: { type: 'serial', primaryKey: true },
    metric_date: { type: 'date', notNull: true },
    daily_revenue: { type: 'decimal(10,2)', default: 0 },
    order_count: { type: 'integer', default: 0 },
    average_order_value: { type: 'decimal(10,2)', default: 0 },
    total_fees: { type: 'decimal(10,2)', default: 0 },
    total_tax: { type: 'decimal(10,2)', default: 0 },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });
  
  pgm.createIndex('revenue_metrics', 'metric_date');
  
  // Add weekly/monthly views
  pgm.sql(`
    CREATE OR REPLACE VIEW weekly_revenue AS
    SELECT 
      DATE_TRUNC('week', metric_date) as week,
      SUM(daily_revenue) as weekly_revenue,
      SUM(order_count) as weekly_orders,
      AVG(average_order_value) as avg_order_value
    FROM revenue_metrics
    GROUP BY DATE_TRUNC('week', metric_date)
    ORDER BY week DESC;
  `);
  
  pgm.sql(`
    CREATE OR REPLACE VIEW monthly_revenue AS
    SELECT 
      DATE_TRUNC('month', metric_date) as month,
      SUM(daily_revenue) as monthly_revenue,
      SUM(order_count) as monthly_orders,
      AVG(average_order_value) as avg_order_value
    FROM revenue_metrics
    GROUP BY DATE_TRUNC('month', metric_date)
    ORDER BY month DESC;
  `);
};

exports.down = (pgm) => {
  // Drop views
  pgm.sql('DROP VIEW IF EXISTS monthly_revenue');
  pgm.sql('DROP VIEW IF EXISTS weekly_revenue');
  
  // Drop revenue_metrics table
  pgm.dropTable('revenue_metrics');
  
  // Remove columns from orders
  pgm.dropColumns('orders', ['tracking_token', 'estimated_delivery_time', 'actual_delivery_time']);
  
  // Remove columns from menu_items
  pgm.dropColumns('menu_items', ['dietary_tags', 'category']);
  
  // Remove columns from chefs
  pgm.dropColumns('chefs', ['rating', 'total_reviews']);
};
