/* =============================================
   TV Apps — Painel de Clientes
   Script principal
   ============================================= */

// ── State ─────────────────────────────────────

let clients = [
  { id:1, name:"Carlos Henrique",  email:"carlos@email.com",   phone:"(11) 99999-1001", plan:"Mensal", paymentMethod:"Pix",     expiration:"2026-03-09", notes:"Cliente com renovação manual.",          paymentNote:"Prefere pagar no Pix." },
  { id:2, name:"Fernanda Silva",   email:"fernanda@email.com", phone:"(11) 99999-1002", plan:"Anual",  paymentMethod:"Cartão",  expiration:"2026-12-12", notes:"Cliente anual com lembrete por WhatsApp.",paymentNote:"Cartão cadastrado." },
  { id:3, name:"Marcos Oliveira",  email:"marcos@email.com",   phone:"(11) 99999-1003", plan:"Mensal", paymentMethod:"Pix",     expiration:"2026-03-16", notes:"Pagamento sempre no Pix.",                paymentNote:"Envia comprovante no mesmo dia." },
  { id:4, name:"Juliana Costa",    email:"juliana@email.com",  phone:"(11) 99999-1004", plan:"Anual",  paymentMethod:"Boleto",  expiration:"2027-03-25", notes:"Cliente recorrente e sem pendências.",    paymentNote:"Boleto enviado por e-mail." },
  { id:5, name:"Ricardo Souza",    email:"ricardo@email.com",  phone:"(11) 99999-1005", plan:"Mensal", paymentMethod:"Pix",     expiration:"2026-03-06", notes:"Já vencido, precisa contato urgente.",   paymentNote:"Atrasou o último pagamento." },
  { id:6, name:"Amanda Ribeiro",   email:"amanda@email.com",   phone:"(11) 99999-1006", plan:"Anual",  paymentMethod:"Cartão",  expiration:"2027-04-02", notes:"Cliente anual sem pendências.",           paymentNote:"Pagamento automático no cartão." },
];

// ── Valores dos planos ─────────────────────────
let monthlyPlanValue = 30;
let annualPlanValue  = 30;

const dayLabels = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
const weeklyRenewals = [
  {monthly:3,annual:1},{monthly:4,annual:2},{monthly:3,annual:1},
  {monthly:5,annual:2},{monthly:6,annual:2},{monthly:5,annual:1},{monthly:7,annual:2},
];

// ── Visual (tema) ──────────────────────────────
const themes = {
  vermelho: { accent: "#e63946", glow: "rgba(230,57,70,0.28)", dim: "rgba(230,57,70,0.18)" },
  azul:     { accent: "#3b82f6", glow: "rgba(59,130,246,0.28)", dim: "rgba(59,130,246,0.18)" },
  roxo:     { accent: "#8b5cf6", glow: "rgba(139,92,246,0.28)", dim: "rgba(139,92,246,0.18)" },
  verde:    { accent: "#10b981", glow: "rgba(16,185,129,0.28)", dim: "rgba(16,185,129,0.18)" },
  laranja:  { accent: "#f97316", glow: "rgba(249,115,22,0.28)", dim: "rgba(249,115,22,0.18)" },
};
let currentTheme = "vermelho";

