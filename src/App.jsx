import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize, ChevronDown, ChevronRight, Check, Gift, Gem, Shield, Unlock, Swords } from 'lucide-react';
import { actsData } from './data';
import './index.css';

// Icon for reward type
function RewardIcon({ type }) {
  const size = 16;
  switch(type) {
    case 'buff': return <Shield size={size} />;
    case 'gem': return <Gem size={size} />;
    case 'passive': return <Swords size={size} />;
    case 'unlock': return <Unlock size={size} />;
    case 'item': return <Gift size={size} />;
    default: return <Gift size={size} />;
  }
}

// Custom wheel handler that uses native event listener (passive: false)
function WheelHandler({ zoomIn, zoomOut, children }) {
  const ref = useRef(null);
  const zoomInRef = useRef(zoomIn);
  const zoomOutRef = useRef(zoomOut);

  useEffect(() => {
    zoomInRef.current = zoomIn;
    zoomOutRef.current = zoomOut;
  }, [zoomIn, zoomOut]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.deltaY < 0) {
        zoomInRef.current(0.3);
      } else {
        zoomOutRef.current(0.3);
      }
    };

    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  return <div ref={ref} style={{ display: 'contents' }}>{children}</div>;
}

function App() {
  const [activeMapId, setActiveMapId] = useState(actsData[0].maps[0].id);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [expandedActs, setExpandedActs] = useState({ 1: true, 2: true, 3: true });

  // Checklist: load from localStorage
  const [checked, setChecked] = useState(() => {
    try {
      const saved = localStorage.getItem('poe2-checklist');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('poe2-checklist', JSON.stringify(checked));
  }, [checked]);

  // Find current map and act
  let activeMap = null;
  let activeAct = null;
  actsData.forEach(act => {
    const map = act.maps.find(m => m.id === activeMapId);
    if (map) { activeMap = map; activeAct = act; }
  });

  const currentImage = activeMap ? activeMap.images[activeImageIndex] : null;

  const handleMapSelect = (id) => {
    setActiveMapId(id);
    setActiveImageIndex(0);
  };

  const toggleAct = (actId) => {
    setExpandedActs(prev => ({ ...prev, [actId]: !prev[actId] }));
  };

  const toggleCheck = (mapId, rewardIndex) => {
    const key = `${mapId}__${rewardIndex}`;
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Is an entire map completed?
  const isMapCompleted = (map) => {
    if (!map.rewards || map.rewards.length === 0) return false;
    return map.rewards.every((_, idx) => checked[`${map.id}__${idx}`]);
  };

  // How many rewards checked for a map
  const mapProgress = (map) => {
    if (!map.rewards || map.rewards.length === 0) return { done: 0, total: 0 };
    const done = map.rewards.filter((_, idx) => checked[`${map.id}__${idx}`]).length;
    return { done, total: map.rewards.length };
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Path of Exile 2</h1>
          <p>Campaign Guide</p>
        </div>
        <div className="map-list">
          {actsData.map((act) => (
            <div key={act.act} className="act-section">
              <div className="act-header" onClick={() => toggleAct(act.act)}>
                {expandedActs[act.act] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <span>{act.title}</span>
              </div>

              {expandedActs[act.act] && (
                <div className="act-maps">
                  {act.maps.map((map, index) => {
                    const completed = isMapCompleted(map);
                    const progress = mapProgress(map);

                    return (
                      <div
                        key={map.id}
                        className={`map-item ${activeMapId === map.id ? 'active' : ''} ${completed ? 'completed' : ''}`}
                        onClick={() => handleMapSelect(map.id)}
                      >
                        <span className="map-number">{index + 1}</span>
                        <span className="map-name">{map.name}</span>
                        {progress.total > 0 && (
                          <span className={`map-badge ${completed ? 'badge-done' : ''}`}>
                            {completed ? <Check size={12} /> : `${progress.done}/${progress.total}`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Title bar */}
        <div className="top-bar">
          <h2 className="current-map-title">
            {activeMap ? `${activeAct.title} — ${activeMap.name}` : 'Select a Map'}
          </h2>
        </div>

        {activeMap && currentImage ? (
          <TransformWrapper
            initialScale={1}
            initialPositionX={0}
            initialPositionY={0}
            minScale={0.1}
            maxScale={8}
            centerOnInit={true}
            wheel={{ disabled: true }}
            smooth={true}
            velocityAnimation={{ sensitivity: 1, animationTime: 200, equalToMove: true }}
          >
            {({ zoomIn, zoomOut, resetTransform, instance }) => {
              // Sync transform state from previous map
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const prevImageRef = useRef(currentImage);
              // eslint-disable-next-line react-hooks/rules-of-hooks
              useEffect(() => {
                if (prevImageRef.current !== currentImage) {
                  prevImageRef.current = currentImage;
                  // Keep same scale/position, just swap image underneath
                }
              }, [currentImage]);

              return (
              <WheelHandler zoomIn={zoomIn} zoomOut={zoomOut}>
                <div className="top-bar" style={{ justifyContent: 'flex-end' }}>
                  <div className="controls">
                    <button className="control-btn" onClick={() => zoomIn()} title="Zoom In"><ZoomIn size={20} /></button>
                    <button className="control-btn" onClick={() => zoomOut()} title="Zoom Out"><ZoomOut size={20} /></button>
                    <button className="control-btn" onClick={() => resetTransform()} title="Reset"><Maximize size={20} /></button>
                  </div>
                </div>

                <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} wrapperClass="viewer-container">
                  <img
                    src={`/maps/${currentImage}`}
                    alt={activeMap.name}
                    className="map-image"
                    style={{ maxWidth: '100vw', maxHeight: '100vh', objectFit: 'contain' }}
                  />
                </TransformComponent>

                {/* Image variant tabs */}
                {activeMap.images.length > 1 && (
                  <div className="image-tabs">
                    {activeMap.images.map((img, idx) => {
                      let label = `Variant ${idx + 1}`;
                      if (img.toLowerCase().includes('boss')) label = 'Boss';
                      else if (img.toLowerCase().includes('ess')) label = 'ESS';
                      else if (img.toLowerCase().includes('no-text')) label = 'Clean';
                      else if (img.toLowerCase().includes('pilot')) {
                        label = img.includes('(1)') ? 'Pilot 2' : 'Pilot';
                      } else label = 'Default';
                      return (
                        <button
                          key={idx}
                          className={`tab-btn ${activeImageIndex === idx ? 'active' : ''}`}
                          onClick={() => setActiveImageIndex(idx)}
                        >{label}</button>
                      );
                    })}
                  </div>
                )}

                {/* Rewards / Passive Checklist Panel */}
                {activeMap.rewards && activeMap.rewards.length > 0 && (
                  <div className="rewards-panel">
                    <div className="rewards-header">
                      <h3>Rewards & Passives</h3>
                      <span className="rewards-progress">
                        {mapProgress(activeMap).done}/{mapProgress(activeMap).total}
                      </span>
                    </div>
                    <div className="rewards-list">
                      {activeMap.rewards.map((r, idx) => {
                        const key = `${activeMap.id}__${idx}`;
                        const isDone = !!checked[key];
                        return (
                          <div
                            key={idx}
                            className={`reward-row ${isDone ? 'reward-done' : ''}`}
                            onClick={() => toggleCheck(activeMap.id, idx)}
                          >
                            <div className={`reward-checkbox ${isDone ? 'checked' : ''}`}>
                              {isDone && <Check size={14} />}
                            </div>
                            <div className={`reward-icon type-${r.type}`}>
                              <RewardIcon type={r.type} />
                            </div>
                            <div className="reward-info">
                              <span className="reward-source">{r.source}</span>
                              <span className="reward-value">{r.reward}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </WheelHandler>
              );
            }}
          </TransformWrapper>
        ) : (
          <div className="empty-state"><p>Select a map from the list.</p></div>
        )}
      </main>
    </div>
  );
}

export default App;
