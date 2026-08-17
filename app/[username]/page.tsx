import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ExternalLink, Share2 } from 'lucide-react';

// Tipe data dummy (sesuaikan dengan tabel database Anda nantinya)
interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  isFeatured?: boolean;
}

interface UserProfile {
  username: string;
  fullName: string;
  bio: string;
  avatarUrl: string;
  links: LinkItem[];
}

// Simulasi fetching data dari Database (misal: Supabase / Prisma)
async function getProfileData(username: string): Promise<UserProfile | null> {
  // Ganti fungsi ini dengan query database asli Anda, contoh:
  // const user = await db.user.findUnique({ where: { username } })

  if (username !== 'budi') {
    return null; // Simulasi 404 jika username tidak ditemukan
  }

  return {
    username: 'budi',
    fullName: 'Budi Setiawan',
    bio: 'Digital Creator & Web Developer. Berbagi tips seputar tech dan produktivitas ✨',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    links: [
      {
        id: '1',
        title: '🌐 Website Portofolio',
        url: 'https://example.com',
        isFeatured: true,
      },
      {
        id: '2',
        title: '🎥 Channel YouTube',
        url: 'https://youtube.com',
      },
      {
        id: '3',
        title: '📸 Instagram Profile',
        url: 'https://instagram.com',
      },
      {
        id: '4',
        title: '💼 LinkedIn',
        url: 'https://linkedin.com',
      },
    ],
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfileData(username);

  // Jika username tidak ditemukan, alihkan ke halaman 404
  if (!profile) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col items-center px-4 py-12">
      {/* Container Utama */}
      <div className="w-full max-w-md flex flex-col items-center">
        
        {/* Header Profil */}
        <div className="relative mb-4">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-500 shadow-xl">
            <Image
              src={profile.avatarUrl}
              alt={profile.fullName}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Informasi Pengguna */}
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">
          {profile.fullName}
        </h1>
        <p className="text-sm text-indigo-400 font-medium mb-3">
          @{profile.username}
        </p>
        <p className="text-xs text-slate-400 text-center max-w-xs leading-relaxed mb-8">
          {profile.bio}
        </p>

        {/* Daftar Tautan (Links List) */}
        <div className="w-full space-y-4">
          {profile.links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative flex items-center justify-between w-full px-5 py-4 rounded-xl font-medium transition-all duration-200 shadow-lg ${
                link.isFeatured
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-95 hover:scale-[1.02] ring-2 ring-indigo-400/30'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/50 hover:border-slate-500 hover:scale-[1.01]'
              }`}
            >
              <span className="text-sm font-semibold truncate pr-4">
                {link.title}
              </span>
              <ExternalLink className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </a>
          ))}
        </div>

        {/* Footer Brand Ringkas */}
        <footer className="mt-16 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-400 transition-colors"
          >
            <span>Powered by</span>
            <span className="font-bold text-indigo-400">YourApp</span>
          </a>
        </footer>

      </div>
    </main>
  );
}