import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Milestone, Resource, Project as ProjectType } from '../types/plan';
import { MilestoneMap } from '../components/MilestoneMap';
import { MilestoneModal } from '../components/MilestoneModal';
import { SkillModal } from '../components/SkillModal';
import { ResourceModal } from '../components/ResourceModal';
import { useToast } from '../hooks/useToast';

interface ProjectProps {
  projectId: string;
  onNavigate: (path: string) => void;
}

export function Project({ projectId, onNavigate }: ProjectProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [skillResources, setSkillResources] = useState<Resource[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: project, error: projectError } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (error) throw error;
      return data as ProjectType;
    }
  });

  const { data: milestones = [], error: milestonesError } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at');
      
      if (error) throw error;
      
      return data.map(milestone => ({
        ...milestone,
        skills: JSON.parse(milestone.skills || '[]'),
        resources: JSON.parse(milestone.resources || '[]')
      })) as Milestone[];
    }
  });

  if (projectError || milestonesError) {
    addToast('Error loading project data', 'error');
  }

  const aggregateSkills = () => {
    const skillsMap = new Map<string, Resource[]>();
    
    milestones.forEach(milestone => {
      milestone.skills.forEach(skill => {
        if (!skillsMap.has(skill)) {
          skillsMap.set(skill, []);
        }
        skillsMap.get(skill)!.push(...milestone.resources);
      });
    });

    return Array.from(skillsMap.entries()).map(([skill, resources]) => ({
      skill,
      resources: Array.from(new Set(resources.map(r => JSON.stringify(r))))
        .map(r => JSON.parse(r))
    }));
  };

  const handleSkillClick = (skill: string) => {
    const skillData = aggregateSkills().find(s => s.skill === skill);
    if (skillData) {
      setSkillResources(skillData.resources);
      setSelectedSkill(skill);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#fafafa'
    },
    header: {
      padding: '24px',
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb'
    },
    backButton: {
      padding: '8px 16px',
      backgroundColor: 'transparent',
      color: '#6b7280',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      marginBottom: '16px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f2937',
      margin: 0
    },
    tableSection: {
      padding: '24px',
      backgroundColor: 'white',
      margin: '24px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const
    },
    th: {
      padding: '12px',
      textAlign: 'left' as const,
      borderBottom: '2px solid #e5e7eb',
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151'
    },
    td: {
      padding: '12px',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '14px'
    },
    skillButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#4f46e5',
      cursor: 'pointer',
      textDecoration: 'underline',
      fontSize: '14px',
      fontWeight: '500',
      padding: 0
    },
    resourceButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#059669',
      cursor: 'pointer',
      textDecoration: 'underline',
      fontSize: '12px',
      marginRight: '8px',
      padding: 0
    },
    resourceType: {
      fontSize: '10px',
      color: '#6b7280',
      backgroundColor: '#f3f4f6',
      padding: '2px 6px',
      borderRadius: '8px',
      textTransform: 'uppercase' as const,
      marginLeft: '4px'
    }
  };

  if (!project) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => onNavigate('/')} style={styles.backButton}>
            ← Back to Home
          </button>
          <div>Loading project...</div>
        </div>
      </div>
    );
  }

  const skillsData = aggregateSkills();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => onNavigate('/')} style={styles.backButton}>
          ← Back to Home
        </button>
        <h1 style={styles.title}>{project.name}</h1>
      </div>

      <MilestoneMap 
        milestones={milestones}
        onMilestoneClick={setSelectedMilestone}
      />

      <div style={styles.tableSection}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
          Skills & Resources Overview
        </h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Skill</th>
              <th style={styles.th}>Resources</th>
            </tr>
          </thead>
          <tbody>
            {skillsData.map(({ skill, resources }) => (
              <tr key={skill}>
                <td style={styles.td}>
                  <button 
                    onClick={() => handleSkillClick(skill)}
                    style={styles.skillButton}
                  >
                    {skill}
                  </button>
                </td>
                <td style={styles.td}>
                  {resources.slice(0, 3).map((resource, idx) => (
                    <span key={idx}>
                      <button 
                        onClick={() => setSelectedResource(resource)}
                        style={styles.resourceButton}
                      >
                        {resource.title}
                      </button>
                      {resource.type && (
                        <span style={styles.resourceType}>
                          {resource.type}
                        </span>
                      )}
                      {idx < Math.min(resources.length - 1, 2) && <br />}
                    </span>
                  ))}
                  {resources.length > 3 && (
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      +{resources.length - 3} more resources
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedMilestone && (
        <MilestoneModal
          milestone={selectedMilestone}
          isOpen={!!selectedMilestone}
          onClose={() => setSelectedMilestone(null)}
          onResourceClick={setSelectedResource}
        />
      )}

      {selectedSkill && userId && (
        <SkillModal
          skill={selectedSkill}
          resources={skillResources}
          projectId={projectId}
          userId={userId}
          isOpen={!!selectedSkill}
          onClose={() => setSelectedSkill(null)}
          onResourceClick={setSelectedResource}
        />
      )}

      <ResourceModal
        resource={selectedResource}
        isOpen={!!selectedResource}
        onClose={() => setSelectedResource(null)}
      />
    </div>
  );
}