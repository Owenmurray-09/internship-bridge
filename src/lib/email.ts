type NotificationType =
  | 'application_submitted'
  | 'application_accepted'
  | 'application_rejected'
  | 'welcome'
  | 'performance_comment_added'

interface BaseNotification {
  type: NotificationType
}

interface ApplicationSubmittedNotification extends BaseNotification {
  type: 'application_submitted'
  applicationId: string
  internshipId: string
}

interface ApplicationStatusNotification extends BaseNotification {
  type: 'application_accepted' | 'application_rejected'
  applicationId: string
}

interface WelcomeNotification extends BaseNotification {
  type: 'welcome'
  email: string
  fullName: string
}

interface PerformanceCommentNotification extends BaseNotification {
  type: 'performance_comment_added'
  applicationId: string
  comment: string
}

export type NotificationPayload =
  | ApplicationSubmittedNotification
  | ApplicationStatusNotification
  | WelcomeNotification
  | PerformanceCommentNotification

export function sendNotification(payload: NotificationPayload): void {
  fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Fire-and-forget: never block UI
  })
}
