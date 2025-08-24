import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Dumbbell, UtensilsCrossed, User, LogOut, ArrowUp } from './Icons';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Signed out successfully!');
      navigate('/'); 
    }
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `btn btn-ghost ${isActive ? 'bg-primary/20 text-primary' : ''}`;

  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <header className="navbar bg-base-200 shadow-md px-4 md:px-8">
        <div className="navbar-start">
          <NavLink to="/fitness" className="btn btn-ghost text-xl text-primary font-bold normal-case">
            <Dumbbell className="mr-2" />
            FitTrack
          </NavLink>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 space-x-2">
            <li><NavLink to="/fitness" className={navLinkClasses}>Fitness</NavLink></li>
            <li><NavLink to="/nutrition" className={navLinkClasses}>Nutrition</NavLink></li>
            <li><NavLink to="/profile" className={navLinkClasses}>Profile</NavLink></li>
          </ul>
        </div>
        <div className="navbar-end">
          <button onClick={handleSignOut} className="btn btn-error btn-outline btn-sm">
            <LogOut size={16} className="mr-1" />
            Sign Out
          </button>
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-8">
        {children}
      </main>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-5 right-5 btn btn-primary btn-circle z-50 fade-in"
          aria-label="Scroll to top"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
};

export default Layout;