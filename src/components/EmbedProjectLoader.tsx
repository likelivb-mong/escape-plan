import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';

/**
 * Auto-loads a project when ?projectId=xxx is in the URL.
 * Used when embedded in agent-office via iframe.
 */
export default function EmbedProjectLoader() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const { loadProject, currentProjectId } = useProject();
  const loaded = useRef(false);

  useEffect(() => {
    if (projectId && projectId !== currentProjectId && !loaded.current) {
      loaded.current = true;
      const success = loadProject(projectId);
      if (!success) {
        console.warn('[EmbedProjectLoader] Project not found in localStorage, will try Supabase...');
      }
    }
  }, [projectId, currentProjectId, loadProject]);

  return null;
}
