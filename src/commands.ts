import chalk from 'chalk';
import * as db from './db';

export function add(name: string): void {
  const database = db.getDb();
  const habit = db.addHabit(database, name);

  if (habit) {
    console.log(chalk.green('✓') + ` Added habit: ${chalk.bold(name)}`);
  } else {
    console.log(chalk.yellow('!') + ` Habit "${name}" already exists`);
  }

  database.close();
}

export function list(): void {
  const database = db.getDb();
  const habits = db.getAllHabits(database);

  if (habits.length === 0) {
    console.log(chalk.gray('No habits yet. Add one with: habits add "Exercise"'));
    database.close();
    return;
  }

  console.log(chalk.bold('\n📋 Your Habits\n'));

  const today = new Date().toISOString().split('T')[0];

  for (const habit of habits) {
    const completions = db.getCompletions(database, habit.id);
    const streak = db.calculateStreak(completions);
    const doneToday = completions.includes(today);

    const status = doneToday
      ? chalk.green('✓')
      : chalk.gray('○');

    const streakText = streak > 0
      ? chalk.yellow(` 🔥 ${streak} day${streak > 1 ? 's' : ''}`)
      : '';

    console.log(`  ${status} ${habit.name}${streakText}`);
  }

  console.log();
  database.close();
}

export function done(name: string): void {
  const database = db.getDb();
  const habit = db.getHabitByName(database, name);

  if (!habit) {
    console.log(chalk.red('✗') + ` Habit "${name}" not found`);
    database.close();
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const marked = db.markDone(database, habit.id, today);

  if (marked) {
    const completions = db.getCompletions(database, habit.id);
    const streak = db.calculateStreak(completions);

    console.log(chalk.green('✓') + ` Marked "${name}" as done for today!`);
    if (streak > 1) {
      console.log(chalk.yellow(`  🔥 ${streak} day streak!`));
    }
  } else {
    console.log(chalk.yellow('!') + ` Already completed "${name}" today`);
  }

  database.close();
}

export function stats(): void {
  const database = db.getDb();
  const { totalHabits, totalCompletions, completionsThisWeek, completionsToday } = db.getStats(database);

  console.log(chalk.bold('\n📊 Statistics\n'));
  console.log(`  Total habits:        ${chalk.cyan(totalHabits)}`);
  console.log(`  Total completions:   ${chalk.cyan(totalCompletions)}`);
  console.log(`  Completed today:     ${chalk.green(completionsToday)}`);
  console.log(`  Completed this week: ${chalk.yellow(completionsThisWeek)}`);

  if (totalHabits > 0) {
    const habits = db.getAllHabits(database);
    let bestStreak = 0;
    let bestHabit = '';

    for (const habit of habits) {
      const completions = db.getCompletions(database, habit.id);
      const streak = db.calculateStreak(completions);
      if (streak > bestStreak) {
        bestStreak = streak;
        bestHabit = habit.name;
      }
    }

    if (bestStreak > 0) {
      console.log(`\n  🏆 Best streak: ${chalk.yellow(bestStreak)} days (${bestHabit})`);
    }
  }

  console.log();
  database.close();
}
