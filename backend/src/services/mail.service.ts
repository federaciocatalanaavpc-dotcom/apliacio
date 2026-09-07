// Enviament de correu via l'API de Resend (resend.com). Es fa servir el
// remitent de prova "onboarding@resend.dev" que Resend dona per defecte,
// que no requereix verificar cap domini propi per poder enviar correus.
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const CORREU_FEDERACIO = process.env.CORREU_FEDERACIO || 'federaciocatalanaavpc@gmail.com';

export async function enviarCorreuFederacio(titol: string, missatge: string) {
  if (!RESEND_API_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AVPC Federació <onboarding@resend.dev>',
        to: CORREU_FEDERACIO,
        subject: titol,
        html: `<p>${missatge}</p>`,
      }),
    });
  } catch {
    // No bloquegem l'enviament de la notificació push si falla el correu.
  }
}
