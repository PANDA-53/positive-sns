// public/sw.js
self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon.png', // 必要に応じて public に配置してください
      badge: '/badge.png',
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (err) {
    console.error('プッシュ通知のパースに失敗しました:', err);
  }
});

// 通知をクリックしたときにPOSITIVESの該当画面を開く
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});