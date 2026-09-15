/**
 * AUREUS & BLADE - INTERACTIVE BOOKING ENGINE & ANIMATIONS
 * Integrated with:
 * - Supabase Database (real-time customer booking submissions)
 * - Online Payment Gateway (Razorpay / Stripe / Luxury Test Mode)
 * - Animated Checkmark, Web Audio Scissor feedback, and Particle Bursts
 */

document.addEventListener('DOMContentLoaded', () => {
  const bookingSection = document.getElementById('booking');
  const bookingForm = document.getElementById('appointment-form');
  const confirmBtn = document.getElementById('btn-confirm-appointment');
  const confirmationModal = document.getElementById('booking-confirmation-modal');
  const closeModalBtn = document.getElementById('close-confirmation-btn');

  // Service Pills & Cards
  const servicePillLabels = document.querySelectorAll('.service-pill-label');
  const timeSlotBtns = document.querySelectorAll('.time-slot-btn');
  const barberPills = document.querySelectorAll('.barber-pill');
  const bookServiceBtns = document.querySelectorAll('.btn-book-service');
  const paymentMethodPills = document.querySelectorAll('.payment-method-pill');

  // 1. Hook up all "BOOK NOW" buttons on service cards
  bookServiceBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const serviceId = btn.getAttribute('data-service');
      selectServiceAndScroll(serviceId);
    });
  });

  // Also clicking a service card itself can prefill
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-book-service')) return;
      const serviceId = card.getAttribute('data-service');
      selectServiceAndScroll(serviceId);
    });
  });

  function selectServiceAndScroll(serviceId) {
    if (!serviceId) return;

    const targetInput = document.querySelector(`input[name="service"][value="${serviceId}"]`);
    if (targetInput) {
      targetInput.checked = true;

      servicePillLabels.forEach(label => label.classList.remove('active', 'service-pill-flash'));
      const targetLabel = targetInput.closest('.service-pill-label');
      if (targetLabel) {
        targetLabel.classList.add('active');
        void targetLabel.offsetWidth;
        targetLabel.classList.add('service-pill-flash');
      }
    }

    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // 2. Service Pill manual clicks
  servicePillLabels.forEach(label => {
    label.addEventListener('click', () => {
      servicePillLabels.forEach(l => l.classList.remove('active'));
      label.classList.add('active');
      const radio = label.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  // 3. Barber Selection Pills
  barberPills.forEach(pill => {
    pill.addEventListener('click', () => {
      barberPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });

  // 4. Time Slot Selection
  timeSlotBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      timeSlotBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // 5. Payment Method Pills Selection
  paymentMethodPills.forEach(pill => {
    pill.addEventListener('click', () => {
      paymentMethodPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const radio = pill.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  // 6. Submit Form & Online Payment / Supabase Flow
  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate required inputs
      const selectedServiceInput = document.querySelector('input[name="service"]:checked');
      const selectedBarber = document.querySelector('.barber-pill.active');
      const selectedTime = document.querySelector('.time-slot-btn.active');
      const selectedPaymentInput = document.querySelector('input[name="payment_method"]:checked');
      const clientName = document.getElementById('client-name').value.trim();
      const clientPhone = document.getElementById('client-phone').value.trim();
      const bookingDate = document.getElementById('booking-date').value;

      if (!selectedServiceInput) {
        alert('Please select a haircut or grooming ritual.');
        return;
      }

      if (!clientName || !clientPhone) {
        alert('Please provide your name and phone number for reservation.');
        return;
      }

      const serviceLabel = selectedServiceInput.closest('.service-pill-label');
      const serviceName = serviceLabel ? serviceLabel.querySelector('.service-pill-name').textContent.trim() : 'Bespoke Ritual';
      const serviceId = selectedServiceInput.value;

      // Extract price from label
      let price = 65;
      if (serviceLabel) {
        const priceEl = serviceLabel.querySelector('.gold-accent');
        if (priceEl) {
          const num = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, ''));
          if (!isNaN(num)) price = num;
        }
      }

      const barberName = selectedBarber ? selectedBarber.querySelector('.barber-pill-name').textContent.trim() : 'Master Craftsman on Duty';
      const barberId = selectedBarber ? selectedBarber.getAttribute('data-barber') : 'marcus';
      const timeSlot = selectedTime ? selectedTime.textContent.trim() : '11:00 AM';
      const paymentMethod = selectedPaymentInput ? selectedPaymentInput.value : 'online';
      const formattedDate = bookingDate ? new Date(bookingDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Today';

      // Enter Loading State
      confirmBtn.disabled = true;
      confirmBtn.classList.add('loading');
      const btnText = confirmBtn.querySelector('.btn-text');
      const originalText = btnText.textContent;
      btnText.textContent = paymentMethod === 'online' ? 'INITIATING PAYMENT GATEWAY...' : 'RESERVING CHAIR...';

      if (window.scissorEngine) {
        window.scissorEngine.playSnipSound();
      }

      try {
        // Step A: Process Payment (Gateway or Pay-at-Atelier)
        let paymentResult = {
          success: true,
          method: 'atelier',
          paymentStatus: 'pending',
          transactionId: 'ATELIER_' + Math.random().toString(36).substring(2, 8).toUpperCase()
        };

        if (window.AureusPayment) {
          paymentResult = await window.AureusPayment.processPayment({
            amount: price,
            currency: (window.AUREUS_CONFIG && window.AUREUS_CONFIG.payment && window.AUREUS_CONFIG.payment.currency) || 'INR',
            serviceName: serviceName,
            clientName: clientName,
            clientPhone: clientPhone,
            barberName: barberName,
            bookingDate: formattedDate,
            timeSlot: timeSlot,
            method: paymentMethod
          });
        }

        // Step B: Save to Supabase / Local Storage
        const confirmCode = 'AB-' + Math.floor(1000 + Math.random() * 9000);
        let savedBooking = null;

        if (window.AureusDB) {
          savedBooking = await window.AureusDB.saveBooking({
            confirmation_code: confirmCode,
            client_name: clientName,
            client_phone: clientPhone,
            service_id: serviceId,
            service_name: serviceName,
            barber_id: barberId,
            barber_name: barberName,
            booking_date: bookingDate || new Date().toISOString().split('T')[0],
            time_slot: timeSlot,
            total_price: price,
            payment_method: paymentResult.method,
            payment_status: paymentResult.paymentStatus,
            transaction_id: paymentResult.transactionId,
            status: 'confirmed'
          });
        }

        // Step C: Success Transition & Modal Display
        confirmBtn.classList.remove('loading');
        btnText.textContent = 'BOOKING CONFIRMED';
        confirmBtn.style.background = '#10b981';
        confirmBtn.style.color = '#ffffff';

        // Populate Confirmation Modal
        const codeToDisplay = (savedBooking && savedBooking.confirmation_code) || confirmCode;
        document.getElementById('modal-confirm-code').textContent = codeToDisplay;
        document.getElementById('modal-service-name').textContent = serviceName;
        document.getElementById('modal-barber-name').textContent = barberName;
        document.getElementById('modal-date-time').textContent = `${formattedDate} at ${timeSlot}`;
        document.getElementById('modal-client-name').textContent = clientName;

        const modalPayEl = document.getElementById('modal-payment-status');
        if (modalPayEl) {
          if (paymentResult.paymentStatus === 'paid') {
            modalPayEl.textContent = `Paid Online via Razorpay (${paymentResult.transactionId})`;
            modalPayEl.style.color = '#10b981';
          } else {
            modalPayEl.textContent = `Pay at Atelier upon arrival ($${price})`;
            modalPayEl.style.color = '#d4af37';
          }
        }

        // Open Modal
        if (confirmationModal) {
          confirmationModal.classList.add('active');

          if (window.hairParticleEngine) {
            const rect = confirmationModal.getBoundingClientRect();
            window.hairParticleEngine.burstHair(rect.left + rect.width / 2, rect.top + rect.height / 2, 35);
          }
        }

        // Reset button after 3s
        setTimeout(() => {
          confirmBtn.disabled = false;
          btnText.textContent = originalText;
          confirmBtn.style.background = '';
          confirmBtn.style.color = '';
        }, 3000);

      } catch (err) {
        console.warn('Booking / Payment cancelled or failed:', err);
        confirmBtn.disabled = false;
        confirmBtn.classList.remove('loading');
        btnText.textContent = originalText;
        confirmBtn.style.background = '';
        confirmBtn.style.color = '';
        if (err && err.message && !err.message.includes('closed') && !err.message.includes('cancelled')) {
          alert('Razorpay Checkout Notice: ' + err.message);
        }
      }
    });
  }

  // Close Modal
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      confirmationModal.classList.remove('active');
    });
  }

  if (confirmationModal) {
    confirmationModal.addEventListener('click', (e) => {
      if (e.target === confirmationModal) {
        confirmationModal.classList.remove('active');
      }
    });
  }
});
