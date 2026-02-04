/**
 * 通知服务
 */

/**
 * 通知数据
 */
export interface Notification {
  id: string;
  type: 'review_approved' | 'review_rejected' | 'review_pending';
  userId: number;
  title: string;
  message: string;
  data?: any;
  createdAt: string;
  read: boolean;
}

/**
 * 内存中的通知存储（生产环境应使用数据库或消息队列）
 */
const notifications: Map<string, Notification> = new Map();

/**
 * 创建通知
 */
export function createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Notification {
  const id = Date.now().toString() + Math.random().toString(36);
  const newNotification: Notification = {
    ...notification,
    id,
    createdAt: new Date().toISOString(),
    read: false,
  };

  notifications.set(id, newNotification);

  return newNotification;
}

/**
 * 获取用户通知列表
 */
export function getUserNotifications(userId: number): Notification[] {
  const userNotifications: Notification[] = [];

  for (const notification of notifications.values()) {
    if (notification.userId === userId) {
      userNotifications.push(notification);
    }
  }

  // 按创建时间倒序排序
  return userNotifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * 标记通知为已读
 */
export function markNotificationAsRead(notificationId: string): void {
  const notification = notifications.get(notificationId);
  if (notification) {
    notification.read = true;
    notifications.set(notificationId, notification);
  }
}

/**
 * 审核批准通知
 */
export function createApprovalNotification(
  userId: number,
  fileName: string,
  reviewer: string
): Notification {
  return createNotification({
    type: 'review_approved',
    userId,
    title: '审核通过',
    message: `您的 proto 文件 "${fileName}" 已通过审核`,
    data: {
      fileName,
      reviewer,
    },
  });
}

/**
 * 审核拒绝通知
 */
export function createRejectionNotification(
  userId: number,
  fileName: string,
  reviewer: string,
  reason: string
): Notification {
  return createNotification({
    type: 'review_rejected',
    userId,
    title: '审核未通过',
    message: `您的 proto 文件 "${fileName}" 未通过审核`,
    data: {
      fileName,
      reviewer,
      reason,
    },
  });
}

/**
 * 新审核请求通知（发送给审核员）
 */
export function createNewReviewNotification(
  userId: number,
  fileName: string,
  submitter: string
): Notification {
  return createNotification({
    type: 'review_pending',
    userId,
    title: '新的审核请求',
    message: `${submitter} 提交了 "${fileName}" 的审核请求`,
    data: {
      fileName,
      submitter,
    },
  });
}

/**
 * 批量标记通知为已读
 */
export function markAllAsRead(userId: number): void {
  for (const [id, notification] of notifications.entries()) {
    if (notification.userId === userId) {
      notification.read = true;
      notifications.set(id, notification);
    }
  }
}

/**
 * 删除已读通知
 */
export function deleteReadNotifications(userId: number): void {
  const idsToDelete: string[] = [];

  for (const [id, notification] of notifications.entries()) {
    if (notification.userId === userId && notification.read) {
      idsToDelete.push(id);
    }
  }

  for (const id of idsToDelete) {
    notifications.delete(id);
  }
}

/**
 * 获取未读通知数量
 */
export function getUnreadCount(userId: number): number {
  let count = 0;

  for (const notification of notifications.values()) {
    if (notification.userId === userId && !notification.read) {
      count++;
    }
  }

  return count;
}
