import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from './services/supabase';
import Layout from './components/Layout';
import Fitness from './components/Fitness';
import Nutrition from './components/Nutrition';
import Profile from './components/Profile';
import Auth from './components/Auth';
import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <>
      <Toaster 
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#374151',
            color: '#fff',
          },
        }}
      />
      <BrowserRouter>
        {!session ? (
          <Auth />
        ) : (
          <Layout key={session.user.id}>
            <Routes>
              <Route path="/fitness" element={<Fitness />} />
              <Route path="/nutrition" element={<Nutrition />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/fitness" />} />
            </Routes>
          </Layout>
        )}
      </BrowserRouter>
    </>
  );
};

export default App;
