import {
    auth, db, storage, // 👈 تأكد من إضافة storage هنا
    signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, updatePassword,
    collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, setDoc, getDoc,
    ref, uploadBytes, getDownloadURL // 👈 تأكد من إضافة هذه الدوال الثلاث هنا
} from "./firebase.js";

const ADMIN_EMAIL = "raed44@marsin.com";
const WHATSAPP_NUM = "905355252483";

let allProducts = [];
let userFavorites = [];
let currentUser = null;
let currentCategory = "all";
let currentSearchQuery = "";
let isRegisterMode = false;
let displayedProductsCount = 4;

function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast-msg ${type === "error" ? "error" : ""}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initTheme();
    initAuthForms();
    initAdminForm();
    listenToProducts();
    initSearchAndFilters();
});

function initTheme() {
    const themeBtn = document.getElementById("theme-toggle");
    const savedTheme = localStorage.getItem("mersin-theme");
    if (savedTheme) {
        document.documentElement.setAttribute("data-theme", savedTheme);
        updateThemeIcon(savedTheme);
    } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
        updateThemeIcon(prefersDark ? "dark" : "light");
    }

    themeBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("mersin-theme", newTheme);
        updateThemeIcon(newTheme);
        showToast(`تم التبديل إلى الوضع ${newTheme === 'dark' ? 'الليلي 🌙' : 'النهاري ☀️'}`);
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector("#theme-toggle i");
    icon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
}

function initNavigation() {
    const navButtons = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".app-section");

    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.getAttribute("data-target");

            navButtons.forEach(b => b.classList.remove("active"));
            sections.forEach(s => s.classList.remove("active"));

            btn.classList.add("active");
            document.getElementById(targetId).classList.add("active");
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    document.querySelectorAll(".cat-card").forEach(card => {
        card.addEventListener("click", () => {
            const cat = card.getAttribute("data-cat");
            filterByCategory(cat);
            document.querySelector('[data-target="section-home"]').click();
        });
    });
}

function initSearchAndFilters() {
    document.getElementById("search-input").addEventListener("input", (e) => {
        currentSearchQuery = e.target.value.toLowerCase().trim();
        renderProducts();
    });

    const catButtons = document.querySelectorAll(".category-btn");
    catButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            catButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentCategory = btn.getAttribute("data-category");
            renderProducts();
        });
    });
}

