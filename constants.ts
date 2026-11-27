
import type { Tour, Blog } from './types.ts';

export const LANGS = ['en', 'es', 'hi', 'ar'];
export const CURRENCIES = [
  'USD', 
  'AED', 
  'AUD', 
  'CAD', 
  'CHF', 
  'CNY', 
  'EUR', 
  'GBP', 
  'INR', 
  'JPY'
];

export const CURRENCY_RATES_FROM_USD: { [key: string]: number } = {
  USD: 1,
  AED: 3.67,
  AUD: 1.50,
  CAD: 1.37,
  CHF: 0.90,
  CNY: 7.25,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.5,
  JPY: 157,
};

export const NAV_LINKS = [
  { href: '/book', label: 'Book Travel' },
  { href: '/ventures', label: 'Ventures & Life' },
  { href: '/treasure-hunt', label: 'The Blueprint' },
  { href: '/meetups', label: 'MeetUps' },
  { href: '/social-club', label: 'Social Club' },
  { href: '/ai-planner', label: 'AI Planner' },
  { href: '/vr-experience', label: 'VR Experience' },
  { href: '/vyno', label: 'Web3' },
  { href: '/community', label: 'Community' },
  { href: '/dashboard', label: 'Dashboard' },
];

export const BLOGS_DATA: Blog[] = [
  {
    id: 1,
    slug: 'chasing-aurora-in-iceland',
    title: 'Chasing the Aurora: A 4-Day Expedition in Iceland',
    author: 'Elena Petrova',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop',
    date: 'October 26, 2023',
    excerpt: 'Witnessing the Northern Lights was a dream, but Iceland offered so much more. From glacial lagoons to volcanic beaches, here\'s my story of an unforgettable journey.',
    imageUrl: 'https://images.unsplash.com/photo-1579033461380-adb47c3eb938?q=80&w=1200&auto=format&fit=crop',
    tags: ['Iceland', 'Adventure', 'Nature'],
    content: `
## The Land of Fire and Ice
There are places that pictures simply don't do justice, and Iceland is at the top of that list. My 4-day trip with Vanhsya was a whirlwind of natural wonders, culminating in the celestial dance of the Aurora Borealis.

### Day 1: The Golden Circle
Our journey began with the famed Golden Circle. The sheer power of Gullfoss waterfall was humbling, and the geothermal activity at Geysir was a potent reminder of the Earth's raw energy. We ended the day at Thingvellir National Park, literally standing between two continents.

![Gullfoss Waterfall](https://images.unsplash.com/photo-1476610182048-b716b8518aae?q=80&w=800&auto=format&fit=crop)

### Day 2: South Coast Wonders
The South Coast was a study in contrasts. The black sand beaches of Reynisfjara, with their basalt columns, felt otherworldly. We walked behind the cascading water of Seljalandsfoss waterfall—an experience that was both thrilling and soaking!

### Day 3: Glaciers and Icebergs
Jökulsárlón glacier lagoon was surreal. Bright blue icebergs, calved from the glacier, floated silently towards the sea. It was a serene, almost meditative experience, broken only by the sound of cracking ice.

### Day 4: The Main Event
The final night was dedicated to hunting the Aurora. We drove far from the city lights, and then, it happened. Faint green wisps appeared, slowly intensifying into vibrant ribbons that danced across the sky. It was pure magic, a moment of profound awe that left me speechless. This trip wasn't just a vacation; it was a connection to the planet's untamed beauty.
`
  },
  {
    id: 2,
    slug: 'culinary-journey-through-tokyo',
    title: 'A Culinary Journey Through Tokyo\'s Hidden Alleys',
    author: 'Kenji Tanaka',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop',
    date: 'September 15, 2023',
    excerpt: 'They say the best way to understand a culture is through its food. I put that to the test in Tokyo, diving deep into a world of ramen, sushi, and unforgettable izakayas.',
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop',
    tags: ['Tokyo', 'Food', 'Culture'],
    content: `
## More Than Just Sushi
Tokyo is a paradise for food lovers, but the real magic lies beyond the Michelin-starred restaurants. My Vanhsya foodie tour took me into the heart of the city's culinary scene—the bustling markets, noisy izakayas, and tiny, specialized ramen shops.

### Tsukiji Outer Market: A Feast for the Senses
Our adventure started at Tsukiji Outer Market. The energy was electric. We sampled everything from fresh-off-the-grill scallops to sweet, fluffy tamagoyaki (rolled omelet). It was a breakfast like no other.

![Tsukiji Market Stall](https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=2070&auto=format&fit=crop)

### Shinjuku's Memory Lane
As evening fell, we navigated the narrow, lantern-lit alleys of Omoide Yokocho (Memory Lane) in Shinjuku. The air was thick with the delicious smoke of yakitori grills. We squeezed into a tiny eatery, shoulder-to-shoulder with locals, and enjoyed skewers of perfectly grilled chicken, washed down with cold beer. This was the authentic Tokyo experience I had craved.

### The Art of Ramen
The tour concluded with a deep dive into the world of ramen. Our guide took us to a shop specializing in Tonkotsu (pork bone broth) ramen. The broth was rich, creamy, and packed with flavor. Watching the chefs work with such precision was like watching artists. I learned that a perfect bowl of ramen is a complex symphony of ingredients, and I left with a newfound appreciation for this humble dish.
`
  },
  {
    id: 3,
    slug: 'rediscovering-history-in-rome',
    title: 'Walking Through Millennia: Rediscovering History in Rome',
    author: 'Sofia Rossi',
    authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=256&auto=format&fit=crop',
    date: 'August 02, 2023',
    excerpt: 'Rome is a city where history breathes on every corner. Stepping onto the Colosseum\'s arena floor, I felt the echoes of gladiators and emperors across time.',
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1200&auto=format&fit=crop',
    tags: ['Rome', 'History', 'Culture'],
    content: `
## The Eternal City
Rome isn't just a city; it's a living museum. Every cobblestone seems to tell a story. My trip with Vanhsya was designed to peel back the layers of history, and it began with the most iconic structure of them all.

### The Colosseum: A Gladiator's Perspective
Our tour granted us special access to the Arena Floor via the Gladiator's Gate. Standing in the center of the Colosseum, looking up at the stands where 50,000 spectators once roared, was an indescribable feeling. You could almost hear the clash of swords and the roar of the crowd. It was history made tangible.

![The Roman Forum](https://images.unsplash.com/photo-1531572753322-ad063cecc140?q=80&w=800&auto=format&fit=crop)

### The Heart of the Empire
From there, we walked through the Roman Forum, the epicenter of ancient Roman life. Our guide brought the ruins to life, pointing out the Senate House, temples, and bustling marketplaces where Caesar and Cicero once walked. It was a powerful journey back in time.

### A Vatican Marvel
No trip to Rome is complete without visiting the Vatican. St. Peter's Basilica was breathtaking in its scale and opulence. But it was the Sistine Chapel that truly moved me. Lying on the floor (a little trick from our guide) and gazing up at Michelangelo's masterpiece was a deeply spiritual and artistic experience. Rome is a city that stays with you, a place where the past is always present.
`
  }
];


