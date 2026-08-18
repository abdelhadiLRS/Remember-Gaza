
// Automatically detect system language or load preferred
const browserLang = (navigator.language || navigator.userLanguage || 'ar').toLowerCase();
let systemLang = 'ar';
if (browserLang.startsWith('en')) systemLang = 'en';
else if (browserLang.startsWith('fr')) systemLang = 'fr';
else if (browserLang.startsWith('es')) systemLang = 'es';

// Detect query parameter lang override
const urlParamsForLang = new URLSearchParams(window.location.search);
const queryLang = urlParamsForLang.get('lang');
if (queryLang && ['ar', 'en', 'fr', 'es'].includes(queryLang.toLowerCase())) {
    localStorage.setItem('site_lang', queryLang.toLowerCase());
}

if (!localStorage.getItem('site_lang')) {
    localStorage.setItem('site_lang', systemLang);
}
let currentLang = localStorage.getItem('site_lang') || systemLang;
let gazaSouls=[];
let width, height, points = [];
let cachedItems = []; // 2. التخزين المؤقت للإحداثيات والخصائص
let isDirty = true;   // 1. نظام إعادة الرسم المشروط (Dirty Flag)
let currentMainMode = 'souls';
let map = null;
let markersLayer = null;
let nakbaVillages = [];
let mapMarkers = [];
let gazaGeoJsonLayer = null;
let mouseX = -1000, mouseY = -1000;

let backgroundSound = null;
let isPlayingAudio = false;
let audioCtx = null, synthOsc1 = null, synthOsc2 = null, synthGain = null;
let isAudioSynthActive = false;

let currentSearchQuery = "";
let currentMartyrObj = null;

// Memory Corridors state & logic
let corridorsActive = false;
let familyGroups = {}; // Maps familyName -> Array of points
let hoveredFamilyName = null;
let spotlightStarId = null;
let spotlightTimer = null;

const translations = {
    ar: {
        titleMain: "أرواح", logoText: "فلسطين", searchPlaceholder: "ابحث عن اسم الشهيد...",
        tabSouls: "شهداء غزة", tabJournalists: "شهداء الصحافة", tabWestBank: "شهداء الضفة", tab48: "شهداء 48",
        tabMilestones: "أبرز المحطات", tabStats: "الإحصائيات", tabVideos: "التوثيق والأرشيف", tabMap: "الخريطة",
        donate: "❤️ إدعمنا لنستمر", musicOn: "🎵 الصوت", musicOff: "🔇 إيقاف", visitorLabel: "عدد الزوار:",
        verse: "\"وَلَا تَحْسَبَنَّ الَّذِينَ قُتِلُوا فِي سَبِيلِ اللَّهِ أَمْوَاتًا بَلْ أَحْيَاءٌ عِنْدَ رَبِّهِمْ يُرْزَقُونَ\"",
        devText: "تطوير: عبد الهادي", shareBtn: "مشاركة المنصة", martyrsLabel: "شهيداً وثّقت أسماؤهم:",
        milestonesTitle: "تفاصيل المحطة التاريخية", readMore: "اقرأ المزيد", source: "المصدر:",
        martyrCardTitle: "بطاقة توثيق الشهيد", ageLabel: "العمر:", idLabel: "رقم الهوية:", shareCardBtn: "مشاركة بطاقة الشهيد كصورة",
        modalPhotoText: "صورة الشهيد", mapLogTitle: "سجل الخريطة التفاعلية", mapSearchPlaceholder: "ابحث في الخريطة...",
        mapEmptyText: "لا توجد سجلات مسجلة حالياً في الخريطة", mapEmptyOverlay: "الخريطة فارغة مؤقتاً",
        wbTitle: "شهداء الضفة الغربية والقدس", wbDesc: "توثيق شامل لأرواح الشهداء في مدن وقرى ومخيمات الضفة الغربية والقدس المحتلة في مواجهة اقتحامات الاحتلال واعتداءات المستوطنين.", wbStatus: "جاري تحديث السجلات والبيانات الميدانية...",
        m48Title: "شهداء أراضي 1948 (الداخل الفلسطيني)", m48Desc: "سجل الخلود والبطولة لأبناء الشعب الفلسطيني في الداخل المحتل عام 1948 الذين ارتقوا دفاعاً عن الهوية والوجود منذ النكبة وحتى اليوم.", m48Status: "يتم إعداد الأرشيف التوثيقي الخاص بشهداء الداخل الفلسطيني...",
        archiveTitle: "الأرشيف المرئي والتوثيق الميداني", archiveSub: "سجلات توثيقية مرئية وتقارير توثيقية شاملة",
        btnAll: "الكل", btnReports: "تقارير مصورة", btnTestimonies: "شهادات حية",
        tlcIntro1: "على مدى العقود الماضية، ارتقى عشرات الآلاف من الفلسطينيين شهداء على يد آلة البطش الإسرائيلية...",
        tlcIntro2: "فيما يلي نسرد لكم أهم المحطات في تاريخ القضية الفلسطينية...", tlcFooterStory: "وستبقى الحكاية...",
        statsTitle: "حرب الإبادة الجماعية في غزة", statsSubtitle: "1000 يوم من الإبادة الجماعية", statsBanner: "أكثر من 2.4 مليون إنسان يتعرضون للإبادة والتجويع", statsUrbanHeader: "لم تقتصر إعتداءات الإحتلال على البشر بل تطال مختلف مظاهر العمران والحضارة كذلك.",
        noDataText: "لا توجد بيانات حالياً",
        corridorsOn: "المجرات العائلية (نشط)",
        corridorsOff: "المجرات العائلية (معطل)",
        familyTitle: "أفراد العائلة الموثقون:",
        spotBtn: "🎯 رصد النجم"
    },
    en: {
        titleMain: "Palestinian", logoText: "Souls", searchPlaceholder: "Search martyr...",
        tabSouls: "Gaza Souls", tabJournalists: "Gaza Journalists", tabWestBank: "West Bank", tab48: "48 Martyrs",
        tabMilestones: "Milestones", tabStats: "Statistics", tabVideos: "Footage", tabMap: "Map",
        donate: "❤️ Support Us", musicOn: "🎵 Audio", musicOff: "Mute", visitorLabel: "Visitors:",
        verse: "\"Think not of those who are slain in Allah's way as dead, but living with their Lord...\"",
        devText: "Dev: Abdelhadi", shareBtn: "Share Platform", martyrsLabel: "Martyrs Documented:",
        milestonesTitle: "Historical Milestone Details", readMore: "Read More", source: "Source:",
        martyrCardTitle: "Martyr Documentation Card", ageLabel: "Age:", idLabel: "ID Number:", shareCardBtn: "Share Martyr Card as Image",
        modalPhotoText: "Martyr Photo", mapLogTitle: "Interactive Map Log", mapSearchPlaceholder: "Search map...",
        mapEmptyText: "No records currently registered on the map", mapEmptyOverlay: "Map is temporarily empty",
        wbTitle: "West Bank & Jerusalem Martyrs", wbDesc: "Comprehensive documentation of martyrs in West Bank cities, villages, and camps facing occupation raids.", wbStatus: "Updating field records and data...",
        m48Title: "1948 Lands Martyrs (Palestinian Interior)", m48Desc: "Record of immortality and heroism for Palestinians in the 1948 occupied territories.", m48Status: "Preparing documentary archive...",
        archiveTitle: "Visual Archive & Field Documentation", archiveSub: "Visual documentary records and comprehensive reports",
        btnAll: "All", btnReports: "Photo Reports", btnTestimonies: "Live Testimonies",
        tlcIntro1: "Over past decades, tens of thousands of Palestinians have been martyred by the Israeli oppression machine...",
        tlcIntro2: "Below we list the most important milestones in the history of the Palestinian cause...", tlcFooterStory: "And the story will remain...",
        statsTitle: "Gaza Genocide War", statsSubtitle: "1000 Days of Genocide", statsBanner: "Over 2.4 million people facing extermination and starvation", statsUrbanHeader: "Occupation attacks are not limited to humans but also target urban and civil aspects.",
        noDataText: "No data available currently",
        corridorsOn: "Family Galaxies (On)",
        corridorsOff: "Family Galaxies (Off)",
        familyTitle: "Documented Family Members:",
        spotBtn: "🎯 Spot Star"
    },
    fr: {
        titleMain: "Âmes", logoText: "Palestiniennes", searchPlaceholder: "Rechercher un martyr...",
        tabSouls: "Âmes de Gaza", tabJournalists: "Journalistes", tabWestBank: "Cisjordanie", tab48: "Martyrs de 48",
        tabMilestones: "Étapes clés", tabStats: "Statistiques", tabVideos: "Archives", tabMap: "Carte",
        donate: "❤️ Soutenez-nous", musicOn: "🎵 Audio", musicOff: "Muet", visitorLabel: "Visiteurs :",
        verse: "\"Ne pensez pas que ceux qui ont été tués dans le sentier d'Allah soient morts...\"",
        devText: "Développement : Abdelhadi", shareBtn: "Partager", martyrsLabel: "Martyrs documentés :",
        milestonesTitle: "Détails de l'étape historique", readMore: "Lire la suite", source: "Source :",
        martyrCardTitle: "Carte de documentation du martyr", ageLabel: "Âge :", idLabel: "N° d'identité :", shareCardBtn: "Partager la carte en image",
        modalPhotoText: "Photo du martyr", mapLogTitle: "Journal de la carte interactive", mapSearchPlaceholder: "Rechercher sur la carte...",
        mapEmptyText: "Aucun enregistrement sur la carte", mapEmptyOverlay: "Carte temporairement vide",
        wbTitle: "Martyrs de Cisjordanie et Jérusalem", wbDesc: "Documentation complète des martyrs en Cisjordanie face aux raids d'occupation.", wbStatus: "Mise à jour des dossiers...",
        m48Title: "Martyrs des territoires de 1948", m48Desc: "Registre d'immortalité et d'héroïsme des Palestiniens de 1948.", m48Status: "Préparation des archives...",
        archiveTitle: "Archives Visuelles & Documentation", archiveSub: "Dossiers documentaires visuels et rapports complets",
        btnAll: "Tous", btnReports: "Rapports photo", btnTestimonies: "Témoignages",
        tlcIntro1: "Au fil des décennies, des dizaines de milliers de Palestiniens sont tombés en martyrs...",
        tlcIntro2: "Voici les étapes clés de l'histoire de la cause palestinienne...", tlcFooterStory: "Et l'histoire continuera...",
        statsTitle: "Guerre de génocide à Gaza", statsSubtitle: "1000 jours de génocide", statsBanner: "Plus de 2,4 millions de personnes confrontées à l'extermination", statsUrbanHeader: "Les attaques de l'occupation ciblent également l'urbanisme et la civilisation.",
        noDataText: "Aucune donnée disponible",
        corridorsOn: "Galaxies Familiales (Activé)",
        corridorsOff: "Galaxies Familiales (Désactivé)",
        familyTitle: "Membres de Famille Documentés :",
        spotBtn: "🎯 Repérer l'étoile"
    },
    es: {
        titleMain: "Almas", logoText: "Palestinas", searchPlaceholder: "Buscar mártir...",
        tabSouls: "Almas de Gaza", tabJournalists: "Periodistas", tabWestBank: "Cisjordania", tab48: "Mártires del 48",
        tabMilestones: "Hitos", tabStats: "Estadísticas", tabVideos: "Archivos", tabMap: "Mapa",
        donate: "❤️ Apóyanos", musicOn: "🎵 Audio", musicOff: "Silenciar", visitorLabel: "Visitas:",
        verse: "\"No creáis que los que han muerto por la causa de Dios están muertos...\"",
        devText: "Desarrollo: Abdelhadi", shareBtn: "Compartir", martyrsLabel: "Mártires documentados:",
        milestonesTitle: "Detalles del hito histórico", readMore: "Leer más", source: "Fuente:",
        martyrCardTitle: "Tarjeta de documentación del mártir", ageLabel: "Edad:", idLabel: "Nº de identidad:", shareCardBtn: "Compartir tarjeta como imagen",
        modalPhotoText: "Foto del mártir", mapLogTitle: "Registro del mapa interactivo", mapSearchPlaceholder: "Buscar en el mapa...",
        mapEmptyText: "No hay registros en el mapa", mapEmptyOverlay: "Mapa temporalmente vacío",
        wbTitle: "Mártires de Cisjordania و Jerusalén", wbDesc: "Documentación completa de los mártires en Cisjordania y Jerusalén.", wbStatus: "Actualizando registros de campo...",
        m48Title: "Mártires de los territorios de 1948", m48Desc: "Registro de inmortalidad y heroísmo de los palestinos del 48.", m48Status: "Preparando archivo documental...",
        archiveTitle: "Archivo Visual y Documentación", archiveSub: "Registros documentales visuales e informes completos",
        btnAll: "Todos", btnReports: "Reportes fotográficos", btnTestimonies: "Testimonios",
        tlcIntro1: "Durante las últimas décadas, decenas de miles de palestinos han muerto como mártires...",
        tlcIntro2: "A continuación detallamos los hitos más importantes de la causa palestina...", tlcFooterStory: "Y la historia continuará...",
        statsTitle: "Guerra de genocidio en Gaza", statsSubtitle: "1000 días de genocidio", statsBanner: "Más de 2,4 millones de personas enfrentan el exterminio y el hambre", statsUrbanHeader: "Los ataques de la ocupación también tienen como blanco el urbanismo y la civilización.",
        noDataText: "No hay datos disponibles actualmente",
        corridorsOn: "Galaxias Familiares (Activo)",
        corridorsOff: "Galaxias Familiares (Inactivo)",
        familyTitle: "Miembros de Familia Documentados:",
        spotBtn: "🎯 Ubicar Estrella"
    }
};

function initAdaptiveTheme() {
    const savedTheme = localStorage.getItem('theme');
    let isLight = false;

    if (savedTheme) {
        isLight = (savedTheme === 'light');
    } else {
        isLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    }

    if (isLight) {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }

    if (typeof updateThemeIcon === 'function') {
        updateThemeIcon(isLight);
    }
}

function toggleCorridors() {
    corridorsActive = !corridorsActive;
    const btn = document.getElementById('corridors-toggle-btn');
    if (btn) {
        if (corridorsActive) {
            btn.classList.add('active');
            btn.style.background = '#dc2626';
            btn.style.borderColor = '#ef4444';
        } else {
            btn.classList.remove('active');
            btn.style.background = 'rgba(220, 38, 38, 0.2)';
            btn.style.borderColor = 'rgba(239, 68, 68, 0.5)';
        }
    }
    const t = translations[currentLang];
    const corridorsBtnText = document.getElementById('corridors-btn-text');
    if (corridorsBtnText) {
        corridorsBtnText.innerText = corridorsActive ? t.corridorsOn : t.corridorsOff;
    }
    if (btn) {
        btn.setAttribute('title', corridorsActive ? t.corridorsOn : t.corridorsOff);
    }
    isDirty = true;
}
window.toggleCorridors = toggleCorridors;

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('light-mode');
    const isLight = body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateThemeIcon(isLight);
    isDirty = true; // تفعيل إعادة الرسم عند تغيير الثيم
}

