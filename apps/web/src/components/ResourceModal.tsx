import { useState } from 'react';
import { Resource } from '../types/plan';

interface ResourceModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ResourceModal({ resource, isOpen, onClose }: ResourceModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !resource) return null;

  const handleQueueScrapbook = () => {
    console.log('Queueing for scrapbook (stub):', resource);
  };

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
      maxWidth: isFullscreen ? 'none' : '500px',
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
      marginRight: '8px'
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
    linkButton: {
      padding: '8px 16px',
      backgroundColor: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      textDecoration: 'none',
      display: 'inline-block'
    },
    typeTag: {
      display: 'inline-block',
      padding: '4px 8px',
      backgroundColor: '#f3f4f6',
      color: '#374151',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      textTransform: 'uppercase' as const,
      marginBottom: '12px'
    },
    placeholder: {
      padding: '16px',
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      color: '#6b7280',
      fontSize: '14px',
      fontStyle: 'italic'
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
              {resource.title}
            </h2>
            {resource.type && (
              <div style={styles.typeTag}>
                {resource.type}
              </div>
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
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              Resource URL
            </h3>
            <p style={{ 
              fontSize: '14px', 
              color: '#6b7280', 
              wordBreak: 'break-all',
              marginBottom: '12px'
            }}>
              {resource.url}
            </p>
            <a 
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.linkButton}
            >
              Open in New Tab ↗
            </a>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              Summary
            </h3>
            <div style={styles.placeholder}>
              Resource summary and preview will be available in future versions. 
              For now, click "Open in New Tab" to view the content.
            </div>
          </div>

          <div>
            <button onClick={handleQueueScrapbook} style={styles.button}>
              📚 Queue for Scrapbook (Coming Soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}