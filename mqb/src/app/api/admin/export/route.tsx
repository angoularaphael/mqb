import { NextResponse } from 'next/server';
import React from 'react';
import { renderToBuffer, Document, Page, Text, StyleSheet } from '@react-pdf/renderer';
import { eq } from 'drizzle-orm';
import { requireAdminSession } from '@/lib/api-auth';
import { db } from '@/db/index';
import { courses, grades, users } from '@/db/schema';
import { listUsersForAdmin } from '@/lib/data/admin-queries';
import { listCourses, listGroups, listRooms } from '@/lib/server/db-resources';

function csvEscape(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: string[][]) {
  const h = headers.map(csvEscape).join(',');
  const b = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
  return `${h}\n${b}`;
}

type ExportPayload = { title: string; csvName: string; pdfName: string; headers: string[]; rows: string[][] };

async function loadExport(type: string): Promise<ExportPayload | { error: string }> {
  if (type === 'users') {
    const list = await listUsersForAdmin();
    return {
      title: 'Utilisateurs MQB',
      csvName: 'utilisateurs.csv',
      pdfName: 'utilisateurs.pdf',
      headers: ['id', 'name', 'email', 'role', 'status'],
      rows: list.map((u) => [u.id, u.name, u.email, u.role, u.status]),
    };
  }
  if (type === 'groups') {
    const gs = await listGroups();
    return {
      title: 'Groupes',
      csvName: 'groupes.csv',
      pdfName: 'groupes.pdf',
      headers: ['id', 'name', 'description', 'capacity', 'memberCount'],
      rows: gs.map((g) => [
        g.id,
        g.name,
        g.description ?? '',
        String(g.capacity ?? ''),
        String((g as { memberCount?: number }).memberCount ?? 0),
      ]),
    };
  }
  if (type === 'rooms') {
    const rs = await listRooms();
    return {
      title: 'Salles',
      csvName: 'salles.csv',
      pdfName: 'salles.pdf',
      headers: ['id', 'name', 'capacity', 'type'],
      rows: rs.map((r) => [r.id, r.name, String(r.capacity ?? ''), r.type ?? '']),
    };
  }
  if (type === 'courses') {
    const cs = await listCourses();
    return {
      title: 'Cours',
      csvName: 'cours.csv',
      pdfName: 'cours.pdf',
      headers: ['id', 'code', 'name', 'teacher_id', 'group_id', 'hours_total'],
      rows: cs.map((c) => [
        c.id,
        c.code,
        c.name,
        c.teacherId,
        c.groupId,
        String(c.hoursTotal ?? ''),
      ]),
    };
  }
  if (type === 'grades') {
    const gr = await db
      .select({
        id: grades.id,
        score: grades.score,
        feedback: grades.feedback,
        studentEmail: users.email,
        courseCode: courses.code,
      })
      .from(grades)
      .innerJoin(users, eq(grades.student_id, users.id))
      .innerJoin(courses, eq(grades.course_id, courses.id));
    return {
      title: 'Notes',
      csvName: 'notes.csv',
      pdfName: 'notes.pdf',
      headers: ['grade_id', 'course_code', 'student_email', 'score', 'feedback'],
      rows: gr.map((r) => [
        r.id,
        r.courseCode,
        r.studentEmail,
        String(r.score),
        r.feedback ?? '',
      ]),
    };
  }
  return { error: 'type inconnu (users|groups|rooms|courses|grades)' };
}

const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 8, fontFamily: 'Helvetica' },
  title: { fontSize: 14, marginBottom: 14, fontFamily: 'Helvetica-Bold' },
  header: { fontFamily: 'Helvetica-Bold', fontSize: 7, marginBottom: 10 },
});

async function toPdfBuffer(p: ExportPayload): Promise<Buffer> {
  const doc = (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{p.title}</Text>
        <Text style={pdfStyles.header}>{p.headers.join('  |  ')}</Text>
        {p.rows.map((row, i) => (
          <Text key={i} style={{ marginBottom: 2 }}>
            {row.map((c) => c.replace(/\n/g, ' ')).join('  ·  ')}
          </Text>
        ))}
      </Page>
    </Document>
  );
  return renderToBuffer(doc);
}

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'users';
  const format = searchParams.get('format') ?? 'csv';

  const payload = await loadExport(type);
  if ('error' in payload) {
    return NextResponse.json({ error: payload.error }, { status: 400 });
  }

  if (format === 'pdf') {
    const buf = await toPdfBuffer(payload);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${payload.pdfName}"`,
      },
    });
  }

  const content = toCsv(payload.headers, payload.rows);
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${payload.csvName}"`,
    },
  });
}
