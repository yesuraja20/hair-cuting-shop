/**
 * AUREUS & BLADE - INTERACTIVE BOOKING ENGINE & ANIMATIONS
 * Handles: Auto-selection prefill, smooth scroll, form validation, loading states,
 * animated checkmark SVG draw, and confirmation modal.
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
      // Don't double trigger if clicking button
      if (e.target.closest('.btn-book-service')) return;
      const serviceId = card.getAttribute('data-service');
      selectServiceAndScroll(serviceId);
    });
  });

  function selectServiceAndScroll(serviceId) {
    if (!serviceId) return;

    // Find radio input matching serviceId
    const targetInput = document.querySelector(`input[name="service"][value="${serviceId}"]`);
    if (targetInput) {
      targetInput.checked = true;

      // Update active classes on labels
      servicePillLabels.forEach(label => label.classList.remove('active', 'service-pill-flash'));
      const targetLabel = targetInput.closest('.service-pill-label');
      if (targetLabel) {
        targetLabel.classList.add('active');
        // Flash animation
        void targetLabel.offsetWidth;
        targetLabel.classList.add('service-pill-flash');
      }
    }

    // Smooth scroll to booking section
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

  // 5. Submit Form & Confirmation Flow
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Validate required inputs
      const selectedService = document.querySelector('input[name="service"]:checked');
      const selectedBarber = document.querySelector('.barber-pill.active');
      const selectedTime = document.querySelector('.time-slot-btn.active');
      const clientName = document.getElementById('client-name').value.trim();
      const clientPhone = document.getElementById('client-phone').value.trim();
      const bookingDate = document.getElementById('booking-date').value;

      if (!selectedService) {
        alert('Please select a haircut or grooming ritual.');
        return;
      }

      if (!clientName || !clientPhone) {
        alert('Please provide your name and phone number for reservation.');
        return;
      }

      // Enter Loading State
      confirmBtn.disabled = true;
      confirmBtn.classList.add('loading');
      const btnText = confirmBtn.querySelector('.btn-text');
      const originalText = btnText.textContent;
      btnText.textContent = 'RESERVING CHAIR...';

      if (window.scissorEngine) {
        window.scissorEngine.playSnipSound();
      }

      // Simulate API Booking Request (750ms for realistic responsiveness)
      setTimeout(() => {
        // Success Transition
        confirmBtn.classList.remove('loading');
        btnText.textContent = 'BOOKING CONFIRMED';
        confirmBtn.style.background = '#10b981';
        confirmBtn.style.color = '#ffffff';

        // Extract summary details
        const serviceName = selectedService.closest('.service-pill-label').querySelector('.service-pill-name').textContent;
        const barberName = selectedBarber ? selectedBarber.querySelector('.barber-pill-name').textContent : 'Master Craftsman on Duty';
        const timeSlot = selectedTime ? selectedTime.textContent : '11:00 AM';
        const formattedDate = bookingDate ? new Date(bookingDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Today';
        const confirmCode = 'AB-' + Math.floor(1000 + Math.random() * 9000);

        // Populate Confirmation Modal
        document.getElementById('modal-confirm-code').textContent = confirmCode;
        document.getElementById('modal-service-name').textContent = serviceName;
        document.getElementById('modal-barber-name').textContent = barberName;
        document.getElementById('modal-date-time').textContent = `${formattedDate} at ${timeSlot}`;
        document.getElementById('modal-client-name').textContent = clientName;

        // Open Modal
        if (confirmationModal) {
          confirmationModal.classList.add('active');

          // Celebratory Particle Burst
          if (window.hairParticleEngine) {
            const rect = confirmationModal.getBoundingClientRect();
            window.hairParticleEngine.burstHair(rect.left + rect.width / 2, rect.top + rect.height / 2, 25);
          }
        }

        // Reset button after 2.5s
        setTimeout(() => {
          confirmBtn.disabled = false;
          btnText.textContent = originalText;
          confirmBtn.style.background = '';
          confirmBtn.style.color = '';
        }, 2500);
      }, 750);
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
