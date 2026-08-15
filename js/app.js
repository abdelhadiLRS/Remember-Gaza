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
let gazaSouls = [];
let journalistsData = [];
let width, height, points = [];
let cachedItems = []; // 2. التخزين المؤقت للإحداثيات والخصائص
let isDirty = true;   // 1. نظام إعادة الرسم المشروط (Dirty Flag)
let currentMainMode = 'home';
let map = null;
let markersLayer = null;
let nakbaVillages = [];
let mapMarkers = [];
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
    isDirty = true;
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

// Language Dropdown Global Toggle
window.toggleLanguageDropdown = function(e) {
    if (e) e.stopPropagation();
    if (window.i18n && typeof window.i18n.toggleLanguageDropdown === 'function') {
        window.i18n.toggleLanguageDropdown(e);
    } else {
        const menu = document.getElementById('language-dropdown-menu');
        if (menu) {
            menu.classList.toggle('hidden');
        }
    }
};

window.closeLanguageDropdown = function() {
    if (window.i18n && typeof window.i18n.closeLanguageDropdown === 'function') {
        window.i18n.closeLanguageDropdown();
    }
    const menu = document.getElementById('language-dropdown-menu');
    if (menu) {
        menu.classList.add('hidden');
        menu.style.display = 'none';
    }
};

document.addEventListener('click', (e) => {
    const container = document.getElementById('language-dropdown-container');
    if (container && container.contains(e.target)) return;
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
    setInnerText('donate-desktop', t.donate);
    setInnerText('dev-text', t.devText);
    setInnerText('share-btn-text', t.shareBtn);
    setInnerText('martyrs-label', t.martyrsLabel);

    updateMusicButton();
    isDirty = true;
}

window.shareSite = function(){
    navigator.clipboard.writeText(window.location.href).then(() => alert('تم نسخ رابط المنصة بنجاح!'));
};

function initMapIfNeeded() {
    if (!map) {
        const container = document.getElementById('map-element') || document.getElementById('map');
        if (container) {
            map = L.map(container, { minZoom: 7 }).setView([31.95, 35.15], 8);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© OpenStreetMap contributors © CARTO',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(map);
            markersLayer = L.layerGroup().addTo(map);
        }
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
    const t = translations[currentLang] || translations.ar;

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
    filtered.forEach((v) => {
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
            const popupContent = `
                <div class="p-2.5 text-right font-['Cairo'] text-xs text-white bg-neutral-900/95 border border-red-600/30 rounded-lg max-w-[200px]">
                    <h4 class="font-bold text-red-400 text-sm mb-1">🇵🇸 ${v.name}</h4>
                    <p class="text-gray-300 mb-1"><strong>سنة التهجير:</strong> ${v.year}</p>
                    <p class="text-gray-300"><strong>المصير:</strong> ${fateAr}</p>
                </div>
            `;
            marker.bindPopup(popupContent);
            marker.addTo(markersLayer);

            mapMarkers.push({ name: v.name.toLowerCase(), marker: marker, lat: v.lat, lng: v.lng });
        }

        html += `
            <div class="map-item bg-black/40 border border-white/5 hover:border-red-500/30 p-2.5 rounded-xl cursor-pointer transition-all hover:bg-black/60 text-right" onclick="focusMapMarker(${v.lat}, ${v.lng}, '${v.name}')">
                <div class="font-bold text-xs text-white">${v.name}</div>
                <div class="text-[10px] text-gray-400 font-mono mt-1">الوضع: <span class="text-red-400">${v.fate} (${v.year})</span></div>
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

if (window.cardsEngine) {
    window.cardsEngine.registerData(westBankMartyrsData);
    window.cardsEngine.registerData(martyrs48Data);
}

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

    // Restrict Family Galaxies gathering features strictly to Gaza Souls (home)
    const corridorsBtn = document.getElementById('corridors-toggle-btn');
    if (mode === 'home' || mode === 'souls') {
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

    if (mode === 'map') {
        if (nakbaVillages.length === 0) {
            loadMapData();
        } else {
            renderMapAndList();
        }
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 200);
    }
};

function fetchAndRenderData(url) {
    $.getJSON(url)
        .done(data => {
            let list = data || [];
            if (url.includes('journalists')) {
                journalistsData = applyApprovedSubmissions(list);
                if (window.cardsEngine) window.cardsEngine.registerData(journalistsData);
                renderTributeCards('journalists-cards-container', journalistsData);
            } else {
                gazaSouls = applyApprovedSubmissions(list);
                if (window.cardsEngine) window.cardsEngine.registerData(gazaSouls);
                document.getElementById('number').innerText = gazaSouls.length.toLocaleString();
                initCanvasPoints(gazaSouls);
            }
            isDirty = true;
        })
        .fail((jqxhr, textStatus, error) => {
            console.error('Failed to load data from:', url, error);
        });
}

function searchMartyrByName(query) {
    currentSearchQuery = query.trim().toLowerCase();
    isDirty = true;

    const dropdown = document.getElementById('search-results-dropdown');
    if (!dropdown) return;

    if (currentSearchQuery.length < 2) {
        dropdown.innerHTML = '';
        dropdown.classList.add('hidden');
        return;
    }

    const matches = gazaSouls.filter(person => {
        const nameAr = (person.name_ar || person.name || "").toLowerCase();
        const nameEn = (person.en_name || person.name_en || person.english_name || "").toLowerCase();
        const id = (person.id || person.id_number || "").toString().toLowerCase();
        const city = (person.city || person.district || person.governorate || "").toLowerCase();
        return nameAr.includes(currentSearchQuery) ||
               nameEn.includes(currentSearchQuery) ||
               id.includes(currentSearchQuery) ||
               city.includes(currentSearchQuery);
    }).slice(0, 15);

    if (matches.length === 0) {
        const noResultsText = window.i18n ? window.i18n.t('no_results', 'لم يتم العثور على نتائج مطابقة') : 'لم يتم العثور على نتائج مطابقة';
        dropdown.innerHTML = `<div class="p-3 text-center text-gray-400 text-sm font-semibold">${noResultsText}</div>`;
    } else {
        let html = '';
        matches.forEach(person => {
            let displayName = person.name || person.name_ar || person.en_name || 'شهيد مجهول';
            let subtitle = person.en_name || person.name_en || person.english_name || '';

            html += `
                <div class="search-result-item p-2.5 hover:bg-red-950/40 border-b border-white/5 cursor-pointer flex justify-between items-center transition-all" onclick="selectSearchMartyr(${JSON.stringify(person).replace(/"/g, '&quot;')})">
                    <div class="text-right flex-1">
                        <div class="font-bold text-white">${displayName}</div>
                        ${subtitle ? `<div class="text-[10px] text-gray-400 font-mono">${subtitle}</div>` : ''}
                    </div>
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
    if (window.cardsEngine) window.cardsEngine.showMartyrCard(person);
};

