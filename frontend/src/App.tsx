/**
 * 应用根组件
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { LoginPage } from './pages/LoginPage';
import { FileListPage } from './pages/FileListPage';
import { ReviewPage } from './pages/ReviewPage';
import { DependencyGraphPage } from './pages/DependencyGraphPage';
import { SubsystemPage } from './pages/SubsystemPage';
import { DashboardPage } from './pages/DashboardPage';
import { FileDetailPage } from './pages/FileDetailPage';
import { CheckReportPage } from './pages/CheckReportPage';
import { VocabularyPage } from './pages/VocabularyPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { MainLayout } from './components/MainLayout';

function App() {
  const { user } = useAuthStore();

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path='/login' element={<LoginPage />} />

        {/* Protected Routes wrapped in MainLayout */}
        <Route element={user ? <MainLayout /> : <Navigate to='/login' />}>
          <Route path='/' element={<DashboardPage />} />
          <Route path='/dashboard' element={<DashboardPage />} />
          <Route path='/files' element={<FileListPage />} />
          <Route path='/files/:id' element={<FileDetailPage />} />
          <Route path='/checks/:id' element={<CheckReportPage />} />
          <Route path='/vocabulary' element={<VocabularyPage />} />
          <Route path='/reviews' element={<ReviewPage />} />
          <Route path='/dependencies' element={<DependencyGraphPage />} />
          <Route path='/architecture' element={<ArchitecturePage />} />
          <Route path='/subsystems' element={<SubsystemPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