function filterByCategory(categoryName) {
    currentCategory = categoryName;
    document.querySelectorAll(".category-btn").forEach(btn => {
        if(btn.getAttribute("data-category") === categoryName) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
    renderProducts();
}

function initAuthForms() {
    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");
    const registerOnlyFields = document.querySelectorAll(".id-register-only");
    const authSubmitBtn = document.getElementById("auth-submit-btn");
    const authForm = document.getElementById("auth-form");

    tabLogin.addEventListener("click", () => {
        isRegisterMode = false;
        tabLogin.classList.add("active");
        tabRegister.classList.remove("active");
        registerOnlyFields.forEach(f => f.classList.add("hidden"));
        authSubmitBtn.innerText = "دخول";
    });

    tabRegister.addEventListener("click", () => {
        isRegisterMode = true;
        tabRegister.classList.add("active");
        tabLogin.classList.remove("active");
        registerOnlyFields.forEach(f => f.classList.remove("hidden"));
        authSubmitBtn.innerText = "إنشاء الحساب";
    });

    authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("auth-email").value.trim();
        const password = document.getElementById("auth-password").value;
        const username = document.getElementById("auth-username").value.trim();

        if (isRegisterMode) {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: username || "مستخدم مرسين" });
                showToast("✨ تم إنشاء حسابك بنجاح! أهلاً بك في مرسين");
                authForm.reset();
            } catch (error) { showToast(getAuthErrorMessage(error.code), "error"); }
        } else {
            try {
                await signInWithEmailAndPassword(auth, email, password);
                showToast("👋 تم تسجيل دخولك بنجاح");
                authForm.reset();
            } catch (error) { showToast(getAuthErrorMessage(error.code), "error"); }
        }
    });

    document.getElementById("logout-btn").addEventListener("click", () => {
        signOut(auth).then(() => { showToast("🔒 تم تسجيل الخروج بنجاح"); });
    });

    document.getElementById("update-profile-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const newName = document.getElementById("update-username").value.trim();
        if(!newName) return;
        try {
            await updateProfile(auth.currentUser, { displayName: newName });
            document.getElementById("user-display-name").innerText = `مرحباً، ${newName}`;
            showToast("👍 تم تحديث اسم المستخدم بنجاح");
            e.target.reset();
        } catch(err) { showToast("حدث خطأ أثناء التحديث", "error"); }
    });

    document.getElementById("update-password-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const newPass = document.getElementById("update-password").value;
        try {
            await updatePassword(auth.currentUser, newPass);
            showToast("🔐 تم تحديث كلمة المرور الخاصة بك بنجاح");
            e.target.reset();
        } catch(err) { showToast("يرجى إعادة تسجيل الدخول لتغيير كلمة المرور لأمانك", "error"); }
    });

    onAuthStateChanged(auth, (user) => {
        const authContainer = document.getElementById("auth-container");
        const profileContainer = document.getElementById("user-profile-container");
        const navAdminBtn = document.getElementById("nav-admin-btn");
        const adminBadge = document.getElementById("admin-badge");

        if (user) {
            currentUser = user;
            authContainer.classList.add("hidden");
            profileContainer.classList.remove("hidden");
            
            document.getElementById("user-display-name").innerText = `مرحباً، ${user.displayName || 'عميلنا الكريم'}`;
            document.getElementById("user-display-email").innerText = user.email;

            if (user.email === ADMIN_EMAIL) {
                navAdminBtn.classList.remove("hidden"); // إظهار زر الأدمن في شريط التنقل السفلي
                adminBadge.classList.remove("hidden");
            } else {
                navAdminBtn.classList.add("hidden");
                adminBadge.classList.add("hidden");
                if (document.getElementById("section-admin").classList.contains("active")) {
                    document.querySelector('[data-target="section-home"]').click();
                }
            }
            listenToFavorites(user.uid);
        } else {
            currentUser = null;
            userFavorites = [];
            authContainer.classList.remove("hidden");
            profileContainer.classList.add("hidden");
            navAdminBtn.classList.add("hidden");
            adminBadge.classList.add("hidden");
            if (document.getElementById("section-admin").classList.contains("active")) {
                document.querySelector('[data-target="section-home"]').click();
            }
            renderProducts();
        }
    });
}

function listenToProducts() {
    onSnapshot(collection(db, "products"), (snapshot) => {
        allProducts = [];
        snapshot.forEach(doc => { allProducts.push({ id: doc.id, ...doc.data() }); });
        renderProducts();
        renderAdminProducts();
    });
}

function listenToFavorites(uid) {
    onSnapshot(doc(db, "favorites", uid), (docSnap) => {
        userFavorites = docSnap.exists() ? (docSnap.data().items || []) : [];
        renderProducts();
        renderFavoritesOnly();
    });
}

async function toggleFavorite(productId) {
    if (!currentUser) {
        showToast("⚠️ يرجى تسجيل الدخول أولاً لتتمكن من إضافة المنتجات للمفضلة", "error");
        document.getElementById("nav-profile-btn").click();
        return;
    }
    const index = userFavorites.indexOf(productId);
    if (index > -1) {
        userFavorites.splice(index, 1);
        showToast("💔 تمت الإزالة من المفضلة");
    } else {
        userFavorites.push(productId);
        showToast("❤️ تمت الإضافة إلى المفضلة بنجاح");
    }
    await setDoc(doc(db, "favorites", currentUser.uid), { items: userFavorites });
}

