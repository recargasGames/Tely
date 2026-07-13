// ============================================================
// PROXY PARA UNLIMPLAY EN VERCEL
// ============================================================

export default async function handler(req, res) {
    // Obtener la URL a la que redirigir
    const url = req.query.url;
    
    if (!url) {
        return res.status(400).json({ error: 'Falta el parámetro url' });
    }
    
    // Solo permitir dominios específicos
    const dominiosPermitidos = ['unlimplay.com', 'unlimplay.net', 'unlimplay.org', 'vidmoly.biz'];
    const permitido = dominiosPermitidos.some(d => url.includes(d));
    
    if (!permitido) {
        return res.status(403).json({ error: 'Dominio no permitido' });
    }
    
    try {
        // Hacer la petición a la URL original
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://unlimplay.com/',
                'Origin': 'https://unlimplay.com'
            }
        });
        
        // Obtener el contenido
        const data = await response.text();
        
        // Configurar headers de respuesta
        res.setHeader('Content-Type', response.headers.get('content-type') || 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
        
        // Enviar el contenido
        res.status(200).send(data);
        
    } catch (error) {
        console.error('Error en proxy:', error);
        res.status(500).json({ error: 'Error al cargar el contenido' });
    }
}

// Manejar peticiones OPTIONS (CORS)
export async function handlerOPTIONS(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.status(200).end();
}
