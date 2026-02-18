/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Add tracking_token column for public order tracking
  pgm.addColumn('orders', {
    tracking_token: {
      type: 'varchar(64)',
      unique: true
    }
  });
  
  // Add index for fast tracking lookups
  pgm.createIndex('orders', 'tracking_token');
  
  // Add customer_name and customer_email for guest checkout
  pgm.addColumn('orders', {
    customer_name: {
      type: 'varchar(255)'
    },
    customer_email: {
      type: 'varchar(255)'
    }
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('orders', 'customer_email');
  pgm.dropColumn('orders', 'customer_name');
  pgm.dropIndex('orders', 'tracking_token');
  pgm.dropColumn('orders', 'tracking_token');
};
