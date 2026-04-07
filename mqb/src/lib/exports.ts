import ical from 'ical-generator';
import { stringify } from 'csv-stringify/sync';

export interface Schedule {
  course: string;
  teacher: string;
  room: string;
  day: string;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
}

/**
 * Génère un CSV à partir des horaires
 */
export function generateScheduleCSV(schedules: Schedule[]): string {
  const headers = ['Cours', 'Enseignant', 'Salle', 'Jour', 'Heure début', 'Heure fin', 'Date début', 'Date fin'];
  const rows = schedules.map(s => [
    s.course,
    s.teacher,
    s.room,
    s.day,
    s.startTime,
    s.endTime,
    s.startDate,
    s.endDate,
  ]);

  return stringify([headers, ...rows]);
}

/**
 * Génère un rapport texte à partir des horaires
 */
export function generateSchedulePDF(schedules: Schedule[], title: string = 'Emploi du Temps'): string {
  let report = '';
  report += '═══════════════════════════════════════════════════════════════\n';
  report += `                      ${title}\n`;
  report += '═══════════════════════════════════════════════════════════════\n';
  report += `Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}\n`;
  report += '\n';

  report += 'PLANNING DES COURS\n';
  report += '───────────────────────────────────────────────────────────────\n';
  report += `${'Cours'.padEnd(20)} ${'Enseignant'.padEnd(15)} ${'Salle'.padEnd(10)} ${'Jour'.padEnd(10)} ${'Horaire'.padEnd(15)}\n`;
  report += '───────────────────────────────────────────────────────────────\n';

  schedules.forEach((schedule) => {
    const horaire = `${schedule.startTime}-${schedule.endTime}`;
    report += `${schedule.course.substring(0, 20).padEnd(20)} ${schedule.teacher.substring(0, 15).padEnd(15)} ${schedule.room.substring(0, 10).padEnd(10)} ${schedule.day.substring(0, 10).padEnd(10)} ${horaire.padEnd(15)}\n`;
  });

  report += '\n═══════════════════════════════════════════════════════════════\n';
  return report;
}

export interface ScheduleEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
}

export function generateICalendar(events: ScheduleEvent[], calendarName: string = 'MQB Schedule'): string {
  const cal = ical({
    name: calendarName,
    prodId: { company: 'MQB', product: 'Schedule', language: 'EN' },
  });

  for (const event of events) {
    cal.createEvent({
      summary: event.title,
      description: event.description,
      start: event.startDate,
      end: event.endDate,
      location: event.location,
    });
  }

  return cal.toString();
}

export interface ReportData {
  title: string;
  subtitle?: string;
  sections: {
    title: string;
    data: Record<string, any>[];
    columns: string[];
  }[];
}

export function generateReportPDF(report: ReportData): string {
  let output = '';
  output += '═══════════════════════════════════════════════════════════════\n';
  output += `                      ${report.title}\n`;
  if (report.subtitle) {
    output += `                      ${report.subtitle}\n`;
  }
  output += '═══════════════════════════════════════════════════════════════\n';
  output += `Généré le: ${new Date().toLocaleDateString('fr-FR')}\n\n`;

  report.sections.forEach((section) => {
    output += `${section.title}\n`;
    output += '───────────────────────────────────────────────────────────────\n';

    if (section.data.length === 0) {
      output += 'Aucune donnée\n';
    } else {
      const colWidths = section.columns.map(col => Math.max(col.length, 10));
      output += section.columns.map((col, idx) => col.padEnd(colWidths[idx])).join(' | ') + '\n';
      output += '───────────────────────────────────────────────────────────────\n';

      section.data.forEach((row) => {
        output += section.columns.map((col, idx) => 
          String(row[col] || '-').padEnd(colWidths[idx])
        ).join(' | ') + '\n';
      });
    }
    output += '\n';
  });

  output += '═══════════════════════════════════════════════════════════════\n';
  return output;
}