function updateThemeIcon(isLight) {
    const svgEl = document.getElementById('theme-icon-svg');
    if (!svgEl) return;
    if (isLight) {
        svgEl.innerHTML = `<circle cx="12" cy="12" r="5" fill="currentColor"></circle><line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2"></line><line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2"></line><line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2"></line><line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2"></line>`;
    } else {
        svgEl.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/><path d="M15 5L15.5 6.5L17 7L15.5 7.5L15 9L14.5 7.5L13 7L14.5 6.5L15 5Z" fill="white"/><path d="M19 9L19.3 9.7L20 10L19.3 10.3L19 11L18.7 10.3L18 10L18.7 9.7L19 9Z" fill="white"/>`;
    }
}

function initAudio() {
    if (!backgroundSound) {
        try {
            backgroundSound = new Howl({
                src: ['./audio/ambient.mp3', 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3'],
                loop: true,
                volume: 0.35,
                html5: true,
                onplay: () => { isPlayingAudio = true; updateMusicButton(); },
                onpause: () => { isPlayingAudio = false; updateMusicButton(); },
                onstop: () => { isPlayingAudio = false; updateMusicButton(); }
            });
        } catch(e) {
            console.log("Howler error:", e);
        }
    }
}

function startSynthAmbient() {
    if(!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if(audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    if(!isAudioSynthActive) {
        synthGain = audioCtx.createGain();
        synthGain.gain.setValueAtTime(0.08, audioCtx.currentTime);

        synthOsc1 = audioCtx.createOscillator();
        synthOsc1.type = 'sine';
        synthOsc1.frequency.setValueAtTime(110, audioCtx.currentTime);

        synthOsc2 = audioCtx.createOscillator();
        synthOsc2.type = 'triangle';
        synthOsc2.frequency.setValueAtTime(164.81, audioCtx.currentTime);

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, audioCtx.currentTime);

        synthOsc1.connect(synthGain);
        synthOsc2.connect(synthGain);
        synthGain.connect(filter);
        filter.connect(audioCtx.destination);

        synthOsc1.start();
        synthOsc2.start();
        isAudioSynthActive = true;
    }
}

function stopSynthAmbient() {
    if(synthGain && audioCtx) {
        synthGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
        setTimeout(() => {
            if(synthOsc1) { synthOsc1.stop(); synthOsc1.disconnect(); synthOsc1 = null; }
            if(synthOsc2) { synthOsc2.stop(); synthOsc2.disconnect(); synthOsc2 = null; }
            isAudioSynthActive = false;
        }, 400);
    }
}

function toggleMusic() {
    initAudio();
    if (isPlayingAudio) {
        if (backgroundSound && backgroundSound.playing()) {
            backgroundSound.pause();
        }
        stopSynthAmbient();
        isPlayingAudio = false;
        updateMusicButton();
    } else {
        isPlayingAudio = true;
        updateMusicButton();
        if (backgroundSound) {
            backgroundSound.play();
            setTimeout(() => {
                if (!backgroundSound.playing()) {
                    startSynthAmbient();
                }
            }, 600);
        } else {
            startSynthAmbient();
        }
    }
}

function updateMusicButton() {
    const btn = document.getElementById('music-btn');
    if (btn) {
        const img = document.getElementById('music-icon-img');
        if (img) {
            img.src = isPlayingAudio ? 'images/volume.png' : 'images/no-sound.png';
        }
        if (isPlayingAudio) btn.classList.add('active');
        else btn.classList.remove('active');
    }
}

const milestoneCinematicData = [
    { id: "d1920", type: "decade", decade: "1920" },
    {
        id: "m18", type: "scene", year: "1929", title: "هبّة البراق", alt: "ثورة البراق", image: "images/timeline/18.jpg",
        excerpt: "في آب/أغسطس 1929 انتفض الفلسطينيون احتجاجاً على محاولات السيطرة على حائط البراق المحاذي للمسجد الأقصى. اندلعت اشتباكات في القدس والخليل الصفد، وردّ الانتداب البريطاني بالقوة المفرطة، واستشهد أكثر من 116 فلسطينياً، وأُعدم ثلاثة من قادة الثورة لاحقاً (محمد جمجوم، فؤاد حجازي، عطا الزير) فخلّدتهم الذاكرة الوطنية.",
        stat: "حوالي 116 شهيد",
        statExp: "116 شهيداً فلسطينياً سقطوا خلال الأحداث، إضافة إلى تنفيذ حكم الإعدام بثلاثة من قادة الثورة",
        sourceName: "ويكيبيديا - ثورة البراق 1929",
        sourceUrl: "https://ar.wikipedia.org/wiki/%D8%AB%D9%88%D8%B1%D8%A9_%D8%A7%D9%84%D8%A8%D8%B1%D8%A7%D9%82"
    },
    { id: "d1930", type: "decade", decade: "1930" },
    {
        id: "m19", type: "scene", year: "1936 - 1939", title: "الثورة الفلسطينية الكبرى", alt: "ثورة الست أشهر", image: "images/timeline/19.jpg",
        excerpt: "انطلقت الثورة الفلسطينية الكبرى في نيسان/أبريل 1936 بإضراب عام شامل امتد ستة أشهر، ثم تحولت إلى مقاومة مسلحة استمرت حتى 1939. استهدفت الانتداب البريطاني والمشروع الصهيوني، وقمعتها بريطانيا بعنف عبر قانون الطوارئ ونسف القرى والإعدامات.",
        stat: "5,000 شهيد",
        statExp: "آلاف الشهداء والجرحى نتيجة العمليات العسكرية وقمع الاحتلال البريطاني للثورة",
        sourceName: "الموسوعة التفاعلية للقضية الفلسطينية",
        sourceUrl: "https://www.palquest.org/"
    },
    {
        id: "m1", type: "scene", year: "1936 - 1948", title: "مرحلة التطهير العرقي في فلسطين", alt: "النكبة", image: "images/timeline/1.jpg",
        excerpt: "بدأت المجازر الاسرائيلية بحق الفلسطينيين قبل الاعلان عن قيام دولة اسرائيل بنحو 11 عاما منذ كانت فلسطين تحت وصاية الانتداب البريطاني الذي كان يتحمل مسؤولية حماية حياة المواطنين الفلسطينيين.",
        stat: "حوالي 5000 شهيد",
        statExp: "ضحايا المجازر وعمليات التطهير العرقي المبكرة قبل عام 1948",
        sourceName: "مؤسسة الدراسات الفلسطينية",
        sourceUrl: "https://www.palquest.org/"
    },
    { id: "d1940", type: "decade", decade: "1940" },
    {
        id: "m20", type: "scene", year: "1948", title: "مجزرة دير ياسين", alt: "", image: "images/timeline/20.jpg",
        excerpt: "في فجر التاسع من نيسان 1948، اقتحمت عصابتا الإرغون وشتيرن قرية دير ياسين غرب القدس وارتكبتا مجزرة وحشية بحق سكانها، شملت إعدامات ميدانية وتمثيلاً بالجثث وتهجيراً.",
        stat: "254 - 300 شهيد",
        statExp: "أكثر من 250 شهيداً من الأطفال والنساء والرجال عزل الأسلحة",
        sourceName: "ويكيبيديا - مجزرة دير ياسين",
        sourceUrl: "https://ar.wikipedia.org"
    },
    {
        id: "m2", type: "scene", year: "1948", title: "الحرب العربية الإسرائيلية 1948", alt: "حرب النكبة", image: "images/timeline/2.jpg",
        excerpt: "أول حروب العرب مع إسرائيل، دارت عقب إنهاء الانتداب البريطاني على فلسطين وإعلان قيام إسرائيل، منتصف مايو/أيار 1948، وارتقى خلالها آلاف الشهداء.",
        stat: "20 - 22 ألف شهيد",
        statExp: "شهداء المعارك والدفاع عن المدن والقرى الفلسطينية أثناء النكبة",
        sourceName: "الموسوعة التفاعلية للقضية الفلسطينية",
        sourceUrl: "https://www.palquest.org/"
    },
    { id: "d1950", type: "decade", decade: "1950" },
    {
        id: "m4", type: "scene", year: "1956", title: "احتلال غزة 1956", alt: "العدوان الثلاثي", image: "images/timeline/4.jpg",
        excerpt: "خلال العدوان الثلاثيّ على مصر بعد تأميم قناة السويس، احتلّ جيش الاحتلال قطاع غزّة قادماً من رفح، حيث ارتقى مئات الشهداء في مجازر بشعة.",
        stat: "حوالي 1500 شهيد",
        statExp: "شهداء المجازر في خان يونس ورفح وغزة خلال العدوان",
        sourceName: "أرشيف تاريخ فلسطين - العدوان الثلاثي",
        sourceUrl: "https://ar.wikipedia.org"
    },
    { id: "d1960", type: "decade", decade: "1960" },
    {
        id: "m5", type: "scene", year: "1967", title: "حرب حزيران 1967", alt: "النكسة", image: "images/timeline/5.jpg",
        excerpt: "يطلق مصطلح النكسة على الهزيمة التي منيت بها الجيوش العربية أمام إسرائيل واحتلال كامل فلسطين وأراضٍ سورية ومصرية.",
        stat: "15,000 - 25,000 شهيد",
        statExp: "شهداء العمليات العسكرية والدفاع عن الأراضي العربية والفلسطينية",
        sourceName: "الموسوعة التفاعلية للقضية الفلسطينية",
        sourceUrl: "https://www.palquest.org/"
    },
    { id: "d1970", type: "decade", decade: "1970" },
    {
        id: "m22", type: "scene", year: "1976", title: "يوم الأرض", alt: "", image: "images/timeline/22.jpg",
        excerpt: "هبة جماهيرية فلسطينية شاملة رداً على مصادرة سلطات الاحتلال لآلاف الدونمات من أراضي الجليل والمثلث.",
        stat: "6 شهداء",
        statExp: "ستة شهداء سقطوا دفاعاً عن الأرض في أراضي الداخل المحتل عام 1948",
        sourceName: "تقارير توثيقية فلسطينية",
        sourceUrl: "https://ar.wikipedia.org"
    },
    { id: "d1980", type: "decade", decade: "1980" },
    {
        id: "m11", type: "scene", year: "1987", title: "الانتفاضة الفلسطينية الأولى", alt: "انتفاضة الحجارة", image: "images/timeline/11.jpg",
        excerpt: "هبة شعبية كبرى انطلقت من مخيم جباليا في قطاع غزة وامتدت لكافة المدن والقرى الفلسطينية.",
        stat: "أكثر من 1300 شهيد",
        statExp: "شهداء رصاص الاحتلال والمواجهات الشعبية والحجارة خلال الانتفاضة الأولى",
        sourceName: "مركز المعلومات الوطني الفلسطيني (وفا)",
        sourceUrl: "https://www.wafa.ps/"
    },
    { id: "d1990", type: "decade", decade: "1990" },
    {
        id: "m25", type: "scene", year: "1994", title: "مجزرة الحرم الإبراهيمي", alt: "", image: "images/timeline/25.jpg",
        excerpt: "إطلاق نار متطرف داخل الحرم الإبراهيمي الشريف في مدينة الخليل أثناء صلاة الفجر.",
        stat: "29 شهيداً",
        statExp: "29 شهيداً ارتقوا داخل المسجد أثناء صلاة الفجر",
        sourceName: "ويكيبيديا والموسوعة التفاعلية",
        sourceUrl: "https://ar.wikipedia.org"
    },
    { id: "d2000", type: "decade", decade: "2000" },
    {
        id: "m12", type: "scene", year: "2000", title: "الانتفاضة الفلسطينية الثانية", alt: "انتفاضة الأقصى", image: "images/timeline/12.jpg",
        excerpt: "اندلعت عقب اقتحام أرييل شارون للمسجد الأقصى، وشهدت مواجهات مسلحة واجتياحات واسعة لمدن الضفة وغزة.",
        stat: "آلاف الشهداء",
        statExp: "أكثر من 4000 شهيد وثقتهم السجلات الرسمية خلال انتفاضة الأقصى",
        sourceName: "مركز المعلومات الوطني الفلسطيني (وفا)",
        sourceUrl: "https://www.wafa.ps/"
    },
    { id: "d2010", type: "decade", decade: "2010" },
    {
        id: "m15", type: "scene", year: "2014", title: "الجرف الصامد", alt: "حرب غزة 2014", image: "images/timeline/15.jpg",
        excerpt: "حرب مدمرة استمرت 51 يوماً ضد قطاع غزة، وشهدت مجازر مروعة بحق العائلات وتدميراً واسعاً.",
        stat: "2,200+ شهيد",
        statExp: "أكثر من 2200 شهيد بينهم مئات الأطفال والنساء وعائلات بأكملها مسحت من السجل المدني",
        sourceName: "الجهاز المركزي للإحصاء الفلسطيني",
        sourceUrl: "https://www.pcbs.gov.ps/"
    },
    { id: "d2020", type: "decade", decade: "2020" },
    {
        id: "m30", type: "scene", year: "2023 - 2026", title: "طوفان الأقصى والعدوان الشامل", alt: "حرب الإبادة", image: "images/timeline/30.jpg",
        excerpt: "الملحمة التاريخية الكبرى وطوفان الأقصى وما تلاه من حرب إبادة جماعية وعدوان غير مسبوق على قطاع غزة والضفة والمنطقة.",
        stat: "عشرات الآلاف من الشهداء",
        statExp: "أكثر من 158,000 إلى 291,000 شهيد ومفقود وجريح ومستشهد تحت الأنقاض وفي حرب الإبادة الجماعية المستمرة",
        sourceName: "الجهاز المركزي للإحصاء الفلسطيني وتقارير الأمم المتحدة",
        sourceUrl: "https://www.pcbs.gov.ps/"
    }
];

// ----------------------------------------------------
// Custom Globe Language Dropdown Logic (Matching Capture.PNG & Capture1.PNG)
// ----------------------------------------------------
window.toggleLanguageDropdown = function(e) {
    if (e) e.stopPropagation();
    if (window.i18n && typeof window.i18n.renderLanguageModal === 'function') {
        window.i18n.renderLanguageModal();
    } else {
        const menu = document.getElementById('language-dropdown-menu');
        if (menu) menu.classList.toggle('hidden');
    }
};

window.closeLanguageDropdown = function() {
    if (window.i18n && typeof window.i18n.closeLanguageModal === 'function') {
        window.i18n.closeLanguageModal();
    }
    const menu = document.getElementById('language-dropdown-menu');
    if (menu) menu.classList.add('hidden');
};

document.addEventListener('click', () => {
    window.closeLanguageDropdown();
});

function changeLanguage(langCode) {
    if (window.i18n && typeof window.i18n.setLanguage === 'function') {
        window.i18n.setLanguage(langCode);
        currentLang = langCode;
        localStorage.setItem('site_lang', langCode);
        const htmlRoot = document.getElementById('html-root');
        if (htmlRoot) {
            htmlRoot.lang = currentLang;
            htmlRoot.dir = (['ar', 'ur', 'fa'].includes(currentLang)) ? 'rtl' : 'ltr';
        }
        document.querySelectorAll('.active-check-lang').forEach(el => el.classList.add('hidden'));
        const checkEl = document.getElementById('check-' + currentLang);
        if (checkEl) checkEl.classList.remove('hidden');
        return;
    }
    if (!translations[langCode]) langCode = 'ar';
    currentLang = langCode;
    localStorage.setItem('site_lang', langCode);
    const t = translations[currentLang] || translations['ar'];

    const htmlRoot = document.getElementById('html-root');
    if (htmlRoot) {
        htmlRoot.lang = currentLang;
        htmlRoot.dir = (['ar', 'ur', 'fa'].includes(currentLang)) ? 'rtl' : 'ltr';
    }

    // Update custom dropdown checkmarks (matching checkmark style in Capture1.PNG)
    document.querySelectorAll('.active-check-lang').forEach(el => {
        el.classList.add('hidden');
    });
    const checkEl = document.getElementById(`check-${langCode}`);
    if (checkEl) {
        checkEl.classList.remove('hidden');
    }

    const setInnerText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };
    const setPlaceholder = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.placeholder = text;
    };

    setInnerText('title-main', t.titleMain);
    setInnerText('logo-text', t.logoText);
    setPlaceholder('search-input', t.searchPlaceholder);
    setInnerText('tab-souls', t.tabSouls);
    setInnerText('tab-journalists', t.tabJournalists);
    setInnerText('tab-westbank', t.tabWestBank);
    setInnerText('tab-48', t.tab48);
    setInnerText('tab-milestones', t.tabMilestones);
    setInnerText('tab-stats', t.tabStats);
    setInnerText('tab-videos', t.tabVideos);
    setInnerText('tab-map', t.tabMap);
    setInnerText('donate-desktop', t.donate);
    const verseTextEl = document.getElementById('verse-text');
    if (verseTextEl) {
        if (langCode === 'ar') {
            verseTextEl.innerText = '';
            verseTextEl.classList.add('hidden');
        } else {
            verseTextEl.innerText = t.verse;
            verseTextEl.classList.remove('hidden');
        }
    }
    setInnerText('dev-text', t.devText);
    setInnerText('share-btn-text', t.shareBtn);
    setInnerText('martyrs-label', t.martyrsLabel);

    const corridorsBtnText = document.getElementById('corridors-btn-text');
    if (corridorsBtnText) {
        corridorsBtnText.innerText = (typeof corridorsActive !== 'undefined' && corridorsActive) ? t.corridorsOn : t.corridorsOff;
    }

    const modalMilestoneTitle = document.getElementById('modal-milestone-title-text');
    if(modalMilestoneTitle) modalMilestoneTitle.innerText = t.milestonesTitle;
    const modalMartyrTitle = document.getElementById('modal-martyr-title-text');
    if(modalMartyrTitle) modalMartyrTitle.innerText = t.martyrCardTitle;
    const modalPhotoText = document.getElementById('modal-photo-text');
    if(modalPhotoText) modalPhotoText.innerText = t.modalPhotoText;
    const modalAgeLabel = document.getElementById('modal-age-label');
    if(modalAgeLabel) modalAgeLabel.innerText = t.ageLabel;
    const modalIdLabel = document.getElementById('modal-id-label');
    if(modalIdLabel) modalIdLabel.innerText = t.idLabel;
    const shareBtnModal = document.getElementById('share-btn-modal');
    if(shareBtnModal) shareBtnModal.innerText = t.shareCardBtn;
    const mapLogTitle = document.getElementById('map-log-title');
    if(mapLogTitle) mapLogTitle.innerText = t.mapLogTitle;
    const mapSearchInput = document.getElementById('map-search-input');
    if(mapSearchInput) mapSearchInput.placeholder = t.mapSearchPlaceholder;
    const mapEmptyText = document.getElementById('map-empty-text');
    if(mapEmptyText) mapEmptyText.innerText = t.mapEmptyText;
    const mapEmptyOverlay = document.getElementById('map-empty-overlay');
    if(mapEmptyOverlay) mapEmptyOverlay.innerText = t.mapEmptyOverlay;
    const wbTitle = document.getElementById('wb-title');
    if(wbTitle) wbTitle.innerText = t.wbTitle;
    const wbDesc = document.getElementById('wb-desc');
    if(wbDesc) wbDesc.innerText = t.wbDesc;
    const wbStatus = document.getElementById('wb-status');
    if(wbStatus) wbStatus.innerText = t.wbStatus;
    const m48Title = document.getElementById('m48-title');
    if(m48Title) m48Title.innerText = t.m48Title;
    const m48Desc = document.getElementById('m48-desc');
    if(m48Desc) m48Desc.innerText = t.m48Desc;
    const m48Status = document.getElementById('m48-status');
    if(m48Status) m48Status.innerText = t.m48Status;
    const archiveTitle = document.getElementById('archive-title');
    if(archiveTitle) archiveTitle.innerText = t.archiveTitle;
    const archiveSub = document.getElementById('archive-sub');
    if(archiveSub) archiveSub.innerText = t.archiveSub;
    const btnAll = document.getElementById('btn-all');
    if(btnAll) btnAll.innerText = t.btnAll;
    const btnReports = document.getElementById('btn-reports');
    if(btnReports) btnReports.innerText = t.btnReports;
    const btnTestimonies = document.getElementById('btn-testimonies');
    if(btnTestimonies) btnTestimonies.innerText = t.btnTestimonies;
    const tlcIntro1 = document.getElementById('tlc-intro-1');
    if(tlcIntro1) tlcIntro1.innerText = t.tlcIntro1;
    const tlcIntro2 = document.getElementById('tlc-intro-2');
    if(tlcIntro2) tlcIntro2.innerText = t.tlcIntro2;
    const tlcFooterStory = document.getElementById('tlc-footer-story');
    if(tlcFooterStory) tlcFooterStory.innerText = t.tlcFooterStory;
    const statsTitle = document.getElementById('stats-title');
    if(statsTitle) statsTitle.innerText = t.statsTitle;
    const statsSubtitle = document.getElementById('stats-subtitle');
    if(statsSubtitle) statsSubtitle.innerText = t.statsSubtitle;
    const statsBanner = document.getElementById('stats-banner');
    if(statsBanner) statsBanner.innerText = t.statsBanner;
    const statsUrbanHeader = document.getElementById('stats-urban-header');
    if(statsUrbanHeader) statsUrbanHeader.innerText = t.statsUrbanHeader;
    const noDataText = document.getElementById('no-data-text');
    if(noDataText) noDataText.innerText = t.noDataText;

    updateMusicButton();
    isDirty = true;
}

window.shareSite = function(){
    navigator.clipboard.writeText(window.location.href).then(() => alert('تم نسخ رابط المنصة بنجاح!'));
};

window.shareMartyrCard = function(){
    if(!currentMartyrObj) return;
    const btn = document.getElementById('share-btn-modal');
    const originalText = btn.innerText;
    btn.innerText = "جاري تحضير الصورة...";
    btn.disabled = true;

    const person = currentMartyrObj;
    document.getElementById('capture-name').innerText = person.name_ar || person.name || 'شهيد مجهول';
    document.getElementById('capture-name-en').innerText = person.name_en || person.english_name || '';
    document.getElementById('capture-age').innerText = person.age || 'غير معروف';
    document.getElementById('capture-id').innerText = person.id || '-';

    const imgContainer = document.getElementById('capture-img-container');
    if (person.image) {
        imgContainer.innerHTML = `<img src="${person.image}" style="width:100%; height:100%; object-fit:cover;" crossorigin="anonymous">`;
    } else {
        imgContainer.innerHTML = `<span style="color:#666; font-size: 1.2rem;">صورة الشهيد</span>`;
    }

    const cardElement = document.getElementById('shareable-card');

    html2canvas(cardElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0a0a0a'
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `توثيق_الشهيد_${(person.name_ar || 'مجهول').replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        btn.innerText = originalText;
        btn.disabled = false;
    }).catch(err => {
        console.error("Error generating card image:", err);
        alert("حدث خطأ أثناء التقاط الصورة. يرجى المحاولة مرة أخرى.");
        btn.innerText = originalText;
        btn.disabled = false;
    });
};

