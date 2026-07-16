const prisma = require('./prisma');
const logger = require('./logger');
const { hashPassword } = require('../utils/password');

// Mirrors config/DataInitializer.java's admin + departments seeding —
// idempotent (checks before inserting), runs on every startup.
//
// NOTE: the original also seeded 13 hostels x 2 blocks each. That's gone —
// this app now serves exactly one hostel (Hostel 10), whose two blocks are
// just the 'A'/'B' values of the Block enum, nothing left to seed. See
// docs/MIGRATION_NOTES.md "Hostel-10 scoping".

async function seedAdmin() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin_10@hostel.com' } });
  if (existing) return;

  await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin_10@hostel.com',
      password: await hashPassword('Admin_10@123'),
      role: 'ADMIN',
      phoneNumber: '9000000001',
      active: true,
      appEnabled: true,
    },
  });
  logger.info('✅ Admin seeded');
}

async function seedDepartments() {
  const count = await prisma.department.count();
  if (count > 0) {
    logger.info('⏭️  Departments already seeded, skipping');
    return;
  }

  const departments = [
    ['Electrical', 'Handles all electrical issues in the hostel'],
    ['WiFi & Internet', 'Handles internet and WiFi maintenance'],
    ['Computer & Hardware', 'Handles computer and hardware support'],
    ['AC & HVAC', 'Handles air conditioning and cooling issues'],
    ['Building & Civil', 'Handles building, seepage and civil issues'],
    ['Telephone', 'Handles telephone line issues'],
  ];

  await prisma.department.createMany({
    data: departments.map(([name, description]) => ({ name, description, active: true })),
  });

  logger.info('✅ Departments seeded');
}

async function runSeed() {
  await seedAdmin();
  await seedDepartments();
}

module.exports = { runSeed };
