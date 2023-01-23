// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  internalEvents: {
    'done.invoke.wp-bundler-build': {
      type: 'done.invoke.wp-bundler-build';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.wp-bundler-watchers': {
      type: 'done.invoke.wp-bundler-watchers';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'error.platform.wp-bundler-build': { type: 'error.platform.wp-bundler-build'; data: unknown };
    'error.platform.wp-bundler-watchers': { type: 'error.platform.wp-bundler-watchers'; data: unknown };
    'xstate.init': { type: 'xstate.init' };
  };
  invokeSrcNameMap: {
    build: 'done.invoke.wp-bundler-build';
    setupServices: 'done.invoke.wp-bundler-watchers';
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    logBuildError: 'SETUP_FAILURE' | 'error.platform.wp-bundler-build';
    logBuildStart: 'BUILD' | 'REBUILD';
    logBuildSuccess: 'CANCEL' | 'done.invoke.wp-bundler-build';
    logSetup: 'xstate.init';
    logWatchError: 'error.platform.wp-bundler-build';
    logWatchSuccess: 'done.invoke.wp-bundler-build';
    reloadDevServer: 'done.invoke.wp-bundler-build';
    resetResults: 'BUILD' | 'REBUILD';
    setChangedFiles: 'REBUILD';
    setErrorResult: 'error.platform.wp-bundler-build';
    setResult: 'done.invoke.wp-bundler-build';
    setStartTime: 'BUILD' | 'REBUILD';
    writeOutput: 'done.invoke.wp-bundler-build';
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    isWatchMode: 'done.invoke.wp-bundler-build' | 'error.platform.wp-bundler-build';
  };
  eventsCausingServices: {
    build: 'BUILD' | 'REBUILD';
    setupServices: 'xstate.init';
  };
  matchesStates:
    | 'building'
    | 'error'
    | 'idle'
    | 'success'
    | 'watching'
    | 'watching.error'
    | 'watching.success'
    | { watching?: 'error' | 'success' };
  tags: never;
}
// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  internalEvents: {
    'done.invoke.wp-bundler-build': {
      type: 'done.invoke.wp-bundler-build';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.wp-bundler-watchers': {
      type: 'done.invoke.wp-bundler-watchers';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'error.platform.wp-bundler-build': { type: 'error.platform.wp-bundler-build'; data: unknown };
    'error.platform.wp-bundler-watchers': { type: 'error.platform.wp-bundler-watchers'; data: unknown };
    'xstate.init': { type: 'xstate.init' };
  };
  invokeSrcNameMap: {
    build: 'done.invoke.wp-bundler-build';
    setupServices: 'done.invoke.wp-bundler-watchers';
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    logBuildError: 'SETUP_FAILURE' | 'error.platform.wp-bundler-build';
    logBuildStart: 'BUILD' | 'REBUILD';
    logBuildSuccess: 'CANCEL' | 'done.invoke.wp-bundler-build';
    logSetup: 'xstate.init';
    logWatchError: 'error.platform.wp-bundler-build';
    logWatchSuccess: 'done.invoke.wp-bundler-build';
    reloadDevServer: 'done.invoke.wp-bundler-build';
    resetResults: 'BUILD' | 'REBUILD';
    setChangedFiles: 'REBUILD';
    setErrorResult: 'error.platform.wp-bundler-build';
    setResult: 'done.invoke.wp-bundler-build';
    setStartTime: 'BUILD' | 'REBUILD';
    writeOutput: 'done.invoke.wp-bundler-build';
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    isWatchMode: 'done.invoke.wp-bundler-build' | 'error.platform.wp-bundler-build';
  };
  eventsCausingServices: {
    build: 'BUILD' | 'REBUILD';
    setupServices: 'xstate.init';
  };
  matchesStates:
    | 'building'
    | 'error'
    | 'idle'
    | 'success'
    | 'watching'
    | 'watching.error'
    | 'watching.success'
    | { watching?: 'error' | 'success' };
  tags: never;
}
