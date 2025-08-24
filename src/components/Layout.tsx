import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Dumbbell, UtensilsCrossed, User, LogOut, ChevronsLeft, ChevronsRight, Menu } from './Icons';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
      isCollapsed ? 'justify-center' : ''
    } ${
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
      <aside className={`bg-base-200 p-4 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className={`flex items-center mb-8 h-8 ${isCollapsed ? 'justify-center' : ''}`}>
          {isCollapsed ? <Dumbbell size={24} className="text-primary"/> : <span className="text-2xl font-bold text-primary">FitTrack</span>}
        </div>
        
        <nav className="flex flex-col space-y-2 flex-grow">
          <NavLink to="/fitness" className={navLinkClasses}>
            <Dumbbell className={`h-5 w-5 ${!isCollapsed && 'mr-3'}`} />
            {!isCollapsed && <span>Fitness</span>}
          </NavLink>
          <NavLink to="/nutrition" className={navLinkClasses}>
            <UtensilsCrossed className={`h-5 w-5 ${!isCollapsed && 'mr-3'}`} />
            {!isCollapsed && <span>Nutrition</span>}
          </NavLink>
          <NavLink to="/profile" className={navLinkClasses}>
            <User className={`h-5 w-5 ${!isCollapsed && 'mr-3'}`} />
            {!isCollapsed && <span>Profile</span>}
          </NavLink>
        </nav>

        <div className="mb-2">
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="btn btn-ghost w-full flex items-center justify-center">
                {isCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            </button>
        </div>

        <button onClick={handleSignOut} className={`btn btn-error text-error-content w-full ${isCollapsed ? 'justify-center' : ''}`}>
          <LogOut className={`${!isCollapsed && 'mr-2'}`} size={18} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </aside>
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;