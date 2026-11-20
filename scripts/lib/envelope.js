export function printEnvelope({ status, summary, artifacts = [], next_actions = [] }) {
  if (status !== 'success' && status !== 'warning' && status !== 'error') {
    throw new Error(`invalid envelope status: ${status}`);
  }
  process.stdout.write(JSON.stringify({ status, summary, artifacts, next_actions }) + '\n');
}

export function exitWith({ status, summary, artifacts, next_actions }) {
  printEnvelope({ status, summary, artifacts, next_actions });
  process.exit(status === 'error' ? 1 : 0);
}

export function fail(summary, next_actions = []) {
  exitWith({ status: 'error', summary, next_actions });
}

export function ok(summary, artifacts = [], next_actions = []) {
  exitWith({ status: 'success', summary, artifacts, next_actions });
}

export function warn(summary, artifacts = [], next_actions = []) {
  exitWith({ status: 'warning', summary, artifacts, next_actions });
}