export const TOURS_DATA: Tour[] = [
  {
    id: 1,
    slug: 'dubai-desert-safari',
    title: 'Dubai Desert Safari: Red Dune Adventure',
    description: 'Experience the thrill of a lifetime with our comprehensive desert safari. Choose between our Standard adventure or upgrade to the VIP experience for exclusive table service and gourmet dining under the stars. A must-do for every visitor to Dubai.',
    city: 'Dubai',
    country: 'UAE',
    latitude: 25.2048,
    longitude: 55.2708,
    basePriceUSD: 75,
    images: [
        '/assets/aistudio/image_b4bb5481.png',
        'https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=2787&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1546412414-e1885259563a?q=80&w=2070&auto=format&fit=crop'
    ],
    durationHours: 6,
    groupDiscountPercent: 10,
    groupDiscountThreshold: 4,
    isMeetupEligible: true,
    vrPreviewUrl: 'https://www.youtube.com/embed/s3y_AY-5b_s?rel=0&autoplay=1&mute=1&loop=1&playlist=s3y_AY-5b_s',
    hotspots: [
        { title: 'Dune Bashing', description: 'Experience the thrill of driving over sand dunes in a 4x4 vehicle.', position: { top: '50%', left: '25%' } },
        { title: 'Camel Riding', description: 'Enjoy a traditional camel ride across the serene desert landscape.', position: { top: '65%', left: '70%' } },
    ],
    inclusions: ['4x4 Dune Bashing', 'Camel Riding', 'BBQ Dinner', 'Live Entertainment', 'Hotel Pickup & Drop-off'],
    exclusions: ['Alcoholic Beverages', 'Souvenirs', 'Quad Biking (available for extra charge)'],
    sampleItinerary: [
      { day: 1, title: 'Pickup and Dune Bashing', description: 'Get picked up from your hotel in the afternoon and head straight to the desert for an exhilarating dune bashing session.' },
      { day: 1, title: 'Sunset and Camp Activities', description: 'Witness a stunning desert sunset, followed by an evening at a traditional Bedouin camp with camel riding, henna painting, and more.' },
      { day: 1, title: 'Dinner and Entertainment', description: 'Enjoy a delicious BBQ dinner under the stars, accompanied by captivating belly dance and Tanoura dance performances.' },
    ]
  },
  {
    id: 2,
    slug: 'dubai-miracle-garden-global-village',
    title: 'Dubai Miracle Garden & Global Village Tour',
    description: 'A magical weekend escape featuring the world\'s largest natural flower garden and the region\'s premier multicultural family destination. Walk through hearts made of flowers and travel the world in a single evening.',
    city: 'Dubai',
    country: 'UAE',
    latitude: 25.0599,
    longitude: 55.2446,
    basePriceUSD: 85,
    images: [
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/04/Dubai_Miracle_Garden_-_%E0%B4%A6%E0%B5%81%E0%B4%AC%E0%B4%BE%E0%B4%AF%E0%B5%8D_%E0%B4%AE%E0%B4%BF%E0%B4%B1%E0%B4%BE%E0%B4%95%E0%B5%8D%E0%B4%95%E0%B4%BF%E0%B5%BE_%E0%B4%97%E0%B4%BE%E0%B5%BC%E0%B4%A1%E0%B5%BB_04.jpg/1280px-Dubai_Miracle_Garden_-_%E0%B4%A6%E0%B5%81%E0%B4%AC%E0%B4%BE%E0%B4%AF%E0%B5%8D_%E0%B4%AE%E0%B4%BF%E0%B4%B1%E0%B4%BE%E0%B4%95%E0%B5%8D%E0%B4%95%E0%B4%BF%E0%B5%BE_%E0%B4%97%E0%B4%BE%E0%B5%BC%E0%B4%A1%E0%B5%BB_04.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b6/VAE-dubai-miracle-03.jpg/1280px-VAE-dubai-miracle-03.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5e/Global_Village_Dubai_entrance.jpg/1280px-Global_Village_Dubai_entrance.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cb/Inside_the_Global_Village_in_Dubai_February_2019.jpg/1280px-Inside_the_Global_Village_in_Dubai_February_2019.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'
    ],
    durationHours: 8,
    groupDiscountPercent: 15,
    groupDiscountThreshold: 3,
    isMeetupEligible: true,
    inclusions: ['Miracle Garden Entry Ticket', 'Global Village Entry Ticket', 'Private Transfers', 'Bottle of Water'],
    exclusions: ['Food & Souvenirs', 'Carnival Rides'],
    sampleItinerary: [
      { day: 1, title: 'Miracle Garden', description: 'Afternoon pick-up. Explore 150 million blooming flowers arranged in colorful arches and patterns.' },
      { day: 1, title: 'Sunset Transfer', description: 'Short drive to Global Village as the sun sets.' },
      { day: 1, title: 'Global Village', description: 'Experience the cultures of 90+ countries, shop unique handicrafts, and enjoy world-class street food.' }
    ]
  },
  {
    id: 3,
    slug: 'dubai-aquaventure-waterpark',
    title: 'Aquaventure Waterpark: The Ultimate Splash',
    description: 'Get your adrenaline pumping at the world\'s largest waterpark, located at Atlantis The Palm. Brave the Leap of Faith, relax on the lazy river, or interact with marine life.',
    city: 'Dubai',
    country: 'UAE',
    latitude: 25.1304,
    longitude: 55.1171,
    basePriceUSD: 95,
    images: [
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop',
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/86/Atlantis%2C_The_Palm_from_Le_Royal_M%C3%A9ridien_Beach_Resort_and_Spa_in_Dubai_2.jpg/1280px-Atlantis%2C_The_Palm_from_Le_Royal_M%C3%A9ridien_Beach_Resort_and_Spa_in_Dubai_2.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'
    ],
    durationHours: 9,
    groupDiscountPercent: 5,
    groupDiscountThreshold: 5,
    isMeetupEligible: false,
    inclusions: ['Full day access to Aquaventure Waterpark', 'Access to private beach'],
    exclusions: ['Towels & Lockers (rentable)', 'Food & Drinks', 'Lost Chambers Aquarium (Add-on)'],
    sampleItinerary: [
      { day: 1, title: 'Arrival', description: 'Arrive at Atlantis The Palm and enter the waterpark.' },
      { day: 1, title: 'Slides & Rides', description: 'Conquer the record-breaking slides including the Odyssey of Terror.' },
      { day: 1, title: 'Beach Relaxation', description: 'Unwind on 1km of private beach.' }
    ]
  },
  {
    id: 4,
    slug: 'abu-dhabi-mosque-louvre-tour',
    title: 'Abu Dhabi Grand Mosque & Louvre VIP Tour',
    description: 'Experience the cultural jewels of the UAE capital on this full-day tour from Dubai. Be mesmerized by the architectural marvel of the Sheikh Zayed Grand Mosque and explore the world-class art collections at the Louvre Abu Dhabi.',
    city: 'Abu Dhabi',
    country: 'UAE',
    latitude: 24.4781,
    longitude: 54.3773,
    basePriceUSD: 105,
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop',
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/06/Gradens_Sheikh_Zayed_Grand_Mosque_in_Abu_Dhabi_-_panoramio.jpg/1280px-Gradens_Sheikh_Zayed_Grand_Mosque_in_Abu_Dhabi_-_panoramio.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop'
    ],
    durationHours: 9,
    groupDiscountPercent: 10,
    groupDiscountThreshold: 4,
    isMeetupEligible: false,
    inclusions: ['Entrance tickets to Sheikh Zayed Grand Mosque', 'Entrance tickets to Louvre Abu Dhabi', 'Professional licensed guide', 'Hotel pickup & drop-off from Dubai'],
    exclusions: ['Lunch', 'Gratuities', 'Abaya/Kandura rental (if dress code is not met)'],
    sampleItinerary: [
      { day: 1, title: 'Sheikh Zayed Grand Mosque', description: 'Your first stop is one of the world\'s largest and most beautiful mosques. Marvel at the intricate details, massive chandeliers, and reflective pools.' },
      { day: 1, title: 'Lunch and City Sights', description: 'Enjoy lunch at your own expense at a local restaurant, with a quick drive-by of landmarks like Emirates Palace and the Corniche.' },
      { day: 1, title: 'Louvre Abu Dhabi', description: 'Spend the afternoon exploring the stunning architecture and diverse art collection of the Louvre Abu Dhabi, which bridges the gap between Eastern and Western art.' },
    ]
  },
  {
      id: 5,
      slug: 'jebel-jais-zipline-adventure',
      title: 'Jebel Jais Zipline Adventure',
      description: 'Conquer the world\'s longest zipline, the Jebel Jais Flight! Soar at speeds up to 150 km/h across the stunning ravines of the UAE\'s highest peak. This is the ultimate bucket-list experience.',
      city: 'Ras Al Khaimah',
      country: 'UAE',
      latitude: 25.9388,
      longitude: 56.1436,
      basePriceUSD: 165,
      images: [
        'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop'
      ],
      durationHours: 5,
      groupDiscountPercent: 10,
      groupDiscountThreshold: 3,
      isMeetupEligible: false,
      vrPreviewUrl: 'https://www.youtube.com/embed/zcrCMAR0C-o?rel=0&autoplay=1&mute=1&loop=1&playlist=zcrCMAR0C-o',
      inclusions: ['Jebel Jais Flight zipline ticket', 'Safety equipment and briefing', 'GoPro rental (add-on available)', 'Optional transfers from Dubai'],
      exclusions: ['Transfers from Dubai (unless selected)', 'Meals and beverages', 'Photographs or videos'],
      sampleItinerary: [
        { day: 1, title: 'Ascend Jebel Jais', description: 'Travel to the top of the UAE\'s highest mountain range, enjoying the spectacular winding roads and viewpoints.' },
        { day: 1, title: 'Safety and Gearing Up', description: 'Receive a comprehensive safety briefing from certified professionals and get fitted with your special ziplining suit and harness.' },
        { day: 1, title: 'The Flight of a Lifetime', description: 'Launch from the transparent platform and fly head-first for nearly 3 minutes across the majestic mountain landscape, landing on a suspended platform.' },
      ]
  },
  {
      id: 6,
      slug: 'sharjah-cultural-tour',
      title: 'Sharjah Cultural & Heritage Tour',
      description: 'Discover the cultural heart of the UAE. Visit the Blue Souk, the Museum of Islamic Civilization, and walk through the restored heritage area "Heart of Sharjah".',
      city: 'Sharjah',
      country: 'UAE',
      latitude: 25.3573,
      longitude: 55.4033,
      basePriceUSD: 65,
      images: [
        'https://images.unsplash.com/photo-1526495124232-a04e1849168c?q=80&w=2070&auto=format&fit=crop'
      ],
      durationHours: 5,
      groupDiscountPercent: 10,
      groupDiscountThreshold: 4,
      isMeetupEligible: false,
      inclusions: ['Hotel Pickup', 'Museum Entry Fees', 'Guide', 'Water'],
      exclusions: ['Lunch', 'Personal expenses'],
      sampleItinerary: [
        { day: 1, title: 'King Faisal Mosque', description: 'Photo stop at one of the largest mosques in the Emirates.' },
        { day: 1, title: 'Blue Souk', description: 'Shop for carpets, gold, and antiques in this iconic market.' },
        { day: 1, title: 'Islamic Museum', description: 'Explore thousands of rare Islamic artifacts.' }
      ]
  },
  {
      id: 7,
      slug: 'fujairah-east-coast-tour',
      title: 'Fujairah East Coast Tour & Snorkeling',
      description: 'Escape the city and head to the pristine East Coast. See the Hajar Mountains, visit the oldest mosque in the UAE, and snorkel around Snoopy Island.',
      city: 'Fujairah',
      country: 'UAE',
      latitude: 25.1288,
      longitude: 56.3265,
      basePriceUSD: 110,
      images: [
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?q=80&w=2070&auto=format&fit=crop'
      ],
      durationHours: 10,
      groupDiscountPercent: 5,
      groupDiscountThreshold: 4,
      isMeetupEligible: true,
      inclusions: ['Hotel Pickup', 'Snorkeling Gear', 'Lunch at Beach Hotel', 'Al Bidya Mosque Visit'],
      exclusions: ['Scuba Diving (Optional)', 'Drinks'],
      sampleItinerary: [
        { day: 1, title: 'Friday Market', description: 'Stop at the Masafi Friday market for fruits and carpets.' },
        { day: 1, title: 'Al Bidya Mosque', description: 'Visit the oldest standing mosque in the UAE.' },
        { day: 1, title: 'Snorkeling', description: 'Relax and snorkel at a beach resort near Snoopy Island.' }
      ]
  },
  {
      id: 8,
      slug: 'hatta-mountain-safari',
      title: 'Hatta Mountain Safari & Kayaking',
      description: 'A rugged adventure into the Hajar Mountains. Visit the Hatta Heritage Village, kayak in the turquoise Hatta Dam, and enjoy a mountain picnic.',
      city: 'Hatta',
      country: 'UAE',
      latitude: 24.8096,
      longitude: 56.1264,
      basePriceUSD: 90,
      images: [
        'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1978&auto=format&fit=crop',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bc/A_view_of_the_Hatta_Mountains_in_Hatta_Dam.jpg/1280px-A_view_of_the_Hatta_Mountains_in_Hatta_Dam.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Hatta_Dam_-_UAE.jpg/1280px-Hatta_Dam_-_UAE.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'
      ],
      durationHours: 7,
      groupDiscountPercent: 10,
      groupDiscountThreshold: 4,
      isMeetupEligible: true,
      inclusions: ['4x4 Transport', 'Kayak Rental', 'Heritage Village Entry', 'Picnic Lunch'],
      exclusions: ['Personal Expenses'],
      sampleItinerary: [
        { day: 1, title: 'Mountain Drive', description: 'Drive through wadis and rocky mountain terrain.' },
        { day: 1, title: 'Hatta Dam', description: 'Paddle through the calm turquoise waters of the dam.' },
        { day: 1, title: 'Heritage Village', description: 'Step back in time at the restored mountain village.' }
      ]
  },
  {
    id: 9,
    slug: 'paris-eiffel-tower-tour',
    title: 'Paris Eiffel Tower Summit Tour',
    description: 'Skip the long lines and ascend to the summit of the iconic Eiffel Tower. Get breathtaking panoramic views of Paris while learning about its history from an expert guide.',
    city: 'Paris',
    country: 'France',
    latitude: 48.8566,
    longitude: 2.3522,
    basePriceUSD: 99,
    images: [
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?q=80&w=1974&auto=format&fit=crop',
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Paris_-_The_Eiffel_Tower_in_spring_-_2307.jpg/1280px-Paris_-_The_Eiffel_Tower_in_spring_-_2307.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'
    ],
    durationHours: 3,
    groupDiscountPercent: 5,
    groupDiscountThreshold: 5,
    isMeetupEligible: true,
    vrPreviewUrl: 'https://www.youtube.com/embed/zSPJ-6-2p7Y?rel=0&autoplay=1&mute=1&loop=1&playlist=zSPJ-6-2p7Y',
    hotspots: [
      { title: 'Summit View', description: 'See Paris from the highest point of the Eiffel Tower, offering unparalleled 360-degree views.', position: { top: '20%', left: '50%' } },
      { title: 'Champ de Mars', description: 'The large public greenspace at the base of the tower, perfect for picnics and photos.', position: { top: '80%', left: '40%' } },
      { title: 'Trocadéro Gardens', description: 'Located across the Seine, this is the most famous spot for iconic photos of the Eiffel Tower.', position: { top: '55%', left: '85%' } },
    ],
    inclusions: ['Skip-the-line ticket to the Eiffel Tower summit', 'Expert English-speaking guide', 'Access to all three levels'],
    exclusions: ['Hotel Pickup & Drop-off', 'Food and drinks', 'Gratuities'],
    sampleItinerary: [
      { day: 1, title: 'Meet and Greet', description: 'Meet your guide and bypass the long ticket queues.' },
      { day: 1, title: 'Ascend to the Summit', description: 'Take the elevator to the summit, enjoying fascinating stories along the way.' },
    ]
  },
   {
    id: 10,
    slug: 'machu-picchu-inca-trail-trek',
    title: 'Machu Picchu Inca Trail Trek',
    description: 'Embark on the classic 4-day trek along the Inca Trail to the lost city of Machu Picchu. This challenging but rewarding journey takes you through stunning mountain scenery, lush cloud forests, and past ancient Inca ruins.',
    city: 'Cusco',
    country: 'Peru',
    latitude: -13.5319,
    longitude: -71.9675,
    basePriceUSD: 750,
    images: [
      'https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=2070&auto=format&fit=crop',
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/43/Peru_Machu_Picchu_Sunrise.jpg/1280px-Peru_Machu_Picchu_Sunrise.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9f/99_-_Machu_Picchu_-_Juin_2009.edit3.jpg/1280px-99_-_Machu_Picchu_-_Juin_2009.edit3.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'
    ],
    durationHours: 96,
    groupDiscountPercent: 5,
    groupDiscountThreshold: 4,
    isMeetupEligible: true,
    inclusions: ['Inca Trail permit', 'Professional bilingual guide', 'Porters for camping equipment', 'All meals during the trek', 'Camping equipment (tents, sleeping mats)', 'Bus and train tickets', 'Machu Picchu entrance fee'],
    exclusions: ['Sleeping bag rental', 'Trekking poles rental', 'First breakfast and last lunch', 'Tips for porters and guide'],
    sampleItinerary: [
      { day: 1, title: 'Start of the Trail', description: 'Begin the trek from KM 82, hiking through the Sacred Valley with views of Inca fortresses.' },
      { day: 2, title: 'Dead Woman\'s Pass', description: 'The most challenging day, ascending to the highest point of the trail at Warmiwañusqa (4,215m).' },
      { day: 3, title: 'Cloud Forest and Ruins', description: 'Descend into the beautiful cloud forest, exploring impressive ruins like Phuyupatamarca and Wiñay Wayna.' },
      { day: 4, title: 'Sun Gate to Machu Picchu', description: 'An early start to reach the Sun Gate (Inti Punku) for the first breathtaking view of Machu Picchu at sunrise.' },
    ]
  },
  {
    id: 11,
    slug: 'serengeti-great-migration-safari',
    title: 'Serengeti Great Migration Safari',
    description: 'Witness one of nature\'s most spectacular events. This 5-day safari takes you to the heart of the Serengeti to see the Great Migration.',
    city: 'Arusha',
    country: 'Tanzania',
    latitude: -3.3869,
    longitude: 36.6829,
    basePriceUSD: 2200,
    images: [
      'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1565099824688-e93eb20fe622?q=80&w=2070&auto=format&fit=crop',
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d6/Serengeti_Safari_with_Leopard.jpg/1280px-Serengeti_Safari_with_Leopard.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6a/Ngorongoro_Spitzmaulnashorn.jpg/1280px-Ngorongoro_Spitzmaulnashorn.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'
    ],
    durationHours: 120,
    groupDiscountPercent: 10,
    groupDiscountThreshold: 4,
    isMeetupEligible: false,
    inclusions: ['4x4 Safari vehicle', 'Professional English-speaking safari guide', 'All park fees', 'Full board accommodation'],
    exclusions: ['International flights', 'Tanzanian visa', 'Tips'],
    sampleItinerary: [
      { day: 1, title: 'Arrival in Arusha', description: 'Arrive at Kilimanjaro International Airport and transfer to your hotel.' },
      { day: 2, title: 'Ngorongoro Crater', description: 'Descend into the Ngorongoro Crater for a game drive.' },
      { day: 3, title: 'Central Serengeti', description: 'Travel to the heart of the Serengeti.' },
      { day: 4, title: 'The Great Migration', description: 'Spend a full day tracking the massive wildebeest herds.' },
      { day: 5, title: 'Return to Arusha', description: 'Final game drive before heading back.' }
    ]
  },
  {
    id: 12,
    slug: 'iceland-northern-lights-expedition',
    title: 'Iceland Northern Lights Expedition',
    description: 'Hunt for the magical Aurora Borealis on this 4-day winter adventure in Iceland. Explore stunning glaciers and waterfalls by day, and search for the dancing lights by night.',
    city: 'Reykjavik',
    country: 'Iceland',
    latitude: 64.1466,
    longitude: -21.9426,
    basePriceUSD: 950,
    images: [
      'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format&fit=crop',
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2b/Aurora_borealis_over_snowy_mountains%2C_South_Iceland_%28DSC01438%29.jpg/1280px-Aurora_borealis_over_snowy_mountains%2C_South_Iceland_%28DSC01438%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'
    ],
    durationHours: 96,
    groupDiscountPercent: 8,
    groupDiscountThreshold: 2,
    isMeetupEligible: true,
    vrPreviewUrl: 'https://www.youtube.com/embed/S2C5i_p_240?rel=0&autoplay=1&mute=1&loop=1&playlist=S2C5i_p_240',
    hotspots: [
        { title: 'The Northern Lights', description: 'Witness the incredible Aurora Borealis.', position: { top: '30%', left: '50%' } },
        { title: 'Gullfoss Waterfall', description: 'A powerful waterfall in southwest Iceland.', position: { top: '70%', left: '25%' } },
    ],
    inclusions: ['3 nights accommodation', 'Daily breakfast', 'Guided tours', 'Airport transfers'],
    exclusions: ['International flights', 'Meals'],
    sampleItinerary: [
      { day: 1, title: 'Arrival & Northern Lights Hunt', description: 'Arrive in Reykjavik. Evening aurora hunt.' },
      { day: 2, title: 'Golden Circle Wonders', description: 'Tour the famous Golden Circle.' },
      { day: 3, title: 'South Coast Adventure', description: 'Explore the stunning South Coast.' },
      { day: 4, title: 'Departure', description: 'Transfer to the airport.' }
    ]
  },
  {
    id: 13,
    slug: 'kyoto-cherry-blossom-discovery',
    title: 'Kyoto Cherry Blossom Discovery',
    description: 'Experience Japan\'s iconic sakura season in the ancient capital of Kyoto. This 3-day guided tour takes you to the most famous viewing spots and serene temples.',
    city: 'Kyoto',
    country: 'Japan',
    latitude: 35.0116,
    longitude: 135.7681,
    basePriceUSD: 600,
    images: [
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2148&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=2148&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=2070&auto=format&fit=crop',
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8e/Fushimi_Inari-taisha%2C_Kyoto%2C_20240818_1343_4411.jpg/1280px-Fushimi_Inari-taisha%2C_Kyoto%2C_20240818_1343_4411.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/97/2021_Sagano_Bamboo_forest_in_Arashiyama%2C_Kyoto%2C_Japan.jpg/1280px-2021_Sagano_Bamboo_forest_in_Arashiyama%2C_Kyoto%2C_Japan.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'
    ],
    durationHours: 72,
    groupDiscountPercent: 10,
    groupDiscountThreshold: 4,
    isMeetupEligible: false,
    inclusions: ['Professional guide', 'Transport passes', 'Entrance fees', 'Tea ceremony'],
    exclusions: ['Accommodation', 'Meals'],
    sampleItinerary: [
      { day: 1, title: 'Arashiyama Bamboo & Temples', description: 'Visit Arashiyama and Tenryu-ji Temple.' },
      { day: 2, title: 'Philosopher\'s Path', description: 'Stroll along the canal lined with cherry trees.' },
      { day: 3, title: 'Fushimi Inari', description: 'Hike through the torii gates.' },
    ]
  }
];
