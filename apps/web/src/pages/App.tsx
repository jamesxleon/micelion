import { useRouter } from '../utils/router';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import { Home } from './Home';
import { Project } from './Project';

export default function App() {
  const { match, navigate } = useRouter();
  const { toasts, removeToast } = useToast();

  const homeMatch = match('/');
  const projectMatch = match('/project/:id');

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {homeMatch.match && <Home onNavigate={navigate} />}
      
      {projectMatch.match && (
        <Project 
          projectId={projectMatch.params.id} 
          onNavigate={navigate} 
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

