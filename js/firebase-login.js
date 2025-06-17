// Pastikan import path benar
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'
import { getFirestore, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'

const firebaseConfig = {
  apiKey: "AIzaSyAl7ljECg3d6Shr6jSCaOZpItT3q5pklnE",
  authDomain: "tivanz.firebaseapp.com",
  projectId: "tivanz",
  storageBucket: "tivanz.firebasestorage.app",
  messagingSenderId: "975515506264",
  appId: "1:975515506264:web:a7e80ad5b876b7137adc2d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('firebaseLoginForm');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      
      try {
        // Format email
        const email = username.includes('@') ? username : `${username}@tivanbm.com`;
        
        // Auth dengan Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Catat log ke Firestore
        await setDoc(doc(db, "wifi_logs", `${user.uid}-${Date.now()}`), {
          uid: user.uid,
          email: user.email,
          timestamp: new Date().toISOString()
        });
        
        // Redirect setelah login
        window.location.href = 'success.html';
        
      } catch (error) {
        console.error('Error:', error);
        alert(`Login gagal: ${error.message}`);
      }
    });
  }
});
