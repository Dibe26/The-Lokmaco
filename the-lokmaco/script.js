// =============================================
// The Lokmaco — script.js
// Supabase integration + Cart functionality
// =============================================

// ─── SUPABASE CONFIG ─────────────────────────
// TODO: Замените на ваши данные из Supabase Dashboard → Settings → API
const SUPABASE_URL = 'https://ovzrrbgaoozqojbuyvbj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92enJyYmdhb296cW9qYnV5dmJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5ODAwMjgsImV4cCI6MjA5MzU1NjAyOH0.5rTgpqfGYbtvHUthI37_I5IoHjhVEla1cNuk1XxWZF0';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── SESSION ─────────────────────────────────
function getSessionId() {
    let sid = localStorage.getItem('lokmaco_session');
    if (!sid) {
        sid = 'sess_' + Math.random().toString(36).slice(2) + Date.now();
        localStorage.setItem('lokmaco_session', sid);
    }
    return sid;
}

let currentUser = null;
let currentCart = null;
let cartItems   = [];  // [{id, quantity, menu_items: {...}}]
let menuItems   = [];  // [{id, name, price, image_url, category, ...}]

// ─── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await initUser();
    await loadMenu();
    await loadCart();
    initUI();
});

// ─── USER & CART INIT ─────────────────────────
async function initUser() {
    const sessionId = getSessionId();

    // Получаем или создаём пользователя
    let { data: users } = await db
        .from('users')
        .select('*')
        .eq('session_id', sessionId)
        .limit(1);

    if (users && users.length > 0) {
        currentUser = users[0];
    } else {
        let { data: newUser } = await db
            .from('users')
            .insert({ session_id: sessionId })
            .select()
            .single();
        currentUser = newUser;
    }

    // Получаем или создаём корзину
    let { data: carts } = await db
        .from('carts')
        .select('*')
        .eq('user_id', currentUser.id)
        .limit(1);

    if (carts && carts.length > 0) {
        currentCart = carts[0];
    } else {
        let { data: newCart } = await db
            .from('carts')
            .insert({ user_id: currentUser.id })
            .select()
            .single();
        currentCart = newCart;
    }
}

// ─── LOAD MENU FROM DB ────────────────────────
async function loadMenu() {
    const loader   = document.getElementById('menu-loader');
    const errorDiv = document.getElementById('menu-error');

    const { data, error } = await db
        .from('menu_items')
        .select('*')
        .order('id');

    if (loader) loader.style.display = 'none';

    if (error) {
        console.error('Ошибка загрузки меню:', error);
        if (errorDiv) errorDiv.style.display = 'block';
        return;
    }

    menuItems = data;
    renderMenu();
}

// ─── RENDER MENU ──────────────────────────────
function renderMenu() {
    const main = document.querySelector('.main.container');
    if (!main) return;

    // Убираем лоадер и старые секции
    main.querySelectorAll('.menu-loader, .sections, .category-title, .button, .receipt').forEach(el => el.remove());

    // Группируем по категориям
    const categories = {
        'hong-kong': 'Гонконгские вафли',
        'belgian':   'Бельгийские вафли',
        'pancakes':  'Панкейки и блинчики',
        'fondue':    'Фондю',
        'other':     'Другое'
    };

    const grouped = {};
    menuItems.forEach(item => {
        const cat = item.category || 'other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
    });

    Object.entries(grouped).forEach(([catKey, items]) => {
        // Заголовок категории
        const catTitle = document.createElement('div');
        catTitle.className = 'category-title';
        catTitle.innerHTML = `<h3>${categories[catKey] || catKey}</h3>`;
        main.appendChild(catTitle);

        // Секция с товарами
        const section = document.createElement('div');
        section.className = 'sections';

        items.forEach(item => {
            section.appendChild(createProductCard(item));
        });
        main.appendChild(section);
    });

    // Кнопка "Заказать" (открывает корзину)
    const btnDiv = document.createElement('div');
    btnDiv.className = 'button';
    btnDiv.innerHTML = `<button class="addCart" id="open-cart-btn" type="button">Перейти в корзину 🛒</button>`;
    main.appendChild(btnDiv);
}

