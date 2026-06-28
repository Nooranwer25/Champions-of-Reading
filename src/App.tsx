import React, { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/AuthContext';
import { ThemeProvider } from './services/ThemeContext';
import { ToastProvider } from './services/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { motion, AnimatePresence } from 'motion/react';
import { playPageFlip } from './services/audioService';

const Home = lazy(() => import('./pages/Home'));
const Arena = lazy(() => import('./pages/Arena'));
const Submission = lazy(() => import('./pages/Submission'));
const Profile = lazy(() => import('./pages/Profile'));
const Oracle = lazy(() => import('./pages/Oracle'));

const LoadingFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] relative overflow-hidden">
    {/* Atmospheric Glow */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute inset-0 domain-grid-bg opacity-10" />
    </div>

    <div className="relative z-10 flex flex-col items-center">
      <motion.div 
        animate={{ 
          y: [0, -8, 0],
          scale: [1, 1.04, 1],
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="mb-12 relative"
      >
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-110 animate-pulse" />
        <div className="relative w-48 h-48 flex items-center justify-center group">
          <img 
            src="/logo.png" 
            alt="Champions of Reading Books" 
            className="absolute inset-0 w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(248,231,28,0.4)] z-10"
            referrerPolicy="no-referrer"
          />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="text-primary font-esports italic text-5xl uppercase tracking-[0.5em] digital-glow mb-4">
          Expanding Domain
        </div>
        <div className="flex justify-center gap-1">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              className="w-2 h-2 bg-primary rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
    
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[10px] font-mono text-primary/20 uppercase tracking-[0.8em] italic">
      Binding Vows in Progress...
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/" />;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  if (!isAdmin) return <Navigate to="/" />;
  return <>{children}</>;
};

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.01, y: -12 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex-grow flex flex-col"
    >
      {children}
    </motion.div>
  );
};

const AppRoutes = () => {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Play page-flip audio when user navigates to a different section
    playPageFlip();
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait" initial={true}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/arena" element={<PageTransition><Arena /></PageTransition>} />
        <Route path="/submit" element={
          <ProtectedRoute>
            <PageTransition>
              <Submission />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <PageTransition>
              <Profile />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/oracle" element={
          <AdminRoute>
            <PageTransition>
              <Oracle />
            </PageTransition>
          </AdminRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <div className="flex flex-col min-h-screen relative overflow-hidden bg-surface domain-expansion-bg">
              <Navbar />
              <main className="flex-grow pt-20 relative z-10 flex flex-col">
                <Suspense fallback={<LoadingFallback />}>
                  <AppRoutes />
                </Suspense>
              </main>
              <Footer />
            </div>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
