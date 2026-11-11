// Cliente Frontend Interactivo para el Portal y Backend API de la ANI

let currentProjects = [];
let activeMode = '';
let authToken = localStorage.getItem('ani_admin_token') || null;

document.addEventListener('DOMContentLoaded', () => {
  loadProjects();
  loadTelemetry();
  setupEventListeners();
  checkAuthStatus();
});

function setupEventListeners() {
  // Filtros de modo
  document.querySelectorAll('.btn-filter').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeMode = e.target.dataset.mode || '';
      filterAndRenderProjects();
    });
  });

  // Buscador en vivo
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      filterAndRenderProjects();
    });
  }

  // Formulario de Radicación PQRSF (Servicio Público 2)
  const formPqrsf = document.getElementById('form-pqrsf');
  if (formPqrsf) {
    formPqrsf.addEventListener('submit', handlePqrsfSubmit);
  }

  // Consulta de PQRSF por Radicado (Servicio Público 2)
  const formConsulta = document.getElementById('form-consulta-pqrsf');
  if (formConsulta) {
    formConsulta.addEventListener('submit', handlePqrsfLookup);
  }

  // Modal Login Admin
  const btnOpenLogin = document.getElementById('btn-open-login');
  const modalLogin = document.getElementById('modal-login');
  const btnCloseModal = document.getElementById('close-login-modal');
  const formLogin = document.getElementById('form-login');

  if (btnOpenLogin && modalLogin) {
    btnOpenLogin.addEventListener('click', () => {
      modalLogin.style.display = 'flex';
    });
  }

  if (btnCloseModal && modalLogin) {
    btnCloseModal.addEventListener('click', () => {
      modalLogin.style.display = 'none';
    });
  }

  if (formLogin) {
    formLogin.addEventListener('submit', handleAdminLogin);
  }
}

// === SERVICIO PÚBLICO 1: PROYECTOS Y DOCUMENTOS ===

async function loadProjects() {
  const container = document.getElementById('projects-container');
  try {
    const res = await fetch('/api/v1/public/proyectos?limit=20');
    const data = await res.json();

    if (data.success) {
      currentProjects = data.data;
      filterAndRenderProjects();
      populateProjectSelect();
    }
  } catch (error) {
    console.error('Error al cargar proyectos:', error);
    if (container) {
      container.innerHTML = `<div class="error-msg">No fue posible conectar con la API de Proyectos de la ANI.</div>`;
    }
  }
}

function filterAndRenderProjects() {
  const container = document.getElementById('projects-container');
  const searchInput = document.getElementById('search-input');
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

  let filtered = currentProjects;

  if (activeMode) {
    filtered = filtered.filter(p => p.modo === activeMode);
  }

  if (searchTerm) {
    filtered = filtered.filter(p => 
      p.nombre.toLowerCase().includes(searchTerm) ||
      p.codigo.toLowerCase().includes(searchTerm) ||
      p.departamento.toLowerCase().includes(searchTerm) ||
      p.concesionario.toLowerCase().includes(searchTerm)
    );
  }

  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">No se encontraron proyectos con los criterios de búsqueda.</div>`;
    return;
  }

  container.innerHTML = filtered.map(p => `
    <div class="project-card">
      <div>
        <div class="project-header">
          <span class="mode-badge mode-${p.modo.toLowerCase()}">${p.modo}</span>
          <span class="status-tag">${p.estado}</span>
        </div>
        <h3 class="project-title">${p.nombre}</h3>
        <p class="project-desc">${p.descripcion}</p>
        
        <div class="project-meta">
          <div>📍 <strong>Ubicación:</strong> ${p.departamento}</div>
          <div>🏢 <strong>Concesionario:</strong> ${p.concesionario}</div>
          <div>💰 <strong>Inversión:</strong> $${(p.inversionCopMillones).toLocaleString()} Millones COP</div>
          <div>📑 <strong>Documentos Públicos:</strong> ${p.totalDocumentosPublicos || 0} disponibles</div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px; font-weight: 600;">
          <span>Avance de Obras:</span>
          <span>${p.avancePorcentaje}%</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-fill" style="width: ${p.avancePorcentaje}%;"></div>
        </div>
      </div>

      <div class="card-actions">
        <button class="btn-secondary" onclick="openProjectModal('${p.id}')">Ver Documentación</button>
      </div>
    </div>
  `).join('');
}

