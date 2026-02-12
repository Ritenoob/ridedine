/**
 * Revenue Simulator Service
 * Calculates revenue projections based on real order data
 */

const orderService = require('./orders');

/**
 * Calculate daily revenue metrics
 */
function calculateDailyRevenue(date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const orders = orderService.listOrders();
  const dailyOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= startOfDay && orderDate <= endOfDay;
  });
  
  const totalRevenue = dailyOrders.reduce((sum, order) => {
    return sum + parseFloat(order.total || 0);
  }, 0);
  
  const totalFees = dailyOrders.reduce((sum, order) => {
    return sum + parseFloat(order.fees || 0);
  }, 0);
  
  const totalTax = dailyOrders.reduce((sum, order) => {
    return sum + parseFloat(order.tax || 0);
  }, 0);
  
  const subtotalRevenue = totalRevenue - totalTax - totalFees;
  const platformFee = subtotalRevenue * 0.15; // 15% platform fee
  const chefRevenue = subtotalRevenue - platformFee;
  
  return {
    date: date.toISOString().split('T')[0],
    orderCount: dailyOrders.length,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    subtotalRevenue: parseFloat(subtotalRevenue.toFixed(2)),
    totalFees: parseFloat(totalFees.toFixed(2)),
    totalTax: parseFloat(totalTax.toFixed(2)),
    platformFee: parseFloat(platformFee.toFixed(2)),
    chefRevenue: parseFloat(chefRevenue.toFixed(2)),
    averageOrderValue: dailyOrders.length > 0 ? parseFloat((totalRevenue / dailyOrders.length).toFixed(2)) : 0
  };
}

/**
 * Calculate weekly revenue
 */
function calculateWeeklyRevenue(weekStart = null) {
  const start = weekStart ? new Date(weekStart) : new Date();
  start.setHours(0, 0, 0, 0);
  
  // Get Monday of the week
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  
  const dailyMetrics = [];
  let totalRevenue = 0;
  let totalOrders = 0;
  let totalFees = 0;
  let totalTax = 0;
  let totalPlatformFee = 0;
  let totalChefRevenue = 0;
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const daily = calculateDailyRevenue(date);
    
    dailyMetrics.push(daily);
    totalRevenue += daily.totalRevenue;
    totalOrders += daily.orderCount;
    totalFees += daily.totalFees;
    totalTax += daily.totalTax;
    totalPlatformFee += daily.platformFee;
    totalChefRevenue += daily.chefRevenue;
  }
  
  return {
    weekStart: start.toISOString().split('T')[0],
    weekEnd: new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    orderCount: totalOrders,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalFees: parseFloat(totalFees.toFixed(2)),
    totalTax: parseFloat(totalTax.toFixed(2)),
    platformFee: parseFloat(totalPlatformFee.toFixed(2)),
    chefRevenue: parseFloat(totalChefRevenue.toFixed(2)),
    averageOrderValue: totalOrders > 0 ? parseFloat((totalRevenue / totalOrders).toFixed(2)) : 0,
    dailyBreakdown: dailyMetrics
  };
}

/**
 * Calculate monthly revenue
 */
function calculateMonthlyRevenue(year = null, month = null) {
  const date = new Date();
  const targetYear = year || date.getFullYear();
  const targetMonth = month !== null ? month : date.getMonth();
  
  const startOfMonth = new Date(targetYear, targetMonth, 1);
  const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
  
  const orders = orderService.listOrders();
  const monthlyOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= startOfMonth && orderDate <= endOfMonth;
  });
  
  const totalRevenue = monthlyOrders.reduce((sum, order) => {
    return sum + parseFloat(order.total || 0);
  }, 0);
  
  const totalFees = monthlyOrders.reduce((sum, order) => {
    return sum + parseFloat(order.fees || 0);
  }, 0);
  
  const totalTax = monthlyOrders.reduce((sum, order) => {
    return sum + parseFloat(order.tax || 0);
  }, 0);
  
  const subtotalRevenue = totalRevenue - totalTax - totalFees;
  const platformFee = subtotalRevenue * 0.15;
  const chefRevenue = subtotalRevenue - platformFee;
  
  return {
    year: targetYear,
    month: targetMonth + 1,
    monthName: startOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    orderCount: monthlyOrders.length,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalFees: parseFloat(totalFees.toFixed(2)),
    totalTax: parseFloat(totalTax.toFixed(2)),
    platformFee: parseFloat(platformFee.toFixed(2)),
    chefRevenue: parseFloat(chefRevenue.toFixed(2)),
    averageOrderValue: monthlyOrders.length > 0 ? parseFloat((totalRevenue / monthlyOrders.length).toFixed(2)) : 0
  };
}

/**
 * Project future revenue based on trends
 */
function projectRevenue(days = 30) {
  const historicalDays = 30;
  const projections = [];
  
  // Get historical data
  const today = new Date();
  let totalHistoricalRevenue = 0;
  let totalHistoricalOrders = 0;
  
  for (let i = historicalDays - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const daily = calculateDailyRevenue(date);
    totalHistoricalRevenue += daily.totalRevenue;
    totalHistoricalOrders += daily.orderCount;
  }
  
  const avgDailyRevenue = totalHistoricalRevenue / historicalDays;
  const avgDailyOrders = totalHistoricalOrders / historicalDays;
  const growthRate = 0.02; // 2% daily growth assumption
  
  // Project future days
  for (let i = 1; i <= days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const projectedRevenue = avgDailyRevenue * Math.pow(1 + growthRate, i);
    const projectedOrders = Math.round(avgDailyOrders * Math.pow(1 + growthRate, i));
    
    projections.push({
      date: date.toISOString().split('T')[0],
      projectedRevenue: parseFloat(projectedRevenue.toFixed(2)),
      projectedOrders,
      averageOrderValue: projectedOrders > 0 ? parseFloat((projectedRevenue / projectedOrders).toFixed(2)) : 0
    });
  }
  
  return {
    historicalPeriodDays: historicalDays,
    projectionPeriodDays: days,
    averageDailyRevenue: parseFloat(avgDailyRevenue.toFixed(2)),
    averageDailyOrders: Math.round(avgDailyOrders),
    growthRate: growthRate * 100,
    projections
  };
}

/**
 * Get comprehensive revenue overview
 */
function getRevenueOverview() {
  const today = calculateDailyRevenue();
  const thisWeek = calculateWeeklyRevenue();
  const thisMonth = calculateMonthlyRevenue();
  const projection = projectRevenue(7); // 7-day projection
  
  return {
    today,
    thisWeek,
    thisMonth,
    projection7Day: projection
  };
}

module.exports = {
  calculateDailyRevenue,
  calculateWeeklyRevenue,
  calculateMonthlyRevenue,
  projectRevenue,
  getRevenueOverview
};
