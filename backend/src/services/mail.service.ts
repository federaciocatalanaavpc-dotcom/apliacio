// Enviament de correu via l'API de Resend (resend.com). Es fa servir el
// remitent de prova "onboarding@resend.dev" que Resend dona per defecte.
// IMPORTANT: sense verificar un domini propi a Resend, aquest remitent de
// prova només pot enviar correus a l'adreça amb la qual es va crear el
// compte de Resend, no a adreces arbitràries (limitació del pla gratuït
// en mode de prova, no d'aquesta aplicació).
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const CORREU_FEDERACIO = process.env.CORREU_FEDERACIO || 'federaciocatalanaavpc@gmail.com';

async function enviarCorreu(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  try {
    const resposta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AVPC Federació <onboarding@resend.dev>',
        to,
        subject,
        html,
      }),
    });
    return resposta.ok;
  } catch {
    return false;
  }
}

export async function enviarCorreuFederacio(titol: string, missatge: string) {
  await enviarCorreu(CORREU_FEDERACIO, titol, `<p>${missatge}</p>`);
}

// Envia el mateix correu a una llista d'adreces (una petició per adreça,
// perquè cap associació vegi el correu de la resta). Retorna quantes s'han
// enviat correctament.
export async function enviarCorreuMassiu(destinataris: string[], titol: string, missatge: string): Promise<number> {
  let enviats = 0;
  for (const to of destinataris) {
    const ok = await enviarCorreu(to, titol, `<p>${missatge}</p>`);
    if (ok) enviats++;
  }
  return enviats;
}
