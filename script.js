const WHATSAPP_PHONE = "573115362222";

const state = {
  selectedServices: [],
  selectedChatService: "",
  selectedPlan: "",
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function buildWhatsAppUrl(message) {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

function openWhatsApp(message) {
  window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
}

function getSelectedServicesText() {
  return state.selectedServices.length ? state.selectedServices.join(", ") : "Aún no selecciono servicios";
}

function showToast(message) {
  const toast = $("[data-toast]");

  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2800);
}

async function shareSite() {
  const shareData = {
    title: "Eudes Soler | Servicios contables",
    text: "Servicios contables, tributarios y financieros con atención por WhatsApp.",
    url: window.location.href,
  };

  if (navigator.share && window.isSecureContext) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }
    }
  }

  try {
    await navigator.clipboard.writeText(shareData.url);
    showToast("Enlace copiado. Cuando esté publicado, ese enlace servirá para compartirlo.");
  } catch {
    showToast("Copia el enlace desde la barra del navegador.");
  }
}

function initHeader() {
  const header = $("[data-header]");
  const nav = $("[data-nav]");
  const toggle = $("[data-nav-toggle]");

  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 16);
  };

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    header.classList.toggle("menu-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      nav.classList.remove("is-open");
      header.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

function initServices() {
  const chips = $$("[data-filter]");
  const cards = $$("[data-service]");
  const checks = $$("[data-service-check]");

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const filter = chip.dataset.filter;
      chips.forEach((item) => item.classList.toggle("active", item === chip));

      cards.forEach((card) => {
        const categories = card.dataset.category.split(" ");
        card.hidden = filter !== "todos" && !categories.includes(filter);
      });
    });
  });

  checks.forEach((check) => {
    check.addEventListener("change", () => {
      const card = check.closest("[data-service]");
      card.classList.toggle("is-selected", check.checked);
      state.selectedServices = checks.filter((item) => item.checked).map((item) => item.value);
    });
  });
}

function getRecommendation({ profile, movement, need }) {
  const strategicNeed = need.includes("Estados") || need.includes("Revisión") || profile === "Empresa";
  const integralNeed = need.includes("Contabilidad") || need.includes("Nómina") || movement === "Altos";

  if (strategicNeed) {
    return {
      plan: "Estratégico",
      text:
        "Plan recomendado: Estratégico. Conviene revisar NIIF, control interno, impuestos, reportes gerenciales y riesgos de cumplimiento.",
    };
  }

  if (integralNeed || profile.includes("Pyme") || profile.includes("horizontal")) {
    return {
      plan: "Integral",
      text:
        "Plan recomendado: Integral. Sirve para contabilidad mensual, impuestos, conciliaciones, nómina y reportes de gestión.",
    };
  }

  return {
    plan: "Esencial",
    text:
      "Plan recomendado: Esencial. Ideal para ordenar obligaciones puntuales, preparar declaraciones y evitar vencimientos.",
  };
}

function initAdvisor() {
  const form = $("[data-advisor-form]");
  const output = $("[data-recommendation]");
  const fields = ["profile", "movement", "need"].map((name) => $(`[name="${name}"]`, form));

  const update = () => {
    const values = Object.fromEntries(fields.map((field) => [field.name, field.value]));
    const recommendation = getRecommendation(values);
    output.textContent = recommendation.text;
    state.selectedPlan = recommendation.plan;
    return { ...values, recommendation };
  };

  fields.forEach((field) => field.addEventListener("change", update));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = update();
    const message = [
      "Hola, Eudes Soler.",
      "Quiero una asesoría contable.",
      `Perfil: ${values.profile}.`,
      `Movimientos mensuales: ${values.movement}.`,
      `Necesidad principal: ${values.need}.`,
      `Plan sugerido en la página: ${values.recommendation.plan}.`,
      `Servicios marcados: ${getSelectedServicesText()}.`,
    ].join("\n");

    openWhatsApp(message);
  });

  update();
}

function initPlans() {
  $$("[data-plan]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedPlan = button.dataset.plan;
      const message = [
        "Hola, Eudes Soler.",
        `Quiero cotizar el plan ${state.selectedPlan}.`,
        `Servicios de interés: ${getSelectedServicesText()}.`,
        "Me gustaría conocer alcance, requisitos y valor.",
      ].join("\n");

      openWhatsApp(message);
    });
  });
}

function initContactForm() {
  const form = $("[data-contact-form]");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = data.get("name") || "No indicado";
    const city = data.get("city") || "No indicada";
    const business = data.get("business");
    const urgency = data.get("urgency");
    const details = data.get("message") || "Quiero recibir orientación contable.";

    const message = [
      "Hola, Eudes Soler.",
      "Quiero solicitar una asesoría contable.",
      `Nombre: ${name}.`,
      `Ciudad: ${city}.`,
      `Tipo de cliente: ${business}.`,
      `Urgencia: ${urgency}.`,
      `Servicios seleccionados: ${getSelectedServicesText()}.`,
      `Mensaje: ${details}`,
    ].join("\n");

    openWhatsApp(message);
  });
}

