const fs = require('fs');
let file = fs.readFileSync('apps/api/src/inventory/inventory.service.ts', 'utf8');

file = file.replace(/async getCategories\(tenantId: string\) \{\s+const cats = await this\.prisma\.category\.findMany\(\{\s+where: \{ tenantId \},\s+orderBy: \{ name: 'asc' \},\s+\}\);\s+\}/,
\sync getCategories(tenantId: string) {
    const cats = await this.prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
    if (process.env.VENTECH_DESKTOP === '1') {
      return cats.map(c => {
        if (typeof c.attributes === 'string') {
          try { c.attributes = JSON.parse(c.attributes); } catch {}
        }
        return c;
      });
    }
    return cats;
  }\);

fs.writeFileSync('apps/api/src/inventory/inventory.service.ts', file, 'utf8');
