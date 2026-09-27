const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const stateCopy = {
  idle: 'Cú DNTU đang đứng chờ', welcome: 'Cú DNTU chào người dùng', thinking: 'Cú DNTU đang suy nghĩ',
  typing: 'Cú DNTU đang trả lời', searching: 'Cú DNTU cầm kính lúp tìm đồ', found: 'Cú DNTU vui vì tìm thấy đồ',
  not_found: 'Cú DNTU chưa tìm thấy đồ', success: 'Cú DNTU báo thao tác thành công', warning: 'Cú DNTU cảnh báo',
  error: 'Cú DNTU báo xảy ra lỗi', sleeping: 'Cú DNTU đang ngủ', login: 'Cú DNTU hỗ trợ đăng nhập',
  register: 'Cú DNTU hỗ trợ đăng ký', user: 'Cú DNTU ở chế độ sinh viên', staff: 'Cú DNTU kết nối nhân viên',
  admin: 'Cú DNTU ở chế độ quản trị viên'
};
const roleStates = { guest: 'welcome', user: 'user', staff: 'staff', admin: 'admin' };
const roleNames = { guest: 'Guest', user: 'User · Sinh viên', staff: 'Staff · Nhân viên', admin: 'Admin · Quản trị viên' };
const categories = [['phone','Điện thoại'],['laptop','Laptop'],['wallet','Ví tiền'],['student-card','Thẻ sinh viên'],['key','Chìa khóa'],['headphones','Tai nghe'],['watch','Đồng hồ'],['books','Sách/vở'],['bottle','Bình nước'],['backpack','Balo/túi xách'],['documents','Giấy tờ'],['clothes','Quần áo'],['other','Vật dụng khác']];
const IDLE_SLEEP_MS = 90_000;

let muted = localStorage.getItem('dntu-muted') === 'true';
let humanMode = false;
let supportConnected = false;
let unreadCount = 0;
let watchedCase = localStorage.getItem('dntu-watch-LF-0001') === 'true';
let currentRole = 'guest';
let mascotSleeping = false;
let idleTimer = 0;
let lastActivityAt = Date.now();
let suppressLauncherClick = false;
let currentFlow = 'home';
let flowToken = 0;
const flowTimers = new Set();
const seenMatchIds = new Set(loadSeenMatchIds());
const dragState = { active: false, moved: false, pointerId: null, offsetX: 0, offsetY: 0, startX: 0, startY: 0 };

function loadSeenMatchIds() {
  try {
    const value = JSON.parse(localStorage.getItem('dntu-seen-match-ids') || '[]');
    return Array.isArray(value) ? value.slice(-100) : [];
  } catch (_) { return []; }
}

function setState(state) {
  const mascot = $('#mascot');
  mascot.src = `mascot/animated/${state}.webp?state=${Date.now()}`;
  mascot.alt = stateCopy[state];
  $('#state-label').textContent = state;
  $('#state-pill').textContent = state.toUpperCase();
  $$('.state').forEach((button) => button.classList.toggle('active', button.dataset.state === state));
}

function scheduleIdleSleep() {
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(goToSleep, IDLE_SLEEP_MS);
}

function goToSleep() {
  window.clearTimeout(idleTimer);
  if (humanMode || supportConnected || unreadCount > 0 || !$('#typing-indicator').hidden) {
    scheduleIdleSleep();
    return;
  }
  mascotSleeping = true;
  $('#chat-widget').classList.add('sleep-mode');
  $('#presence').textContent = 'Đang ngủ · Chạm để đánh thức';
  if ($('#chat-widget').classList.contains('is-hidden')) {
    $('#chat-launcher img').src = 'mascot/animated/sleeping.webp';
    $('#chat-launcher').classList.add('is-sleeping');
  } else {
    setState('sleeping');
  }
}

