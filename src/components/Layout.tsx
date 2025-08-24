import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Dumbbell, UtensilsCrossed, User, LogOut } from './Icons';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
      isActive ? 'bg-primary text-primary-content' : 'hover:bg-base-300'
    }`;

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Signed out successfully!');
      navigate('/'); 
    }
  };

  return (
    <div className="flex h-screen bg-base-100 text-base-content">
      <aside className="w-64 bg-base-200 p-4 flex flex-col flex-shrink-0">
        <div className="text-2xl font-bold text-primary mb-8">FitTrack</div>
        <nav className="flex flex-col space-y-2 flex-grow">
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
        <button onClick={handleSignOut} className="btn btn-error text-error-content w-full">
          <LogOut className="mr-2" size={18} />
          Sign Out
        </button>
      </aside>
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
