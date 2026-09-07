import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const tenantId = 'default-tenant';
  let tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    tenant = await prisma.tenant.create({ data: { id: tenantId, name: 'Default Tenant' } });
  }

  const email = 'v-11111111';
  const plainPassword = '@Lorella1923@'; // user password
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword, role: 'SUPERADMIN' },
    create: {
      tenantId: tenant.id,
      email,
      name: 'Dueño del Sistema (Real)',
      password: hashedPassword,
      role: 'SUPERADMIN',
    },
  });

  console.log('Superadmin user created or updated:', user.email);
}

main().finally(() => prisma.$disconnect());