function wakeMascot() {
  if (!mascotSleeping) return;
  mascotSleeping = false;
  $('#chat-widget').classList.remove('sleep-mode');
  $('#chat-launcher').classList.remove('is-sleeping');
  $('#chat-launcher img').src = 'mascot/animated/welcome.webp';
  if (!$('#chat-widget').classList.contains('is-hidden')) {
    setState(humanMode ? 'staff' : roleStates[currentRole]);
    $('#presence').textContent = humanMode
      ? (supportConnected ? 'Nhân viên #07 · Trực tuyến' : 'Chọn nội dung cần hỗ trợ')
      : `${roleNames[currentRole]} · Đang hoạt động`;
  }
}

function recordActivity() {
  const now = Date.now();
  if (!mascotSleeping && now - lastActivityAt < 900) return;
  lastActivityAt = now;
  wakeMascot();
  scheduleIdleSleep();
}

function moveLauncher(left, top, persist = false) {
  const launcher = $('#chat-launcher');
  const width = launcher.offsetWidth || 124;
  const height = launcher.offsetHeight || 124;
  const safeLeft = Math.max(8, Math.min(left, window.innerWidth - width - 8));
  const safeTop = Math.max(8, Math.min(top, window.innerHeight - height - 8));
  launcher.style.left = `${safeLeft}px`;
  launcher.style.top = `${safeTop}px`;
  launcher.style.right = 'auto';
  launcher.style.bottom = 'auto';
  if (persist) localStorage.setItem('dntu-launcher-position', JSON.stringify({ left: safeLeft, top: safeTop }));
}

function restoreLauncherPosition() {
  try {
    const saved = JSON.parse(localStorage.getItem('dntu-launcher-position') || 'null');
    if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) moveLauncher(saved.left, saved.top);
  } catch (_) {}
}

function beginLauncherDrag(event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  const launcher = $('#chat-launcher');
  const rect = launcher.getBoundingClientRect();
  dragState.active = true;
  dragState.moved = false;
  dragState.pointerId = event.pointerId;
  dragState.offsetX = event.clientX - rect.left;
  dragState.offsetY = event.clientY - rect.top;
  dragState.startX = event.clientX;
  dragState.startY = event.clientY;
  launcher.classList.add('is-dragging');
  launcher.setPointerCapture?.(event.pointerId);
}

function dragLauncher(event) {
  if (!dragState.active || event.pointerId !== dragState.pointerId) return;
  if (Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY) > 4) dragState.moved = true;
  if (!dragState.moved) return;
  event.preventDefault();
  moveLauncher(event.clientX - dragState.offsetX, event.clientY - dragState.offsetY);
}

function endLauncherDrag(event) {
  if (!dragState.active || event.pointerId !== dragState.pointerId) return;
  const launcher = $('#chat-launcher');
  dragState.active = false;
  launcher.classList.remove('is-dragging');
  try { launcher.releasePointerCapture?.(event.pointerId); } catch (_) {}
  if (dragState.moved) {
    const rect = launcher.getBoundingClientRect();
    moveLauncher(rect.left, rect.top, true);
    suppressLauncherClick = true;
  }
}

function moveLauncherWithKeyboard(event) {
  const delta = event.shiftKey ? 50 : 18;
  const directions = { ArrowLeft: [-delta, 0], ArrowRight: [delta, 0], ArrowUp: [0, -delta], ArrowDown: [0, delta] };
  if (!directions[event.key]) return;
  event.preventDefault();
  const rect = $('#chat-launcher').getBoundingClientRect();
  moveLauncher(rect.left + directions[event.key][0], rect.top + directions[event.key][1], true);
}

function clearFlowTimers() {
  flowTimers.forEach((timer) => window.clearTimeout(timer));
  flowTimers.clear();
}

function flowLater(callback, delay, token = flowToken) {
  const timer = window.setTimeout(() => {
    flowTimers.delete(timer);
    if (token === flowToken) callback();
  }, delay);
  flowTimers.add(timer);
}

