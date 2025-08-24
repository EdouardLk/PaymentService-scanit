
//middleware , paiement service  
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5000';

const authenticateToken = async (req, res, next) => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];    
    
    if (!token) {        
        return res.status(401).json({ message: 'Token manquant, Connexion requise' });
    }

    try {
        const fetch = (await import('node-fetch')).default; // <- changement ici

        const fetchResponse = await fetch(`${AUTH_SERVICE_URL}/auth/verifyToken`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!fetchResponse.ok) {
            const errorData = await fetchResponse.json();
            return res.status(403).json({ message: errorData.message || 'Token invalide' });
        }
        const data = await fetchResponse.json();

        req.user = data.user;
        next()
    } catch (error) {
        console.error('Erreur lors de la vérification du token :', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la vérification du token' });
    }
}


module.exports = authenticateToken;