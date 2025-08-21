import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { generatePlan, PlanGenerationError } from '../ai/prompt';
import { useToast } from '../hooks/useToast';

interface HomeProps {
  onNavigate: (path: string) => void;
}

export function Home({ onNavigate }: HomeProps) {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [idea, setIdea] = useState('');
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [isGenerating, setIsGenerating] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn() {
    if (!email.trim()) {
      addToast('Please enter your email', 'error');
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    
    if (error) {
      addToast(error.message, 'error');
    } else {
      addToast('Check your email for the magic link!', 'success');
    }
  }

  async function handleGeneratePlan() {
    if (!idea.trim()) {
      addToast('Please describe your idea', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const plan = await generatePlan({ idea, lang });
      
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({ 
          user_id: userId!, 
          name: plan.project_title 
        })
        .select()
        .single();

      if (projectError) throw projectError;

      for (const milestone of plan.milestones) {
        const { error: milestoneError } = await supabase
          .from('milestones')
          .insert({
            project_id: project.id,
            user_id: userId!,
            title: milestone.title,
            description: milestone.description,
            status: 'pending',
            skills: JSON.stringify(milestone.skills),
            resources: JSON.stringify(milestone.resources)
          });

        if (milestoneError) throw milestoneError;
      }

      addToast('Plan generated successfully!', 'success');
      onNavigate(`/project/${project.id}`);

    } catch (error) {
      if (error instanceof PlanGenerationError) {
        addToast(`AI Error: ${error.message}`, 'error');
      } else {
        addToast('Failed to create project. Please try again.', 'error');
      }
      console.error('Plan generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  }

  const styles = {
    container: {
      padding: '24px',
      maxWidth: '560px',
      margin: '0 auto',
      fontFamily: 'system-ui, sans-serif'
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '24px',
      color: '#2d3748'
    },
    input: {
      padding: '12px',
      width: '100%',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      fontSize: '14px',
      marginBottom: '16px'
    },
    button: {
      padding: '12px 24px',
      backgroundColor: '#4f46e5',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    },
    buttonDisabled: {
      padding: '12px 24px',
      backgroundColor: '#9ca3af',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'not-allowed',
      fontSize: '14px',
      fontWeight: '500'
    },
    select: {
      padding: '8px',
      marginLeft: '8px',
      border: '1px solid #e2e8f0',
      borderRadius: '4px'
    },
    langContainer: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '16px'
    }
  };

  if (!userId) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Micelion</h1>
        <p style={{ marginBottom: '16px', color: '#4a5568' }}>
          Sign in with a magic link to start building your learning path
        </p>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          onKeyPress={(e) => e.key === 'Enter' && signIn()}
        />
        <button onClick={signIn} style={styles.button}>
          Send Magic Link
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Start with an idea</h1>
      
      <div style={styles.langContainer}>
        <span>Language:</span>
        <select 
          value={lang} 
          onChange={(e) => setLang(e.target.value as 'en' | 'es')}
          style={styles.select}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>

      <textarea
        placeholder={lang === 'en' ? 
          "Describe what you want to learn or build (e.g., 'I want to create a mobile app for tracking fitness goals')" :
          "Describe qué quieres aprender o construir (ej: 'Quiero crear una app móvil para seguir objetivos de fitness')"
        }
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        style={{ ...styles.input, minHeight: '120px', resize: 'vertical' as const }}
      />

      <button 
        onClick={handleGeneratePlan}
        disabled={isGenerating || !idea.trim()}
        style={isGenerating || !idea.trim() ? styles.buttonDisabled : styles.button}
      >
        {isGenerating ? 'Generating Plan...' : 'Generate Plan with AI'}
      </button>
      
      <p style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280' }}>
        {lang === 'en' ? 
          'This will create a personalized learning path with milestones, skills, and resources.' :
          'Esto creará una ruta de aprendizaje personalizada con hitos, habilidades y recursos.'
        }
      </p>
    </div>
  );
}