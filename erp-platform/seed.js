const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const tenantId = 'default-tenant';
  let tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    tenant = await prisma.tenant.create({ data: { id: tenantId, name: 'Default Tenant' } });
  }

  const email = '12832779'; // User's requested real ID
  const hash = bcrypt.hashSync('@Lorella2023@', 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hash, role: 'SUPERADMIN' },
    create: {
      tenantId: tenant.id,
      email,
      name: 'Amy Uzcategui',
      password: hash,
      role: 'SUPERADMIN',
    },
  });
  console.log('Real Superadmin created:', user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
