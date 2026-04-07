        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, collection, doc, setDoc, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        const ADMIN_EMAIL = "munirajahire9@gmail.com";

        const firebaseConfig = {
            apiKey: "AIzaSyCva6jzxeuJmJDY2hWXWjHF0IyBLIdDrAA",
            authDomain: "krishi-setu-4717e.firebaseapp.com",
            projectId: "krishi-setu-4717e",
            storageBucket: "krishi-setu-4717e.firebasestorage.app",
            messagingSenderId: "261817871968",
            appId: "1:261817871968:web:6422e8a5065526f38b5d05"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        const appId = firebaseConfig.projectId;

        const translations = {
            en: {
                title: "Krishi Setu", subtitle: "Connecting Farmers to Markets",
                login: "Login", signup: "Sign Up", noAccount: "Don't have an account?", hasAccount: "Already have an account?",
                bannerTitle: "Welcome to Krishi Setu", bannerDesc: "Empowering farmers with direct market access.",
                adminHeader: "Admin Control Panel", adminUpdate: "Add / Update",
                dailyPrices: "Daily Prices", seasonalCrops: "Seasonal Crops",
                cropName: "Crop Name", price: "Price (₹/kg)", catexgory: "Category",
                daily: "Daily", seasonal: "Seasonal", kg: "per Kilogram", updated: "Updated",
                noData: "No market data available yet. Add crops as admin.",
                successUpdate: "Price updated successfully!", errorFill: "Please fill all fields.", logout: "Logged out"
            },
            mr: {
                title: "कृषी सेतू", subtitle: "शेतकऱ्यांना बाजारपेठेशी जोडत आहे",
                login: "लॉगिन करा", signup: "नोंदणी करा", noAccount: "तुमचे खाते नाही का?", hasAccount: "आधीच खाते आहे का?",
                bannerTitle: "कृषी सेतू मध्ये आपले स्वागत आहे", bannerDesc: "शेतकऱ्यांना थेट बाजारपेठेसह सक्षम करणे.",
                adminHeader: "प्रशासक नियंत्रण कक्ष", adminUpdate: "दर अपडेट करा",
                dailyPrices: "दैनंदिन बाजार भाव", seasonalCrops: "हंगामी पिके",
                cropName: "पिकाचे नाव", price: "दर (₹/किलो)", category: "वर्गवारी",
                daily: "दैनंदिन", seasonal: "हंगामी", kg: "प्रति किलो", updated: "अपडेट वेळ",
                noData: "माहिती उपलब्ध नाही. प्रशासकाने दर जोडणे आवश्यक आहे.",
                successUpdate: "दर यशस्वीरित्या अपडेट झाला!", errorFill: "कृपया सर्व माहिती भरा.", logout: "लॉग आउट झाले"
            }
        };


        let lang = 'en';
        let currentTab = 'daily';
        let crops = [];



        // Safety innerText update to prevent TypeErrors
        function safeUpdate(id, text) {
            const el = document.getElementById(id);
            if (el) el.innerText = text;
        }

        function updateUI() {
            const t = translations[lang];
            safeUpdate('auth-title', t.title);
            safeUpdate('auth-subtitle', t.subtitle);
            safeUpdate('label-login', t.login);
            safeUpdate('label-signup', t.signup);
            safeUpdate('label-no-account', t.noAccount);
            safeUpdate('label-has-account', t.hasAccount);
            safeUpdate('label-signup-link', t.signup);
            safeUpdate('label-login-link', t.login);
            safeUpdate('banner-title', t.bannerTitle);
            safeUpdate('banner-desc', t.bannerDesc);
            safeUpdate('admin-header', t.adminHeader);
            safeUpdate('admin-btn-update', t.adminUpdate);
            safeUpdate('admin-label-name', t.cropName);
            safeUpdate('admin-label-price', t.price);
            safeUpdate('admin-label-type', t.category);
            safeUpdate('opt-daily', t.daily);
            safeUpdate('opt-seasonal', t.seasonal);
            safeUpdate('tab-daily', t.dailyPrices);
            safeUpdate('tab-seasonal', t.seasonalCrops);
            safeUpdate('auth-lang-btn', lang === 'en' ? 'मराठी' : 'English');
            safeUpdate('nav-lang-btn', lang === 'en' ? 'मराठी' : 'English');
            renderPrices();
        }

        window.toggleLanguage = () => { lang = lang === 'en' ? 'mr' : 'en'; updateUI(); };
        window.toggleAuthMode = (isLogin) => {
            document.getElementById('login-form').classList.toggle('hidden', !isLogin);
            document.getElementById('signup-form').classList.toggle('hidden', isLogin);
        };

        window.handleLogin = async () => {
            const email = document.getElementById('email').value;
            const pass = document.getElementById('password').value;
            if(!email || !pass) return showToast(translations[lang].errorFill);
            const btn = document.getElementById('login-btn');
            const original = btn.innerHTML;
            btn.innerHTML = `<div class="loader mx-auto"></div>`;
            try { await signInWithEmailAndPassword(auth, email, pass); } 
            catch (e) { showToast(e.message); btn.innerHTML = original; }
        };

        window.handleSignup = async () => {
            const email = document.getElementById('signup-email').value;
            const pass = document.getElementById('signup-password').value;
            if(!email || !pass) return showToast(translations[lang].errorFill);
            try { await createUserWithEmailAndPassword(auth, email, pass); } 
            catch (e) { showToast(e.message); }
        };

        window.handleLogout = () => signOut(auth).then(() => showToast(translations[lang].logout));

        window.updateCropPrice = async () => {
            const nameEl = document.getElementById('new-crop-name');
            const priceEl = document.getElementById('new-crop-price');
            const typeEl = document.getElementById('new-crop-type');
            const btn = document.getElementById('admin-update-btn');

            const name = nameEl.value.trim();
            const price = priceEl.value;
            const type = typeEl.value;

            if(!name || !price) return showToast(translations[lang].errorFill);

            btn.disabled = true;
            btn.innerHTML = `<div class="loader mx-auto"></div>`;

            const cropId = name.toLowerCase().replace(/\s+/g, '-');
            
            try {
                const cropRef = doc(db, 'artifacts', appId, 'public', 'data', 'crops', cropId);
                await setDoc(cropRef, {
                    name, price: parseFloat(price), type, updatedAt: new Date().toISOString()
                }, { merge: true });
                
                showToast(translations[lang].successUpdate);
                nameEl.value = ''; priceEl.value = '';
            } catch (e) { 
                console.error("Firebase Error:", e);
                showToast("Error: " + (e.code || e.message)); 
            } finally {
                btn.disabled = false;
                btn.innerHTML = `<i class="fas fa-plus mr-2"></i> <span>${translations[lang].adminUpdate}</span>`;
            }
        };

        window.deleteCrop = async (id) => {
            if (!confirm("Delete this crop?")) return;
            try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'crops', id)); } 
            catch (e) { showToast(e.message); }
        };

        window.switchTab = (tab) => {
            currentTab = tab;
            document.getElementById('tab-daily').className = `px-8 py-3 rounded-xl font-bold text-sm transition-all ${tab === 'daily' ? 'tab-active' : 'text-gray-400'}`;
            document.getElementById('tab-seasonal').className = `px-8 py-3 rounded-xl font-bold text-sm transition-all ${tab === 'seasonal' ? 'tab-active' : 'text-gray-400'}`;
            renderPrices();
        };

        function renderPrices() {
            const container = document.getElementById('prices-container');
            const filtered = crops.filter(c => c.type === currentTab);
            const t = translations[lang];
            if(filtered.length === 0) {
                container.innerHTML = `<div class="col-span-full py-20 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200"><p>${t.noData}</p></div>`;
                return;
            }
            container.innerHTML = filtered.map(c => `
                <div class="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative group transition-all hover:shadow-xl">
                    <div class="flex justify-between items-start">
                        <div class="space-y-1">
                            <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">${t[c.type]}</span>
                            <h4 class="text-xl font-bold text-gray-800">${c.name}</h4>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-black text-emerald-700">₹${c.price}</div>
                            <div class="text-[10px] text-gray-400 font-bold uppercase tracking-tight">${t.kg}</div>
                        </div>
                    </div>
                    <div class="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                        <span class="text-[10px] text-gray-400"><i class="far fa-clock mr-1"></i> ${t.updated}: ${new Date(c.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        ${auth.currentUser?.email === ADMIN_EMAIL ? `<button onclick="window.deleteCrop('${c.id}')" class="w-8 h-8 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><i class="fas fa-trash text-[10px]"></i></button>` : ''}
                    </div>
                </div>
            `).join('');
        }

        function showToast(msg) {
            const el = document.getElementById('toast');
            document.getElementById('toast-message').innerText = msg;
            el.classList.remove('translate-y-20', 'opacity-0');
            setTimeout(() => el.classList.add('translate-y-20', 'opacity-0'), 3000);
        }

        onAuthStateChanged(auth, (user) => {
            document.getElementById('auth-screen').classList.toggle('hidden', !!user);
            document.getElementById('main-content').classList.toggle('hidden', !user);
            if (user) {
                document.getElementById('admin-panel').classList.toggle('hidden', user.email !== ADMIN_EMAIL);
                const cropsRef = collection(db, 'artifacts', appId, 'public', 'data', 'crops');
                onSnapshot(cropsRef, (snap) => {
                    crops = snap.docs.map(d => ({id: d.id, ...d.data()}));
                    renderPrices();
                }, (err) => { 
                    console.error("Snapshot Error:", err);
                    if(err.code === 'permission-denied') showToast("Please verify Firestore Rules in Console.");
                });
            }
        });
        updateUI();
