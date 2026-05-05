const product = {
    hk: {
        name: 'Гонконгские вафли с шоколадом',
        price: 45000,
        num: 0,
        get Summ(){
            return this.price * this.num
        }
    },
    hkb: {
        name: 'Гонконгские вафли с бананом',
        price: 53000,
        num: 0,
        get Summ(){
            return this.price * this.num
        }
    },
    hks: {
        name: 'Гонконгские вафли с клубникой',
        price: 55000,
        num: 0,
        get Summ(){
            return this.price * this.num
        }
    },
    hkm: {
        name: 'Гонконгские вафли фруктовый микс',
        price: 65000,
        num: 0,
        get Summ(){
            return this.price * this.num
        }
    },
    bm: {
        name: 'Бельгийские вафли с шоколадом',
        price: 45000,
        num: 0,
        get Summ(){
            return this.price * this.num
        }
    },
    bmb: {
        name: 'Бельгийские вафли с бананом',
        price: 53000,
        num: 0,
        get Summ(){
            return this.price * this.num
        }
    },
    bms: {
        name: 'Бельгийские вафли с клубникой',
        price: 55000,
        num: 0,
        get Summ(){
            return this.price * this.num
        }
    },
    bmm: {
        name: 'Бельгийские вафли фруктовый микс',
        price: 65000,
        num: 0,
        get Summ(){
            return this.price * this.num
        }
    },
    bp: {
        name: 'Английские панкейки',
        price: 78000,
        num: 0,
        get Summ(){
            return this.price * this.num
        }
    },
    fp: {
        name: 'Фруктовые блинчики',
        price: 70000,
        num: 0,
        get Summ(){
            return this.price * this.num
        }
    },
    fwi: {
        name: 'Фондю с мороженым',
        price: 85000,
        num: 0,
        get Summ(){
            return this.price * this.num
        }
    },
}

const btnPlusOrMinus = document.querySelectorAll('.main__product-btn'),
      addCart        = document.querySelector('.addCart'),
      receipt        = document.querySelector('.receipt'),
      receiptOut     = document.querySelector('.receipt__window-out'),
      receiptWindow  = document.querySelector('.receipt__window'),
      btnReceipt     = document.querySelector('.receipt__window-btn')
    
    for (let i = 0; i < btnPlusOrMinus.length; i++){
        btnPlusOrMinus[i].addEventListener('click', function(){
            plusOrMinus(this)
        })
    }

    function plusOrMinus(btn){
        const parent   = btn.closest('.main__product'),
              parentId = parent.getAttribute('id'),
              out      = parent.querySelector('.main__product-num'),
              price    = parent.querySelector('.main__product-price span'),
              symbol   = btn.getAttribute('data-symbol')

            if (symbol == '+' && product[parentId].num < 10) {
                product[parentId].num++
            }else if(symbol == '-' && product[parentId].num > 0){
                product[parentId].num--
            }
            out.innerHTML = product[parentId].num
            price.innerHTML = product[parentId].Summ
    }

let arrayProduct = [],
    totalName    = '',
    totalPrice   = 0

addCart.addEventListener('click', function() {
    let totalNum = 0;
    for (const key in product) {
        totalNum += product[key].num;
    }

    // Если сумма всех товаров 0 — выводим алерт и СТОП
    if (totalNum === 0) {
        return alert('Ты ничего не заказал');
    }
    for (const key in product) {
        const po = product[key]
        if (po.num > 0) {
            arrayProduct.push(po)
            po.name += ' X' + po.num
        }
        po.price = po.Summ
    }
    for (let i = 0; i < arrayProduct.length; i++) {
        const el = arrayProduct[i]
        totalPrice += el.price
        totalName  += '\n' + el.name + '\n'
    }
    receiptOut.innerHTML = `Вы купили: \n ${totalName} \n Общая стоимость: ${totalPrice} сум`

    receipt.style.display = 'flex'
    setTimeout(() => {
        receipt.style.opacity = '1'
        receipt.style.backdropFilter = 'blur(5px)'
    }, 100);
    setTimeout(() => {
        receiptWindow.style.top = '0'
    }, 200);
})

const scrollButtons = document.querySelectorAll('.order-link, .header-content a, .btn-scroll');
scrollButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        
        const mainSection = document.querySelector('.main');
        
        if (mainSection) {
            mainSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

const scrollButtons1 = document.querySelectorAll('.about-us-link');
scrollButtons1.forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        
        const mainSection = document.querySelector('.aboutUs');
        
        if (mainSection) {
            mainSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

const scrollButtons2 = document.querySelectorAll('.contacts');
scrollButtons2.forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        
        const mainSection = document.querySelector('.footer__contact');
        
        if (mainSection) {
            mainSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});