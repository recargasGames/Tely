// api/tmdb.js
export default async function handler(req, res) {
    // Habilitar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGQ5OWI1YTE1YWNmZGQ5OGUzYjI0OWQ1Zjg5MGFmNCIsIm5iZiI6MTc4MjI3NzIzMS4zMzMsInN1YiI6IjZhM2I2NDZmZThmMTMwOTc2MWVjNDYxYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.JLmHWuXkhDc9LreAvXFZa0qTS7PR_nrj_SSwVm9UZ9Y";
    const TMDB_BASE = "https://api.themoviedb.org/3";

    try {
        // Obtener la ruta y parámetros de la URL
        const { path, ...params } = req.query;
        
        if (!path) {
            res.status(400).json({ error: 'Se requiere el parámetro "path"' });
            return;
        }

        // Construir la URL de TMDB
        let url = `${TMDB_BASE}/${path}`;
        
        // Agregar parámetros
        const queryParams = new URLSearchParams();
        queryParams.append('language', 'es-ES');
        
        Object.keys(params).forEach(key => {
            if (key !== 'path') {
                queryParams.append(key, params[key]);
            }
        });

        if (queryParams.toString()) {
            url += `?${queryParams.toString()}`;
        }

        console.log(`🔄 Proxy: ${url}`);

        // Hacer la petición a TMDB
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TMDB_TOKEN}`,
                'Content-Type': 'application/json;charset=utf-8'
            }
        });

        if (!response.ok) {
            throw new Error(`TMDB error: ${response.status}`);
        }

        const data = await response.json();

        // Cachear por 1 hora en Vercel
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

        res.status(200).json(data);

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Error en el proxy', 
            message: error.message 
        });
    }
}