async function openProjectModal(projectId) {
  try {
    const res = await fetch(`/api/v1/public/proyectos/${projectId}`);
    const result = await res.json();
    if (!result.success) return;

    const proj = result.data;
    const modal = document.getElementById('modal-project');
    const content = document.getElementById('modal-project-body');

    content.innerHTML = `
      <h2 style="color: #0c3c60; margin-bottom: 6px;">${proj.nombre}</h2>
      <p style="color: #64748b; font-size: 0.88rem; margin-bottom: 16px;">Código: <strong>${proj.codigo}</strong> | Modo: <strong>${proj.modo}</strong> | Concesionario: <strong>${proj.concesionario}</strong></p>
      
      <h4 style="color: #1e293b; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">Documentos Oficiales Disponibles para Descarga:</h4>
      ${proj.documentosPublicos.length === 0 ? '<p style="color: #64748b;">No hay documentos públicos anexados.</p>' : `
        <div style="display: flex; flex-direction: column; gap: 10px; max-height: 250px; overflow-y: auto;">
          ${proj.documentosPublicos.map(d => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="color: #0c3c60; font-size: 0.9rem;">${d.titulo}</strong>
                <div style="font-size: 0.78rem; color: #64748b;">${d.tipoDocumental} • ${(d.pesoBytes / 1024 / 1024).toFixed(2)} MB • Publicado: ${d.fechaPublicacion}</div>
              </div>
              <a href="${d.enlaceDescarga}" target="_blank" class="btn-secondary" style="padding: 6px 12px; font-size: 0.8rem; background: #0c3c60; color: white;">Descargar PDF</a>
            </div>
          `).join('')}
        </div>
      `}
    `;

    modal.style.display = 'flex';
  } catch (err) {
    console.error('Error al cargar detalle del proyecto:', err);
  }
}

function closeProjectModal() {
  document.getElementById('modal-project').style.display = 'none';
}

function populateProjectSelect() {
  const select = document.getElementById('pqrsf-proyecto');
  if (!select) return;

  select.innerHTML = `<option value="">(Opcional) Seleccione un proyecto relacionado</option>` + 
    currentProjects.map(p => `<option value="${p.id}">${p.nombre} (${p.modo})</option>`).join('');
}

// === SERVICIO PÚBLICO 2: VENTANILLA PQRSF ===

async function handlePqrsfSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const alertBox = document.getElementById('pqrsf-result');

  btn.disabled = true;
  btn.innerText = 'Radicando ante la ANI...';

  const payload = {
    tipo: form.tipo.value,
    nombreSolicitante: form.nombre.value,
    tipoDocumento: form.tipoDoc.value,
    numeroDocumento: form.numDoc.value,
    correoElectronico: form.correo.value,
    telefono: form.telefono.value,
    asunto: form.asunto.value,
    descripcion: form.descripcion.value,
    proyectoRelacionadoId: form.proyecto.value || undefined
  };

  try {
    const res = await fetch('/api/v1/public/pqrsf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success) {
      alertBox.style.display = 'block';
      alertBox.style.borderLeftColor = '#00875a';
      alertBox.innerHTML = `
        <h4 style="color: #00875a; margin-bottom: 6px;">✅ Radicación Exitosa</h4>
        <p>Su solicitud ha sido registrada bajo el radicado oficial:</p>
        <div style="background: white; border: 2px dashed #00875a; padding: 10px; font-weight: 700; font-size: 1.15rem; color: #0c3c60; text-align: center; margin: 8px 0; border-radius: 6px;">
          ${data.data.radicado}
        </div>
        <p style="font-size: 0.85rem; color: #475569;">
          <strong>Dependencia Asignada:</strong> ${data.data.dependenciaAsignada}<br>
          <strong>Fecha Límite Legal de Respuesta:</strong> ${new Date(data.data.fechaLimiteRespuesta).toLocaleDateString()}<br>
          <em>Conserve este número para consultar el avance de su requerimiento.</em>
        </p>
      `;
      form.reset();
    } else {
      alertBox.style.display = 'block';
      alertBox.style.borderLeftColor = '#e11d48';
      alertBox.innerHTML = `<h4 style="color: #e11d48;">Error en radicación:</h4><p>${data.mensaje || 'Datos incompletos.'}</p>`;
    }
  } catch (err) {
    alertBox.style.display = 'block';
    alertBox.innerHTML = `<p style="color: red;">Error de conexión con la API de PQRSF.</p>`;
  } finally {
    btn.disabled = false;
    btn.innerText = 'Radicar Solicitud Oficial';
  }
}

async function handlePqrsfLookup(e) {
  e.preventDefault();
  const radicadoInput = document.getElementById('input-radicado');
  const resultCard = document.getElementById('lookup-result');
  const radicado = radicadoInput.value.trim();

  if (!radicado) return;

  try {
    const res = await fetch(`/api/v1/public/pqrsf/${encodeURIComponent(radicado)}`);
    const data = await res.json();

    resultCard.style.display = 'block';
    if (data.success) {
      const item = data.data;
      resultCard.innerHTML = `
        <h4 style="color: #0c3c60; margin-bottom: 6px;">Estado del Trámite: <strong>${item.radicado}</strong></h4>
        <div style="font-size: 0.88rem; color: #334155; line-height: 1.6;">
          <div>📋 <strong>Tipo:</strong> ${item.tipo}</div>
          <div>📌 <strong>Asunto:</strong> ${item.asunto}</div>
          <div>🏢 <strong>Dependencia Responsable:</strong> ${item.dependenciaAsignada}</div>
          <div>📅 <strong>Fecha de Radicación:</strong> ${new Date(item.fechaRadicacion).toLocaleString()}</div>
          <div>⏳ <strong>Estado Actual:</strong> <span style="background: ${item.estado === 'RESPONDIDO' ? '#dcfce7' : '#fef3c7'}; color: ${item.estado === 'RESPONDIDO' ? '#15803d' : '#b45309'}; font-weight: 700; padding: 2px 8px; border-radius: 4px;">${item.estado}</span></div>
          ${item.respuestaOficial ? `
            <div style="margin-top: 10px; background: white; padding: 12px; border-left: 3px solid #00875a; border-radius: 4px;">
              <strong>Respuesta Oficial Emitida:</strong><br>
              <p style="margin-top: 4px; font-style: italic;">"${item.respuestaOficial}"</p>
              <small style="color: #64748b;">Fecha: ${new Date(item.fechaRespuesta).toLocaleString()}</small>
            </div>
          ` : '<p style="margin-top: 8px; color: #64748b; font-style: italic;">Su trámite se encuentra dentro de los términos legales de respuesta.</p>'}
        </div>
      `;
    } else {
      resultCard.innerHTML = `<p style="color: #e11d48;">${data.mensaje || 'Radicado no encontrado.'}</p>`;
    }
  } catch (err) {
    resultCard.style.display = 'block';
    resultCard.innerHTML = `<p style="color: red;">Error al consultar el radicado.</p>`;
  }
}

// === TELEMETRÍA Y OBSERVABILIDAD TI ===

async function loadTelemetry() {
  const container = document.getElementById('ti-telemetry-container');
  try {
    const res = await fetch('/health');
    const data = await res.json();

    if (data.estado === 'saludable' && container) {
      const mem = data.telemetria.memoria;
      document.getElementById('server-uptime').innerText = data.telemetria.uptimeFormato;
      document.getElementById('server-mem').innerText = `${mem.usadaMiB} MiB / ${mem.totalMiB} MiB (${mem.porcentajeUso}%)`;
      document.getElementById('server-platform').innerText = data.plataforma;
    }
  } catch (e) {
    console.error('Error al cargar telemetría:', e);
  }
}

// === AUTENTICACIÓN ADMIN ===

async function handleAdminLogin(e) {
  e.preventDefault();
  const form = e.target;
  const errorBox = document.getElementById('login-error');

  const email = form.email.value;
  const password = form.password.value;

  try {
    const res = await fetch('/api/v1/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success) {
      authToken = data.data.token;
      localStorage.setItem('ani_admin_token', authToken);
      document.getElementById('modal-login').style.display = 'none';
      checkAuthStatus();
      alert(`Bienvenido, ${data.data.usuario.nombreCompleto} (${data.data.usuario.rol})`);
    } else {
      errorBox.style.display = 'block';
      errorBox.innerText = data.mensaje || 'Credenciales incorrectas.';
    }
  } catch (err) {
    errorBox.style.display = 'block';
    errorBox.innerText = 'Error al conectar con la API administrativa.';
  }
}

function checkAuthStatus() {
  const btnAdmin = document.getElementById('btn-open-login');
  if (authToken && btnAdmin) {
    btnAdmin.innerText = '👤 Sesión Activa (Cerrar)';
    btnAdmin.onclick = () => {
      localStorage.removeItem('ani_admin_token');
      authToken = null;
      btnAdmin.innerText = 'Acceso Funcionarios';
      btnAdmin.onclick = () => { document.getElementById('modal-login').style.display = 'flex'; };
      alert('Sesión cerrada.');
    };
  }
}
