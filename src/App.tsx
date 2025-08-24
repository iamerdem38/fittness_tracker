import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Fitness from './components/Fitness';
import Nutrition from './components/Nutrition';
import Profile from './components/Profile';
import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
  return (
    <>
      <Toaster 
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          className: '',
          style: {
            background: '#374151',
            color: '#fff',
          },
        }}
      />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/fitness" element={<Fitness />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/settings" element={<Profile />} />
            <Route path="*" element={<Navigate to="/fitness" />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </>
  );
};

export default App;
