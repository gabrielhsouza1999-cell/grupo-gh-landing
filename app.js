const DESTINATION_EMAIL = "grupoghcontato@gmail.com";
const GABRIEL_WHATSAPP = "5516997529606";
const FORMSUBMIT_ENDPOINT = `https://formsubmit.co/ajax/${DESTINATION_EMAIL}`;
const STORAGE_KEY = "grupo-gh-raio-x-empresarial";

const form = document.querySelector("#diagnostic-form");
const submitButton = document.querySelector("#submit-button");
const buttonText = submitButton.querySelector(".button-text");
const buttonLoader = submitButton.querySelector(".button-loader");
const successState = document.querySelector("#success-state");
const progressFill = document.querySelector("#progress-fill");
const progressValue = document.querySelector("#progress-value");
const preparoRange = document.querySelector("#preparo");
const preparoValue = document.querySelector("#preparo-value");
const summaryField = document.querySelector("#summary-field");
const whatsappLink = document.querySelector("#whatsapp-link");
const floatingWhatsapp = document.querySelector("#floating-whatsapp");

const requiredSelectors = [
  "#nome",
  "#empresa",
  "#whatsapp",
  'input[name="Principal desafio"]',
  "#problema90",
  'input[name="Principal motivo de perda"]',
  'input[name="Faixa de faturamento mensal"]',
  'input[name="Tamanho da equipe"]',
  'input[name="Como conheceu a Grupo GH"]',
  "#expectativaAnalise",
];

function trackMetaEvent(eventName, params = {}) {
  if (typeof fbq === "function") {
    fbq("track", eventName, params);
  }
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function setLoading(isLoading) {
  submitButton.classList.toggle("loading", isLoading);
  submitButton.disabled = isLoading;
  buttonText.textContent = isLoading ? "ENVIANDO..." : "RECEBER MINHA ANÁLISE";
  buttonLoader.hidden = !isLoading;
}

function getRadioValue(name) {
  return form.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

function getFormSnapshot() {
  const challenge = getRadioValue("Principal desafio");
  return {
    "Nome completo": form.elements["Nome completo"].value.trim(),
    "Nome da empresa": form.elements["Nome da empresa"].value.trim(),
    "Instagram da empresa": form.elements["Instagram da empresa"].value.trim(),
    WhatsApp: form.elements.WhatsApp.value.trim(),
    "Principal desafio": challenge,
    "Outro desafio": challenge === "Outro" ? form.elements["Outro desafio"].value.trim() : "",
    "Problema para resolver em 90 dias": form.elements["Problema para resolver em 90 dias"].value.trim(),
    "Principal motivo de perda": getRadioValue("Principal motivo de perda"),
    "Preparo para crescer": form.elements["Preparo para crescer"].value,
    "Faixa de faturamento mensal": getRadioValue("Faixa de faturamento mensal"),
    "Tamanho da equipe": getRadioValue("Tamanho da equipe"),
    "Como conheceu a Grupo GH": getRadioValue("Como conheceu a Grupo GH"),
    "Expectativa com a análise": form.elements["Expectativa com a análise"].value.trim(),
  };
}

function buildSummary(data) {
  return Object.entries(data)
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

function saveBackup() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getFormSnapshot()));
}

function restoreBackup() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const data = JSON.parse(saved);
    Object.entries(data).forEach(([name, value]) => {
      const controls = form.elements[name];
      if (!controls || !value) return;

      if (controls instanceof RadioNodeList) {
        [...controls].forEach((control) => {
          control.checked = control.value === value;
        });
        return;
      }

      controls.value = value;
    });
  } catch (error) {
    console.warn("Não foi possível restaurar o backup local.", error);
  }
}

function updateRangeFill() {
  const min = Number(preparoRange.min);
  const max = Number(preparoRange.max);
  const value = Number(preparoRange.value);
  const percent = ((value - min) / (max - min)) * 100;
  preparoValue.textContent = value;
  preparoRange.style.background = `linear-gradient(90deg, var(--blue-600) ${percent}%, #d5dfec ${percent}%)`;
}

function updateProgress() {
  let completed = 0;

  requiredSelectors.forEach((selector) => {
    const control = form.querySelector(selector);
    if (!control) return;

    if (control.type === "radio") {
      const groupName = control.name;
      if (getRadioValue(groupName)) completed += 1;
      return;
    }

    if (control.value.trim()) completed += 1;
  });

  const selectedChallenge = getRadioValue("Principal desafio");
  const otherChallenge = form.elements["Outro desafio"];
  const total = selectedChallenge === "Outro" ? requiredSelectors.length + 1 : requiredSelectors.length;

  if (selectedChallenge === "Outro" && otherChallenge.value.trim()) {
    completed += 1;
  }

  const percent = Math.round((completed / total) * 100);
  progressFill.style.width = `${percent}%`;
  progressValue.textContent = `${percent}%`;
}

function clearErrors() {
  form.querySelectorAll(".invalid").forEach((node) => node.classList.remove("invalid"));
  form.querySelectorAll(".error-message").forEach((node) => {
    node.textContent = "";
  });
}

