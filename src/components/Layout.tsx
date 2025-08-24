import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Dumbbell, UtensilsCrossed, User, LogOut, ArrowUp, Menu } from './Icons';
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
      setShowScrollTop(window.scrollY > 300);
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
      <header className="navbar bg-base-200 shadow-md px-4 md:px-8 sticky top-0 z-40">
        <div className="navbar-start">
          {/* Mobile Dropdown */}
          <div className="dropdown lg:hidden">
            <label tabIndex={0} className="btn btn-ghost lg:hidden">
              <Menu size={24} />
            </label>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-300 rounded-box w-52">
              <li><NavLink to="/fitness">Fitness</NavLink></li>
              <li><NavLink to="/nutrition">Nutrition</NavLink></li>
              <li><NavLink to="/profile">Profile</NavLink></li>
            </ul>
          </div>
          <NavLink to="/fitness" className="btn btn-ghost text-xl text-primary font-bold normal-case">
            <Dumbbell className="mr-2" />
            FitTrack
          </NavLink>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 space-x-2">
            <li><NavLink to="/fitness" className={navLinkClasses}><UtensilsCrossed className="mr-2 h-4 w-4"/>Fitness</NavLink></li>
            <li><NavLink to="/nutrition" className={navLinkClasses}><UtensilsCrossed className="mr-2 h-4 w-4"/>Nutrition</NavLink></li>
            <li><NavLink to="/profile" className={navLinkClasses}><User className="mr-2 h-4 w-4"/>Profile</NavLink></li>
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
