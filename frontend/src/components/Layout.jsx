import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Avatar from './Avatar';
import Button from './Button';
import { signOut } from '../features/auth/authSlice';
import { toggleSidebar, closeSidebar } from '../features/ui/uiSlice';
import { useSocket } from '../contexts/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  const { sidebarOpen } = useSelector((state) => state.ui);
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useSocket() || { notifications: [], unreadCount: 0 };

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  // Locked to Dark Mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  const handleLogout = async () => {
    await dispatch(signOut());
    setDropdownOpen(false);
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const toggleVoiceSearch = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Your browser does not support Voice Search.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'hi-IN'; // Set to Hindi (India) which also understands English words
    
    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      if (transcript.trim()) {
        navigate(`/search?query=${encodeURIComponent(transcript.trim())}`);
      }
    };
    
    recognition.onerror = (event) => {
      console.error("Voice search error:", event.error);
      if (event.error === 'not-allowed') {
        toast.error("Microphone permission denied.");
      } else if (event.error === 'no-speech') {
        toast.error("No speech detected.");
      } else {
        toast.error(`Voice search error: ${event.error}`);
      }
      setIsListening(false);
    };
    
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-6 rounded-xl px-4 py-3 text-sm transition duration-150 ${
      isActive 
        ? 'bg-yt-bg-hover-light dark:bg-yt-bg-hover-dark text-yt-text-light dark:text-yt-text-dark font-medium' 
        : 'text-yt-text-light/85 dark:text-yt-text-dark/85 hover:bg-yt-bg-hover-light dark:hover:bg-yt-bg-hover-dark hover:text-yt-text-light dark:hover:text-yt-text-dark'
    }`;

  const railLinkClass = ({ isActive }) =>
    `flex flex-col items-center justify-center gap-1 rounded-xl py-3.5 text-[10px] transition duration-150 ${
      isActive 
        ? 'text-yt-text-light dark:text-yt-text-dark font-semibold' 
        : 'text-yt-text-light/80 dark:text-yt-text-dark/85 hover:bg-yt-bg-hover-light dark:hover:bg-yt-bg-hover-dark'
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `flex flex-col items-center gap-1 py-1 text-[10px] font-medium transition ${
      isActive ? 'text-yt-red' : 'text-yt-text-light/70 dark:text-yt-text-dark/70'
    }`;

  return (
    <div className="min-h-screen bg-yt-bg-light dark:bg-yt-bg-dark text-yt-text-light dark:text-yt-text-dark">
      
      {/* 1. TOP HEADER (Fixed 56px) */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-yt-border-light dark:border-yt-border-dark bg-yt-bg-light dark:bg-yt-bg-dark px-4 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => dispatch(toggleSidebar())}
            className="rounded-full p-2 hover:bg-yt-bg-hover-light dark:hover:bg-yt-bg-hover-dark text-yt-text-light dark:text-yt-text-dark active:bg-neutral-300 dark:active:bg-neutral-800 transition"
            aria-label="Toggle navigation drawer"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <NavLink to="/" className="flex items-center gap-1 font-display text-xl font-bold tracking-tighter text-yt-text-light dark:text-yt-text-dark">
            <span className="text-yt-red text-2xl font-black">▶</span>
            <span>VidTube</span>
          </NavLink>
        </div>

        {/* Center Section: Search Bar */}
        <div className="flex-1 max-w-2xl flex items-center gap-4 mx-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center bg-yt-bg-light dark:bg-yt-bg-dark">
            <div className="flex flex-1 items-center border border-yt-border-light dark:border-yt-border-dark rounded-l-full px-4 py-1.5 bg-neutral-50 dark:bg-neutral-900 focus-within:border-blue-500 focus-within:bg-yt-bg-light dark:focus-within:bg-yt-bg-dark transition">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-yt-text-light dark:text-yt-text-dark outline-none placeholder:text-yt-text-secondary-light dark:placeholder:text-yt-text-secondary-dark"
              />
            </div>
            <button 
              type="submit" 
              className="border-y border-r border-yt-border-light dark:border-yt-border-dark rounded-r-full bg-neutral-100 dark:bg-neutral-800 px-6 py-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
            >
              <svg className="h-4 w-4 text-yt-text-light dark:text-yt-text-dark" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Voice Search Button */}
          <button 
            type="button"
            onClick={toggleVoiceSearch}
            className={`rounded-full p-2 text-yt-text-light dark:text-yt-text-dark hidden md:block transition ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
            title="Search with your voice"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 14H5c0 3.42 2.72 6.23 6 6.72V22h2v-1.28c3.28-.49 6-3.3 6-6.72h-1.7z"/>
            </svg>
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">

          {user ? (
            <>
              {/* Create drop-down */}
              <div className="relative">
                <button 
                  onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
                  className="rounded-full p-2 hover:bg-yt-bg-hover-light dark:hover:bg-yt-bg-hover-dark text-yt-text-light dark:text-yt-text-dark transition"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                {createDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setCreateDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 z-50 w-44 rounded-xl border border-yt-border-light dark:border-yt-border-dark bg-yt-bg-light dark:bg-yt-bg-dark py-1.5 shadow-xl animate-fade-in">
                      <button 
                        onClick={() => {
                          setCreateDropdownOpen(false);
                          navigate('/upload');
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-yt-bg-hover-light dark:hover:bg-yt-bg-hover-dark transition"
                      >
                        Upload Video
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative rounded-full p-2 hover:bg-yt-bg-hover-light dark:hover:bg-yt-bg-hover-dark text-yt-text-light dark:text-yt-text-dark transition"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-yt-red text-[9px] font-semibold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 mt-2 z-50 w-80 rounded-xl border border-yt-border-light dark:border-yt-border-dark bg-yt-bg-light dark:bg-yt-bg-dark py-3 shadow-xl animate-fade-in max-h-[80vh] flex flex-col">
                      <div className="flex items-center justify-between px-4 pb-2 border-b border-yt-border-light dark:border-yt-border-dark">
                        <h4 className="font-bold text-yt-text-light dark:text-yt-text-dark">Notifications</h4>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-xs text-blue-500 hover:underline">Mark all read</button>
                        )}
                      </div>
                      <div className="overflow-y-auto overflow-x-hidden flex-1 scrollbar-thin">
                        {(!notifications || notifications.length === 0) ? (
                          <p className="text-yt-text-secondary-light dark:text-yt-text-secondary-dark p-4 text-center text-sm">No new notifications. You are all caught up!</p>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif._id}
                              onClick={() => {
                                if (!notif.isRead) markAsRead(notif._id);
                                setNotifOpen(false);
                                navigate(`/watch/${notif.video?._id || notif.video}`);
                              }}
                              className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition ${!notif.isRead ? 'bg-blue-500/5 dark:bg-blue-500/10' : ''}`}
                            >
                              <Avatar src={notif.sender?.avatar} alt={notif.sender?.username} size="sm" />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!notif.isRead ? 'font-bold text-yt-text-light dark:text-yt-text-dark' : 'text-yt-text-secondary-light dark:text-yt-text-secondary-dark'} leading-tight mb-1`}>
                                  {notif.message}
                                </p>
                                <span className="text-[10px] text-yt-text-secondary-light dark:text-yt-text-secondary-dark">
                                  {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : 'Just now'}
                                </span>
                              </div>
                              <div className="w-12 h-8 shrink-0 rounded overflow-hidden">
                                <img src={notif.video?.thumbnail} alt="" className="w-full h-full object-cover" />
                              </div>
                              {!notif.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 self-center"></div>}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User Avatar & Dropdown */}
              <div className="relative">
                <button onClick={toggleDropdown} className="flex items-center focus:outline-none ml-1">
                  <Avatar src={user.avatar} alt={user.fullname || user.username} size="sm" />
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 z-50 w-56 rounded-xl border border-yt-border-light dark:border-yt-border-dark bg-yt-bg-light dark:bg-yt-bg-dark py-2 shadow-2xl animate-fade-in">
                      <div className="px-4 py-2.5 border-b border-yt-border-light dark:border-yt-border-dark mb-1">
                        <p className="text-sm font-bold truncate text-yt-text-light dark:text-yt-text-dark">{user.fullname}</p>
                        <p className="text-xs text-yt-text-secondary-light dark:text-yt-text-secondary-dark truncate">@{user.username}</p>
                      </div>
                      <NavLink 
                        to={`/channel/${user.username}`} 
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-yt-bg-hover-light dark:hover:bg-yt-bg-hover-dark transition"
                      >
                        Your Channel
                      </NavLink>
                      <NavLink 
                        to="/settings" 
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-yt-bg-hover-light dark:hover:bg-yt-bg-hover-dark transition"
                      >
                        Settings
                      </NavLink>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition text-left"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 rounded-full border border-blue-500 dark:border-blue-400 hover:bg-blue-500/10 text-blue-500 dark:text-blue-400 px-4 py-1.5 text-sm font-semibold tracking-wide transition ml-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Sign in
            </button>
          )}
        </div>
      </header>

      {/* 2. MAIN GRID LAYOUT */}
      <div className="pt-14 flex min-h-[calc(100vh-56px)]">
        
        {/* Left Sidebar (Desktop Expanded Sidebar OR Collapsed Icon Rail) */}
        {/* 2.1 Expanded Sidebar Drawer */}
        <aside className={`hidden lg:block shrink-0 ${sidebarOpen ? 'w-[240px]' : 'w-[72px]'} transition-all duration-150`}>
          <div className="fixed top-14 bottom-0 left-0 overflow-y-auto scrollbar-none py-3 px-2 flex flex-col justify-between bg-yt-bg-light dark:bg-yt-bg-dark border-r border-yt-border-light dark:border-yt-border-dark select-none" style={{ width: sidebarOpen ? '240px' : '72px' }}>
            {sidebarOpen ? (
              <div className="space-y-4">
                <div className="space-y-0.5">
                  <NavLink to="/" className={linkClass}>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
                    </svg>
                    Home
                  </NavLink>
                  <NavLink to="/playlists" className={linkClass}>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Playlists
                  </NavLink>
                </div>
                
                <hr className="border-yt-border-light dark:border-yt-border-dark mx-2" />

                <div className="space-y-0.5">
                  <h3 className="px-4 text-xs font-bold uppercase tracking-wider text-yt-text-secondary-light dark:text-yt-text-secondary-dark mb-2">You</h3>
                  <NavLink to="/history" className={linkClass}>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    History
                  </NavLink>
                  <NavLink to="/liked-videos" className={linkClass}>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Liked Videos
                  </NavLink>
                  {user && (
                    <NavLink to={`/channel/${user.username}`} className={linkClass}>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Your Videos
                    </NavLink>
                  )}
                  <NavLink to="/settings" className={linkClass}>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </NavLink>
                </div>
              </div>
            ) : (
              /* 2.2 Collapsed Sidebar Rail */
              <div className="space-y-2">
                <NavLink to="/" className={railLinkClass}>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
                  </svg>
                  <span>Home</span>
                </NavLink>
                <NavLink to="/playlists" className={railLinkClass}>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Playlists</span>
                </NavLink>
                <NavLink to="/history" className={railLinkClass}>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>History</span>
                </NavLink>
              </div>
            )}
          </div>
        </aside>

        {/* 2.3 Mobile Sidebar Drawer Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 transition-opacity"
              onClick={() => dispatch(closeSidebar())}
            />
            {/* Drawer Panel */}
            <div className="absolute inset-y-0 left-0 w-60 bg-yt-bg-light dark:bg-yt-bg-dark p-3 space-y-4 shadow-2xl flex flex-col border-r border-yt-border-light dark:border-yt-border-dark animate-slide-right">
              <div className="flex items-center gap-4 pb-2 border-b border-yt-border-light dark:border-yt-border-dark mb-2">
                <button onClick={() => dispatch(closeSidebar())} className="rounded-full p-2 hover:bg-yt-bg-hover-light dark:hover:bg-yt-bg-hover-dark text-yt-text-light dark:text-yt-text-dark">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <span className="font-display text-lg font-bold text-yt-text-light dark:text-yt-text-dark"><span className="text-yt-red">▶</span>VidTube</span>
              </div>
              <div className="space-y-0.5">
                <NavLink to="/" onClick={() => dispatch(closeSidebar())} className={linkClass}>Home</NavLink>
                <NavLink to="/playlists" onClick={() => dispatch(closeSidebar())} className={linkClass}>Playlists</NavLink>
                <NavLink to="/history" onClick={() => dispatch(closeSidebar())} className={linkClass}>History</NavLink>
                <NavLink to="/liked-videos" onClick={() => dispatch(closeSidebar())} className={linkClass}>Liked Videos</NavLink>
                <NavLink to="/settings" onClick={() => dispatch(closeSidebar())} className={linkClass}>Settings</NavLink>
              </div>
            </div>
          </div>
        )}

        {/* 3. PAGE VIEW CONTENT */}
        <main className={`flex-1 min-w-0 px-4 py-6 md:px-6 lg:px-8 transition-all duration-150 ${sidebarOpen ? 'lg:ml-[240px]' : 'lg:ml-[72px]'}`}>
          <Outlet />
        </main>
      </div>

      {/* 4. MOBILE BOTTOM APP NAV BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-yt-border-light dark:border-yt-border-dark bg-yt-bg-light dark:bg-yt-bg-dark py-1 px-2 flex justify-around lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <NavLink to="/" className={mobileLinkClass}>
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
          </svg>
          Home
        </NavLink>
        <NavLink to="/upload" className={mobileLinkClass}>
          <svg className="h-6 w-6 text-yt-text-light dark:text-yt-text-dark" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Create
        </NavLink>
        <NavLink to="/playlists" className={mobileLinkClass}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Playlists
        </NavLink>
        {user ? (
          <NavLink to={`/channel/${user.username}`} className={mobileLinkClass}>
            <Avatar src={user.avatar} alt={user.fullname || user.username} size="sm" className="h-5 w-5" />
            You
          </NavLink>
        ) : (
          <NavLink to="/login" className={mobileLinkClass}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Sign In
          </NavLink>
        )}
      </nav>
    </div>
  );
}