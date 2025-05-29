import PhotoPoetForm from '@/components/PhotoPoetForm';
import { MountainIcon } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MountainIcon className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">
              PhotoPoet
            </h1>
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 md:px-6 py-8">
        <PhotoPoetForm />
      </main>
      <footer className="bg-card shadow-sm py-4 mt-auto">
        <div className="container mx-auto px-4 md:px-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PhotoPoet. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
