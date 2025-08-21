import { useState, useEffect } from 'react';
import { Resource } from '../types/plan';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';

interface SkillModalProps {
  skill: string;
  resources: Resource[];
  projectId: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onResourceClick: (resource: Resource) => void;
}

export function SkillModal({ 
  skill, 
  resources, 
  projectId, 
  userId, 
  isOpen, 
  onClose, 
  onResourceClick 
}: SkillModalProps) {
  const [notes, setNotes] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen && skill) {
      loadNotes();
    }
  }, [isOpen, skill]);

  const loadNotes = async () => {
    const { data } = await supabase
      .from('notes')
      .select('content')
      .eq('project_id', projectId)
      .eq('milestone_id', null)
      .ilike('content', `%skill:${skill}%`)
      .single();
    
    if (data?.content) {
      const skillSection = data.content.split('\n').find(line => 
        line.toLowerCase().includes(`skill:${skill.toLowerCase()}`)
      );
      if (skillSection) {
        setNotes(data.content.split(skillSection)[1]?.split('\n---')[0]?.trim() || '');
      }
    }
  };

  const saveNotes = async () => {
    setIsSaving(true);
    try {
      const noteKey = `skill:${skill}`;
      const noteContent = `${noteKey}\n${notes}\n---`;
      
      const { error } = await supabase
        .from('notes')
        .upsert({
          project_id: projectId,
          milestone_id: null,
          user_id: userId,
          content: noteContent
        });

      if (error) throw error;
      addToast('Skill notes saved!', 'success');
    } catch (error) {
      addToast('Failed to save notes', 'error');
      console.error('Save skill notes error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '8px',
      width: isFullscreen ? '100vw' : '90%',
      height: isFullscreen ? '100vh' : 'auto',
      maxWidth: isFullscreen ? 'none' : '600px',
      maxHeight: isFullscreen ? 'none' : '90vh',
      overflow: 'auto',
      position: isFullscreen ? 'fixed' as const : 'relative' as const,
      top: isFullscreen ? 0 : 'auto',
      left: isFullscreen ? 0 : 'auto',
      zIndex: isFullscreen ? 9999 : 1001
    },
    header: {
      padding: '24px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    content: {
      padding: '24px'
    },
    button: {
      padding: '8px 16px',
      backgroundColor: '#4f46e5',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      marginLeft: '8px'
    },
    buttonSecondary: {
      padding: '8px 16px',
      backgroundColor: '#6b7280',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      marginLeft: '8px'
    },
    buttonClose: {
      padding: '8px 16px',
      backgroundColor: 'transparent',
      color: '#6b7280',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    textarea: {
      width: '100%',
      minHeight: '150px',
      padding: '12px',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '14px',
      fontFamily: 'monospace',
      resize: 'vertical' as const
    },
    resourcesGrid: {
      display: 'grid',
      gap: '12px',
      marginBottom: '24px'
    },
    resource: {
      padding: '12px',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    resourceHover: {
      borderColor: '#4f46e5',
      backgroundColor: '#f8fafc'
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={{ fontSize: '20px', fontWeight: '600' }}>
            Skill: {skill}
          </h2>
          <div>
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              style={styles.buttonSecondary}
            >
              {isFullscreen ? '📉' : '📈'}
            </button>
            <button onClick={onClose} style={styles.buttonClose}>
              ✕
            </button>
          </div>
        </div>

        <div style={styles.content}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
            Resources ({resources.length})
          </h3>
          <div style={styles.resourcesGrid}>
            {resources.map((resource, index) => (
              <div 
                key={index} 
                style={styles.resource}
                onClick={() => onResourceClick(resource)}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.resourceHover)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.resource)}
              >
                <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                  {resource.title}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {resource.type || 'resource'} • {resource.url}
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
            Notes
          </h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your notes about this skill... (Markdown supported)"
            style={styles.textarea}
          />
          <button 
            onClick={saveNotes}
            disabled={isSaving}
            style={styles.button}
          >
            {isSaving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  );
}