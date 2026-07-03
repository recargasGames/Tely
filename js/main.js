// ==============================================
// 📦 MAIN - FUNCIONES PRINCIPALES
// ==============================================

let contenidoGlobal = [];
let paginaActualPeliculas = 1;
let paginaActualSeries = 1;
let cargandoPeliculas = false;
let cargandoSeries = false;
let hayMasPeliculas = true;
let hayMasSeries = true;

// ----- CARGAR CONTENIDO DESDE FIREBASE -----
async function cargarContenidoFirebase() {
    try {
        const [p, s] = await Promise.all([
            db.ref("contenido_personalizado").once("value"),
            db.ref("series_personalizadas").once("value")
        ]);
        const pelis = p.val() ? Object.values(p.val()) : [];
        const series = s.val() ? Object.values(s.val()) : [];
        
        const pf = pelis.map(p => ({ ...p, tipo: 'pelicula', opcion2: p.opcion2 || '', plataforma2: p.plataforma2 || 'vidsrc' }));
        const sf = series.map(s => {
            const temps = s.temporadas ? s.temporadas.map(t => ({
                ...t,
                capitulos: t.capitulos ? t.capitulos.map(c => ({ ...c, opcion2: c.opcion2 || s.opcion2 || '', plataforma2: c.plataforma2 || s.plataforma2 || 'vidsrc', sinopsis: c.sinopsis || '' })) : []
            })) : [];
            return { ...s, tipo: 'serie', opcion2: s.opcion2 || '', plataforma2: s.plataforma2 || 'vidsrc', temporadas: temps };
        });
        return [...pf, ...sf];
    } catch (e) {
        console.error("Error cargando desde Firebase:", e);
        return [];
    }
}

// ----- CARGAR INICIO -----
async function cargarInicio() {
    const peliculasContainer = document.getElementById('peliculasPopulares');
    const seriesContainer = document.getElementById('seriesPopulares');
    
    if (peliculasContainer) peliculasContainer.innerHTML = '<div class="skeleton-card"></div>'.repeat(6);
    if (seriesContainer) seriesContainer.innerHTML = '<div class="skeleton-card"></div>'.repeat(6);
    
    try {
        const [pelis, series] = await Promise.all([
            obtenerPeliculas(1, 'popular'),
            obtenerSeries(1, 'popular')
        ]);
        
        const admin = await cargarContenidoFirebase();
        const adminMap = {};
        admin.forEach(i => { adminMap[i.tmdb_id] = i; });
        
        // Películas
        if (peliculasContainer && pelis.results) {
            peliculasContainer.innerHTML = '';
            const items = pelis.results.slice(0, 12).map(p => {
                const a = adminMap[p.id];
                return {
                    id: `tmdb_${p.id}`,
                    tmdb_id: p.id,
                    titulo: a?.titulo || p.title || 'Sin título',
                    anio: a?.anio || (p.release_date ? p.release_date.split('-')[0] : 'N/D'),
                    tipo: 'pelicula',
                    portada: a?.portada || getImagenUrl(p.poster_path, 'w342'),
                    puntuacion: a?.puntuacion || (p.vote_average ? p.vote_average.toFixed(1) : 'N/A'),
                    url: a?.url || generarEnlaceMultiplataforma(p.id, 'pelicula', 'unlimplay'),
                    opcion2: a?.opcion2 || generarEnlaceMultiplataforma(p.id, 'pelicula', 'vidsrc'),
                    plataforma2: a?.plataforma2 || 'vidsrc',
                    adminId: a?.id || null,
                    temporadas: []
                };
            });
            items.forEach(i => {
                const card = crearTarjeta(i);
                peliculasContainer.appendChild(card);
            });
            precargarImagenes(items);
        }
        
        // Series
        if (seriesContainer && series.results) {
            seriesContainer.innerHTML = '';
            const items = series.results.slice(0, 12).map(s => {
                const a = adminMap[s.id];
                let temps = a?.temporadas || [];
                if (!temps || !temps.length) {
                    temps = [{ numero: 1, nombre: 'Temporada 1', capitulos: [] }];
                    for (let i = 1; i <= 3; i++) {
                        temps[0].capitulos.push({
                            numero: i, titulo: `Capítulo ${i}`,
                            sinopsis: `Sinopsis del capítulo ${i}`,
                            url: generarEnlaceMultiplataforma(s.id, 'serie', 'unlimplay', 1, i),
                            opcion2: a?.opcion2 || generarEnlaceMultiplataforma(s.id, 'serie', 'vidsrc', 1, i),
                            plataforma2: a?.plataforma2 || 'vidsrc'
                        });
                    }
                }
                return {
                    id: `tmdb_${s.id}`,
                    tmdb_id: s.id,
                    titulo: a?.titulo || s.name || 'Sin título',
                    anio: a?.anio || (s.first_air_date ? s.first_air_date.split('-')[0] : 'N/D'),
                    tipo: 'serie',
                    portada: a?.portada || getImagenUrl(s.poster_path, 'w342'),
                    puntuacion: a?.puntuacion || (s.vote_average ? s.vote_average.toFixed(1) : 'N/A'),
                    temporadas: temps,
                    opcion2: a?.opcion2 || '',
                    plataforma2: a?.plataforma2 || 'vidsrc',
                    adminId: a?.id || null
                };
            });
            items.forEach(i => {
                const card = crearTarjeta(i);
                seriesContainer.appendChild(card);
            });
            precargarImagenes(items);
        }
        
        // Cargar continuar viendo
        cargarContinuarViendo();
        
    } catch (e) {
        console.error('Error cargando inicio:', e);
        // Usar datos de respaldo
        if (peliculasContainer) {
            peliculasContainer.innerHTML = '';
            DATOS_RESPALDO.forEach(i => {
                const card = crearTarjeta(i);
                peliculasContainer.appendChild(card);
            });
        }
    }
}

