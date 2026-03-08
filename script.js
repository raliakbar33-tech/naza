// DOM Elementleri
const match = document.getElementById('match');
const matchbox = document.querySelector('.matchbox');
const paper = document.getElementById('paper');
const paperGrid = document.getElementById('paperGrid');
const burnEffect = document.getElementById('burnEffect');
const backgroundPhoto = document.getElementById('backgroundPhoto');
const photoImage = document.getElementById('photoImage');
const sparksContainer = document.getElementById('sparksContainer');
const noteCards = document.querySelectorAll('.note-card');

// Kağıt parçaları - ortadaki kutu ölçüleri (skorboard oranı), tam sayı parça boyutu için 56x35
const PAPER_WIDTH = 560;
const PAPER_HEIGHT = 350;
const GRID_COLS = 56;
const GRID_ROWS = 35;
let paperPieces = [];

// Durumlar
let isDragging = false;
let isBurning = false;
let isPaperBurning = false;
let matchPosition = { x: 0, y: 0 };
let startPosition = { x: 0, y: 0 };
let lastStrikerPosition = null;
let totalStrikeDistance = 0;
const REQUIRED_STRIKE_DISTANCE = 45;

// Kibrit pozisyonunu ayarla
function setMatchPosition(x, y) {
    match.style.left = x + 'px';
    match.style.bottom = y + 'px';
    matchPosition.x = x;
    matchPosition.y = y;
}

// İlk pozisyon
setMatchPosition(70, 105);

// Mouse olayları
match.addEventListener('mousedown', (e) => {
    isDragging = true;
    match.style.cursor = 'grabbing';
    startPosition.x = e.clientX;
    startPosition.y = e.clientY;
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startPosition.x;
    const deltaY = startPosition.y - e.clientY;
    
    const newX = matchPosition.x + deltaX;
    const newY = matchPosition.y + deltaY;
    
    setMatchPosition(newX, newY);
    
    startPosition.x = e.clientX;
    startPosition.y = e.clientY;
    
    checkMatchboxProximity();
    
    if (isBurning) {
        checkPaperProximity();
    }
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        match.style.cursor = 'grab';
        if (!isBurning) {
            lastStrikerPosition = null;
            totalStrikeDistance = 0;
        }
    }
});

// Touch olayları
match.addEventListener('touchstart', (e) => {
    isDragging = true;
    const touch = e.touches[0];
    startPosition.x = touch.clientX;
    startPosition.y = touch.clientY;
    e.preventDefault();
});

document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startPosition.x;
    const deltaY = startPosition.y - touch.clientY;
    
    const newX = matchPosition.x + deltaX;
    const newY = matchPosition.y + deltaY;
    
    setMatchPosition(newX, newY);
    
    startPosition.x = touch.clientX;
    startPosition.y = touch.clientY;
    
    checkMatchboxProximity();
    
    if (isBurning) {
        checkPaperProximity();
    }
    
    e.preventDefault();
});

document.addEventListener('touchend', () => {
    if (isDragging) {
        isDragging = false;
        if (!isBurning) {
            lastStrikerPosition = null;
            totalStrikeDistance = 0;
        }
    }
});

// Kıvılcım oluştur
function createSpark(x, y) {
    const spark = document.createElement('div');
    spark.className = 'spark';
    spark.style.left = x + 'px';
    spark.style.top = y + 'px';
    
    const angle = Math.random() * Math.PI * 2;
    const distance = 18 + Math.random() * 30;
    const endDistance = distance * 1.6;
    
    const sparkX = Math.cos(angle) * distance;
    const sparkY = Math.sin(angle) * distance;
    const sparkXEnd = Math.cos(angle) * endDistance;
    const sparkYEnd = Math.sin(angle) * endDistance;
    
    spark.style.setProperty('--spark-x', sparkX + 'px');
    spark.style.setProperty('--spark-y', sparkY + 'px');
    spark.style.setProperty('--spark-x-end', sparkXEnd + 'px');
    spark.style.setProperty('--spark-y-end', sparkYEnd + 'px');
    
    sparksContainer.appendChild(spark);
    
    setTimeout(() => {
        if (spark.parentNode) {
            spark.parentNode.removeChild(spark);
        }
    }, 700);
}