function startFlow(type, title, subtitle = 'Bấm quay lại nếu bạn muốn chọn chức năng khác') {
  clearFlowTimers();
  flowToken += 1;
  currentFlow = type;
  $('#flow-messages').replaceChildren();
  $('#home-menu').hidden = true;
  $('#flow-view').hidden = false;
  $('#messages').classList.add('flow-active');
  $('#flow-title').textContent = title;
  $('#flow-subtitle').textContent = subtitle;
  $('#typing-indicator').hidden = true;
  $('#typing-indicator small').textContent = 'Cú DNTU đang nhập';
  $('#messages').scrollTo({ top: 0, behavior: 'smooth' });
  return flowToken;
}

function resetToHome() {
  clearFlowTimers();
  flowToken += 1;
  currentFlow = 'home';
  humanMode = false;
  supportConnected = false;
  $('#flow-messages').replaceChildren();
  $('#flow-view').hidden = true;
  $('#home-menu').hidden = false;
  $('#messages').classList.remove('flow-active');
  $('#chat-widget').classList.remove('human-mode');
  $('#typing-indicator').hidden = true;
  $('#typing-indicator small').textContent = 'Cú DNTU đang nhập';
  $('#chat-title').textContent = 'Trợ lý Cú DNTU';
  $('#presence').textContent = `${roleNames[currentRole]} · Đang hoạt động`;
  $('#message-input').placeholder = 'Nhập nội dung...';
  setState(roleStates[currentRole]);
  $('#messages').scrollTo({ top: 0, behavior: 'smooth' });
  scheduleIdleSleep();
}

function addBubble(text, kind = 'user') {
  const bubble = document.createElement('div');
  bubble.className = `bubble ${kind}`;
  bubble.textContent = text;
  const target = $('#flow-messages');
  target.appendChild(bubble);
  const bubbles = target.querySelectorAll('.bubble');
  if (bubbles.length > 12) bubbles[0].remove();
  bubble.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  return bubble;
}

function addBot(text) { return addBubble(text, 'bot'); }
function addAgent(text) { return addBubble(text, 'agent'); }

function playSound(name) {
  if (muted) return;
  const audio = new Audio(`sounds/${name}.ogg`);
  audio.volume = .55;
  audio.play().catch(() => {});
}

function setRole(role) {
  wakeMascot();
  currentRole = role;
  resetToHome();
  $$('.role').forEach((button) => button.classList.toggle('active', button.dataset.role === role));
  $('#role-label').textContent = roleNames[role];
  $('#presence').textContent = `${roleNames[role]} · Đang hoạt động`;
  setState(roleStates[role]);
  showToast(role === 'guest' ? 'Đang ở chế độ khách.' : `Đã chuyển sang ${roleNames[role]}.`, false);
}

function simulateReply(prompt) {
  wakeMascot();
  scheduleIdleSleep();
  const token = flowToken;
  addBubble(prompt);
  playSound('message-out');
  setState('thinking');
  $('#typing-indicator').hidden = false;
  flowLater(() => setState('typing'), 700, token);
  flowLater(() => {
    $('#typing-indicator').hidden = true;
    const text = prompt.toLowerCase();
    if (text.includes('mất')) {
      setState('searching'); addBot('Bạn mô tả món đồ, vị trí và thời gian nhìn thấy lần cuối nhé.');
    } else if (text.includes('nhặt')) {
      setState('success'); addBot('Cảm ơn bạn! Hãy tải ảnh và cho mình biết nơi nhặt được món đồ.'); playSound('success');
    } else if (text.includes('hồ sơ') || text.includes('lf-')) {
      notifyFound({ matchId: 'MATCH-LF-0001-FOUND-0007', caseId: 'LF-0001', candidateItemId: 'FOUND-0007', itemName: 'Ví da màu đen', location: 'Thư viện DNTU', matchScore: 70 });
    } else {
      setState('welcome'); addBot('Mình đã nhận tin. Nếu cần xử lý trực tiếp, bạn chọn “Chat với nhân viên”.'); playSound('message-in');
    }
  }, 1450, token);
}

function hideChat() {
  $('#chat-widget').classList.add('is-hidden');
  $('#chat-launcher').hidden = false;
  $('#launcher-unread').textContent = unreadCount ? String(unreadCount) : '';
  window.requestAnimationFrame(restoreLauncherPosition);
  scheduleIdleSleep();
}

