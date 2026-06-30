const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v20.0";
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER;
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const memoryStore = globalThis.__eudesSolerSessions || new Map();
globalThis.__eudesSolerSessions = memoryStore;

const profiles = ["Persona natural", "Independiente", "Pyme o comercio", "Empresa", "Propiedad horizontal"];

const servicesByProfile = {
  "Persona natural": [
    "Declaración de renta",
    "Requerimiento de la DIAN",
    "Organizar soportes y patrimonio",
    "Planeación tributaria personal",
  ],
  Independiente: ["Renta de independiente", "Facturación electrónica", "IVA, retención o ICA", "Contabilidad básica mensual"],
  "Pyme o comercio": [
    "Contabilidad mensual",
    "Impuestos empresariales",
    "Nómina y seguridad social",
    "Estados financieros",
    "Creación o formalización",
  ],
  Empresa: [
    "Revisoría fiscal",
    "Auditoría o control interno",
    "Estados financieros bajo NIIF",
    "Planeación tributaria",
    "Costos y presupuestos",
  ],
  "Propiedad horizontal": [
    "Contabilidad de propiedad horizontal",
    "Presupuesto anual",
    "Informes para asamblea",
    "Cartera y cuotas de administración",
    "Revisión de estados financieros",
  ],
};

function optionList(options) {
  return options.map((option, index) => `${index + 1}. ${option}`).join("\n");
}

function matchOption(text, options) {
  const normalized = text.trim().toLowerCase();
  const numeric = Number.parseInt(normalized, 10);

  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= options.length) {
    return options[numeric - 1];
  }

  return options.find((option) => option.toLowerCase() === normalized) || null;
}

function getScopeQuestion(service) {
  if (service.includes("Nómina")) {
    return {
      question: "¿Cuántas personas tienes en nómina?",
      options: ["1 a 5 empleados", "6 a 20 empleados", "Más de 20 empleados", "Aún no tengo empleados"],
    };
  }

  if (service.includes("renta") || service.includes("Renta") || service.includes("DIAN") || service.includes("patrimonio")) {
    return {
      question: "¿Cómo están tus soportes en este momento?",
      options: ["Organizados", "Parcialmente organizados", "Desorganizados", "No sé qué documentos necesito"],
    };
  }

  if (service.includes("Revisoría") || service.includes("Auditoría") || service.includes("NIIF")) {
    return {
      question: "¿Qué nivel de revisión necesitas?",
      options: ["Revisión puntual", "Diagnóstico completo", "Acompañamiento mensual", "Informe para gerencia o junta"],
    };
  }

  if (service.includes("formalización") || service.includes("Creación")) {
    return {
      question: "¿En qué etapa está el negocio?",
      options: ["Idea de negocio", "Ya vendo sin formalizar", "Ya tengo RUT", "Ya tengo Cámara de Comercio"],
    };
  }

  return {
    question: "¿Cuántos movimientos o documentos manejas al mes?",
    options: ["Menos de 50", "Entre 50 y 200", "Más de 200", "No tengo claro el volumen"],
  };
}

function getRecommendation(answers) {
  const profile = answers.profile || "";
  const service = answers.service || "";
  const scope = answers.scope || "";

  if (
    profile === "Empresa" ||
    service.includes("Revisoría") ||
    service.includes("Auditoría") ||
    service.includes("NIIF") ||
    service.includes("Costos") ||
    scope.includes("gerencia")
  ) {
    return "Estratégico";
  }

  if (
    profile.includes("Pyme") ||
    profile.includes("horizontal") ||
    service.includes("Contabilidad") ||
    service.includes("Impuestos") ||
    service.includes("Nómina") ||
    scope.includes("Más de 200")
  ) {
    return "Integral";
  }

  return "Esencial";
}

function buildSummary(answers) {
  const plan = getRecommendation(answers);

  return [
    "Resumen de solicitud contable",
    `Nombre: ${answers.name}`,
    `Ciudad: ${answers.city}`,
    `Tipo de cliente: ${answers.profile}`,
    `Servicio: ${answers.service}`,
    `Estado o volumen: ${answers.scope}`,
    `Urgencia: ${answers.urgency}`,
    `Plan sugerido: ${plan}`,
    `Detalle adicional: ${answers.details}`,
  ].join("\n");
}

async function redisCommand(command) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    return null;
  }

  const response = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error(`Redis request failed with ${response.status}`);
  }

  const payload = await response.json();
  return payload.result;
}

async function loadSession(phone) {
  if (REDIS_URL && REDIS_TOKEN) {
    const result = await redisCommand(["GET", `wa:${phone}`]);
    return result ? JSON.parse(result) : null;
  }

  return memoryStore.get(phone) || null;
}

async function saveSession(phone, session) {
  if (REDIS_URL && REDIS_TOKEN) {
    await redisCommand(["SET", `wa:${phone}`, JSON.stringify(session), "EX", "86400"]);
    return;
  }

  memoryStore.set(phone, session);
}

async function clearSession(phone) {
  if (REDIS_URL && REDIS_TOKEN) {
    await redisCommand(["DEL", `wa:${phone}`]);
    return;
  }

  memoryStore.delete(phone);
}

