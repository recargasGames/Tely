// ==============================================
// 🔐 AUTHENTICATION
// ==============================================

// ----- REGISTRO CON EMAIL -----
function registrarUsuario() {
    const email = document.getElementById('regEmail')?.value.trim();
    const password = document.getElementById('regPassword')?.value;
    const confirm = document.getElementById('regPasswordConfirm')?.value;
    const name = document.getElementById('regName')?.value.trim();
    const btn = document.getElementById('registerBtn');

    if (!email || !password || !confirm || !name) {
        mostrarError('Completa todos los campos');
        return;
    }

    if (password.length < 6) {
        mostrarError('La contraseña debe tener al menos 6 caracteres');
        return;
    }

    if (password !== confirm) {
        mostrarError('Las contraseñas no coinciden');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // Actualizar perfil con nombre
            return user.updateProfile({ displayName: name }).then(() => {
                // Guardar en base de datos
                return db.ref('usuarios/' + user.uid).set({
                    nombre: name,
                    email: email,
                    creado: Date.now(),
                    plan: 'gratis'
                });
            });
        })
        .then(() => {
            mostrarExito('✅ Registro exitoso');
            setTimeout(() => window.location.href = 'index.html', 1500);
        })
        .catch((error) => {
            console.error('Error en registro:', error);
            let msg = 'Error al registrar';
            if (error.code === 'auth/email-already-in-use') msg = 'Este correo ya está registrado';
            else if (error.code === 'auth/weak-password') msg = 'La contraseña es muy débil';
            else if (error.code === 'auth/invalid-email') msg = 'Correo inválido';
            mostrarError(msg);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-plus"></i> Registrarse';
        });
}

// ----- LOGIN CON EMAIL -----
function iniciarSesionEmail() {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    const btn = document.getElementById('loginBtnMain');

    if (!email || !password) {
        mostrarError('Completa todos los campos');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            mostrarExito('✅ Sesión iniciada');
            setTimeout(() => window.location.href = 'index.html', 1000);
        })
        .catch((error) => {
            console.error('Error en login:', error);
            let msg = 'Error al iniciar sesión';
            if (error.code === 'auth/user-not-found') msg = 'Usuario no encontrado';
            else if (error.code === 'auth/wrong-password') msg = 'Contraseña incorrecta';
            else if (error.code === 'auth/invalid-email') msg = 'Correo inválido';
            else if (error.code === 'auth/too-many-requests') msg = 'Demasiados intentos. Espera un momento';
            mostrarError(msg);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar sesión';
        });
}

// ----- LOGIN CON GOOGLE -----
function iniciarConGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            // Guardar en base de datos si es nuevo
            return db.ref('usuarios/' + user.uid).once('value').then((snap) => {
                if (!snap.exists()) {
                    return db.ref('usuarios/' + user.uid).set({
                        nombre: user.displayName || 'Usuario',
                        email: user.email,
                        foto: user.photoURL || '',
                        creado: Date.now(),
                        plan: 'gratis'
                    });
                }
            });
        })
        .then(() => {
            mostrarToast('✅ Sesión iniciada con Google', 'success');
            setTimeout(() => window.location.href = 'index.html', 1000);
        })
        .catch((error) => {
            console.error('Error en Google:', error);
            if (error.code === 'auth/popup-closed-by-user') {
                mostrarToast('⚠️ Cancelaste el inicio de sesión', 'warning');
            } else {
                mostrarToast('❌ Error al iniciar con Google: ' + error.message, 'error');
            }
        });
}

// ----- RECUPERAR CONTRASEÑA -----
function recuperarContraseña(email) {
    if (!email) {
        mostrarToast('⚠️ Ingresa tu correo electrónico', 'warning');
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(() => {
            mostrarToast('✅ Revisa tu correo para restablecer la contraseña', 'success');
        })
        .catch((error) => {
            console.error('Error al enviar recuperación:', error);
            mostrarToast('❌ Error: ' + error.message, 'error');
        });
}

// ----- CERRAR SESIÓN -----
function cerrarSesion() {
    auth.signOut()
        .then(() => {
            mostrarToast('✅ Sesión cerrada', 'success');
            // Actualizar UI
            actualizarUIUsuario(null);
            window.location.href = 'index.html';
        })
        .catch((error) => {
            mostrarToast('❌ Error: ' + error.message, 'error');
        });
}

// ----- OBTENER USUARIO ACTUAL -----
function getUsuarioActual() {
    return auth.currentUser;
}

// ----- ACTUALIZAR UI SEGÚN USUARIO -----
function actualizarUIUsuario(user) {
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (user) {
        if (userName) userName.textContent = user.displayName || user.email || 'Usuario';
        if (userEmail) userEmail.textContent = user.email || '';
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'flex';
    } else {
        if (userName) userName.textContent = '👤 Invitado';
        if (userEmail) userEmail.textContent = '';
        if (loginBtn) loginBtn.style.display = 'flex';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

// ----- VERIFICAR SESIÓN -----
auth.onAuthStateChanged((user) => {
    actualizarUIUsuario(user);
    if (user) {
        console.log('✅ Usuario autenticado:', user.email);
        // Cargar datos del usuario desde Firebase
        db.ref('usuarios/' + user.uid).once('value').then((snap) => {
            const data = snap.val();
            if (data) {
                localStorage.setItem('usuario_data', JSON.stringify(data));
            }
        });
    } else {
        console.log('❌ Usuario no autenticado');
    }
});

// ----- FUNCIONES AUXILIARES -----
function mostrarError(msg) {
    const el = document.getElementById('errorMsg');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
    setTimeout(() => { if (el) el.style.display = 'none'; }, 4000);
}

function mostrarExito(msg) {
    const el = document.getElementById('successMsg');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
    setTimeout(() => { if (el) el.style.display = 'none'; }, 4000);
}

function mostrarToast(mensaje, tipo = 'success') {
    const colores = { success: '#10B981', warning: '#F59E0B', error: '#EF4444' };
    const t = document.createElement('div');
    t.style.cssText = `
        position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
        background:${colores[tipo] || '#10B981'};color:#fff;padding:12px 24px;
        border-radius:12px;z-index:9999;font-weight:600;max-width:90%;
        text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.5);
        transition:opacity 0.3s;
    `;
    t.textContent = mensaje;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
}

function irALogin() {
    window.location.href = 'login.html';
}

// ----- TOGGLE USER MENU -----
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.toggle('show');
}

// Cerrar menú al hacer clic fuera
document.addEventListener('click', (e) => {
    const menu = document.getElementById('userDropdown');
    if (menu && !e.target.closest('.user-menu')) {
        menu.classList.remove('show');
    }
});

// ----- TOGGLE THEME (oscuro/claro) -----
function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('themeToggle')?.querySelector('i');
    
    if (body.classList.contains('dark')) {
        body.classList.remove('dark');
        if (icon) icon.className = 'fas fa-moon';
        localStorage.setItem('tely_theme', 'light');
    } else {
        body.classList.add('dark');
        if (icon) icon.className = 'fas fa-sun';
        localStorage.setItem('tely_theme', 'dark');
    }
}

// Inicializar tema
function initTheme() {
    const theme = localStorage.getItem('tely_theme');
    const body = document.body;
    const icon = document.getElementById('themeToggle')?.querySelector('i');
    
    if (theme === 'light') {
        body.classList.remove('dark');
        if (icon) icon.className = 'fas fa-moon';
    } else {
        body.classList.add('dark');
        if (icon) icon.className = 'fas fa-sun';
    }
}

// Ejecutar al cargar
document.addEventListener('DOMContentLoaded', initTheme);