// ----- CREAR TARJETA -----
function crearTarjeta(item) {
    const div = document.createElement('div');
    div.className = 'movie-card';
    const tieneOp2 = item.opcion2 && item.opcion2.trim() !== '';
    div.innerHTML = `
        <span class="badge-year">${item.anio || 'N/D'}</span>
        <span class="badge-type">${item.tipo === 'serie' ? '📺' : '🎬'}</span>
        ${tieneOp2 ? `<span class="badge-op2">🔗 Op2</span>` : ''}
        <img src="${item.portada}" alt="${item.titulo}" class="poster" loading="lazy" onerror="this.src='https://i.postimg.cc/8k4h4K7y/placeholder.jpg'">
        <div class="info">
            <h3>${item.titulo}</h3>
            <div class="meta">
                <span>⭐ ${item.puntuacion || 'N/A'}</span>
                <span>${item.tipo === 'serie' ? '📺 Serie' : '🎬 Película'}</span>
            </div>
        </div>
    `;
    div.onclick = () => {
        if (auth.currentUser) {
            abrirReproductor(item);
        } else {
            window.location.href = 'login.html';
        }
    };
    return div;
}

// ----- CARGAR CONTINUAR VIENDO -----
function cargarContinuarViendo() {
    const container = document.getElementById('continuarViendo');
    if (!container) return;
    
    const historial = JSON.parse(localStorage.getItem('historialTely')) || [];
    if (!historial.length) {
        container.innerHTML = '<p class="empty-message">No has visto nada aún</p>';
        return;
    }
    
    container.innerHTML = '';
    historial.slice(0, 10).forEach(entry => {
        const f = contenidoGlobal.find(x => x.id === entry.id);
        if (!f) return;
        const div = document.createElement('div');
        div.className = 'movie-card';
        div.style.width = '140px';
        div.style.flexShrink = '0';
        const pos = entry.temporada !== null && entry.capitulo !== null ? 
            ` T${entry.temporada+1} Cap${entry.capitulo+1}` : '';
        div.innerHTML = `
            <img src="${f.portada}" alt="${f.titulo}" class="poster" loading="lazy" onerror="this.src='https://i.postimg.cc/8k4h4K7y/placeholder.jpg'">
            <div class="info">
                <h3>${f.titulo}</h3>
                <div class="meta">${pos || ''}</div>
            </div>
        `;
        div.onclick = () => {
            if (auth.currentUser) {
                abrirReproductor(f, entry.temporada, entry.capitulo);
            } else {
                window.location.href = 'login.html';
            }
        };
        container.appendChild(div);
    });
}

