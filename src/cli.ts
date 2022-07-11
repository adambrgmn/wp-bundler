import { interpret } from 'xstate';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

import { createStateMachine } from './state-machine';
import { Mode } from './types';

export async function cli() {
  let argv = await yargs(hideBin(process.argv))
    .command(
      'build',
      'Create production ready version of your project',
      {
        mode: {
          alias: 'm',
          default: 'prod' as Mode,
          choices: ['dev', 'prod'],
          description: 'Version of your source to output',
        },
        cwd: {
          description: 'Optional path to your project',
          type: 'string',
        },
      },
      (argv) => {
        let machine = createStateMachine(argv);
        let service = interpret(machine);

        service.subscribe((state) => {
          if (state.matches('success')) process.exit(0);
          if (state.matches('error')) process.exit(1);
        });

        service.start();
      },
    )
    .command(
      'dev',
      'Run a development server',
      {
        host: {
          alias: 'h',
          default: 'localhost',
          description: 'Host to bind the server to',
        },
        port: {
          alias: 'p',
          default: 3000,
          description: 'Port to bind the server to',
        },
        mode: {
          alias: 'm',
          default: 'dev' as Mode,
          choices: ['dev', 'prod'],
          description: 'Version of your source to output',
        },
        cwd: {
          description: 'Optional path to your project',
          type: 'string',
        },
      },
      (argv) => {
        let machine = createStateMachine({ ...argv, watch: true });
        let service = interpret(machine);

        service.subscribe((state) => {
          if (state.matches('success')) process.exit(0);
          if (state.matches('error')) process.exit(1);
        });

        service.start();
      },
    )
    .parse();

  if (argv._.length === 0) {
    console.warn(
      'Using wp-bundler without a sub command is deprecated and will be removed in the next major release.\n' +
        'Instead you can use `wp-bundler build` or `wp-bundler dev`.\n\n' +
        'See wp-bundler --help for more information.',
    );

    let machine = createStateMachine({
      ...argv,
      mode: argv.watch ? 'dev' : 'prod',
      watch: typeof argv.watch === 'boolean' ? argv.watch : false,
    });
    let service = interpret(machine);

    service.subscribe((state) => {
      if (state.matches('success')) process.exit(0);
      if (state.matches('error')) process.exit(1);
    });

    service.start();
  }
}
