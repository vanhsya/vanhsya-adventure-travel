import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import TourDetailPage from '@/pages/TourDetailPage';
import MeetupsPage from '@/pages/MeetupsPage';
import MeetupDetailPage from '@/pages/MeetupDetailPage';
import SocialClubPage from '@/pages/SocialClubPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import LegalPage from '@/pages/LegalPage';
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
import VynoWeb3Page from '@/pages/VynoWeb3Page';
import TravelHubPage from '@/pages/TravelHubPage';
import VenturesPage from '@/pages/VenturesPage';

function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/book" element={<TravelHubPage />} />
              <Route path="/packages" element={<TravelHubPage />} />
              <Route path="/flights" element={<TravelHubPage />} />
              <Route path="/hotels" element={<TravelHubPage />} />
              <Route path="/buses" element={<TravelHubPage />} />
              <Route path="/ventures" element={<VenturesPage />} />
              <Route path="/invest" element={<VenturesPage />} />
              <Route path="/charity" element={<VenturesPage />} />
              <Route path="/couples" element={<VenturesPage />} />
              <Route path="/social-club" element={<SocialClubPage />} />
              <Route path="/join" element={<SocialClubPage />} />
              <Route path="/meetups" element={<MeetupsPage />} />
              <Route path="/meetups/:slug" element={<MeetupDetailPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/legal" element={<LegalPage />} />
              <Route path="/privacy" element={<LegalPage initialSection="privacy" />} />
              <Route path="/guidelines" element={<LegalPage initialSection="guidelines" />} />
              <Route path="/ai-planner" element={<AIPlannerPage />} />
              <Route path="/vr-experience" element={<VRExperiencePage />} />
              <Route path="/treasure-hunt" element={<TreasureHuntPage />} />
              <Route path="/vyno" element={<VynoWeb3Page />} />
              <Route path="/web3" element={<VynoWeb3Page />} />
              <Route path="/whitepaper" element={<WhitepaperPage />} />
              <Route path="/tours/:slug" element={<TourDetailPage />} />
              <Route path="/blogs" element={<BlogsPage />} />
              <Route path="/blogs/:slug" element={<BlogDetailPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/partners/apply" element={<PartnersPage />} />
              <Route path="/refer-and-earn" element={<ReferAndEarnPage />} />
              <Route path="/daily-rewards" element={<DailyRewardsPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </HashRouter>
      </AuthProvider>
    </AppProvider>
  );
}

export default App;