function openChat() {
  wakeMascot();
  $('#chat-widget').classList.remove('is-hidden');
  $('#chat-launcher').hidden = true;
  unreadCount = 0;
  updateNotificationBadge();
  $('#launcher-unread').textContent = '';
  $('#chat-launcher').classList.remove('has-alert');
  $('#chat-launcher img').src = 'mascot/animated/welcome.webp';
  scheduleIdleSleep();
  window.setTimeout(() => $('#message-input').focus(), 100);
}

function enterHumanMode() {
  if (humanMode) return;
  wakeMascot();
  startFlow('human', 'Chat với nhân viên', 'Chọn nhóm yêu cầu để kết nối đúng bộ phận');
  humanMode = true;
  supportConnected = false;
  $('#chat-widget').classList.add('human-mode');
  $('#chat-title').textContent = 'Hỗ trợ trực tiếp DNTU';
  $('#presence').textContent = 'Chọn nội dung cần hỗ trợ';
  $('#message-input').placeholder = 'Mô tả yêu cầu cho nhân viên...';
  setState('staff');

  const card = document.createElement('div');
  card.className = 'support-card';
  card.innerHTML = `
    <strong>Bạn cần nhân viên hỗ trợ việc gì?</strong>
    <small>Chọn một mục để hệ thống chuyển đúng bộ phận.</small>
    <div class="support-options">
      <button data-support-topic="Xác minh nhận lại đồ">Xác minh nhận đồ</button>
      <button data-support-topic="Khiếu nại hồ sơ">Khiếu nại hồ sơ</button>
      <button data-support-topic="Tài khoản hoặc phân quyền">Tài khoản / quyền</button>
      <button data-support-topic="Yêu cầu khác">Yêu cầu khác</button>
    </div>
    <button class="return-bot" data-return-bot>← Quay lại Cú DNTU</button>`;
  $('#flow-messages').appendChild(card);
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  card.querySelectorAll('[data-support-topic]').forEach((button) => button.addEventListener('click', () => connectSupport(button.dataset.supportTopic, card)));
  card.querySelector('[data-return-bot]').addEventListener('click', () => leaveHumanMode(true));
}

function connectSupport(topic, card) {
  if (supportConnected) return;
  const token = flowToken;
  card.querySelectorAll('[data-support-topic]').forEach((button) => { button.disabled = true; });
  addBubble(topic);
  const queue = document.createElement('div');
  queue.className = 'queue-note';
  queue.textContent = 'Đang kết nối nhân viên phù hợp…';
  $('#flow-messages').appendChild(queue);
  $('#presence').textContent = 'Đang kết nối nhân viên…';
  setState('thinking');
  queue.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  flowLater(() => {
    supportConnected = true;
    queue.textContent = 'Đã kết nối · Nhân viên hỗ trợ #07';
    $('#presence').textContent = 'Nhân viên #07 · Trực tuyến';
    setState('staff');
    addAgent(`Chào bạn, mình đã nhận yêu cầu “${topic}”. Bạn gửi mã hồ sơ và mô tả chi tiết để mình kiểm tra nhé.`);
    playSound('message-in');
  }, 1500, token);
}

function leaveHumanMode(showMessage = true) {
  if (!humanMode) return;
  resetToHome();
  if (showMessage) showToast('Đã quay lại menu chính.', false);
}

function sendMessage() {
  const input = $('#message-input');
  if (!input.value.trim()) return;
  const text = input.value.trim();
  input.value = '';
  if (currentFlow === 'home') startFlow('chat', 'Trò chuyện với Cú DNTU');
  if (!humanMode) { simulateReply(text); return; }
  const token = flowToken;
  addBubble(text);
  playSound('message-out');
  if (!supportConnected) {
    addBot('Bạn hãy chọn loại yêu cầu phía trên để kết nối đúng nhân viên trước nhé.');
    return;
  }
  $('#typing-indicator').hidden = false;
  $('#typing-indicator small').textContent = 'Nhân viên đang nhập';
  flowLater(() => {
    $('#typing-indicator').hidden = true;
    addAgent('Mình đã nhận thông tin. Đây là bản demo giao diện; khi tích hợp thật, tin nhắn sẽ được gửi qua API hoặc WebSocket đến nhân viên.');
    playSound('message-in');
  }, 1100, token);
}

