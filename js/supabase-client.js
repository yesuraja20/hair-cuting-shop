/**
 * AUREUS & BLADE - SUPABASE DATABASE CLIENT & LOCAL REPOSITORY
 * Provides bi-directional sync with Supabase PostgreSQL.
 * If Supabase is unconfigured, operates in resilient local mode so the site never breaks.
 */

(function() {
  const BOOKINGS_KEY = 'aureus_bookings_data';
  const SERVICES_KEY = 'aureus_services_data';
  const IMAGES_KEY = 'aureus_images_data';
  const ADMIN_SESSION_KEY = 'aureus_admin_session';

  // Default seed data for offline / initial state
  const DEFAULT_SERVICES = [
    {
      id: 'service-royal',
      title: 'The Royal Executive Cut',
      description: 'Tailored scissor architecture, perimeter razor detailing, relaxing peppermint scalp massage, and bespoke styling with matte clay.',
      duration: '50 MIN',
      price: 65,
      features: ['Comprehensive Face Shape Consultation', 'Dual Shampoo & Conditioning Wash', 'Straight Razor Neck Line Detailing']
    },
    {
      id: 'service-fade',
      title: 'Artisan Razor Fade & Texture',
      description: 'Seamless zero-skin transition, textured shear work on top, razor hairline crisping, and talc finish for a sharp modern profile.',
      duration: '45 MIN',
      price: 55,
      features: ['High, Mid, Low or Drop Fade Transition', 'Foil Shaver & Razor Blend', 'Texturizing Shears Finish']
    },
    {
      id: 'service-beard',
      title: 'Beard Sculpt & Hot Towel Shave',
      description: 'Three essential oil hot towel wraps, warm badger foam lather, straight razor line definition, and sandalwood conditioning balm.',
      duration: '40 MIN',
      price: 45,
      features: ['Eucalyptus Steamed Towel Compress', 'Feather Razor Precision Shaping', 'Botanical Beard Oil Hydration']
    },
    {
      id: 'service-ritual',
      title: "The Complete Gentleman's Ritual",
      description: 'The flagship experience: Executive haircut, full beard sculpt or traditional wet shave, charcoal face mask, and scotch tasting.',
      duration: '80 MIN',
      price: 110,
      features: ['Full Haircut & Beard Treatment', 'Volcanic Charcoal Facial & Steam', 'Complimentary Single Malt Selection']
    },
    {
      id: 'service-scalp',
      title: 'Scalp Detox & Stimulating Therapy',
      description: 'Exfoliating tea tree scrub, pressurized oxygen infusion, acupressure temple massage, and follicle-revitalizing tonic treatment.',
      duration: '35 MIN',
      price: 40,
      features: ['Micro-Exfoliating Scalp Polish', 'High-Frequency Wand Treatment', 'Cooling Mint Hydro-Rinse']
    },
    {
      id: 'service-duo',
      title: 'Father & Son Heritage Cut',
      description: 'Generational grooming experience side by side in executive chairs with custom refreshments and matching finishing touches.',
      duration: '75 MIN',
      price: 95,
      features: ['Two Simultaneous Precision Cuts', 'Heritage Tonic Application', 'Polaroid Atelier Souvenir Photograph']
    }
  ];

  const DEFAULT_IMAGES = {
    hero_bg: 'assets/images/hero.jpg',
    barber_marcus: 'assets/images/master-barber.jpg',
    barber_julian: 'assets/images/fade-cut.jpg',
    barber_alexander: 'assets/images/beard-grooming.jpg',
    gallery_1: 'assets/images/fade-cut.jpg',
    gallery_2: 'assets/images/beard-grooming.jpg',
    gallery_3: 'assets/images/master-barber.jpg',
    gallery_4: 'assets/images/classic-cut.jpg',
    gallery_5: 'assets/images/hero.jpg',
    gallery_6: 'assets/images/fade-cut.jpg'
  };

  let supabaseClient = null;

  function getSupabase() {
    if (supabaseClient) return supabaseClient;
    const cfg = window.AUREUS_CONFIG || {};
    if (cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase && window.supabase.createClient) {
      try {
        supabaseClient = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
        return supabaseClient;
      } catch (err) {
        console.warn('Failed to initialize Supabase client:', err);
      }
    }
    return null;
  }

  // Local Storage Helpers
  function getLocal(key, fallback) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function setLocal(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  // Initialize defaults if empty in localStorage
  if (!localStorage.getItem(SERVICES_KEY)) {
    setLocal(SERVICES_KEY, DEFAULT_SERVICES);
  }
  if (!localStorage.getItem(IMAGES_KEY)) {
    setLocal(IMAGES_KEY, DEFAULT_IMAGES);
  }
  if (!localStorage.getItem(BOOKINGS_KEY)) {
    // Add 1 initial sample booking for rich demonstration in admin panel
    setLocal(BOOKINGS_KEY, [
      {
        id: 'mock-sample-1',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        confirmation_code: 'AB-9214',
        client_name: 'Lord Julian Sterling',
        client_phone: '+1 (555) 392-1094',
        service_id: 'service-royal',
        service_name: 'The Royal Executive Cut',
        barber_id: 'marcus',
        barber_name: 'Marcus Vance',
        booking_date: new Date().toISOString().split('T')[0],
        time_slot: '11:30 AM',
        total_price: 65,
        payment_method: 'online',
        payment_status: 'paid',
        transaction_id: 'TXN_AB_9921_OK',
        status: 'confirmed'
      }
    ]);
  }

  window.AureusDB = {
    isConfigured: function() {
      const cfg = window.AUREUS_CONFIG || {};
      return Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey);
    },

    // ----------------------------------------------------
    // BOOKINGS API
    // ----------------------------------------------------
    saveBooking: async function(bookingData) {
      const record = {
        id: bookingData.id || ('bk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)),
        created_at: new Date().toISOString(),
        confirmation_code: bookingData.confirmation_code || ('AB-' + Math.floor(1000 + Math.random() * 9000)),
        client_name: bookingData.client_name,
        client_phone: bookingData.client_phone,
        service_id: bookingData.service_id,
        service_name: bookingData.service_name,
        barber_id: bookingData.barber_id,
        barber_name: bookingData.barber_name,
        booking_date: bookingData.booking_date,
        time_slot: bookingData.time_slot,
        total_price: Number(bookingData.total_price || 0),
        payment_method: bookingData.payment_method || 'atelier',
        payment_status: bookingData.payment_status || 'pending',
        transaction_id: bookingData.transaction_id || null,
        status: bookingData.status || 'pending'
      };

      // Always save locally first for instantaneous UX
      const localList = getLocal(BOOKINGS_KEY, []);
      localList.unshift(record);
      setLocal(BOOKINGS_KEY, localList);

      // Attempt Supabase insert
      const sb = getSupabase();
      if (sb) {
        try {
          const { data, error } = await sb.from('bookings').insert([record]).select();
          if (error) {
            console.warn('Supabase booking insert error, fallback kept:', error);
          } else if (data && data[0]) {
            return data[0];
          }
        } catch (err) {
          console.warn('Supabase connection error:', err);
        }
      }

      return record;
    },

    getBookings: async function() {
      const sb = getSupabase();
      if (sb) {
        try {
          const { data, error } = await sb.from('bookings').select('*').order('created_at', { ascending: false });
          if (!error && data) {
            // Update local cache
            setLocal(BOOKINGS_KEY, data);
            return data;
          }
        } catch (err) {
          console.warn('Supabase getBookings failed, using local cache:', err);
        }
      }
      return getLocal(BOOKINGS_KEY, []);
    },

    updateBookingStatus: async function(id, newStatus) {
      // Local update
      const localList = getLocal(BOOKINGS_KEY, []);
      const idx = localList.findIndex(b => b.id === id);
      if (idx !== -1) {
        localList[idx].status = newStatus;
        setLocal(BOOKINGS_KEY, localList);
      }

      // Supabase update
      const sb = getSupabase();
      if (sb) {
        try {
          await sb.from('bookings').update({ status: newStatus }).eq('id', id);
        } catch (err) {
          console.warn('Supabase status update error:', err);
        }
      }
      return true;
    },

    deleteBooking: async function(id) {
      // Local delete
      let localList = getLocal(BOOKINGS_KEY, []);
      localList = localList.filter(b => b.id !== id);
      setLocal(BOOKINGS_KEY, localList);

      // Supabase delete
      const sb = getSupabase();
      if (sb) {
        try {
          await sb.from('bookings').delete().eq('id', id);
        } catch (err) {
          console.warn('Supabase delete error:', err);
        }
      }
      return true;
    },

    // ----------------------------------------------------
    // SERVICES & PRICING API
    // ----------------------------------------------------
    getServices: async function() {
      const sb = getSupabase();
      if (sb) {
        try {
          const { data, error } = await sb.from('services_pricing').select('*').order('display_order', { ascending: true });
          if (!error && data && data.length > 0) {
            setLocal(SERVICES_KEY, data);
            return data;
          }
        } catch (err) {
          console.warn('Supabase getServices failed, using local cache:', err);
        }
      }
      return getLocal(SERVICES_KEY, DEFAULT_SERVICES);
    },

    updateService: async function(id, updatedFields) {
      const list = getLocal(SERVICES_KEY, DEFAULT_SERVICES);
      const idx = list.findIndex(s => s.id === id);
      if (idx !== -1) {
        list[idx] = Object.assign({}, list[idx], updatedFields, { updated_at: new Date().toISOString() });
        setLocal(SERVICES_KEY, list);
      }

      const sb = getSupabase();
      if (sb) {
        try {
          await sb.from('services_pricing').update(updatedFields).eq('id', id);
        } catch (err) {
          console.warn('Supabase service update error:', err);
        }
      }
      return true;
    },

    addService: async function(newService) {
      newService.id = newService.id || ('service-' + Date.now());
      const list = getLocal(SERVICES_KEY, DEFAULT_SERVICES);
      list.push(newService);
      setLocal(SERVICES_KEY, list);

      const sb = getSupabase();
      if (sb) {
        try {
          await sb.from('services_pricing').insert([newService]);
        } catch (err) {
          console.warn('Supabase service insert error:', err);
        }
      }
      return newService;
    },

    deleteService: async function(id) {
      let list = getLocal(SERVICES_KEY, DEFAULT_SERVICES);
      list = list.filter(s => s.id !== id);
      setLocal(SERVICES_KEY, list);

      const sb = getSupabase();
      if (sb) {
        try {
          await sb.from('services_pricing').delete().eq('id', id);
        } catch (err) {
          console.warn('Supabase service delete error:', err);
        }
      }
      return true;
    },

    // ----------------------------------------------------
    // WEBSITE IMAGES API
    // ----------------------------------------------------
    getImages: async function() {
      const sb = getSupabase();
      if (sb) {
        try {
          const { data, error } = await sb.from('site_images').select('*');
          if (!error && data && data.length > 0) {
            const mapped = {};
            data.forEach(item => {
              mapped[item.image_key] = item.image_url;
            });
            const merged = Object.assign({}, DEFAULT_IMAGES, mapped);
            setLocal(IMAGES_KEY, merged);
            return merged;
          }
        } catch (err) {
          console.warn('Supabase getImages failed, using local cache:', err);
        }
      }
      return getLocal(IMAGES_KEY, DEFAULT_IMAGES);
    },

    updateImage: async function(imageKey, newUrl) {
      const images = getLocal(IMAGES_KEY, DEFAULT_IMAGES);
      images[imageKey] = newUrl;
      setLocal(IMAGES_KEY, images);

      const sb = getSupabase();
      if (sb) {
        try {
          await sb.from('site_images').upsert({
            image_key: imageKey,
            image_url: newUrl,
            updated_at: new Date().toISOString()
          });
        } catch (err) {
          console.warn('Supabase image upsert error:', err);
        }
      }
      return true;
    },

    // ----------------------------------------------------
    // ADMIN AUTHENTICATION
    // ----------------------------------------------------
    isAdminLoggedIn: function() {
      try {
        const session = sessionStorage.getItem(ADMIN_SESSION_KEY) || localStorage.getItem(ADMIN_SESSION_KEY);
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed && parsed.authenticated) return true;
        }
      } catch (e) {}
      return false;
    },

    adminLogin: async function(email, password) {
      const cfg = window.AUREUS_CONFIG || {};
      const targetEmail = (cfg.admin && cfg.admin.email) ? cfg.admin.email.trim().toLowerCase() : 'admin@aureusblade.com';
      const targetPassword = (cfg.admin && cfg.admin.password) ? cfg.admin.password : 'admin';

      const sb = getSupabase();
      if (sb && cfg.useSupabaseAuth) {
        try {
          const { data, error } = await sb.auth.signInWithPassword({ email, password });
          if (!error && data.user) {
            const sess = { authenticated: true, email: data.user.email, time: Date.now() };
            sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sess));
            return { success: true, user: data.user };
          }
        } catch (e) {
          console.warn('Supabase auth attempt:', e);
        }
      }

      // Check credentials against configured admin
      const cleanEmail = (email || '').trim().toLowerCase();
      if ((cleanEmail === targetEmail || cleanEmail === 'admin') && password === targetPassword) {
        const sess = { authenticated: true, email: cleanEmail, time: Date.now() };
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sess));
        return { success: true, user: { email: cleanEmail } };
      }

      return { success: false, error: 'Invalid admin email or password.' };
    },

    adminLogout: function() {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(ADMIN_SESSION_KEY);
      const sb = getSupabase();
      if (sb && sb.auth) {
        sb.auth.signOut().catch(() => {});
      }
    }
  };
})();
