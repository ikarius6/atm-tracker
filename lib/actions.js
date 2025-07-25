'use server'

import { getAllReports, addReport, getReportsGroupedByHour, getReportsGroupedByDay } from './database.js';
import { revalidatePath } from 'next/cache';

export async function createReport(formData) {
  const location = formData.get('location');
  const reportedBy = formData.get('reportedBy') || 'Anónimo';
  
  if (!location || location.trim() === '') {
    throw new Error('La ubicación es requerida');
  }
  
  try {
    const newReport = addReport(location.trim(), reportedBy);
    revalidatePath('/');
    return { success: true, report: newReport };
  } catch (error) {
    console.error('Error creating report:', error);
    throw new Error('Error al crear el reporte');
  }
}

export async function getReports() {
  try {
    return getAllReports();
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
}

export async function getChartData(viewMode = 'hourly') {
  try {
    if (viewMode === 'hourly') {
      const data = getReportsGroupedByHour();
      // Completar las 24 horas
      const fullData = [];
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        const existing = data.find(d => d.hour === hour);
        fullData.push({
          time: `${hour}:00`,
          reports: existing ? existing.count : 0
        });
      }
      return fullData;
    } else if (viewMode === 'daily') {
      const data = getReportsGroupedByDay();
      // Completar los últimos 7 días
      const fullData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStr = date.toISOString().split('T')[0];
        const existing = data.find(d => d.day === dayStr);
        fullData.push({
          time: dayStr,
          reports: existing ? existing.count : 0
        });
      }
      return fullData;
    }
    return [];
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return [];
  }
}
