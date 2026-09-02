// ============================================================
// LACVAY Homepage - Interactive Features
// ============================================================

// Place Data
const placesData = {
  1: {
    name: 'Anilao Beaches',
    description: 'Anilao is a stunning coastal destination known for its pristine white sand beaches, crystal clear waters, and vibrant marine life. Perfect for snorkeling, diving, and beach activities.',
    distance: '45 km from city center',
    travelTime: '1-2 hours',
    fare: '₱80-150',
    hours: '6:00 AM - 6:00 PM',
    emoji: '🏖️',
    routes: [
      'Jeepney: Take Lipa-Anilao jeepney from terminal, 1.5 hours',
      'Tricycle: Taxi directly, 45 minutes (₱150-200)',
      'Private Vehicle: Most convenient, 1 hour (₱300-400 gas)',
      'Bus: Regular buses available, 2 hours (₱50-80)'
    ]
  },
  2: {
    name: 'Taal Volcano',
    description: 'One of the most iconic natural landmarks in the Philippines. Taal Volcano offers breathtaking views, hiking trails, and a unique geological experience. The volcano is one of the most dangerous in the world.',
    distance: '50 km from city center',
    travelTime: '1-1.5 hours',
    fare: '₱120-180',
    hours: '7:00 AM - 5:00 PM',
    emoji: '⛰️',
    routes: [
      'Jeepney: Tagaytay-bound jeepney, then tour guide assistance required',
      'Tour Package: Book through travel agencies (₱800-1500)',
      'Private Tour: Hire guide locally for best experience',
      'Guided Hike: Professional guides available at park entrance'
    ]
  },
  3: {
    name: 'Plaza Independencia',
    description: 'The historic heart of Batangas City, Plaza Independencia is a beautiful town square surrounded by important landmarks including the cathedral, government buildings, and local shops.',
    distance: '3 km from city center',
    travelTime: '10-20 minutes',
    fare: '₱15-40',
    hours: 'Open 24/7',
    emoji: '🏛️',
    routes: [
      'Tricycle: Direct from any location in city (₱15-30)',
      'Jeepney: Multiple routes pass through, 10-15 minutes',
      'Walking: Accessible from most areas, 15-30 minutes walk',
      'Bike: Bicycle rental available nearby'
    ]
  },
  4: {
    name: 'Local Markets',
    description: 'Experience authentic Batangas culture at the local markets. Fresh fruits, vegetables, seafood, traditional delicacies, and local crafts. A true taste of local life and commerce.',
    distance: '2-5 km from city center',
    travelTime: '10-30 minutes',
    fare: '₱10-30',
    hours: '4:00 AM - 6:00 PM',
    emoji: '🍜',
    routes: [
      'Tricycle: Direct access to main markets (₱15-25)',
      'Jeepney: Multiple routes available',
      'Walking: Many markets within walking distance',
      'Bicycle: Eco-friendly option available'
    ]
  },
  5: {
    name: 'San Pascual Church',
    description: 'A beautiful colonial-era church showcasing Spanish architecture and religious heritage. San Pascual Church is an important landmark for understanding Batangas historical and cultural significance.',
    distance: '4 km from city center',
    travelTime: '15-25 minutes',
    fare: '₱20-40',
    hours: '6:00 AM - 6:00 PM',
    emoji: '🛕',
    routes: [
      'Tricycle: Direct route available (₱20-30)',
      'Jeepney: Multiple routes pass nearby',
      'Walking: Scenic walking route from plaza, 25-30 minutes',
      'Taxi: For comfort and direct drop-off'
    ]
  },
  6: {
    name: 'Mabini Batangas',
    description: 'A popular beach town known for water sports, diving, and beach resorts. Mabini offers exciting activities like scuba diving, snorkeling, jet skiing, and island hopping.',
    distance: '40 km from city center',
    travelTime: '1-1.5 hours',
    fare: '₱80-120',
    hours: '6:00 AM - 6:00 PM',
    emoji: '🌊',
    routes: [
      'Jeepney: Mabini-bound jeepney from terminal (₱80-100)',
      'Private Tour: Book water sports packages (₱1500-3000)',
      'Tricycle + Ferry: Combine transportation methods',
      'Tour Agency: Convenient package deals available'
    ]
  }
};

// ============================================================
// Modal Functions
// ============================================================

const modal = document.getElementById('placeModal');
const modalClose = document.querySelector('.modal-close');

function openModal(placeId) {
  const place = placesData[placeId];
  
  // Update modal content
  document.getElementById('modalImage').textContent = place.emoji;
  document.getElementById('placeName').textContent = place.name;
  document.getElementById('placeDescription').textContent = place.description;
  document.getElementById('placeDistance').textContent = place.distance;
  document.getElementById('placeTravelTime').textContent = place.travelTime;
  document.getElementById('placeFare').textContent = place.fare;
  document.getElementById('placeHours').textContent = place.hours;
  
  // Populate routes
  const routesList = document.getElementById('routesList');
  routesList.innerHTML = place.routes
    .map(route => `<div class="route-item">${route}</div>`)
    .join('');
  
  // Show modal with animation
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// Close modal on close button click
modalClose.addEventListener('click', closeModal);

// Close modal on background click
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});


// ============================================================
// PLACE CARD CLICK HANDLERS
// ============================================================

const placeCards = document.querySelectorAll('.place-card');

placeCards.forEach(card => {
  card.addEventListener('click', () => {
    const placeId = card.getAttribute('data-place');
    openModal(placeId);
  });
  
  // Keyboard accessibility
  card.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const placeId = card.getAttribute('data-place');
      openModal(placeId);
    }
  });
});

// ============================================================
// Mobile Navigation Toggle
// ============================================================

const hamburger = document.querySelector('.hamburger');
const navbarMenu = document.querySelector('.navbar-menu');

hamburger.addEventListener('click', () => {
  navbarMenu.classList.toggle('active');
  hamburger.classList.toggle('active');
});

// Close menu when a link is clicked
document.querySelectorAll('.navbar-menu .nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navbarMenu.classList.remove('active');
    hamburger.classList.remove('active');
  });
});

// ============================================================
// Smooth Scroll Navigation
// ============================================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    
    // Skip if it's a modal or button
    if (href === '#' || !document.querySelector(href)) return;
    
    e.preventDefault();
    
    const target = document.querySelector(href);
    const offsetTop = target.offsetTop - 80; // Account for navbar height
    
    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    });
  });
});

// ============================================================
// Navbar Scroll Effects
// ============================================================

let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  
  // Add shadow on scroll
  if (scrollTop > 10) {
    navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
  } else {
    navbar.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
  }
  
  lastScrollTop = scrollTop;
});

// ============================================================
// Intersection Observer for Fade-In Animations
// ============================================================

const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all sections
document.querySelectorAll('section').forEach(section => {
  section.style.opacity = '0';
  section.style.transform = 'translateY(20px)';
  section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(section);
});

// ============================================================
// Logging for Analytics
// ============================================================

console.log('LACVAY Homepage loaded successfully');

// Track place views
placeCards.forEach((card, index) => {
  card.addEventListener('click', () => {
    const placeId = card.getAttribute('data-place');
    console.log(`[Analytics] Place viewed: ${placesData[placeId].name} (ID: ${placeId})`);
  });
});

// Track CTA clicks
document.querySelectorAll('.btn-primary, .btn-signup').forEach(btn => {
  btn.addEventListener('click', () => {
    console.log(`[Analytics] CTA clicked: ${btn.textContent.trim()}`);
  });
});
