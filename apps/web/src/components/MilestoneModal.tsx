import { useState, useEffect } from 'react';
import { Milestone, Resource } from '../types/plan';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';

interface MilestoneModalProps {
  milestone: Milestone;
  isOpen: boolean;
  onClose: () => void;
  onResourceClick: (resource: Resource) => void;
}

export function MilestoneModal({ milestone, isOpen, onClose, onResourceClick }: MilestoneModalProps) {
  const [notes, setNotes] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen && milestone) {
      loadNotes();
    }
  }, [isOpen, milestone]);

  const loadNotes = async () => {
    const { data } = await supabase
      .from('notes')
      .select('content')
      .eq('project_id', milestone.project_id)
      .eq('milestone_id', milestone.id)
      .single();
    
    setNotes(data?.content || '');
  };

  const saveNotes = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('notes')
        .upsert({
          project_id: milestone.project_id,
          milestone_id: milestone.id,
          user_id: milestone.user_id,
          content: notes
        });

      if (error) throw error;
      addToast('Notes saved!', 'success');
    } catch (error) {
      addToast('Failed to save notes', 'error');
      console.error('Save notes error:', error);
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
      maxWidth: isFullscreen ? 'none' : '800px',
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
      alignItems: 'flex-start'
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
      minHeight: '200px',
      padding: '12px',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '14px',
      fontFamily: 'monospace',
      resize: 'vertical' as const
    },
    skillsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '8px',
      marginBottom: '24px'
    },
    skill: {
      padding: '6px 12px',
      backgroundColor: '#f3f4f6',
      borderRadius: '16px',
      fontSize: '12px',
      textAlign: 'center' as const
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
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
              {milestone.title}
            </h2>
            {milestone.description && (
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                {milestone.description}
              </p>
            )}
          </div>
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
            Skills ({milestone.skills.length})
          </h3>
          <div style={styles.skillsGrid}>
            {milestone.skills.map((skill, index) => (
              <div key={index} style={styles.skill}>
                {skill}
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
            Resources ({milestone.resources.length})
          </h3>
          <div style={styles.resourcesGrid}>
            {milestone.resources.map((resource, index) => (
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
            placeholder="Add your notes here... (Markdown supported)"
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