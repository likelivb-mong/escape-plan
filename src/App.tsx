import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import Layout from './components/layout/Layout';
import PasswordGate from './components/PasswordGate';
import HomePage from './pages/HomePage';
import ThemeDesignPage from './pages/ThemeDesignPage';
import MandalartPage from './pages/MandalartPage';
import StoryPage from './pages/StoryPage';
import GameFlowPage from './pages/GameFlowPage';
import FlowManualPage from './pages/FlowManualPage';
import SettingPage from './pages/SettingPage';
import PassMapManualPage from './pages/PassMapManualPage';
import PlanPage from './pages/PlanPage';
import ScenarioPage from './pages/ScenarioPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDashboardPage from './pages/ProjectDashboardPage';
import OptionalSectionPage from './pages/OptionalSectionPage';
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
            <Route path="/theme-design" element={<ThemeDesignPage />} />
            <Route path="/story" element={<StoryPage />} />
            <Route path="/mandalart" element={<MandalartPage />} />
            <Route path="/game-flow" element={<GameFlowPage />} />
            <Route path="/flow-manual" element={<FlowManualPage />} />
            <Route path="/setting" element={<SettingPage />} />
            <Route path="/passmap-manual" element={<PassMapManualPage />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/scenario" element={<ScenarioPage />} />
            <Route path="/supplemental/:sectionKey" element={<OptionalSectionPage />} />

            {/* PassMap theme deep link (accessed from projects) */}
            <Route path="/passmap/:branchCode/:themeId" element={<PassMapThemePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProjectProvider>
  );
}
