// ==============================================
// 🎬 TMDB API
// ==============================================

const PROXY_URL = "https://tely-xi.vercel.app/api/tmdb";

// ----- FETCH CON PROXY -----
async function fetchTMDB(path, params = {}) {
    const queryParams = new URLSearchParams();
    queryParams.append('path', path);
    Object.keys(params).forEach(key => queryParams.append(key, params[key]));
    const url = `${PROXY_URL}?${queryParams.toString()}`;
    console.log('🔄 Proxy request:', url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
    return response.json();
}

// ----- OBTENER IMAGEN -----
function getImagenUrl(path, size = 'w342') {
    if (!path) return 'https://i.postimg.cc/8k4h4K7y/placeholder.jpg';
    return `https://image.tmdb.org/t/p/${size}${path}`;
}

// ----- GENERAR ENLACES -----
function generarEnlaceMultiplataforma(tmdb_id, tipo, plataforma = 'unlimplay', temporada = 1, capitulo = 1) {
    const plataformas = {
        'unlimplay': {
            pelicula: (id) => `https://unlimplay.com/play/embed/movie/${id}?lang=es-MX&autoplay=1&controls=1&logo=0`,
            serie: (id, t, c) => `https://unlimplay.com/play/embed/tv/${id}/${t}/${c}?lang=es-MX&autoplay=1&controls=1&logo=0`
        },
        'vidsrc': {
            pelicula: (id) => `https://vidsrc.in/embed/movie/${id}?lang=es`,
            serie: (id, t, c) => `https://vidsrc.in/embed/tv/${id}/${t}/${c}?lang=es`
        },
        'vidmoly': {
            pelicula: (id) => `https://vidmoly.to/embed/movie/${id}`,
            serie: (id, t, c) => `https://vidmoly.to/embed/tv/${id}/${t}/${c}`
        },
        'embed': {
            pelicula: (id) => `https://embed.su/embed/movie/${id}`,
            serie: (id, t, c) => `https://embed.su/embed/tv/${id}/${t}/${c}`
        },
        '2embed': {
            pelicula: (id) => `https://www.2embed.to/embed/tmdb/movie?id=${id}`,
            serie: (id, t, c) => `https://www.2embed.to/embed/tmdb/tv?id=${id}&s=${t}&e=${c}`
        }
    };
    const plat = plataformas[plataforma] || plataformas['unlimplay'];
    if (tipo === 'pelicula') return plat.pelicula(tmdb_id);
    else return plat.serie(tmdb_id, temporada, capitulo);
}

// ----- OBTENER PELÍCULAS -----
async function obtenerPeliculas(page = 1, categoria = 'popular') {
    const endpoint = categoria === 'popular' ? 'movie/popular' : 
                     categoria === 'top_rated' ? 'movie/top_rated' : 
                     'movie/upcoming';
    return await fetchTMDB(endpoint, { page });
}

// ----- OBTENER SERIES -----
async function obtenerSeries(page = 1, categoria = 'popular') {
    const endpoint = categoria === 'popular' ? 'tv/popular' : 
                     categoria === 'top_rated' ? 'tv/top_rated' : 
                     'tv/on_the_air';
    return await fetchTMDB(endpoint, { page });
}

// ----- BUSCAR -----
async function buscarContenido(query, page = 1) {
    const [peliculas, series] = await Promise.all([
        fetchTMDB('search/movie', { query, page }).catch(() => ({ results: [] })),
        fetchTMDB('search/tv', { query, page }).catch(() => ({ results: [] }))
    ]);
    return {
        peliculas: peliculas.results || [],
        series: series.results || []
    };
}

// ----- OBTENER DETALLES -----
async function obtenerDetalles(tmdb_id, tipo) {
    const endpoint = tipo === 'pelicula' ? `movie/${tmdb_id}` : `tv/${tmdb_id}`;
    return await fetchTMDB(endpoint, {});
}

// ----- OBTENER RECOMENDACIONES -----
async function obtenerRecomendaciones(tmdb_id, tipo = 'pelicula') {
    const endpoint = tipo === 'pelicula' ? `movie/${tmdb_id}/recommendations` : `tv/${tmdb_id}/recommendations`;
    return await fetchTMDB(endpoint, { page: 1 });
}

// ----- OBTENER TEMPORADAS Y CAPÍTULOS -----
async function obtenerTemporadas(tmdb_id) {
    const data = await fetchTMDB(`tv/${tmdb_id}`, {});
    return data.seasons || [];
}

// ----- CACHÉ DE IMÁGENES -----
function precargarImagenes(items) {
    if (!items || !items.length) return;
    items.forEach(item => {
        if (item && item.portada && item.portada.includes('tmdb.org')) {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = item.portada;
        }
    });
}

// ----- DATOS DE RESPALDO -----
const DATOS_RESPALDO = [
    { id: 'backup_1', tmdb_id: 1, titulo: 'Guardianes de la Galaxia Vol. 3', anio: '2023', tipo: 'pelicula', portada: 'https://image.tmdb.org/t/p/w342/rc2yJPlGm7lJ17DbmF2cy0ys9D1.jpg', sinopsis: 'Los Guardianes deben proteger al universo', puntuacion: '8.0', genero: 'Acción', url: 'https://unlimplay.com/play/embed/movie/1?lang=es-MX', opcion2: 'https://vidsrc.in/embed/movie/1?lang=es' },
    { id: 'backup_2', tmdb_id: 2, titulo: 'Barbie', anio: '2023', tipo: 'pelicula', portada: 'https://image.tmdb.org/t/p/w342/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', sinopsis: 'Barbie sale al mundo real', puntuacion: '7.5', genero: 'Comedia', url: 'https://unlimplay.com/play/embed/movie/2?lang=es-MX', opcion2: 'https://vidsrc.in/embed/movie/2?lang=es' },
    { id: 'backup_3', tmdb_id: 3, titulo: 'Oppenheimer', anio: '2023', tipo: 'pelicula', portada: 'https://image.tmdb.org/t/p/w342/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', sinopsis: 'El padre de la bomba atómica', puntuacion: '8.5', genero: 'Drama', url: 'https://unlimplay.com/play/embed/movie/3?lang=es-MX', opcion2: 'https://vidsrc.in/embed/movie/3?lang=es' },
    { id: 'backup_4', tmdb_id: 4, titulo: 'Avatar: El camino del agua', anio: '2022', tipo: 'pelicula', portada: 'https://image.tmdb.org/t/p/w342/3syCtbAq4Dccm5S8u4t6Y1p9vPp.jpg', sinopsis: 'La familia Sully regresa a Pandora', puntuacion: '7.8', genero: 'Ciencia Ficción', url: 'https://unlimplay.com/play/embed/movie/4?lang=es-MX', opcion2: 'https://vidsrc.in/embed/movie/4?lang=es' },
    { id: 'backup_5', tmdb_id: 5, titulo: 'John Wick 4', anio: '2023', tipo: 'pelicula', portada: 'https://image.tmdb.org/t/p/w342/vZloFAK7NmvMGKE7VkF5x22vbyD.jpg', sinopsis: 'John Wick busca venganza', puntuacion: '8.2', genero: 'Acción', url: 'https://unlimplay.com/play/embed/movie/5?lang=es-MX', opcion2: 'https://vidsrc.in/embed/movie/5?lang=es' }
];