function createProductCard(item) {
    const section = document.createElement('section');
    section.className = 'main__product';
    section.dataset.itemId = item.id;

    const formattedPrice = item.price.toLocaleString('ru-RU');

    section.innerHTML = `
        <div class="main__product-preview">
            <div class="main__product-info">
                <img src="${item.image_url}" alt="${item.name}" class="main__product-img">
                <h2 class="main__product-title">
                    ${item.name}
                    <span class="main__product-many">${formattedPrice} сум</span>
                </h2>
            </div>
            <div class="main__product-extra">
                <div class="main__product-number">
                    <a class="main__product-btn fa-reg minus" data-symbol="-"></a>
                    <output class="main__product-num">0</output>
                    <a class="main__product-btn fa-reg plus" data-symbol="+"></a>
                </div>
                <div class="main__product-price"><span>0</span> сум</div>
                <button class="add-to-cart-btn" data-item-id="${item.id}">
                    Добавить в корзину
                </button>
            </div>
        </div>
    `;

    // Счётчик +/−
    const minusBtn = section.querySelector('[data-symbol="-"]');
    const plusBtn  = section.querySelector('[data-symbol="+"]');
    const numOut   = section.querySelector('.main__product-num');
    const priceOut = section.querySelector('.main__product-price span');
    const addBtn   = section.querySelector('.add-to-cart-btn');

    let localQty = 0;

    function updateDisplay() {
        numOut.textContent   = localQty;
        priceOut.textContent = (item.price * localQty).toLocaleString('ru-RU');
        addBtn.disabled      = localQty === 0;
    }

    plusBtn.addEventListener('click', () => {
        if (localQty < 10) { localQty++; updateDisplay(); }
    });
    minusBtn.addEventListener('click', () => {
        if (localQty > 0) { localQty--; updateDisplay(); }
    });

    addBtn.addEventListener('click', async () => {
        if (localQty === 0) return;
        await addToCart(item.id, localQty);
        localQty = 0;
        updateDisplay();
        openCart();
    });

    updateDisplay();
    return section;
}

// ─── CART: LOAD ───────────────────────────────
async function loadCart() {
    if (!currentCart) return;

    const { data, error } = await db
        .from('cart_items')
        .select('*, menu_items(*)')
        .eq('cart_id', currentCart.id);

    if (error) {
        console.error('Ошибка загрузки корзины:', error);
        return;
    }
    cartItems = data || [];
    renderCart();
    updateCartBadge();
}

// ─── CART: ADD ────────────────────────────────
async function addToCart(menuItemId, qty = 1) {
    if (!currentCart) return;

    // Проверяем, есть ли уже такой товар
    const existing = cartItems.find(ci => ci.menu_item_id === menuItemId);

    if (existing) {
        // Обновляем количество
        const newQty = existing.quantity + qty;
        const { error } = await db
            .from('cart_items')
            .update({ quantity: newQty })
            .eq('id', existing.id);

        if (!error) {
            existing.quantity = newQty;
        }
    } else {
        // Добавляем новый элемент
        const { data, error } = await db
            .from('cart_items')
            .insert({
                cart_id:      currentCart.id,
                menu_item_id: menuItemId,
                quantity:     qty
            })
            .select('*, menu_items(*)')
            .single();

        if (!error && data) {
            cartItems.push(data);
        }
    }

    renderCart();
    updateCartBadge();
}

// ─── CART: REMOVE ─────────────────────────────
async function removeFromCart(cartItemId) {
    const { error } = await db
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

    if (!error) {
        cartItems = cartItems.filter(ci => ci.id !== cartItemId);
        renderCart();
        updateCartBadge();
    }
}

// ─── CART: UPDATE QUANTITY ────────────────────
async function updateCartItemQty(cartItemId, delta) {
    const item = cartItems.find(ci => ci.id === cartItemId);
    if (!item) return;

    const newQty = item.quantity + delta;

    if (newQty <= 0) {
        await removeFromCart(cartItemId);
        return;
    }
    if (newQty > 10) return;

    const { error } = await db
        .from('cart_items')
        .update({ quantity: newQty })
        .eq('id', cartItemId);

    if (!error) {
        item.quantity = newQty;
        renderCart();
        updateCartBadge();
    }
}

// ─── CART: CLEAR ──────────────────────────────
async function clearCart() {
    if (!currentCart) return;
    await db.from('cart_items').delete().eq('cart_id', currentCart.id);
    cartItems = [];
    renderCart();
    updateCartBadge();
}

// ─── CART: RENDER ─────────────────────────────
function renderCart() {
    const list      = document.getElementById('cart-items-list');
    const totalEl   = document.getElementById('cart-total');
    const emptyMsg  = document.getElementById('cart-empty-msg');
    const orderForm = document.getElementById('order-form-section');

    if (!list) return;

    list.innerHTML = '';

    if (cartItems.length === 0) {
        if (emptyMsg)  emptyMsg.style.display  = 'block';
        if (orderForm) orderForm.style.display = 'none';
        if (totalEl)   totalEl.textContent     = '0';
        return;
    }

    if (emptyMsg)  emptyMsg.style.display  = 'none';
    if (orderForm) orderForm.style.display = 'block';

    let total = 0;

    cartItems.forEach(ci => {
        const mi        = ci.menu_items;
        const itemTotal = mi.price * ci.quantity;
        total          += itemTotal;

        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `
            <img src="${mi.image_url}" alt="${mi.name}" class="cart-item__img">
            <div class="cart-item__info">
                <span class="cart-item__name">${mi.name}</span>
                <span class="cart-item__price">${mi.price.toLocaleString('ru-RU')} сум × ${ci.quantity}</span>
                <span class="cart-item__total">${itemTotal.toLocaleString('ru-RU')} сум</span>
            </div>
            <div class="cart-item__controls">
                <button class="cart-qty-btn" data-id="${ci.id}" data-delta="-1">−</button>
                <span>${ci.quantity}</span>
                <button class="cart-qty-btn" data-id="${ci.id}" data-delta="1">+</button>
                <button class="cart-remove-btn" data-id="${ci.id}">✕</button>
            </div>
        `;
        list.appendChild(li);
    });

    if (totalEl) totalEl.textContent = total.toLocaleString('ru-RU');

    // Привязываем события
    list.querySelectorAll('.cart-qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id    = parseInt(btn.dataset.id);
            const delta = parseInt(btn.dataset.delta);
            updateCartItemQty(id, delta);
        });
    });
    list.querySelectorAll('.cart-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            removeFromCart(parseInt(btn.dataset.id));
        });
    });
}

