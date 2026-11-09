
// CONFIGURATION & CONSTANTS
const CONFIG = {
    NASA_API_KEY: 'DEMO_KEY',
    NASA_API_URL: 'https://api.nasa.gov/planetary/apod',
    NASA_FALLBACK_URL: 'https://science.nasa.gov/wp-json/wp/v2/apod-basic',
    SPACEDEVS_API_URL: 'https://lldev.thespacedevs.com/2.3.0/launches/upcoming/?limit=10',
    SOLAR_SYSTEM_API_URL: 'https://solar-system-opendata-proxy.vercel.app/api/planets',
    SOLAR_SYSTEM_FALLBACK_URL: 'https://api.le-systeme-solaire.net/rest/bodies?filter[]=isPlanet,eq,true'
};

const PLANET_CONFIG = {
    mercury: { color: '#eab308', au: '0.39 AU', pillClass: 'bg-orange-500/50 text-orange-200' },
    venus: { color: '#f97316', au: '0.72 AU', pillClass: 'bg-orange-500/50 text-orange-200' },
    earth: { color: '#3b82f6', au: '1.00 AU', pillClass: 'bg-blue-500/50 text-blue-200' },
    mars: { color: '#ef4444', au: '1.52 AU', pillClass: 'bg-red-500/50 text-red-200' },
    jupiter: { color: '#fb923c', au: '5.20 AU', pillClass: 'bg-purple-500/50 text-purple-200' },
    saturn: { color: '#facc15', au: '9.58 AU', pillClass: 'bg-yellow-500/50 text-yellow-200' },
    uranus: { color: '#06b6d4', au: '19.22 AU', pillClass: 'bg-cyan-500/50 text-cyan-200' },
    neptune: { color: '#2563eb', au: '30.05 AU', pillClass: 'bg-blue-500/50 text-blue-200' }
};

const PLANET_FACTS = {
    mercury: [
        'Smallest planet in our solar system and closest to the Sun',
        'Has no atmosphere and experiences extreme temperature swings',
        'A year on Mercury is only 88 Earth days',
        'Heavily cratered surface resembling Earth\'s Moon'
    ],
    venus: [
        'Hottest planet in the solar system due to greenhouse effect',
        'Spins backward compared to most other planets',
        'A day on Venus is longer than a year on Venus',
        'Thick atmosphere composed mostly of carbon dioxide'
    ],
    earth: [
        'Only known planet with liquid water',
        'Atmosphere contains 78% nitrogen',
        'Magnetic field protects from solar wind',
        'Formed 4.54 billion years ago'
    ],
    mars: [
        'Known as the Red Planet due to iron oxide surface',
        'Home to Olympus Mons, largest volcano in solar system',
        'Has two small moons: Phobos and Deimos',
        'Evidence of ancient river valleys and lake beds'
    ],
    jupiter: [
        'Largest planet in the solar system',
        'Famous for the Great Red Spot storm',
        'Has more than 90 confirmed moons',
        'Fastest spinning planet with a 10-hour day'
    ],
    saturn: [
        'Famous for its spectacular ring system',
        'Least dense planet in the Solar System',
        'Has over 140 moons, including Titan',
        'Composed primarily of hydrogen and helium'
    ],
    uranus: [
        'Rotates on its side with a 98-degree axial tilt',
        'Ice giant with faint ring system',
        'Has 28 known moons named after literature',
        'Coldest atmosphere in the solar system'
    ],
    neptune: [
        'Most distant planet from the Sun',
        'Has the fiercest winds in the solar system',
        'Vibrant blue color from methane in atmosphere',
        'Takes 165 Earth years to complete one orbit'
    ]
};

// STATE
const state = {
    currentSection: 'today-in-space',
    apod: null,
    launches: [],
    planets: [],
    selectedPlanet: null
};

