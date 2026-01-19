// prisma/seed.ts
import 'dotenv/config'; // ← Agregar esta línea al inicio
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
  console.log('📍 Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')); // Log sin mostrar password

  let business = await prisma.business.findFirst();

  if (!business) {
    business = await prisma.business.create({
      data: {
        name: 'Demo Business',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Business created:', business.name);
  } else {
    console.log('ℹ️ Business already exists:', business.name);
  }

  const existingOwner = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
  });

  if (!existingOwner) {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const owner = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin',
        lastName: 'Owner',
        password: hashedPassword,
        role: UserRole.OWNER,
        businessId: business.id,
        active: true,
      },
    });

    console.log('✅ Owner user created!');
    console.log('📧 Email:', owner.email);
    console.log('🔑 Password: admin123');
    console.log('🆔 User ID:', owner.id);
    console.log('🏢 Business ID:', business.id);
  } else {
    console.log('ℹ️ Owner user already exists:', existingOwner.email);
  }

  console.log('\n🎉 Seed completed successfully!');
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