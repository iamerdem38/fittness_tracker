import React from 'react';
import { NavLink } from 'react-router-dom';
import { Dumbbell, UtensilsCrossed, User } from './Icons';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
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
          <NavLink to="/settings" className={navLinkClasses}>
            <User className="mr-3 h-5 w-5" />
            Settings
          </NavLink>
        </nav>
      </aside>
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;
