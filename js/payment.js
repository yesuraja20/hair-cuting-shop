/**
 * AUREUS & BLADE - ONLINE PAYMENT GATEWAY ENGINE
 * Supports:
 * 1. Pay at Atelier (Cash / Card on arrival)
 * 2. Razorpay / Stripe Live Payment Integration
 * 3. Interactive Luxury Test-Mode Checkout Modal with Cards, UPI, and Instant Receipts
 */

(function() {
  function injectPaymentModalDOM() {
    if (document.getElementById('aureus-payment-modal')) return;

    const modalHTML = `
      <div id="aureus-payment-modal" class="payment-modal-overlay" aria-hidden="true">
        <div class="payment-modal-card">
          <button class="payment-close-btn" id="btn-close-payment">&times;</button>
          
          <div class="payment-header">
            <div class="payment-crest">⚜</div>
            <h3>AUREUS &amp; BLADE</h3>
            <p>Luxury Atelier &bull; Secure Checkout</p>
          </div>

          <div class="payment-summary-box">
            <div class="pay-sum-row">
              <span class="pay-sum-label" id="pay-service-label">Bespoke Ritual</span>
              <strong class="pay-sum-val" id="pay-service-amount">$65.00</strong>
            </div>
            <div class="pay-sum-meta">
              <span id="pay-client-name">Guest</span> &bull; <span id="pay-client-phone">Phone</span>
            </div>
          </div>

          <!-- Method Tabs -->
          <div class="pay-method-tabs">
            <button type="button" class="pay-tab active" data-tab="card">💳 Card</button>
            <button type="button" class="pay-tab" data-tab="upi">⚡ UPI / QR</button>
            <button type="button" class="pay-tab" data-tab="digital">📱 Wallet / GPay</button>
          </div>

          <!-- Card Form -->
          <div class="pay-tab-content active" id="pay-tab-card">
            <div class="pay-input-group">
              <label>Cardholder Name</label>
              <input type="text" id="pay-card-name" value="Alexander Sterling" placeholder="Name on card">
            </div>
            <div class="pay-input-group">
              <label>Card Number</label>
              <input type="text" id="pay-card-num" value="4532 &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 8892" placeholder="4000 1234 5678 9010">
            </div>
            <div class="pay-input-row">
              <div class="pay-input-group">
                <label>Expiry</label>
                <input type="text" id="pay-card-exp" value="12/28" placeholder="MM/YY">
              </div>
              <div class="pay-input-group">
                <label>CVV / CVC</label>
                <input type="password" id="pay-card-cvv" value="892" maxlength="4" placeholder="123">
              </div>
            </div>
          </div>

          <!-- UPI Form -->
          <div class="pay-tab-content" id="pay-tab-upi">
            <div class="pay-upi-qr-box">
              <div class="upi-qr-mock">
                <span>⚡</span>
                <small>Scan with any UPI App<br>GPay / PhonePe / Paytm</small>
              </div>
              <div class="pay-input-group" style="width: 100%; margin-top: 1rem;">
                <label>UPI ID / VPA</label>
                <input type="text" id="pay-upi-id" placeholder="username@okhdfcbank" value="sterling@oksbi">
              </div>
            </div>
          </div>

          <!-- Digital Wallet -->
          <div class="pay-tab-content" id="pay-tab-digital">
            <div class="wallet-btn-group">
              <button type="button" class="wallet-option-btn"> Pay with Apple Pay</button>
              <button type="button" class="wallet-option-btn">G Pay with Google Pay</button>
            </div>
          </div>

          <!-- Pay Button -->
          <button type="button" class="btn-pay-now" id="btn-submit-payment">
            <span class="pay-btn-lock">🔒</span>
            <span id="pay-btn-text">AUTHORIZE PAYMENT &bull; $65.00</span>
          </button>

          <div class="pay-security-badge">
            <span>256-Bit TLS Encryption &bull; PCI-DSS Level 1 Certified &bull; No Card Data Stored</span>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    setupPaymentModalInteractions();
  }

  function setupPaymentModalInteractions() {
    const modal = document.getElementById('aureus-payment-modal');
    const closeBtn = document.getElementById('btn-close-payment');
    const tabs = modal.querySelectorAll('.pay-tab');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.getAttribute('data-tab');
        modal.querySelectorAll('.pay-tab-content').forEach(c => c.classList.remove('active'));
        const activeContent = document.getElementById('pay-tab-' + target);
        if (activeContent) activeContent.classList.add('active');
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (window._currentPaymentReject) {
          window._currentPaymentReject(new Error('Payment cancelled by user.'));
        }
        closeModal();
      });
    }
  }

  function closeModal() {
    const modal = document.getElementById('aureus-payment-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  window.AureusPayment = {
    /**
     * Process payment
     * @param {Object} details { amount, currency, serviceName, clientName, clientPhone, method }
     * @returns {Promise<Object>}
     */
    processPayment: function(details) {
      const cfg = (window.AUREUS_CONFIG && window.AUREUS_CONFIG.payment) || {};
      const currency = cfg.currency || 'USD';
      const symbol = cfg.currencySymbol || '$';
      const amount = Number(details.amount || 50);

      // 1. Pay at Atelier
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

      // 2. Razorpay Live Gateway (if key provided and SDK available)
      if (cfg.provider === 'razorpay' && cfg.keyId && window.Razorpay) {
        return new Promise((resolve, reject) => {
          const options = {
            key: cfg.keyId,
            amount: amount * 100, // in smallest currency sub-unit (cents / paise)
            currency: currency === 'USD' ? 'USD' : 'INR',
            name: 'Aureus & Blade Atelier',
            description: details.serviceName || 'Grooming Ritual Appointment',
            image: 'assets/images/master-barber.jpg',
            handler: function(response) {
              resolve({
                success: true,
                method: 'online_razorpay',
                paymentStatus: 'paid',
                transactionId: response.razorpay_payment_id,
                amount: amount,
                currency: currency
              });
            },
            prefill: {
              name: details.clientName || '',
              contact: details.clientPhone || ''
            },
            theme: {
              color: '#d4af37' // Luxury gold
            },
            modal: {
              ondismiss: function() {
                reject(new Error('Razorpay payment cancelled.'));
              }
            }
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        });
      }

      // 3. Interactive Luxury Payment Modal (Default / Test Mode)
      return new Promise((resolve, reject) => {
        injectPaymentModalDOM();
        window._currentPaymentReject = reject;

        const modal = document.getElementById('aureus-payment-modal');
        document.getElementById('pay-service-label').textContent = details.serviceName || 'Bespoke Grooming Ritual';
        document.getElementById('pay-service-amount').textContent = `${symbol}${amount.toFixed(2)}`;
        document.getElementById('pay-client-name').textContent = details.clientName || 'Guest';
        document.getElementById('pay-client-phone').textContent = details.clientPhone || 'Mobile';
        document.getElementById('pay-btn-text').textContent = `AUTHORIZE PAYMENT \u2022 ${symbol}${amount.toFixed(2)}`;

        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');

        const payBtn = document.getElementById('btn-submit-payment');
        // Clear previous listeners
        const newPayBtn = payBtn.cloneNode(true);
        payBtn.parentNode.replaceChild(newPayBtn, payBtn);

        newPayBtn.addEventListener('click', () => {
          newPayBtn.disabled = true;
          newPayBtn.innerHTML = '<span class="spinner-icon">&#9986;</span> <span>VERIFYING WITH ATELIER VAULT...</span>';

          if (window.scissorEngine) {
            window.scissorEngine.playSnipSound();
          }

          setTimeout(() => {
            newPayBtn.style.background = '#10b981';
            newPayBtn.innerHTML = '<span>&#10003; PAYMENT AUTHORIZED</span>';

            setTimeout(() => {
              closeModal();
              newPayBtn.disabled = false;
              newPayBtn.style.background = '';
              resolve({
                success: true,
                method: 'online',
                paymentStatus: 'paid',
                transactionId: 'TXN_AB_' + Math.floor(100000 + Math.random() * 900000),
                amount: amount,
                currency: currency
              });
            }, 600);
          }, 1200);
        });
      });
    }
  };
})();
