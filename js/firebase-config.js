// ==============================================
// 🔥 FIREBASE CONFIGURATION
// ==============================================

const firebaseConfig = {
    apiKey: "AIzaSyCwLATDpQN1RWv3rLPjJXbNnIBkyo_BUfI",
    authDomain: "tely-ap.firebaseapp.com",
    databaseURL: "https://tely-ap-default-rtdb.firebaseio.com",
    projectId: "tely-ap",
    storageBucket: "tely-ap.firebasestorage.app",
    messagingSenderId: "760862940967",
    appId: "1:760862940967:web:69bbbbfee0de40f68a1302"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Exportar servicios
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();

// Configurar persistencia
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

console.log('🔥 Firebase inicializado correctamente');