function renderProducts() {
    const grid = document.getElementById("products-grid");
    grid.innerHTML = "";

    const filtered = allProducts.filter(p => {
        const matchesCategory = currentCategory === "all" || p.category === currentCategory;
        const desc = (p.desc || "").toLowerCase();
        const matchesSearch = p.title.toLowerCase().includes(currentSearchQuery) || desc.includes(currentSearchQuery);
        return matchesCategory && matchesSearch;
    });
    const productsToDisplay = filtered.slice(0, displayedProductsCount);

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="loading-spinner">  جاري تحديث الصفحة... </div>`;
        return;
    }

    productsToDisplay.forEach(p => {
        const isFav = userFavorites.includes(p.id);
        const card = document.createElement("div");
        const whatsappText = encodeURIComponent('أود طلب: ' + p.title);
        const phoneNumber = "905355252483";
        const whatsappLink = `https://wa.me/${phoneNumber}?text=${whatsappText}`;
        
        card.innerHTML = `
            <div class="product-image-holder">
                <img src="${p.imageUrl || 'https://via.placeholder.com/200'}" alt="${p.title}" loading="lazy">
                <button class="fav-btn ${isFav ? 'is-fav' : ''}"><i class="fa-solid fa-heart"></i></button>
            </div>
            <div class="product-info">
                <span class="prod-cat-tag">${p.category}</span>
                <h3 class="product-title">${p.title}</h3>
                <p class="product-desc">${p.desc}</p>
                <div class="product-price">${Number(p.price).toLocaleString()}L.T </div>
                <a href="${whatsappLink}" target="_blank" class="whatsapp-order-btn">
                    <i class="fa-brands fa-whatsapp"></i> اطلب عبر واتساب
                </a>
            </div>
        `;
        card.querySelector(".fav-btn").addEventListener("click", () => toggleFavorite(p.id));
        grid.appendChild(card);
    });
}

