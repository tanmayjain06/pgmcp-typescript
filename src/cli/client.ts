// src/cli/client.ts
import { Command } from 'commander';
import Table from 'cli-table3';
import chalk from 'chalk';

interface ApiResponse {
  success: boolean;
  sql?: string;
  rowCount?: number;
  rows?: any[];
  error?: string;
}

class PGMCPClient {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async ask(question: string, dryRun = false): Promise<void> {
    try {
      console.log(chalk.blue('🤔 Asking:'), chalk.white(question));
      
      const url = `${this.baseUrl}/ask${dryRun ? '?dryRun=true' : ''}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });

      // Fix: Type assertion for JSON response
      const data = await response.json() as ApiResponse;

      if (!data.success) {
        console.error(chalk.red('❌ Error:'), data.error);
        return;
      }

      // Show SQL
      if (dryRun) {
        console.log(chalk.green('📝 Generated SQL:'));
        console.log(chalk.gray(data.sql));
        return;
      }

      console.log(chalk.green('📝 Generated SQL:'));
      console.log(chalk.gray(data.sql));
      console.log();

      // Display results in table format
      if (data.rows && data.rows.length > 0) {
        this.displayTable(data.rows);
        console.log(chalk.green(`\n✅ ${data.rowCount} rows returned`));
      } else {
        console.log(chalk.yellow('📭 No results found'));
      }

    } catch (error) {
      console.error(chalk.red('🚨 Connection error:'), error instanceof Error ? error.message : error);
    }
  }

  private displayTable(rows: any[]): void {
    if (!rows.length) return;

    // Get column names from first row
    const columns = Object.keys(rows[0]);
    
    // Create table with headers
    const table = new Table({
      head: columns.map(col => chalk.blue.bold(col)),
      style: {
        head: [],
        border: ['grey']
      }
    });

    // Add rows with nice formatting
    rows.forEach(row => {
      table.push(columns.map(col => {
        const value = row[col];
        if (value === null) return chalk.gray('NULL');
        if (typeof value === 'number') return chalk.cyan(value.toString());
        if (typeof value === 'boolean') return chalk.yellow(value.toString());
        if (typeof value === 'string' && value.length > 50) {
          return value.substring(0, 47) + '...';
        }
        return value.toString();
      }));
    });

    console.log(table.toString());
  }
}

// CLI setup
const program = new Command();
const client = new PGMCPClient();

program
  .name('pgmcp')
  .description('🐘 PostgreSQL Natural Language Query Tool')
  .version('1.0.0');

program
  .command('ask')
  .description('Ask a question in natural language')
  .argument('<question>', 'Question to ask the database')
  .option('-d, --dry-run', 'Show generated SQL without executing')
  .action(async (question: string, options) => {
    await client.ask(question, options.dryRun);
  });

// Parse command line arguments
program.parse();