const fontOptions = {
  sora:    "'Sora', system-ui, sans-serif",
  inter:   "'Inter', system-ui, sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
let currentFont = "sora";

let currentRadius = "16"; // px

function applyTheme() {
  const t   = themes[currentTheme];
  const r   = document.documentElement;
  r.style.setProperty("--red",      t.accent);
  r.style.setProperty("--red-glow", t.glow);
  r.style.setProperty("--red-dim",  t.dim);
  // btn-primary box-shadow is inline — re-render will pick it up via CSS vars
}

function applyFont() {
  document.documentElement.style.setProperty("--font", fontOptions[currentFont]);
}

function applyRadius() {
  document.documentElement.style.setProperty("--radius", `${currentRadius}px`);
  document.documentElement.style.setProperty("--radius-sm", `${Math.max(6, currentRadius - 6)}px`);
  document.documentElement.style.setProperty("--radius-lg", `${Number(currentRadius) + 6}px`);
}

// ── Helpers ────────────────────────────────────

let nextId = Math.max(...clients.map(c => c.id)) + 1;
let activeClientId  = null;
let pendingDeleteId = null;

function getWeeklyBilling() {
  return weeklyRenewals.map(d => d.monthly * monthlyPlanValue + d.annual * annualPlanValue);
}

function getTodayBase() { return new Date("2026-03-08T00:00:00"); }

function diffDays(exp) {
  return Math.ceil((new Date(`${exp}T00:00:00`) - getTodayBase()) / 86400000);
}

function getStatus(days) {
  return days < 0
    ? { label:"Vencido", className:"danger", key:"vencido" }
    : { label:"Normal",  className:"safe",   key:"seguro"  };
}

function formatDate(d) {
  const [y,m,day] = d.split("-"); return `${day}/${m}/${y}`;
}

function formatMoney(v) {
  return v.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
}

function addMonths(d, n) {
  const [y,m,day] = d.split("-").map(Number);
  const b = new Date(y, m-1, day);
  const od = b.getDate();
  b.setMonth(b.getMonth() + n);
  if (b.getDate() < od) b.setDate(0);
  return b.toISOString().slice(0,10);
}

function addYears(d, n) {
  const [y,m,day] = d.split("-").map(Number);
  return new Date(y+n, m-1, day).toISOString().slice(0,10);
}

function getRenewBase(exp) {
  const today = getTodayBase().toISOString().slice(0,10);
  return exp < today ? today : exp;
}

function getClientValue(c) {
  return c.plan === "Anual" ? annualPlanValue : monthlyPlanValue;
}

function escapeHtml(s) {
  if (!s) return "";
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ── DOM refs ───────────────────────────────────

const board         = document.getElementById("clientBoard");
const statsEl       = document.getElementById("stats");
const billingStats  = document.getElementById("billingStats");
const billingChart  = document.getElementById("billingChart");
const searchInput   = document.getElementById("searchInput");
const searchClear   = document.getElementById("searchClear");
const statusFilter  = document.getElementById("statusFilter");
const planFilter    = document.getElementById("planFilter");
const sortFilter    = document.getElementById("sortFilter");
const clientCount   = document.getElementById("clientCount");
const utilityModal  = document.getElementById("utilityModal");
const clientModal   = document.getElementById("clientModal");
const newClientModal= document.getElementById("newClientModal");
const deleteModal   = document.getElementById("deleteModal");

const modalClientName    = document.getElementById("modalClientName");
const modalName          = document.getElementById("modalName");
const modalPlan          = document.getElementById("modalPlan");
const modalPhone         = document.getElementById("modalPhone");
const modalEmail         = document.getElementById("modalEmail");
const modalExpiration    = document.getElementById("modalExpiration");
const modalNotes         = document.getElementById("modalNotes");
const modalPaymentMethod = document.getElementById("modalPaymentMethod");
const modalPaymentNote   = document.getElementById("modalPaymentNote");

const tabDados        = document.getElementById("tabDados");
const tabPagamento    = document.getElementById("tabPagamento");
const tabDetalhes     = document.getElementById("tabDetalhes");
const tabDadosBtn     = document.getElementById("tabDadosBtn");
const tabPagamentoBtn = document.getElementById("tabPagamentoBtn");
const tabDetalhesBtn  = document.getElementById("tabDetalhesBtn");

const detailsClientName     = document.getElementById("detailsClientName");
const detailsClientSubtitle = document.getElementById("detailsClientSubtitle");
const detailsStatusBadge    = document.getElementById("detailsStatusBadge");
const detailsPlan           = document.getElementById("detailsPlan");
const detailsExpiration     = document.getElementById("detailsExpiration");
const detailsRemaining      = document.getElementById("detailsRemaining");
const detailsPaymentMethod  = document.getElementById("detailsPaymentMethod");
const detailsPhone          = document.getElementById("detailsPhone");
const detailsEmail          = document.getElementById("detailsEmail");
const detailsNotes          = document.getElementById("detailsNotes");
const detailsPaymentNote    = document.getElementById("detailsPaymentNote");

// ── Toast ──────────────────────────────────────

function showToast(msg, type = "success") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-dot"></span>${msg}`;
  document.getElementById("toastContainer").appendChild(el);
  setTimeout(() => { el.classList.add("removing"); setTimeout(() => el.remove(), 300); }, 3500);
}

// ── Billing render ─────────────────────────────

function renderBilling() {
  const total      = clients.reduce((s,c) => s + getClientValue(c), 0);
  const todayStr   = getTodayBase().toISOString().slice(0,10);
  const todayTotal = clients.filter(c => c.expiration === todayStr).reduce((s,c) => s + getClientValue(c), 0);
  const mCount     = clients.filter(c => c.plan === "Mensal").length;
  const aCount     = clients.filter(c => c.plan === "Anual").length;

  billingStats.innerHTML = `
    <div class="billing-card">
      <h4>Faturamento estimado</h4>
      <div class="billing-number">${formatMoney(total)}</div>
      <p>Mensal: ${formatMoney(monthlyPlanValue)} · Anual: ${formatMoney(annualPlanValue)}</p>
    </div>
    <div class="billing-card">
      <h4>Vencimentos hoje</h4>
      <div class="billing-number">${formatMoney(todayTotal)}</div>
      <p>Receita prevista para hoje</p>
    </div>
    <div class="billing-card">
      <h4>Planos mensais</h4>
      <div class="billing-number">${mCount}</div>
      <p>${formatMoney(mCount * monthlyPlanValue)}/mês deste grupo</p>
    </div>
    <div class="billing-card">
      <h4>Planos anuais</h4>
      <div class="billing-number">${aCount}</div>
      <p>${formatMoney(aCount * annualPlanValue)}/mês deste grupo</p>
    </div>`;

  const vals   = getWeeklyBilling();
  const maxVal = Math.max(...vals);
  billingChart.innerHTML = vals.map((v,i) => {
    const h = Math.max(10, Math.round((v / maxVal) * 180));
    return `<div class="bar-item">
      <div class="bar-value">${formatMoney(v)}</div>
      <div class="bar-fill" style="height:${h}px"></div>
      <div class="bar-label">${dayLabels[i]}</div>
    </div>`;
  }).join("");
}

// ── Stats render ───────────────────────────────

function renderStats(list) {
  const total    = list.length;
  const vencidos = list.filter(c => diffDays(c.expiration) < 0).length;
  const normais  = list.filter(c => diffDays(c.expiration) >= 0).length;
  const mensais  = list.filter(c => c.plan === "Mensal").length;
  const receita  = list.reduce((s,c) => s + getClientValue(c), 0);

  statsEl.innerHTML = `
    <div class="card-stat">
      <div class="card-stat-label">Total de clientes</div>
      <div class="number">${total}</div>
      <div class="stat-sub">${mensais} mensais · ${total-mensais} anuais</div>
    </div>
    <div class="card-stat card-stat-green">
      <div class="card-stat-label">Clientes normais</div>
      <div class="number">${normais}</div>
      <div class="stat-sub">Em dia com o plano</div>
    </div>
    <div class="card-stat card-stat-accent">
      <div class="card-stat-label">Vencidos</div>
      <div class="number">${vencidos}</div>
      <div class="stat-sub">${vencidos > 0 ? "Ação necessária" : "Nenhum vencido"}</div>
    </div>
    <div class="card-stat">
      <div class="card-stat-label">Receita estimada</div>
      <div class="number">${formatMoney(receita)}</div>
      <div class="stat-sub">Mensal ${formatMoney(monthlyPlanValue)} · Anual ${formatMoney(annualPlanValue)}</div>
    </div>`;
}

// ── Client Board ───────────────────────────────

function renderClients() {
  const search    = searchInput.value.toLowerCase().trim();
  const selStatus = statusFilter.value;
  const selPlan   = planFilter.value;
  const selSort   = sortFilter.value;

  searchClear.style.display = search ? "flex" : "none";

  let list = clients.map(c => ({
    ...c,
    days:   diffDays(c.expiration),
    status: getStatus(diffDays(c.expiration))
  }));

  if (search)          list = list.filter(c =>
    [c.name,c.phone,c.email,c.plan,c.notes,c.paymentMethod].some(f => f.toLowerCase().includes(search)));
  if (selStatus !== "todos") list = list.filter(c => c.status.key === selStatus);
  if (selPlan   !== "todos") list = list.filter(c => c.plan === selPlan);

  list.sort((a,b) => selSort === "asc" ? a.days - b.days : b.days - a.days);

  renderStats(list);
  clientCount.textContent = `${list.length} cliente${list.length !== 1 ? "s" : ""} exibido${list.length !== 1 ? "s" : ""}`;

  if (!list.length) {
    board.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⊘</div>
        <h3>Nenhum cliente encontrado</h3>
        <p>Tente ajustar os filtros ou o termo buscado.</p>
      </div>`;
    return;
  }

  board.innerHTML = list.map((c, i) => {
    const tempo      = c.days < 0 ? `${Math.abs(c.days)}d vencido` : `${c.days}d restantes`;
    const badgeCls   = c.status.key === "vencido" ? "badge--danger" : "badge--safe";
    const dot        = c.status.key === "vencido" ? "✗" : "✓";
    const val        = formatMoney(getClientValue(c));

    return `
    <div class="client-card ${c.status.className}" style="animation-delay:${i*0.04}s">
      <div class="client-main">
        <div class="client-avatar">${c.name.charAt(0).toUpperCase()}</div>
        <div class="client-main-info">
          <div class="client-name">${escapeHtml(c.name)}</div>
          <div class="client-meta">
            <span class="client-meta-item"><span class="meta-icon">◑</span>${c.plan} · ${val}/mês</span>
            <span class="client-meta-item"><span class="meta-icon">◎</span>${escapeHtml(c.phone)}</span>
            <span class="client-meta-item"><span class="meta-icon">@</span>${escapeHtml(c.email)}</span>
          </div>
          <div class="badge ${badgeCls}">${dot} ${c.status.label}</div>
        </div>
      </div>
      <div class="client-info">
        <div class="info-chip">
          <div class="info-chip-label">Vencimento</div>
          <div class="info-chip-value info-chip-value--mono">${formatDate(c.expiration)}</div>
        </div>
        <div class="info-chip">
          <div class="info-chip-label">Situação</div>
          <div class="info-chip-value info-chip-value--mono ${c.days < 0 ? "chip-danger" : "chip-safe"}">${tempo}</div>
        </div>
        <div class="info-chip">
          <div class="info-chip-label">Pagamento</div>
          <div class="info-chip-value">${escapeHtml(c.paymentMethod)}</div>
        </div>
        <div class="info-chip">
          <div class="info-chip-label">Observação</div>
          <div class="info-chip-value info-chip-notes">${escapeHtml(c.notes) || "—"}</div>
        </div>
      </div>
      <div class="card-actions">
        <button class="mini-btn renew"   onclick="renewClient(${c.id})">↻ Renovar</button>
        <button class="mini-btn edit"    onclick="openClientModal(${c.id},'dados')">✎ Editar</button>
        <button class="mini-btn payment" onclick="openClientModal(${c.id},'pagamento')">◈ Pagamento</button>
        <button class="mini-btn view"    onclick="showDetails(${c.id})">◎ Detalhes</button>
        <button class="mini-btn delete"  onclick="openDeleteModal(${c.id})">✕ Excluir</button>
      </div>
    </div>`;
  }).join("");
}

// ── Renew ──────────────────────────────────────

function renewClient(id) {
  const c = clients.find(x => x.id === id);
  if (!c) return;
  const base  = getRenewBase(c.expiration);
  c.expiration = c.plan === "Anual" ? addYears(base,1) : addMonths(base,1);
  renderClients();
  renderBilling();
  showToast(`${c.name} renovado até ${formatDate(c.expiration)}.`, "success");
}

// ── Delete ─────────────────────────────────────

function openDeleteModal(id) {
  const c = clients.find(x => x.id === id);
  if (!c) return;
  pendingDeleteId = id;
  document.getElementById("deleteClientName").textContent = c.name;
  deleteModal.classList.add("open");
}
function closeDeleteModal()  { deleteModal.classList.remove("open"); pendingDeleteId = null; }
function handleDeleteModalOverlay(e) { if (e.target === deleteModal) closeDeleteModal(); }
function confirmDelete() {
  if (!pendingDeleteId) return;
  const name = clients.find(c => c.id === pendingDeleteId)?.name || "";
  clients = clients.filter(c => c.id !== pendingDeleteId);
  closeDeleteModal(); renderClients(); renderBilling();
  showToast(`${name} foi excluído.`, "error");
}

// ── New Client ─────────────────────────────────

function openNewClientModal() {
  ["newName","newPhone","newEmail","newExpiration","newNotes"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("newPlan").value          = "Mensal";
  document.getElementById("newPaymentMethod").value = "Pix";
  newClientModal.classList.add("open");
  setTimeout(() => document.getElementById("newName").focus(), 100);
}
function closeNewClientModal() { newClientModal.classList.remove("open"); }
function handleNewClientModalOverlay(e) { if (e.target === newClientModal) closeNewClientModal(); }

function saveNewClient() {
  const get = id => document.getElementById(id).value.trim();
  const name = get("newName"), phone = get("newPhone"), email = get("newEmail"), exp = get("newExpiration");
  if (!name || !phone || !email || !exp) { showToast("Preencha todos os campos obrigatórios.", "warning"); return; }
  clients.unshift({
    id: nextId++,
    name, plan: document.getElementById("newPlan").value, phone, email,
    expiration: exp, paymentMethod: document.getElementById("newPaymentMethod").value,
    notes: get("newNotes") || "Sem observação.", paymentNote: ""
  });
  closeNewClientModal(); renderClients(); renderBilling();
  showToast(`${name} cadastrado com sucesso!`, "success");
}

// ── Edit Client ────────────────────────────────

function openClientModal(id, tab = "dados") {
  const c = clients.find(x => x.id === id);
  if (!c) return;
  const days = diffDays(c.expiration);
  const st   = getStatus(days);
  activeClientId = id;

  modalClientName.textContent    = c.name;
  modalName.value                = c.name;
  modalPlan.value                = c.plan;
  modalPhone.value               = c.phone;
  modalEmail.value               = c.email;
  modalExpiration.value          = c.expiration;
  modalNotes.value               = c.notes;
  modalPaymentMethod.value       = c.paymentMethod;
  modalPaymentNote.value         = c.paymentNote || "";

  detailsClientName.textContent      = c.name;
  detailsClientSubtitle.textContent  = `Plano ${c.plan.toLowerCase()} · ${escapeHtml(c.paymentMethod)}`;
  detailsStatusBadge.textContent     = st.label;
  detailsStatusBadge.style.background = st.key === "vencido" ? "rgba(230,57,70,0.18)" : "rgba(46,194,126,0.16)";
  detailsStatusBadge.style.color      = st.key === "vencido" ? "#ff7b84" : "#5ce89c";
  detailsStatusBadge.style.border     = st.key === "vencido" ? "1px solid rgba(230,57,70,0.3)" : "1px solid rgba(46,194,126,0.25)";
  detailsPlan.textContent          = c.plan;
  detailsExpiration.textContent    = formatDate(c.expiration);
  detailsRemaining.textContent     = days < 0 ? `${Math.abs(days)} dias vencido` : `${days} dias restantes`;
  detailsPaymentMethod.textContent = c.paymentMethod;
  detailsPhone.textContent         = c.phone;
  detailsEmail.textContent         = c.email;
  detailsNotes.textContent         = c.notes || "—";
  detailsPaymentNote.textContent   = c.paymentNote || "Sem observação cadastrada.";

  switchModalTab(tab);
  clientModal.classList.add("open");
}

function switchModalTab(tab) {
  ["dados","pagamento","detalhes"].forEach(t => {
    document.getElementById(`tab${t.charAt(0).toUpperCase()+t.slice(1)}`).classList.toggle("active", t === tab);
    document.getElementById(`tab${t.charAt(0).toUpperCase()+t.slice(1)}Btn`).classList.toggle("active", t === tab);
  });
}

function closeClientModal()  { clientModal.classList.remove("open"); activeClientId = null; }
function handleModalOverlay(e) { if (e.target === clientModal) closeClientModal(); }
function showDetails(id)     { openClientModal(id, "detalhes"); }

function saveClientModal() {
  const c = clients.find(x => x.id === activeClientId);
  if (!c) return;
  const name = modalName.value.trim(), phone = modalPhone.value.trim(), email = modalEmail.value.trim();
  if (!name || !phone || !email) { showToast("Preencha nome, telefone e e-mail.", "warning"); return; }
  c.name = name; c.plan = modalPlan.value; c.phone = phone; c.email = email;
  c.expiration = modalExpiration.value || c.expiration;
  c.notes = modalNotes.value.trim() || c.notes;
  c.paymentMethod = modalPaymentMethod.value;
  c.paymentNote   = modalPaymentNote.value.trim();
  renderClients(); renderBilling(); closeClientModal();
  showToast(`Dados de ${c.name} atualizados.`, "success");
}

// ── Utility Modal ──────────────────────────────

function openUtilityModal(panel = "configuracoes") {
  openUtilityPanel(panel);
  utilityModal.classList.add("open");
}
function closeUtilityModal() { utilityModal.classList.remove("open"); }
function handleUtilityModalOverlay(e) { if (e.target === utilityModal) closeUtilityModal(); }

function openUtilityPanel(panel) {
  document.querySelectorAll(".utility-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll("#utilityModal .tab-btn").forEach(b => b.classList.remove("active"));
  const panelEl = document.getElementById(`panel-${panel}`);
  const tabBtn  = document.getElementById(`utilityTab${cap(panel)}Btn`);
  if (panelEl) panelEl.classList.add("active");
  if (tabBtn)  tabBtn.classList.add("active");
  if (panel === "planos")  syncPlanInputs();
  if (panel === "visual")  syncVisualInputs();
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
}

// ── Painel: Planos e Valores ───────────────────

function syncPlanInputs() {
  const im = document.getElementById("planMonthlyValue");
  const ia = document.getElementById("planAnnualValue");
  if (im) im.value = monthlyPlanValue;
  if (ia) ia.value = annualPlanValue;
  updatePlanPreview();
}

function updatePlanPreview() {
  const rm = parseFloat(document.getElementById("planMonthlyValue")?.value) || 0;
  const ra = parseFloat(document.getElementById("planAnnualValue")?.value)  || 0;
  const mc = clients.filter(c => c.plan === "Mensal").length;
  const ac = clients.filter(c => c.plan === "Anual").length;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("previewMonthlyValue",  formatMoney(rm));
  set("previewAnnualValue",   formatMoney(ra));
  set("previewMonthlyClients",`${mc} clientes`);
  set("previewAnnualClients", `${ac} clientes`);
  set("previewMonthlyTotal",  formatMoney(mc * rm));
  set("previewAnnualTotal",   formatMoney(ac * ra));
  set("previewGrandTotal",    formatMoney(mc * rm + ac * ra));
}

function savePlanValues() {
  const rm = parseFloat(document.getElementById("planMonthlyValue")?.value);
  const ra = parseFloat(document.getElementById("planAnnualValue")?.value);
  if (isNaN(rm) || rm < 0 || isNaN(ra) || ra < 0) { showToast("Insira valores válidos.", "warning"); return; }
  monthlyPlanValue = rm;
  annualPlanValue  = ra;
  renderClients(); renderBilling();
  showToast(`Planos atualizados: Mensal ${formatMoney(rm)} · Anual ${formatMoney(ra)}`, "success");
}

function resetPlanValues() {
  monthlyPlanValue = 30; annualPlanValue = 30;
  syncPlanInputs(); renderClients(); renderBilling();
  showToast("Valores resetados para R$ 30,00.", "info");
}

// ── Painel: Visual ─────────────────────────────

function syncVisualInputs() {
  // marca botão de tema ativo
  document.querySelectorAll(".theme-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.theme === currentTheme);
  });
  // marca botão de fonte ativo
  document.querySelectorAll(".font-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.font === currentFont);
  });
  // sincroniza slider de borda
  const slider = document.getElementById("radiusSlider");
  const label  = document.getElementById("radiusLabel");
  if (slider) slider.value = currentRadius;
  if (label)  label.textContent = `${currentRadius}px`;
  // preview
  updateVisualPreview();
}

function selectTheme(theme) {
  currentTheme = theme;
  applyTheme();
  document.querySelectorAll(".theme-btn").forEach(b => b.classList.toggle("active", b.dataset.theme === theme));
  updateVisualPreview();
}

function selectFont(font) {
  currentFont = font;
  applyFont();
  document.querySelectorAll(".font-btn").forEach(b => b.classList.toggle("active", b.dataset.font === font));
}

function onRadiusChange(val) {
  currentRadius = val;
  document.getElementById("radiusLabel").textContent = `${val}px`;
  applyRadius();
}

function updateVisualPreview() {
  const t = themes[currentTheme];
  const box = document.getElementById("visualPreviewBox");
  if (!box) return;
  box.style.setProperty("--preview-accent", t.accent);
  box.style.setProperty("--preview-glow",   t.glow);
}

function saveVisual() {
  applyTheme(); applyFont(); applyRadius();
  showToast("Visual salvo com sucesso!", "success");
}

function resetVisual() {
  currentTheme  = "vermelho"; currentFont = "sora"; currentRadius = "16";
  applyTheme(); applyFont(); applyRadius();
  syncVisualInputs();
  showToast("Visual resetado para o padrão.", "info");
}

// ── FAQ ────────────────────────────────────────

function toggleFaq(btn) { btn.closest(".faq-item").classList.toggle("open"); }

// ── Filters ────────────────────────────────────

function clearSearch()  { searchInput.value = ""; renderClients(); searchInput.focus(); }
function resetFilters() {
  searchInput.value  = ""; statusFilter.value = "todos";
  planFilter.value   = "todos"; sortFilter.value = "asc";
  renderClients();
}

// ── Keyboard ───────────────────────────────────

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    if (deleteModal.classList.contains("open"))    { closeDeleteModal();    return; }
    if (newClientModal.classList.contains("open")) { closeNewClientModal(); return; }
    if (clientModal.classList.contains("open"))    { closeClientModal();    return; }
    if (utilityModal.classList.contains("open"))   { closeUtilityModal();   return; }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault(); searchInput.focus(); searchInput.select();
  }
});

searchInput.addEventListener("input",   renderClients);
statusFilter.addEventListener("change", renderClients);
planFilter.addEventListener("change",   renderClients);
sortFilter.addEventListener("change",   renderClients);

// ── Init ───────────────────────────────────────

applyTheme(); applyFont(); applyRadius();
renderClients();
renderBilling();