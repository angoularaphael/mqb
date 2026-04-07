import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcryptjs from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function seed() {
  const db = await open({
    filename: process.env.DATABASE_PATH || path.join(__dirname, '..', 'database.db'),
    driver: sqlite3.Database,
  });

  await db.exec('PRAGMA foreign_keys = ON');

  try {
    console.log('🌱 Seeding database...');

    // Create tables
    await db.exec(`
      DROP TABLE IF EXISTS attendance;
      DROP TABLE IF EXISTS schedules;
      DROP TABLE IF EXISTS grades;
      DROP TABLE IF EXISTS courses;
      DROP TABLE IF EXISTS sessions;
      DROP TABLE IF EXISTS users;

      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('student', 'teacher', 'admin')) NOT NULL DEFAULT 'student',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        expiresAt INTEGER NOT NULL,
        FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE courses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        teacherId TEXT NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(teacherId) REFERENCES users(id)
      );

      CREATE TABLE schedules (
        id TEXT PRIMARY KEY,
        courseId TEXT NOT NULL,
        dayOfWeek TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT NOT NULL,
        room TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(courseId) REFERENCES courses(id)
      );

      CREATE TABLE grades (
        id TEXT PRIMARY KEY,
        studentId TEXT NOT NULL,
        courseId TEXT NOT NULL,
        grade REAL NOT NULL,
        feedback TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(studentId) REFERENCES users(id),
        FOREIGN KEY(courseId) REFERENCES courses(id)
      );

      CREATE TABLE attendance (
        id TEXT PRIMARY KEY,
        studentId TEXT NOT NULL,
        scheduleId TEXT NOT NULL,
        status TEXT CHECK(status IN ('present', 'absent', 'late')) NOT NULL,
        date INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(studentId) REFERENCES users(id),
        FOREIGN KEY(scheduleId) REFERENCES schedules(id)
      );
    `);

    // Hash password
    const hashedPassword = await bcryptjs.hash('MQB@2024!', 10);

    // Create users
    const adminId = uuid();
    const teacher1Id = uuid();
    const teacher2Id = uuid();
    const student1Id = uuid();
    const student2Id = uuid();
    const student3Id = uuid();

    const users = [
      { id: adminId, email: 'admin@mqb.local', firstName: 'Admin', lastName: 'MQB', role: 'admin' },
      { id: teacher1Id, email: 'prof.martin@mqb.local', firstName: 'Martin', lastName: 'Dupont', role: 'teacher' },
      { id: teacher2Id, email: 'prof.sophie@mqb.local', firstName: 'Sophie', lastName: 'Martin', role: 'teacher' },
      { id: student1Id, email: 'etudiant1@mqb.local', firstName: 'Jean', lastName: 'Blanc', role: 'student' },
      { id: student2Id, email: 'etudiant2@mqb.local', firstName: 'Marie', lastName: 'Robert', role: 'student' },
      { id: student3Id, email: 'etudiant3@mqb.local', firstName: 'Pierre', lastName: 'Lefebvre', role: 'student' },
    ];

    for (const user of users) {
      await db.run(
        'INSERT INTO users (id, email, firstName, lastName, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [user.id, user.email, user.firstName, user.lastName, hashedPassword, user.role, Date.now(), Date.now()]
      );
    }

    console.log('✅ Users created');

    // Create courses
    const course1Id = uuid();
    const course2Id = uuid();

    await db.run(
      'INSERT INTO courses (id, name, teacherId, description, created_at) VALUES (?, ?, ?, ?, ?)',
      [course1Id, 'Informatique', teacher1Id, 'Cours d\'informatique', Date.now()]
    );

    await db.run(
      'INSERT INTO courses (id, name, teacherId, description, created_at) VALUES (?, ?, ?, ?, ?)',
      [course2Id, 'Réseaux', teacher2Id, 'Cours de réseaux', Date.now()]
    );

    console.log('✅ Courses created');

    // Create schedules
    const days = ['Lundi', 'Mercredi', 'Vendredi'];
    for (let i = 0; i < 6; i++) {
      const scheduleId = uuid();
      const dayIndex = i % 3;
      await db.run(
        'INSERT INTO schedules (id, courseId, dayOfWeek, startTime, endTime, room, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          scheduleId,
          i < 3 ? course1Id : course2Id,
          days[dayIndex],
          `${9 + i}:00`,
          `${10 + i}:00`,
          `Salle ${i + 1}`,
          Date.now(),
        ]
      );
    }

    console.log('✅ Schedules created');

    // Create grades
    for (const student of [student1Id, student2Id, student3Id]) {
      for (let i = 0; i < 2; i++) {
        const gradeId = uuid();
        const courseId = i === 0 ? course1Id : course2Id;
        const grade = Math.floor(Math.random() * 10) + 10; // 10-20
        await db.run(
          'INSERT INTO grades (id, studentId, courseId, grade, feedback, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [gradeId, student, courseId, grade, 'Bien', Date.now()]
        );
      }
    }

    console.log('✅ Grades created');

    // Create attendance
    const scheduleList = await db.all('SELECT id FROM schedules');
    for (const student of [student1Id, student2Id, student3Id]) {
      for (const schedule of scheduleList) {
        const attendanceId = uuid();
        const statuses = ['present', 'absent', 'late'];
        const status = statuses[Math.floor(Math.random() * 3)];
        await db.run(
          'INSERT INTO attendance (id, studentId, scheduleId, status, date, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [attendanceId, student, schedule.id, status, Math.floor(Date.now() / 1000), Date.now()]
        );
      }
    }

    console.log('✅ Attendance created');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Test credentials:');
    console.log('  Admin: admin@mqb.local | MQB@2024!');
    console.log('  Teacher: prof.martin@mqb.local | MQB@2024!');
    console.log('  Student: etudiant1@mqb.local | MQB@2024!');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

seed();
