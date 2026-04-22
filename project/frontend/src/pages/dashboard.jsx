import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './dashboard.css';

const PIE_COLORS = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'];

function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('map');

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/venue_status`
      : '/venue_status.json';

    const fetchData = () => {
      fetch(API_URL)
        .then(res => res.json())
        .then(data => {
          if (data && data.rooms) {
            setRooms(data.rooms);
            
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour12: false });
            
            const newPoint = { time: timeStr };
            let totalPower = 0;
            let totalCost = 0;

            data.rooms.forEach(r => {
              newPoint[`${r.id}_temp`] = r.t_return;
              newPoint[`${r.id}_co2`] = r.co2;
              newPoint[`${r.id}_power`] = r.power_kw;
              newPoint[`${r.id}_cost`] = r.cost_hourly;
              totalPower += r.power_kw;
              totalCost += r.cost_hourly;
            });
            
            newPoint.totalPower = round(totalPower, 2);
            newPoint.totalCost = round(totalCost, 2);
            
            setHistory(prev => [...prev, newPoint].slice(-15));
          }
        })
        .catch(err => console.error("Could not load venue status:", err));
    };

    fetchData();
    const intervalId = setInterval(fetchData, 2000);
    return () => clearInterval(intervalId);
  }, []);

  const round = (val, dec) => Math.round(val * Math.pow(10, dec)) / Math.pow(10, dec);

  const getClassForRoom = (id) => {
    if (id === 'hall') return 'room hall';
    return `room ${id}`;
  };

  const pieData = rooms.map(r => ({
    name: r.name,
    value: r.people
  }));

  const renderControlPanel = () => (
    <section className="venue-map-container">
      <div className="venue-grid">
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <div key={room.id} className={getClassForRoom(room.id)}>
              <span className={`status ${room.status}`} title={`Status: ${room.status}`}></span>
              {room.name}
              <div className="room-details">Capacity: {room.capacity}</div>
              <div className="room-ai-metrics">
                <div className="metric"><span className="label">Temp:</span> {room.t_return}°C</div>
                <div className="metric"><span className="label">People:</span> {room.people}</div>
                <div className="metric"><span className="label">Density:</span> {room.density}</div>
                <div className="metric"><span className="label">CO2:</span> {room.co2} ppm</div>
                <div className="metric"><span className="label">Airflow:</span> {room.airflow}</div>
              </div>
              <div className="room-action">
                {room.action}
              </div>
            </div>
          ))
        ) : (
          <div className="loading">Loading AI Predictions...</div>
        )}
      </div>
    </section>
  );

  const renderLiveGraphs = () => (
    <section className="graphs-container">
      {rooms.length === 0 ? (
        <div className="loading">Loading AI Predictions...</div>
      ) : (
        <div className="graphs-layout">

          <div className="lines-section">
            <h2>Room Trends (Temp & CO2)</h2>
            <div className="line-grids">
              {rooms.map((room, idx) => (
                <div key={`line-${room.id}`} className="line-chart-block">
                  <h3>{room.name}</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={history} margin={{top: 5, right: 5, left: -20, bottom: 5}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" tick={{fontSize: 10}} />
                      <YAxis yAxisId="left" stroke={PIE_COLORS[idx % PIE_COLORS.length]} fontSize={10} width={30} />
                      <YAxis yAxisId="right" orientation="right" stroke="#d1d5db" fontSize={10} width={40} />
                      <Tooltip contentStyle={{backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px'}} />
                      <Legend wrapperStyle={{fontSize: '11px'}} />
                      <Line yAxisId="left" type="monotone" dataKey={`${room.id}_temp`} name="Temp (°C)" stroke={PIE_COLORS[idx % PIE_COLORS.length]} strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Line yAxisId="right" type="monotone" dataKey={`${room.id}_co2`} name="CO2 (ppm)" stroke="#d1d5db" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );

  const renderPriceSection = () => {
    const latest = history[history.length - 1] || {};
    return (
      <section className="price-container">
        <div className="price-summary">
          <div className="price-card">
            <span className="card-label">Total Power Usage</span>
            <div className="card-value">
              {latest.totalPower || 0} <span className="card-unit">kW</span>
            </div>
            <p className="card-desc">Combined load from all active units</p>
          </div>
          <div className="price-card highlight">
            <span className="card-label">Operating Cost</span>
            <div className="card-value">
              ₹{latest.totalCost || 0} <span className="card-unit">/ hr</span>
            </div>
            <p className="card-desc">Estimated at ₹0.15/kWh hourly rate</p>
          </div>
        </div>

        <div className="price-details-section">
          <h2>Room Power Breakdown</h2>
          <div className="price-grid">
            {rooms.map((room, idx) => (
              <div key={`price-${room.id}`} className="price-detail-card">
                <div className="room-info">
                  <span className="color-dot" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                  <span className="room-name">{room.name}</span>
                </div>
                <div className="room-metrics">
                  <div className="price-metric">
                    <span>Power:</span>
                    <strong>{room.power_kw} kW</strong>
                  </div>
                  <div className="price-metric">
                    <span>Cost:</span>
                    <strong>₹{room.cost_hourly} /hr</strong>
                  </div>
                </div>
                <div className="power-bar-container">
                  <div 
                    className="power-bar" 
                    style={{ 
                      width: `${(room.power_kw / 15) * 100}%`,
                      backgroundColor: PIE_COLORS[idx % PIE_COLORS.length]
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderDevContacts = () => (
    <section className="dev-container">
      <div className="dev-card">
        <div className="dev-avatar">
          <img src="/dev-avatar.jpg" alt="Rishi Jha" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
        </div>
        <h2 className="dev-name">Rishi Jha</h2>
        <p className="dev-role">AI & Full-Stack Developer</p>
        <p className="dev-bio">
          Building intelligent systems that bridge machine learning and real-world infrastructure.
          Creator of the Smart HVAC AI Monitoring Platform.
        </p>
        <div className="dev-tech-chips">
          {['Python', 'React', 'Machine Learning', 'scikit-learn', 'Recharts', 'Vite'].map(tech => (
            <span key={tech} className="tech-chip">{tech}</span>
          ))}
        </div>
        <div className="dev-links">
          <a href="https://github.com/Jha-2022" target="_blank" rel="noopener noreferrer" className="dev-link github-link">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            GitHub Profile
          </a>
          <a href="https://www.linkedin.com/in/rishi-jha-bb48a3251/" target="_blank" rel="noopener noreferrer" className="dev-link linkedin-link">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            LinkedIn Profile
          </a>
        </div>
      </div>
    </section>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'map': return renderControlPanel();
      case 'graphs': return renderLiveGraphs();
      case 'price': return renderPriceSection();
      case 'dev': return renderDevContacts();
      default: return renderControlPanel();
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-logo">VenueHub</div>
        <nav>
          <div className={`sidebar-item ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            Control Panel
          </div>
          <div className={`sidebar-item ${activeTab === 'graphs' ? 'active' : ''}`} onClick={() => setActiveTab('graphs')}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            Live Graphs
          </div>
          <div className={`sidebar-item ${activeTab === 'price' ? 'active' : ''}`} onClick={() => setActiveTab('price')}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><path d="M11 8v6M8 11h6"></path><path d="M11 3v2m0 12v2M3 11h2m12 0h2"></path></svg>
            Price & Power
          </div>
          <div className={`sidebar-item ${activeTab === 'dev' ? 'active' : ''}`} onClick={() => setActiveTab('dev')}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
            Dev Contacts
          </div>
        </nav>
        
        {rooms.length > 0 && (
          <div className="sidebar-pie-chart" style={{ marginTop: '24px', paddingBottom: '20px' }}>
            <h3 style={{ color: '#fff', fontSize: '14px', marginBottom: '10px', textAlign: 'center', opacity: 0.8 }}>Live Occupancy</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                  label={({name, percent}) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: 'rgba(0,0,0,0.8)', borderColor: '#374151', borderRadius: '8px'}} itemStyle={{color: '#fff'}} />
              </PieChart>
            </ResponsiveContainer>
            <div className="sidebar-pie-legend" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', padding: '0 10px' }}>
              {pieData.map((entry, index) => (
                <div key={`legend-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{entry.name}</span>
                  </div>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{entry.value} Ppl.</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      <main className="main-content">
        <header className="dashboard-header">
          <h1>Facility Overview</h1>
          <p>Real-time monitoring of your venue spaces</p>
        </header>

        {renderContent()}
      </main>
    </div>
  );
}

export default Dashboard;