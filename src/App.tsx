import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import MandalartPage from './pages/MandalartPage';
import StoryPage from './pages/StoryPage';
import PuzzleFlowPage from './pages/PuzzleFlowPage';

import DraftPage from './pages/DraftPage';
import FloorPlanPage from './pages/FloorPlanPage';
import ScenarioPage from './pages/ScenarioPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDashboardPage from './pages/ProjectDashboardPage';
import PassMapHomePage from './features/passmap/pages/PassMapHomePage';
import PassMapBranchPage from './features/passmap/pages/PassMapBranchPage';
import PassMapThemePage from './features/passmap/pages/PassMapThemePage';

export default function App() {
  return (
    <ProjectProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDashboardPage />} />
            <Route path="/mandalart" element={<MandalartPage />} />
            <Route path="/story" element={<StoryPage />} />
            <Route path="/scenario" element={<ScenarioPage />} />
            <Route path="/puzzle-flow" element={<PuzzleFlowPage />} />
            <Route path="/floor-plan" element={<FloorPlanPage />} />
            <Route path="/draft" element={<DraftPage />} />
            {/* PassMap Manager */}
            <Route path="/passmap" element={<PassMapHomePage />} />
            <Route path="/passmap/:branchCode" element={<PassMapBranchPage />} />
            <Route path="/passmap/:branchCode/:themeId" element={<PassMapThemePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProjectProvider>
  );
}
