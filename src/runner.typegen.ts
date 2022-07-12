// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    setResult: 'done.invoke.wp-bundler-build';
    setErrorResult: 'error.platform.wp-bundler-build';
    setChangedFiles: 'REBUILD';
    createDependencies: 'xstate.init';
    logSetup: 'xstate.init';
    resetResults: 'BUILD' | 'REBUILD';
    logBuildStart: 'BUILD' | 'REBUILD';
    setStartTime: 'BUILD' | 'REBUILD';
    logWatchError: 'error.platform.wp-bundler-build';
    reloadDevServer: 'done.invoke.wp-bundler-build';
    logWatchSuccess: 'done.invoke.wp-bundler-build';
    logBuildError: 'SETUP_FAILURE' | 'error.platform.wp-bundler-build';
    logBuildSuccess: 'done.invoke.wp-bundler-build' | 'CANCEL';
  };
  internalEvents: {
    'done.invoke.wp-bundler-build': {
      type: 'done.invoke.wp-bundler-build';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'error.platform.wp-bundler-build': { type: 'error.platform.wp-bundler-build'; data: unknown };
    'xstate.init': { type: 'xstate.init' };
    'done.invoke.wp-bundler-watchers': {
      type: 'done.invoke.wp-bundler-watchers';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'error.platform.wp-bundler-watchers': { type: 'error.platform.wp-bundler-watchers'; data: unknown };
  };
  invokeSrcNameMap: {
    setupServices: 'done.invoke.wp-bundler-watchers';
    build: 'done.invoke.wp-bundler-build';
  };
  missingImplementations: {
    actions: never;
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingServices: {
    setupServices: 'xstate.init';
    build: 'BUILD' | 'REBUILD';
  };
  eventsCausingGuards: {
    isWatchMode: 'done.invoke.wp-bundler-build' | 'error.platform.wp-bundler-build';
  };
  eventsCausingDelays: {};
  matchesStates:
    | 'idle'
    | 'building'
    | 'watching'
    | 'watching.error'
    | 'watching.success'
    | 'error'
    | 'success'
    | { watching?: 'error' | 'success' };
  tags: never;
}
