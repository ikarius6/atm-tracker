'use client'

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AlertTriangle, MapPin, Clock, TrendingUp } from 'lucide-react';
import { createReport, getReports, getChartData } from '../../lib/actions';

const ATMTracker = () => {
  const [reports, setReports] = useState([]);
  const [location, setLocation] = useState('');
  const [reportedBy, setReportedBy] = useState('');
  
  // Fixed list of ATMs in the area
  const atmLocations = [
    'ATM Banco Azteca - Main Plaza',
    'ATM BBVA - Las Americas Mall',
    'ATM Santander - Central Metro Station',
    'ATM Banorte - North Supermarket'
  ];
  const [chartData, setChartData] = useState([]);
  const [viewMode, setViewMode] = useState('hourly'); // hourly, daily, weekly
  const [isLoading, setIsLoading] = useState(false);

  // Cargar reportes al montar el componente
  useEffect(() => {
    loadReports();
    loadChartData();
  }, []);

  // Actualizar datos del gráfico cuando cambia el modo de vista
  useEffect(() => {
    loadChartData();
  }, [viewMode]);

  const loadReports = async () => {
    try {
      const data = await getReports();
      setReports(data.map(report => {
        // Convertir la fecha a objeto Date asegurando que se interpreta como hora local
        let timestamp;
        try {
          // Primero intentar parsear directamente la fecha
          timestamp = new Date(report.timestamp);
          
          // Validar si la fecha parece razonable (no NaN y dentro de un rango esperable)
          if (isNaN(timestamp) || timestamp.getFullYear() < 2020 || timestamp.getFullYear() > 2030) {
            throw new Error('Invalid date');
          }
        } catch (e) {
          // Si falla, intentar formatear y parsear manualmente la fecha
          const parts = report.timestamp.split(/[\s:-]/);
          if (parts.length >= 6) {
            // Formato esperado: YYYY-MM-DD HH:MM:SS
            timestamp = new Date(
              parseInt(parts[0]), // año
              parseInt(parts[1]) - 1, // mes (0-11)
              parseInt(parts[2]), // día
              parseInt(parts[3]), // hora
              parseInt(parts[4]), // minutos
              parseInt(parts[5])  // segundos
            );
          } else {
            // Fallback a fecha actual
            timestamp = new Date();
            console.error('Could not parse date:', report.timestamp);
          }
        }
        
        return {
          ...report,
          timestamp
        };
      }));
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const loadChartData = async () => {
    try {
      const data = await getChartData(viewMode);
      setChartData(data);
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) return;
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('location', location);
      formData.append('reportedBy', reportedBy || 'Anonymous');
      
      await createReport(formData);
      
      // Recargar datos
      await loadReports();
      await loadChartData();
      
      // Limpiar formulario
      setLocation('');
      setReportedBy('');
    } catch (error) {
      console.error('Error creating report:', error);
      alert('Error creating report');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return `just now`;
    if (minutes === 1) return `1 minute ago`;
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours === 1) return `1 hour ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return `1 day ago`;
    return `${days} days ago`;
  };

  const getLocationCounts = () => {
    const counts = {};
    reports.forEach(report => {
      counts[report.location] = (counts[report.location] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-red-500" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">ATM Empty Tracker</h1>
              <p className="text-gray-600">Report empty ATMs in your area</p>
            </div>
          </div>

          {/* Formulario de reporte */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select empty ATM *
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Select ATM --</option>
                  {atmLocations.map((atm, index) => (
                    <option key={index} value={atm}>{atm}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your name (optional)
                </label>
                <input
                  type="text"
                  value={reportedBy}
                  onChange={(e) => setReportedBy(e.target.value)}
                  placeholder="Anonymous"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !location.trim()}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <AlertTriangle size={20} />
              {isLoading ? 'Reporting...' : 'Report Empty ATM'}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de tendencias */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp size={24} />
                Reports Trends
              </h2>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="hourly">By Hour (24h)</option>
                <option value="daily">By Day (7d)</option>
              </select>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="reports" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ubicaciones más reportadas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin size={24} />
              Most Reported Locations
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getLocationCounts()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="location" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Lista de reportes recientes */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={24} />
            Recent Reports ({reports.length})
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {reports.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No reports yet. Be the first to report an empty ATM!
              </p>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="text-red-500" size={20} />
                    <div>
                      <p className="font-medium text-gray-800">{report.location}</p>
                      <p className="text-sm text-gray-600">Reported by: {report.reported_by}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{formatTime(report.timestamp)}</p>
                    <p className="text-xs text-gray-400">
                      {report.timestamp.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}{' '}
                      {report.timestamp.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-red-500 mb-2">{reports.length}</div>
            <div className="text-gray-600">Total Reports</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-500 mb-2">
              {new Set(reports.map(r => r.location)).size}
            </div>
            <div className="text-gray-600">Unique Locations</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">
              {reports.filter(r => {
                const now = new Date();
                const reportTime = new Date(r.timestamp);
                return (now - reportTime) < 24 * 60 * 60 * 1000;
              }).length}
            </div>
            <div className="text-gray-600">Today's Reports</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ATMTracker;