function renderFavoritesOnly() {
    const favGrid = document.getElementById("favorites-grid");
    favGrid.innerHTML = "";
    const favProducts = allProducts.filter(p => userFavorites.includes(p.id));

    if (favProducts.length === 0) {
        favGrid.innerHTML = `<div class="loading-spinner">قائمتك المفضلة فارغة حالياً.</div>`;
        return;
    }

    favProducts.forEach(p => {
        const card = document.createElement("div");
        card.className = "product-card";
        const whatsappLink = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent('أود طلب منتجي المفضل: ' + p.title)}`;
        card.innerHTML = `
            <div class="product-image-holder">
                <img src="${p.imageUrl}" alt="${p.title}">
                <button class="fav-btn is-fav"><i class="fa-solid fa-heart"></i></button>
            </div>
            <div class="product-info">
                <span class="prod-cat-tag">${p.category}</span>
                <h3 class="product-title">${p.title}</h3>
                <p class="product-desc">${p.desc}</p>
                <div class="product-price">${Number(p.price).toLocaleString()}L.T</div>
                <a href="${whatsappLink}" target="_blank" class="whatsapp-order-btn">
                    <i class="fa-brands fa-whatsapp"></i> اطلب عبر واتساب
                </a>
            </div>
        `;
        card.querySelector(".fav-btn").addEventListener("click", () => toggleFavorite(p.id));
        favGrid.appendChild(card);
    });
}

function initAdminForm() {
    const form = document.getElementById("admin-product-form");
    if (!form) return; // إذا لم يجد النموذج يخرج فوراً دون أخطاء

    const cancelBtn = document.getElementById("admin-cancel-edit");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => { form.reset(); resetAdminState(); });
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const editId = document.getElementById("edit-product-id")?.value || "";
        const title = document.getElementById("prod-title")?.value.trim() || "";
        const price = document.getElementById("prod-price")?.value || 0;
        const category = document.getElementById("prod-category")?.value || "";
        const desc = document.getElementById("prod-desc")?.value.trim() || "";
        const imgFile = document.getElementById("prod-image")?.files[0];

        try {
            showToast("جاري معالجة وحفظ البيانات...", "info");
            let imageUrl = "";

            if (editId) {
                const docRef = doc(db, "products", editId);
                const updateData = { title, price, category, desc };
                if (imgFile) {
                    imageUrl = await uploadImage(imgFile);
                    updateData.imageUrl = imageUrl;
                }
                await updateDoc(docRef, updateData);
                showToast("✏️ تم تعديل المنتج بنجاح");
            } else {
                if (!imgFile) {
                    showToast("⚠️ يرجى رفع صورة المنتج أولاً", "error");
                    return;
                }
                imageUrl = await uploadImage(imgFile);
                await addDoc(collection(db, "products"), { title, price, category, desc, imageUrl, createdAt: new Date() });
                showToast("🎉 تم إضافة المنتج الجديد للمعرض بنجاح");
            }

            form.reset();
            resetAdminState();
        } catch (error) {
            console.error("خطأ أثناء حفظ المنتج:", error);
            showToast("فشلت العملية، تفقد الاتصال", "error");
        }
    });
}

function uploadImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; 
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedBase64 = canvas.toDataURL('image/webp', 0.7);
                resolve(compressedBase64);
            };
        };
        reader.onerror = (error) => reject(error);
    });
}
function renderAdminProducts() {
    const list = document.getElementById("admin-products-list");
    list.innerHTML = "";
    document.getElementById("admin-prod-count").innerText = allProducts.length;

    allProducts.forEach(p => {
        const row = document.createElement("div");
        row.className = "admin-item-row";
       row.innerHTML = `
    <div class="product-card">
        <img src="${p.imageUrl || p.image || 'https://via.placeholder.com/200'}" alt="${p.title}" style="width:100%; height:120px; object-fit:cover;">
        <div class="product-title" style="font-weight:bold; margin:5px 0;">${p.title}</div>
        <div class="product-price" style="color:green; font-weight:bold;">${p.price} L.T </div>
        <div class="admin-item-actions">
            <button class="btn-edit-item">تعديل</button>
            <button class="btn-delete-item">حذف</button>
        </div>
    </div>
`;
        row.querySelector(".btn-edit-item").addEventListener("click", () => prepareEdit(p));
        row.querySelector(".btn-delete-item").addEventListener("click", () => deleteProductItem(p.id));
        list.appendChild(row);
    });
}

function prepareEdit(product) {
    document.getElementById("edit-product-id").value = product.id;
    document.getElementById("prod-title").value = product.title;
    document.getElementById("prod-price").value = product.price;
    document.getElementById("prod-category").value = product.category;
    document.getElementById("prod-desc").value = product.desc;
    document.getElementById("admin-submit-btn").innerText = "حفظ التعديلات الحالية";
    document.getElementById("admin-cancel-edit").classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteProductItem(id) {
    if (confirm("هل تريد حذف هذا المنتج نهائياً من المشتل؟")) {
        await deleteDoc(doc(db, "products", id));
        showToast("🗑️ تم حذف المنتج بنجاح");
    }
}

function resetAdminState() {
    document.getElementById("edit-product-id").value = "";
    document.getElementById("admin-submit-btn").innerText = "إضافة المنتج للمحل";
    document.getElementById("admin-cancel-edit").classList.add("hidden");
}

function getAuthErrorMessage(code) {
    switch (code) {
        case "auth/invalid-credential": return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
        case "auth/email-already-in-use": return "هذا البريد الإلكتروني مسجل بالفعل لدينا.";
        case "auth/weak-password": return "كلمة المرور ضعيفة جداً (6 أحرف على الأقل).";
        default: return "عذراً، حدث خطأ ما. يرجى المحاولة لاحقاً.";
    }
}
// كود جلب المزيد من المنتجات تلقائياً عند النزول لأسفل الصفحة
window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        let filteredCount = allProducts.filter(p => {
            const matchesCategory = currentCategory === "all" || p.category === currentCategory;
            const matchesSearch = p.title.toLowerCase().includes(currentSearchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        }).length;

        if (displayedProductsCount < filteredCount) {
            displayedProductsCount += 4; 
            renderProducts(); 
        }
    }
});