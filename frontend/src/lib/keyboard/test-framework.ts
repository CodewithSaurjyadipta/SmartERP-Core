// ============================================================
// SmartERP Keyboard Framework — Automated Unit Verification
// ============================================================

import { KeyboardManager } from './keyboard-manager';
import { normalizeKeyCombo } from './platform';
import { validateKeyCombo, parseShortcut } from './shortcut-parser';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('🧪 Starting Keyboard Command Framework Tests...');
  const manager = new KeyboardManager();

  // ── Test 1: Shortcut Parser and Validation ──────────────────
  console.log('Testing Shortcut Parser...');
  assert(validateKeyCombo('Cmd+Shift+P') === true, 'Cmd+Shift+P should be a valid combination');
  assert(validateKeyCombo('Ctrl+S') === true, 'Ctrl+S should be valid');
  assert(validateKeyCombo('Alt+') === false, 'Empty key in combination should be invalid');
  assert(validateKeyCombo('Cmd+Shift') === false, 'Modifiers only should be invalid');
  
  const parsed = parseShortcut('Cmd+Shift+S');
  assert(parsed !== null, 'Parsed shortcut should not be null');
  assert(parsed!.key === 's', 'Key should be "s"');
  assert(parsed!.modifiers.includes('cmd'), 'Modifiers should include "cmd"');

  // ── Test 2: Platform Normalization ───────────────────────────
  console.log('Testing Platform Normalization...');
  // Mock isMac to true/false by writing custom platform behavior or verifying outputs
  const norm1 = normalizeKeyCombo('Shift+Cmd+S');
  assert(norm1.includes('s'), 'Normalized combo must include key "s"');
  assert(norm1.includes('shift'), 'Normalized combo must include "shift"');

  // ── Test 3: Context Stack Traversal ──────────────────────────
  console.log('Testing Context Stack Traversal...');
  manager.context.push('masters:ledgers');
  assert(manager.context.has('masters:ledgers'), 'masters:ledgers context should be active');
  assert(manager.context.getStack().includes('global'), 'global context should remain active');
  
  manager.context.pop('masters:ledgers');
  assert(!manager.context.has('masters:ledgers'), 'masters:ledgers context should be popped');
  assert(manager.context.getStack().length === 1, 'Stack should return to root size');

  // ── Test 4: Command Registry & Dispatch ──────────────────────
  console.log('Testing Command Registry & Dispatch...');
  let handlerCalled: boolean = false;
  manager.registerCommand({
    id: 'test.save',
    title: 'Test Save',
    description: 'Verifies command dispatch pipeline',
    category: 'Test',
    defaultShortcut: 'Alt+S',
    contexts: ['editing'],
    permissions: []
  }, () => {
    handlerCalled = true;
    return 'success';
  });

  // Try to dispatch without active context
  const res1 = await manager.dispatch('test.save');
  assert(res1 === undefined, 'Dispatch should return undefined when context is inactive');
  assert(!handlerCalled, 'Handler should not be called');

  // Push required context and dispatch again
  manager.context.push('editing');
  const res2 = await manager.dispatch('test.save');
  assert(res2 === 'success', 'Dispatch should succeed when context is active');
  assert(handlerCalled, 'Handler should be called');

  // ── Test 5: Permission Guards ───────────────────────────────
  console.log('Testing Permission Guards...');
  let adminHandlerCalled: boolean = false;
  manager.registerCommand({
    id: 'test.admin',
    title: 'Admin Command',
    description: 'Requires superuser privileges',
    category: 'Test',
    defaultShortcut: 'Alt+A',
    contexts: ['global'],
    permissions: ['admin:write']
  }, () => {
    adminHandlerCalled = true;
  });

  // Attempt dispatch without permissions
  await manager.dispatch('test.admin');
  assert(!adminHandlerCalled, 'Admin command should be blocked without correct permissions');

  // Seed permissions and retry
  manager.permission.updateConfig({ permissions: ['admin:write'] });
  await manager.dispatch('test.admin');
  assert(adminHandlerCalled, 'Admin command should execute once permissions are met');

  // ── Test 6: Concurrency Queue & Double Save Prevention ─────
  console.log('Testing Concurrency Queue...');
  let runningSavesCount = 0;
  
  manager.registerCommand({
    id: 'test.slow-save',
    title: 'Slow Save',
    description: 'Mock slow saving execution',
    category: 'Test',
    defaultShortcut: 'Alt+W',
    contexts: ['global'],
    permissions: []
  }, async () => {
    runningSavesCount++;
    await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
    return 'done';
  });

  // Fire first slow save
  const p1 = manager.dispatch('test.slow-save');
  
  // Fire second slow save immediately (should get dropped due to 'drop-duplicate' policy)
  let p2Rejected = false;
  try {
    await manager.dispatch('test.slow-save');
  } catch (err) {
    p2Rejected = true;
  }

  assert(p2Rejected === true, 'Concurrent slow save must be dropped and promise rejected');
  
  const finalResult = await p1;
  assert(finalResult === 'done', 'Original save should finish successfully');
  assert(runningSavesCount === 1, 'Only one handler execution should have run');

  console.log('✅ All Keyboard Command Framework unit tests passed successfully!');
}

runTests().catch(err => {
  console.error('❌ Keyboard Framework test suite failed:', err);
  process.exit(1);
});
