#!/usr/bin/env node

import { program } from 'commander';
import * as commands from './commands';

program
  .name('habits')
  .description('CLI habit tracker with streaks')
  .version('1.0.0');

program
  .command('add <name>')
  .description('Add a new habit to track')
  .action((name: string) => {
    commands.add(name);
  });

program
  .command('list')
  .description('List all habits with streaks')
  .action(() => {
    commands.list();
  });

program
  .command('done <name>')
  .description('Mark a habit as complete for today')
  .action((name: string) => {
    commands.done(name);
  });

program
  .command('stats')
  .description('Show completion statistics')
  .action(() => {
    commands.stats();
  });

program.parse();