// ─── CART BADGE ───────────────────────────────
function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const totalQty = cartItems.reduce((sum, ci) => sum + ci.quantity, 0);
    badge.textContent = totalQty;
    badge.style.display = totalQty > 0 ? 'flex' : 'none';
}

// ─── CART SIDEBAR OPEN/CLOSE ──────────────────
function openCart() {
    const sidebar  = document.getElementById('cart-sidebar');
    const overlay  = document.getElementById('cart-overlay');
    if (sidebar)  { sidebar.classList.add('open'); }
    if (overlay)  { overlay.classList.add('visible'); }
}

function closeCart() {
    const sidebar  = document.getElementById('cart-sidebar');
    const overlay  = document.getElementById('cart-overlay');
    if (sidebar)  { sidebar.classList.remove('open'); }
    if (overlay)  { overlay.classList.remove('visible'); }
}

// ─── SUBMIT ORDER ─────────────────────────────
async function submitOrder(name, phone) {
    if (cartItems.length === 0) return;

    const total = cartItems.reduce((sum, ci) => sum + ci.menu_items.price * ci.quantity, 0);

    // Создаём заказ
    const { data: order, error: orderErr } = await db
        .from('orders')
        .insert({ name, phone, total_price: total })
        .select()
        .single();

    if (orderErr) {
        console.error('Ошибка создания заказа:', orderErr);
        alert('Произошла ошибка. Попробуйте ещё раз.');
        return;
    }

    // Добавляем позиции заказа
    const orderItemsData = cartItems.map(ci => ({
        order_id:     order.id,
        menu_item_id: ci.menu_item_id,
        quantity:     ci.quantity,
        price:        ci.menu_items.price
    }));

    await db.from('order_items').insert(orderItemsData);

    // Очищаем корзину
    await clearCart();

    // Показываем успех
    showOrderSuccess(order, total);
}

// ─── ORDER SUCCESS ────────────────────────────
function showOrderSuccess(order, total) {
    closeCart();

    const modal = document.getElementById('order-success-modal');
    if (modal) {
        document.getElementById('success-order-id').textContent   = order.id;
        document.getElementById('success-order-total').textContent = total.toLocaleString('ru-RU');
        modal.classList.add('visible');
    }
}

// ─── UI INIT ──────────────────────────────────
function initUI() {
    // Кнопка корзины в навигации
    const cartNavBtn = document.getElementById('cart-nav-btn');
    if (cartNavBtn) {
        cartNavBtn.addEventListener('click', openCart);
    }

    // Кнопка "Перейти в корзину" в меню (может появиться после renderMenu)
    document.addEventListener('click', e => {
        if (e.target && e.target.id === 'open-cart-btn') {
            openCart();
        }
    });

    // Закрытие корзины
    const closeBtn = document.getElementById('cart-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeCart);

    const overlay = document.getElementById('cart-overlay');
    if (overlay) overlay.addEventListener('click', closeCart);

    // Форма заказа
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name  = document.getElementById('order-name').value.trim();
            const phone = document.getElementById('order-phone').value.trim();

            if (!name || !phone) {
                alert('Пожалуйста, заполните имя и телефон.');
                return;
            }

            const submitBtn = orderForm.querySelector('button[type="submit"]');
            submitBtn.disabled   = true;
            submitBtn.textContent = 'Оформляем...';

            await submitOrder(name, phone);

            submitBtn.disabled   = false;
            submitBtn.textContent = 'Оформить заказ';
        });
    }

    // Закрытие модала успеха
    const successCloseBtn = document.getElementById('success-close-btn');
    if (successCloseBtn) {
        successCloseBtn.addEventListener('click', () => {
            document.getElementById('order-success-modal').classList.remove('visible');
        });
    }

    // ─── НАВИГАЦИЯ (скролл) ───
    document.querySelectorAll('.order-link, .header-content a').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            document.querySelector('.main')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    document.querySelectorAll('.about-us-link').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            document.querySelector('.aboutUs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    document.querySelectorAll('.contacts').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            document.querySelector('.footer__contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}