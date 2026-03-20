/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Music, 
  Home, 
  Library, 
  Plus, 
  Heart, 
  MoreHorizontal,
  LayoutGrid,
  List,
  ChevronRight,
  ChevronLeft,
  Settings,
  User,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactPlayer from 'react-player';
import { GoogleGenAI } from "@google/genai";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  url: string;
  duration?: string;
}

const INITIAL_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Midnight City',
    artist: 'M83',
    album: 'Hurry Up, We\'re Dreaming',
    cover: 'https://picsum.photos/seed/m83/400/400',
    url: 'https://www.youtube.com/watch?v=dX3k_UAnyf4',
    duration: '4:03'
  },
  {
    id: '2',
    title: 'Starboy',
    artist: 'The Weeknd',
    album: 'Starboy',
    cover: 'https://picsum.photos/seed/weeknd/400/400',
    url: 'https://www.youtube.com/watch?v=34Na4j8AVgA',
    duration: '3:50'
  },
  {
    id: '3',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    cover: 'https://picsum.photos/seed/blinding/400/400',
    url: 'https://www.youtube.com/watch?v=fHI8X4OXluQ',
    duration: '3:20'
  }
];

const Player = ReactPlayer as any;

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTrack, setCurrentTrack] = useState<Track | null>(INITIAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  
  const playerRef = useRef<any>(null);

  // Gemini Search Integration
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find 5 popular songs matching "${searchQuery}". Return ONLY a JSON array of objects with fields: id (string), title, artist, album, cover (use a high quality placeholder from picsum.photos/seed/{artist}/400/400), url (a valid YouTube link for the song), duration (e.g. "3:45").`,
        config: {
          responseMimeType: "application/json",
        }
      });

      const results = JSON.parse(response.text || '[]');
      setSearchResults(results);
      setActiveTab('search');
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
    setProgress(state.played * 100);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTo = parseFloat(e.target.value) / 100;
    setProgress(parseFloat(e.target.value));
    playerRef.current?.seekTo(seekTo);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 flex flex-col bg-black/50 backdrop-blur-xl">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center border border-white/10">
              <img 
                src="https://i.postimg.cc/D0djZ09h/Black-Yellow-Icon-Modern-Brand-Music-Logo.png" 
                alt="Sansound Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tighter">SANSOUND</h1>
          </div>

          <nav className="space-y-1">
            <SidebarItem 
              icon={<Home size={20} />} 
              label="Home" 
              active={activeTab === 'home'} 
              onClick={() => setActiveTab('home')} 
            />
            <SidebarItem 
              icon={<Search size={20} />} 
              label="Search" 
              active={activeTab === 'search'} 
              onClick={() => setActiveTab('search')} 
            />
            <SidebarItem 
              icon={<Library size={20} />} 
              label="Your Library" 
              active={activeTab === 'library'} 
              onClick={() => setActiveTab('library')} 
            />
          </nav>

          <div className="mt-8">
            <h2 className="px-3 text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Playlists</h2>
            <nav className="space-y-1">
              <SidebarItem icon={<Plus size={20} />} label="Create Playlist" />
              <SidebarItem icon={<Heart size={20} />} label="Liked Songs" />
            </nav>
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">Guest User</p>
              <p className="text-xs text-white/40 truncate">Premium Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header / Search Bar */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button className="p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button className="p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search for songs, artists..." 
                className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 w-80 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-white/60 hover:text-white transition-colors">Upgrade</button>
            <div className="h-4 w-[1px] bg-white/10" />
            <Settings size={20} className="text-white/60 hover:text-white cursor-pointer transition-colors" />
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div 
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
              >
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">Jump back in</h2>
                    <button className="text-sm text-white/40 hover:text-white transition-colors">Show all</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {INITIAL_TRACKS.map((track) => (
                      <TrackCard key={track.id} track={track} onPlay={() => playTrack(track)} />
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">Global Trending</h2>
                    <button className="text-sm text-white/40 hover:text-white transition-colors">Show all</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {INITIAL_TRACKS.slice(0, 4).map((track, i) => (
                      <div 
                        key={i} 
                        className="group flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer"
                        onClick={() => playTrack(track)}
                      >
                        <div className="relative w-16 h-16 rounded-md overflow-hidden">
                          <img src={track.cover} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Play size={24} fill="white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{track.title}</h3>
                          <p className="text-sm text-white/40">{track.artist}</p>
                        </div>
                        <div className="text-sm text-white/40 group-hover:text-white transition-colors">
                          {track.duration}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'search' && (
              <motion.div 
                key="search"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {isSearching ? 'Searching...' : searchQuery ? `Results for "${searchQuery}"` : 'Search for music'}
                  </h2>
                </div>

                {isSearching ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full animate-spin" />
                    <p className="text-white/40 animate-pulse">Scanning the globe for your music...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {searchResults.map((track) => (
                      <TrackCard key={track.id} track={track} onPlay={() => playTrack(track)} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-white/20">
                    <Search size={64} strokeWidth={1} className="mb-4" />
                    <p>Search for any song in the world</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hidden Player Engine */}
        {currentTrack && (
          <div className="hidden">
            <Player
              ref={playerRef}
              url={currentTrack.url}
              playing={isPlaying}
              volume={volume}
              onProgress={handleProgress as any}
              onDuration={(d: number) => setDuration(d)}
              onEnded={() => setIsPlaying(false)}
            />
          </div>
        )}

        {/* Player Bar */}
        <footer className="h-24 bg-black/80 backdrop-blur-2xl border-t border-white/10 px-6 flex items-center justify-between z-20">
          {/* Track Info */}
          <div className="flex items-center gap-4 w-1/3">
            {currentTrack ? (
              <>
                <div className="w-14 h-14 rounded-md overflow-hidden bg-white/5 flex-shrink-0">
                  <img src={currentTrack.cover} alt={currentTrack.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-semibold text-sm truncate">{currentTrack.title}</h4>
                  <p className="text-xs text-white/40 truncate hover:text-white transition-colors cursor-pointer">{currentTrack.artist}</p>
                </div>
                <button className="text-white/40 hover:text-white transition-colors">
                  <Heart size={18} />
                </button>
              </>
            ) : (
              <div className="text-white/20 text-sm italic">No track selected</div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-2 w-1/3">
            <div className="flex items-center gap-6">
              <button className="text-white/40 hover:text-white transition-colors">
                <SkipBack size={20} fill="currentColor" />
              </button>
              <button 
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
              >
                {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
              </button>
              <button className="text-white/40 hover:text-white transition-colors">
                <SkipForward size={20} fill="currentColor" />
              </button>
            </div>
            <div className="flex items-center gap-3 w-full max-w-md">
              <span className="text-[10px] text-white/40 font-mono w-8 text-right">
                {formatTime(playerRef.current?.getCurrentTime() || 0)}
              </span>
              <div className="relative flex-1 h-1 group">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={progress}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="absolute inset-0 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white group-hover:bg-white transition-colors" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-white/40 font-mono w-8">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume & Extra */}
          <div className="flex items-center justify-end gap-4 w-1/3">
            <div className="flex items-center gap-2 group">
              <Volume2 size={18} className="text-white/40 group-hover:text-white transition-colors" />
              <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden relative">
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div 
                  className="h-full bg-white/60 group-hover:bg-white transition-colors" 
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
            </div>
            <MoreHorizontal size={20} className="text-white/40 hover:text-white cursor-pointer transition-colors" />
          </div>
        </footer>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-3 py-2 rounded-md cursor-pointer transition-all duration-200 group",
        active ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
      )}
    >
      <span className={cn("transition-transform duration-200", active ? "scale-110" : "group-hover:scale-110")}>
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function TrackCard({ track, onPlay }: { track: Track, onPlay: () => void }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="group bg-white/[0.02] border border-white/5 p-4 rounded-xl hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"
      onClick={onPlay}
    >
      <div className="relative aspect-square rounded-lg overflow-hidden mb-4 shadow-2xl shadow-black">
        <img 
          src={track.cover} 
          alt={track.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl"
          >
            <Play size={24} fill="black" className="ml-1 text-black" />
          </motion.div>
        </div>
      </div>
      <h3 className="font-bold text-sm truncate mb-1">{track.title}</h3>
      <p className="text-xs text-white/40 truncate">{track.artist}</p>
    </motion.div>
  );
}
