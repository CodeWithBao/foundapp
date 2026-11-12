import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

function load(path, name, apiClient) {
  const code = fs.readFileSync(path, 'utf8').replace(/^import .*;\r?\n/gm, '').replace(`export default ${name};`, `globalThis.service = ${name};`).replaceAll('export const ', 'const ');
  const context = { apiClient, STORAGE_KEYS: {}, storageService: { get() { throw new Error('Mock storage must not be read'); } }, mergeCanonicalLocations: x => x, normalizeItem: x => ({ ...x, userId: x.user_id }), setTimeout, URLSearchParams, Event, window: { dispatchEvent() {} } };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.service;
}
const calls = [];
const users = [{ id: 12, name: 'Real user', email: 'real@example.test', role: 'USER', status: 'BANNED', student_id: 'SV12', created_at: '2026-11-12' }];
const userService = load('src/services/userService.js', 'userService', {
  get: async () => users,
  put: async (url, body) => { calls.push({ url, body }); return null; },
});
const mapped = await userService.getUsers();
assert.equal(mapped[0].status, 'blocked');
assert.equal(mapped[0].studentId, 'SV12');
await userService.changeRole('12', 'STAFF');
assert.equal(calls[0].body.status, 'BANNED');
assert.equal(calls[0].body.role, 'STAFF');
await userService.toggleBlock('12');
assert.equal(calls[1].body.status, 'ACTIVE');
let pages = 0;
const adminService = load('src/services/adminService.js', 'adminService', {
  get: async url => {
    if (url.startsWith('/items')) return { items: [{ id: ++pages, user_id: 12 }], total: 3 };
    throw new Error('Backend offline');
  },
});
assert.equal((await adminService.getAllItems()).length, 3);
assert.equal(pages, 3);
await assert.rejects(adminService.getStats(), /Backend offline/);
const notifications = load('src/services/notificationService.js', 'notificationService', {
  get: async () => [{ id: 1, is_read: false, type: 'chat_message' }, { id: 2, is_read: true }],
  put: async () => { throw new Error('Backend offline'); },
});
assert.equal(await notifications.getUnreadCount(12), 1);
await assert.rejects(notifications.markAsRead(1), /Backend offline/);
console.log('PASS: real user mapping, role/status persistence requests, all item pages, no fake admin/notification fallback.');
