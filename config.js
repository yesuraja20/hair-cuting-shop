/**
 * AUREUS & BLADE - CONFIGURATION & ENVIRONMENT SETUP
 * Configures Supabase Database & Payment Gateway connections.
 * Values can be configured here, in .env, or directly via the Admin Panel Settings UI.
 */

(function() {
  const STORAGE_KEY = 'aureus_blade_config';

  // Default configuration
  const defaultConfig = {
    // Supabase credentials
    supabaseUrl: '', // e.g. 'https://xyzcompany.supabase.co'
    supabaseAnonKey: '', // e.g. 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

    // Payment Gateway
    payment: {
      mode: 'test', // 'test' or 'live'
      provider: 'razorpay', // 'razorpay' | 'stripe' | 'simulated'
      keyId: '', // Razorpay Key ID (e.g. 'rzp_test_...') or Stripe Publishable Key
      currency: 'USD', // 'USD' or 'INR'
      currencySymbol: '$',
      enableOnlinePayment: true,
      enablePayAtAtelier: true
    },

    // Default Admin Credentials (for local/offline mode or Supabase Auth fallback)
    admin: {
      email: 'admin@aureusblade.com',
      password: 'admin' // Can be customized in Admin Settings
    }
  };

  // Load persisted overrides from localStorage if present
  let persisted = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) persisted = JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read saved config:', e);
  }

  // Merge defaults with persisted
  window.AUREUS_CONFIG = Object.assign({}, defaultConfig, persisted);
  if (persisted.payment) {
    window.AUREUS_CONFIG.payment = Object.assign({}, defaultConfig.payment, persisted.payment);
  }
  if (persisted.admin) {
    window.AUREUS_CONFIG.admin = Object.assign({}, defaultConfig.admin, persisted.admin);
  }

  // Save updated config method
  window.saveAureusConfig = function(newConfig) {
    window.AUREUS_CONFIG = Object.assign({}, window.AUREUS_CONFIG, newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(window.AUREUS_CONFIG));
      return true;
    } catch (e) {
      console.error('Failed to persist config:', e);
      return false;
    }
  };
})();