function initQuickActions() {
  $$("[data-share-site]").forEach((button) => {
    button.addEventListener("click", shareSite);
  });

  $$("[data-whatsapp-direct]").forEach((button) => {
    button.addEventListener("click", () => {
      openWhatsApp(
        [
          "Hola, Eudes Soler.",
          "Vengo desde la página web.",
          "Quiero recibir asesoría contable y conocer el alcance del servicio.",
        ].join("\n")
      );
    });
  });
}

function initChatbot() {
  const bot = $("[data-chatbot]");
  const openButton = $("[data-chat-open]");
  const inlineOpenButtons = $$("[data-chat-open-inline]");
  const closeButton = $("[data-chat-close]");
  const thread = $("[data-chat-thread]");
  const controls = $("[data-chat-controls]");
  const resetButton = $("[data-chat-reset]");
  const chat = {
    answers: {},
  };

  const setOpen = (isOpen) => {
    bot.classList.toggle("is-open", isOpen);
    bot.setAttribute("aria-hidden", String(!isOpen));
  };

  const appendMessage = (type, text) => {
    const message = document.createElement("p");
    message.className = `chat-message ${type}`;
    message.textContent = text;
    thread.appendChild(message);
    thread.scrollTop = thread.scrollHeight;
  };

  const clearControls = () => {
    controls.innerHTML = "";
  };

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const showOptions = (options, onSelect) => {
    clearControls();
    const group = document.createElement("div");
    group.className = "chat-choice-grid";

    options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = option.label;
      button.addEventListener("click", () => onSelect(option.value || option.label, option.label));
      group.appendChild(button);
    });

    controls.appendChild(group);
  };

  const getServiceOptions = (profile) => {
    const options = {
      "Persona natural": [
        "Declaración de renta",
        "Requerimiento de la DIAN",
        "Organizar soportes y patrimonio",
        "Planeación tributaria personal",
      ],
      Independiente: [
        "Renta de independiente",
        "Facturación electrónica",
        "IVA, retención o ICA",
        "Contabilidad básica mensual",
      ],
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

    return (options[profile] || options["Pyme o comercio"]).map((label) => ({ label }));
  };

  const getScopeQuestion = () => {
    const service = chat.answers.service || "";

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
  };

  const getChatRecommendation = () => {
    const profile = chat.answers.profile || "";
    const service = chat.answers.service || "";
    const scope = chat.answers.scope || "";

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
  };

  const showContactForm = () => {
    clearControls();
    const form = document.createElement("div");
    form.className = "chat-form";
    form.innerHTML = `
      <label class="field">
        <span>Nombre o empresa</span>
        <input type="text" data-chat-input-name placeholder="Ej: Juan Pérez / Comercial ABC" />
      </label>
      <label class="field">
        <span>Ciudad</span>
        <input type="text" data-chat-input-city placeholder="Ej: Bogotá" />
      </label>
      <p class="chat-error" data-chat-error hidden>Escribe al menos tu nombre para preparar el mensaje.</p>
      <button class="btn primary wide" type="button" data-chat-next>Continuar</button>
    `;
    controls.appendChild(form);

    const nameInput = $("[data-chat-input-name]", form);
    const cityInput = $("[data-chat-input-city]", form);
    const error = $("[data-chat-error]", form);

    $("[data-chat-next]", form).addEventListener("click", () => {
      const name = nameInput.value.trim();
      const city = cityInput.value.trim();

      if (!name) {
        error.hidden = false;
        nameInput.focus();
        return;
      }

      chat.answers.name = name;
      chat.answers.city = city || "No indicada";
      appendMessage("user", `${name}${city ? `, ${city}` : ""}`);
      askDetails();
    });
  };

  const askProfile = () => {
    appendMessage(
      "bot",
      "Hola, soy el asistente de Eudes Soler. Para orientarte mejor, primero dime qué tipo de cliente eres."
    );
    showOptions(
      ["Persona natural", "Independiente", "Pyme o comercio", "Empresa", "Propiedad horizontal"].map((label) => ({
        label,
      })),
      (value, label) => {
        chat.answers.profile = value;
        appendMessage("user", label);
        askService();
      }
    );
  };

  const askService = () => {
    appendMessage("bot", `Perfecto. Para ${chat.answers.profile.toLowerCase()}, ¿qué necesitas resolver primero?`);
    showOptions(getServiceOptions(chat.answers.profile), (value, label) => {
      chat.answers.service = value;
      state.selectedChatService = value;
      appendMessage("user", label);
      askScope();
    });
  };

  const askScope = () => {
    const scope = getScopeQuestion();
    appendMessage("bot", scope.question);
    showOptions(
      scope.options.map((label) => ({ label })),
      (value, label) => {
        chat.answers.scope = value;
        appendMessage("user", label);
        askUrgency();
      }
    );
  };

  const askUrgency = () => {
    appendMessage("bot", "¿Qué tan pronto necesitas la asesoría?");
    showOptions(
      ["Tengo un vencimiento cercano", "Esta semana", "Este mes", "Solo estoy cotizando"].map((label) => ({ label })),
      (value, label) => {
        chat.answers.urgency = value;
        appendMessage("user", label);
        appendMessage("bot", "Ahora necesito tus datos básicos para dejar listo el mensaje.");
        showContactForm();
      }
    );
  };

  const askDetails = () => {
    clearControls();
    appendMessage("bot", "¿Quieres agregar algún detalle adicional? Puedes mencionar vencimientos, deudas, empleados, documentos pendientes o dudas puntuales.");

    const form = document.createElement("div");
    form.className = "chat-form";
    form.innerHTML = `
      <label class="field">
        <span>Detalle adicional</span>
        <textarea data-chat-input-details rows="3" placeholder="Ej: debo presentar IVA y tengo extractos sin conciliar"></textarea>
      </label>
      <div class="chat-actions-row">
        <button class="chat-secondary" type="button" data-chat-skip>Omitir</button>
        <button class="btn primary" type="button" data-chat-summary>Ver resumen</button>
      </div>
    `;
    controls.appendChild(form);

    const details = $("[data-chat-input-details]", form);
    const finish = () => {
      chat.answers.details = details.value.trim() || "Sin detalle adicional";
      appendMessage("user", chat.answers.details);
      showSummary();
    };

    $("[data-chat-summary]", form).addEventListener("click", finish);
    $("[data-chat-skip]", form).addEventListener("click", () => {
      details.value = "";
      finish();
    });
  };

  const buildChatMessage = () => {
    const plan = getChatRecommendation();

    return [
      "Hola, Eudes Soler.",
      "Vengo desde la página web y el asistente preparó mi caso.",
      `Nombre: ${chat.answers.name}.`,
      `Ciudad: ${chat.answers.city}.`,
      `Tipo de cliente: ${chat.answers.profile}.`,
      `Servicio que busco: ${chat.answers.service}.`,
      `Estado o volumen: ${chat.answers.scope}.`,
      `Urgencia: ${chat.answers.urgency}.`,
      `Plan sugerido: ${plan}.`,
      `Servicios marcados en la página: ${getSelectedServicesText()}.`,
      `Detalle adicional: ${chat.answers.details}.`,
    ].join("\n");
  };

  const showSummary = () => {
    clearControls();
    const plan = getChatRecommendation();
    appendMessage(
      "bot",
      `Con lo que me cuentas, te conviene iniciar con el plan ${plan}. Ya puedo enviar el resumen por WhatsApp para que te respondan con alcance, requisitos y valor.`
    );

    const summary = document.createElement("div");
    summary.className = "chat-form";
    summary.innerHTML = `
      <div class="chat-summary">
        <span><strong>Cliente:</strong> ${escapeHtml(chat.answers.name)}</span>
        <span><strong>Perfil:</strong> ${escapeHtml(chat.answers.profile)}</span>
        <span><strong>Servicio:</strong> ${escapeHtml(chat.answers.service)}</span>
        <span><strong>Urgencia:</strong> ${escapeHtml(chat.answers.urgency)}</span>
        <span><strong>Plan sugerido:</strong> ${escapeHtml(plan)}</span>
      </div>
      <div class="chat-actions-row">
        <button class="chat-secondary" type="button" data-chat-edit>Empezar de nuevo</button>
        <button class="btn primary" type="button" data-chat-send>Enviar WhatsApp</button>
      </div>
    `;
    controls.appendChild(summary);

    $("[data-chat-send]", summary).addEventListener("click", () => openWhatsApp(buildChatMessage()));
    $("[data-chat-edit]", summary).addEventListener("click", startConversation);
  };

  function startConversation() {
    chat.answers = {};
    state.selectedChatService = "";
    thread.innerHTML = "";
    clearControls();
    askProfile();
  }

  const openConversation = () => {
    setOpen(true);
    if (!thread.children.length) {
      startConversation();
    }
  };

  openButton.addEventListener("click", openConversation);
  inlineOpenButtons.forEach((button) => button.addEventListener("click", openConversation));
  closeButton.addEventListener("click", () => setOpen(false));
  resetButton.addEventListener("click", startConversation);

  startConversation();
}

document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initServices();
  initAdvisor();
  initPlans();
  initContactForm();
  initQuickActions();
  initChatbot();
});
