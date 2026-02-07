
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/contexts/AppContext';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import TourDetailPage from '@/pages/TourDetailPage';
import MeetupsPage from '@/pages/MeetupsPage';
import PartnersPage from '@/pages/PartnersPage';
import DashboardPage from '@/pages/DashboardPage';
import NotFoundPage from '@/pages/NotFoundPage';
import AIPlannerPage from '@/pages/AIPlannerPage';
import ReferAndEarnPage from '@/pages/ReferAndEarnPage';
import VRExperiencePage from '@/pages/VRExperiencePage';
import CommunityPage from '@/pages/CommunityPage';
import BlogsPage from '@/pages/BlogsPage';
import BlogDetailPage from '@/pages/BlogDetailPage';
import DailyRewardsPage from '@/pages/DailyRewardsPage';
import TreasureHuntPage from '@/pages/TreasureHuntPage';
import WhitepaperPage from '@/pages/WhitepaperPage';


function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/ai-planner" element={<AIPlannerPage />} />
            <Route path="/vr-experience" element={<VRExperiencePage />} />
            <Route path="/treasure-hunt" element={<TreasureHuntPage />} />
            <Route path="/whitepaper" element={<WhitepaperPage />} />
            <Route path="/tours/:slug" element={<TourDetailPage />} />
            <Route path="/blogs" element={<BlogsPage />} />
            <Route path="/blogs/:slug" element={<BlogDetailPage />} />
            <Route path="/meetups" element={<MeetupsPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/partners/apply" element={<PartnersPage />} />
            <Route path="/refer-and-earn" element={<ReferAndEarnPage />} />
            <Route path="/daily-rewards" element={<DailyRewardsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppProvider>
  );
}

export default App;