// Canvas Particle Rendering Engine
function extractFamilyName(fullName) {
    if (!fullName) return "";
    let clean = fullName.replace(/[^\u0621-\u064A\s]/g, "").trim();
    let parts = clean.split(/\s+/);
    if (parts.length < 2) return "";
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

    let rotationDir = (info.hue % 2 === 0) ? 1 : -1;
    let rotationSpeed = 0.0002 + (info.hue % 4) * 0.0001;
    let galaxyRotation = rotationDir * rotationSpeed * time;

    let armCount = (info.hue % 2 === 0) ? 2 : 3;
    let armIndex = k % armCount;

    let maxRadius = 15 + Math.sqrt(N) * 6;
    let progress = k / N;
    let theta = progress * Math.PI * 2.5;

    let baseRadius = 5 + Math.pow(progress, 0.7) * maxRadius;
    let angle = theta + (armIndex * (Math.PI * 2 / armCount)) + galaxyRotation;

    let dispersion = (0.15 + progress * 0.3) * baseRadius;
    let dispHashX = Math.sin(k * 13) * dispersion;
    let dispHashY = Math.cos(k * 17) * dispersion;

    let targetX = cX + Math.cos(angle) * baseRadius + dispHashX;
    let targetY = cY + Math.sin(angle) * baseRadius + dispHashY;

    let starColor = '#ffffff';
    if (baseRadius < 18) {
        starColor = `hsl(180, 100%, 90%)`;
    } else {
        let colorNoise = Math.abs(Math.sin(k * 31));
        if (colorNoise < 0.22) {
            starColor = `hsl(342, 95%, 62%)`;
        } else if (colorNoise < 0.55) {
            starColor = `hsl(195, 95%, 72%)`;
        } else if (colorNoise < 0.8) {
            starColor = `hsl(180, 30%, 95%)`;
        } else {
            starColor = info.color;
        }
    }

    return { x: targetX, y: targetY, color: starColor };
}

function initCanvasPoints(dataList) {
    width = window.innerWidth;
    height = window.innerHeight;
    const displayList = dataList.slice(0, 15000);

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

    recalculateCache();
}

function recalculateCache() {
    width = window.innerWidth;
    height = window.innerHeight;

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

    familyGroups = {};
    cachedItems.forEach(p => {
        let fam = extractFamilyName(p.name);
        if (fam && fam.length > 2) {
            if (!familyGroups[fam]) familyGroups[fam] = [];
            familyGroups[fam].push(p);
        }
    });

    familyCenters = {};
    const minFamilySize = 3;
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

        const angle = idx * 2.39996;
        const spacing = 0.05 + (idx * 0.001);
        const radius = Math.sqrt(idx + 1) * spacing;

        const aspect = width / height;
        let xNorm = 0.5 + Math.cos(angle) * radius;
        let yNorm = 0.5 + Math.sin(angle) * radius * (aspect < 1 ? 1 : 1 / aspect);

        xNorm = Math.max(0.12, Math.min(0.88, xNorm));
        yNorm = Math.max(0.12, Math.min(0.88, yNorm));

        familyCenters[famName] = { xNorm, yNorm, color, hue };
    });

    isDirty = true;
}

