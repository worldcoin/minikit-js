import chalk from 'chalk';
import { Command } from 'commander';
import degit from 'degit';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'node:path';
import prompts from 'prompts';

const program = new Command();

interface CLIOptions {
  projectName?: string;
  install: boolean;
  auth: boolean;
}

async function run(): Promise<void> {
  program
    .name('create-mini-app')
    .description('Bootstrap a new Worldcoin Mini App project.')
    .argument('[project-name]', 'The name for the new project directory')
    .option('-i, --install', 'Install dependencies after cloning', true)
    .option('--no-install', 'Do not install dependencies after cloning')
    .option('-a, --auth', 'Runs npx auth secret to set up next-auth', true)
    .parse(process.argv);

  const options = program.opts<CLIOptions>();
  let projectName = program.args[0];

  if (!projectName) {
    const response = await prompts({
      type: 'text',
      name: 'projectName',
      message: 'What is the name of your project?',
      initial: 'my-world-app',
    });
    projectName = response.projectName;
  }

  if (!projectName) {
    console.error(chalk.red('Project name is required.'));
    process.exit(1);
  }

  const targetDir = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: `Directory ${chalk.cyan(projectName)} already exists. Overwrite?`,
      initial: false,
    });

    if (!overwrite) {
      console.log(chalk.yellow('Aborted.'));
      process.exit(0);
    }
    console.log(
      chalk.yellow(`Overwriting directory ${chalk.cyan(projectName)}...`),
    );
    await fs.remove(targetDir);
  }

  console.log(`Creating project ${chalk.cyan(projectName)}...`);

  try {
    // Use degit to clone the specific template directory
    const emitter = degit(
      'github:worldcoin/minikit-js/demo/next-15-template#main',
      {
        cache: false,
        force: true,
        verbose: false,
      },
    );

    emitter.on('info', (info) => {
      console.log(info.message);
    });

    await emitter.clone(targetDir);

    console.log(chalk.green('Template cloned successfully!'));

    // Prepare .env file
    const envSamplePath = path.join(targetDir, '.env.sample');
    const envLocalPath = path.join(targetDir, '.env.local');
    if (fs.existsSync(envSamplePath)) {
      await fs.copy(envSamplePath, envLocalPath);
      console.log(chalk.blue('Created .env.local from .env.sample'));
    }

    if (options.install) {
      console.log('Installing dependencies...');
      try {
        await execa('npm', ['install'], { cwd: targetDir, stdio: 'inherit' });
        console.log(chalk.green('Dependencies installed successfully!'));
      } catch (error) {
        console.error(chalk.red('Failed to install dependencies:'), error);
        console.log(
          chalk.yellow('Please install dependencies manually by running:'),
        );
        console.log(chalk.cyan(`  cd ${projectName}`));
        console.log(chalk.cyan('  npm install'));
      }
    }

    if (options.auth) {
      try {
        console.log('Setting up next-auth...');
        await execa('npx', ['auth', 'secret'], {
          cwd: targetDir,
          stdio: 'inherit',
        });
        console.log(chalk.green('next-auth setup successfully!'));
      } catch (error) {
        console.error(
          chalk.yellow(
            'Failed to setup next-auth, install will continue, you will need to run npx auth secret after install',
          ),
          error,
        );
      }
    }

    console.log(
      `\n${chalk.green('Success!')} Created ${chalk.cyan(projectName)} at ${chalk.cyan(targetDir)}\n`,
    );
    console.log('Inside that directory, you can run several commands:\n');
    console.log(chalk.cyan('  npm run dev'));
    console.log('We suggest that you begin by typing:\n');
    console.log(chalk.cyan(`  cd ${projectName}`));
    if (!options.install) {
      console.log(chalk.cyan('  npm install'));
    }
    console.log(chalk.cyan('  npm run dev\n'));
    console.log(
      chalk.blue(
        'Check the .env.local file and follow the setup instructions in README.md',
      ),
    );
    process.exit(0);
  } catch (error) {
    console.error(chalk.red('Failed to create project:'), error);
    await fs.remove(targetDir); // Clean up directory on failure
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(chalk.red('An unexpected error occurred:'), e);
  process.exit(1);
});