// ----- CARGAR PELÍCULAS -----
async function cargarPeliculas(page = 1, filtros = {}) {
    if (cargandoPeliculas) return;
    cargandoPeliculas = true;
    
    const container = document.getElementById('listaPeliculas');
    if (!container) return;
    
    if (page === 1) {
        container.innerHTML = '<div class="skeleton-card"></div>'.repeat(10);
    }
    
    try {
        const data = await obtenerPeliculas(page, filtros.categoria || 'popular');
        if (!data.results || !data.results.length) {
            hayMasPeliculas = false;
            if (page === 1) {
                container.innerHTML = '<p style="color:#64748B;text-align:center;grid-column:1/-1;padding:2rem;">No se encontraron películas</p>';
            }
            cargandoPeliculas = false;
            return;
        }
        
        hayMasPeliculas = data.page < data.total_pages;
        
        if (page === 1) container.innerHTML = '';
        
        const admin = await cargarContenidoFirebase();
        const adminMap = {};
        admin.forEach(i => { adminMap[i.tmdb_id] = i; });
        
        data.results.forEach(p => {
            const a = adminMap[p.id];
            const item = {
                id: `tmdb_${p.id}`,
                tmdb_id: p.id,
                titulo: a?.titulo || p.title || 'Sin título',
                anio: a?.anio || (p.release_date ? p.release_date.split('-')[0] : 'N/D'),
                tipo: 'pelicula',
                portada: a?.portada || getImagenUrl(p.poster_path, 'w342'),
                puntuacion: a?.puntuacion || (p.vote_average ? p.vote_average.toFixed(1) : 'N/A'),
                url: a?.url || generarEnlaceMultiplataforma(p.id, 'pelicula', 'unlimplay'),
                opcion2: a?.opcion2 || generarEnlaceMultiplataforma(p.id, 'pelicula', 'vidsrc'),
                plataforma2: a?.plataforma2 || 'vidsrc',
                adminId: a?.id || null,
                temporadas: []
            };
            const card = crearTarjeta(item);
            container.appendChild(card);
        });
        
        // Actualizar contador
        const total = document.getElementById('totalPeliculas');
        if (total) total.textContent = data.total_results || data.results.length;
        
        // Mostrar/ocultar botón cargar más
        const loadBtn = document.querySelector('.load-more-btn');
        if (loadBtn) {
            loadBtn.style.display = hayMasPeliculas ? 'flex' : 'none';
            loadBtn.disabled = false;
            loadBtn.innerHTML = '<i class="fas fa-plus"></i> Cargar más';
        }
        
    } catch (e) {
        console.error('Error cargando películas:', e);
        if (page === 1) {
            container.innerHTML = '<p style="color:#EF4444;text-align:center;grid-column:1/-1;padding:2rem;">❌ Error al cargar películas</p>';
        }
    }
    cargandoPeliculas = false;
}

// ----- CARGAR MÁS PELÍCULAS -----
function cargarMasPeliculas() {
    if (!hayMasPeliculas || cargandoPeliculas) return;
    paginaActualPeliculas++;
    cargarPeliculas(paginaActualPeliculas);
}

