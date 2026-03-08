let accountModal, serviceModal, credentialModal, generatePwdModal, viewModal, profileModal, customDialogModal;
let currentAccountId = null;
let currentServiceId = null;
let allAccounts = [];

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar modals
    // Inicializar modals de forma robusta
    const initModal = (id) => {
        const el = document.getElementById(id);
        if (el) return new bootstrap.Modal(el);
        console.warn(`Modal element list matching id "${id}" not found.`);
        return null;
    };

    accountModal = initModal('accountModal');
    serviceModal = initModal('serviceModal');
    credentialModal = initModal('credentialModal');
    generatePwdModal = initModal('generatePwdModal');
    viewModal = initModal('viewModal');
    profileModal = initModal('profileModal');
    customDialogModal = initModal('customDialogModal');

    // Inicializar medidor de fuerza como rojo al entrar
    const passInput = document.getElementById('credentialPassword');
    if (passInput) {
        passInput.addEventListener('focus', () => {
            if (!passInput.value) {
                const el = document.getElementById('strengthDisplay');
                if (el) {
                    el.innerHTML = `
                        <div style="margin-top: 10px;">
                            <div class="strength-bar" style="background-color: #e74c3c; width: 5%; height: 5px; border-radius: 3px;"></div>
                            <small style="color: #e74c3c">0% - muy-debil</small>
                        </div>
                    `;
                }
            }
        });
    }

    // Cargar datos iniciales
    loadAllAccounts();
    refreshV3Dashboard();
});

// ========== CARGAR CUENTAS Y CONSTRUIR SIDEBAR ==========