function updateNotificationBadge() {
  const badge = $('#notification-count');
  badge.textContent = String(unreadCount);
  badge.dataset.count = String(unreadCount);
}

async function requestNotifications() {
  if (!('Notification' in window)) {
    showToast('Trình duyệt không hỗ trợ thông báo hệ thống.', false);
    return false;
  }
  const permission = await Notification.requestPermission();
  $('#enable-notifications').textContent = permission === 'granted' ? '🔔 Đã bật thông báo' : '🔕 Chưa cấp quyền';
  showToast(permission === 'granted' ? 'Đã bật thông báo món đồ nghi vấn trùng khớp.' : 'Bạn chưa cho phép thông báo trình duyệt.', false);
  return permission === 'granted';
}

function watchCase() {
  watchedCase = !watchedCase;
  localStorage.setItem('dntu-watch-LF-0001', String(watchedCase));
  $('#watch-case').textContent = watchedCase ? '✓ Đang theo dõi' : 'Theo dõi hồ sơ';
  showToast(watchedCase ? 'Đã theo dõi LF-0001. Có kết quả hệ thống sẽ báo ngay.' : 'Đã tắt theo dõi LF-0001.', false);
}

function normalizeMatch(raw = {}) {
  const caseId = String(raw.caseId || raw.lostCaseId || 'LF-0001');
  const candidateItemId = String(raw.candidateItemId || raw.foundItemId || 'FOUND-UNKNOWN');
  const matchScore = Math.max(0, Math.min(100, Number(raw.matchScore ?? raw.score ?? 70)));
  return {
    matchId: String(raw.matchId || `${caseId}:${candidateItemId}`),
    caseId,
    candidateItemId,
    matchScore,
    itemName: String(raw.itemName || raw.candidateName || 'Món đồ chưa đặt tên'),
    location: String(raw.location || 'Chưa xác định vị trí'),
    candidateTitle: String(raw.candidateTitle || raw.itemName || 'Bài đăng đồ nhặt được')
  };
}

function persistSeenMatchIds() {
  localStorage.setItem('dntu-seen-match-ids', JSON.stringify([...seenMatchIds].slice(-100)));
}

function dismissPotentialMatch(match, alert) {
  alert.remove();
  $('#sample-card').classList.remove('match-found');
  $('#item-status').textContent = 'Đang tìm';
  $('#watch-case').textContent = watchedCase ? '✓ Đang theo dõi' : 'Theo dõi hồ sơ';
  window.dispatchEvent(new CustomEvent('dntu:match-dismissed', { detail: match }));
  showToast('Đã đánh dấu: không phải đồ của tôi.', false);
  resetToHome();
}

