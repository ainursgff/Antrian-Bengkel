// FILE: MechanicOperationalCard.jsx
import React, { useState } from 'react';

const ALL_SKILLS = ['motor', 'mobil', 'diesel', 'transmisi', 'electrical', 'truck/bus'];

export default function MechanicOperationalCard({ 
  mechanic, 
  onUpdateSkills, 
  onAssignQuick, 
  isRecommendationMode = false,
  recommendationScore = null,
  recommendationReason = '',
  onEdit,
  onDelete
}) {
  const [showSkillEditor, setShowSkillEditor] = useState(false);
  const [savingSkills, setSavingSkills] = useState(false);

  // Status style helper
  const getStatusBadge = () => {
    switch (mechanic.status) {
      case 'available':
        return { bg: '#e6f4ea', color: '#137333', label: '🟢 Available' };
      case 'busy':
        return { bg: '#feefe3', color: '#b06000', label: '🟠 Busy' };
      case 'offline':
      default:
        return { bg: '#f1f3f4', color: '#5f6368', label: '⚪ Offline' };
    }
  };

  const badge = getStatusBadge();

  // Progress/Workload colors
  const getWorkloadColor = (percent) => {
    if (percent >= 80) return '#ef4444'; // Red (Overloaded)
    if (percent >= 40) return '#f97316'; // Orange (Busy)
    return '#16a34a'; // Green (Light/Available)
  };

  const handleToggleSkill = async (skill) => {
    setSavingSkills(true);
    let newSkills = [...mechanic.skills];
    if (newSkills.includes(skill)) {
      newSkills = newSkills.filter(s => s !== skill);
    } else {
      newSkills.push(skill);
    }
    try {
      await onUpdateSkills(mechanic.id, newSkills);
    } catch {}
    setSavingSkills(false);
  };

  return (
    <div className="mechanic-card fade-in" style={{
      background: '#fff',
      border: isRecommendationMode && recommendationScore > 70 ? '2px solid #2563eb' : '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: isRecommendationMode && recommendationScore > 70 
        ? '0 10px 25px rgba(37, 99, 235, 0.15), 0 4px 12px rgba(37, 99, 235, 0.05)' 
        : '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      position: 'relative',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Removed recommendation glow banner as requested */}

      {/* Profile Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            color: '#475569',
            fontWeight: 800
          }}>
            {mechanic.nama.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>{mechanic.nama}</h4>
            <small style={{ color: '#64748b', fontWeight: 600 }}>Total Servis: {mechanic.performance?.total_servis || 0}x</small>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <span style={{
            padding: '4px 10px',
            borderRadius: '50px',
            fontSize: '0.74rem',
            fontWeight: 800,
            background: badge.bg,
            color: badge.color
          }}>
            {badge.label}
          </span>
          {onEdit && onDelete && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={onEdit}
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                title="Edit Profil Montir"
                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
              >
                <i className="fas fa-edit" style={{ color: '#475569', fontSize: '0.85rem' }}></i>
              </button>
              <button
                onClick={onDelete}
                style={{
                  border: 'none',
                  background: '#fef2f2',
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                title="Hapus / Nonaktifkan Montir"
                onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
              >
                <i className="fas fa-trash-alt" style={{ color: '#ef4444', fontSize: '0.85rem' }}></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Warnings & Alerts */}
      {mechanic.warning && (
        <div style={{
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '0.76rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: mechanic.warning === 'OVERLOAD' ? '#fee2e2' : '#fef9c3',
          color: mechanic.warning === 'OVERLOAD' ? '#b91c1c' : '#854d0e',
          borderLeft: `4px solid ${mechanic.warning === 'OVERLOAD' ? '#ef4444' : '#eab308'}`
        }}>
          <i className="fas fa-exclamation-triangle"></i>
          {mechanic.warning === 'OVERLOAD' ? '⚠️ OVERLOAD: Beban Kerja Kritis!' : '🟢 IDLE: Belum Ada Pengerjaan'}
        </div>
      )}

      {/* Recommendation Reason (if in recommendation mode) */}
      {isRecommendationMode && recommendationReason && (
        <div style={{
          background: '#eff6ff',
          border: '1px dashed #bfdbfe',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '0.78rem',
          color: '#1e40af',
          fontWeight: 700
        }}>
          <i className="fas fa-magic" style={{ marginRight: '6px' }}></i>
          {recommendationReason}
        </div>
      )}

      {/* Workload Progress Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <small style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Beban Kerja (Workload)</small>
          <strong style={{ fontSize: '0.8rem', color: getWorkloadColor(mechanic.workloadPercent) }}>
            {mechanic.workloadPercent}% ({mechanic.activeTasksCount} Aktif)
          </strong>
        </div>
        <div style={{ height: '8px', borderRadius: '50px', background: '#f1f5f9', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${mechanic.workloadPercent}%`,
            background: getWorkloadColor(mechanic.workloadPercent),
            transition: 'width 0.3s ease'
          }}></div>
        </div>
      </div>

      {/* Current Task Detail (if busy) */}
      {mechanic.status === 'busy' && mechanic.activeVehicles.length > 0 && (
        <div style={{
          background: '#f8fafc',
          border: '1px solid #f1f5f9',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <small style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Pengerjaan Real-time</small>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#1e293b' }}>
              <i className="fas fa-motorcycle" style={{ color: '#f97316', marginRight: '6px' }}></i>
              {mechanic.activeVehicles.join(', ')}
            </span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563eb' }}>
              ⏱️ Est. {mechanic.estimasiSelesai}
            </span>
          </div>

          {/* Micro Progress Bar of active service */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginBottom: '2px', fontWeight: 700 }}>
              <span>Progress Servis</span>
              <span>{mechanic.progress}%</span>
            </div>
            <div style={{ height: '4px', borderRadius: '50px', background: '#e2e8f0', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${mechanic.progress}%`,
                background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
              }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Skills list & Management chip toggle */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <small style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Keahlian (Skills)</small>
          <button 
            onClick={() => setShowSkillEditor(!showSkillEditor)}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              fontSize: '0.74rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <i className={`fas ${showSkillEditor ? 'fa-times' : 'fa-cog'}`}></i>
            {showSkillEditor ? 'Selesai' : 'Kelola'}
          </button>
        </div>

        {showSkillEditor ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {ALL_SKILLS.map(skill => {
              const hasSkill = mechanic.skills.includes(skill);
              return (
                <button
                  key={skill}
                  disabled={savingSkills}
                  onClick={() => handleToggleSkill(skill)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '50px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: hasSkill ? '#dbeafe' : '#f1f5f9',
                    color: hasSkill ? '#1d4ed8' : '#475569',
                    border: `1px solid ${hasSkill ? '#bfdbfe' : '#cbd5e1'}`,
                    transition: 'all 0.1s ease',
                    opacity: savingSkills ? 0.7 : 1
                  }}
                >
                  {hasSkill ? '✓ ' : ''}{skill.toUpperCase()}
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {mechanic.skills.length === 0 ? (
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontStyle: 'italic' }}>Belum diatur</span>
            ) : (
              mechanic.skills.map(s => (
                <span key={s} style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  padding: '4px 10px',
                  borderRadius: '50px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  {s}
                </span>
              ))
            )}
          </div>
        )}
      </div>

      {/* Recommendation Assignment Button */}
      {isRecommendationMode && (
        <button
          onClick={() => onAssignQuick(mechanic)}
          disabled={mechanic.status === 'offline'}
          style={{
            marginTop: 'auto',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#fff',
            border: 'none',
            padding: '12px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
            transition: 'all 0.2s',
            opacity: mechanic.status === 'offline' ? 0.5 : 1
          }}
          onMouseEnter={e => {
            if (mechanic.status !== 'offline') e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <i className="fas fa-user-plus" style={{ marginRight: '6px' }}></i>
          Tugaskan Langsung
        </button>
      )}
    </div>
  );
}