async function loadAllAccounts() {
    try {
        const response = await fetch('/api/accounts', {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        const data = await response.json();
        allAccounts = data.accounts || [];

        // Construir sidebar agrupado por dominio
        buildSidebar();
    } catch (error) {
        console.error('Error:', error);
    }
}

function buildSidebar() {
    const sidebarContent = document.getElementById('sidebar-content');
    const domains = groupAccountsByDomain(allAccounts);

    if (Object.keys(domains).length === 0) {
        sidebarContent.innerHTML = '<p style="padding: 20px; text-align: center; color: #999;">Sin cuentas</p>';
        return;
    }

    let html = '';
    for (const [domain, accounts] of Object.entries(domains)) {
        const iconSlug = getDomainIcon(domain);
        const faviconUrl = getFaviconUrl(domain);
        let iconHtml = '';

        if (iconSlug) {
            const iconUrl = `https://cdn.simpleicons.org/${iconSlug}`;
            iconHtml = `<img src="${iconUrl}" class="email-domain-icon" style="width: 16px; height: 16px; margin-right: 10px; vertical-align: middle;" 
                             onerror="this.onerror=null; this.src='https://cdn.simpleicons.org/default'">`;
        } else if (faviconUrl) {
            iconHtml = `<img src="${faviconUrl}" class="email-domain-icon" style="width: 16px; height: 16px; margin-right: 10px; vertical-align: middle;"
                             onerror="this.onerror=null; this.outerHTML='<i class=\'fas fa-folder-open email-domain-icon\'></i>'">`;
        } else {
            iconHtml = `<i class="fas fa-folder-open email-domain-icon" style="width: 16px; margin-right: 10px; opacity: 0.7;"></i>`;
        }
        html += `
            <div class="email-domain">
                <div class="email-domain-header" onclick="toggleDomain(this)">
                    <div class="d-flex align-items-center">
                        ${iconHtml}
                        <strong>${domain}</strong>
                        <span style="font-size: 0.8em; color: #999; margin-left: 5px;">(${accounts.length})</span>
                    </div>
                    <i class="fas fa-chevron-down opacity-50" style="font-size: 0.7em;"></i>
                </div>
                <div class="email-accounts">
                    ${accounts.map(acc => `
                        <div class="email-account" onclick="selectAccount('${acc.id}')">
                            <div class="text-truncate" style="flex: 1;">${acc.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    sidebarContent.innerHTML = html;
}

function groupAccountsByDomain(accounts) {
    const domains = {};
    accounts.forEach(account => {
        const domain = extractDomain(account.name);
        if (!domains[domain]) domains[domain] = [];
        domains[domain].push(account);
    });
    return domains;
}

function extractDomain(email) {
    if (email.includes('@')) {
        const parts = email.split('@')[1].split('.')[0].toLowerCase();
        return parts.charAt(0).toUpperCase() + parts.slice(1);
    }
    return 'Otros';
}

function getDomainIcon(domain) {
    const d = domain.toLowerCase().trim();
    const icons = {
        // Redes sociales, mensajería y búsqueda
        'google': 'google',
        'youtube': 'youtube',
        'facebook': 'facebook',
        'instagram': 'instagram',
        'whatsapp': 'whatsapp',
        'telegram': 'telegram',
        'tiktok': 'tiktok',
        'twitter': 'x',
        'x.com': 'x',
        'xbox': 'xbox',
        'bing': 'bing',
        'snapchat': 'snapchat',
        'reddit': 'reddit',
        'pinterest': 'pinterest',
        'linkedin': 'linkedin',
        'wechat': 'wechat',
        'qq': 'tencentqq',
        'douyin': 'douyin',

        // Correo, productividad y colaboración
        'gmail': 'gmail',
        'workspace': 'googleworkspace',
        'outlook': 'microsoftoutlook',
        'teams': 'microsoftteams',
        'zoom': 'zoom',
        'slack': 'slack',
        'trello': 'trello',
        'asana': 'asana',
        'notion': 'notion',
        'dropbox': 'dropbox',
        'box': 'box',
        'icloud': 'icloud',
        'evernote': 'evernote',
        'skype': 'skype',
        'hotmail': 'microsoftoutlook',
        'outlook': 'microsoftoutlook',
        'msn': 'microsoft',
        'live.com': 'microsoft',
        'calendar': 'googlecalendar',
        'drive': 'googledrive',

        // Juegos, entretenimiento y streaming
        'playstation': 'playstation',
        'xbox': 'xbox',
        'steam': 'steam',
        'epic': 'epicgames',
        'roblox': 'roblox',
        'fortnite': 'fortnite',
        'netflix': 'netflix',
        'disney': 'disneyplus',
        'hbo': 'hbo',
        'hbomax': 'hbo',
        'primevideo': 'amazonprime',
        'spotify': 'spotify',
        'twitch': 'twitch',
        'appletv': 'appletv',
        'crunchyroll': 'crunchyroll',
        'dazn': 'dazn',
        'hulu': 'hulu',
        'tubi': 'tubitv',
        'mubi': 'mubi',
        'onefootball': 'onefootball',
        'amazonprime': 'amazonprime',

        // Comercio electrónico y fintech
        'amazon': 'amazon',
        'ebay': 'ebay',
        'aliexpress': 'aliexpress',
        'shopify': 'shopify',
        'mercado': 'mercadolibre',
        'paypal': 'paypal',
        'wise': 'wise',
        'revolut': 'revolut',
        'bizum': 'bizum',
        'coinbase': 'coinbase',
        'stripe': 'stripe',
        'square': 'square',
        'etsy': 'etsy',
        'booking': 'bookingdotcom',
        'airbnb': 'airbnb',

        // Almacenamiento infraestructura
        'aws': 'amazonaws',
        'gcp': 'googlecloud',
        'azure': 'microsoftazure',
        'oracle': 'oracle',
        'ibmcloud': 'ibm',
        'digitalocean': 'digitalocean',
        'heroku': 'heroku',
        'tencent': 'tencent',
        'alibaba': 'alibaba',
        'backblaze': 'backblaze',

        // Herramientas técnicas
        'github': 'github',
        'gitlab': 'gitlab',
        'bitbucket': 'bitbucket',
        'stackoverflow': 'stackoverflow',
        'docker': 'docker',
        'npm': 'npm',
        'jira': 'jirasoftware',
        'confluence': 'confluence',
        'selenium': 'selenium',
        'kubernetes': 'kubernetes',

        // Otras apps
        'uber': 'uber',
        'lyft': 'lyft',
        'duolingo': 'duolingo',
        'yelp': 'yelp',
        'tripadvisor': 'tripadvisor',
        'zoominfo': 'zoominfo',
        'medium': 'medium',
        'quora': 'quora',
        'adobe': 'adobe',
        'maps': 'googlemaps',
        'waze': 'waze',

        // Ciberseguridad (50+ servicios)
        'paloalto': 'paloaltonetworks',
        'crowdstrike': 'crowdstrike',
        'fortinet': 'fortinet',
        'cisco': 'cisco',
        'checkpoint': 'checkpoint',
        'trendmicro': 'trendmicro',
        'mcafee': 'mcafee',
        'norton': 'norton',
        'zscaler': 'zscaler',
        'cloudflare': 'cloudflare',
        'sophos': 'sophos',
        'eset': 'eset',
        'bitdefender': 'bitdefender',
        'rapid7': 'rapid7',
        'sentinelone': 'sentinelone',
        'malwarebytes': 'malwarebytes',
        'secureworks': 'secureworks',
        'armis': 'armis',
        'mandiant': 'mandiant',
        'cybereason': 'cybereason',
        'tenable': 'tenable',
        'snyk': 'snyk',
        'splunk': 'splunk',
        'okta': 'okta',
        'auth0': 'auth0',
        'proofpoint': 'proofpoint',
        'imperva': 'imperva',
        'elastic': 'elastic',
        'riskiq': 'riskiq',
        'darktrace': 'darktrace',
        'forgerock': 'forgerock',
        'ivanti': 'ivanti',
        'qualys': 'qualys',
        'beyondtrust': 'beyondtrust',
        'pingidentity': 'pingidentity',
        'cyberark': 'cyberark',
        'sailpoint': 'sailpoint',
        'avast': 'avast',
        'forcepoint': 'forcepoint',
        'watchguard': 'watchguard',
        'arcticwolf': 'arcticwolf',
        'sentinel': 'sentinelone',
        'defender': 'microsoft',
        'intra': 'google',
        'iam': 'okta'
    };

    // Búsqueda exacta (aseguramos lowercase)
    if (icons[d.toLowerCase()]) return icons[d.toLowerCase()];

    // Búsqueda por palabra clave o subcadena
    for (const key in icons) {
        if (d.includes(key)) return icons[key];
    }

    return null;
}

function getFaviconUrl(domain) {
    // Intentar obtener el favicon directamente del dominio si es una URL válida
    if (domain.includes('.')) {
        return `https://www.google.com/s2/favicons?domain=${domain.toLowerCase()}&sz=64`;
    }
    return null;
}

function toggleDomain(element) {
    const header = element;
    const accounts = header.nextElementSibling;
    const isExpanded = accounts.classList.contains('show');

    if (isExpanded) {
        accounts.classList.remove('show');
        header.classList.remove('expanded');
    } else {
        accounts.classList.add('show');
        header.classList.add('expanded');
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('show');
}

function filterSidebar() {
    const searchInput = document.getElementById('searchSidebar');
    const search = searchInput.value.toLowerCase();

    // Si no hay búsqueda, mostrar todo
    if (!search) {
        document.querySelectorAll('.email-domain').forEach(domain => domain.style.display = 'block');
        document.querySelectorAll('.email-account').forEach(acc => acc.style.display = 'block');
        return;
    }

    // Filtrar cuentas y dominios
    let foundAny = false;
    document.querySelectorAll('.email-domain').forEach(domainDiv => {
        const domainHeader = domainDiv.querySelector('.email-domain-header');
        const domainText = domainHeader.textContent.toLowerCase();
        const accounts = domainDiv.querySelectorAll('.email-account');
        let domainHasMatch = domainText.includes(search);

        accounts.forEach(acc => {
            const accText = acc.textContent.toLowerCase();
            if (accText.includes(search)) {
                acc.style.display = 'block';
                domainHasMatch = true;
            } else {
                acc.style.display = domainText.includes(search) ? 'block' : 'none';
            }
        });

        if (domainHasMatch) {
            domainDiv.style.display = 'block';
            foundAny = true;
            // Expandir si hay match
            const accountsDiv = domainDiv.querySelector('.email-accounts');
            if (accountsDiv && !accountsDiv.classList.contains('show')) {
                toggleDomain(domainHeader);
            }
        } else {
            domainDiv.style.display = 'none';
        }
    });
}

/**
 * Navega al panel de servicios de una cuenta y busca una credencial específica
 */
function navigateToServiceSearch(serviceName, username) {
    // 1. Encontrar la cuenta que contiene el servicio
    const account = allAccounts.find(acc =>
        acc.services && acc.services.some(s => s.name.toLowerCase() === serviceName.toLowerCase())
    );

    if (account) {
        // 2. Seleccionar la cuenta
        selectAccount(account.id);

        // 3. Volver de los módulos de seguridad
        hideSecurityModule();

        // 4. Esperar a que el DOM se actualice para el buscador de servicios
        // Usamos un pequeño delay o comprobamos disponibilidad
        const checkSearchInterval = setInterval(() => {
            const searchService = document.getElementById('searchService');
            if (searchService) {
                clearInterval(checkSearchInterval);
                searchService.value = username;
                filterServices();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                showToast(`Localizado: ${username} en ${serviceName}`, 'info', 'Navegación');
            }
        }, 50);

        // Seguridad: limpiar interval después de 2s si falla
        setTimeout(() => clearInterval(checkSearchInterval), 2000);
    } else {
        showToast(`No se encontró la cuenta para ${serviceName}`, 'warning', 'Error');
    }
}

// ========== CUSTOM DIALOGS (REPLACING NATIVE) ==========

function customAlert(title, message, icon = 'info') {
    const iconMap = {
        'info': 'fa-circle-info text-primary',
        'success': 'fa-circle-check text-success',
        'error': 'fa-circle-xmark text-danger',
        'warning': 'fa-triangle-exclamation text-warning'
    };

    document.getElementById('dialogIcon').innerHTML = `<i class="fas ${iconMap[icon] || iconMap.info}"></i>`;
    document.getElementById('dialogTitle').textContent = title;
    document.getElementById('dialogMessage').textContent = message;
    document.getElementById('dialogButtons').innerHTML = `
        <button type="button" class="btn btn-primary rounded-pill px-4" data-bs-dismiss="modal">Entendido</button>
    `;

    customDialogModal.show();
}

function customConfirm(title, message, callback) {
    document.getElementById('dialogIcon').innerHTML = `<i class="fas fa-question-circle text-primary"></i>`;
    document.getElementById('dialogTitle').textContent = title;
    document.getElementById('dialogMessage').textContent = message;
    document.getElementById('dialogButtons').innerHTML = `
        <button type="button" class="btn btn-outline-light rounded-pill px-3" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-primary rounded-pill px-4" id="confirmActionBtn">Confirmar</button>
    `;

    document.getElementById('confirmActionBtn').onclick = () => {
        customDialogModal.hide();
        callback();
    };

    customDialogModal.show();
}

// ========== NOTIFICACIONES TOAST ==========

function showToast(message, type = 'success', title = 'Notificación') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icon} ${type === 'success' ? 'text-success' : type === 'error' ? 'text-danger' : 'text-warning'}"></i>
        </div>
        <div class="toast-content">
            <span class="toast-title">${title}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;

    container.appendChild(toast);

    // Forzar reflow para animación
    toast.offsetHeight;
    toast.classList.add('show');

    // Eliminar después de 4 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ========== HIBP CHECK (Have I Been Pwned) ==========

async function sha1(message) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

async function checkHIBP(password) {
    if (!password) return 0;
    try {
        const hash = await sha1(password);
        const prefix = hash.substring(0, 5);
        const suffix = hash.substring(5);

        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        if (!response.ok) return 0;

        const data = await response.text();
        const lines = data.split('\n');

        for (const line of lines) {
            const [lineSuffix, count] = line.split(':');
            if (lineSuffix === suffix) {
                return parseInt(count);
            }
        }
        return 0;
    } catch (error) {
        console.error('HIBP error:', error);
        return 0;
    }
}

// ========== FILTRADO DE SERVICIOS ==========

function filterServices() {
    const search = document.getElementById('searchService')?.value.toLowerCase();
    const serviceCards = document.querySelectorAll('.service-wrapper');

    serviceCards.forEach(card => {
        const serviceName = card.querySelector('h5').textContent.toLowerCase();
        const credentials = card.querySelectorAll('.credential-row');
        let hasVisibleCred = false;

        credentials.forEach(cred => {
            const username = cred.querySelector('.text-truncate').textContent.toLowerCase();
            if (username.includes(search)) {
                cred.parentElement.style.display = 'block'; // el wrapper de la credencial si existe
                hasVisibleCred = true;
            } else {
                // Si el nombre del servicio coincide, mostramos todas sus credenciales
                if (serviceName.includes(search)) {
                    cred.parentElement.style.display = 'block';
                } else {
                    cred.parentElement.style.display = 'none';
                }
            }
        });

        if (serviceName.includes(search) || hasVisibleCred) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// ========== SELECCIONAR CUENTA Y MOSTRAR DETALLES ==========

function selectAccount(accountId) {
    // Si se pasa el evento, usarlo, si no intentar buscarlo (fallback)
    const evt = window.event;
    const target = evt ? evt.target.closest('.email-account') : document.querySelector(`.email-account[onclick*="${accountId}"]`);

    if (target) {
        document.querySelectorAll('.email-account').forEach(el => el.classList.remove('selected'));
        target.classList.add('selected');
    }

    // Cerrar sidebar en móvil si existe el toggle (aunque lo quitaremos del HTML)
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth <= 768) {
        sidebar.classList.remove('show');
    }

    // Mostrar detalles
    displayAccountDetails(accountId);

    // Cerrar módulos de seguridad si estaban abiertos para ver la cuenta
    const securityContainer = document.getElementById('security-module-container');
    if (securityContainer) securityContainer.style.display = 'none';
}

async function displayAccountDetails(accountId) {
    currentAccountId = accountId;
    const container = document.getElementById('account-detail-container');
    const emptyState = document.getElementById('empty-state');

    try {
        const response = await fetch(`/api/account/${accountId}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        if (!response.ok) {
            container.innerHTML = '<div class="alert alert-danger">Error cargando cuenta</div>';
            return;
        }

        const account = await response.json();
        if (emptyState) emptyState.style.display = 'none';

        const dashboardOverview = document.getElementById('dashboard-overview');
        if (dashboardOverview) dashboardOverview.style.display = 'none';

        // Ocultar módulos de seguridad si están abiertos
        const securityContainer = document.getElementById('security-module-container');
        if (securityContainer) securityContainer.style.display = 'none';

        let html = `
            <div class="glass-card animate-fade-in mb-4">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div class="d-flex align-items-center flex-grow-1">
                        <img src="/static/img/logo.png" alt="SecPass" style="height: 32px; margin-right: 12px;">
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-center">
                                <h2 class="h5 mb-0 fw-bold text-white">${account.name}</h2>
                                <div class="btn-group gap-2">
                                    <button class="btn btn-sm btn-link text-dim hover-text-white p-1" title="Editar Nombre" onclick="showEditAccountModal('${account.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-link text-danger opacity-50 hover-opacity-100 p-1" title="Eliminar Cuenta" onclick="deleteAccount('${account.id}')">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="d-flex gap-3 align-items-center opacity-50 mt-1" style="font-size: 0.75rem;">
                                <span class="text-uppercase letter-spacing-1 fw-semibold">
                                     ${account.services.length} Serv.
                                </span>
                                <span class="text-uppercase letter-spacing-1 fw-semibold">
                                     ${account.services.reduce((sum, s) => sum + s.credentials.length, 0)} Cred.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="service-search-container mb-4">
                    <i class="fas fa-search service-search-icon"></i>
                    <input type="text" id="searchService" class="service-search-input" 
                           placeholder="Buscar..." onkeyup="filterServices()">
                </div>
        `;

        if (account.services.length === 0) {
            html += `
                <div class="text-center py-4">
                    <div class="mb-3 opacity-10">
                        <i class="fas fa-folder-open fa-3x"></i>
                    </div>
                    <p class="text-dim mb-3 small fw-light">Sin servicios</p>
                    <button class="btn btn-primary btn-sm px-4 rounded-pill fw-bold" onclick="showNewServiceModal()">
                        <i class="fas fa-plus me-2"></i>Añadir
                    </button>
                </div>
            `;
        } else {
            html += '<div class="row g-3">';
            account.services.forEach(service => {
                const iconSlug = getDomainIcon(service.name);
                let serviceIconHtml = '';
                if (iconSlug) {
                    serviceIconHtml = `<img src="https://cdn.simpleicons.org/${iconSlug}" class="me-2" style="width: 18px; height: 18px; opacity: 0.8; object-fit: contain; filter: brightness(1.2);" onerror="this.onerror=null; this.outerHTML='<i class=\\'fas fa-folder text-dim me-2 small\\'></i>'">`;
                } else {
                    serviceIconHtml = `<i class="fas fa-folder text-dim me-2 small"></i>`;
                }
                html += `
                    <div class="col-12 service-wrapper">
                        <div class="service-card p-3">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div class="d-flex align-items-center">
                                    ${serviceIconHtml}
                                    <h5 class="mb-0 fw-bold text-white shadow-sm" style="font-size: 0.95rem;">${service.name}</h5>
                                    <button class="btn btn-sm btn-link ms-2 p-0 text-primary opacity-50 hover-opacity-100" 
                                            title="Añadir" onclick="showNewCredentialModal('${account.id}', '${service.id}')">
                                        <i class="fas fa-plus-circle"></i>
                                    </button>
                                </div>
                                <div class="dropdown">
                                    <button class="btn btn-link text-dim p-0 opacity-40 hover-opacity-100" data-bs-toggle="dropdown">
                                        <i class="fas fa-ellipsis-h" style="font-size: 0.8rem;"></i>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-dark border-white-5 shadow-lg small">
                                        <li><a class="dropdown-item text-danger d-flex align-items-center" href="#" onclick="deleteService('${account.id}', '${service.id}')">
                                            <i class="fas fa-trash-alt me-2 small"></i> Eliminar
                                        </a></li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div class="credential-list">
                                ${service.credentials.length > 0 ? service.credentials.map(cred => `
                                    <div class="credential-row p-2 mb-1">
                                        <div class="d-flex align-items-center flex-grow-1 min-w-0">
                                            <i class="fas fa-user-circle text-dim me-2" style="font-size: 0.85rem; opacity: 0.5;"></i>
                                            <span class="text-truncate fw-semibold text-white-50 small" style="max-width: 50%;">${cred.username}</span>
                                            <span class="mx-2 opacity-10 small">|</span>
                                            <span class="small font-monospace text-dim" style="letter-spacing: 1px; font-size: 0.75rem;">••••••••</span>
                                        </div>
                                        <div class="btn-group gap-0">
                                            <button class="btn btn-sm btn-link text-dim hover-text-white p-1" title="Ver" onclick="viewPassword('${account.id}', '${service.id}', '${cred.id}')"><i class="fas fa-eye small"></i></button>
                                            <button class="btn btn-sm btn-link text-dim hover-text-white p-1" title="Copiar" onclick="copyPassword(event, '${account.id}', '${service.id}', '${cred.id}')"><i class="fas fa-copy small"></i></button>
                                            <button class="btn btn-sm btn-link text-danger opacity-30 hover-opacity-100 p-1" title="Borrar" onclick="deleteCredential('${account.id}', '${service.id}', '${cred.id}')"><i class="fas fa-trash-alt small"></i></button>
                                        </div>
                                    </div>
                                `).join('') : '<p class="text-center py-2 opacity-40 mb-0" style="font-size: 0.75rem;">Sin credenciales</p>'}
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';

            html += `
                <div class="mt-4 pt-3 border-top border-white-5">
                    <button class="btn btn-primary btn-sm rounded-pill px-4 fw-bold" onclick="showNewServiceModal()">
                        <i class="fas fa-plus me-2"></i> Servicio
                    </button>
                </div>
            `;
        }

        html += '</div>';
        container.innerHTML = html;
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<div class="alert alert-danger border-0 bg-danger-subtle text-danger p-4 rounded-4">Error al cargar los detalles de la cuenta</div>';
    }
}


// ========== CRUD ACCOUNT ==========

function showNewAccountModal() {
    currentAccountId = null; // Important to reset
    document.getElementById('accountName').value = '';
    document.getElementById('accountNotes').value = '';
    accountModal.show();
}

async function showEditAccountModal(id) {
    currentAccountId = id;
    try {
        const response = await fetch(`/api/account/${id}`);
        if (response.ok) {
            const account = await response.json();
            document.getElementById('accountName').value = account.name || '';
            document.getElementById('accountNotes').value = account.notes || '';
            accountModal.show();
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

async function saveAccount() {
    const name = document.getElementById('accountName').value.trim();
    const notes = document.getElementById('accountNotes').value.trim();
    if (!name) { customAlert('Atención', 'Nombre requerido', 'warning'); return; }

    try {
        const method = currentAccountId ? 'PUT' : 'POST';
        const url = currentAccountId ? `/api/account/${currentAccountId}` : '/api/account';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ name, notes })
        });

        if (response.status === 409) {
            customAlert('Existe', 'Esta cuenta ya existe', 'warning');
            return;
        }

        if (!response.ok) {
            const errorData = await response.json();
            customAlert('Error', 'Error: ' + (errorData.error || 'Error al crear cuenta'), 'error');
            return;
        }

        const result = await response.json();

        if (method === 'POST' && result.id) {
            currentAccountId = result.id;
        }

        accountModal.hide();
        await loadAllAccounts();
        if (currentAccountId) {
            displayAccountDetails(currentAccountId);
        }
        showToast(method === 'PUT' ? 'Cuenta actualizada' : `Cuenta "${name}" creada`, 'success', 'Bóveda Actualizada');
    } catch (error) {
        console.error('Error:', error);
        showToast('Error creando cuenta: ' + error.message, 'error', 'Error');
    }
}

async function deleteAccount(id) {
    customConfirm('Eliminar Cuenta', '¿Estás seguro de que deseas eliminar esta cuenta y todos sus servicios? Esta acción no se puede deshacer.', async () => {
        try {
            const response = await fetch(`/api/account/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Error');

            document.getElementById('empty-state').style.display = 'block';
            document.getElementById('account-detail-container').innerHTML = '';
            // Mostrar dashboard overview de nuevo
            const dashboardOverview = document.getElementById('dashboard-overview');
            if (dashboardOverview) dashboardOverview.style.display = 'block';
            loadAllAccounts();
            showToast('Cuenta eliminada con éxito', 'warning', 'Bóveda Modificada');
        } catch (error) {
            showToast('Error eliminando cuenta', 'error', 'Error');
        }
    });
}

// ========== CRUD SERVICE ==========

function showNewServiceModal() {
    if (!currentAccountId) { customAlert('Atención', 'Selecciona una cuenta primero', 'warning'); return; }
    document.getElementById('serviceName').value = '';
    serviceModal.show();
}

async function saveService() {
    const name = document.getElementById('serviceName').value.trim();
    if (!name) { customAlert('Atención', 'Nombre requerido', 'warning'); return; }

    try {
        const response = await fetch(`/api/account/${currentAccountId}/service`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ name })
        });

        if (!response.ok) throw new Error('Error');

        serviceModal.hide();
        displayAccountDetails(currentAccountId);
        showToast(`Servicio "${name}" añadido`, 'success', 'Nuevo Servicio');
    } catch (error) {
        showToast('Error creando servicio', 'error', 'Error');
    }
}

async function deleteService(accountId, serviceId) {
    customConfirm('Eliminar Servicio', '¿Estás seguro de que deseas eliminar este servicio y todas sus credenciales?', async () => {
        try {
            const response = await fetch(`/api/account/${accountId}/service/${serviceId}`, {
                method: 'DELETE',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            if (!response.ok) throw new Error('Error');

            displayAccountDetails(accountId);
            showToast('Servicio eliminado', 'warning', 'Bóveda Modificada');
        } catch (error) {
            showToast('Error eliminando servicio', 'error', 'Error');
        }
    });
}

// ========== CRUD CREDENTIAL ==========

function showNewCredentialModal(accountId, serviceId) {
    currentAccountId = accountId;
    currentServiceId = serviceId;
    document.getElementById('credentialUsername').value = '';
    document.getElementById('credentialPassword').value = '';
    document.getElementById('strengthDisplay').innerHTML = '';
    credentialModal.show();
}

async function saveCredential() {
    const username = document.getElementById('credentialUsername').value.trim();
    const password = document.getElementById('credentialPassword').value;

    if (!username || !password) { customAlert('Atención', 'Usuario y contraseña requeridos', 'warning'); return; }

    try {
        const response = await fetch(`/api/account/${currentAccountId}/service/${currentServiceId}/credential`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const err = await response.json();
            customAlert('Error', 'Error: ' + (err.error || 'error'), 'error');
            return;
        }

        credentialModal.hide();
        displayAccountDetails(currentAccountId);
        showToast('Credenciales guardadas', 'success', 'Seguridad');
    } catch (error) {
        showToast('Error creando credencial', 'error', 'Error');
    }
}

async function deleteCredential(accountId, serviceId, credId) {
    customConfirm('Eliminar Credencial', '¿Estás seguro de que deseas eliminar estas credenciales?', async () => {
        try {
            const response = await fetch(`/api/account/${accountId}/service/${serviceId}/credential/${credId}`, {
                method: 'DELETE',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            if (!response.ok) throw new Error('Error al eliminar credencial');

            displayAccountDetails(accountId);
            refreshV3Dashboard(); // Actualizar dashboard
        } catch (error) {
            customAlert('Error', error.message, 'error');
        }
    });
}

// ========== PASSWORD GENERATOR ==========

function showGeneratePasswordModal() {
    document.getElementById('generatedPassword').value = '';
    generatePwdModal.show();
    generatePassword();
}

async function generatePassword() {
    try {
        const response = await fetch('/api/generate-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                length: parseInt(document.getElementById('pwdLength')?.value || 16),
                use_uppercase: document.getElementById('pwdUppercase')?.checked ?? true,
                use_lowercase: document.getElementById('pwdLowercase')?.checked ?? true,
                use_digits: document.getElementById('pwdDigits')?.checked ?? true,
                use_symbols: document.getElementById('pwdSymbols')?.checked ?? true
            })
        });

        const data = await response.json();
        const genPwdEl = document.getElementById('generatedPassword');
        if (genPwdEl) {
            genPwdEl.value = data.password;
            validateGeneratedPassword(data.password);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function useGeneratedPassword() {
    const pwd = document.getElementById('generatedPassword')?.value;
    if (pwd) {
        document.getElementById('credentialPassword').value = pwd;
        generatePwdModal.hide();
        validatePasswordStrength();
    }
}

function validatePasswordStrength() {
    const pwd = document.getElementById('credentialPassword')?.value;
    if (!pwd || !document.getElementById('strengthDisplay')) return;

    fetch('/api/validate-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
    })
        .then(r => r.json())
        .then(async data => {
            const el = document.getElementById('strengthDisplay');
            if (el) {
                const colors = {
                    'muy-debil': '#e74c3c',
                    'debil': '#e67e22',
                    'moderada': '#f39c12',
                    'fuerte': '#27ae60',
                    'muy-fuerte': '#16a085'
                };
                const color = colors[data.level] || '#e74c3c';
                const label = data.level || 'muy-debil';
                const score = data.score || 0;

                el.innerHTML = `
                <div style="margin-top: 10px;">
                    <div class="strength-bar" style="background-color: ${color}; width: ${Math.max(score, 5)}%; transition: all 0.3s; height: 5px; border-radius: 3px;"></div>
                    <small style="color: ${color}">${score}% - ${label}</small>
                </div>
            `;
            }

            // HIBP Check
            const hibpCount = await checkHIBP(pwd);
            const hibpDisplay = document.getElementById('hibpDisplay');
            const hibpSafe = document.getElementById('hibpSafe');

            if (hibpCount > 0) {
                if (hibpDisplay) {
                    hibpDisplay.classList.add('show');
                    hibpDisplay.querySelector('span').textContent = `¡Atención! Esta contraseña ha sido vista ${hibpCount.toLocaleString()} veces en filtraciones de datos.`;
                }
                if (hibpSafe) hibpSafe.style.display = 'none';
            } else if (pwd.length >= 8) {
                if (hibpDisplay) hibpDisplay.classList.remove('show');
                if (hibpSafe) hibpSafe.style.display = 'block';
            } else {
                if (hibpDisplay) hibpDisplay.classList.remove('show');
                if (hibpSafe) hibpSafe.style.display = 'none';
            }
        });
}

function validateGeneratedPassword(password) {
    fetch('/api/validate-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    })
        .then(r => r.json())
        .then(data => {
            const display = document.getElementById('genStrengthDisplay');
            if (display) {
                const colors = {
                    'muy-debil': '#e74c3c',
                    'debil': '#e67e22',
                    'moderada': '#f39c12',
                    'fuerte': '#27ae60',
                    'muy-fuerte': '#16a085'
                };
                const color = colors[data.level] || '#e74c3c';
                display.innerHTML = `
                <div class="strength-bar" style="background-color: ${color}; width: ${Math.max(data.score, 5)}%; height: 5px; border-radius: 3px;"></div>
                <small style="color: ${color}">${data.score}% - ${data.level}</small>
            `;
            }
        });
}

// ========== CREDENTIAL ACTIONS ==========

async function viewPassword(accountId, serviceId, credentialId) {
    try {
        const response = await fetch(`/api/account/${accountId}/service/${serviceId}/credential/${credentialId}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        if (!response.ok) throw new Error('Error obteniendo contraseña');
        const data = await response.json();

        // Fix: Ensure elements exist before assignment
        const elService = document.getElementById('viewService');
        const elUser = document.getElementById('viewUsername');
        const elPass = document.getElementById('viewPassword');

        if (elService) elService.textContent = data.service_name || 'Servicio';
        if (elUser) elUser.textContent = data.username;
        if (elPass) elPass.textContent = data.password;

        // Feedback Toast
        showToast(`Viendo credenciales de ${data.username}`, 'info', 'Acceso a Datos');

        // Check HIBP for the viewed password
        const viewHibpStatus = document.getElementById('viewHibpStatus');
        if (viewHibpStatus) {
            viewHibpStatus.innerHTML = '<span class="hibp-badge checking"><i class="fas fa-spinner fa-spin"></i> Verificando seguridad...</span>';
            const count = await checkHIBP(data.password);
            if (count > 0) {
                viewHibpStatus.innerHTML = `<span class="hibp-badge compromised"><i class="fas fa-exclamation-circle"></i> Filtrada ${count.toLocaleString()} veces</span>`;
                showToast('¡Esta contraseña ha sido filtrada! Recomendamos cambiarla.', 'error', 'Seguridad Comprometida');
            } else {
                viewHibpStatus.innerHTML = '<span class="hibp-badge safe"><i class="fas fa-check-circle"></i> Segura (No filtrada)</span>';
            }
        }

        if (viewModal) viewModal.show();
    } catch (error) {
        console.error('View error:', error);
        alert(error.message);
    }
}

async function copyPassword(event, accountId, serviceId, credentialId) {
    // Fix: Pass event explicitly and capture currentTarget BEFORE await
    const btn = event.currentTarget || event.target.closest('button');
    if (!btn) return;
    const originalHtml = btn.innerHTML;

    try {
        const response = await fetch(`/api/account/${accountId}/service/${serviceId}/credential/${credentialId}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        if (!response.ok) throw new Error('Error de red');
        const data = await response.json();

        await navigator.clipboard.writeText(data.password);

        // Feedback visual en botón
        btn.innerHTML = '<i class="fas fa-check text-success"></i>';
        setTimeout(() => {
            btn.innerHTML = originalHtml;
        }, 1200);

        // Feedback Toast
        showToast('Contraseña copiada al portapapeles', 'success', 'Copiado');
    } catch (error) {
        console.error('Copy error:', error);
        showToast('Error al copiar contraseña', 'error', 'Error');
    }
}

async function deleteCredential(accountId, serviceId, credentialId) {
    customConfirm('Eliminar Credencial', '¿Estás seguro de que deseas eliminar esta credencial?', async () => {
        try {
            const response = await fetch(`/api/account/${accountId}/service/${serviceId}/credential/${credentialId}`, {
                method: 'DELETE',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            if (!response.ok) throw new Error('Error al eliminar credencial');

            displayAccountDetails(accountId);
            refreshV3Dashboard(); // Actualizar dashboard
        } catch (error) {
            customAlert('Error', error.message, 'error');
        }
    });
}

async function copyViewPassword() {
    const pwd = document.getElementById('viewPassword').textContent;
    const btn = document.getElementById('btn-copy-view');
    const originalHtml = btn ? btn.innerHTML : '';

    try {
        await navigator.clipboard.writeText(pwd);
        if (btn) {
            btn.innerHTML = '<i class="fas fa-check"></i>';
            btn.classList.replace('btn-primary', 'btn-success');
            setTimeout(() => {
                btn.innerHTML = originalHtml;
                btn.classList.replace('btn-success', 'btn-primary');
            }, 1200);
        }
    } catch (err) {
        alert('Error al copiar');
    }
}

// ========== V3 DASHBOARD LOGIC ==========

async function refreshV3Dashboard() {
    try {
        const response = await fetch('/api/password-audit', {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        if (!response.ok) return;

        const data = await response.json();
        const total = data.total || 0;

        // 1. Update Summary Header
        document.querySelectorAll('.summary-value')[0].textContent = data.total_services || total;
        document.querySelectorAll('.summary-value')[1].textContent = total;

        const score = total === 0 ? 100 : Math.round((data.secure / total) * 100);
        const scoreBar = document.getElementById('audit-score-bar');
        const scoreText = document.getElementById('audit-score-text');
        const globalBadge = document.getElementById('global-security-badge');

        if (scoreBar) scoreBar.style.width = `${score}%`;
        if (scoreText) scoreText.textContent = `${score}%`;

        if (globalBadge) {
            if (score < 50) {
                globalBadge.className = 'badge bg-danger';
                globalBadge.textContent = 'Riesgo Alto';
            } else if (score < 80) {
                globalBadge.className = 'badge bg-warning';
                globalBadge.textContent = 'Mejorable';
            } else {
                globalBadge.className = 'badge bg-success';
                globalBadge.textContent = 'Protegido';
            }
        }

        // 2. Breach Monitor (Mocked or based on HIBP session cache if we implementation it)
        const breachBadge = document.getElementById('breach-count-badge');
        // Por ahora simulado basándonos en si hay contraseñas inseguras
        const riskCount = data.insecure || 0;
        if (breachBadge) {
            breachBadge.textContent = riskCount > 5 ? 1 : 0;
            if (parseInt(breachBadge.textContent) > 0) {
                breachBadge.parentElement.nextElementSibling.innerHTML = `<i class="fas fa-exclamation-circle me-1 text-danger"></i> Posible exposición`;
                breachBadge.parentElement.nextElementSibling.className = 'small text-danger';
            }
        }

        // 3. Cracking Simulator
        const crackRiskText = document.getElementById('crack-risk-text');
        if (crackRiskText) {
            if (score < 40) {
                crackRiskText.textContent = 'Crítica';
                crackRiskText.className = 'text-danger fw-bold';
            } else if (score < 70) {
                crackRiskText.textContent = 'Media';
                crackRiskText.className = 'text-warning fw-bold';
            } else {
                crackRiskText.textContent = 'Baja';
                crackRiskText.className = 'text-success fw-bold';
            }
        }

        // 4. Reused Passwords
        const reusedText = document.getElementById('reused-count-text');
        const reusedBar = document.getElementById('reused-bar');
        const reusedCount = data.reused || 0;

        if (reusedText) reusedText.textContent = reusedCount;
        if (reusedBar) {
            const reusedPercent = total === 0 ? 0 : Math.round((reusedCount / total) * 100);
            reusedBar.style.width = `${reusedPercent}%`;
            reusedBar.className = reusedCount > 0 ? 'progress-micro-bar bg-danger' : 'progress-micro-bar bg-primary';
        }

        // 5. OSINT Score
        const osintScoreValue = document.getElementById('osint-score-value');
        if (osintScoreValue && data.osint) {
            osintScoreValue.textContent = `${data.osint.score}%`;
        }

    } catch (error) {
        console.error('Error refreshing V3 Dashboard:', error);
    }
}

// ========== SPA SECURITY MODULES LOGIC ==========

async function showSecurityModule(moduleName) {
    const dashboardOverview = document.getElementById('dashboard-overview');
    const emptyState = document.getElementById('empty-state');
    const detailContainer = document.getElementById('account-detail-container');
    const moduleContainer = document.getElementById('security-module-container');

    // Hide everything else
    if (dashboardOverview) dashboardOverview.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    if (detailContainer) detailContainer.style.display = 'none';

    // Show module container
    if (moduleContainer) {
        moduleContainer.style.display = 'block';
        moduleContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-dim">Cargando análisis...</p></div>';
    }

    try {
        const response = await fetch('/api/security-data', {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        if (!response.ok) throw new Error('Error al cargar datos');
        const data = await response.json();

        // Asegurar que audit exista para evitar errores de renderizado
        const audit = data.audit || { total: 0, secure: 0, insecure: 0, reused_count: 0, criteria: { length: 0, symbols: 0, digits: 0 } };
        const osint = data.osint || { score: 100, findings: [] };

        let html = '';
        switch (moduleName) {
            case 'audit':
                html = renderAuditModule(audit);
                break;
            case 'breach':
                html = renderBreachModule(audit);
                break;
            case 'cracking':
                html = renderCrackingModule(audit);
                break;
            case 'reuse':
                html = renderReuseModule(audit);
                break;
            case 'osint':
                html = renderOSINTModule(osint);
                break;
        }

        if (moduleContainer) {
            moduleContainer.innerHTML = html;
        }
    } catch (error) {
        console.error('Error:', error);
        if (moduleContainer) {
            moduleContainer.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    }
}

function hideSecurityModule() {
    const dashboardOverview = document.getElementById('dashboard-overview');
    const moduleContainer = document.getElementById('security-module-container');
    const detailContainer = document.getElementById('account-detail-container');

    if (moduleContainer) moduleContainer.style.display = 'none';

    if (currentAccountId) {
        if (detailContainer) detailContainer.style.display = 'block';
    } else {
        if (dashboardOverview) dashboardOverview.style.display = 'block';
    }

    // Clear selections in sidebar if NOT returning to an account
    if (!currentAccountId) {
        document.querySelectorAll('.email-account').forEach(el => el.classList.remove('selected'));
    }
}

function renderAuditModule(audit) {
    const health = audit.total > 0 ? Math.round(audit.secure / audit.total * 100) : 100;
    const statusClass = audit.secure === audit.total ? 'text-success' : (audit.insecure > audit.total * 0.3 ? 'text-danger' : 'text-warning');
    const riskBarClass = audit.secure === audit.total ? 'bg-success' : (audit.insecure > audit.total * 0.3 ? 'bg-danger' : 'bg-warning');

    return `
        <div class="glass-card mb-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 class="h4 mb-1">Auditoría de Seguridad</h2>
                    <p class="text-dim mb-0">Análisis basado en SANS Institute Standards.</p>
                </div>
                <button class="btn btn-outline-light btn-sm" onclick="hideSecurityModule()">
                    <i class="fas fa-arrow-left me-2"></i>Volver
                </button>
            </div>

            <div class="row">
                <div class="col-md-4">
                    <div class="text-center p-4 border border-white-5 rounded-4 mb-4">
                        <div class="h2 fw-bold mb-0 ${statusClass}">${health}%</div>
                        <div class="text-dim small mb-3">Salud de la Bóveda</div>
                        <div class="progress-micro">
                            <div class="progress-micro-bar ${riskBarClass}" style="width: ${health}%"></div>
                        </div>
                        <span class="badge ${audit.secure === audit.total ? 'bg-success' : (audit.insecure > audit.total * 0.3 ? 'bg-danger' : 'bg-warning')} mt-2">
                            ${(audit.level || 'info').toUpperCase()}
                        </span>
                    </div>
                </div>
                <div class="col-md-8">
                    <p class="small text-dim">Evaluamos entropía (diversidad de caracteres) y patrones comunes. Una puntuación alta asegura resistencia a ataques de fuerza bruta.</p>
                    <div class="table-responsive">
                        <table class="table table-dark table-hover border-0">
                            <thead>
                                <tr class="text-dim border-0" style="font-size: 0.8rem;">
                                    <th>CRITERIO</th>
                                    <th>CUMPLIMIENTO</th>
                                    <th>ESTADO</th>
                                </tr>
                            </thead>
                            <tbody class="border-0">
                                <tr>
                                    <td>Longitud (>12 carac.)</td>
                                    <td>${audit.criteria.has_12_plus} / ${audit.total}</td>
                                    <td><i class="fas ${audit.criteria.has_12_plus === audit.total ? 'fa-check text-success' : 'fa-warning text-warning'}"></i></td>
                                </tr>
                                <tr>
                                    <td>Uso de Símbolos</td>
                                    <td>${audit.criteria.has_symbols} / ${audit.total}</td>
                                    <td><i class="fas ${audit.criteria.has_symbols === audit.total ? 'fa-check text-success' : 'fa-warning text-warning'}"></i></td>
                                </tr>
                                <tr>
                                    <td>Números y Mayúsculas</td>
                                    <td>${audit.criteria.has_digits} / ${audit.total}</td>
                                    <td><i class="fas ${audit.criteria.has_digits === audit.total ? 'fa-check text-success' : 'fa-warning text-warning'}"></i></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            ${audit.insecure_list.length > 0 ? `
                <div class="mt-4">
                    <h6 class="text-danger fw-bold"><i class="fas fa-triangle-exclamation me-2"></i> Contraseñas a Rotar:</h6>
                    <div class="list-group list-group-flush bg-transparent">
                        ${audit.insecure_list.map(item => `
                            <div class="list-group-item bg-transparent border-white-5 text-dim d-flex justify-content-between align-items-center px-0">
                                <span>${item.service} (${item.username})</span>
                                <span class="badge bg-danger rounded-pill" style="font-size: 0.6rem;">BAJA SEGURIDAD</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function renderBreachModule(audit) {
    const isExposed = audit.insecure > 0;
    return `
        <div class="glass-card mb-4 border-danger">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 class="h4 mb-1">Breach Monitor</h2>
                    <p class="text-dim mb-0">Vigilancia activa de filtraciones masivas.</p>
                </div>
                <button class="btn btn-outline-light btn-sm" onclick="hideSecurityModule()">
                    <i class="fas fa-arrow-left me-2"></i>Volver
                </button>
            </div>

            <div class="row align-items-center">
                <div class="col-md-4 text-center">
                    <div class="h2 fw-bold mb-0 ${isExposed ? 'text-danger' : 'text-success'}">${audit.insecure}</div>
                    <div class="text-dim small mb-3">Alertas Activas</div>
                    <span class="badge ${isExposed ? 'bg-danger' : 'bg-success'} mb-4">
                        ${isExposed ? 'EXPUESTO' : 'SEGURO'}
                    </span>
                </div>
                <div class="col-md-8">
                    <div class="p-3 border border-white-5 rounded-4" style="background: rgba(239, 68, 68, 0.05);">
                        <h6 class="text-white mb-2"><i class="fas fa-microchip me-2"></i> Privacidad k-anonymity</h6>
                        <p class="small text-dim mb-0">Comparamos tus credenciales con más de **12 mil millones** de registros filtrados sin que tu contraseña real salga nunca de tu navegador.</p>
                    </div>
                </div>
            </div>

            ${audit.insecure_list.length > 0 ? `
                <h6 class="text-danger fw-bold mt-4 mb-3">Servicios Comprometidos:</h6>
                <div class="row g-3">
                    ${audit.insecure_list.map(item => `
                        <div class="col-sm-6">
                            <div class="glass-card p-3 mb-0" style="background: rgba(239, 68, 68, 0.1);">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <div class="fw-bold">${item.service}</div>
                                        <div class="small text-dim">${item.username}</div>
                                    </div>
                                    <i class="fas fa-exclamation-triangle text-danger"></i>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="text-center py-5">
                    <i class="fas fa-check-circle text-success display-4 mb-3"></i>
                    <p class="text-dim">No se han encontrado tus contraseñas en ninguna filtración conocida.</p>
                </div>
            `}
        </div>
    `;
}

function renderCrackingModule(audit) {
    return `
        <div class="glass-card mb-4" style="border-color: var(--warning);">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 class="h4 mb-1">Ataques por Fuerza Bruta</h2>
                    <p class="text-dim mb-0">Simulación teórica frente a hardware moderno.</p>
                </div>
                <button class="btn btn-outline-light btn-sm" onclick="hideSecurityModule()">
                    <i class="fas fa-arrow-left me-2"></i>Volver
                </button>
            </div>

            <div class="alert alert-warning border-0" style="background: rgba(245, 158, 11, 0.1); color: #fcd34d;">
                <i class="fas fa-info-circle me-2"></i> Un atacante con una RTX 4090 puede probar miles de millones de combinaciones por segundo.
            </div>

            <div class="table-responsive mt-4">
                <table class="table table-dark table-hover mb-0" style="background: transparent;">
                    <thead>
                        <tr class="text-dim small uppercase">
                            <th class="border-white-5">SERVICIO</th>
                            <th class="border-white-5">USUARIO</th>
                            <th class="border-white-5">CONTRASEÑA</th>
                            <th class="border-white-5">TIEMPO ESTIMADO (RTX 4090)</th>
                            <th class="border-white-5 text-center">ESTADO</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${audit.full_report.map(item => `
                            <tr>
                                <td class="border-white-5 fw-bold text-white">${item.service}</td>
                                <td class="border-white-5">
                                    <a href="javascript:void(0)" class="text-info text-decoration-none" onclick="navigateToServiceSearch('${item.service}', '${item.username}')">
                                        <i class="fas fa-search me-1 small opacity-50"></i>${item.username}
                                    </a>
                                </td>
                                <td class="border-white-5 font-monospace text-warning" style="letter-spacing: 2px;">
                                    ${item.password.substring(0, 2)}***${item.password.length > 1 ? item.password.slice(-1) : ''}
                                </td>
                                <td class="border-white-5">
                                    <span class="badge ${item.crack_time.includes('Instantáneo') || item.crack_time.includes('segundos') || item.crack_time.includes('minutos') ? 'bg-danger' : (item.crack_time.includes('horas') || item.crack_time.includes('días') ? 'bg-warning text-dark' : 'bg-success')}" style="font-size: 0.75rem;">
                                        ${item.crack_time}
                                    </span>
                                </td>
                                <td class="border-white-5 text-center">
                                    ${item.is_secure ? '<i class="fas fa-check-circle text-success" style="font-size: 1.1rem;"></i>' : '<i class="fas fa-triangle-exclamation text-danger" style="font-size: 1.1rem;"></i>'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderReuseModule(audit) {
    return `
        <div class="glass-card mb-4" style="border-color: var(--primary);">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 class="h4 mb-1">Contraseñas Reutilizadas</h2>
                    <p class="text-dim mb-0">Detección de patrones de duplicación.</p>
                </div>
                <button class="btn btn-outline-light btn-sm" onclick="hideSecurityModule()">
                    <i class="fas fa-arrow-left me-2"></i>Volver
                </button>
            </div>

            <div class="p-3 border border-white-5 rounded-4 mb-4" style="background: rgba(79, 70, 229, 0.05);">
                <div class="d-flex align-items-center">
                    <div class="h2 mb-0 text-primary me-3">${audit.reused_count || 0}</div>
                    <div>
                        <div class="fw-bold">Conflictos Detectados</div>
                        <div class="small text-dim">La reutilización causa un "efecto dominó" en caso de hackeo.</div>
                    </div>
                </div>
            </div>

            <p class="small text-dim mb-3">Servicios que comparten la misma contraseña:</p>
            <div class="table-responsive">
                <table class="table table-dark table-hover mb-0">
                    <thead>
                        <tr class="text-dim" style="font-size: 0.8rem;">
                            <th>SERVICIO</th>
                            <th>USUARIO</th>
                            <th>ESTADO</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${audit.insecure_list.slice(0, 5).map(item => `
                            <tr>
                                <td>${item.service}</td>
                                <td>${item.username}</td>
                                <td><span class="badge bg-warning text-dark">RIESGO</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ${(audit.reused_count || 0) > 0 ? `<p class="mt-3 small text-warning"><i class="fas fa-exclamation-circle me-1"></i> Se recomienda cambiar estas contraseñas por valores únicos generados aleatoriamente.</p>` : ''}
        </div>
    `;
}

function renderOSINTModule(osint) {
    if (!osint) return '<div class="alert alert-info">Cargando datos OSINT...</div>';

    const findings = osint.findings || [];
    const score = osint.score ?? 100;
    const statusClass = score === 100 ? 'text-success' : (score < 50 ? 'text-danger' : 'text-warning');

    return `
        <div class="glass-card mb-4" style="border-color: var(--primary);">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 class="h4 mb-1">OSINT & Patrones Personales</h2>
                    <p class="text-dim mb-0">Detecta el uso de información personal en tus claves.</p>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-primary btn-sm rounded-pill" onclick="showProfileModal()">
                        <i class="fas fa-user-edit me-2"></i>Configurar Perfil
                    </button>
                    <button class="btn btn-outline-light btn-sm" onclick="hideSecurityModule()">
                        <i class="fas fa-arrow-left me-2"></i>Volver
                    </button>
                </div>
            </div>

            <div class="row g-4 mb-4">
                <div class="col-md-4">
                    <div class="text-center p-4 border border-white-5 rounded-4 h-100 d-flex flex-column justify-content-center" style="background: rgba(99, 102, 241, 0.05);">
                        <div class="h1 fw-bold mb-0 ${statusClass}">${score}%</div>
                        <div class="text-dim small mb-3">Puntuación de Privacidad</div>
                        <div class="progress-micro">
                            <div class="progress-micro-bar bg-primary" style="width: ${score}%"></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-8">
                    <div class="glass-card p-3 mb-0 h-100 border-0" style="background: rgba(255, 255, 255, 0.02);">
                        <h6 class="text-white mb-2"><i class="fas fa-info-circle me-2 text-primary"></i>¿Por qué es importante?</h6>
                        <p class="small text-dim mb-0">Los atacantes suelen usar técnicas de **Ingeniería Social** para adivinar contraseñas basadas en nombres de familiares, mascotas o fechas de nacimiento. Evitar estos patrones dificulta enormemente el descifrado manual.</p>
                    </div>
                </div>
            </div>

            <h6 class="text-white fw-bold mb-3"><i class="fas fa-search me-2 text-primary"></i>Hallazgos del Análisis:</h6>
            ${findings.length > 0 ? `
                <div class="table-responsive">
                    <table class="table table-dark table-hover mb-0">
                        <thead>
                            <tr class="text-dim" style="font-size: 0.8rem;">
                                <th>SERVICIO</th>
                                <th>USO DETECTADO</th>
                                <th>RIESGO</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${findings.map(f => `
                                <tr>
                                    <td><span class="text-white">${f.service}</span> <br><small class="text-dim">${f.account} (${f.username})</small></td>
                                    <td><span class="badge bg-warning-subtle text-warning">${f.patterns.join(', ')}</span></td>
                                    <td><span class="text-danger small"><i class="fas fa-exclamation-triangle me-1"></i> Predecible</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div class="text-center py-5 border border-white-5 rounded-4" style="border-style: dashed !important;">
                    <i class="fas fa-user-check text-success display-4 mb-3 opacity-50"></i>
                    <p class="text-dim mb-0">No hemos detectado información de tu perfil en tus contraseñas.</p>
                    <p class="small text-dim opacity-50">Asegúrate de haber configurado tu perfil en el botón superior.</p>
                </div>
            `}
        </div>
    `;
}

async function showProfileModal() {
    try {
        const response = await fetch('/api/user-profile', {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        if (response.ok) {
            const profile = await response.json();
            document.getElementById('profileFullName').value = profile.full_name || '';
            document.getElementById('profilePets').value = profile.pets ? profile.pets.join(', ') : '';
            document.getElementById('profileLocations').value = profile.locations ? profile.locations.join(', ') : '';
            document.getElementById('profileKeywords').value = profile.other_keywords ? profile.other_keywords.join(', ') : '';
            document.getElementById('profilePhone').value = profile.phone || '';
            document.getElementById('profileJob').value = profile.job_title || '';
            document.getElementById('profileColor').value = profile.favorite_color || '';
            document.getElementById('profileHobbies').value = profile.hobbies ? profile.hobbies.join(', ') : '';
        }
    } catch (e) {
        console.error('Error cargando perfil:', e);
    }
    profileModal.show();
}

async function saveUserProfile() {
    const data = {
        full_name: document.getElementById('profileFullName').value.trim(),
        pets: document.getElementById('profilePets').value.split(',').map(s => s.trim()).filter(s => s),
        locations: document.getElementById('profileLocations').value.split(',').map(s => s.trim()).filter(s => s),
        other_keywords: document.getElementById('profileKeywords').value.split(',').map(s => s.trim()).filter(s => s),
        phone: document.getElementById('profilePhone').value.trim(),
        job_title: document.getElementById('profileJob').value.trim(),
        favorite_color: document.getElementById('profileColor').value.trim(),
        hobbies: document.getElementById('profileHobbies').value.split(',').map(s => s.trim()).filter(s => s)
    };

    try {
        const response = await fetch('/api/user-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            profileModal.hide();
            showToast('Perfil actualizado. Re-analizando...', 'success', 'Personalización');
            refreshV3Dashboard();
            // Si estamos en el módulo OSINT, recargar
            const moduleContainer = document.getElementById('security-module-container');
            if (moduleContainer && moduleContainer.style.display !== 'none') {
                showSecurityModule('osint');
            }
        } else {
            customAlert('Error', 'No se pudo guardar el perfil', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        customAlert('Error', 'Error de conexión al guardar perfil', 'error');
    }
}