// UTILITY FUNCTIONS
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatFullDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatUtcTime(dateStr) {
    if (!dateStr) return 'TBD';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'TBD';
    const h = String(d.getUTCHours()).padStart(2, '0');
    const m = String(d.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m} UTC`;
}

function calculateDaysUntil(dateStr) {
    if (!dateStr) return '2';
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff <= 0) return '0';
    return String(Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getPlanetStandardKey(planet) {
    const name = (planet.englishName || planet.name || planet.id || '').toLowerCase();
    if (name.includes('mercur') || name.includes('mercure')) return 'mercury';
    if (name.includes('venu')) return 'venus';
    if (name.includes('earth') || name.includes('terre')) return 'earth';
    if (name.includes('mar')) return 'mars';
    if (name.includes('jupit')) return 'jupiter';
    if (name.includes('saturn')) return 'saturn';
    if (name.includes('uran')) return 'uranus';
    if (name.includes('neptun')) return 'neptune';
    return 'earth';
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 1. TODAY IN SPACE (NASA APOD API)
async function initApod() {
    const dateInput = document.getElementById('apod-date-input');
    const loadDateBtn = document.getElementById('load-date-btn');
    const todayBtn = document.getElementById('today-apod-btn');
    const fullResBtn = document.querySelector('#apod-image-container button');

    // Set today as max allowed date
    const today = new Date().toISOString().split('T')[0];
    if (dateInput) {
        dateInput.max = today;
        dateInput.value = today;
        updateDateDisplay(today);
    }

    await loadApod();

    if (loadDateBtn && dateInput) {
        loadDateBtn.addEventListener('click', () => {
            if (dateInput.value) {
                updateDateDisplay(dateInput.value);
                loadApod(dateInput.value);
            }
        });
    }

    if (dateInput) {
        dateInput.addEventListener('change', () => {
            if (dateInput.value) {
                updateDateDisplay(dateInput.value);
                loadApod(dateInput.value);
            }
        });
    }

    if (todayBtn && dateInput) {
        todayBtn.addEventListener('click', () => {
            dateInput.value = today;
            updateDateDisplay(today);
            loadApod();
        });
    }

    if (fullResBtn) {
        fullResBtn.addEventListener('click', () => {
            if (state.apod && (state.apod.hdurl || state.apod.url)) {
                window.open(state.apod.hdurl || state.apod.url, '_blank');
            }
        });
    }
}

function updateDateDisplay(dateStr) {
    const wrapper = document.querySelector('.date-input-wrapper');
    if (!wrapper) return;
    const formatted = formatDate(dateStr);
    const span = wrapper.querySelector('span');
    if (span) span.textContent = formatted;
    wrapper.setAttribute('data-date', formatted);
}

async function loadApod(date = null) {
    const loading = document.getElementById('apod-loading');
    const image = document.getElementById('apod-image');
    const title = document.getElementById('apod-title');
    const headerDate = document.getElementById('apod-date');
    const detailDate = document.getElementById('apod-date-detail');
    const explanation = document.getElementById('apod-explanation');
    const copyright = document.getElementById('apod-copyright');
    const infoDate = document.getElementById('apod-date-info');
    const mediaType = document.getElementById('apod-media-type');
    const container = document.getElementById('apod-image-container');

    if (loading) loading.classList.remove('hidden');
    if (image) image.style.opacity = '0';

    const existingIframe = container ? container.querySelector('iframe') : null;
    if (existingIframe) existingIframe.remove();

    try {
        let data = null;
        let url = `${CONFIG.NASA_API_URL}?api_key=${CONFIG.NASA_API_KEY}`;
        if (date) url += `&date=${date}`;

        // 1. Direct NASA APOD API call
        try {
            const res = await fetch(url);
            if (res.ok) {
                data = await res.json();
            }
        } catch (e) {
            console.warn('NASA API call failed, using fallback:', e);
        }

        // 2. Direct fallback to science.nasa.gov if NASA key is rate-limited
        if (!data) {
            const fallbackUrl = date
                ? `${CONFIG.NASA_FALLBACK_URL}?date=${date}`
                : `${CONFIG.NASA_FALLBACK_URL}?per_page=1`;
            const fallbackRes = await fetch(fallbackUrl);
            if (fallbackRes.ok) {
                const list = await fallbackRes.json();
                const item = Array.isArray(list) ? list[0] : list;
                if (item) {
                    const temp = document.createElement('div');
                    temp.innerHTML = item.explanation || '';
                    const cleanText = temp.textContent || temp.innerText || '';
                    data = {
                        title: item.title,
                        date: item.date,
                        url: item.hdurl || item.url,
                        hdurl: item.hdurl || item.url,
                        media_type: item.media_type || 'image',
                        explanation: cleanText.replace(/^Explanation:\s*/i, ''),
                        copyright: item.copyright ? item.copyright.replace(/<[^>]*>/g, '') : 'NASA'
                    };
                }
            }
        }

        if (!data) throw new Error('Could not load Astronomy Picture');

        state.apod = data;

        if (headerDate) headerDate.textContent = `Astronomy Picture of the Day - ${formatFullDate(data.date)}`;
        if (title) title.textContent = data.title || 'Astronomy Picture of the Day';
        if (detailDate) detailDate.innerHTML = `<i class="far fa-calendar mr-2"></i>${data.date}`;
        if (explanation) explanation.textContent = data.explanation || '';
        if (copyright) copyright.textContent = `© ${data.copyright || 'NASA/JPL'}`;
        if (infoDate) infoDate.textContent = data.date;
        if (mediaType) mediaType.textContent = (data.media_type || 'Image').charAt(0).toUpperCase() + (data.media_type || 'Image').slice(1);

        if (data.media_type === 'video') {
            if (image) image.classList.add('hidden');
            const iframe = document.createElement('iframe');
            iframe.className = 'w-full h-full object-cover rounded-2xl';
            iframe.src = data.url;
            iframe.allowFullscreen = true;
            if (container) container.insertBefore(iframe, container.firstChild);
        } else {
            if (image) {
                image.classList.remove('hidden');
                image.src = data.url || './assets/images/placeholder.webp';
                image.alt = data.title || 'Astronomy Picture of the Day';
                image.onload = () => { image.style.opacity = '1'; };
            }
        }
    } catch (err) {
        console.error('APOD Error:', err);
        if (title) title.textContent = 'Astronomy Picture of the Day';
    } finally {
        if (loading) loading.classList.add('hidden');
        if (image && state.apod?.media_type !== 'video') image.style.opacity = '1';
    }
}

// 2. LAUNCHES (SPACEDEVS API)
async function initLaunches() {
    await loadLaunches();
}

async function loadLaunches() {
    const featured = document.getElementById('featured-launch');
    const grid = document.getElementById('launches-grid');
    const countSpan = document.getElementById('launches-count');
    const countMobile = document.getElementById('launches-count-mobile');

    try {
        const res = await fetch(CONFIG.SPACEDEVS_API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const launches = data.results || [];
        state.launches = launches;

        if (countSpan) countSpan.textContent = `${launches.length} Launches`;
        if (countMobile) countMobile.textContent = `${launches.length}`;

        if (launches.length > 0) {
            renderFeaturedLaunch(launches[0]);
            renderLaunchesGrid(launches.slice(1));
        }
    } catch (e) {
        console.error('Launches API Error:', e);
    }
}

function renderFeaturedLaunch(launch) {
    const container = document.getElementById('featured-launch');
    if (!container) return;

    const abbrev = (launch.status?.abbrev || 'Go').toUpperCase();
    let statusText = 'Go';
    let statusClass = 'bg-green-500/20 text-green-400';
    if (abbrev.includes('TBC') || abbrev.includes('TBD')) {
        statusText = abbrev.includes('TBC') ? 'TBC' : 'TBD';
        statusClass = 'bg-yellow-500/20 text-yellow-400';
    } else if (abbrev.includes('HOLD') || abbrev.includes('FAIL')) {
        statusText = 'Hold';
        statusClass = 'bg-red-500/20 text-red-400';
    }

    const daysUntil = calculateDaysUntil(launch.net);
    const provider = launch.launch_service_provider?.name || 'SpaceX';
    const rocket = launch.rocket?.configuration?.name || 'Rocket';
    const location = launch.pad?.name || launch.pad?.location?.name || 'Starbase, Texas';
    const country = launch.pad?.country?.name || launch.pad?.location?.country?.name || 'USA';
    const desc = launch.mission?.description || 'The flight test of the next generation heavy-lift launch vehicle.';
    const imgUrl = launch.image?.image_url || (typeof launch.image === 'string' ? launch.image : null);

    // Exact markup and classes from the original design
    container.innerHTML = `
    <div class="relative bg-slate-800/30 border border-slate-700 rounded-3xl overflow-hidden group hover:border-blue-500/50 transition-all">
      <div class="absolute inset-0 bg-linear-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div class="relative grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">
        <div class="flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <span class="px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold flex items-center gap-2">
                <i class="fas fa-star"></i>
                Featured Launch
              </span>
              <span class="px-4 py-1.5 ${statusClass} rounded-full text-sm font-semibold">
                ${statusText}
              </span>
            </div>
            <h3 class="text-3xl font-bold mb-3 leading-tight">
              ${escapeHtml(launch.name)}
            </h3>
            <div class="flex flex-col xl:flex-row xl:items-center gap-4 mb-6 text-slate-400">
              <div class="flex items-center gap-2">
                <i class="fas fa-building"></i>
                <span>${escapeHtml(provider)}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="fas fa-rocket"></i>
                <span>${escapeHtml(rocket)}</span>
              </div>
            </div>
            <div class="inline-flex items-center gap-3 px-6 py-3 bg-linear-to-r from-blue-500/20 to-purple-500/20 rounded-xl mb-6">
              <i class="fas fa-clock text-2xl text-blue-400"></i>
              <div>
                <p class="text-2xl font-bold text-blue-400">${daysUntil}</p>
                <p class="text-xs text-slate-400">Days Until Launch</p>
              </div>
            </div>
            <div class="grid xl:grid-cols-2 gap-4 mb-6">
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2">
                  <i class="fas fa-calendar"></i>
                  Launch Date
                </p>
                <p class="font-semibold">${formatFullDate(launch.net)}</p>
              </div>
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2">
                  <i class="fas fa-clock"></i>
                  Launch Time
                </p>
                <p class="font-semibold">${formatUtcTime(launch.net)}</p>
              </div>
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2">
                  <i class="fas fa-map-marker-alt"></i>
                  Location
                </p>
                <p class="font-semibold text-sm line-clamp-1">${escapeHtml(location)}</p>
              </div>
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2">
                  <i class="fas fa-globe"></i>
                  Country
                </p>
                <p class="font-semibold">${escapeHtml(country)}</p>
              </div>
            </div>
            <p class="text-slate-300 leading-relaxed mb-6">
              ${escapeHtml(desc)}
            </p>
          </div>
          <div class="flex flex-col md:flex-row gap-3">
            <button
              class="flex-1 self-start md:self-center px-6 py-3 bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <i class="fas fa-info-circle"></i>
              View Full Details
            </button>
            <div class="icons self-end md:self-center">
              <button
                class="px-4 py-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors"
              >
                <i class="far fa-heart"></i>
              </button>
              <button
                class="px-4 py-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors"
              >
                <i class="fas fa-bell"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="relative">
          <div class="relative h-full min-h-[400px] rounded-2xl overflow-hidden bg-slate-900/50">
            ${imgUrl
            ? `<img class="w-full h-full object-cover" src="${imgUrl}" alt="${escapeHtml(launch.name)}" onerror="this.outerHTML='<div class=\\'flex items-center justify-center h-full min-h-[400px] bg-slate-800\\'><i class=\\'fas fa-rocket text-9xl text-slate-700/50\\'></i></div>'" />`
            : `<div class="flex items-center justify-center h-full min-h-[400px] bg-slate-800"><i class="fas fa-rocket text-9xl text-slate-700/50"></i></div>`
        }
            <div class="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderLaunchesGrid(launches) {
    const container = document.getElementById('launches-grid');
    if (!container) return;

    container.innerHTML = launches.map(launch => {
        const abbrev = (launch.status?.abbrev || 'Go').toUpperCase();
        let statusText = 'Go';
        let statusClass = 'bg-green-500/90';
        if (abbrev.includes('TBC')) {
            statusText = 'TBC';
            statusClass = 'bg-yellow-500/90';
        } else if (abbrev.includes('TBD')) {
            statusText = 'TBD';
            statusClass = 'bg-blue-500/90';
        } else if (abbrev.includes('HOLD') || abbrev.includes('FAIL')) {
            statusText = 'Hold';
            statusClass = 'bg-red-500/90';
        }

        const provider = launch.launch_service_provider?.name || 'Rocket Lab';
        const rocket = launch.rocket?.configuration?.name || 'Electron';
        const location = launch.pad?.name || launch.pad?.location?.name || 'Launch Site';
        const imgUrl = launch.image?.image_url || (typeof launch.image === 'string' ? launch.image : null);

        // Exact card markup and pill/button classes from original template
        return `
      <div class="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group cursor-pointer">
        <div class="relative h-48 bg-slate-900/50 flex items-center justify-center overflow-hidden">
          ${imgUrl
                ? `<img class="w-full h-full object-cover group-hover:scale-105 transition-transform" src="${imgUrl}" alt="${escapeHtml(launch.name)}" onerror="this.outerHTML='<i class=\\'fas fa-rocket text-5xl text-slate-700\\'></i>'" />`
                : `<i class="fas fa-rocket text-5xl text-slate-700"></i>`
            }
          <div class="absolute inset-0 bg-linear-to-t from-slate-900/80 via-transparent to-transparent pointer-events-none"></div>
          <div class="absolute top-3 right-3">
            <span class="px-3 py-1 ${statusClass} text-white backdrop-blur-sm rounded-full text-xs font-semibold">
              ${statusText}
            </span>
          </div>
        </div>
        <div class="p-5">
          <div class="mb-3">
            <h4 class="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
              ${escapeHtml(launch.name)}
            </h4>
            <p class="text-sm text-slate-400 flex items-center gap-2">
              <i class="fas fa-building text-xs"></i>
              ${escapeHtml(provider)}
            </p>
          </div>
          <div class="space-y-2 mb-4">
            <div class="flex items-center gap-2 text-sm">
              <i class="fas fa-calendar text-slate-500 w-4"></i>
              <span class="text-slate-300">${formatDate(launch.net)}</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <i class="fas fa-clock text-slate-500 w-4"></i>
              <span class="text-slate-300">${formatUtcTime(launch.net)}</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <i class="fas fa-rocket text-slate-500 w-4"></i>
              <span class="text-slate-300">${escapeHtml(rocket)}</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <i class="fas fa-map-marker-alt text-slate-500 w-4"></i>
              <span class="text-slate-300 line-clamp-1">${escapeHtml(location)}</span>
            </div>
          </div>
          <div class="flex items-center gap-2 pt-4 border-t border-slate-700">
            <button class="flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-sm font-semibold">
              Details
            </button>
            <button class="px-3 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
              <i class="far fa-heart"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    }).join('');
}

// 3. PLANETS (SOLAR SYSTEM OPEN DATA)
async function initPlanets() {
    await loadPlanets();
}

async function loadPlanets() {
    try {
        let bodies = [];

        // 1. Try Solar System proxy API
        try {
            const res = await fetch(CONFIG.SOLAR_SYSTEM_API_URL);
            if (res.ok) {
                const data = await res.json();
                bodies = data.bodies || (Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.warn('Proxy API error, trying fallback:', e);
        }

        // 2. Direct fallback
        if (!bodies || bodies.length === 0) {
            const res = await fetch(CONFIG.SOLAR_SYSTEM_FALLBACK_URL);
            if (res.ok) {
                const data = await res.json();
                bodies = data.bodies || [];
            }
        }

        const planets = bodies.filter(b => b.isPlanet || b.bodyType === 'Planet');
        planets.sort((a, b) => (a.semimajorAxis || 0) - (b.semimajorAxis || 0));

        state.planets = planets;

        renderPlanetCards(planets);
        renderPlanetTable(planets);

        // Default to Earth or first planet
        const earth = planets.find(p => getPlanetStandardKey(p) === 'earth') || planets[0];
        if (earth) selectPlanet(earth);
    } catch (err) {
        console.error('Planets API Error:', err);
    }
}

function renderPlanetCards(planets) {
    const grid = document.getElementById('planets-grid');
    if (!grid) return;

    grid.innerHTML = planets.map(planet => {
        const key = getPlanetStandardKey(planet);
        const cfg = PLANET_CONFIG[key] || { color: '#3b82f6', au: '1.00 AU' };
        const au = planet.semimajorAxis ? (planet.semimajorAxis / 149597870.7).toFixed(2) + ' AU' : cfg.au;

        // Exact card classes and hover styles from original HTML
        return `
      <div
        class="planet-card bg-slate-800/50 border border-slate-700 rounded-2xl p-4 transition-all cursor-pointer group"
        data-planet-id="${key}"
        style="--planet-color: ${cfg.color}"
        onmouseover="this.style.borderColor='${cfg.color}80'"
        onmouseout="this.style.borderColor='${state.selectedPlanet && getPlanetStandardKey(state.selectedPlanet) === key ? cfg.color : '#334155'}'"
      >
        <div class="relative mb-3 h-24 flex items-center justify-center">
          <img
            class="w-20 h-20 object-contain group-hover:scale-110 transition-transform"
            src="./assets/images/${key}.png"
            alt="${escapeHtml(planet.englishName)}"
            onerror="this.src='${planet.image || './assets/images/earth.png'}'"
          />
        </div>
        <h4 class="font-semibold text-center text-sm">${escapeHtml(planet.englishName)}</h4>
        <p class="text-xs text-slate-400 text-center">${au}</p>
      </div>
    `;
    }).join('');

    grid.querySelectorAll('.planet-card').forEach(card => {
        card.addEventListener('click', () => {
            const key = card.getAttribute('data-planet-id');
            const found = state.planets.find(p => getPlanetStandardKey(p) === key);
            if (found) selectPlanet(found);
        });
    });
}

function selectPlanet(planet) {
    state.selectedPlanet = planet;
    const key = getPlanetStandardKey(planet);
    const cfg = PLANET_CONFIG[key] || { color: '#3b82f6' };

    // Update top cards border without injecting foreign utility classes
    document.querySelectorAll('.planet-card').forEach(card => {
        if (card.getAttribute('data-planet-id') === key) {
            card.style.borderColor = cfg.color;
        } else {
            card.style.borderColor = '#334155';
        }
    });

    // Update comparison table active row (original class: bg-blue-500/5)
    document.querySelectorAll('#planet-comparison-tbody tr').forEach(row => {
        if (row.getAttribute('data-planet-id') === key) {
            row.classList.add('bg-blue-500/5');
        } else {
            row.classList.remove('bg-blue-500/5');
        }
    });

    // Update detail view
    const img = document.getElementById('planet-detail-image');
    const name = document.getElementById('planet-detail-name');
    const desc = document.getElementById('planet-detail-description');
    const dist = document.getElementById('planet-distance');
    const radius = document.getElementById('planet-radius');
    const mass = document.getElementById('planet-mass');
    const density = document.getElementById('planet-density');
    const orbit = document.getElementById('planet-orbital-period');
    const rotation = document.getElementById('planet-rotation');
    const moons = document.getElementById('planet-moons');
    const gravity = document.getElementById('planet-gravity');

    const discoverer = document.getElementById('planet-discoverer');
    const discoveryDate = document.getElementById('planet-discovery-date');
    const bodyType = document.getElementById('planet-body-type');
    const volume = document.getElementById('planet-volume');

    const factsList = document.getElementById('planet-facts');
    const perihelion = document.getElementById('planet-perihelion');
    const aphelion = document.getElementById('planet-aphelion');
    const eccentricity = document.getElementById('planet-eccentricity');
    const inclination = document.getElementById('planet-inclination');
    const axialTilt = document.getElementById('planet-axial-tilt');
    const temp = document.getElementById('planet-temp');
    const escapeVel = document.getElementById('planet-escape');

    if (img) {
        img.src = `./assets/images/${key}.png`;
        img.alt = `${planet.englishName} planet detailed realistic render`;
    }
    if (name) name.textContent = planet.englishName;
    if (desc) desc.textContent = planet.description || `${planet.englishName} is one of the major celestial bodies orbiting our Sun.`;

    if (dist) dist.textContent = planet.semimajorAxis ? `${(planet.semimajorAxis / 1e6).toFixed(1)}M km` : '149.6M km';
    if (radius) radius.textContent = planet.meanRadius ? `${Math.round(planet.meanRadius).toLocaleString()} km` : '6,371 km';
    if (mass) {
        if (planet.mass?.massValue && planet.mass?.massExponent) {
            mass.textContent = `${planet.mass.massValue.toFixed(2)} × 10^${planet.mass.massExponent} kg`;
        } else {
            mass.textContent = '5.97 × 10²⁴ kg';
        }
    }
    if (density) density.textContent = planet.density ? `${planet.density.toFixed(2)} g/cm³` : '5.51 g/cm³';
    if (orbit) {
        if (planet.sideralOrbit) {
            orbit.textContent = planet.sideralOrbit > 365.25
                ? `${(planet.sideralOrbit / 365.25).toFixed(2)} Earth years`
                : `${planet.sideralOrbit.toFixed(1)} days`;
        } else {
            orbit.textContent = '365.25 days';
        }
    }
    if (rotation) {
        if (planet.sideralRotation !== undefined && planet.sideralRotation !== null) {
            const hrs = Math.abs(planet.sideralRotation);
            rotation.textContent = `${hrs.toFixed(1)} hours${planet.sideralRotation < 0 ? ' (Retrograde)' : ''}`;
        } else {
            rotation.textContent = '24 hours';
        }
    }
    if (moons) moons.textContent = String(planet.moons ? planet.moons.length : 0);
    if (gravity) gravity.textContent = planet.gravity ? `${planet.gravity} m/s²` : '9.8 m/s²';

    if (discoverer) discoverer.textContent = planet.discoveredBy || 'Known since antiquity';
    if (discoveryDate) discoveryDate.textContent = planet.discoveryDate || 'Ancient';
    if (bodyType) bodyType.textContent = planet.bodyType || 'Planet';
    if (volume) {
        if (planet.vol?.volValue && planet.vol?.volExponent) {
            volume.textContent = `${planet.vol.volValue.toFixed(2)} × 10^${planet.vol.volExponent} km³`;
        } else {
            volume.textContent = 'N/A';
        }
    }

    // Quick fact
    if (factsList) {
        const facts = PLANET_FACTS[key] || [
            `${planet.englishName} is a planet in our Solar System.`,
            `Orbital eccentricity is ${planet.eccentricity || '0.0167'}.`,
            `Formed over 4.5 billion years ago.`
        ];
        factsList.innerHTML = facts.map(f => `
      <li class="flex items-start">
        <i class="fas fa-check text-green-400 mt-1 mr-2"></i>
        <span class="text-slate-300">${escapeHtml(f)}</span>
      </li>
    `).join('');
    }

    if (perihelion) perihelion.textContent = planet.perihelion ? `${(planet.perihelion / 1e6).toFixed(1)}M km` : '147.1M km';
    if (aphelion) aphelion.textContent = planet.aphelion ? `${(planet.aphelion / 1e6).toFixed(1)}M km` : '152.1M km';
    if (eccentricity) eccentricity.textContent = planet.eccentricity !== undefined ? planet.eccentricity : '0.0167';
    if (inclination) inclination.textContent = planet.inclination !== undefined ? `${planet.inclination}°` : '0.00°';
    if (axialTilt) axialTilt.textContent = planet.axialTilt !== undefined ? `${planet.axialTilt}°` : '23.44°';
    if (temp) {
        temp.textContent = planet.avgTemp !== undefined && planet.avgTemp !== null
            ? `${Math.round(planet.avgTemp - 273.15)}°C`
            : '15°C';
    }
    if (escapeVel) escapeVel.textContent = planet.escape ? `${(planet.escape / 1000).toFixed(1)} km/s` : '11.2 km/s';
}

function renderPlanetTable(planets) {
    const tbody = document.getElementById('planet-comparison-tbody');
    if (!tbody) return;

    const EARTH_MASS = 5.97237 * 1e24;

    tbody.innerHTML = planets.map(planet => {
        const key = getPlanetStandardKey(planet);
        const cfg = PLANET_CONFIG[key] || { color: '#3b82f6', au: '1.00', pillClass: 'bg-blue-500/50 text-blue-200' };
        const au = planet.semimajorAxis ? (planet.semimajorAxis / 149597870.7).toFixed(2) : cfg.au;
        const diameter = planet.meanRadius ? Math.round(planet.meanRadius * 2).toLocaleString() : '12,742';

        let massRatio = '1.000';
        if (planet.mass?.massValue && planet.mass?.massExponent) {
            const kg = planet.mass.massValue * Math.pow(10, planet.mass.massExponent);
            massRatio = (kg / EARTH_MASS).toFixed(3);
        }

        let orbitText = '365.2 days';
        if (planet.sideralOrbit) {
            orbitText = planet.sideralOrbit > 365.25
                ? `${(planet.sideralOrbit / 365.25).toFixed(1)} years`
                : `${Math.round(planet.sideralOrbit)} days`;
        }

        const moonsCount = planet.moons ? planet.moons.length : 0;
        const type = planet.type || (key === 'uranus' || key === 'neptune' ? 'Ice Giant' : key === 'jupiter' || key === 'saturn' ? 'Gas Giant' : 'Terrestrial');
        const isActive = state.selectedPlanet && getPlanetStandardKey(state.selectedPlanet) === key;

        // Exact row markup, table cells, and pills as defined in original template
        return `
      <tr class="hover:bg-slate-800/30 transition-colors ${isActive ? 'bg-blue-500/5' : ''}" data-planet-id="${key}">
        <td class="px-4 md:px-6 py-3 md:py-4 sticky left-0 bg-slate-800 z-10">
          <div class="flex items-center space-x-2 md:space-x-3">
            <div class="w-6 h-6 md:w-8 md:h-8 rounded-full flex-shrink-0" style="background-color: ${cfg.color}"></div>
            <span class="font-semibold text-sm md:text-base whitespace-nowrap">${escapeHtml(planet.englishName)}</span>
          </div>
        </td>
        <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">${au}</td>
        <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">${diameter}</td>
        <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">${massRatio}</td>
        <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">${orbitText}</td>
        <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">${moonsCount}</td>
        <td class="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
          <span class="px-2 py-1 rounded text-xs ${cfg.pillClass}">${escapeHtml(type)}</span>
        </td>
      </tr>
    `;
    }).join('');

    tbody.querySelectorAll('tr').forEach(row => {
        row.addEventListener('click', () => {
            const key = row.getAttribute('data-planet-id');
            const found = state.planets.find(p => getPlanetStandardKey(p) === key);
            if (found) selectPlanet(found);
        });
    });
}

// 4. NAVIGATION & SIDEBAR
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.app-section');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-section');
            if (!targetId) return;

            navLinks.forEach(l => {
                l.classList.remove('bg-blue-500/10', 'text-blue-400');
                l.classList.add('text-slate-300', 'hover:bg-slate-800');
            });
            link.classList.remove('text-slate-300', 'hover:bg-slate-800');
            link.classList.add('bg-blue-500/10', 'text-blue-400');

            sections.forEach(sec => {
                if (sec.getAttribute('data-section') === targetId || sec.id === targetId) {
                    sec.classList.remove('hidden');
                } else {
                    sec.classList.add('hidden');
                }
            });

            state.currentSection = targetId;

            if (sidebar) sidebar.classList.remove('sidebar-open');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('sidebar-open');
        });
    }
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initApod();
    initLaunches();
    initPlanets();
});