function setFieldError(control, message) {
  const field = control.closest(".field");
  field.classList.add("invalid");
  field.querySelector(".error-message").textContent = message;
}

function validateForm() {
  clearErrors();
  let isValid = true;

  ["Nome completo", "Nome da empresa", "WhatsApp"].forEach((name) => {
    const control = form.elements[name];
    if (!control.value.trim()) {
      isValid = false;
      setFieldError(control, "Preencha este campo.");
    }
  });

  if (!getRadioValue("Principal desafio")) {
    isValid = false;
    setFieldError(form.querySelector('input[name="Principal desafio"]'), "Selecione uma opção.");
  }

  if (getRadioValue("Principal desafio") === "Outro" && !form.elements["Outro desafio"].value.trim()) {
    isValid = false;
    setFieldError(form.elements["Outro desafio"], "Descreva o principal desafio.");
  }

  const problem = form.elements["Problema para resolver em 90 dias"];
  if (!problem.value.trim()) {
    isValid = false;
    setFieldError(problem, "Conte qual problema você quer resolver.");
  }

  if (!getRadioValue("Principal motivo de perda")) {
    isValid = false;
    setFieldError(form.querySelector('input[name="Principal motivo de perda"]'), "Selecione uma opção.");
  }

  if (!getRadioValue("Faixa de faturamento mensal")) {
    isValid = false;
    setFieldError(form.querySelector('input[name="Faixa de faturamento mensal"]'), "Selecione uma opção.");
  }

  if (!getRadioValue("Tamanho da equipe")) {
    isValid = false;
    setFieldError(form.querySelector('input[name="Tamanho da equipe"]'), "Selecione uma opção.");
  }

  if (!getRadioValue("Como conheceu a Grupo GH")) {
    isValid = false;
    setFieldError(form.querySelector('input[name="Como conheceu a Grupo GH"]'), "Selecione uma opção.");
  }

  const expectation = form.elements["Expectativa com a análise"];
  if (!expectation.value.trim()) {
    isValid = false;
    setFieldError(expectation, "Conte o que você espera encontrar na análise.");
  }

  if (!isValid) {
    form.querySelector(".invalid")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return isValid;
}

function syncConditionalFields() {
  const selected = getRadioValue("Principal desafio");
  const conditional = document.querySelector("#desafio-outro");
  const otherInput = form.elements["Outro desafio"];
  const shouldShow = selected === "Outro";

  conditional.hidden = !shouldShow;
  otherInput.required = shouldShow;

  if (!shouldShow) {
    otherInput.value = "";
    otherInput.closest(".field")?.classList.remove("invalid");
  }
}

function configureWhatsapp() {
  const message = encodeURIComponent(
    "Olá Gabriel!\n\nConheci o Raio-X Empresarial da Grupo GH e gostaria de entender melhor como funciona a análise.",
  );
  const url = `https://wa.me/${GABRIEL_WHATSAPP}?text=${message}`;
  whatsappLink.href = url;
  floatingWhatsapp.href = url;
}

function initScrollReveal() {
  const revealNodes = document.querySelectorAll(".reveal-on-scroll");

  if (!("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16 },
  );

  revealNodes.forEach((node) => observer.observe(node));
}

async function submitToFormSubmit() {
  const data = getFormSnapshot();
  summaryField.value = buildSummary(data);
  const formData = new FormData(form);

  // FormSubmit envia o formulário por e-mail sem exigir backend próprio.
  const response = await fetch(FORMSUBMIT_ENDPOINT, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Não foi possível enviar o diagnóstico.");
  }

  return response.json();
}

function showSuccess() {
  form.hidden = true;
  document.querySelector(".progress-area").hidden = true;
  successState.hidden = false;
  localStorage.removeItem(STORAGE_KEY);
  trackMetaEvent("Lead", {
    content_name: "Raio-X Empresarial Grupo GH",
  });
  successState.scrollIntoView({ behavior: "smooth", block: "center" });
}

form.addEventListener("input", () => {
  if (document.activeElement === form.elements.WhatsApp) {
    form.elements.WhatsApp.value = formatPhone(form.elements.WhatsApp.value);
  }

  updateRangeFill();
  updateProgress();
  saveBackup();
});

form.addEventListener("change", () => {
  syncConditionalFields();
  updateProgress();
  saveBackup();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (form.elements._honey.value) return;
  if (!validateForm()) return;

  setLoading(true);

  try {
    await submitToFormSubmit();
    showSuccess();
  } catch (error) {
    console.error(error);
    alert("Não foi possível enviar agora. Verifique sua conexão e tente novamente.");
  } finally {
    setLoading(false);
  }
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    if (link.dataset.pixelStart !== undefined) {
      trackMetaEvent("ViewContent", {
        content_name: "Começar diagnóstico",
      });
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

[whatsappLink, floatingWhatsapp].forEach((link) => {
  link.addEventListener("click", () => {
    trackMetaEvent("Contact", {
      content_name: "WhatsApp Grupo GH",
    });
  });
});

restoreBackup();
syncConditionalFields();
updateRangeFill();
updateProgress();
configureWhatsapp();
initScrollReveal();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").then((registration) => {
      registration.update();
    });
  });
}