// Kibrit kutusuna yakınlık kontrolü
function checkMatchboxProximity() {
    const matchboxRect = matchbox.getBoundingClientRect();
    const matchRect = match.getBoundingClientRect();
    
    const matchHeadX = matchRect.left + matchRect.width / 2;
    const matchHeadY = matchRect.top;
    
    const strikerRect = matchbox.getBoundingClientRect();
    const strikerTop = strikerRect.bottom - 36;
    const strikerBottom = strikerRect.bottom - 8;
    const strikerLeft = strikerRect.left + 12;
    const strikerRight = strikerRect.right - 12;
    
    const isHeadInStrikerArea = 
        matchHeadX >= strikerLeft && 
        matchHeadX <= strikerRight &&
        matchHeadY >= strikerTop && 
        matchHeadY <= strikerBottom;
    
    if (isHeadInStrikerArea && isDragging) {
        if (lastStrikerPosition) {
            const distance = Math.sqrt(
                Math.pow(matchHeadX - lastStrikerPosition.x, 2) + 
                Math.pow(matchHeadY - lastStrikerPosition.y, 2)
            );
            totalStrikeDistance += distance;
            
            if (Math.random() > 0.7) {
                createSpark(matchHeadX, matchHeadY);
            }
        }
        
        lastStrikerPosition = { x: matchHeadX, y: matchHeadY };
        
        if (!isBurning && totalStrikeDistance >= REQUIRED_STRIKE_DISTANCE) {
            lightMatch();
            for (let i = 0; i < 6; i++) {
                setTimeout(() => {
                    createSpark(matchHeadX, matchHeadY);
                }, i * 50);
            }
        }
    } else {
        if (!isHeadInStrikerArea) {
            lastStrikerPosition = null;
            totalStrikeDistance = 0;
        }
    }
}

// Kibriti yak
function lightMatch() {
    isBurning = true;
    match.classList.add('burning');
}

// Kağıda yakınlık kontrolü
function checkPaperProximity() {
    if (isPaperBurning) return;
    
    const paperRect = paper.getBoundingClientRect();
    const matchRect = match.getBoundingClientRect();
    
    const matchHeadX = matchRect.left + matchRect.width / 2;
    const matchHeadY = matchRect.top;
    
    // Kağıdın sınırları içinde mi kontrol et
    const isMatchHeadOnPaper = 
        matchHeadX >= paperRect.left && 
        matchHeadX <= paperRect.right &&
        matchHeadY >= paperRect.top && 
        matchHeadY <= paperRect.bottom;
    
    if (isMatchHeadOnPaper && isBurning) {
        // Dokunma noktasını hesapla (kağıdın içindeki göreceli pozisyon)
        const touchX = matchHeadX - paperRect.left;
        const touchY = matchHeadY - paperRect.top;
        
        burnPaper(touchX, touchY);
    }
}

// (row,col) ile parça bul
function getPieceAt(row, col) {
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return null;
    return paperPieces[row * GRID_COLS + col];
}

// Kağıt parçalarını oluştur: absolute, 1px örtüşmeli kareler (boşluk kalmaz)
function createPaperPieces() {
    const cellW = PAPER_WIDTH / GRID_COLS;
    const cellH = PAPER_HEIGHT / GRID_ROWS;
    const overlap = 1;
    const w = cellW + overlap;
    const h = cellH + overlap;
    paperPieces = [];
    
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            const piece = document.createElement('div');
            piece.className = 'paper-piece';
            piece.style.width = w + 'px';
            piece.style.height = h + 'px';
            piece.style.left = (col * cellW) + 'px';
            piece.style.top = (row * cellH) + 'px';
            piece.style.margin = '0';
            piece.style.padding = '0';
            piece.style.border = 'none';
            
            const pieceData = {
                element: piece,
                row: row,
                col: col,
                x: (col + 0.5) * cellW,
                y: (row + 0.5) * cellH,
                burned: false
            };
            
            paperPieces.push(pieceData);
            paperGrid.appendChild(piece);
        }
    }
}

// Kağıdı yak - eğri yay formasyonu: ateş dokunulan noktadan kavisli bir yay gibi yayılır (fotoğraftaki gibi)
function burnPaper(touchX, touchY) {
    if (isPaperBurning) return;
    
    isPaperBurning = true;
    
    const burnOrigin = document.getElementById('burnOrigin');
    burnOrigin.style.left = touchX + 'px';
    burnOrigin.style.top = touchY + 'px';
    
    const cellW = PAPER_WIDTH / GRID_COLS;
    const cellH = PAPER_HEIGHT / GRID_ROWS;
    
    const touchedCol = Math.floor(touchX / cellW);
    const touchedRow = Math.floor(touchY / cellH);
    const touchedPiece = getPieceAt(touchedRow, touchedCol);
    
    if (!touchedPiece || touchedPiece.burned) {
        isPaperBurning = false;
        return;
    }
    
    // Eğri yay: her parçaya "dalga sırası" ver – mesafe + açıya göre kavis (ortada önde, yanlarda arkada)
    const ARC_CURVATURE = 55;  // ne kadar kavisli (büyük = daha yuvarlak yay)
    const ANGLE_UP_RIGHT = Math.PI / 4;  // 45° yukarı-sağ (yayın önü)
    
    paperPieces.forEach(piece => {
        const dx = piece.x - touchX;
        const dy = piece.y - touchY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const angleDiff = angle - ANGLE_UP_RIGHT;
        const curve = ARC_CURVATURE * angleDiff * angleDiff;
        piece.waveOrder = dist + curve;
    });
    
    const burnOrder = paperPieces.slice().sort((a, b) => a.waveOrder - b.waveOrder);
    
    const BURN_DELAY_MS = 2;
    const BURN_ANIM_MS = 125;
    
    burnOrder.forEach((piece, index) => {
        const delay = index * BURN_DELAY_MS;
        setTimeout(() => {
            piece.element.classList.add('burning');
            piece.burned = true;
            setTimeout(() => {
                piece.element.classList.add('burned');
            }, BURN_ANIM_MS);
            if (index === burnOrder.length - 1) {
                setTimeout(() => {
                    paper.classList.add('burned');
                }, BURN_ANIM_MS + 120);
            }
        }, delay);
    });
    
    burnEffect.classList.add('active');
    burnOrigin.classList.add('active');
}

