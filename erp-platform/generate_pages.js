const fs = require('fs');
const path = require('path');

const dirs = ['inventory', 'customers', 'analytics', 'security', 'exchange'];
const content = `import Link from 'next/link';
import { ArrowLeft, Construction } from 'lucide-react';

export default function PlaceholderPage() {
  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center">
      <div className="glass-bevel p-12 max-w-lg w-full text-center">
        <div className="w-20 h-20 glass-icon mx-auto flex items-center justify-center mb-6 text-amber-500">
          <Construction className="w-10 h-10 drop-shadow-lg" />
        </div>
        <h1 className="text-3xl font-black uppercase text-engraved-light mb-4 tracking-wider">Próximamente</h1>
        <p className="text-engraved font-bold mb-8">
          Este módulo está en fase de diseño e implementación.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 glass-bevel text-engraved-light font-bold hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
`;

dirs.forEach(dir => {
  const dirPath = path.join(__dirname, 'apps/web/app', dir);
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, 'page.tsx'), content, 'utf8');
});
console.log('Pages created successfully in UTF-8');
