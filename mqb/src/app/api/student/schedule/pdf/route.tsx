import { NextResponse } from 'next/server';
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import { requireStudentSession } from '@/lib/api-auth';
import { getStudentSchedule } from '@/lib/data/student-queries';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  title: { fontSize: 16, marginBottom: 16, fontFamily: 'Helvetica-Bold' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ddd', paddingVertical: 6 },
  cellDay: { width: '12%' },
  cellTime: { width: '18%' },
  cellCourse: { width: '40%' },
  cellRoom: { width: '30%' },
  head: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: '#333' },
  headText: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
});

export async function GET() {
  const auth = await requireStudentSession();
  if ('response' in auth) return auth.response;
  const schedule = await getStudentSchedule(auth.user.userId);
  const name = `${auth.user.firstName ?? ''} ${auth.user.lastName ?? ''}`.trim() || auth.user.email;

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Planning — {name}</Text>
        <View style={styles.head}>
          <Text style={[styles.cellDay, styles.headText]}>Jour</Text>
          <Text style={[styles.cellTime, styles.headText]}>Horaire</Text>
          <Text style={[styles.cellCourse, styles.headText]}>Cours</Text>
          <Text style={[styles.cellRoom, styles.headText]}>Salle</Text>
        </View>
        {schedule.map((s) => (
          <View key={s.id} style={styles.row} wrap={false}>
            <Text style={styles.cellDay}>{s.dayLabel}</Text>
            <Text style={styles.cellTime}>
              {s.startTime} – {s.endTime}
            </Text>
            <Text style={styles.cellCourse}>{s.course}</Text>
            <Text style={styles.cellRoom}>{s.room}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );

  const buf = await renderToBuffer(doc);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="planning-mqb.pdf"',
    },
  });
}
