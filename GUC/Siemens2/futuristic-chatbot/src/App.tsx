import React from 'react';
import Index from './pages/Index';

function App() {
  return (
    <div className="min-h-screen bg-background">
      {/* Test div to verify Tailwind is working */}
      <div className="p-4 bg-red-500 text-white">
        Tailwind Test: If you see this red box, Tailwind CSS is working!
      </div>
      <Index />
    </div>
  );
}

export default App;
