import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

const DB_PATH = path.join(os.homedir(), '.habits.db');

export interface Habit {
  id: number;
  name: string;
  created_at: string;
}

export interface Completion {
  id: number;
  habit_id: number;
  completed_date: string;
}

export function getDb(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      completed_date TEXT NOT NULL,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
      UNIQUE(habit_id, completed_date)
    );
  `);

  return db;
}

export function addHabit(db: Database.Database, name: string): Habit | null {
  try {
    const stmt = db.prepare('INSERT INTO habits (name) VALUES (?)');
    const result = stmt.run(name);
    return {
      id: result.lastInsertRowid as number,
      name,
      created_at: new Date().toISOString()
    };
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return null;
    }
    throw err;
  }
}

export function getAllHabits(db: Database.Database): Habit[] {
  return db.prepare('SELECT * FROM habits ORDER BY name').all() as Habit[];
}

export function getHabitByName(db: Database.Database, name: string): Habit | undefined {
  return db.prepare('SELECT * FROM habits WHERE name = ?').get(name) as Habit | undefined;
}

export function markDone(db: Database.Database, habitId: number, date: string): boolean {
  try {
    const stmt = db.prepare('INSERT INTO completions (habit_id, completed_date) VALUES (?, ?)');
    stmt.run(habitId, date);
    return true;
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return false;
    }
    throw err;
  }
}

export function getCompletions(db: Database.Database, habitId: number): string[] {
  const rows = db.prepare(
    'SELECT completed_date FROM completions WHERE habit_id = ? ORDER BY completed_date DESC'
  ).all(habitId) as { completed_date: string }[];
  return rows.map(r => r.completed_date);
}

export function calculateStreak(completions: string[]): number {
  if (completions.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates = completions
    .map(d => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
    .sort((a, b) => b - a);

  const oneDay = 24 * 60 * 60 * 1000;
  let streak = 0;
  let checkDate = today.getTime();

  // If not done today, check if done yesterday
  if (dates[0] !== checkDate) {
    checkDate -= oneDay;
    if (dates[0] !== checkDate) {
      return 0;
    }
  }

  for (const date of dates) {
    if (date === checkDate) {
      streak++;
      checkDate -= oneDay;
    } else if (date < checkDate) {
      break;
    }
  }

  return streak;
}

export function getStats(db: Database.Database): {
  totalHabits: number;
  totalCompletions: number;
  completionsThisWeek: number;
  completionsToday: number;
} {
  const totalHabits = (db.prepare('SELECT COUNT(*) as count FROM habits').get() as { count: number }).count;
  const totalCompletions = (db.prepare('SELECT COUNT(*) as count FROM completions').get() as { count: number }).count;

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const completionsToday = (db.prepare(
    'SELECT COUNT(*) as count FROM completions WHERE completed_date = ?'
  ).get(today) as { count: number }).count;

  const completionsThisWeek = (db.prepare(
    'SELECT COUNT(*) as count FROM completions WHERE completed_date >= ?'
  ).get(weekAgo) as { count: number }).count;

  return { totalHabits, totalCompletions, completionsThisWeek, completionsToday };
}