function openMilestoneModal(item) {
    currentMilestoneObj = item;
    // Reset Speech state on modal open
    if (isMilestoneSpeaking) {
        window.speechSynthesis.cancel();
        isMilestoneSpeaking = false;
    }
    const ttsBtnText = document.getElementById('milestone-tts-btn-text');
    if (ttsBtnText) {
        ttsBtnText.innerText = currentLang === 'ar' ? 'استماع للحدث التاريخي' : 'Listen Event';
    }

    const modal = document.getElementById('milestone-modal-overlay');
    const container = document.getElementById('milestone-modal-body-container');
    if(!modal || !container) return;
    const t = translations[currentLang];

    container.innerHTML = `
        <div class="tlc-modal-content">
            <h2 class="tlc-modal-title">${item.title} ${item.alt ? `<span class="tlc-mdl-alt">(${item.alt})</span>` : ''}</h2>
            <div class="tlc-modal-meta"><time>${item.year}</time></div>
            <img class="tlc-modal-img" src="${item.image}" alt="" onerror="this.style.display='none'">
            <div class="tlc-modal-desc">${item.excerpt}</div>
            <div class="tlc-modal-stat">
                <span class="tlc-mdl-stat-label">عدد الشهداء:</span>
                <span class="tlc-mdl-stat-num">${item.stat}</span>
                <p class="tlc-mdl-stat-exp">${item.statExp || item.excerpt}</p>
            </div>
            <div class="tlc-modal-source">
                <span>${t.source}</span>
                <a href="${item.sourceUrl || 'https://www.palquest.org/'}" target="_blank" rel="noopener">${item.sourceName || 'الموسوعة التفاعلية للقضية الفلسطينية'}</a>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
    if (typeof translateMilestoneModal === 'function') {
        translateMilestoneModal(currentLang);
    }
}

function renderCinematicTimeline() {
    const scenesContainer = document.getElementById('tlc-scenes-container');
    if(!scenesContainer) return;
    scenesContainer.innerHTML = '';

    let currentDecadeSection = null;
    let currentCardsGrid = null;

    milestoneCinematicData.forEach(item => {
        if (item.type === 'decade') {
            currentDecadeSection = document.createElement('div');
            currentDecadeSection.className = 'tlc-decade-group';
            currentDecadeSection.id = item.id;

            const decadeHeader = document.createElement('div');
            decadeHeader.className = 'tlc-decade';
            decadeHeader.innerHTML = `
                <h2 class="tlc-decade-num">${item.decade}<span>s</span></h2>
                <div class="tlc-decade-divider"></div>
                <div class="tlc-decade-cards" id="cards-${item.decade}"></div>
            `;
            currentDecadeSection.appendChild(decadeHeader);
            currentCardsGrid = decadeHeader.querySelector('.tlc-decade-cards');
            scenesContainer.appendChild(currentDecadeSection);
        } else if (item.type === 'scene') {
            if (currentCardsGrid) {
                const cardA = document.createElement('a');
                cardA.className = 'tlc-decade-card';
                cardA.href = `#${item.id}`;
                cardA.onclick = (e) => {
                    e.preventDefault();
                    const target = document.getElementById(item.id);
                    if(target) target.scrollIntoView({behavior: 'smooth'});
                };
                cardA.innerHTML = `
                    <div class="tlc-decade-card-img"><img src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.style.display='none'"></div>
                    <div class="tlc-decade-card-body">
                        <span class="tlc-decade-card-year">${item.year}</span>
                        <span class="tlc-decade-card-title">${item.title}</span>
                    </div>
                `;
                currentCardsGrid.appendChild(cardA);
            }

            const sceneEl = document.createElement('section');
            sceneEl.className = 'tlc-scene';
            sceneEl.id = item.id;
            sceneEl.innerHTML = `
                <div class="tlc-bg" aria-hidden="true">
                    <img src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.style.display='none'">
                    <div class="tlc-bg-tint"></div>
                </div>
                <article class="tlc-panel">
                    <time class="tlc-date">${item.year}</time>
                    <h2 class="tlc-title">${item.title}</h2>
                    ${item.alt ? `<p class="tlc-alt">${item.alt}</p>` : ''}
                    <p class="tlc-excerpt">${item.excerpt}</p>
                    <div class="tlc-foot">
                        <div class="tlc-stat">
                            <span class="tlc-stat-num">${item.stat}</span>
                            <span class="tlc-stat-label">عدد الشهداء والضحايا:</span>
                        </div>
                        <div class="flex gap-1.5 items-center">
                            <button type="button" class="tlc-more"><span>اقرأ المزيد</span><span aria-hidden="true">→</span></button>
                            <button type="button" onclick="timelineShowOnMap('${item.title.replace(/'/g, "\\'")}')" class="btn-main text-[10px] px-2.5 py-1 bg-red-600/20 border border-red-500/40 text-red-400 rounded-full flex items-center gap-1">🗺️ الخريطة</button>
                        </div>
                    </div>
                </article>
            `;
            sceneEl.querySelector('.tlc-more').onclick = () => openMilestoneModal(item);
            if (currentDecadeSection) currentDecadeSection.appendChild(sceneEl);
            else scenesContainer.appendChild(sceneEl);
        }
    });

    // Initialize Scrollytelling IntersectionObserver
    setTimeout(initScrollytellingObserver, 100);
}

// ----------------------------------------------------
// Category 2 JS: Immersive Scrollytelling Map Connection
// ----------------------------------------------------
const milestoneCoords = {
    "هبّة البراق": { lat: 31.7767, lng: 35.2345, zoom: 14, name: "حائط البراق - القدس الشريف" },
    "الثورة الفلسطينية الكبرى": { lat: 31.9038, lng: 35.2034, zoom: 11, name: "فلسطين المحتلة" },
    "مرحلة التطهير العرقي في فلسطين": { lat: 31.5, lng: 34.4667, zoom: 10, name: "فلسطين التاريخية" },
    "مجزرة دير ياسين": { lat: 31.7864, lng: 35.1764, zoom: 15, name: "قرية دير ياسين المهجرة" },
    "مجزرة الطنطورة": { lat: 32.6139, lng: 34.9228, zoom: 14, name: "الطنطورة المهجرة" },
    "مجزرة قبية": { lat: 31.9867, lng: 34.9917, zoom: 14, name: "قرية قبية المهجرة" },
    "مجزرة كفر قاسم": { lat: 32.115, lng: 34.9753, zoom: 14, name: "كفر قاسم" },
    "عدوان 1956 ومجزرة خان يونس": { lat: 31.3458, lng: 34.3025, zoom: 13, name: "خان يونس - قطاع غزة" },
    "نكسة حزيران 1967": { lat: 31.7767, lng: 35.2345, zoom: 10, name: "الضفة الغربية وقطاع غزة" },
    "يوم الأرض الخالد 1976": { lat: 32.8647, lng: 35.2806, zoom: 12, name: "سخنين وعرابة ودير حنا" },
    "مجزرة صبرا وشاتيلا 1982": { lat: 33.8644, lng: 35.4967, zoom: 14, name: "مخيم صبرا وشاتيلا" },
    "الانتفاضة الأولى (انتفاضة الحجارة) 1987": { lat: 31.5017, lng: 34.4581, zoom: 11, name: "جباليا وقطاع غزة والضفة" },
    "مجزرة الحرم الإبراهيمي 1994": { lat: 31.5244, lng: 35.1081, zoom: 15, name: "الحرم الإبراهيمي - الخليل" },
    "الانتفاضة الثانية (انتفاضة الأقصى) 2000": { lat: 31.7761, lng: 35.2358, zoom: 14, name: "المسجد الأقصى - القدس الشريف" },
    "مجزرة جنين 2002": { lat: 32.4614, lng: 35.2936, zoom: 14, name: "مخيم جنين" },
    "حروب وغارات غزة المتكررة (2008 - 2021)": { lat: 31.45, lng: 34.4, zoom: 11, name: "قطاع غزة" },
    "طوفان الأقصى والعدوان الشامل": { lat: 31.42, lng: 34.38, zoom: 11, name: "غزة الصامدة" }
};

function timelineShowOnMap(milestoneTitle) {
    const coords = milestoneCoords[milestoneTitle];
    if (!coords) return;

    switchMainMode('map');
    initMapIfNeeded();

    setTimeout(() => {
        if (map) {
            map.setView([coords.lat, coords.lng], coords.zoom);
            L.popup()
                .setLatLng([coords.lat, coords.lng])
                .setContent(`<div class="font-['Cairo'] text-right text-xs p-1">
                    <strong class="text-red-500">${milestoneTitle}</strong><br>
                    <span>الموقع: ${coords.name}</span>
                </div>`)
                .openOn(map);
        }
    }, 300);
}

function initScrollytellingObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');

                const titleEl = entry.target.querySelector('.tlc-title');
                if (titleEl) {
                    const title = titleEl.innerText.trim();
                    const coords = milestoneCoords[title];
                    if (coords && map) {
                        map.panTo([coords.lat, coords.lng]);
                    }
                }
            } else {
                entry.target.classList.remove('active');
            }
        });
    }, {
        threshold: 0.25,
        rootMargin: "-10% 0px -20% 0px"
    });

    document.querySelectorAll('.tlc-scene').forEach(scene => {
        observer.observe(scene);
    });
}

