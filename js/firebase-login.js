import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'
import { 
  getAuth, 
  signInWithEmailAndPassword,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'
import { 
  getFirestore, 
  doc, 
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'

const firebaseConfig = {
  apiKey: "AIzaSyAl7ljECg3d6Shr6jSCaOZpItT3q5pklnE",
  authDomain: "tivanz.firebaseapp.com",
  projectId: "tivanz",
  storageBucket: "tivanz.firebasestorage.app",
  messagingSenderId: "975515506264",
  appId: "1:975515506264:web:a7e80ad5b876b7137adc2d",
  measurementId: "G-ZQGKXHH27X"
};

// Initialize Firebase dengan pengecekan duplikasi
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const loginForm = document.getElementById('firebaseLoginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const statusMessage = document.getElementById('statusMessage');
  const togglePassword = document.querySelector('.toggle-password');
  const submitBtn = loginForm?.querySelector('button[type="submit"]');
  
  // Fungsi tampilkan pesan
  const showMessage = (message, type = 'error') => {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.className = `status-alert ${type}`;
  };
  
  // Fungsi set loading state
  const setLoading = (isLoading) => {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    submitBtn.innerHTML = isLoading 
      ? '<i class="fas fa-spinner fa-spin"></i> Authenticating...' 
      : 'Login';
  };
  
  // Toggle password visibility
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      togglePassword.classList.toggle('fa-eye-slash');
    });
  }
  
  // Check captive portal parameters
  const getCaptiveParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      gw: urlParams.get('gw_address') || '',
      port: urlParams.get('gw_port') || '',
      mac: urlParams.get('clientmac') || '',
      ip: urlParams.get('clientip') || ''
    };
  };
  
  // Redirect to gateway
  const redirectToGateway = (gw, port, mac) => {
    const redirectURL = `http://${gw}:${port}/portal/auth?clientMac=${mac}`;
    
    // Menggunakan iframe untuk menghindari masalah CORS
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = redirectURL;
    document.body.appendChild(iframe);
    
    // Redirect pengguna setelah delay
    setTimeout(() => {
      window.location.href = 'success.html';
    }, 2000);
  };
  
  // Fungsi login handler
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (!username || !password) {
      showMessage('Username dan password harus diisi!');
      return;
    }
    
    try {
      setLoading(true);
      
      // Format email
      const email = username.includes('@') ? username : `${username}@tivanbm.com`;
      
      // Auth dengan Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Dapatkan parameter captive portal
      const { gw, port, mac, ip } = getCaptiveParams();
      
      // Catat log ke Firestore
      await setDoc(doc(db, "wifi_logs", `${user.uid}-${Date.now()}`), {
        uid: user.uid,
        email: user.email,
        username: username,
        mac: mac,
        ip: ip,
        gateway: `${gw}:${port}`,
        loginTime: serverTimestamp(),
        status: "success"
      });
      
      // Tampilkan pesan sukses
      showMessage('Login berhasil! Mengalihkan...', 'success');
      
      // Redirect ke gateway
      if (gw && port && mac) {
        redirectToGateway(gw, port, mac);
      } else {
        // Jika parameter tidak ada, redirect langsung ke success page
        setTimeout(() => {
          window.location.href = 'success.html';
        }, 2000);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Tampilkan pesan error spesifik
      let errorMessage = 'Login gagal: ';
      switch(error.code) {
        case 'auth/invalid-email':
          errorMessage += 'Format email tidak valid';
          break;
        case 'auth/user-disabled':
          errorMessage += 'Akun dinonaktifkan';
          break;
        case 'auth/user-not-found':
          errorMessage += 'Akun tidak ditemukan';
          break;
        case 'auth/wrong-password':
          errorMessage += 'Password salah';
          break;
        case 'auth/too-many-requests':
          errorMessage += 'Terlalu banyak percobaan. Coba lagi nanti';
          break;
        default:
          errorMessage += error.message || 'Terjadi kesalahan sistem';
      }
      
      showMessage(errorMessage);
      setLoading(false);
      
      // Catat error ke Firestore
      const { ip } = getCaptiveParams();
      try {
        await setDoc(doc(db, "login_errors", `${Date.now()}`), {
          username: username,
          error: error.code || 'unknown',
          message: error.message || '',
          timestamp: serverTimestamp(),
          ip: ip || 'unknown'
        });
      } catch (logError) {
        console.error('Gagal mencatat error:', logError);
      }
    }
  };
  
  // Auto login jika sudah terautentikasi (untuk testing)
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('User already signed in:', user.email);
      const { gw, port, mac } = getCaptiveParams();
      if (gw && port && mac) {
        redirectToGateway(gw, port, mac);
      }
    }
  });
  
  // Attach event listener
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Untuk debugging
  console.log('Firebase initialized successfully');
  console.log('Captive params:', getCaptiveParams());
});
