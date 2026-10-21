self.addEventListener('push', (event) => {
  let data = { title: 'Cú DNTU: Có món đồ nghi vấn trùng khớp!', body: 'Có kết quả đối chiếu mới. Bấm để kiểm tra.', caseId: '', matchId: '' };
  try { data = { ...data, ...event.data.json() }; } catch (_) {}
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: 'icons/ui/avatar-owl.png',
    badge: 'icons/ui/avatar-owl.png',
    tag: data.matchId ? `dntu-${data.matchId}` : (data.caseId ? `dntu-${data.caseId}` : 'dntu-potential-match'),
    data: { url: `./index.html${data.caseId ? `?case=${encodeURIComponent(data.caseId)}` : ''}` }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || './index.html';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const existing = windows[0];
    if (existing) { existing.navigate(target); return existing.focus(); }
    return clients.openWindow(target);
  }));
});