const canvas = document.getElementById('stars-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

let culledRects = [];
let lastCullUpdate = 0;
function updateCulledRects() {
    culledRects = [];
    const selectors = ['.glass-panel', '.slidetabs-nav', '#bottom-bar', '#counter-box', '#visitor-counter-box', '.tlc-panel', '.modal-box'];
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

const shootingCanvas = document.getElementById('shooting-stars-canvas');
const shootingCtx = shootingCanvas ? shootingCanvas.getContext('2d') : null;
let shootingStars = [];

function createShootingStar() {
    return {
        x: Math.random() * width * 1.2,
        y: Math.random() * height * 0.4,
        length: Math.random() * 90 + 60,
        speed: Math.random() * 1.2 + 0.8,
        opacity: 0,
        fadeState: 'in'
    };
}

function updateAndDrawShootingStars() {
    if (!shootingCtx) return;
    shootingCtx.clearRect(0, 0, width, height);

    if (shootingStars.length < 5 && Math.random() < 0.02) {
        shootingStars.push(createShootingStar());
    }

    for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];
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

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    isDirty = true;
});

function drawCanvas() {
    if (!ctx) {
        requestAnimationFrame(drawCanvas);
        return;
    }
    if (!isDirty) {
        requestAnimationFrame(drawCanvas);
        return;
    }

    const nowCull = Date.now();
    if (nowCull - lastCullUpdate > 250) {
        updateCulledRects();
        lastCullUpdate = nowCull;
    }

    ctx.clearRect(0, 0, width, height);
    const queryActive = currentSearchQuery.length >= 2;

    const driftSpeed = 0.04;
    const lerpSpeed = 0.06;
    const time = Date.now();

    for (let i = 0; i < cachedItems.length; i++) {
        const item = cachedItems[i];
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

        item.screenX += (targetX - item.screenX) * lerpSpeed;
        item.screenY += (targetY - item.screenY) * lerpSpeed;
        item.renderedColor = targetColor;
    }

    // Draw particle stars
    ctx.fillStyle = queryActive ? 'rgba(239, 68, 68, 0.15)' : '#ef4444';
    ctx.beginPath();
    for (let i = 0; i < cachedItems.length; i++) {
        const item = cachedItems[i];
        if (item.screenX < -10 || item.screenX > width + 10 || item.screenY < -10 || item.screenY > height + 10) continue;
        if (isInsideCulledRect(item.screenX, item.screenY)) continue;

        if (item.color === '#ef4444') {
            ctx.moveTo(item.screenX + item.radius, item.screenY);
            ctx.arc(item.screenX, item.screenY, item.radius, 0, Math.PI * 2);
        }
    }
    ctx.fill();

    ctx.fillStyle = queryActive ? 'rgba(255, 255, 255, 0.15)' : '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < cachedItems.length; i++) {
        const item = cachedItems[i];
        if (item.screenX < -10 || item.screenX > width + 10 || item.screenY < -10 || item.screenY > height + 10) continue;
        if (isInsideCulledRect(item.screenX, item.screenY)) continue;

        if (item.color === '#ffffff') {
            ctx.moveTo(item.screenX + item.radius, item.screenY);
            ctx.arc(item.screenX, item.screenY, item.radius, 0, Math.PI * 2);
        }
    }
    ctx.fill();

    // Hover tooltip
    let hoveredMartyr = null;
    for (let i = 0; i < cachedItems.length; i++) {
        const item = cachedItems[i];
        if (isInsideCulledRect(item.screenX, item.screenY)) continue;
        const dx = mouseX - item.screenX;
        const dy = mouseY - item.screenY;
        if (dx * dx + dy * dy < 100) {
            hoveredMartyr = item;
            break;
        }
    }

    const tooltip = document.getElementById('star-tooltip');
    if (hoveredMartyr && tooltip) {
        currentMartyrObj = hoveredMartyr;
        document.getElementById('tooltip-name').innerText = hoveredMartyr.name;
        document.getElementById('tooltip-age').innerText = `العمر: ${hoveredMartyr.age}`;
        tooltip.style.display = 'block';
        tooltip.style.left = (mouseX + 15) + 'px';
        tooltip.style.top = (mouseY + 15) + 'px';
    } else if (tooltip) {
        tooltip.style.display = 'none';
    }

    updateAndDrawShootingStars();
    isDirty = true;
    requestAnimationFrame(drawCanvas);
}

requestAnimationFrame(drawCanvas);

// On Page Ready Bootstrapper
$(document).ready(() => {
    initAdaptiveTheme();

    // 1. Load Gaza Souls dataset for Canvas & counter
    fetchAndRenderData('./data/victims.json');

    // 2. Load Journalists dataset
    fetchAndRenderData('./data/journalists.json');

    // 3. Render West Bank & 1948 Martyrs Cards
    renderTributeCards('wb-cards-container', applyApprovedSubmissions(westBankMartyrsData));
    renderTributeCards('m48-cards-container', applyApprovedSubmissions(martyrs48Data));

    // 4. Render Historical Milestones Scrollytelling Timeline
    renderCinematicTimeline();

    // 5. Initialize Leaflet Map
    loadMapData();
});
