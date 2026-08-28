const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Campus Base GPS Origin (Stanford/Silicon Valley Campus inspired coordinates for realistic simulation)
const BASE_LAT = 37.42750;
const BASE_LNG = -122.16970;

async function main() {
  console.log('🌱 Starting CampusLens Database Seeding...');

  // 1. Clean existing records in cascade order
  await prisma.navigationHistory.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.campusEvent.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.room.deleteMany();
  await prisma.building.deleteMany();
  await prisma.routeEdge.deleteMany();
  await prisma.routeNode.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing records.');

  // 2. Create Users
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('AdminPassword123!', salt);
  const studentPassword = await bcrypt.hash('StudentPassword123!', salt);
  const staffPassword = await bcrypt.hash('StaffPassword123!', salt);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Dr. Evelyn Vance (Admin)',
      email: 'admin@campuslens.edu',
      password: adminPassword,
      role: 'ADMIN',
      department: 'Campus Administration & IT',
      avatar: 'avatar-purple',
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      name: 'Alex Rivera',
      email: 'student@campuslens.edu',
      password: studentPassword,
      role: 'STUDENT',
      department: 'Computer Science',
      avatar: 'avatar-cyan',
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      name: 'Prof. Marcus Brody',
      email: 'faculty@campuslens.edu',
      password: staffPassword,
      role: 'STAFF',
      department: 'Electrical Engineering',
      avatar: 'avatar-green',
    },
  });

  console.log('👤 Seeded users (Admin, Student, Staff).');

  // 3. Create Buildings
  const buildingsData = [
    {
      name: 'Computer Science Block',
      code: 'CSE',
      description: 'State-of-the-art hub for computing, artificial intelligence laboratories, software engineering suites, and cloud infrastructure.',
      category: 'Academic',
      lat: BASE_LAT + 0.0018,
      lng: BASE_LNG - 0.0015,
      altitude: 12.0,
      floors: 4,
      color: '#00F0FF',
      width: 28.0,
      depth: 22.0,
      height: 18.0,
      image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
      amenities: JSON.stringify(['High-Speed Wi-Fi', 'AI Supercluster', 'Elevator', 'Wheelchair Ramps', 'Coffee Kiosk']),
    },
    {
      name: 'Central University Library',
      code: 'LIB',
      description: 'Five-story knowledge repository featuring 250,000 volumes, silent study sanctuaries, digital archives, and 24/7 reading halls.',
      category: 'Library',
      lat: BASE_LAT + 0.0005,
      lng: BASE_LNG + 0.0008,
      altitude: 10.0,
      floors: 5,
      color: '#8B5CF6',
      width: 32.0,
      depth: 26.0,
      height: 22.0,
      image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
      amenities: JSON.stringify(['24/7 Access', 'Silent Zones', 'Printing Lab', 'Elevator', 'Café', 'Accessible Restrooms']),
    },
    {
      name: 'Electronics & Communication Block',
      code: 'ECE',
      description: 'Advanced engineering center housing robotics testbeds, VLSI design studios, telecommunications lab, and cleanrooms.',
      category: 'Academic',
      lat: BASE_LAT + 0.0022,
      lng: BASE_LNG + 0.0012,
      altitude: 11.0,
      floors: 4,
      color: '#10B981',
      width: 26.0,
      depth: 20.0,
      height: 16.0,
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      amenities: JSON.stringify(['Robotics Arena', 'PCB Prototyping', 'Elevator', 'Maker Space']),
    },
    {
      name: 'Administration Headquarters',
      code: 'ADM',
      description: 'Campus executive offices, admissions hall, registrar, financial aid, international student affairs, and visitor welcome center.',
      category: 'Administration',
      lat: BASE_LAT - 0.0010,
      lng: BASE_LNG - 0.0002,
      altitude: 10.0,
      floors: 3,
      color: '#F59E0B',
      width: 30.0,
      depth: 24.0,
      height: 14.0,
      image: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80',
      amenities: JSON.stringify(['Admissions Helpdesk', 'Visitor Registration', 'Wheelchair Ramps', 'ATM', 'Conference Suites']),
    },
    {
      name: 'Science & Research Complex',
      code: 'SCI',
      description: 'Interdisciplinary research center for physics, nanotechnology, biochemistry labs, and cryogenic research facilities.',
      category: 'Labs',
      lat: BASE_LAT + 0.0030,
      lng: BASE_LNG - 0.0008,
      altitude: 12.0,
      floors: 4,
      color: '#EC4899',
      width: 25.0,
      depth: 22.0,
      height: 17.0,
      image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
      amenities: JSON.stringify(['Chemical Safety Showers', 'Spectrometry Lab', 'Elevators', 'Hazmat Protocol Units']),
    },
    {
      name: 'Innovation & Incubator Hub',
      code: 'INN',
      description: 'Startup incubator, patent accelerator, AR/VR simulation studio, design fabrication lab, and venture pitch auditorium.',
      category: 'Academic',
      lat: BASE_LAT + 0.0012,
      lng: BASE_LNG - 0.0028,
      altitude: 11.0,
      floors: 3,
      color: '#06B6D4',
      width: 24.0,
      depth: 20.0,
      height: 14.0,
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      amenities: JSON.stringify(['Startup Pods', '3D Printing Fleet', 'VR Testing Rig', 'Podcast Studio', 'Espresso Lounge']),
    },
    {
      name: 'Grand Auditorium',
      code: 'AUD',
      description: '2,500-seat acoustic concert hall and conference facility hosting graduation ceremonies, guest keynotes, and theatrical productions.',
      category: 'Academic',
      lat: BASE_LAT - 0.0018,
      lng: BASE_LNG + 0.0015,
      altitude: 10.0,
      floors: 2,
      color: '#A855F7',
      width: 36.0,
      depth: 30.0,
      height: 18.0,
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
      amenities: JSON.stringify(['Acoustic Soundstage', 'Wheelchair Seating', 'Green Rooms', 'VIP Lounge']),
    },
    {
      name: 'University Sports Complex',
      code: 'SPT',
      description: 'Olympic-size indoor swimming pool, basketball courts, badminton arenas, fitness center, and athletic conditioning facilities.',
      category: 'Sports',
      lat: BASE_LAT - 0.0025,
      lng: BASE_LNG - 0.0020,
      altitude: 10.0,
      floors: 2,
      color: '#3B82F6',
      width: 40.0,
      depth: 35.0,
      height: 15.0,
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
      amenities: JSON.stringify(['Olympic Pool', 'Locker Rooms', 'Gymnasium', 'First Aid Station', 'Sauna']),
    },
    {
      name: 'Student Center & Food Court',
      code: 'FC',
      description: 'Multi-cuisine dining pavilion, gourmet coffee roasters, student union offices, gaming lounge, and convenience store.',
      category: 'Food',
      lat: BASE_LAT - 0.0002,
      lng: BASE_LNG - 0.0018,
      altitude: 10.0,
      floors: 2,
      color: '#F97316',
      width: 30.0,
      depth: 22.0,
      height: 12.0,
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      amenities: JSON.stringify(['12 Food Outlets', 'Vegan & Halal Options', 'Outdoor Terrace', 'Power Outlets at Tables']),
    },
    {
      name: 'Campus Health & Medical Center',
      code: 'MED',
      description: '24/7 emergency care clinic, urgent care triage, pharmacy, mental wellness counseling, and ambulance bay.',
      category: 'Medical',
      lat: BASE_LAT + 0.0008,
      lng: BASE_LNG - 0.0035,
      altitude: 10.0,
      floors: 2,
      color: '#EF4444',
      width: 22.0,
      depth: 18.0,
      height: 11.0,
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
      amenities: JSON.stringify(['24/7 Urgent Care', 'Pharmacy', 'Emergency Trauma Bay', 'Counseling Suites']),
    },
    {
      name: 'North Campus Parking Complex',
      code: 'PKG',
      description: 'Multi-level solar-canopied parking structure with 1,200 stalls, 60 EV fast chargers, and bicycle storage lockers.',
      category: 'Parking',
      lat: BASE_LAT + 0.0032,
      lng: BASE_LNG + 0.0025,
      altitude: 10.0,
      floors: 4,
      color: '#64748B',
      width: 32.0,
      depth: 25.0,
      height: 14.0,
      image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
      amenities: JSON.stringify(['EV Fast Charging', 'Bicycle Lockers', 'Surveillance 24/7', 'Elevators']),
    },
  ];

  const createdBuildings = {};
  for (const b of buildingsData) {
    const created = await prisma.building.create({ data: b });
    createdBuildings[b.code] = created;
  }
  console.log(`🏢 Seeded ${buildingsData.length} campus buildings.`);

  // 4. Create Rooms
  const roomsData = [
    // CSE Block
    { roomNumber: '101', name: 'Alan Turing Lecture Hall', buildingId: createdBuildings['CSE'].id, floor: 1, department: 'Computer Science', type: 'LECTURE_HALL', capacity: 180 },
    { roomNumber: '104', name: 'Introductory Programming Lab', buildingId: createdBuildings['CSE'].id, floor: 1, department: 'Computer Science', type: 'LAB', capacity: 45 },
    { roomNumber: '201', name: 'Cloud Computing & Distributed Systems Lab', buildingId: createdBuildings['CSE'].id, floor: 2, department: 'Computer Science', type: 'LAB', capacity: 40 },
    { roomNumber: '204', name: 'Machine Learning & AI Research Suite', buildingId: createdBuildings['CSE'].id, floor: 2, department: 'Computer Science', type: 'LAB', capacity: 35 },
    { roomNumber: '302', name: 'Cybersecurity Defense Center', buildingId: createdBuildings['CSE'].id, floor: 3, department: 'Computer Science', type: 'LAB', capacity: 30 },
    { roomNumber: '308', name: 'Department Head & Faculty Offices', buildingId: createdBuildings['CSE'].id, floor: 3, department: 'Computer Science', type: 'FACULTY_OFFICE', capacity: 20 },
    { roomNumber: '401', name: 'Graduate Seminar Room A', buildingId: createdBuildings['CSE'].id, floor: 4, department: 'Computer Science', type: 'SEMINAR', capacity: 50 },

    // Central Library
    { roomNumber: 'LIB-101', name: 'Main Circulation Desk & Help Center', buildingId: createdBuildings['LIB'].id, floor: 1, department: 'Library Services', type: 'CLASSROOM', capacity: 100 },
    { roomNumber: 'LIB-205', name: 'Digital Media & Collaborative Commons', buildingId: createdBuildings['LIB'].id, floor: 2, department: 'Library Services', type: 'LAB', capacity: 60 },
    { roomNumber: 'LIB-301', name: 'Silent Individual Study Pods', buildingId: createdBuildings['LIB'].id, floor: 3, department: 'Library Services', type: 'CLASSROOM', capacity: 80 },
    { roomNumber: 'LIB-401', name: 'Rare Books & Historical Archives', buildingId: createdBuildings['LIB'].id, floor: 4, department: 'Library Services', type: 'CLASSROOM', capacity: 30 },

    // ECE Block
    { roomNumber: 'ECE-101', name: 'Nikola Tesla Auditorium', buildingId: createdBuildings['ECE'].id, floor: 1, department: 'Electrical Engineering', type: 'LECTURE_HALL', capacity: 150 },
    { roomNumber: 'ECE-202', name: 'VLSI & Microelectronics Fabrication Lab', buildingId: createdBuildings['ECE'].id, floor: 2, department: 'Electrical Engineering', type: 'LAB', capacity: 30 },
    { roomNumber: 'ECE-305', name: 'Autonomous Robotics Testbed', buildingId: createdBuildings['ECE'].id, floor: 3, department: 'Electrical Engineering', type: 'LAB', capacity: 40 },

    // Administration
    { roomNumber: 'ADM-101', name: 'Admissions & Student Service Center', buildingId: createdBuildings['ADM'].id, floor: 1, department: 'Administration', type: 'CLASSROOM', capacity: 70 },
    { roomNumber: 'ADM-201', name: 'Office of the University President', buildingId: createdBuildings['ADM'].id, floor: 2, department: 'Administration', type: 'FACULTY_OFFICE', capacity: 25 },
    { roomNumber: 'ADM-205', name: 'Academic Senate Boardroom', buildingId: createdBuildings['ADM'].id, floor: 2, department: 'Administration', type: 'SEMINAR', capacity: 40 },

    // Science Complex
    { roomNumber: 'SCI-102', name: 'Marie Curie Chemistry Hall', buildingId: createdBuildings['SCI'].id, floor: 1, department: 'Physics & Chemistry', type: 'LECTURE_HALL', capacity: 140 },
    { roomNumber: 'SCI-204', name: 'Quantum Optics & Laser Laboratory', buildingId: createdBuildings['SCI'].id, floor: 2, department: 'Physics & Chemistry', type: 'LAB', capacity: 25 },
    { roomNumber: 'SCI-301', name: 'Biotechnology & DNA Sequencing Lab', buildingId: createdBuildings['SCI'].id, floor: 3, department: 'Biology', type: 'LAB', capacity: 35 },

    // Innovation Hub
    { roomNumber: 'INN-101', name: 'Makerspace & Prototyping Workshop', buildingId: createdBuildings['INN'].id, floor: 1, department: 'Innovation', type: 'LAB', capacity: 50 },
    { roomNumber: 'INN-202', name: 'AR/VR Immersive Experience Lab', buildingId: createdBuildings['INN'].id, floor: 2, department: 'Innovation', type: 'LAB', capacity: 30 },
    { roomNumber: 'INN-301', name: 'Venture Pitch & Demo Stage', buildingId: createdBuildings['INN'].id, floor: 3, department: 'Innovation', type: 'SEMINAR', capacity: 90 },

    // Medical Center
    { roomNumber: 'MED-101', name: 'Triage & Emergency Consultation', buildingId: createdBuildings['MED'].id, floor: 1, department: 'Medical Services', type: 'CLASSROOM', capacity: 20 },
    { roomNumber: 'MED-105', name: 'Campus Pharmacy & Dispensary', buildingId: createdBuildings['MED'].id, floor: 1, department: 'Medical Services', type: 'CLASSROOM', capacity: 15 },
  ];

  for (const r of roomsData) {
    await prisma.room.create({ data: r });
  }
  console.log(`🚪 Seeded ${roomsData.length} academic and research rooms.`);

  // 5. Create Facilities
  const facilitiesData = [
    {
      name: 'Main Campus Infotag Helpdesk',
      category: 'Administration',
      description: 'Campus tour departure point, ID card replacements, and digital maps kiosk.',
      buildingId: createdBuildings['ADM'].id,
      lat: BASE_LAT - 0.0009,
      lng: BASE_LNG - 0.0002,
      floor: 1,
      openingHours: '08:00 AM - 06:00 PM',
      contactPhone: '+1 (555) 019-2001',
      isWheelchairAccessible: true,
    },
    {
      name: 'Campus Police & Security Dispatch',
      category: 'Emergency',
      description: '24/7 emergency response, lost & found, emergency blue light system command center.',
      buildingId: createdBuildings['ADM'].id,
      lat: BASE_LAT - 0.0011,
      lng: BASE_LNG - 0.0001,
      floor: 1,
      openingHours: '24 Hours / 7 Days',
      contactPhone: '+1 (555) 911-0000',
      isWheelchairAccessible: true,
    },
    {
      name: 'Emergency Medical Clinic & Ambulance Bay',
      category: 'Emergency',
      description: 'Immediate trauma and emergency medical care unit with direct ambulance dispatch.',
      buildingId: createdBuildings['MED'].id,
      lat: BASE_LAT + 0.0008,
      lng: BASE_LNG - 0.0035,
      floor: 1,
      openingHours: '24 Hours / 7 Days',
      contactPhone: '+1 (555) 911-0001',
      isWheelchairAccessible: true,
    },
    {
      name: 'Byte & Brew Cyber Café',
      category: 'Food',
      description: 'Artisan espresso, smoothies, sandwiches, and fast gigabit Wi-Fi workstations.',
      buildingId: createdBuildings['CSE'].id,
      lat: BASE_LAT + 0.0017,
      lng: BASE_LNG - 0.0014,
      floor: 1,
      openingHours: '07:30 AM - 10:00 PM',
      contactPhone: '+1 (555) 019-2045',
      isWheelchairAccessible: true,
    },
    {
      name: 'Grand Dining Hall & Food Pavilion',
      category: 'Food',
      description: 'Multi-station dining featuring Asian wok, Italian hearth, Mediterranean grill, and vegan salad bars.',
      buildingId: createdBuildings['FC'].id,
      lat: BASE_LAT - 0.0002,
      lng: BASE_LNG - 0.0018,
      floor: 1,
      openingHours: '07:00 AM - 11:00 PM',
      contactPhone: '+1 (555) 019-2080',
      isWheelchairAccessible: true,
    },
    {
      name: 'Central 24-Hour Digital Reading Room',
      category: 'Library',
      description: 'Dedicated overnight study hall equipped with monitor docks, power banks, and quiet lighting.',
      buildingId: createdBuildings['LIB'].id,
      lat: BASE_LAT + 0.0005,
      lng: BASE_LNG + 0.0008,
      floor: 1,
      openingHours: '24 Hours / 7 Days',
      contactPhone: '+1 (555) 019-2030',
      isWheelchairAccessible: true,
    },
    {
      name: 'Aquatic Center & Lap Pool',
      category: 'Sports',
      description: '50-meter temperature-controlled swimming pool with certified lifeguards and swimming lanes.',
      buildingId: createdBuildings['SPT'].id,
      lat: BASE_LAT - 0.0026,
      lng: BASE_LNG - 0.0021,
      floor: 1,
      openingHours: '06:00 AM - 09:30 PM',
      contactPhone: '+1 (555) 019-2090',
      isWheelchairAccessible: true,
    },
    {
      name: 'Strength & Cardio Gymnasium',
      category: 'Sports',
      description: 'Fully equipped weights room, treadmills, elliptical trainers, and personal fitness trainers.',
      buildingId: createdBuildings['SPT'].id,
      lat: BASE_LAT - 0.0024,
      lng: BASE_LNG - 0.0019,
      floor: 2,
      openingHours: '06:00 AM - 11:00 PM',
      contactPhone: '+1 (555) 019-2091',
      isWheelchairAccessible: true,
    },
    {
      name: 'North Garage EV Rapid Charging Hub',
      category: 'Parking',
      description: '60 Level-3 DC fast chargers with solar canopy roof for electric vehicles and scooters.',
      buildingId: createdBuildings['PKG'].id,
      lat: BASE_LAT + 0.0032,
      lng: BASE_LNG + 0.0025,
      floor: 1,
      openingHours: '24 Hours / 7 Days',
      contactPhone: '+1 (555) 019-2077',
      isWheelchairAccessible: true,
    },
    {
      name: 'Robotics & Hardware Rapid Prototyping Lab',
      category: 'Labs',
      description: 'Industrial CNC routers, laser cutters, PCB pick-and-place machines, and soldering benches.',
      buildingId: createdBuildings['INN'].id,
      lat: BASE_LAT + 0.0012,
      lng: BASE_LNG - 0.0028,
      floor: 1,
      openingHours: '08:00 AM - 09:00 PM',
      contactPhone: '+1 (555) 019-2060',
      isWheelchairAccessible: true,
    },
    {
      name: 'Mental Health & Wellness Counseling Center',
      category: 'Medical',
      description: 'Confidential psychological therapy, stress management workshops, and peer support counseling.',
      buildingId: createdBuildings['MED'].id,
      lat: BASE_LAT + 0.0009,
      lng: BASE_LNG - 0.0034,
      floor: 2,
      openingHours: '08:30 AM - 05:30 PM',
      contactPhone: '+1 (555) 019-2055',
      isWheelchairAccessible: true,
    },
  ];

  for (const f of facilitiesData) {
    await prisma.facility.create({ data: f });
  }
  console.log(`📍 Seeded ${facilitiesData.length} campus facilities.`);

  // 6. Create Campus Walkway Graph (Nodes & Interconnecting Edges)
  const routeNodesData = [
    { nodeId: 'N_MAIN_GATE', name: 'Main Campus South Gate', lat: BASE_LAT - 0.0030, lng: BASE_LNG - 0.0005, floor: 1, isIndoor: false, isAccessible: true },
    { nodeId: 'N_ADM_PLAZA', name: 'Administration Plaza', lat: BASE_LAT - 0.0010, lng: BASE_LNG - 0.0002, floor: 1, isIndoor: false, isAccessible: true },
    { nodeId: 'N_CENTRAL_FOUNTAIN', name: 'Central University Fountain', lat: BASE_LAT + 0.0000, lng: BASE_LNG + 0.0000, floor: 1, isIndoor: false, isAccessible: true },
    { nodeId: 'N_LIB_ENTRY', name: 'Central Library Entrance', lat: BASE_LAT + 0.0005, lng: BASE_LNG + 0.0007, floor: 1, isIndoor: false, isAccessible: true },
    { nodeId: 'N_LIB_LOBBY', name: 'Library 1F Main Lobby', lat: BASE_LAT + 0.0005, lng: BASE_LNG + 0.0008, floor: 1, isIndoor: true, isAccessible: true },
    { nodeId: 'N_LIB_2F', name: 'Library 2F Digital Commons', lat: BASE_LAT + 0.0005, lng: BASE_LNG + 0.0008, floor: 2, isIndoor: true, isAccessible: true },
    { nodeId: 'N_CSE_PLAZA', name: 'Computer Science Forecourt', lat: BASE_LAT + 0.0017, lng: BASE_LNG - 0.0014, floor: 1, isIndoor: false, isAccessible: true },
    { nodeId: 'N_CSE_ENTRY', name: 'CSE Building Main Entrance', lat: BASE_LAT + 0.0018, lng: BASE_LNG - 0.0015, floor: 1, isIndoor: true, isAccessible: true },
    { nodeId: 'N_CSE_2F', name: 'CSE Floor 2 AI Laboratories', lat: BASE_LAT + 0.0018, lng: BASE_LNG - 0.0015, floor: 2, isIndoor: true, isAccessible: true },
    { nodeId: 'N_ECE_PLAZA', name: 'Engineering Quadrangle & ECE Entry', lat: BASE_LAT + 0.0021, lng: BASE_LNG + 0.0011, floor: 1, isIndoor: false, isAccessible: true },
    { nodeId: 'N_SCI_QUAD', name: 'Science Complex Courtyard', lat: BASE_LAT + 0.0029, lng: BASE_LNG - 0.0007, floor: 1, isIndoor: false, isAccessible: true },
    { nodeId: 'N_INN_CORRIDOR', name: 'Innovation Hub Walkway', lat: BASE_LAT + 0.0011, lng: BASE_LNG - 0.0027, floor: 1, isIndoor: false, isAccessible: true },
    { nodeId: 'N_FOOD_COURT', name: 'Food Court Main Terrace', lat: BASE_LAT - 0.0003, lng: BASE_LNG - 0.0017, floor: 1, isIndoor: false, isAccessible: true },
    { nodeId: 'N_AUD_ENTRY', name: 'Auditorium Grand Steps', lat: BASE_LAT - 0.0017, lng: BASE_LNG + 0.0014, floor: 1, isIndoor: false, isAccessible: false },
    { nodeId: 'N_AUD_RAMP', name: 'Auditorium Accessible West Ramp', lat: BASE_LAT - 0.0017, lng: BASE_LNG + 0.0013, floor: 1, isIndoor: false, isAccessible: true },
    { nodeId: 'N_SPORTS_ENTRY', name: 'Sports Complex Main Gates', lat: BASE_LAT - 0.0024, lng: BASE_LNG - 0.0019, floor: 1, isIndoor: false, isAccessible: true },
    { nodeId: 'N_MED_ENTRY', name: 'Medical Clinic Ambulance Bay & Entry', lat: BASE_LAT + 0.0007, lng: BASE_LNG - 0.0034, floor: 1, isIndoor: false, isAccessible: true },
    { nodeId: 'N_PKG_NORTH', name: 'North Parking Transit Stop', lat: BASE_LAT + 0.0031, lng: BASE_LNG + 0.0024, floor: 1, isIndoor: false, isAccessible: true },
    { nodeId: 'N_CROSS_WEST', name: 'West Walkway Intersection', lat: BASE_LAT + 0.0008, lng: BASE_LNG - 0.0016, floor: 1, isIndoor: false, isAccessible: true },
    { nodeId: 'N_CROSS_NORTH', name: 'North Walkway Promenade', lat: BASE_LAT + 0.0025, lng: BASE_LNG + 0.0000, floor: 1, isIndoor: false, isAccessible: true },
  ];

  for (const node of routeNodesData) {
    await prisma.routeNode.create({ data: node });
  }

  // Interconnecting Graph Edges
  const routeEdgesData = [
    // Main South Gate to Admin Plaza
    { fromNodeId: 'N_MAIN_GATE', toNodeId: 'N_ADM_PLAZA', distance: 180, isAccessible: true, isStairs: false, isElevator: false, isOutdoor: true, description: 'South Boulevard' },
    // Admin Plaza to Central Fountain
    { fromNodeId: 'N_ADM_PLAZA', toNodeId: 'N_CENTRAL_FOUNTAIN', distance: 110, isAccessible: true, isStairs: false, isElevator: false, isOutdoor: true, description: 'Palm Walkway' },
    // Central Fountain to Library
    { fromNodeId: 'N_CENTRAL_FOUNTAIN', toNodeId: 'N_LIB_ENTRY', distance: 80, isAccessible: true, isStairs: false, isElevator: false, isOutdoor: true, description: 'Library Promenade' },
    { fromNodeId: 'N_LIB_ENTRY', toNodeId: 'N_LIB_LOBBY', distance: 15, isAccessible: true, isStairs: false, isElevator: false, isOutdoor: false, description: 'Library Main Door' },
    { fromNodeId: 'N_LIB_LOBBY', toNodeId: 'N_LIB_2F', distance: 20, isAccessible: true, isStairs: false, isElevator: true, description: 'Central Elevator' },
    // Central Fountain to West Crossing
    { fromNodeId: 'N_CENTRAL_FOUNTAIN', toNodeId: 'N_CROSS_WEST', distance: 140, isAccessible: true, isStairs: false, isElevator: false, isOutdoor: true, description: 'West Avenue' },
    // West Crossing to CSE Plaza
    { fromNodeId: 'N_CROSS_WEST', toNodeId: 'N_CSE_PLAZA', distance: 95, isAccessible: true, isStairs: false, isElevator: false, isOutdoor: true, description: 'Turing Walk' },
    { fromNodeId: 'N_CSE_PLAZA', toNodeId: 'N_CSE_ENTRY', distance: 20, isAccessible: true, isStairs: false, isElevator: false, isOutdoor: false, description: 'CSE Glass Doors' },
    { fromNodeId: 'N_CSE_ENTRY', toNodeId: 'N_CSE_2F', distance: 25, isAccessible: true, isStairs: false, isElevator: true, description: 'CSE West Elevator' },
    // West Crossing to Food Court
    { fromNodeId: 'N_CROSS_WEST', toNodeId: 'N_FOOD_COURT', distance: 120, isAccessible: true, isStairs: false, isElevator: false, isOutdoor: true, description: 'Canopy Way' },
    { fromNodeId: 'N_FOOD_COURT', toNodeId: 'N_ADM_PLAZA', distance: 130, isAccessible: true, isStairs: false, isElevator: false, isOutdoor: true, description: 'Southwest Lawn Path' },
    // West Crossing to Innovation Hub
    { fromNodeId: 'N_CROSS_WEST', toNodeId: 'N_INN_CORRIDOR', distance: 90, isAccessible: true, isStairs: false, isElevator: false, isOutdoor: true, description: 'Innovation Alley' },
    // Innovation to Medical Clinic
    { fromNodeId: 'N_INN_CORRIDOR', toNodeId: 'N_MED_ENTRY', distance: 75, isAccessible: true, isStairs: false, isElevator: false, isOutdoor: true, description: 'Health Way' },
    // CSE to Science Quad
    { fromNodeId: 'N_CSE_PLAZA', toNodeId: 'N_SCI_QUAD', distance: 130, isAccessible: true, isStairs: false, isElevator: false, isOutdoor: true, description: 'Discovery Lane' },
    // Science Quad to North Crossing
    { fromNodeId: 'N_SCI_QUAD', toNodeId: 'N_CROSS_NORTH', distance: 85, isAccessible: true, isStairs: false, isElevator: false, isOutdoor: true, description: 'North Avenue' },
    // North Crossing to ECE Plaza
    { fromNodeId: 'N_CROSS_NORTH', toNodeId: 'N_ECE_PLAZA', distance: 90, isAccessible: true, isStairs: false, isElevator: false, isOutdoor: true, description: 'Engineering Esplanade' },
    // ECE Plaza to Central Library
    { fromNodeId: 'N_ECE_PLAZA', toNodeId: 'N_LIB_ENTRY', distance: 140, isAccessible: true, isStairs: false, isElevator: false, isOutdoor: true, description: 'East Quadrant Path' },
    // North Crossing to North Parking
    { fromNodeId: 'N_CROSS_NORTH', toNodeId: 'N_PKG_NORTH', distance: 190, isAccessible: true, isStairs: false, isElevator: false, isOutdoor: true, description: 'North Shuttle Way' },
    // Central Fountain to Auditorium
    { fromNodeId: 'N_CENTRAL_FOUNTAIN', toNodeId: 'N_AUD_ENTRY', distance: 170, isAccessible: false, isStairs: true, isElevator: false, isOutdoor: true, description: 'Grand Steps of Arts' },
    { fromNodeId: 'N_CENTRAL_FOUNTAIN', toNodeId: 'N_AUD_RAMP', distance: 175, isAccessible: true, isStairs: false, isElevator: false, isOutdoor: true, description: 'Accessible Auditorium Walk' },
    { fromNodeId: 'N_AUD_RAMP', toNodeId: 'N_AUD_ENTRY', distance: 10, isAccessible: true, isStairs: false, isElevator: false, isOutdoor: true, description: 'Ramp Connecting Platform' },
    // Food Court to Sports Complex
    { fromNodeId: 'N_FOOD_COURT', toNodeId: 'N_SPORTS_ENTRY', distance: 190, isAccessible: true, isStairs: false, isElevator: false, isOutdoor: true, description: 'Athletics Way' },
    { fromNodeId: 'N_MAIN_GATE', toNodeId: 'N_SPORTS_ENTRY', distance: 120, isAccessible: true, isStairs: false, isElevator: false, isOutdoor: true, description: 'Southwest Gate Link' },
  ];

  for (const edge of routeEdgesData) {
    await prisma.routeEdge.create({ data: edge });
  }
  console.log(`🗺️ Seeded ${routeNodesData.length} route nodes and ${routeEdgesData.length} walkway edges.`);

  // 7. Seed Campus Events
  const now = new Date();
  const eventsData = [
    {
      title: 'Global AI & WebXR Hackathon 2026',
      description: '36-hour sprint building cutting-edge spatial computing, AR applications, and generative AI agents. Over $25,000 in prizes.',
      category: 'Hackathon',
      startDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // in 2 days
      endDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      buildingId: createdBuildings['CSE'].id,
      room: 'Alan Turing Lecture Hall & 2F Labs',
      organizer: 'CampusLens & ACM Student Chapter',
      bannerImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Annual Robotics & Autonomous Systems Symposium',
      description: 'Live demonstrations of quadrupeds, autonomous drones, and humanoids with keynote addresses by industry researchers.',
      category: 'Symposium',
      startDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000), // in 6 days
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      buildingId: createdBuildings['ECE'].id,
      room: 'Nikola Tesla Auditorium',
      organizer: 'IEEE Robotics & Automation Society',
      bannerImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Venture Pitch & Startup Demo Day',
      description: 'Ten student-led technology startups pitch to angel investors, venture capitalists, and alumni accelerators.',
      category: 'Workshop',
      startDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000 + 4 * 3600 * 1000),
      buildingId: createdBuildings['INN'].id,
      room: 'Venture Pitch Stage',
      organizer: 'Campus Innovation Incubator',
      bannerImage: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Inter-University Spring Marathon & Athletics Championship',
      description: 'Annual 10K campus run and inter-collegiate track events concluding with an award banquet at the Sports Complex.',
      category: 'Sports',
      startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 8 * 3600 * 1000),
      buildingId: createdBuildings['SPT'].id,
      room: 'Athletics Stadium & Gymnasium',
      organizer: 'University Athletic Board',
      bannerImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
    },
  ];

  for (const ev of eventsData) {
    await prisma.campusEvent.create({ data: ev });
  }
  console.log(`📅 Seeded ${eventsData.length} campus events.`);

  // 8. Seed Sample Favorites and Navigation History for Student
  await prisma.favorite.createMany({
    data: [
      {
        userId: studentUser.id,
        targetType: 'BUILDING',
        targetId: createdBuildings['LIB'].id,
        title: 'Central University Library',
        subtitle: '5 Floors • 24/7 Access',
        icon: 'book-open',
      },
      {
        userId: studentUser.id,
        targetType: 'BUILDING',
        targetId: createdBuildings['CSE'].id,
        title: 'Computer Science Block',
        subtitle: 'AI & Distributed Systems Labs',
        icon: 'cpu',
      },
      {
        userId: studentUser.id,
        targetType: 'FACILITY',
        targetId: 'byte-brew-cafe',
        title: 'Byte & Brew Cyber Café',
        subtitle: 'CSE 1F • Artisan Coffee',
        icon: 'coffee',
      },
    ],
  });

  await prisma.navigationHistory.createMany({
    data: [
      {
        userId: studentUser.id,
        originName: 'Main Campus South Gate',
        originLat: BASE_LAT - 0.0030,
        originLng: BASE_LNG - 0.0005,
        destName: 'Computer Science Block',
        destLat: BASE_LAT + 0.0018,
        destLng: BASE_LNG - 0.0015,
        distanceMeters: 480,
        durationSeconds: 360,
        mode: 'AR',
      },
      {
        userId: studentUser.id,
        originName: 'CSE Building',
        originLat: BASE_LAT + 0.0018,
        originLng: BASE_LNG - 0.0015,
        destName: 'Central University Library',
        destLat: BASE_LAT + 0.0005,
        destLng: BASE_LNG + 0.0008,
        distanceMeters: 310,
        durationSeconds: 240,
        mode: '3D',
      },
      {
        userId: studentUser.id,
        originName: 'Central Fountain',
        originLat: BASE_LAT,
        originLng: BASE_LNG,
        destName: 'Student Center & Food Court',
        destLat: BASE_LAT - 0.0002,
        destLng: BASE_LNG - 0.0018,
        distanceMeters: 220,
        durationSeconds: 170,
        mode: '2D',
      },
    ],
  });

  console.log('⭐ Seeded favorites & navigation history.');
  console.log('✅ CampusLens Database Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
