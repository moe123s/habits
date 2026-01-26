# habits

A simple CLI habit tracker with streak tracking.

## Installation

```bash
npm install -g .
```

Or run directly:

```bash
npx habits <command>
```

## Usage

### Add a habit

```bash
habits add "Exercise"
habits add "Reading"
habits add "Meditation"
```

### List habits with streaks

```bash
habits list
```

Output:
```
📋 Your Habits

  ✓ Exercise 🔥 5 days
  ○ Reading
  ✓ Meditation 🔥 3 days
```

### Mark a habit as done

```bash
habits done "Exercise"
```

### View statistics

```bash
habits stats
```

Output:
```
📊 Statistics

  Total habits:        3
  Total completions:   15
  Completed today:     2
  Completed this week: 8

  🏆 Best streak: 5 days (Exercise)
```

## Data Storage

Habits are stored in `~/.habits.db` (SQLite).

## License

MIT