// ----------------------------------------------------
// Category 3 JS: Voice Search (Web Speech API)
// ----------------------------------------------------
function startVoiceSearch(inputId, callback) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert(currentLang === 'ar' ? 'البحث الصوتي غير مدعوم في متصفحك. يرجى استخدام متصفح Chrome أو Safari.' : 'Voice Search is not supported in your browser. Please use Chrome or Safari.');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = currentLang === 'ar' ? 'ar-SA' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let micBtn = null;
    if (inputId === 'search-input') {
        micBtn = document.getElementById('voice-search-btn');
    } else {
        micBtn = document.getElementById('map-voice-btn');
    }

    if (micBtn) {
        micBtn.classList.add('bg-red-600', 'animate-pulse');
        micBtn.innerText = '🔴';
    }

    recognition.onstart = () => {
        console.log("Voice recognition started...");
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("Voice input transcribed:", transcript);
        const inputEl = document.getElementById(inputId);
        if (inputEl) {
            inputEl.value = transcript;
            if (callback) callback(transcript);
        }
    };

    recognition.onerror = (err) => {
        console.error("Speech recognition error:", err);
    };

    recognition.onend = () => {
        if (micBtn) {
            micBtn.classList.remove('bg-red-600', 'animate-pulse');
            micBtn.innerText = '🎤';
        }
    };

    recognition.start();
}

// ----------------------------------------------------
// Category 3 JS: Text-To-Speech (Speech Synthesis)
// ----------------------------------------------------
let isMartyrSpeaking = false;
let isMilestoneSpeaking = false;
let currentMilestoneObj = null;

function playMartyrTTS() {
    if (!currentMartyrObj) return;

    if (isMartyrSpeaking) {
        window.speechSynthesis.cancel();
        isMartyrSpeaking = false;
        document.getElementById('tts-btn-text').innerText = currentLang === 'ar' ? 'استماع للسيرة' : 'Listen Biography';
        return;
    }

    window.speechSynthesis.cancel();
    isMilestoneSpeaking = false;

    const bioText = currentMartyrObj.notes || (currentLang === 'ar' ? 'شهيد من أبناء فلسطين الأوفياء' : 'A martyr of the loyal sons of Palestine');

    const utterance = new SpeechSynthesisUtterance(bioText);
    utterance.lang = currentLang === 'ar' ? 'ar-SA' : 'en-US';

    utterance.onstart = () => {
        isMartyrSpeaking = true;
        document.getElementById('tts-btn-text').innerText = currentLang === 'ar' ? 'إيقاف الصوت' : 'Stop Listening';
    };

    utterance.onend = () => {
        isMartyrSpeaking = false;
        document.getElementById('tts-btn-text').innerText = currentLang === 'ar' ? 'استماع للسيرة' : 'Listen Biography';
    };

    utterance.onerror = () => {
        isMartyrSpeaking = false;
        document.getElementById('tts-btn-text').innerText = currentLang === 'ar' ? 'استماع للسيرة' : 'Listen Biography';
    };

    window.speechSynthesis.speak(utterance);
}

function playMilestoneTTS() {
    if (!currentMilestoneObj) return;

    if (isMilestoneSpeaking) {
        window.speechSynthesis.cancel();
        isMilestoneSpeaking = false;
        document.getElementById('milestone-tts-btn-text').innerText = currentLang === 'ar' ? 'استماع للحدث التاريخي' : 'Listen Event';
        return;
    }

    window.speechSynthesis.cancel();
    isMartyrSpeaking = false;

    const text = currentMilestoneObj.excerpt || '';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLang === 'ar' ? 'ar-SA' : 'en-US';

    utterance.onstart = () => {
        isMilestoneSpeaking = true;
        document.getElementById('milestone-tts-btn-text').innerText = currentLang === 'ar' ? 'إيقاف الصوت' : 'Stop Listening';
    };

    utterance.onend = () => {
        isMilestoneSpeaking = false;
        document.getElementById('milestone-tts-btn-text').innerText = currentLang === 'ar' ? 'استماع للحدث التاريخي' : 'Listen Event';
    };

    utterance.onerror = () => {
        isMilestoneSpeaking = false;
        document.getElementById('milestone-tts-btn-text').innerText = currentLang === 'ar' ? 'استماع للحدث التاريخي' : 'Listen Event';
    };

    window.speechSynthesis.speak(utterance);
}

// ----------------------------------------------------
// Category 4 JS: Solidarity Card Generator
// ----------------------------------------------------
function updateCertificatePreview() {
    const name = document.getElementById('cert-name').value.trim() || 'متضامن مع فلسطين';
    const slogan = document.getElementById('cs-slogan').value.trim() || '';

    document.getElementById('preview-cert-name').innerText = name;
    document.getElementById('preview-cs-slogan').innerText = slogan;
}

function updateCertificateTheme(theme) {
    const keffiyehBg = document.getElementById('cert-bg-keffiyeh');
    const flagBg = document.getElementById('cert-bg-flag');
    const oliveBg = document.getElementById('cert-bg-olive');

    keffiyehBg.classList.add('hidden');
    flagBg.classList.add('hidden');
    oliveBg.classList.add('hidden');

    if (theme === 'keffiyeh') {
        keffiyehBg.classList.remove('hidden');
    } else if (theme === 'flag') {
        flagBg.classList.remove('hidden');
    } else if (theme === 'olive') {
        oliveBg.classList.remove('hidden');
    }
}

