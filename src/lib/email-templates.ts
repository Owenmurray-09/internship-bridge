type Locale = 'en' | 'es'

interface TemplateData {
  recipientName: string
  locale: Locale
}

interface ApplicationSubmittedData extends TemplateData {
  studentName: string
  internshipTitle: string
  reviewUrl: string
}

interface ApplicationStatusData extends TemplateData {
  internshipTitle: string
  companyName: string
  applicationsUrl: string
}

interface WelcomeData extends TemplateData {
  dashboardUrl: string
}

interface PerformanceCommentData extends TemplateData {
  internshipTitle: string
  companyName: string
  commentPreview: string
  applicationsUrl: string
}

const subjects: Record<string, Record<Locale, string>> = {
  application_submitted: {
    en: 'New Application Received',
    es: 'Nueva Solicitud Recibida',
  },
  application_accepted: {
    en: 'Your Application Was Accepted!',
    es: '¡Tu Solicitud Fue Aceptada!',
  },
  application_rejected: {
    en: 'Application Status Update',
    es: 'Actualización del Estado de Solicitud',
  },
  welcome: {
    en: 'Welcome to InternshipBridge!',
    es: '¡Bienvenido a InternshipBridge!',
  },
  performance_comment_added: {
    en: 'New Feedback on Your Internship',
    es: 'Nuevo Comentario Sobre Tu Práctica',
  },
}

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background-color:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
      <h2 style="color:#2563eb;margin:0 0 24px 0;font-size:20px;">InternshipBridge</h2>
      ${content}
    </div>
    <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:16px;">
      InternshipBridge &mdash; Connecting students with opportunities
    </p>
  </div>
</body>
</html>`
}

export function getSubject(type: string, locale: Locale): string {
  return subjects[type]?.[locale] ?? subjects[type]?.en ?? 'InternshipBridge Notification'
}

export function applicationSubmittedHtml(data: ApplicationSubmittedData): string {
  const { recipientName, studentName, internshipTitle, reviewUrl, locale } = data
  if (locale === 'es') {
    return baseTemplate(`
      <p style="color:#111827;font-size:16px;line-height:1.6;margin:0 0 16px;">Hola ${recipientName},</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
        <strong>${studentName}</strong> ha enviado una solicitud para tu práctica <strong>${internshipTitle}</strong>.
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Revisa la solicitud y responde al estudiante.
      </p>
      <a href="${reviewUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">
        Revisar Solicitud
      </a>
    `)
  }
  return baseTemplate(`
    <p style="color:#111827;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi ${recipientName},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      <strong>${studentName}</strong> has submitted an application for your internship <strong>${internshipTitle}</strong>.
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Review the application and respond to the student.
    </p>
    <a href="${reviewUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">
      Review Application
    </a>
  `)
}

export function applicationAcceptedHtml(data: ApplicationStatusData): string {
  const { recipientName, internshipTitle, companyName, applicationsUrl, locale } = data
  if (locale === 'es') {
    return baseTemplate(`
      <p style="color:#111827;font-size:16px;line-height:1.6;margin:0 0 16px;">Hola ${recipientName},</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
        ¡Buenas noticias! Tu solicitud para <strong>${internshipTitle}</strong> en <strong>${companyName}</strong> ha sido <span style="color:#16a34a;font-weight:600;">aceptada</span>.
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Revisa tus solicitudes para más detalles.
      </p>
      <a href="${applicationsUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">
        Ver Mis Solicitudes
      </a>
    `)
  }
  return baseTemplate(`
    <p style="color:#111827;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi ${recipientName},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Great news! Your application for <strong>${internshipTitle}</strong> at <strong>${companyName}</strong> has been <span style="color:#16a34a;font-weight:600;">accepted</span>.
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Check your applications for more details.
    </p>
    <a href="${applicationsUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">
      View My Applications
    </a>
  `)
}

export function applicationRejectedHtml(data: ApplicationStatusData): string {
  const { recipientName, internshipTitle, companyName, applicationsUrl, locale } = data
  if (locale === 'es') {
    return baseTemplate(`
      <p style="color:#111827;font-size:16px;line-height:1.6;margin:0 0 16px;">Hola ${recipientName},</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Tu solicitud para <strong>${internshipTitle}</strong> en <strong>${companyName}</strong> no fue seleccionada en esta ocasión.
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
        No te desanimes — hay muchas más oportunidades disponibles.
      </p>
      <a href="${applicationsUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">
        Explorar Más Prácticas
      </a>
    `)
  }
  return baseTemplate(`
    <p style="color:#111827;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi ${recipientName},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Your application for <strong>${internshipTitle}</strong> at <strong>${companyName}</strong> was not selected at this time.
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Don't be discouraged — there are many more opportunities available.
    </p>
    <a href="${applicationsUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">
      Browse More Internships
    </a>
  `)
}

export function welcomeHtml(data: WelcomeData): string {
  const { recipientName, dashboardUrl, locale } = data
  if (locale === 'es') {
    return baseTemplate(`
      <p style="color:#111827;font-size:16px;line-height:1.6;margin:0 0 16px;">¡Hola ${recipientName}!</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Bienvenido a <strong>InternshipBridge</strong>. Tu cuenta ha sido creada exitosamente.
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Completa tu perfil para comenzar a conectar con oportunidades.
      </p>
      <a href="${dashboardUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">
        Ir al Panel
      </a>
    `)
  }
  return baseTemplate(`
    <p style="color:#111827;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi ${recipientName}!</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Welcome to <strong>InternshipBridge</strong>. Your account has been created successfully.
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Complete your profile to start connecting with opportunities.
    </p>
    <a href="${dashboardUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">
      Go to Dashboard
    </a>
  `)
}

export function performanceCommentHtml(data: PerformanceCommentData): string {
  const { recipientName, internshipTitle, companyName, commentPreview, applicationsUrl, locale } = data
  if (locale === 'es') {
    return baseTemplate(`
      <p style="color:#111827;font-size:16px;line-height:1.6;margin:0 0 16px;">Hola ${recipientName},</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
        <strong>${companyName}</strong> ha dejado un comentario sobre tu desempeño en <strong>${internshipTitle}</strong>:
      </p>
      <blockquote style="border-left:3px solid #2563eb;padding:8px 16px;margin:0 0 24px;color:#4b5563;font-style:italic;">
        ${commentPreview}
      </blockquote>
      <a href="${applicationsUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">
        Ver Mis Solicitudes
      </a>
    `)
  }
  return baseTemplate(`
    <p style="color:#111827;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi ${recipientName},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      <strong>${companyName}</strong> has left feedback on your performance at <strong>${internshipTitle}</strong>:
    </p>
    <blockquote style="border-left:3px solid #2563eb;padding:8px 16px;margin:0 0 24px;color:#4b5563;font-style:italic;">
      ${commentPreview}
    </blockquote>
    <a href="${applicationsUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">
      View My Applications
    </a>
  `)
}