async function sendWhatsAppText(to, text) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.log("WhatsApp credentials missing. Message not sent:", { to, text });
    return;
  }

  const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: text,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`WhatsApp send failed with ${response.status}: ${body}`);
  }
}

async function startConversation(phone) {
  const session = { step: "profile", answers: {} };
  await saveSession(phone, session);
  return `Hola, soy el asistente de Eudes Soler. Para orientarte mejor, dime qué tipo de cliente eres:\n\n${optionList(profiles)}\n\nResponde con el número de la opción.`;
}

async function handleIncomingText(phone, text) {
  const normalized = text.trim().toLowerCase();

  if (!normalized || ["hola", "inicio", "reiniciar", "empezar", "menu", "menú"].includes(normalized)) {
    return startConversation(phone);
  }

  let session = await loadSession(phone);

  if (!session) {
    return startConversation(phone);
  }

  if (session.step === "profile") {
    const profile = matchOption(text, profiles);

    if (!profile) {
      return `No entendí la opción. Responde con un número:\n\n${optionList(profiles)}`;
    }

    session.answers.profile = profile;
    session.step = "service";
    await saveSession(phone, session);

    const services = servicesByProfile[profile];
    return `Perfecto. Para ${profile.toLowerCase()}, ¿qué necesitas resolver primero?\n\n${optionList(services)}`;
  }

  if (session.step === "service") {
    const services = servicesByProfile[session.answers.profile] || servicesByProfile["Pyme o comercio"];
    const service = matchOption(text, services);

    if (!service) {
      return `No entendí la opción. Responde con un número:\n\n${optionList(services)}`;
    }

    session.answers.service = service;
    session.step = "scope";
    await saveSession(phone, session);

    const scope = getScopeQuestion(service);
    return `${scope.question}\n\n${optionList(scope.options)}`;
  }

  if (session.step === "scope") {
    const scopeQuestion = getScopeQuestion(session.answers.service);
    const scope = matchOption(text, scopeQuestion.options);

    if (!scope) {
      return `No entendí la opción. Responde con un número:\n\n${optionList(scopeQuestion.options)}`;
    }

    session.answers.scope = scope;
    session.step = "urgency";
    await saveSession(phone, session);

    const urgencyOptions = ["Tengo un vencimiento cercano", "Esta semana", "Este mes", "Solo estoy cotizando"];
    return `¿Qué tan pronto necesitas la asesoría?\n\n${optionList(urgencyOptions)}`;
  }

  if (session.step === "urgency") {
    const urgencyOptions = ["Tengo un vencimiento cercano", "Esta semana", "Este mes", "Solo estoy cotizando"];
    const urgency = matchOption(text, urgencyOptions);

    if (!urgency) {
      return `No entendí la opción. Responde con un número:\n\n${optionList(urgencyOptions)}`;
    }

    session.answers.urgency = urgency;
    session.step = "name";
    await saveSession(phone, session);

    return "Indícame tu nombre o el nombre de la empresa.";
  }

  if (session.step === "name") {
    session.answers.name = text.trim();
    session.step = "city";
    await saveSession(phone, session);

    return "¿En qué ciudad estás?";
  }

  if (session.step === "city") {
    session.answers.city = text.trim();
    session.step = "details";
    await saveSession(phone, session);

    return "Agrega un detalle adicional: vencimientos, documentos pendientes, empleados, deudas, dudas puntuales o escribe “omitir”.";
  }

  if (session.step === "details") {
    session.answers.details = normalized === "omitir" ? "Sin detalle adicional" : text.trim();
    session.step = "confirm";
    await saveSession(phone, session);

    const summary = buildSummary(session.answers);
    return `${summary}\n\n¿Deseas que un asesor revise esta solicitud?\n\n1. Sí, enviar solicitud\n2. Reiniciar`;
  }

  if (session.step === "confirm") {
    if (text.trim() === "2") {
      await clearSession(phone);
      return startConversation(phone);
    }

    if (text.trim() !== "1") {
      return "Responde 1 para enviar la solicitud o 2 para reiniciar.";
    }

    const summary = buildSummary(session.answers);
    await clearSession(phone);

    if (ADMIN_WHATSAPP_NUMBER) {
      await sendWhatsAppText(ADMIN_WHATSAPP_NUMBER, `Nueva solicitud desde WhatsApp:\n\n${summary}`);
    }

    return `Solicitud registrada.\n\n${summary}\n\nUn asesor de Eudes Soler te responderá por este chat.`;
  }

  await clearSession(phone);
  return startConversation(phone);
}

function collectMessages(body) {
  const messages = [];

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      for (const message of change.value?.messages || []) {
        if (message.from && message.type === "text") {
          messages.push({
            from: message.from,
            text: message.text?.body || "",
          });
        }
      }
    }
  }

  return messages;
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      res.status(200).send(challenge);
      return;
    }

    res.status(403).send("Forbidden");
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const messages = collectMessages(req.body || {});

    for (const message of messages) {
      const reply = await handleIncomingText(message.from, message.text);
      await sendWhatsAppText(message.from, reply);
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
};
