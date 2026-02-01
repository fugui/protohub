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

function App() {
  const { user } = useAuthStore();

  return (
    <Router>
      <Routes>
        <Route path='/login' element={<LoginPage />} />
        <Route
          path='/'
          element={user ? <DashboardPage /> : <Navigate to='/login' />}
        />
        <Route
          path='/dashboard'
          element={user ? <DashboardPage /> : <Navigate to='/login' />}
        />
        <Route
          path='/files'
          element={user ? <FileListPage /> : <Navigate to='/login' />}
        />
        <Route
          path='/files/:id'
          element={user ? <FileDetailPage /> : <Navigate to='/login' />}
        />
        <Route
          path='/checks/:id'
          element={user ? <CheckReportPage /> : <Navigate to='/login' />}
        />
        <Route
          path='/vocabulary'
          element={user ? <VocabularyPage /> : <Navigate to='/login' />}
        />
        <Route
          path='/reviews'
          element={user ? <ReviewPage /> : <Navigate to='/login' />}
        />
        <Route
          path='/dependencies'
          element={user ? <DependencyGraphPage /> : <Navigate to='/login' />}
        />
        <Route
          path='/subsystems'
          element={user ? <SubsystemPage /> : <Navigate to='/login' />}
        />
      </Routes>
    </Router>
  );
}

export default App;
