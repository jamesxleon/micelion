import { Milestone } from '../types/plan';

interface MilestoneMapProps {
  milestones: Milestone[];
  onMilestoneClick: (milestone: Milestone) => void;
}

export function MilestoneMap({ milestones, onMilestoneClick }: MilestoneMapProps) {
  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const styles = {
    container: {
      padding: '24px',
      backgroundColor: '#fafafa'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '16px',
      position: 'relative' as const
    },
    card: {
      backgroundColor: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      position: 'relative' as const
    },
    cardHover: {
      backgroundColor: 'white',
      border: '2px solid #4f46e5',
      borderRadius: '8px',
      padding: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      position: 'relative' as const
    },
    stepNumber: {
      position: 'absolute' as const,
      top: '-8px',
      left: '-8px',
      backgroundColor: '#4f46e5',
      color: 'white',
      borderRadius: '50%',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 'bold'
    },
    title: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '8px',
      color: '#1f2937'
    },
    status: {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      color: 'white'
    },
    connecting: {
      position: 'absolute' as const,
      width: '2px',
      backgroundColor: '#e5e7eb',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: -1
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '600' }}>
        Learning Path
      </h2>
      <div style={styles.grid}>
        {milestones.map((milestone, index) => (
          <div
            key={milestone.id}
            style={styles.card}
            onClick={() => onMilestoneClick(milestone)}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, styles.cardHover);
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, styles.card);
            }}
          >
            <div style={styles.stepNumber}>
              {index + 1}
            </div>
            <h3 style={styles.title}>{milestone.title}</h3>
            <div 
              style={{
                ...styles.status,
                backgroundColor: getStatusColor(milestone.status)
              }}
            >
              {milestone.status.replace('_', ' ').toUpperCase()}
            </div>
            {milestone.skills.length > 0 && (
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                Skills: {milestone.skills.slice(0, 2).join(', ')}
                {milestone.skills.length > 2 && ` +${milestone.skills.length - 2} more`}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}