function downloadCertificate() {
    const element = document.getElementById('certificate-preview');
    if (!element) return;

    html2canvas(element, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'Palestinian_Souls_Solidarity_Card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

function initMapIfNeeded() {
    if (!map) {
        map = L.map('map', { minZoom: 7 }).setView([31.95, 35.15], 8);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);
        markersLayer = L.layerGroup().addTo(map);
    }
}

function loadMapData() {
    $.getJSON('./data/villages.geojson')
        .done(geoData => {
            if (geoData && geoData.features) {
                nakbaVillages = geoData.features.map(f => ({
                    id: f.properties.id,
                    name: f.properties.name,
                    year: f.properties.year || 1948,
                    fate: f.properties.fate || 'Depopulated',
                    eventId: f.properties.eventId,
                    lat: f.geometry.coordinates[1],
                    lng: f.geometry.coordinates[0]
                }));
            }
            renderMapAndList();
        })
        .fail(err => {
            console.log("Failed to load Nakba villages GeoJSON, using robust fallback:", err);
            nakbaVillages = [
                { id: "deir-yassin", name: "Deir Yassin", year: 1948, fate: "Massacre", lat: 31.7868, lng: 35.1784 },
                { id: "tantura", name: "Tantura", year: 1948, fate: "Massacre", lat: 32.61, lng: 34.93 },
                { id: "al-majdal", name: "Al-Majdal", year: 1948, fate: "Depopulated", lat: 31.6676, lng: 34.5657 },
                { id: "lifta", name: "Lifta", year: 1948, fate: "Depopulated", lat: 31.7916, lng: 35.1958 },
                { id: "ein-karem", name: "Ein Karem", year: 1948, fate: "Depopulated", lat: 31.7614, lng: 35.1654 },
                { id: "saffuriyya", name: "Saffuriyya", year: 1948, fate: "Depopulated", lat: 32.7469, lng: 35.2788 },
                { id: "beersheba", name: "Beersheba", year: 1948, fate: "Depopulated", lat: 31.2525, lng: 34.7915 }
            ];
            renderMapAndList();
        });
}

function renderMapAndList() {
    initMapIfNeeded();

    if (markersLayer) markersLayer.clearLayers();
    mapMarkers = [];

    const listContainer = document.getElementById('map-data-list');
    const query = document.getElementById('map-search-input') ? document.getElementById('map-search-input').value.trim().toLowerCase() : '';
    const t = translations[currentLang];

    const filtered = nakbaVillages.filter(v => {
        const name = (v.name || '').toLowerCase();
        const fate = (v.fate || '').toLowerCase();
        return name.includes(query) || fate.includes(query);
    });

    if (!listContainer) return;

    if (filtered.length === 0) {
        listContainer.innerHTML = `<div class="text-center text-gray-500 py-20 text-xs">${t.mapEmptyText || 'لا توجد نتائج مطابقة'}</div>`;
        const overlay = document.getElementById('map-empty-overlay');
        if (overlay) overlay.style.display = 'block';
        return;
    }

    const overlay = document.getElementById('map-empty-overlay');
    if (overlay) overlay.style.display = 'none';

    let html = '';
    filtered.forEach((v, index) => {
        if (markersLayer) {
            let marker = L.circleMarker([v.lat, v.lng], {
                radius: 7,
                fillColor: '#dc2626',
                color: '#ffffff',
                weight: 1.5,
                opacity: 1,
                fillOpacity: 0.85
            });

            const fateAr = v.fate === 'Massacre' ? 'مجزرة وحشية' : 'قرية مهجرة بالكامل';
            const fateLabelPop = currentLang === 'ar' ? fateAr :
                                 currentLang === 'en' ? (v.fate === 'Massacre' ? 'Brutal Massacre' : 'Completely Depopulated') :
                                 currentLang === 'fr' ? (v.fate === 'Massacre' ? 'Massacre Brutal' : 'Complètement Dépeuplé') :
                                                        (v.fate === 'Massacre' ? 'Masacre Brutal' : 'Completamente Despoblado');

            const yearLabelPop = currentLang === 'ar' ? 'سنة التهجير' :
                                 currentLang === 'en' ? 'Displacement Year' :
                                 currentLang === 'fr' ? 'Année d\'expulsion' : 'Año de expulsión';

            const fateHeaderPop = currentLang === 'ar' ? 'المصير والوضع الحالي' :
                                  currentLang === 'en' ? 'Fate & Current Status' :
                                  currentLang === 'fr' ? 'Destin et statut actuel' : 'Destino y estado actual';

            const popupContent = `
                <div class="p-2.5 text-right font-['Cairo'] text-xs text-white bg-neutral-900/95 border border-red-600/30 rounded-lg max-w-[200px]">
                    <h4 class="font-bold text-red-400 text-sm mb-1">🇵🇸 ${v.name}</h4>
                    <p class="text-gray-300 mb-1"><strong>${yearLabelPop}:</strong> ${v.year}</p>
                    <p class="text-gray-300"><strong>${fateHeaderPop}:</strong> ${fateLabelPop}</p>
                </div>
            `;
            marker.bindPopup(popupContent);
            marker.addTo(markersLayer);

            mapMarkers.push({ name: v.name.toLowerCase(), marker: marker, lat: v.lat, lng: v.lng });
        }

        const fateLabel = currentLang === 'ar' ? (v.fate === 'Massacre' ? 'مجزرة' : 'تهجير') :
                          currentLang === 'en' ? (v.fate === 'Massacre' ? 'Massacre' : 'Depopulated') :
                          currentLang === 'fr' ? (v.fate === 'Massacre' ? 'Massacre' : 'Dépeuplé') :
                                                 (v.fate === 'Massacre' ? 'Masacre' : 'Despoblado');

        const statusText = currentLang === 'ar' ? 'الوضع' :
                           currentLang === 'en' ? 'Status' :
                           currentLang === 'fr' ? 'Statut' : 'Estado';

        html += `
            <div class="map-item bg-black/40 border border-white/5 hover:border-red-500/30 p-2.5 rounded-xl cursor-pointer transition-all hover:bg-black/60 text-right" onclick="focusMapMarker(${v.lat}, ${v.lng}, '${v.name}')">
                <div class="font-bold text-xs text-white">${v.name}</div>
                <div class="text-[10px] text-gray-400 font-mono mt-1">${statusText}: <span class="text-red-400">${fateLabel} (${v.year})</span></div>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

window.focusMapMarker = function(lat, lng, name) {
    if (map) {
        map.setView([lat, lng], 13, { animate: true });
        const match = mapMarkers.find(m => m.name.includes(name.toLowerCase()) || name.toLowerCase().includes(m.name));
        if (match) {
            match.marker.openPopup();
        }
    }
};

function filterMapList() {
    renderMapAndList();
}

const westBankMartyrsData = [
    { id: "wb1", name: "شيرين أبو عاقلة", name_en: "Shireen Abu Akleh", age: 51, date: "2022-05-11", city: "القدس / جنين", notes: "صحفية فلسطينية مخضرمة عملت مع شبكة الجزيرة الإعلامية لأكثر من ربع قرن. استشهدت برصاص جيش الاحتلال الإسرائيلي أثناء تغطيتها لاجتياح مخيم جنين بالرغم من ارتدائها خوذة وسترة الصحافة المميّزة." },
    { id: "wb2", name: "إبراهيم النابلسي", name_en: "Ibrahim al-Nabulsi", age: 18, date: "2022-08-09", city: "نابلس", notes: "أحد أبرز قادة المقاومة الشبابية في البلدة القديمة بنابلس. ارتقى شهيداً بعد محاصرة منزله وخوضه اشتباكاً بطولياً، تاركاً وصية وطنية خالدة تدعو للاستمرار وعدم ترك السلاح." },
    { id: "wb3", name: "باسل الأعرج", name_en: "Basil al-Araj", age: 31, date: "2017-03-06", city: "بيت لحم / البيرة", notes: "مثقف مشتبك، وباحث ومؤرخ فلسطيني وصيدلي رائد. أسس لمفهوم الثقافة المقاومة ونال الشهادة بعد خوضه اشتباكاً مسلحاً مع قوات الاحتلال الخاصة بعد مطاردة دامت عدة أشهر." },
    { id: "wb4", name: "جميل العموري", name_en: "Jamil al-Amouri", age: 25, date: "2021-06-10", city: "جنين", notes: "أحد مؤسسي كتيبة جنين، ارتقى شهيداً بعد استهدافه من قِبل قوة خاصة لجيش الاحتلال، ليتحول اسمه إلى أيقونة وملهم للحراك الشبابي المقاوم في مخيم جنين." },
    { id: "wb5", name: "محمد الدرة", name_en: "Muhammad al-Durrah", age: 12, date: "2000-09-30", city: "القدس / غزة", notes: "أيقونة الانتفاضة الثانية، ارتقى شهيداً برصاص الاحتلال وهو يحتمي خلف والده في شارع صلاح الدين، في مشهد وثقته عدسات الكاميرات وهز الضمير العالمي." },
    { id: "wb6", name: "أمير أبو خديجة", name_en: "Amir Abu Khadijah", age: 25, date: "2023-03-23", city: "طولكرم", notes: "مؤسس كتيبة الرد السريع في طولكرم، ارتقى شهيداً في أول أيام شهر رمضان المبارك بعد خوضه اشتباكاً مسلحاً بطولياً دفاعاً عن مدينته ومخيمها." }
];

const martyrs48Data = [
    { id: "m48_1", name: "خديجة شواهنة", name_en: "Khadija Shawahneh", age: 23, date: "1976-03-30", city: "سخنين", notes: "إحدى شهداء هبة يوم الأرض الخالدة عام 1976، ارتدت ثوب الشهادة دفاعاً عن الأراضي والقرى الفلسطينية المهددة بالمصادرة والتهويد في الجليل." },
    { id: "m48_2", name: "رجاء أبو الهيجا", name_en: "Raja Abu al-Heja", age: 21, date: "1976-03-30", city: "طمرة", notes: "شاب فلسطيني بطل ارتقى خلال مواجهات يوم الأرض البطولية في الجليل، مدافعاً عن الهوية العربية والوجود الفلسطيني بوجه سياسات التهجير والمصادرة." },
    { id: "m48_3", name: "خير الدين حمدان", name_en: "Khair al-Din Hamdan", age: 22, date: "2014-11-08", city: "كفر كنا", notes: "شاب فلسطيني ارتقى شهيداً برصاص شرطة الاحتلال الإسرائيلي بدم بارد، لتعم الاحتجاجات والتظاهرات أراضي الداخل المحتل تنديداً بالاعتداءات المستمرة." },
    { id: "m48_4", name: "رامز بشناق", name_en: "Ramez Bushnaq", age: 24, date: "2000-10-03", city: "كفر مندا", notes: "استشهد برصاص شرطة الاحتلال الإسرائيلي خلال هبة أكتوبر 2000، التي اندلعت تضامناً مع أبناء شعبنا في غزة والضفة مع بداية الانتفاضة الثانية." },
    { id: "m48_5", name: "إياد لوابنة", name_en: "Eyad Lawabny", age: 26, date: "2000-10-02", city: "الناصرة", notes: "طبيب ومسعف فلسطيني ارتقى شهيداً في الناصرة أثناء تقديمه الإسعافات الأولية للجرحى خلال هبة أكتوبر 2000 البطولية بالداخل المحتل." },
    { id: "m48_6", name: "أحمد جبارين", name_en: "Ahmed Jabarin", age: 18, date: "2000-10-01", city: "أم الفحم", notes: "شاب في مقتبل العمر ارتقى شهيداً برصاص القناصة خلال التظاهرات السلمية في أم الفحم دفاعاً عن المسجد الأقصى المبارك والهوية الوطنية." }
];

function renderTributeCards(containerId, dataset) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '';
    dataset.forEach(item => {
        const cityLabel = currentLang === 'ar' ? 'المدينة' : 'City';
        const ageLabel = currentLang === 'ar' ? 'العمر' : 'Age';
        const dateLabel = currentLang === 'ar' ? 'التاريخ' : 'Date';
        const yearsLabel = currentLang === 'ar' ? 'سنة' : 'years';

        let title = item.name;
        let subtitle = item.name_en || '';
        if (currentLang !== 'ar') {
            title = transliterateName(item.name, currentLang);
            subtitle = item.name_en || transliterateName(item.name, 'en');
        }
        const notes = currentLang === 'ar' ? (item.notes || '') : translateContentInstantly(item.notes || '', item.name, currentLang);
        const city = currentLang === 'ar' ? (item.city || '') : translateCity(item.city || '', currentLang);

        html += `
            <div class="glass-panel p-6 rounded-2xl border border-white/10 hover:border-red-500/50 transition-all text-right flex flex-col justify-between group hover:scale-[1.02] cursor-pointer" onclick="openMartyrModal(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                <div>
                    <span class="text-[10px] text-red-400 font-bold tracking-wider">${cityLabel}: ${city}</span>
                    <h3 class="font-bold text-lg text-white mt-1 group-hover:text-red-400 transition-colors">${title}</h3>
                    ${subtitle ? `<p class="text-[10px] text-gray-400 font-mono">${subtitle}</p>` : ''}
                    <p class="text-xs text-gray-300 leading-relaxed mt-3">${notes}</p>
                </div>
                <div class="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-400">
                    <span>${ageLabel}: ${item.age} ${yearsLabel}</span>
                    <span>${dateLabel}: ${item.date}</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

window.switchMainMode = function(mode) {
    currentMainMode = mode;
    document.querySelectorAll('.btn-main').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`tab-${mode === 'martyrs48' ? '48' : mode}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Restrict Family Galaxies gathering features strictly to Gaza Souls (index.html)
    const corridorsBtn = document.getElementById('corridors-toggle-btn');
    if (mode === 'souls') {
        if (corridorsBtn) corridorsBtn.style.display = 'inline-flex';
    } else {
        corridorsActive = false;
        if (corridorsBtn) {
            corridorsBtn.style.display = 'none';
            corridorsBtn.classList.remove('active');
            corridorsBtn.style.background = 'rgba(220, 38, 38, 0.2)';
            corridorsBtn.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            const t = translations[currentLang];
            const corridorsBtnText = document.getElementById('corridors-btn-text');
            if (corridorsBtnText) corridorsBtnText.innerText = t ? t.corridorsOff : "Family Galaxies (Off)";
        }
    }

    ['map-view', 'stats-view', 'videos-view', 'no-data-view', 'milestones-view', 'westbank-view', 'martyrs48-view'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const canvasLayer = document.getElementById('canvas-layer');
    const shootingCanvas = document.getElementById('shooting-stars-canvas');
    const showStars = ['souls', 'journalists', 'westbank', 'martyrs48'].includes(mode);

    if (showStars) {
        document.body.classList.remove('stars-hidden');
    } else {
        document.body.classList.add('stars-hidden');
    }

    if (canvasLayer) canvasLayer.style.display = showStars ? '' : 'none';
    if (shootingCanvas) shootingCanvas.style.display = showStars ? '' : 'none';

    const verseContainer = document.getElementById('verse-container');
    const counterBox = document.getElementById('counter-box');
    const showVerseAndCounter = ['souls', 'journalists', 'westbank', 'martyrs48'].includes(mode);

    if (verseContainer) verseContainer.style.display = showVerseAndCounter ? '' : 'none';
    if (counterBox) counterBox.style.display = showVerseAndCounter ? 'flex' : 'none';

    if(mode === 'souls'){
        fetchAndRenderData('./data/victims.json');
    } else if(mode === 'journalists') {
        fetchAndRenderData('./data/journalists.json');
    } else if(mode === 'westbank') {
        const el = document.getElementById('westbank-view');
        if (el) el.style.display = 'block';
        let wbData = applyApprovedSubmissions(westBankMartyrsData);
        renderTributeCards('wb-cards-container', wbData);
        document.getElementById('number').innerText = wbData.length.toLocaleString();
        initCanvasPoints(wbData);
        isDirty = true;
    } else if(mode === 'martyrs48') {
        const el = document.getElementById('martyrs48-view');
        if (el) el.style.display = 'block';
        let m48Data = applyApprovedSubmissions(martyrs48Data);
        renderTributeCards('m48-cards-container', m48Data);
        document.getElementById('number').innerText = m48Data.length.toLocaleString();
        initCanvasPoints(m48Data);
        isDirty = true;
    } else if(mode === 'milestones') {
        const el = document.getElementById('milestones-view');
        if (el) el.style.display = 'block';
        renderCinematicTimeline();
    } else if(mode === 'stats') {
        const el = document.getElementById('stats-view');
        if (el) el.style.display = 'block';
    } else if(mode === 'videos') {
        const el = document.getElementById('videos-view');
        if (el) el.style.display = 'block';
    } else if(mode === 'map') {
        const el = document.getElementById('map-view');
        if (el) el.style.display = 'block';
        if (nakbaVillages.length === 0) {
            loadMapData();
        } else {
            renderMapAndList();
        }
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
                if (typeof window.loadGazaBorders === 'function') { window.loadGazaBorders(); }
            }
        }, 200);
    }
};

function fetchAndRenderData(url) {
    $.getJSON(url)
        .done(data => {
            let list = data || [];
            gazaSouls = applyApprovedSubmissions(list);

            // Also load journalists into search database
            $.getJSON('data/journalists.json').done(journalists => {
                if (Array.isArray(journalists)) {
                    journalists.forEach(j => {
                        if (!gazaSouls.some(item => item.id === j.profile || item.name === j.name)) {
                            gazaSouls.push({
                                id: j.profile,
                                name: j.name,
                                image: j.image,
                                category: 'شهيد صحفي'
                            });
                        }
                    });
                }
            }).always(() => {
                const numEl = document.getElementById('number');
                if (numEl) numEl.innerText = gazaSouls.length.toLocaleString();
                initCanvasPoints(gazaSouls);
                isDirty = true;
            });
        })
        .fail((jqxhr, textStatus, error) => {
            console.error('Failed to load archive data from:', url, error);
            const numEl = document.getElementById('number');
            if (numEl) numEl.innerText = '0';
            if (window.dataLoader) {
              window.dataLoader.renderErrorUI('canvas-layer', error || 'Failed to load archive data', () => fetchAndRenderData(url));
            }
        });
}

function searchMartyrByName(query) {
    currentSearchQuery = query.trim().toLowerCase();
    isDirty = true; // إعادة الرسم عند البحث

    const dropdown = document.getElementById('search-results-dropdown');
    if (!dropdown) return;

    if (currentSearchQuery.length < 2) {
        dropdown.innerHTML = '';
        dropdown.classList.add('hidden');
        return;
    }

    // البحث في البيانات النشطة عبر جميع الحقول
    const matches = gazaSouls.filter(person => {
        const nameAr = (person.name_ar || person.name || "").toLowerCase();
        const nameEn = (person.en_name || person.name_en || person.english_name || "").toLowerCase();
        const id = (person.id || person.id_number || "").toString().toLowerCase();
        const city = (person.city || person.district || person.governorate || "").toLowerCase();
        const category = (person.category || person.profession || person.role || "").toLowerCase();
        return nameAr.includes(currentSearchQuery) ||
               nameEn.includes(currentSearchQuery) ||
               id.includes(currentSearchQuery) ||
               city.includes(currentSearchQuery) ||
               category.includes(currentSearchQuery);
    }).slice(0, 15);

    if (matches.length === 0) {
        const noResultsText = window.i18n ? window.i18n.t('no_results', 'لم يتم العثور على نتائج مطابقة') : 'لم يتم العثور على نتائج مطابقة';
        dropdown.innerHTML = `<div class="p-3 text-center text-gray-400 text-sm font-semibold">${noResultsText}</div>`;
    } else {
        let html = '';
        matches.forEach(person => {
            let displayName = person.name || person.name_ar || person.en_name || 'شهيد مجهول';
            let subtitle = person.en_name || person.name_en || person.english_name || '';
            const activeLang = window.i18n ? window.i18n.currentLang : 'ar';
            if (activeLang !== 'ar' && typeof transliterateName === 'function') {
                displayName = subtitle || transliterateName(person.name || '', activeLang);
            }
            const ageLabel = window.i18n ? window.i18n.t('age', 'العمر') : 'العمر';
            const displayAge = person.age !== undefined && person.age !== null ? person.age : (window.i18n ? window.i18n.t('unknown_age', 'غير محدد') : 'غير محدد');

            html += `
                <div class="search-result-item p-2.5 hover:bg-red-950/40 border-b border-white/5 cursor-pointer flex justify-between items-center transition-all" onclick="selectSearchMartyr(${JSON.stringify(person).replace(/"/g, '&quot;')})">
                    <div class="text-right flex-1">
                        <div class="font-bold text-white">${displayName}</div>
                        ${subtitle ? `<div class="text-[10px] text-gray-400 font-mono">${subtitle}</div>` : ''}
                    </div>
                    <span class="bg-red-600/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full mr-2 whitespace-nowrap">${ageLabel}: ${displayAge}</span>
                </div>
            `;
        });
        dropdown.innerHTML = html;
    }
    dropdown.classList.remove('hidden');
}

window.selectSearchMartyr = function(person) {
    document.getElementById('search-results-dropdown').classList.add('hidden');
    document.getElementById('search-input').value = person.name_ar || person.name || '';
    openMartyrModal(person);
};

// إغلاق القائمة المنسدلة عند النقر خارجها
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('search-results-dropdown');
    const input = document.getElementById('search-input');
    if (dropdown && !dropdown.contains(e.target) && e.target !== input) {
        dropdown.classList.add('hidden');
    }
});

// ==========================================
// تحسينات أداء الـ Canvas (النظام المحدث)
// ==========================================

// Function to extract family name from Arabic name
function extractFamilyName(fullName) {
    if (!fullName) return "";
    let clean = fullName.replace(/[^\u0621-\u064A\s]/g, "").trim();
    let parts = clean.split(/\s+/);
    if (parts.length < 2) return "";

    // We can fetch the last word or handle compound last names like "ابو ..." or "ابن ..." or "آل ..."
    let last = parts[parts.length - 1];
    let secondLast = parts[parts.length - 2];

    const prefixes = ["ابو", "أبو", "ابن", "آل", "ام", "أم", "عبد", "بن"];
    if (prefixes.includes(secondLast) && parts.length >= 3) {
        return secondLast + " " + last;
    }
    return last;
}

let familyCenters = {};

function getFamilyCenterAndColor(familyName) {
    if (!familyName) return null;
    return familyCenters[familyName] || null;
}

function getGalaxyTarget(item, time) {
    let fam = extractFamilyName(item.name);
    let info = getFamilyCenterAndColor(fam);
    if (!fam || fam.length <= 2 || !info) {
        // Martyr doesn't belong to a large family galaxy, let them float as background stardust!
        // Beautiful dimmed field stars in cool white or soft red
        const isRed = (item.originalColor === '#ef4444');
        return {
            x: item.bgX,
            y: item.bgY,
            color: isRed ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.12)'
        };
    }

    let group = familyGroups[fam] || [];
    let N = group.length;
    let k = group.indexOf(item);
    if (k === -1) k = 0;

    let cX = info.xNorm * width;
    let cY = info.yNorm * height;

    // Calculate slow rotation based on time and family hash to give each galaxy its own rotation speed/dir
    let rotationDir = (info.hue % 2 === 0) ? 1 : -1;
    let rotationSpeed = 0.0002 + (info.hue % 4) * 0.0001;
    let galaxyRotation = rotationDir * rotationSpeed * time;

    // Choose 2 or 3 spiral arms based on family hash (replicating spectacular multi-arm spiral galaxies)
    let armCount = (info.hue % 2 === 0) ? 2 : 3;
    let armIndex = k % armCount;

    // Logarithmic spiral geometry: r = a * e^(b * theta) with beautiful fluffy arm dispersion
    let maxRadius = 15 + Math.sqrt(N) * 6;
    let progress = k / N;
    let theta = progress * Math.PI * 2.5; // tightness of the swirl

    let baseRadius = 5 + Math.pow(progress, 0.7) * maxRadius;
    let angle = theta + (armIndex * (Math.PI * 2 / armCount)) + galaxyRotation;

    // Add fluffy arm dispersion (narrower near the center, wider at the ends of spiral arms)
    let dispersion = (0.15 + progress * 0.3) * baseRadius;
    let dispHashX = Math.sin(k * 13) * dispersion;
    let dispHashY = Math.cos(k * 17) * dispersion;

    let targetX = cX + Math.cos(angle) * baseRadius + dispHashX;
    let targetY = cY + Math.sin(angle) * baseRadius + dispHashY;

    // Beautiful celestial color scheme matching the provided reference image (pink-red stellar nurseries + cyan/blue/white stars)
    let starColor = '#ffffff';
    if (baseRadius < 18) {
        // Dense glowing core of the galaxy: brilliant cyan-white
        starColor = `hsl(180, 100%, 90%)`;
    } else {
        // Color variation along the spiral arms
        let colorNoise = Math.abs(Math.sin(k * 31));
        if (colorNoise < 0.22) {
            // Bright pinkish-red H II gas nurseries (like NGC 604)
            starColor = `hsl(342, 95%, 62%)`;
        } else if (colorNoise < 0.55) {
            // Hot young blue/cyan stars
            starColor = `hsl(195, 95%, 72%)`;
        } else if (colorNoise < 0.8) {
            // Bright cool white stars
            starColor = `hsl(180, 30%, 95%)`;
        } else {
            // Main galaxy hue
            starColor = info.color;
        }
    }

    return { x: targetX, y: targetY, color: starColor };
}

function initCanvasPoints(dataList) {
    width = window.innerWidth;
    height = window.innerHeight;

    // تحديد حد أقصى لعدد النقاط المرسومة على الكانفاس لتجنب تجميد المتصفح وضمان تجربة أسلس وسريعة للغاية
    const displayList = dataList.slice(0, 15000);

    // إنشاء العناصر وتوليد الإحداثيات الأساسية
    points = displayList.map((item, index) => {
        let col = Math.random() > 0.3 ? '#ef4444' : '#ffffff';
        return {
            id: item.id || index,
            name: item.name_ar || item.name || `شهيد ${index+1}`,
            name_en: item.name_en || item.english_name || '',
            age: item.age || 'غير معروف',
            image: item.image ? (item.image.startsWith('/') ? item.image.slice(1) : item.image) : '',
            notes: item.notes || '',
            x: item.x !== undefined ? item.x * width : Math.random() * width,
            y: item.y !== undefined ? item.y * height : Math.random() * height,
            radius: Math.random() * 1.5 + 1,
            color: col,
            originalColor: col
        };
    });

    // 2. التخزين المؤقت للإحداثيات (Pre-calculation & Caching)
    recalculateCache();
}

function recalculateCache() {
    width = window.innerWidth;
    height = window.innerHeight;

    // تجميع الإحداثيات والخصائص في مصفوفة جاهزة لتقليل الحسابات المتكررة داخل حلقة الرسم
    cachedItems = points.map(p => {
        const existing = (typeof cachedItems !== 'undefined') ? cachedItems.find(item => item.id === p.id) : null;
        const bgX = existing ? existing.bgX : p.x;
        const bgY = existing ? existing.bgY : p.y;
        const screenX = existing ? existing.screenX : p.x;
        const screenY = existing ? existing.screenY : p.y;
        return {
            ...p,
            bgX,
            bgY,
            screenX,
            screenY,
            renderedColor: existing ? (existing.renderedColor || p.color) : p.color
        };
    });

    // Group family members using cachedItems which are actively updated/drifting on screen
    familyGroups = {};
    cachedItems.forEach(p => {
        let fam = extractFamilyName(p.name);
        if (fam && fam.length > 2) { // only group families with significant names
            if (!familyGroups[fam]) {
                familyGroups[fam] = [];
            }
            familyGroups[fam].push(p);
        }
    });

    // حساب مراكز متباعدة بصرياً وموزعة رياضياً باستخدام الحلزون الذهبي (Golden Spiral) لتجنب التداخل
    familyCenters = {};
    const minFamilySize = 3; // العائلات التي تضم 3 شهداء أو أكثر تحصل على مجرة خاصة بها متباعدة

    const sortedFamilies = Object.keys(familyGroups)
        .filter(fam => familyGroups[fam].length >= minFamilySize)
        .sort((a, b) => familyGroups[b].length - familyGroups[a].length);

    sortedFamilies.forEach((famName, idx) => {
        let hash = 0;
        for (let i = 0; i < famName.length; i++) {
            hash = famName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        const color = `hsl(${hue}, 95%, 68%)`;

        // توزيع حلزوني ذهبي متناسق لمنع التداخل تماماً وتباعد مثالي
        const angle = idx * 2.39996;
        // زيادة مسافة التباعد التدريجية للحفاظ على الفراغات الجمالية
        const spacing = 0.05 + (idx * 0.001);
        const radius = Math.sqrt(idx + 1) * spacing;

        const aspect = width / height;
        let xNorm = 0.5 + Math.cos(angle) * radius;
        let yNorm = 0.5 + Math.sin(angle) * radius * (aspect < 1 ? 1 : 1 / aspect);

        // الحفاظ على المجرات داخل حدود الشاشة المرئية بمساحة أمان جمالية
        xNorm = Math.max(0.12, Math.min(0.88, xNorm));
        yNorm = Math.max(0.12, Math.min(0.88, yNorm));

        familyCenters[famName] = { xNorm, yNorm, color, hue };
    });

    isDirty = true;
}

// تهيئة عناصر الـ Canvas وتطبيق التحسينات
const canvas = document.getElementById('stars-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// تهيئة متغيرات استبعاد النجوم من التولد خلف الحاويات الزجاجية (Star Culling)
let culledRects = [];
let lastCullUpdate = 0;
function updateCulledRects() {
    culledRects = [];
    const selectors = ['.glass-panel', '.glass-card', '#header', '#bottom-bar', '#counter-box', '#visitor-counter-box', '.tlc-panel', '.modal-content'];
    selectors.forEach(sel => {
        const els = document.querySelectorAll(sel);
        els.forEach(el => {
            if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
                const rect = el.getBoundingClientRect();
                culledRects.push({
                    left: rect.left,
                    top: rect.top,
                    right: rect.right,
                    bottom: rect.bottom
                });
            }
        });
    });
}

function isInsideCulledRect(x, y) {
    for (let i = 0; i < culledRects.length; i++) {
        const rect = culledRects[i];
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            return true;
        }
    }
    return false;
}

// تهيئة كانفاس الشهب المتساقطة
const shootingCanvas = document.getElementById('shooting-stars-canvas');
const shootingCtx = shootingCanvas ? shootingCanvas.getContext('2d') : null;
let shootingStars = [];

function createShootingStar() {
    return {
        x: Math.random() * width * 1.2,
        y: Math.random() * height * 0.4,
        length: Math.random() * 90 + 60,
        speed: Math.random() * 1.2 + 0.8, // تساقط انسيابي رائع وخلاب
        opacity: 0,
        fadeState: 'in'
    };
}

function updateAndDrawShootingStars() {
    if (!shootingCtx) return;
    shootingCtx.clearRect(0, 0, width, height);

    // توليد شهب جديدة عشوائياً بمعدل أعلى وأجمل بكثير لتزيين الخلفية السماوية الشاعرية
    if (shootingStars.length < 5 && Math.random() < 0.02) {
        shootingStars.push(createShootingStar());
    }

    for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];

        // حركة مائلة وبطيئة للأسفل واليسار
        star.x -= star.speed * 1.5;
        star.y += star.speed;

        if (star.fadeState === 'in') {
            star.opacity += 0.01;
            if (star.opacity >= 0.8) {
                star.opacity = 0.8;
                star.fadeState = 'out';
            }
        } else {
            star.opacity -= 0.008;
            if (star.opacity <= 0) {
                shootingStars.splice(i, 1);
                continue;
            }
        }

        // رسم ذيل الشهاب بشكل متلاشٍ متدرج رائع (أبيض يميل للأحمر المتوهج)
        const grad = shootingCtx.createLinearGradient(
            star.x, star.y,
            star.x + star.length * 0.8, star.y - star.length * 0.6
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
        grad.addColorStop(0.15, `rgba(239, 68, 68, ${star.opacity * 0.7})`);
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');

        shootingCtx.strokeStyle = grad;
        shootingCtx.lineWidth = 1.8;
        shootingCtx.lineCap = 'round';
        shootingCtx.beginPath();
        shootingCtx.moveTo(star.x, star.y);
        shootingCtx.lineTo(star.x + star.length * 0.8, star.y - star.length * 0.6);
        shootingCtx.stroke();
    }
}

function resizeCanvas() {
    if (!canvas) return;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    if (shootingCanvas) {
        shootingCanvas.width = width;
        shootingCanvas.height = height;
    }
    recalculateCache();
}

if (canvas) {
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
}

// تتبع حركة الماوس لتحديث التلميح وإجبار الرسم عند التفاعل
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    isDirty = true;
});

// 1. نظام إعادة الرسم المشروط (Dirty Flag & Conditional Rendering) و 3. Viewport Culling و 4. State Batching
function drawCanvas() {
    if (!ctx) {
        requestAnimationFrame(drawCanvas);
        return;
    }
    // أوقف استهلاك المعالج تماماً عندما تكون الواجهة ثابتة ولا يوجد تغيير (isDirty == false)
    if (!isDirty) {
        requestAnimationFrame(drawCanvas);
        return;
    }

    // تحديث أبعاد واستبعاد الأسطح الزجاجية بشكل دوري لتوفير الأداء (Star Culling)
    const nowCull = Date.now();
    if (nowCull - lastCullUpdate > 250) {
        updateCulledRects();
        lastCullUpdate = nowCull;
    }

    ctx.clearRect(0, 0, width, height);

    const queryActive = currentSearchQuery.length >= 2;

    if (queryActive) {
        isDirty = true; // لتفعيل حركة نبض الكوكبة باستمرار
    }

    // تحديث الإحداثيات والانتقال السلس بين الخلفية الطبيعية والمجرات العائلية
    const driftSpeed = 0.04;
    const lerpSpeed = 0.06; // سرعة انتقال فيزيائي انسيابي رائع
    const time = Date.now();

    for (let i = 0; i < cachedItems.length; i++) {
        const item = cachedItems[i];

        // تحديث حركة الخلفية السماوية المستمرة دائماً تحت السطح لعدم فقدان الإزاحة عند إلغاء التفعيل
        item.bgX -= driftSpeed * (i % 2 === 0 ? 0.8 : 1.2);
        item.bgY += driftSpeed * 0.4;

        if (item.bgX < -20) item.bgX = width + 20;
        if (item.bgX > width + 20) item.bgX = -20;
        if (item.bgY < -20) item.bgY = height + 20;
        if (item.bgY > height + 20) item.bgY = -20;

        let targetX, targetY, targetColor;

        if (corridorsActive) {
            const galaxy = getGalaxyTarget(item, time);
            targetX = galaxy.x;
            targetY = galaxy.y;
            targetColor = galaxy.color;
        } else {
            targetX = item.bgX;
            targetY = item.bgY;
            targetColor = item.originalColor || item.color;
        }

        // تطبيق الاستيفاء الخطي (Lerp / Smooth Interpolation) للحركة البصرية الانسيابية
        item.screenX += (targetX - item.screenX) * lerpSpeed;
        item.screenY += (targetY - item.screenY) * lerpSpeed;
        item.renderedColor = targetColor;
    }

    // رسم السحب الغازية ونوى المجرات (Nebula Cores) عند تفعيل المجرات العائلية لعائلات بها 3 شهداء أو أكثر
    if (corridorsActive && typeof familyGroups !== 'undefined') {
        Object.keys(familyGroups).forEach(famName => {
            const members = familyGroups[famName];
            if (members.length < 3) return;

            const info = getFamilyCenterAndColor(famName);
            if (!info) return;

            const cX = info.xNorm * width;
            const cY = info.yNorm * height;

            // توهج دائري متعدد الطبقات يمثل نواة المجرة الساطعة والسدم المحيطة بها بدقة بالغة تطابق الصورة
            const glowRadius = Math.min(90, 20 + members.length * 1.8);
            const grad = ctx.createRadialGradient(cX, cY, 0, cX, cY, glowRadius);

            // تدرج لوني غازي ناعم (أبيض متوهج في المركز -> تركواز ساطع -> شفاف تماماً في الأطراف)
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.40)');
            grad.addColorStop(0.15, 'rgba(153, 246, 228, 0.22)'); // Teal-200 / Cyan soft glow
            grad.addColorStop(0.45, 'rgba(13, 148, 136, 0.06)');  // Teal-600 outer nebula dust
            grad.addColorStop(1, 'rgba(13, 148, 136, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cX, cY, glowRadius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // رسم النجوم بناءً على وضع العرض
    if (corridorsActive) {
        // تجميع النجوم حسب اللون لتقليل عمليات الـ State Fills وضمان أداء خارق 60 FPS
        let colorBuckets = {};
        for (let i = 0; i < cachedItems.length; i++) {
            const item = cachedItems[i];

            // استبعاد خارج إطار الرؤية (Viewport Culling) والأسطح الزجاجية (Star Culling)
            if (item.screenX < -10 || item.screenX > width + 10 || item.screenY < -10 || item.screenY > height + 10) {
                continue;
            }
            if (isInsideCulledRect(item.screenX, item.screenY)) {
                continue;
            }

            let col = item.renderedColor || '#ef4444';
            if (queryActive) {
                const nameAr = (item.name_ar || item.name || "").toLowerCase();
                const nameEn = (item.name_en || item.english_name || "").toLowerCase();
                const id = (item.id || "").toString();
                const isMatch = nameAr.includes(currentSearchQuery) || nameEn.includes(currentSearchQuery) || id.includes(currentSearchQuery);
                col = isMatch ? col : 'rgba(255, 255, 255, 0.08)';
            }

            if (!colorBuckets[col]) {
                colorBuckets[col] = [];
            }
            colorBuckets[col].push(item);
        }

        // رسم كل دلو لوني في استدعاء Batch واحد
        Object.keys(colorBuckets).forEach(col => {
            ctx.fillStyle = col;
            ctx.beginPath();
            const items = colorBuckets[col];
            for (let j = 0; j < items.length; j++) {
                const item = items[j];
                ctx.moveTo(item.screenX + item.radius, item.screenY);
                ctx.arc(item.screenX, item.screenY, item.radius, 0, Math.PI * 2);
            }
            ctx.fill();
        });
    } else {
        // تجميع خصائص السياق (State Batching) لشهداء اللون الأحمر (العاديين أو الباهتين)
        ctx.fillStyle = queryActive ? 'rgba(239, 68, 68, 0.15)' : '#ef4444';
        ctx.beginPath();
        for (let i = 0; i < cachedItems.length; i++) {
            const item = cachedItems[i];

            if (item.screenX < -10 || item.screenX > width + 10 || item.screenY < -10 || item.screenY > height + 10) {
                continue;
            }
            if (isInsideCulledRect(item.screenX, item.screenY)) {
                continue;
            }

            if (item.color === '#ef4444') {
                let isMatch = false;
                if (queryActive) {
                    const nameAr = (item.name_ar || item.name || "").toLowerCase();
                    const nameEn = (item.name_en || item.english_name || "").toLowerCase();
                    const id = (item.id || "").toString();
                    if (nameAr.includes(currentSearchQuery) || nameEn.includes(currentSearchQuery) || id.includes(currentSearchQuery)) {
                        isMatch = true;
                    }
                }

                if (!isMatch) {
                    ctx.moveTo(item.screenX + item.radius, item.screenY);
                    ctx.arc(item.screenX, item.screenY, item.radius, 0, Math.PI * 2);
                }
            }
        }
        ctx.fill();

        // تجميع خصائص السياق (State Batching) لشهداء اللون الأبيض (العاديين أو الباهتين)
        ctx.fillStyle = queryActive ? 'rgba(255, 255, 255, 0.15)' : '#ffffff';
        ctx.beginPath();
        for (let i = 0; i < cachedItems.length; i++) {
            const item = cachedItems[i];

            if (item.screenX < -10 || item.screenX > width + 10 || item.screenY < -10 || item.screenY > height + 10) {
                continue;
            }
            if (isInsideCulledRect(item.screenX, item.screenY)) {
                continue;
            }

            if (item.color === '#ffffff') {
                let isMatch = false;
                if (queryActive) {
                    const nameAr = (item.name_ar || item.name || "").toLowerCase();
                    const nameEn = (item.name_en || item.english_name || "").toLowerCase();
                    const id = (item.id || "").toString();
                    if (nameAr.includes(currentSearchQuery) || nameEn.includes(currentSearchQuery) || id.includes(currentSearchQuery)) {
                        isMatch = true;
                    }
                }

                if (!isMatch) {
                    ctx.moveTo(item.screenX + item.radius, item.screenY);
                    ctx.arc(item.screenX, item.screenY, item.radius, 0, Math.PI * 2);
                }
            }
        }
        ctx.fill();
    }

    // رسم النجوم المطابقة للبحث ككوكبة مضيئة بارزة ومتحركة
    if (queryActive) {
        for (let i = 0; i < cachedItems.length; i++) {
            const item = cachedItems[i];

            if (item.screenX < -10 || item.screenX > width + 10 || item.screenY < -10 || item.screenY > height + 10) {
                continue;
            }
            if (isInsideCulledRect(item.screenX, item.screenY)) {
                continue;
            }

            const nameAr = (item.name_ar || item.name || "").toLowerCase();
            const nameEn = (item.name_en || item.english_name || "").toLowerCase();
            const id = (item.id || "").toString();
            if (nameAr.includes(currentSearchQuery) || nameEn.includes(currentSearchQuery) || id.includes(currentSearchQuery)) {
                // النجم المطابق
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(item.screenX, item.screenY, 5, 0, Math.PI * 2);
                ctx.fill();

                // حلقة وهج خارجي نابضة
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(item.screenX, item.screenY, 9 + Math.sin(Date.now() / 150) * 2, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }


    // Spot Star targeted highlighting focused on spotlightStarId
    if (spotlightStarId) {
        const target = cachedItems.find(p => p.id == spotlightStarId);
        if (target) {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(target.screenX, target.screenY, 15 + Math.sin(Date.now() / 100) * 4, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(target.screenX, target.screenY, 25 + Math.sin(Date.now() / 80) * 6, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // فحص التلميح وتحديد ما إذا كان هناك تفاعل مع الماوس
    let hoveredMartyr = null;
    for (let i = 0; i < cachedItems.length; i++) {
        const item = cachedItems[i];
        if (isInsideCulledRect(item.screenX, item.screenY)) {
            continue;
        }
        const dx = mouseX - item.screenX;
        const dy = mouseY - item.screenY;
        if (dx * dx + dy * dy < 100) { // مسافة تقريبية للتفاعل (10 بكسل)
            hoveredMartyr = item;
            break;
        }
    }

    if (hoveredMartyr) {
        hoveredFamilyName = extractFamilyName(hoveredMartyr.name);
    } else {
        hoveredFamilyName = null;
    }

    const tooltip = document.getElementById('star-tooltip');
    if (hoveredMartyr) {
        currentMartyrObj = hoveredMartyr;
        document.getElementById('tooltip-name').innerText = hoveredMartyr.name;
        const nameEnEl = document.getElementById('tooltip-name-en');
        if(hoveredMartyr.name_en) {
            nameEnEl.innerText = hoveredMartyr.name_en;
            nameEnEl.style.display = 'block';
        } else {
            nameEnEl.style.display = 'none';
        }
        document.getElementById('tooltip-age').innerText = `العمر: ${hoveredMartyr.age}`;
        tooltip.style.display = 'block';
        tooltip.style.left = (mouseX + 15) + 'px';
        tooltip.style.top = (mouseY + 15) + 'px';
    } else {
        tooltip.style.display = 'none';
    }

    // تحديث ورسم الشهب المتساقطة
    updateAndDrawShootingStars();

    // نضمن بقاء العلم صحيحاً لاستمرار حركة النجوم والشهب ببطء دائم
    isDirty = true;
    requestAnimationFrame(drawCanvas);
}

// بدء حلقة الرسم المشروط
requestAnimationFrame(drawCanvas);

// ----------------------------------------------------
// Category 1 JS: Crowdsourcing & Submissions
// ----------------------------------------------------
let captchaNum1 = 0;
let captchaNum2 = 0;
let currentEditingMartyrId = null;

// Dynamic and beautiful dual input injector (File Upload / Link)
function openCrowdsourceModal() {
    captchaNum1 = Math.floor(Math.random() * 9) + 1;
    captchaNum2 = Math.floor(Math.random() * 9) + 1;
    const qEl = document.getElementById('cs-captcha-question');
    if (qEl) {
        qEl.innerText = `${captchaNum1} + ${captchaNum2} =`;
    }
    const ansEl = document.getElementById('cs-captcha-answer');
    if (ansEl) ansEl.value = '';

    document.getElementById('cs-submitter').value = '';
    document.getElementById('cs-martyr-name').value = '';
    document.getElementById('cs-martyr-city').value = '';
    document.getElementById('cs-notes').value = '';

    // Dynamically inject the file upload input next to URL input if it doesn't exist
    const oldPhotoInput = document.getElementById('cs-photo');
    if (oldPhotoInput && oldPhotoInput.parentElement) {
        const parent = oldPhotoInput.parentElement;
        let fileInput = document.getElementById('cs-photo-file');
        if (!fileInput) {
            parent.innerHTML = `
                <label class="text-gray-300 block">صورة الشهيد أو مستند الإثبات (ملف أو رابط):</label>
                <div class="flex flex-col gap-1.5">
                    <input type="file" id="cs-photo-file" accept="image/*" class="w-full bg-black/60 border border-white/20 text-white px-3 py-1.5 rounded-xl text-xs outline-none focus:border-red-500">
                    <span class="text-gray-500 text-[10px] text-center">أو أدخل رابط الصورة مباشرة:</span>
                    <input type="url" id="cs-photo" placeholder="https://example.com/photo.jpg" class="w-full bg-black/60 border border-white/20 text-white px-3 py-2 rounded-xl text-xs outline-none focus:border-red-500">
                </div>
            `;
        }
    }

    const fileIn = document.getElementById('cs-photo-file');
    if (fileIn) fileIn.value = '';
    const urlIn = document.getElementById('cs-photo');
    if (urlIn) urlIn.value = '';

    document.getElementById('crowdsource-modal-overlay').style.display = 'flex';
}

function triggerMartyrEdit() {
    if (!currentMartyrObj) return;

    // Close martyr modal
    document.getElementById('martyr-modal-overlay').style.display = 'none';

    // Open crowdsourcing modal
    openCrowdsourceModal();

    // Autofill fields
    currentEditingMartyrId = currentMartyrObj.id;
    document.getElementById('cs-martyr-name').value = currentMartyrObj.name || '';
    document.getElementById('cs-martyr-city').value = currentMartyrObj.city || '';
    document.getElementById('cs-notes').value = `طلب تعديل لبيانات الشهيد: ${currentMartyrObj.name} (رقم الهوية: ${currentMartyrObj.id || 'غير معروف'}). التفاصيل المراد تعديلها: `;

    const urlIn = document.getElementById('cs-photo');
    if (urlIn && currentMartyrObj.image) {
        urlIn.value = currentMartyrObj.image;
    }
}
window.triggerMartyrEdit = triggerMartyrEdit;

function submitCrowdsourceForm(e) {
    e.preventDefault();
    const ansVal = parseInt(document.getElementById('cs-captcha-answer').value);
    if (ansVal !== (captchaNum1 + captchaNum2)) {
        alert(currentLang === 'ar' ? 'إجابة سؤال الحماية غير صحيحة، يرجى المحاولة مرة أخرى.' : 'Incorrect protection question answer. Please try again.');
        return;
    }

    const submitter = document.getElementById('cs-submitter').value.trim();
    const name = document.getElementById('cs-martyr-name').value.trim();
    const city = document.getElementById('cs-martyr-city').value.trim();
    const notes = document.getElementById('cs-notes').value.trim();

    const fileInput = document.getElementById('cs-photo-file');
    const urlInput = document.getElementById('cs-photo');
    let image = urlInput ? urlInput.value.trim() : '';

    const proceedSubmission = (imageData) => {
        const submission = {
            id: 'cs_' + Date.now(),
            original_id: currentEditingMartyrId || null,
            submitter,
            name,
            city,
            notes,
            image: imageData || image,
            status: 'pending',
            date: new Date().toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : 'en-US')
        };

        let list = [];
        try {
            const stored = localStorage.getItem('crowdsourced_submissions');
            if (stored) list = JSON.parse(stored);
        } catch (err) {
            console.error(err);
        }
        list.push(submission);
        localStorage.setItem('crowdsourced_submissions', JSON.stringify(list));

        alert(currentLang === 'ar' ? 'تم إرسال مساهمتك بنجاح وهي قيد المراجعة والاعتماد الآن.' : 'Your submission has been sent successfully and is under review.');
        document.getElementById('crowdsource-modal-overlay').style.display = 'none';

        // Reset state
        currentEditingMartyrId = null;
    };

    if (fileInput && fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function(evt) {
            proceedSubmission(evt.target.result);
        };
        reader.readAsDataURL(file);
    } else {
        proceedSubmission(image);
    }
}

// Global helper to merge approved edits and additions on load
function applyApprovedSubmissions(targetList) {
    let list = [];
    try {
        const stored = localStorage.getItem('crowdsourced_submissions');
        if (stored) list = JSON.parse(stored);
    } catch (err) {
        console.error(err);
    }

    const approved = list.filter(item => item.status === 'approved');
    let result = [...targetList];

    approved.forEach(item => {
        if (item.original_id) {
            // Edit existing record
            const idx = result.findIndex(p => String(p.id) === String(item.original_id));
            if (idx !== -1) {
                result[idx] = {
                    ...result[idx],
                    name: item.name || result[idx].name,
                    city: item.city || result[idx].city,
                    notes: item.notes || result[idx].notes,
                    image: item.image || result[idx].image || ''
                };
            }
        } else {
            // Add brand new record
            const exists = result.some(p => p.name === item.name);
            if (!exists) {
                result.unshift({
                    id: item.id,
                    name: item.name,
                    city: item.city,
                    age: item.age || 'غير معروف',
                    notes: item.notes || '',
                    image: item.image || '',
                    x: Math.random(),
                    y: Math.random()
                });
            }
        }
    });

    return result;
}
function spotFamilyStar(starId) {
    // Clear any previous spotlight
    if (spotlightTimer) {
        clearTimeout(spotlightTimer);
    }

    spotlightStarId = starId;
    isDirty = true;

    // Close the modal so the user can see the animated focal target in the sky
    const modal = document.getElementById('martyr-modal-overlay');
    if (modal) {
        modal.style.display = 'none';
        window.speechSynthesis.cancel();
        isMartyrSpeaking = false;
    }

    // Set a timer to automatically fade out the target focus rings after 10 seconds
    spotlightTimer = setTimeout(() => {
        spotlightStarId = null;
        isDirty = true;
    }, 10000);
}
window.spotFamilyStar = spotFamilyStar;

window.applyApprovedSubmissions = applyApprovedSubmissions;

// Delegated to js/admin.js: openAdminReviewPanel

function renderAdminSubmissions() {
    const container = document.getElementById('admin-submissions-list');
    if (!container) return;

    let list = [];
    try {
        const stored = localStorage.getItem('crowdsourced_submissions');
        if (stored) list = JSON.parse(stored);
    } catch (err) {
        console.error(err);
    }

    if (list.length === 0) {
        container.innerHTML = `<div class="text-gray-500 text-center py-6">لا توجد مساهمات معلقة للمراجعة حالياً.</div>`;
        return;
    }

    container.innerHTML = list.map(item => `
        <div class="bg-white/5 border border-white/10 p-3 rounded-xl space-y-2 relative text-right">
            <span class="absolute top-3 left-3 px-2 py-0.5 rounded text-[9px] font-bold ${
                item.status === 'approved' ? 'bg-green-600/20 border border-green-500 text-green-400' :
                item.status === 'rejected' ? 'bg-red-600/20 border border-red-500 text-red-400' :
                'bg-amber-600/20 border border-amber-500 text-amber-400'
            }">${item.status === 'approved' ? 'معتمد' : item.status === 'rejected' ? 'مرفوض' : 'معلق'}</span>

            <div class="text-red-400 font-bold mb-1">المساهم: ${item.submitter} (${item.date})</div>
            <div><strong>اسم الشهيد:</strong> ${item.name}</div>
            <div><strong>المدينة / المحافظة:</strong> ${item.city}</div>
            <div><strong>التفاصيل:</strong> ${item.notes}</div>
            ${item.image ? `<div class="mt-1"><a href="${item.image}" target="_blank" class="text-blue-400 underline">عرض الصورة المرفقة</a></div>` : ''}

            ${item.status === 'pending' ? `
                <div class="flex gap-2 mt-2 pt-2 border-t border-white/10">
                    <button onclick="approveSubmission('${item.id}')" class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-[10px]">اعتماد وقبول</button>
                    <button onclick="rejectSubmission('${item.id}')" class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-[10px]">رفض</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function approveSubmission(id) {
    let list = [];
    try {
        const stored = localStorage.getItem('crowdsourced_submissions');
        if (stored) list = JSON.parse(stored);
    } catch (err) {}

    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
        list[index].status = 'approved';
        localStorage.setItem('crowdsourced_submissions', JSON.stringify(list));

        const sub = list[index];
        const newSoulsObj = {
            id: 'cs_approved_' + Date.now(),
            name: sub.name,
            city: sub.city,
            age: 'غير معروف',
            notes: sub.notes,
            image: sub.image || ''
        };

        if (typeof gazaSouls !== 'undefined') {
            gazaSouls.unshift(newSoulsObj);
        }
        if (typeof cachedItems !== 'undefined') {
            cachedItems.unshift(newSoulsObj);
        }

        alert(currentLang === 'ar' ? 'تم قبول واعتماد المساهمة، وتمت إضافتها بنجاح إلى أرشيف الشهداء!' : 'Submission approved and successfully added to the archive!');
        renderAdminSubmissions();
    }
}

function rejectSubmission(id) {
    let list = [];
    try {
        const stored = localStorage.getItem('crowdsourced_submissions');
        if (stored) list = JSON.parse(stored);
    } catch (err) {}

    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
        list[index].status = 'rejected';
        localStorage.setItem('crowdsourced_submissions', JSON.stringify(list));
        alert(currentLang === 'ar' ? 'تم رفض المساهمة.' : 'Submission rejected.');
        renderAdminSubmissions();
    }
}

// ----------------------------------------------------
// Category 1 JS: Virtual Tributes & Local Storage
// ----------------------------------------------------
function loadMartyrTributes(martyrKey) {
    let allTributes = {};
    try {
        const stored = localStorage.getItem('martyr_tributes');
        if (stored) {
            allTributes = JSON.parse(stored);
        }
    } catch (e) {
        console.error(e);
    }
    if (!allTributes[martyrKey]) {
        allTributes[martyrKey] = { candles: 0, comments: [] };
    }
    return allTributes[martyrKey];
}

function saveMartyrTributes(martyrKey, data) {
    let allTributes = {};
    try {
        const stored = localStorage.getItem('martyr_tributes');
        if (stored) {
            allTributes = JSON.parse(stored);
        }
    } catch (e) {
        console.error(e);
    }
    allTributes[martyrKey] = data;
    localStorage.setItem('martyr_tributes', JSON.stringify(allTributes));
}

function updateTributeUI() {
    if (!currentMartyrObj) return;
    const key = currentMartyrObj.name || 'unknown';
    const data = loadMartyrTributes(key);

    // Update candle counter
    const candleCountEl = document.getElementById('tribute-candle-count');
    if (candleCountEl) {
        candleCountEl.innerText = data.candles;
    }

    // Render comments list
    const container = document.getElementById('tributes-list-container');
    if (container) {
        if (data.comments && data.comments.length > 0) {
            container.innerHTML = data.comments.map(c => `
                <div class="bg-white/5 p-1.5 rounded text-right border-r-2 border-red-500">
                    <div class="flex justify-between items-center text-[9px] text-gray-400 font-bold mb-0.5">
                        <span>${c.name}</span>
                        <span>${c.date}</span>
                    </div>
                    <p class="text-gray-200 text-[10px] leading-tight">${c.text}</p>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<div class="text-gray-500 text-center py-2">لا توجد رسائل تضامن حالياً. كن أول من يترك أثراً.</div>`;
        }
    }
}

function lightTributeCandle() {
    if (!currentMartyrObj) return;
    const key = currentMartyrObj.name || 'unknown';
    const data = loadMartyrTributes(key);
    data.candles += 1;
    saveMartyrTributes(key, data);

    // Play light bell sound using Web Audio API simple oscillator
    try {
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);

            osc.start();
            osc.stop(ctx.currentTime + 1.2);
        }
    } catch(e) {
        console.log("Audio trigger error:", e);
    }

    // Show visual candle flame pop
    const animArea = document.getElementById('candle-animation-area');
    if (animArea) {
        animArea.classList.remove('hidden');
        animArea.classList.add('flex');
        setTimeout(() => {
            animArea.classList.add('hidden');
            animArea.classList.remove('flex');
        }, 1500);
    }

    updateTributeUI();
}

function submitVirtualTribute() {
    if (!currentMartyrObj) return;
    const nameInput = document.getElementById('tribute-name-input');
    const msgInput = document.getElementById('tribute-msg-input');
    if (!nameInput || !msgInput) return;

    const name = nameInput.value.trim() || 'زائر تضامني';
    const text = msgInput.value.trim();
    if (!text) return;

    const key = currentMartyrObj.name || 'unknown';
    const data = loadMartyrTributes(key);

    const today = new Date();
    const dateStr = today.getFullYear() + '/' + (today.getMonth()+1) + '/' + today.getDate();

    data.comments.unshift({ name, text, date: dateStr });
    saveMartyrTributes(key, data);

    // Reset msg
    msgInput.value = '';
    nameInput.value = '';

    updateTributeUI();
}

function openMartyrModal(person) {
    currentMartyrObj = person;
    if (window.martyrProfileEngine) {
        window.martyrProfileEngine.openMartyrProfile(person);
    } else if (typeof openMartyrProfile === 'function') {
        openMartyrProfile(person);
    } else if (document.getElementById('martyr-modal-overlay')) {
        document.getElementById('martyr-modal-name').innerText = person.name || 'شهيد مجهول';
        document.getElementById('martyr-modal-overlay').style.display = 'flex';
    }
}

// نقر النجوم لفتح الكرت التوثيقي للشهيد
if (canvas) {
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        let clickedMartyr = null;
        for (let i = 0; i < cachedItems.length; i++) {
            const item = cachedItems[i];
            const dx = x - item.screenX;
            const dy = y - item.screenY;
            if (dx * dx + dy * dy < 144) { // ضمن مسافة 12 بكسل
                clickedMartyr = item;
                break;
            }
        }

        if (clickedMartyr) {
            openMartyrModal(clickedMartyr);
        }
    });
}

// ربط أحداث الإغلاق للنوافذ المنبثقة
const mc = document.getElementById('milestone-modal-close'); if (mc) mc.addEventListener('click', () => {
    window.speechSynthesis.cancel();
    isMilestoneSpeaking = false;
    document.getElementById('milestone-modal-overlay').style.display = 'none';
});
const mo = document.getElementById('milestone-modal-overlay'); if (mo) mo.addEventListener('click', (e) => {
    if (e.target === document.getElementById('milestone-modal-overlay')) {
        window.speechSynthesis.cancel();
        isMilestoneSpeaking = false;
        document.getElementById('milestone-modal-overlay').style.display = 'none';
    }
});

const rc = document.getElementById('martyr-modal-close'); if (rc) rc.addEventListener('click', () => {
    window.speechSynthesis.cancel();
    isMartyrSpeaking = false;
    document.getElementById('martyr-modal-overlay').style.display = 'none';
});
const ro = document.getElementById('martyr-modal-overlay'); if (ro) ro.addEventListener('click', (e) => {
    if (e.target === document.getElementById('martyr-modal-overlay')) {
        window.speechSynthesis.cancel();
        isMartyrSpeaking = false;
        document.getElementById('martyr-modal-overlay').style.display = 'none';
    }
});

// ----------------------------------------------------
// Category 6 JS: Instant Translations & Adaptive Dark Mode
// ----------------------------------------------------
const multilingualBios = {
    "شيرين أبو عاقلة": {
        en: "Shireen Abu Akleh was a prominent Palestinian-American journalist who worked as a reporter for Al Jazeera for 25 years. She was shot and killed by Israeli forces while covering a military raid on the Jenin refugee camp.",
        fr: "Shireen Abu Akleh était une éminente journalist palestino-américaine de renom de l'Al Jazeera. Elle a été lâchement assassinée par balles de l'armée d'occupation.",
        es: "Shireen Abu Akleh fue una destacada periodista palestina que trabajó para Al Jazeera. Fue asesinada por las fuerzas de ocupación mientras informaba sobre el terreno."
    },
    "إبراهيم النابلسي": {
        en: "Ibrahim al-Nabulsi was a young, inspiring resistance commander in Nablus. He was martyred during an armed confrontation, leaving behind a legacy of unity.",
        fr: "Ibrahim al-Nabulsi était un jeune commandant inspirant de la résistance à Naplouse. Il est tombé en martyr lors d'un affrontement armé.",
        es: "Ibrahim al-Nabulsi fue un joven e inspirador comandante de la resistencia en Nablus. Murió como mártir durante un enfrentamiento armado."
    },
    "باسل الأعرج": {
        en: "Basil al-Araj was an intellectual writer, activist, and pharmacist. He championed cultural resistance and was martyred in a gunfight with special forces after a months-long chase.",
        fr: "Basil al-Araj était un écrivain intellectuel, activiste et pharmacien. Il a défendu la résistance culturelle et est tombé en martyr après une longue traque.",
        es: "Basil al-Araj fue un escritor intelectual, activista y farmacéutico. Defendió la resistencia cultural y murió como mártir tras una persecución de meses."
    }
};

const cityTranslations = {
    "غزة": { ar: "غزة", en: "Gaza", fr: "Gaza", es: "Gaza" },
    "خان يونس": { ar: "خان يونس", en: "Khan Younis", fr: "Khan Younès", es: "Jan Yunis" },
    "رفح": { ar: "رفح", en: "Rafah", fr: "Rafah", es: "Rafah" },
    "جباليا": { ar: "جباليا", en: "Jabalia", fr: "Jabalia", es: "Jabalya" },
    "دير البلح": { ar: "دير البلح", en: "Deir al-Balah", fr: "Deir el-Balah", es: "Deir al-Balah" },
    "شمال غزة": { ar: "شمال غزة", en: "North Gaza", fr: "Nord de Gaza", es: "Norte de Gaza" },
    "مخيم جباليا": { ar: "مخيم جباليا", en: "Jabalia Camp", fr: "Camp de Jabalia", es: "Campamento de Jabalia" },
    "جنين": { ar: "جنين", en: "Jenin", fr: "Jénine", es: "Yenín" },
    "نابلس": { ar: "نابلس", en: "Nablus", fr: "Naplouse", es: "Nablus" },
    "الخليل": { ar: "الخليل", en: "Hebron", fr: "Hébron", es: "Hebrón" },
    "رام الله": { ar: "رام الله", en: "Ramallah", fr: "Ramallah", es: "Ramala" },
    "القدس": { ar: "القدس", en: "Jerusalem", fr: "Jérusalem", es: "Jerusalén" },
    "بيت لحم": { ar: "بيت لحم", en: "Bethlehem", fr: "Bethléem", es: "Belén" },
    "طولكرم": { ar: "طولكرم", en: "Tulkarm", fr: "Tulkarem", es: "Tulkarem" },
    "قلقيلية": { ar: "قلقيلية", en: "Qalqilya", fr: "Qalqilya", es: "Qalqilya" },
    "طوباس": { ar: "طوباس", en: "Tubas", fr: "Tubas", es: "Tubas" },
    "سلفيت": { ar: "سلفيت", en: "Salfit", fr: "Salfit", es: "Salfit" },
    "أريحا": { ar: "أريحا", en: "Jericho", fr: "Jéricho", es: "Jericó" }
};

function transliterateName(arabicName, lang) {
    if (!arabicName) return "";

    // Common dictionary of full name overrides
    const overrides = {
        "باسل الأعرج": { en: "Basil al-Araj", fr: "Basil al-Araj", es: "Basil al-Araj" },
        "شيرين أبو عاقلة": { en: "Shireen Abu Akleh", fr: "Shireen Abu Akleh", es: "Shireen Abu Akleh" },
        "ياسر عرفات": { en: "Yasser Arafat", fr: "Yasser Arafat", es: "Yasser Arafat" },
        "أحمد ياسين": { en: "Ahmed Yassin", fr: "Ahmed Yassin", es: "Ahmed Yassin" }
    };

    if (overrides[arabicName] && overrides[arabicName][lang]) {
        return overrides[arabicName][lang];
    }

    const nameMap = {
        "محمد": "Muhammad", "احمد": "Ahmad", "أحمد": "Ahmad", "محمود": "Mahmoud", "علي": "Ali", "على": "Ali",
        "حسن": "Hassan", "حسين": "Hussein", "يوسف": "Youssef", "ابراهيم": "Ibrahim", "إبراهيم": "Ibrahim",
        "عبد": "Abd", "الله": "Allah", "الرحمن": "Rahman", "الرحيم": "Rahim", "الملك": "Malik",
        "خالد": "Khaled", "مصطفى": "Mustafa", "سعيد": "Saeed", "عمر": "Omar", "سليمان": "Soliman",
        "فاطمة": "Fatima", "عائشة": "Aisha", "مريم": "Maryam", "زينب": "Zainab", "رانية": "Rania",
        "جمال": "Jamal", "نبيل": "Nabil", "سليم": "Salim", "سمير": "Samir", "أمين": "Amin",
        "رائد": "Raed", "شادي": "Shadi", "ماهر": "Maher", "أيمن": "Ayman", "تيسير": "Taysir",
        "صالح": "Saleh", "ياسر": "Yasser", "سائد": "Saed", "طه": "Taha", "يحيى": "Yahya",
        "زكريا": "Zakaria", "موسى": "Mousa", "عيسى": "Isa", "جابر": "Jaber", "سعد": "Saad",
        "مسعود": "Masoud", "طارق": "Tariq", "زياد": "Ziad", "بهاء": "Bahaa", "ضياء": "Diyaa",
        "كريم": "Karim", "رمزي": "Ramzi", "مروان": "Marwan", "سامي": "Sami", "سامر": "Samer",
        "راني": "Rani", "عادل": "Adel", "عماد": "Imad", "عصام": "Essam", "حاتم": "Hatem",
        "رشاد": "Rashad", "أنور": "Anwar", "أكرم": "Akram", "أمجد": "Amjad", "أشرف": "Ashraf",
        "هاني": "Hani", "هشام": "Hisham", "منير": "Mounir", "وجيه": "Wajih", "فريد": "Farid",
        "رئيسة": "Raeesa", "صابر": "Saber", "نعيم": "Naeem", "شريف": "Sherif", "فتحي": "Fathi"
    };

    const words = arabicName.split(/\s+/);
    const translatedWords = words.map(word => {
        const cleanWord = word.replace(/[^\u0621-\u064A]/g, "");
        if (nameMap[cleanWord]) {
            return nameMap[cleanWord];
        }

        let latin = "";
        const chars = {
            'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
            'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
            'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
            'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a',
            'ة': 'h', 'ء': 'a', 'ؤ': 'u', 'ئ': 'i'
        };
        for (let i = 0; i < cleanWord.length; i++) {
            const c = cleanWord[i];
            latin += chars[c] || c;
        }
        if (!latin) return word;
        return latin.charAt(0).toUpperCase() + latin.slice(1);
    });

    return translatedWords.join(" ");
}
window.transliterateName = transliterateName;

function translateCity(arabicCity, lang) {
    if (!arabicCity) return "";
    const cleanCity = arabicCity.trim();
    if (cityTranslations[cleanCity]) {
        return cityTranslations[cleanCity][lang] || cityTranslations[cleanCity].en;
    }
    return transliterateName(arabicCity, lang);
}
window.translateCity = translateCity;

function translateContentInstantly(bioText, name, destLang) {
    const targetLang = destLang || currentLang;
    if (targetLang === 'ar') return bioText;
    if (multilingualBios[name] && multilingualBios[name][targetLang]) {
        return multilingualBios[name][targetLang];
    }
    // Simulation / Fallback mock-translator for standard entries
    const mockTranslations = {
        en: "A brave Palestinian soul who was martyred in defense of the homeland, dignity, and national identity.",
        fr: "Une âme palestinienne courageuse qui est tombée en martyr pour la défense de la patrie, de la dignité et de l'identité.",
        es: "Un alma palestina valiente que murió como mártir en defensa de la patria, la dignidad y la identidad nacional."
    };
    return mockTranslations[targetLang] || bioText;
}

function translateMartyrModal(lang) {
    if (!currentMartyrObj) return;

    const buttons = document.querySelectorAll('#martyr-modal-bio-container button');
    buttons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(`'${lang}'`)) {
            btn.className = "px-1.5 py-0.5 rounded bg-red-600/30 border border-red-500 text-white text-[9px]";
        } else {
            btn.className = "px-1.5 py-0.5 rounded bg-gray-800 border border-white/10 text-gray-300 text-[9px]";
        }
    });

    const bioTextDiv = document.getElementById('martyr-modal-bio-text-div');
    if (currentMartyrObj.notes) {
        const translatedNotes = translateContentInstantly(currentMartyrObj.notes, currentMartyrObj.name, lang);

        const langLabels = {
            ar: { title: "سيرة الشهيد:", labelAge: "العمر:", labelId: "رقم الهوية:", ttsText: "استماع للسيرة" },
            en: { title: "Biography of the Martyr:", labelAge: "Age:", labelId: "ID Number:", ttsText: "Listen Biography" },
            fr: { title: "Biographie du Martyr:", labelAge: "Âge:", labelId: "Numéro d'ID:", ttsText: "Écouter la Biographie" },
            es: { title: "Biografía del Mártir:", labelAge: "Edad:", labelId: "Número de ID:", ttsText: "Escuchar Biografía" }
        };

        const l = langLabels[lang] || langLabels.ar;

        bioTextDiv.innerHTML = `🌟 <strong>${l.title}</strong><p class="mt-1 font-normal">${translatedNotes}</p>`;
        bioTextDiv.classList.remove('hidden');

        document.getElementById('modal-age-label').innerText = l.labelAge;
        document.getElementById('modal-id-label').innerText = l.labelId;
        document.getElementById('tts-btn-text').innerText = l.ttsText;
    } else {
        bioTextDiv.classList.add('hidden');
    }
}

function translateMilestoneModal(lang) {
    if (!currentMilestoneObj) return;

    const buttons = document.querySelectorAll('#milestone-lang-container button');
    buttons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(`'${lang}'`)) {
            btn.className = "px-1.5 py-0.5 rounded bg-red-600/30 border border-red-500 text-white text-[9px]";
        } else {
            btn.className = "px-1.5 py-0.5 rounded bg-gray-800 border border-white/10 text-gray-300 text-[9px]";
        }
    });

    const container = document.getElementById('milestone-modal-body-container');
    if (!container) return;

    const t = translations[lang] || translations.ar;

    let transTitle = currentMilestoneObj.title;
    let transExcerpt = currentMilestoneObj.excerpt;
    let transStat = currentMilestoneObj.stat;
    let transStatExp = currentMilestoneObj.statExp || currentMilestoneObj.excerpt;

    if (lang !== 'ar') {
        transTitle = currentMilestoneObj.title_en || currentMilestoneObj.title;
        transExcerpt = "A prominent historical milestone documenting the struggles, resilience, and events in the history of the Palestinian cause.";
        transStat = "Thousands of Martyrs";
        transStatExp = "Detailed archival statistics showing targeting records and historical timelines.";
    }

    container.innerHTML = `
        <div class="tlc-modal-content text-right text-xs">
            <h2 class="tlc-modal-title" style="font-size: 1.1rem; font-weight: bold; color: #ef4444;">${transTitle}</h2>
            <div class="tlc-modal-meta" style="color: #9ca3af; font-size: 0.75rem; margin-top: 4px;"><time>${currentMilestoneObj.year}</time></div>
            <img class="tlc-modal-img mt-3 rounded-xl max-h-48 w-full object-cover" src="${currentMilestoneObj.image}" alt="" onerror="this.style.display='none'">
            <div class="tlc-modal-desc mt-3 leading-relaxed text-gray-200" style="font-size: 0.8rem;">${transExcerpt}</div>
            <div class="tlc-modal-stat mt-4 bg-red-950/20 border border-red-500/20 p-3 rounded-xl">
                <span class="tlc-mdl-stat-label text-gray-400 block font-bold text-[10px]">عدد الشهداء:</span>
                <span class="tlc-mdl-stat-num text-red-400 font-black text-sm">${transStat}</span>
                <p class="tlc-mdl-stat-exp text-gray-300 mt-1" style="font-size: 0.75rem;">${transStatExp}</p>
            </div>
            <div class="tlc-modal-source mt-4 border-t border-white/10 pt-2 text-[10px] text-gray-500">
                <span>${t.source || 'المصدر:'}</span>
                <a href="${currentMilestoneObj.sourceUrl || 'https://www.palquest.org/'}" target="_blank" class="text-red-400 underline">${currentMilestoneObj.sourceName || 'الموسوعة التفاعلية بالقضية الفلسطينية'}</a>
            </div>
        </div>
    `;
}

// تحميل البيانات الافتراضية عند البدء
$(document).ready(() => {
    initAdaptiveTheme();

    // Determine active mode dynamically based on page url
    const path = window.location.pathname;
    let activeMode = 'souls';
    if (path.includes('journalists.html')) activeMode = 'journalists';
    else if (path.includes('westbank.html')) activeMode = 'westbank';
    else if (path.includes('martyrs48.html')) activeMode = 'martyrs48';
    else if (path.includes('milestones.html')) activeMode = 'milestones';
    else if (path.includes('stats.html')) activeMode = 'stats';
    else if (path.includes('map.html')) activeMode = 'map';

    // Auto translate to user preferred system language
    changeLanguage(currentLang);

    switchMainMode(activeMode);
    if (typeof window.initOnThisDayWidget === 'function') { window.initOnThisDayWidget(); }

    // Check for Map-to-Milestone deep linking parameters
    if (activeMode === 'milestones') {
        const urlParams = new URLSearchParams(window.location.search);
        const milestoneParam = urlParams.get('milestone');
        if (milestoneParam) {
            const foundMilestone = milestoneCinematicData.find(m => m.id === milestoneParam);
            if (foundMilestone) {
                setTimeout(() => {
                    const element = document.getElementById(milestoneParam);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    openMilestoneModal(foundMilestone);
                }, 600);
            }
        }
    }
});
