import PhotoPoemForm from '@/components/PhotoPoemForm';
import { Camera } from 'lucide-react'; // Changed from MountainIcon

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="bg-card shadow-md sticky top-0 z-50"> {/* Increased shadow slightly */}
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3"> {/* Increased gap slightly */}
            <Camera className="h-8 w-8 text-primary" /> {/* Using Camera icon */}
            <h1 className="text-2xl font-semibold text-foreground">
              PhotoPoem
            </h1>
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 md:px-6 py-8 md:py-12"> {/* Added md:py-12 for more vertical space on larger screens */}
        <PhotoPoemForm />
      </main>
      <footer className="bg-card shadow-sm py-6 mt-auto"> {/* Increased py and shadow */}
        <div className="container mx-auto px-4 md:px-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PhotoPoem. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