// Fotoğrafı göster - artık kullanılmıyor, fotoğraf zaten yüklü
function showPhoto() {
    // Fotoğraf zaten preloadPhoto() ile yüklenmiş
    // Parçalar yandıkça otomatik görünüyor
}


// Not Kartları - Döndürme Animasyonu (6 kart)
let isFlipping = false;
let cardOrder = [0, 1, 2, 3, 4, 5]; // Kart sırası

function getCardTransform(position) {
    const positions = [
        'translateY(0) rotateY(0deg) scale(1)',
        'translateY(6px) rotateY(1.5deg) scale(0.99)',
        'translateY(12px) rotateY(3deg) scale(0.98)',
        'translateY(18px) rotateY(4.5deg) scale(0.97)',
        'translateY(24px) rotateY(6deg) scale(0.96)',
        'translateY(30px) rotateY(7.5deg) scale(0.95)'
    ];
    return positions[position] || positions[5];
}

function getTopCardIndex() {
    return cardOrder[0];
}

function flipCard(card) {
    if (isFlipping) return;
    
    const cardIndex = parseInt(card.dataset.index);
    const topCardIndex = getTopCardIndex();
    
    // Sadece en üstteki kart tıklanabilir
    if (cardIndex !== topCardIndex) return;
    
    isFlipping = true;
    
    // Kart sırasını güncelle (en üstteki arkaya gidiyor)
    cardOrder.push(cardOrder.shift());
    
    // Önce z-index'leri anında güncelle (transition olmadan)
    noteCards.forEach((c) => {
        const cIndex = parseInt(c.dataset.index);
        const position = cardOrder.indexOf(cIndex);
        const z = 6 - position;
        c.style.zIndex = String(z);
        c.style.pointerEvents = position === 0 ? 'auto' : 'none';
    });
    
    // Dönen kartı başlat
    card.classList.add('flipping');
    card.style.opacity = '0';
    
    // Diğer kartları animasyonun yarısında güncelle (daha akıcı)
    setTimeout(() => {
        noteCards.forEach((c) => {
            const cIndex = parseInt(c.dataset.index);
            const position = cardOrder.indexOf(cIndex);
            c.style.transform = getCardTransform(position);
            c.style.opacity = '1';
        });
    }, 300);
    
    // Animasyon bitince dönen kartı sıfırla (en arkaya)
    setTimeout(() => {
        card.classList.remove('flipping');
        card.style.transform = getCardTransform(5);
        card.style.opacity = '1';
        isFlipping = false;
    }, 600);
}

// Kartlara tıklama event'i ekle
noteCards.forEach(card => {
    card.addEventListener('click', () => {
        flipCard(card);
    });
});

// Sayfa yüklendiğinde
window.addEventListener('load', () => {
    // Kağıt parçalarını oluştur
    createPaperPieces();
    
    // Fotoğrafı önceden yükle (görünür ama kağıt altında)
    preloadPhoto();
    
    // Kartların başlangıç pozisyonlarını ayarla (6 kart)
    noteCards.forEach((card) => {
        const cardIndex = parseInt(card.dataset.index);
        const position = cardOrder.indexOf(cardIndex);
        const z = 6 - position;
        card.style.zIndex = String(z);
        card.style.transform = getCardTransform(position);
        card.style.opacity = '1';
        card.style.pointerEvents = position === 0 ? 'auto' : 'none';
    });
    
    // Fotoğraf yolunu kontrol et
    // Kullanıcı index.html'de veya burada değiştirebilir
    console.log('İnteraktif deneyim hazır!');
    console.log('Fotoğraf eklemek için: script.js dosyasındaki showPhoto() fonksiyonunda photoImage.src değerini değiştirin');
});

// Fotoğrafı önceden yükle
function preloadPhoto() {
    photoImage.src = 'https://i.ibb.co/wFY2NDLd/bowling-scoreboard-frontal.png';
    photoImage.alt = 'Bowling scoreboard';
    // Fotoğraf zaten arkada, parçalar yandıkça görünecek
    backgroundPhoto.style.opacity = '1';
    backgroundPhoto.style.zIndex = '1';
}

