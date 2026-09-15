/**
 * AUREUS & BLADE - OFFICIAL RAZORPAY CHECKOUT.JS ENGINE
 * Integrates Razorpay's official hosted popup checkout widget (Checkout.js).
 * Supports Cards, UPI (GPay, PhonePe, Paytm), NetBanking, and Wallets.
 */

(function() {
  const DEFAULT_TEST_KEY = 'rzp_test_1DP5mmOlF5G5ag';

  /**
   * Ensure the official Razorpay Checkout.js script is dynamically loaded
   */
  function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      // Check if already in DOM
      const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true));
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Razorpay Checkout script.')));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Unable to connect to Razorpay payment servers. Please check your internet connection.'));
      document.head.appendChild(script);
    });
  }

  window.AureusPayment = {
    /**
     * Process payment
     * @param {Object} details { amount, currency, serviceName, clientName, clientPhone, barberName, bookingDate, timeSlot, method }
     * @returns {Promise<Object>}
     */
    processPayment: async function(details) {
      const cfg = (window.AUREUS_CONFIG && window.AUREUS_CONFIG.payment) || {};
      const amount = Number(details.amount || 50);
      const currency = cfg.currency || 'INR';

      // 1. Pay at Atelier Option (Cash / Card on arrival)
      if (details.method === 'atelier') {
        return Promise.resolve({
          success: true,
          method: 'atelier',
          paymentStatus: 'pending',
          transactionId: 'ATELIER_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          amount: amount,
          currency: currency
        });
      }

      // 2. Official Razorpay Checkout.js Integration
      await loadRazorpayScript();

      if (!window.Razorpay) {
        throw new Error('Razorpay Checkout SDK could not be initialized.');
      }

      // Determine active key (Custom key or default public test key)
      const activeKey = (cfg.keyId && cfg.keyId.trim()) ? cfg.keyId.trim() : DEFAULT_TEST_KEY;

      return new Promise((resolve, reject) => {
        // Clean phone number for Razorpay prefill (digits only, e.g. 9876543210)
        const cleanPhone = (details.clientPhone || '').replace(/[^0-9]/g, '');

        const options = {
          key: activeKey,
          amount: Math.round(amount * 100), // In smallest currency subunit (paise/cents)
          currency: currency === 'USD' ? 'USD' : 'INR',
          name: 'Aureus & Blade Master Atelier',
          description: details.serviceName || 'Bespoke Grooming Ritual',
          image: 'https://cdn-icons-png.flaticon.com/512/2821/2821012.png',
          prefill: {
            name: details.clientName || 'Alexander Sterling',
            contact: cleanPhone || '9876543210',
            email: 'concierge@aureusblade.com'
          },
          notes: {
            service_ritual: details.serviceName || 'The Royal Executive Cut',
            barber_craftsman: details.barberName || 'Marcus Vance',
            appointment_date: details.bookingDate || 'Today',
            time_slot: details.timeSlot || '11:00 AM'
          },
          theme: {
            color: '#d4af37', // Atelier Gold accent
            backdrop_color: '#070709'
          },
          modal: {
            backdropclose: false,
            escape: true,
            handleback: true,
            confirm_close: true,
            ondismiss: function() {
              reject(new Error('Razorpay checkout was closed by user.'));
            }
          },
          handler: function(response) {
            // Official Razorpay Payment Response
            resolve({
              success: true,
              method: 'online_razorpay',
              paymentStatus: 'paid',
              transactionId: response.razorpay_payment_id || ('RZP_' + Date.now()),
              orderId: response.razorpay_order_id || null,
              signature: response.razorpay_signature || null,
              amount: amount,
              currency: currency,
              rawResponse: response
            });
          }
        };

        try {
          const rzpInstance = new window.Razorpay(options);

          rzpInstance.on('payment.failed', function(response) {
            console.error('Razorpay payment failed:', response.error);
            reject(new Error(response.error.description || 'Payment transaction failed.'));
          });

          rzpInstance.open();
        } catch (err) {
          console.error('Razorpay invocation error:', err);
          reject(err);
        }
      });
    }
  };
})();
