/* Ví dụ nối sự kiện trùng khớp từ backend WebSocket vào Cú DNTU.
   Không nạp file này nếu dự án của bạn chưa có endpoint tương ứng. */
const matchSocket = new WebSocket('wss://your-domain.example/ws/lost-found');

matchSocket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.event !== 'lost_found.potential_match') return;
  window.DNTUOwlWidget?.notifyPotentialMatch(message.data);
});