// ----- BÚSQUEDA GLOBAL -----
async function buscarGlobal() {
    const query = document.getElementById('searchInput')?.value.trim();
    if (!query) return;
    
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '<div style="text-align:center;padding:1rem;color:#64748B;"><i class="fas fa-spinner fa-spin"></i> Buscando...</div>';
    resultsContainer.classList.add('show');
    
    try {
        const data = await buscarContenido(query);
        const resultados = [...(data.peliculas || []), ...(data.series || [])];
        
        if (!resultados.length) {
            resultsContainer.innerHTML = '<div style="padding:1rem;text-align:center;color:#64748B;">No se encontraron resultados</div>';
            return;
        }
        
        resultsContainer.innerHTML = '';
        resultados.slice(0, 10).forEach(item => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            const imgUrl = getImagenUrl(item.poster_path, 'w92');
            div.innerHTML = `
                <img src="${imgUrl}" alt="${item.title || item.name}" onerror="this.src='https://i.postimg.cc/8k4h4K7y/placeholder.jpg'">
                <div class="info">
                    <div class="title">${item.title || item.name}</div>
                    <div class="detail">${item.release_date || item.first_air_date || 'N/D'} • ${item.media_type === 'tv' ? '📺 Serie' : '🎬 Película'}</div>
                </div>
            `;
            div.onclick = () => {
                const tipo = item.media_type === 'tv' ? 'serie' : 'pelicula';
                const obj = {
                    tmdb_id: item.id,
                    titulo: item.title || item.name,
                    anio: (item.release_date || item.first_air_date || 'N/D').split('-')[0],
                    tipo: tipo,
                    portada: getImagenUrl(item.poster_path, 'w342'),
                    sinopsis: item.overview || 'Sin sinopsis',
                    puntuacion: item.vote_average ? item.vote_average.toFixed(1) : 'N/A',
                    url: generarEnlaceMultiplataforma(item.id, tipo, 'unlimplay'),
                    opcion2: generarEnlaceMultiplataforma(item.id, tipo, 'vidsrc'),
                    plataforma2: 'vidsrc',
                    temporadas: tipo === 'serie' ? [{ numero: 1, nombre: 'Temporada 1', capitulos: [] }] : []
                };
                if (auth.currentUser) {
                    abrirReproductor(obj);
                } else {
                    window.location.href = 'login.html';
                }
                resultsContainer.classList.remove('show');
            };
            resultsContainer.appendChild(div);
        });
    } catch (e) {
        console.error('Error en búsqueda:', e);
        resultsContainer.innerHTML = '<div style="padding:1rem;text-align:center;color:#EF4444;">❌ Error al buscar</div>';
    }
}

// ----- APLICAR FILTROS -----
function aplicarFiltros() {
    const year = document.getElementById('filterYear')?.value;
    const genre = document.getElementById('filterGenre')?.value;
    const order = document.getElementById('filterOrder')?.value;
    // Implementar filtros
    paginaActualPeliculas = 1;
    cargarPeliculas(1, { year, genre, order });
}

// ----- CARGAR POPULARES -----
function cargarPopulares() {
    const section = document.getElementById('peliculasPopulares');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        cargarPeliculas(1, { categoria: 'popular' });
    }
}

// ----- ABRIR REPRODUCTOR -----
function abrirReproductor(peli, restaurarTemp = null, restaurarCap = null) {
    // Esta función debe redirigir al reproductor o abrir modal
    // Por ahora, redirigimos a index.html con parámetros
    const params = new URLSearchParams();
    params.set('play', peli.tmdb_id);
    params.set('tipo', peli.tipo);
    if (restaurarTemp !== null) params.set('temp', restaurarTemp);
    if (restaurarCap !== null) params.set('cap', restaurarCap);
    window.location.href = `reproductor.html?${params.toString()}`;
}

// ----- INICIALIZAR -----
document.addEventListener('DOMContentLoaded', () => {
    // Cargar contenido según la página
    const path = window.location.pathname;
    if (path.includes('index.html') || path === '/' || path === '') {
        cargarInicio();
    } else if (path.includes('peliculas.html')) {
        cargarPeliculas(1);
    } else if (path.includes('series.html')) {
        cargarSeries(1);
    } else if (path.includes('populares.html')) {
        cargarPopulares();
    }
});

// ----CONTINUAR VIENDO EN TODAS LAS PAGINAS----
document.addEventListener('DOMContentLoaded', () => {
    const historial = JSON.parse(localStorage.getItem('historialTely')) || [];
    if (historial.length > 0) {
        console.log(`📺 Continuar viendo: ${historial.length} elementos`);
    }
});

console.log('✅ Main.js cargado correctamente');