function notifyFound(rawMatch) {
  const match = normalizeMatch(rawMatch);
  if (seenMatchIds.has(match.matchId)) {
    showToast(`Kết quả ${match.matchId} đã được thông báo trước đó.`, false);
    if (currentFlow !== 'home') addBot('Kết quả nghi vấn này đã được thông báo trước đó nên mình không tạo thêm bản trùng.');
    return false;
  }
  seenMatchIds.add(match.matchId);
  persistSeenMatchIds();
  wakeMascot();
  scheduleIdleSleep();
  if (currentFlow === 'home') startFlow('match', 'Có món đồ nghi vấn trùng khớp', 'Đây là gợi ý đối chiếu, chưa phải xác nhận cuối cùng');
  unreadCount += 1;
  updateNotificationBadge();
  setState('found');
  playSound('success');

  const card = $('#sample-card');
  card.classList.add('match-found');
  $('#item-status').textContent = `Nghi vấn ${match.matchScore}%`;
  $('#watch-case').textContent = '✓ Đã có kết quả';

  document.querySelector('.match-alert')?.remove();
  const alert = document.createElement('div');
  alert.className = 'match-alert';
  alert.innerHTML = '<strong>Tìm thấy món đồ nghi vấn trùng khớp!</strong><small class="match-description"></small><div class="match-score"><span></span></div><div class="match-actions"><button type="button" data-review-match>Xem đối chiếu</button><button type="button" class="secondary" data-dismiss-match>Không phải đồ của tôi</button></div>';
  alert.querySelector('.match-description').textContent = `${match.itemName} · ${match.location} · Hồ sơ ${match.caseId}`;
  alert.querySelector('.match-score span').style.width = `${match.matchScore}%`;
  alert.querySelector('.match-score span').textContent = `${match.matchScore}%`;
  alert.querySelector('[data-review-match]').addEventListener('click', () => { openChat(); resetToHome(); card.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  alert.querySelector('[data-dismiss-match]').addEventListener('click', () => dismissPotentialMatch(match, alert));
  $('#flow-messages').appendChild(alert);
  alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  if ($('#chat-widget').classList.contains('is-hidden')) {
    $('#chat-launcher img').src = 'mascot/animated/found.webp';
    $('#chat-launcher').classList.add('has-alert');
    $('#launcher-unread').textContent = String(unreadCount);
  }
  showToast(`Nghi vấn trùng khớp ${match.matchScore}%: ${match.itemName}`, true);
  celebrate();

  if ('Notification' in window && Notification.permission === 'granted') {
    const notice = new Notification('Cú DNTU: Có món đồ nghi vấn trùng khớp!', {
      body: `${match.itemName} trùng khớp ${match.matchScore}% tại ${match.location}. Bấm để đối chiếu hồ sơ ${match.caseId}.`,
      icon: 'icons/ui/avatar-owl.png',
      tag: `dntu-${match.matchId}`
    });
    notice.onclick = () => { window.focus(); openChat(); resetToHome(); card.scrollIntoView({ behavior: 'smooth', block: 'center' }); notice.close(); };
  }
  window.dispatchEvent(new CustomEvent('dntu:match-notified', { detail: match }));
  return true;
}

function showToast(message, actionable = true) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<img src="mascot/static/found.png" alt=""><span><strong>Cú DNTU</strong><small>${message}</small></span>${actionable ? '<button type="button">Kiểm tra</button>' : '<button type="button">Đóng</button>'}`;
  toast.querySelector('button').addEventListener('click', () => {
    if (actionable) { openChat(); resetToHome(); $('#sample-card').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    toast.remove();
  });
  $('#toast-region').appendChild(toast);
  window.setTimeout(() => toast.remove(), 6500);
}

function celebrate() {
  for (let index = 0; index < 12; index += 1) {
    const star = document.createElement('span');
    star.className = 'celebration-star';
    star.textContent = index % 2 ? '★' : '✦';
    star.style.left = `${50 + (Math.random() - .5) * 12}%`;
    star.style.top = `${42 + (Math.random() - .5) * 10}%`;
    star.style.color = index % 3 === 0 ? '#D71920' : index % 3 === 1 ? '#0B5CAD' : '#F59E0B';
    star.style.setProperty('--star-x', `${(Math.random() - .5) * 300}px`);
    star.style.setProperty('--star-y', `${-60 - Math.random() * 220}px`);
    document.body.appendChild(star);
    window.setTimeout(() => star.remove(), 1200);
  }
}

$$('.state').forEach((button) => button.addEventListener('click', () => setState(button.dataset.state)));
$$('.role').forEach((button) => button.addEventListener('click', () => setRole(button.dataset.role)));
$$('[data-action]').forEach((button) => button.addEventListener('click', () => {
  const flows = {
    lost: ['Báo mất đồ', 'Mô tả món đồ, vị trí và thời gian nhìn thấy lần cuối', 'Tôi bị mất đồ'],
    found: ['Báo nhặt được đồ', 'Cung cấp ảnh và nơi bạn nhặt được món đồ', 'Tôi nhặt được đồ'],
    search: ['Tra cứu hồ sơ', 'Kiểm tra trạng thái hồ sơ LF-0001', 'Tra cứu hồ sơ LF-0001']
  };
  const [title, subtitle, prompt] = flows[button.dataset.action];
  startFlow(button.dataset.action, title, subtitle);
  simulateReply(prompt);
}));
$('#send-button').addEventListener('click', sendMessage);
$('#message-input').addEventListener('keydown', (event) => { if (event.key === 'Enter') sendMessage(); });
$('#minimize-chat').addEventListener('click', hideChat);
$('#close-chat').addEventListener('click', hideChat);
$('#chat-launcher').addEventListener('pointerdown', beginLauncherDrag);
$('#chat-launcher').addEventListener('pointermove', dragLauncher);
$('#chat-launcher').addEventListener('pointerup', endLauncherDrag);
$('#chat-launcher').addEventListener('pointercancel', endLauncherDrag);
$('#chat-launcher').addEventListener('keydown', moveLauncherWithKeyboard);
$('#chat-launcher').addEventListener('click', (event) => {
  if (suppressLauncherClick) { suppressLauncherClick = false; event.preventDefault(); return; }
  openChat();
});
$('#human-chat-button').addEventListener('click', enterHumanMode);
$('#flow-back').addEventListener('click', resetToHome);
$('#watch-case').addEventListener('click', watchCase);
$('#enable-notifications').addEventListener('click', requestNotifications);
$('#simulate-match').addEventListener('click', () => notifyFound({ matchId: 'MATCH-LF-0001-FOUND-0007', caseId: 'LF-0001', candidateItemId: 'FOUND-0007', itemName: 'Ví da màu đen', location: 'Thư viện DNTU', matchScore: 70 }));
$('#simulate-sleep').addEventListener('click', goToSleep);
$('#notification-button').addEventListener('click', () => {
  if (unreadCount > 0) { openChat(); resetToHome(); $('#sample-card').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  else requestNotifications();
});

$('#toggle-sound').addEventListener('click', () => {
  muted = !muted;
  localStorage.setItem('dntu-muted', muted);
  $('#toggle-sound').textContent = muted ? '🔇 Âm thanh tắt' : '🔊 Âm thanh bật';
});

const verify = $('#verify-dialog');
$('#claim-button').addEventListener('click', () => verify.showModal());
$('#dialog-close').addEventListener('click', () => verify.close());
$('#confirm-claim').addEventListener('click', () => {
  verify.close(); startFlow('claim', 'Xác nhận nhận lại đồ', 'Hồ sơ LF-0001'); setState('success'); addBot('Đã ghi nhận xác nhận nhận lại đồ cho hồ sơ LF-0001.'); playSound('success');
});

const assetDialog = $('#asset-dialog');
$('#category-grid').innerHTML = categories.map(([id, label]) => `<div class="category"><img src="icons/categories/${id}.svg" alt=""><span>${label}</span></div>`).join('');
$('#show-assets').addEventListener('click', () => assetDialog.showModal());
$('#asset-close').addEventListener('click', () => assetDialog.close());
$('#toggle-sound').textContent = muted ? '🔇 Âm thanh tắt' : '🔊 Âm thanh bật';
$('#watch-case').textContent = watchedCase ? '✓ Đang theo dõi' : 'Theo dõi hồ sơ';
updateNotificationBadge();
if ('Notification' in window && Notification.permission === 'granted') $('#enable-notifications').textContent = '🔔 Đã bật thông báo';
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
['pointerdown', 'pointermove', 'keydown', 'touchstart', 'scroll'].forEach((eventName) => document.addEventListener(eventName, recordActivity, { passive: true }));
window.addEventListener('resize', () => {
  const launcher = $('#chat-launcher');
  if (launcher.hidden) return;
  const rect = launcher.getBoundingClientRect();
  moveLauncher(rect.left, rect.top, true);
});
scheduleIdleSleep();

window.DNTUOwlWidget = Object.freeze({
  notifyPotentialMatch: notifyFound,
  open: openChat,
  hide: hideChat,
  resetToMenu: resetToHome
});
window.addEventListener('dntu:potential-match', (event) => notifyFound(event.detail || {}));
