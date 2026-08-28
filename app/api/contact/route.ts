import { sendContactEmail } from "@/lib/email";

interface ContactRequestBody {
  name: string;
  email: string;
  message: string;
  website: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<ContactRequestBody>;
  const { name, email, message, website } = body;

  if (website && website.trim() !== "") {
    return Response.json({ ok: true });
  }

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return Response.json(
      { ok: false, error: "Nombre, correo y mensaje son obligatorios." },
      { status: 400 }
    );
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return Response.json(
      { ok: false, error: "El correo electrónico no tiene un formato válido." },
      { status: 400 }
    );
  }

  try {
    await sendContactEmail({ name: name.trim(), email: email.trim(), message: message.trim() });
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { ok: false, error: "No se pudo enviar el mensaje. Intenta de nuevo más tarde." },
      { status: 500 }
    );
  }
}
