// prisma/seed.ts
import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');
  console.log('📍 Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));

  // ========== CREAR SUPER_ADMIN ==========
  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: 'superadmin@sppt.com' },
  });

  if (!existingSuperAdmin) {
    const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 10);

    await prisma.user.create({
      data: {
        email: 'superadmin@sppt.com',
        name: 'Super',
        lastName: 'Admin',
        password: superAdminPassword,
        role: UserRole.SUPER_ADMIN,
        active: true,
      },
    });
    console.log('✅ SUPER_ADMIN created: superadmin@sppt.com / SuperAdmin123!');
  } else {
    console.log('ℹ️ SUPER_ADMIN already exists');
  }

  // ========== CREAR OWNER SIN NEGOCIO ==========
  const existingOwnerWithoutBusiness = await prisma.user.findUnique({
    where: { email: 'owner@example.com' },
  });

  if (!existingOwnerWithoutBusiness) {
    const ownerPassword = await bcrypt.hash('owner123', 10);

    await prisma.user.create({
      data: {
        email: 'owner@example.com',
        name: 'John',
        lastName: 'Owner',
        password: ownerPassword,
        role: UserRole.OWNER,
        active: true,
      },
    });
    console.log('✅ OWNER (sin negocio) created: owner@example.com / owner123');
  } else {
    console.log('ℹ️ OWNER (sin negocio) already exists');
  }

  // ========== CREAR NEGOCIO DEMO ==========
  let demoBusiness = await prisma.business.findFirst({
    where: { name: 'Demo Business' },
  });

  if (!demoBusiness) {
    demoBusiness = await prisma.business.create({
      data: {
        name: 'Demo Business',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Demo Business created');
  } else {
    console.log('ℹ️ Demo Business already exists');
  }

  // ========== CREAR OWNER CON NEGOCIO ==========
  const existingOwnerWithBusiness = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
  });

  if (!existingOwnerWithBusiness) {
    const ownerPassword = await bcrypt.hash('admin123', 10);

    await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin',
        lastName: 'Owner',
        password: ownerPassword,
        role: UserRole.OWNER,
        businessId: demoBusiness.id,
        active: true,
      },
    });
    console.log('✅ OWNER (con negocio) created: admin@example.com / admin123');
  } else {
    console.log('ℹ️ OWNER (con negocio) already exists');
  }

  // ========== CREAR CO-OWNER ==========
  const existingCoOwner = await prisma.user.findUnique({
    where: { email: 'coowner@example.com' },
  });

  if (!existingCoOwner) {
    const coOwnerPassword = await bcrypt.hash('coowner123', 10);

    await prisma.user.create({
      data: {
        email: 'coowner@example.com',
        name: 'Jane',
        lastName: 'CoOwner',
        password: coOwnerPassword,
        role: UserRole.CO_OWNER,
        businessId: demoBusiness.id,
        active: true,
      },
    });
    console.log('✅ CO_OWNER created: coowner@example.com / coowner123');
  } else {
    console.log('ℹ️ CO_OWNER already exists');
  }

  // ========== CREAR EMPLOYEE ==========
  const existingEmployee = await prisma.user.findUnique({
    where: { email: 'employee@example.com' },
  });

  if (!existingEmployee) {
    const employeePassword = await bcrypt.hash('employee123', 10);

    await prisma.user.create({
      data: {
        email: 'employee@example.com',
        name: 'Mike',
        lastName: 'Employee',
        password: employeePassword,
        role: UserRole.EMPLOYEE,
        businessId: demoBusiness.id,
        active: true,
      },
    });
    console.log('✅ EMPLOYEE created: employee@example.com / employee123');
  } else {
    console.log('ℹ️ EMPLOYEE already exists');
  }

  console.log('\n🎉 Seed completed!');
  console.log('\n📋 Usuarios creados:');
  console.log('   🌟 SUPER_ADMIN: superadmin@sppt.com / SuperAdmin123!');
  console.log('   👑 OWNER (sin negocio): owner@example.com / owner123');
  console.log('   👑 OWNER (Demo Business): admin@example.com / admin123');
  console.log('   🤝 CO_OWNER (Demo Business): coowner@example.com / coowner123');
  console.log('   👤 EMPLOYEE (Demo Business): employee@example.com / employee123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });