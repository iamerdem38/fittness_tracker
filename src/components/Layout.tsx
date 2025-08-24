import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Dumbbell, UtensilsCrossed, User, LogOut } from './Icons';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
      isActive ? 'bg-primary text-primary-content' : 'hover:bg-base-300'
    }`;

  return (
    <div className="flex h-screen bg-base-100 text-base-content">
      <aside className="w-64 bg-base-200 p-4 flex flex-col">
        <div className="text-2xl font-bold text-primary mb-8">FitTrack</div>
        <nav className="flex flex-col space-y-2">
          <NavLink to="/fitness" className={navLinkClasses}>
            <Dumbbell className="mr-3 h-5 w-5" />
            Fitness
          </NavLink>
          <NavLink to="/nutrition" className={navLinkClasses}>
            <UtensilsCrossed className="mr-3 h-5 w-5" />
            Nutrition
          </NavLink>
          <NavLink to="/profile" className={navLinkClasses}>
            <User className="mr-3 h-5 w-5" />
            Profile
          </NavLink>
        </nav>
        <div className="mt-auto">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-4 py-2 rounded-lg text-error hover:bg-error hover:text-error-content transition-colors duration-200"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;