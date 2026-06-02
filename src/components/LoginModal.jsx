import { useState } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Graceful fallback if Firebase Web API Key is not configured
      if (!import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'your-api-key') {
        console.warn("Using Mock Email Auth because VITE_FIREBASE_API_KEY is not configured.");
        setTimeout(() => {
          let role = 'user';
          if (email === 'admin@mangobite.com') role = 'admin';
          if (email === 'partner@mangobite.com') role = 'partner';
          onLogin({
            uid: 'mock-user-123',
            name: mode === 'signup' ? (fullName || 'New User') : 'Demo User',
            email: email,
            profilePic: profilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80',
            role: role
          });
          setIsLoading(false);
        }, 1000);
        return;
      }

      let userCredential;
      if (mode === 'signup') {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: fullName || 'New Member',
          photoURL: profilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'
        });
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      const user = userCredential.user;
      
      // Determine mock role (in a real app, this would come from a database or custom claims)
      let role = 'user';
      if (email === 'admin@mangobite.com' || email === 'irfanshaikh80149@gmail.com') role = 'admin';
      if (email === 'partner@mangobite.com') role = 'partner';

      const syncRes = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: user.displayName || 'User', profilePic: user.photoURL, role: role })
      });
      const dbUser = await syncRes.json();

      onLogin({
        uid: user.uid,
        id: dbUser.user_id, // Important: Real MySQL ID
        name: user.displayName || 'User',
        email: user.email,
        profilePic: user.photoURL,
        role: dbUser.role || role
      });
      
    } catch (err) {
      console.error("Auth error:", err);
      // Simplify Firebase error messages
      const msg = err.message.replace('Firebase: ', '').split(' (auth/')[0];
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setIsLoading(true);
    try {
      // Graceful fallback if Firebase Web API Key is not configured
      if (!import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'your-api-key') {
        console.warn("Using Mock Google Auth because VITE_FIREBASE_API_KEY is not configured.");
        setTimeout(() => {
          onLogin({
            uid: 'mock-google-123',
            name: 'Demo Google User',
            email: 'demo@google.com',
            profilePic: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80',
            role: 'user'
          });
          setIsLoading(false);
        }, 1000);
        return;
      }

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Determine mock role
      let role = 'user';
      if (user.email === 'admin@mangobite.com' || user.email === 'irfanshaikh80149@gmail.com') role = 'admin';
      if (user.email === 'partner@mangobite.com') role = 'partner';

      const syncRes = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: user.displayName || 'Google User', profilePic: user.photoURL, role: role })
      });
      const dbUser = await syncRes.json();

      onLogin({
        uid: user.uid,
        id: dbUser.user_id, // Important: Real MySQL ID
        name: user.displayName || 'Google User',
        email: user.email,
        profilePic: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80',
        role: dbUser.role || role
      });
    } catch (err) {
      console.error("Google Auth error:", err);
      setError("Google sign-in failed or was cancelled.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div 
        className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm transition-opacity duration-500"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="bg-white dark:bg-[#121212] rounded-xl w-full max-w-[400px] relative shadow-2xl overflow-hidden transform transition-all border border-gray-100 dark:border-white/5 animate-in zoom-in-95 fade-in duration-300">
        
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-mango-500"></div>

        {/* Content Section */}
        <div className="p-6 pt-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-mango-50 dark:bg-mango-950/30 rounded-lg flex items-center justify-center border border-mango-100 dark:border-mango-900/50">
                <img src="/icon.png" alt="" className="w-5 h-5 object-contain" />
              </div>
              <h1 className="text-lg font-black tracking-tight text-gray-900 dark:text-white leading-none">MangoBite</h1>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Tab Selection */}
          <div className="flex bg-gray-50 dark:bg-white/5 p-1 rounded-lg mb-6 border border-gray-100 dark:border-white/5">
            <button 
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 rounded-md text-xs font-bold transition-all duration-300 ${mode === 'login' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-500'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-2 rounded-md text-xs font-bold transition-all duration-300 ${mode === 'signup' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-500'}`}
            >
              Join Now
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-1.5">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 leading-relaxed">
              {mode === 'login' 
                ? 'Enter your credentials to securely access your account.' 
                : `Join us to start ordering and tracking your food.`}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-xs font-bold text-red-600 text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            
            {mode === 'signup' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:bg-white dark:focus:bg-transparent focus:outline-none focus:border-mango-500 transition-all text-sm font-bold text-gray-900 dark:text-white" 
                    placeholder="John Doe" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Profile Picture URL (Optional)</label>
                  <input 
                    type="url" 
                    value={profilePic}
                    onChange={(e) => setProfilePic(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:bg-white dark:focus:bg-transparent focus:outline-none focus:border-mango-500 transition-all text-sm font-bold text-gray-900 dark:text-white" 
                    placeholder="https://..." 
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:bg-white dark:focus:bg-transparent focus:outline-none focus:border-mango-500 transition-all text-sm font-bold text-gray-900 dark:text-white"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:bg-white dark:focus:bg-transparent focus:outline-none focus:border-mango-500 transition-all text-sm font-bold text-gray-900 dark:text-white"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gray-900 dark:bg-mango-600 hover:bg-black dark:hover:bg-mango-500 text-white font-black py-3.5 rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 group text-sm"
            >
              {isLoading ? 'Processing...' : (mode === 'signup' ? 'Create Account' : 'Sign In')}
              {!isLoading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-white/5"></div></div>
              <div className="relative flex justify-center text-[9px] uppercase font-black tracking-[0.2em] text-gray-400"><span className="bg-white dark:bg-[#121212] px-4">Or continue with</span></div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-3 active:scale-[0.98] text-xs disabled:opacity-70"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </form>

          <footer className="mt-8 pt-6 border-t border-gray-50 dark:border-white/5 text-center">
            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em] leading-relaxed">
              By proceeding, you agree to our <br />
              <a href="#" className="text-gray-900 dark:text-gray-300 hover:text-mango-500 underline underline-offset-4">Legal Policy</a> & <a href="#" className="text-gray-900 dark:text-gray-300 hover:text-mango-500 underline underline-offset-4">Terms</a>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
