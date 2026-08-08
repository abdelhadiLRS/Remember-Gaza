
let currentLang='ar';
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
let hideNonMatching = true;

window.PalestinianSoulsAPI = {
    getMartyrs: function() {
        return gazaSouls || [];
    },
    getStats: function() {
        return {
            documented_count: gazaSouls ? gazaSouls.length : 60198,
            gaza_total_estimated: 186000,
            direct_damage_est: "80 Billion USD",
            demolished_units: 335000,
            hospitals_destroyed: 38
        };
    },
    addMartyr: function(martyr) {
        if (!martyr || !martyr.name) {
            console.error("Invalid martyr data. Must include name.");
            return false;
        }
        const newObj = {
            id: martyr.id || "api_added_" + Date.now(),
            name: martyr.name,
            name_ar: martyr.name_ar || martyr.name,
            name_en: martyr.name_en || "",
            age: martyr.age || "غير معروف",
            city: martyr.city || "غزة",
            notes: martyr.notes || "تمت الإضافة عبر واجهة المطورين البرمجية",
            x: Math.random(),
            y: Math.random()
        };

        gazaSouls.unshift(newObj);

        const numEl = document.getElementById('number');
        if (numEl) numEl.innerText = gazaSouls.length.toLocaleString();

        initCanvasPoints(gazaSouls);
        isDirty = true;

        console.log("Successfully added new martyr to the live celestial archive:", newObj);
        return newObj;
    },
    getMapPoints: function() {
        return nakbaVillages || [];
    },
    getVideos: function() {
        return visualArchiveData || [];
    }
};

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
        noDataText: "لا توجد بيانات حالياً"
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
        noDataText: "No data available currently"
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
        noDataText: "Aucune donnée disponible"
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
        noDataText: "No hay datos disponibles actualmente"
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
        const t = translations[currentLang];
        btn.innerHTML = isPlayingAudio ? t.musicOff : t.musicOn;
        if (isPlayingAudio) btn.classList.add('active');
        else btn.classList.remove('active');
    }
}

const milestoneCinematicData = [
    { id: "d1920", type: "decade", decade: "1920" },
    {
        id: "m18", type: "scene", year: "1929", title: "هبّة البراق", alt: "ثورة البراق", image: "images/timeline/18.jpg",
        excerpt: "في آب/أغسطس 1929 انتفض الفلسطينيون احتجاجاً على محاولات السيطرة على حائط البراق المحاذي للمسجد الأقصى. اندلعت اشتباكات في القدس والخليل الصفد، وردّ الانتداب البريطاني بالقوة المفرطة، واستشهد أكثر من 116 فلسطينياً، وأُعدم ثلاثة من قادة الثورة لاحقاً (محمد جمجوم، فؤاد حجازي، عطا الزير) فخلّدتهم الذاكرة الوطنية.",
        detailedExplanation: "هبّة البراق هي أول انتفاضة فلسطينية شعبية كبرى ضد المحاولات الصهيونية للسيطرة على حائط البراق في القدس المحتلة. تفجرت الأحداث في منتصف آب 1929 بعد تظاهرات صهيونية استفزازية عند الحائط، مما أشعل غضباً جماهيرياً عارماً امتد سريعاً إلى الخليل، يافا، غزة، والصفد. واجهت قوات الانتداب البريطاني الجماهير الفلسطينية الغاضبة بعنف مفرط وقسوة بالغة لحماية الصهاينة، مما أسفر عن استشهاد 116 فلسطينياً وإصابة المئات. لاحقاً في عام 1930، نفذت بريطانيا حكم الإعدام بحق ثلاثة من أبطال الثورة (محمد جمجوم، فؤاد حجازي، وعطا الزير) في سجن عكا الشهير، والذين واجهوا المشنقة ببطولة وبسالة خلدها التاريخ وشعراء فلسطين.",
        stat: "حوالي 116 شهيد",
        statExp: "116 شهيداً فلسطينياً سقطوا خلال الأحداث، إضافة إلى تنفيذ حكم الإعدام بثلاثة من قادة الثورة",
        sourceName: "ويكيبيديا - ثورة البراق 1929",
        sourceUrl: "https://ar.wikipedia.org/wiki/%D8%AB%D9%88%D8%B1%D8%A9_%D8%A9_%D8%A7%D9%84%D8%A8%D8%B1%D8%A7%D9%82"
    },
    { id: "d1930", type: "decade", decade: "1930" },
    {
        id: "m19", type: "scene", year: "1936 - 1939", title: "الثورة الفلسطينية الكبرى", alt: "ثورة الست أشهر", image: "images/timeline/19.jpg",
        excerpt: "انطلقت الثورة الفلسطينية الكبرى في نيسان/أبريل 1936 بإضراب عام شامل امتد ستة أشهر، ثم تحولت إلى مقاومة مسلحة استمرت حتى 1939. استهدفت الانتداب البريطاني والمشروع الصهيوني، وقمعتها بريطانيا بعنف عبر قانون الطوارئ ونسف القرى والإعدامات.",
        detailedExplanation: "تعد الثورة الفلسطينية الكبرى (1936-1939) من أروع وأطول صفحات النضال الوطني الفلسطيني ضد الانتداب البريطاني والمشروع الصهيوني. بدأت الثورة بإعلان اللجنة العربية العليا بقيادة الحاج أمين الحسيني إضراباً عاماً شاملاً استمر لستة أشهر متواصلة وهو أطول إضراب جماعي في التاريخ الحديث. تطورت الثورة لاحقاً إلى مقاومة مسلحة عنيفة غطت جميع المدن والقرى والبلدات الفلسطينية. استخدم الجيش البريطاني أقصى درجات البطش العسكري، بما في ذلك القصف الجوي، نسف منازل وقرى بأكملها، وفرض عقوبات جماعية وإعدامات ميدانية، مما أدى إلى استشهاد أكثر من 5,000 فلسطيني وجرح عشرات الآلاف ونفي القيادات الوطنية.",
        stat: "5,000 شهيد",
        statExp: "آلاف الشهداء والجرحى نتيجة العمليات العسكرية وقمع الاحتلال البريطاني للثورة",
        sourceName: "الموسوعة التفاعلية للقضية الفلسطينية",
        sourceUrl: "https://www.palquest.org/"
    },
    {
        id: "m1", type: "scene", year: "1936 - 1948", title: "مرحلة التطهير العرقي في فلسطين", alt: "النكبة", image: "images/timeline/1.jpg",
        excerpt: "بدأت المجازر الاسرائيلية بحق الفلسطينيين قبل الاعلان عن قيام دولة اسرائيل بنحو 11 عاما منذ كانت فلسطين تحت وصاية الانتداب البريطاني الذي كان يتحمل مسؤولية حماية حياة المواطنين الفلسطينيين.",
        detailedExplanation: "شهدت فلسطين منذ ثلاثينيات القرن الماضي وحتى عام 1948 عملية تهجير قسري وتطهير عرقي ممنهج قادته العصابات الصهيونية المسلحة (مثل الهاغانا، الأرغون، وشتيرن) برعاية وغطاء كامل من الانتداب البريطاني قبل الإعلان الرسمي عن قيام دولة الاحتلال بسنوات. تمثلت هذه المرحلة بشن هجمات ليلية مروعة على القرى الآمنة، زرع المتفجرات في الأسواق المكتظة، وقتل المدنيين لترهيب السكان ودفعهم إلى الرحيل قسراً. شملت هذه المجازر وعمليات التطهير العرقي المبكرة أكثر من 70 بلدة ومدينة فلسطينية ممهدة الطريق لجريمة النكبة الكبرى وتشريد ثلثي الشعب الفلسطيني.",
        stat: "حوالي 5000 شهيد",
        statExp: "ضحايا المجازر وعمليات التطهير العرقي المبكرة قبل عام 1948",
        sourceName: "مؤسسة الدراسات الفلسطينية",
        sourceUrl: "https://www.palquest.org/"
    },
    { id: "d1940", type: "decade", decade: "1940" },
    {
        id: "m20", type: "scene", year: "1948", title: "مجزرة دير ياسين", alt: "", image: "images/timeline/20.jpg",
        excerpt: "في فجر التاسع من نيسان 1948، اقتحمت عصابتا الإرغون وشتيرن قرية دير ياسين غرب القدس وارتكبتا مجزرة وحشية بحق سكانها، شملت إعدامات ميدانية وتمثيلاً بالجثث وتهجيراً.",
        detailedExplanation: "وقعت مجزرة دير ياسين في قرية دير ياسين غرب القدس في 9 نيسان 1948، ونفذتها عصابتا الإرغون وشتيرن الصهيونيتان بدعم من الهاغانا. اقتحم المسلحون الصهاينة القرية الآمنة ونفذوا مجزرة وحشية مروعة شملت إعدامات جماعية ميدانية، التمثيل بالجثث، وبقر بطون الحوامل والنساء العزل. ارتقى في هذه المأساة ما يزيد عن 250 شهيداً فلسطينياً، واستخدمت هذه المجزرة كأداة لبث الرعب ونشر الدعاية الحربية الصهيونية لإجبار القرى والبلدات المجاورة على النزوح قسراً عن أراضيهم ومنازلهم خوفاً من الإبادة الجماعية المباشرة.",
        stat: "254 - 300 شهيد",
        statExp: "أكثر من 250 شهيداً من الأطفال والنساء والرجال عزل الأسلحة",
        sourceName: "ويكيبيديا - مجزرة دير ياسين",
        sourceUrl: "https://ar.wikipedia.org"
    },
    {
        id: "m2", type: "scene", year: "1948", title: "الحرب العربية الإسرائيلية 1948", alt: "حرب النكبة", image: "images/timeline/2.jpg",
        excerpt: "أول حروب العرب مع إسرائيل، دارت عقب إنهاء الانتداب البريطاني على فلسطين وإعلان قيام إسرائيل، منتصف مايو/أيار 1948، وارتقى خلالها آلاف الشهداء.",
        detailedExplanation: "حرب عام 1948 (النكبة) دارت رحاها عقب إعلان قيام دولة إسرائيل وانسحاب بريطانيا، وشاركت فيها جيوش عربية متطوعة لمساندة الشعب الفلسطيني بوجه العصابات الصهيونية المسلحة. تمخضت الحرب عن احتلال الكيان الإسرائيلي لـ 78% من مساحة فلسطين التاريخية، وتدمير 530 بلدة وقرية بالكامل ومسحها من الوجود ومصادرة كل أراضيها، وارتكاب أكثر من 70 مجزرة موثقة بحق المدنيين العزل، ما أسفر عن تهجير وتشريد قرابة مليون فلسطيني خارج أرضهم ليتحولوا إلى لاجئين مشتتين حول العالم متمسكين بمفتاح العودة وحقهم التاريخي.",
        stat: "20 - 22 ألف شهيد",
        statExp: "شهداء المعارك والدفاع عن المدن والقرى الفلسطينية أثناء النكبة",
        sourceName: "الموسوعة التفاعلية للقضية الفلسطينية",
        sourceUrl: "https://www.palquest.org/"
    },
    { id: "d1950", type: "decade", decade: "1950" },
    {
        id: "m4", type: "scene", year: "1956", title: "احتلال غزة 1956", alt: "العدوان الثلاثي", image: "images/timeline/4.jpg",
        excerpt: "خلال العدوان الثلاثيّ على مصر بعد تأميم قناة السويس، احتلّ جيش الاحتلال قطاع غزّة قادماً من رفح، حيث ارتقى مئات الشهداء في مجازر بشعة.",
        detailedExplanation: "خلال العدوان الثلاثي على مصر عام 1956، اجتاح جيش الاحتلال الإسرائيلي قطاع غزة وارتكب فيه مجازر مروعة وسلسلة من جرائم الحرب البشعة بحق المدنيين العزل ورجال المقاومة، لا سيما في مدينتي خان يونس ورفح، حيث جرى تنفيذ إعدامات ميدانية جماعية لآلاف الشباب والرجال ضد الجدران وفي الساحات العامة. استمر هذا الاحتلال الوحشي عدة أشهر مخلفاً أكثر من 1,500 شهيد ودماراً هائلاً في المنازل والممتلكات قبل أن يجبر الجيش الصهيوني على الانسحاب تحت الضغط الدولي.",
        stat: "حوالي 1500 شهيد",
        statExp: "شهداء المجازر في خان يونس ورفح وغزة خلال العدوان",
        sourceName: "أرشيف تاريخ فلسطين - العدوان الثلاثي",
        sourceUrl: "https://ar.wikipedia.org"
    },
    { id: "d1960", type: "decade", decade: "1960" },
    {
        id: "m5", type: "scene", year: "1967", title: "حرب حزيران 1967", alt: "النكسة", image: "images/timeline/5.jpg",
        excerpt: "يطلق مصطلح النكسة على الهزيمة التي منيت بها الجيوش العربية أمام إسرائيل واحتلال كامل فلسطين وأراضٍ سورية ومصرية.",
        detailedExplanation: "حرب الأيام الستة أو النكسة عام 1967 شكلت نقطة تحول مأساوية، حيث احتل الكيان الصهيوني ما تبقى من فلسطين (الضفة الغربية بما فيها القدس الشرقية، وقطاع غزة)، إضافة إلى شبه جزيرة سيناء المصرية وهضبة الجولان السورية. أسفرت الحرب عن استشهاد ما بين 15,000 إلى 25,000 جندي ومواطن عربي وفلسطيني، وتهجير أكثر من 300,000 فلسطيني جديد تحولوا إلى نازحين، وبدء مرحلة الاستيطان والتهويد الممنهج للقدس والمقدسات ومصادرة الأراضي التي لا تزال مستمرة حتى اليوم تحت وطأة الاحتلال العسكري المباشر.",
        stat: "15,000 - 25,000 شهيد",
        statExp: "شهداء العمليات العسكرية والدفاع عن الأراضي العربية والفلسطينية",
        sourceName: "الموسوعة التفاعلية للقضية الفلسطينية",
        sourceUrl: "https://www.palquest.org/"
    },
    { id: "d1970", type: "decade", decade: "1970" },
    {
        id: "m22", type: "scene", year: "1976", title: "يوم الأرض", alt: "", image: "images/timeline/22.jpg",
        excerpt: "هبة جماهيرية فلسطينية شاملة رداً على مصادرة سلطات الاحتلال لآلاف الدونمات من أراضي الجليل والمثلث.",
        detailedExplanation: "في 30 آذار 1976، انتفض الفلسطينيون بالداخل المحتل احتجاجاً على تهويد الجليل ومصادرة آلاف الدونمات من أراضي الجليل والمثلث والنقب. عم الإضراب والاحتجاجات السلمية مختلف البلدات، وواجهها جيش الاحتلال الإسرائيلي بالرصاص الحي وفرض حظر التجول، ما أسفر عن ارتقاء ستة شهداء أبطال في سخنين وعرابة وكفر كنا وإصابة واعتقال المئات. تحول هذا اليوم التاريخي إلى ذكرى سنوية جامعة ومقدسة تخلد التحام الهوية بالتراب والوجود الفلسطيني وصموده الأزلي بوجه الاقتلاع والتهجير.",
        stat: "6 شهداء",
        statExp: "ستة شهداء سقطوا دفاعاً عن الأرض في أراضي الداخل المحتل عام 1948",
        sourceName: "تقارير توثيقية فلسطينية",
        sourceUrl: "https://ar.wikipedia.org"
    },
    { id: "d1980", type: "decade", decade: "1980" },
    {
        id: "m11", type: "scene", year: "1987", title: "الانتفاضة الفلسطينية الأولى", alt: "انتفاضة الحجارة", image: "images/timeline/11.jpg",
        excerpt: "هبة شعبية كبرى انطلقت من مخيم جباليا في قطاع غزة وامتدت لكافة المدن والقرى الفلسطينية.",
        detailedExplanation: "انتفاضة الحجارة عام 1987 هي ثورة شعبية عارمة تفجرت في مخيم جباليا لتبث الروح الكفاحية في كل شبر من أراضي فلسطين التاريخية المحتلة. تفجرت الأحداث إثر إقدام مستوطن على دهس مجموعة عمال فلسطينيين بشاحنته. تميزت الانتفاضة بمشاركة شعبية شاملة، من أطفال يرمون دبابات الاحتلال بالحجارة وعصيان مدني شامل ومقاطعة البضائع الإسرائيلية. ارتكب الاحتلال جرائم وحشية وسياسات قمع مفرطة مثل 'تكسير العظام'، واستشهد خلالها أكثر من 1,300 فلسطيني وجرح وأسر عشرات الآلاف.",
        stat: "أكثر من 1300 شهيد",
        statExp: "شهداء رصاص الاحتلال والمواجهات الشعبية والحجارة خلال الانتفاضة الأولى",
        sourceName: "مركز المعلومات الوطني الفلسطيني (وفا)",
        sourceUrl: "https://www.wafa.ps/"
    },
    { id: "d1990", type: "decade", decade: "1990" },
    {
        id: "m25", type: "scene", year: "1994", title: "مجزرة الحرم الإبراهيمي", alt: "", image: "images/timeline/25.jpg",
        excerpt: "إطلاق نار متطرف داخل الحرم الإبراهيمي الشريف في مدينة الخليل أثناء صلاة الفجر.",
        detailedExplanation: "في فجر يوم الجمعة 25 شباط 1994، اقتحم المستوطن الإرهابي والطبيب العسكري باروخ غولدشتاين المسجد الإبراهيمي في الخليل بتواطؤ وتسهيل من جنود الاحتلال. فتح المجرم نيران بندقيته الرشاشة باتجاه المئات من المصلين الركوع السجود أثناء صلاة الفجر بدم بارد. ارتقى 29 شهيداً داخل المسجد على الفور قبل أن ينقض المصلون عليه ويقضون عليه، وتلا ذلك مواجهات عارمة في الخليل وفلسطين ارتقى فيها عشرات الشهداء الآخرين، وعاقب الاحتلال الضحايا بتقسيم المسجد الإبراهيمي وإغلاق قلب مدينة الخليل.",
        stat: "29 شهيداً",
        statExp: "29 شهيداً ارتقوا داخل المسجد أثناء صلاة الفجر",
        sourceName: "ويكيبيديا والموسوعة التفاعلية",
        sourceUrl: "https://ar.wikipedia.org"
    },
    { id: "d2000", type: "decade", decade: "2000" },
    {
        id: "m12", type: "scene", year: "2000", title: "الانتفاضة الفلسطينية الثانية", alt: "انتفاضة الأقصى", image: "images/timeline/12.jpg",
        excerpt: "اندلعت عقب اقتحام أرييل شارون للمسجد الأقصى، وشهدت مواجهات مسلحة واجتياحات واسعة لمدن الضفة وغزة.",
        detailedExplanation: "انتفاضة الأقصى اندلعت في 28 أيلول 2000 عقب اقتحام المجرم أرييل شارون لساحات المسجد الأقصى المبارك مستفزاً مشاعر المسلمين والفلسطينيين. تطورت الاحتجاجات السلمية بسرعة إلى انتفاضة مسلحة دامت عدة سنوات بوجه القوة الصهيونية الباطشة. شهدت الانتفاضة تدمير واجتياح مخيم جنين، ومحاصرة الرئيس ياسر عرفات في المقاطعة برام الله، واغتيال الطائرات لكبار القادة واجتياح مدن وقرى الضفة وغزة بالكامل، مخلفة أكثر من 4,400 شهيد فلسطيني وعشرات الآلاف من الجرحى والأسرى البواسل.",
        stat: "آلاف الشهداء",
        statExp: "أكثر من 4000 شهيد وثقتهم السجلات الرسمية خلال انتفاضة الأقصى",
        sourceName: "مركز المعلومات الوطني الفلسطيني (وفا)",
        sourceUrl: "https://www.wafa.ps/"
    },
    { id: "d2010", type: "decade", decade: "2010" },
    {
        id: "m15", type: "scene", year: "2014", title: "الجرف الصامد", alt: "حرب غزة 2014", image: "images/timeline/15.jpg",
        excerpt: "حرب مدمرة استمرت 51 يوماً ضد قطاع غزة، وشهدت مجازر مروعة بحق العائلات وتدميراً واسعاً.",
        detailedExplanation: "العدوان العسكري الواسع النطاق على قطاع غزة عام 2014 استمر 51 يوماً وأسفر عن تدمير هائل وإبادة عائلات بأكملها. أطلقت دبابات وطائرات الاحتلال مئات الآلاف من القذائف الحربية، مرتكبة مجازر رهيبة في حي الشجاعية ورفح وخزاعة ومسحت أحياء ومربعات سكنية كاملة من الوجود، مخلفة ما يزيد عن 2,200 شهيد معظمهم أطفال ونساء، ومسح أكثر من 144 عائلة بأكملها من السجلات المدنية وشلت مرافق الحياة تماماً وسط صمود تاريخي للقطاع.",
        stat: "2,200+ شهيد",
        statExp: "أكثر من 2200 شهيد بينهم مئات الأطفال والنساء وعائلات بأكملها مسحت من السجل المدني",
        sourceName: "الجهاز المركزي للإحصاء الفلسطيني",
        sourceUrl: "https://www.pcbs.gov.ps/"
    },
    { id: "d2020", type: "decade", decade: "2020" },
    {
        id: "m30", type: "scene", year: "2023 - 2026", title: "طوفان الأقصى والعدوان الشامل", alt: "حرب الإبادة", image: "images/timeline/30.jpg",
        excerpt: "الملحمة التاريخية الكبرى وطوفان الأقصى وما تلاه من حرب إبادة جماعية وعدوان غير مسبوق على قطاع غزة والضفة والمنطقة.",
        detailedExplanation: "الملحمة التاريخية وحرب الإبادة المستمرة منذ السابع من أكتوبر، حيث يتعرض قطاع غزة والكل الفلسطيني لأبشع إبادة جماعية وتطهير عرقي وجغرافي في العصر الحديث. انطلقت معركة طوفان الأقصى رداً على الحصار والانتهاكات المستمرة للمسجد الأقصى والقدس، فقابلها الاحتلال بالقمع والإبادة الشاملة والتجويع المتعمد ملقياً مئات آلاف الأطنان من المتفجرات الكيميائية والحارقة على رؤوس المدنيين، ومدمراً المستشفيات والمدارس ودور العبادة، ليتخطى أعداد الشهداء والمفقودين والجرحى حاجز الـ 200 ألف معظمهم من الأطفال والرضع والنساء والكوادر الطبية والإعلامية في ملحمة صمود أسطورية ترويها الأجيال.",
        stat: "عشرات الآلاف من الشهداء",
        statExp: "أكثر من 158,000 إلى 291,000 شهيد ومفقود وجريح ومستشهد تحت الأنقاض وفي حرب الإبادة الجماعية المستمرة",
        sourceName: "الجهاز المركزي للإحصاء الفلسطيني وتقارير الأمم المتحدة",
        sourceUrl: "https://www.pcbs.gov.ps/"
    }
];

function changeLanguage(langCode) {
    if (!translations[langCode]) langCode = 'ar';
    currentLang = langCode;
    localStorage.setItem('site_lang', langCode);
    const t = translations[currentLang];

    document.getElementById('html-root').lang = currentLang;
    document.getElementById('html-root').dir = (currentLang === 'ar') ? 'rtl' : 'ltr';
    document.getElementById('language-select').value = currentLang;

    document.getElementById('title-main').innerText = t.titleMain;
    document.getElementById('logo-text').innerText = t.logoText;
    document.getElementById('search-input').placeholder = t.searchPlaceholder;
    document.getElementById('tab-souls').innerText = t.tabSouls;
    document.getElementById('tab-journalists').innerText = t.tabJournalists;
    document.getElementById('tab-westbank').innerText = t.tabWestBank;
    document.getElementById('tab-48').innerText = t.tab48;
    document.getElementById('tab-milestones').innerText = t.tabMilestones;
    document.getElementById('tab-stats').innerText = t.tabStats;
    document.getElementById('tab-videos').innerText = t.tabVideos;
    document.getElementById('tab-map').innerText = t.tabMap;
    document.getElementById('donate-desktop').innerText = t.donate;
    document.getElementById('verse-text').innerText = t.verse;
    document.getElementById('dev-text').innerText = t.devText;
    document.getElementById('share-btn-text').innerText = t.shareBtn;
    document.getElementById('martyrs-label').innerText = t.martyrsLabel;

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
        <div class="tlc-modal-content text-right text-xs">
            <div class="flex items-center gap-2 mb-2">
                <span style="background: #ef4444; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; font-family: 'Cairo';">${item.year}</span>
                <span style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: bold; font-family: 'Cairo';">محطة تاريخية بارزة</span>
            </div>
            <h2 class="tlc-modal-title" style="font-size: 1.4rem; font-weight: 900; color: #ef4444; line-height: 1.4; margin-bottom: 8px;">${item.title} ${item.alt ? `<span class="tlc-mdl-alt text-gray-400 text-sm font-medium">(${item.alt})</span>` : ''}</h2>

            <img class="tlc-modal-img rounded-xl max-h-56 w-full object-cover border border-red-500/30 shadow-lg" src="${item.image}" alt="" onerror="this.style.display='none'">

            <div class="tlc-modal-desc mt-4 leading-relaxed text-gray-100" style="font-size: 0.9rem; border-right: 3px solid #ef4444; padding-right: 12px; margin-bottom: 12px;">
                <strong>لمحة عامة:</strong><br>
                ${item.excerpt}
            </div>

            ${item.detailedExplanation ? `
            <div class="tlc-modal-detailed-explanation mt-4 p-4 bg-black/40 rounded-xl border border-white/5 leading-relaxed text-gray-300" style="font-size: 0.85rem; text-align: justify;">
                <h4 class="font-bold text-red-400 mb-2 flex items-center gap-1.5" style="font-size: 0.95rem;">📖 تفاصيل الحدث وشرحه التاريخي الموثق:</h4>
                <p style="text-indent: 15px;">${item.detailedExplanation}</p>
            </div>
            ` : ''}

            <div class="tlc-modal-stat mt-4 bg-red-950/20 border border-red-500/20 p-4 rounded-xl flex flex-col gap-1">
                <span class="tlc-mdl-stat-label text-gray-400 block font-bold text-[10px] tracking-wider uppercase">📊 الإحصائيات والأثر البشري الموثق:</span>
                <span class="tlc-mdl-stat-num text-red-400 font-black text-lg">${item.stat}</span>
                <p class="tlc-mdl-stat-exp text-gray-300 mt-1" style="font-size: 0.8rem; line-height: 1.4;">${item.statExp || item.excerpt}</p>
            </div>

            <div class="tlc-modal-source mt-4 border-t border-white/10 pt-3 text-[11px] text-gray-500 flex justify-between items-center">
                <span>📚 <strong>${t.source || 'المصدر التوثيقي:'}</strong> <a href="${item.sourceUrl || 'https://www.palquest.org/'}" target="_blank" class="text-red-400 hover:underline inline-flex items-center gap-0.5">${item.sourceName || 'الموسوعة التفاعلية للقضية الفلسطينية'} 🔗</a></span>
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

const enrichedMapData = [
    { id: "deir-yassin", name: "دير ياسين (Deir Yassin)", year: 1948, fate: "Massacre", lat: 31.7868, lng: 35.1784, desc: "مجزرة وحشية وتطهير عرقي ارتكبته الجماعات الإرهابية الصهيونية (الأرغون وشتيرن).", linkedMilestoneId: "m20" },
    { id: "tantura", name: "الطنطورة (Tantura)", year: 1948, fate: "Massacre", lat: 32.61, lng: 34.93, desc: "مجزرة بشعة وتصفية مئات المدنيين العزل من أهالي القرية الساحلية.", linkedMilestoneId: "m1" },
    { id: "al-majdal", name: "المجدل عسقلان (Al-Majdal)", year: 1948, fate: "Depopulated", lat: 31.6676, lng: 34.5657, desc: "مدينة كنعانية تاريخية جرى تهجير سكانها بالكامل وتحويلها لمدينة عسكرية للاحتلال.", linkedMilestoneId: "m2" },
    { id: "lifta", name: "لفتا (Lifta)", year: 1948, fate: "Depopulated", lat: 31.7916, lng: 35.1958, desc: "درة القرى الفلسطينية المهجرة بالقدس، لا تزال منازلها الحجرية ونبع مياهها شاهداً على الهوية والتاريخ.", linkedMilestoneId: "m2" },
    { id: "ein-karem", name: "عين كارم (Ein Karem)", year: 1948, fate: "Depopulated", lat: 31.7614, lng: 35.1654, desc: "بلدة مقدسية عريقة، مهد ولادة يوحنا المعمدان، جرى تهجير أهلها قسراً ومصادرة بيوتهم الأثرية.", linkedMilestoneId: "m2" },
    { id: "saffuriyya", name: "صفورية (Saffuriyya)", year: 1948, fate: "Depopulated", lat: 32.7469, lng: 35.2788, desc: "قرية تاريخية كبرى في الجليل الغربي، هُجّر أهلها بالكامل وقُصفت بالطائرات.", linkedMilestoneId: "m2" },
    { id: "beersheba", name: "بئر السبع (Beersheba)", year: 1948, fate: "Depopulated", lat: 31.2525, lng: 34.7915, desc: "عاصمة النقب التاريخية، جرى تهجير عشائرها العربية البدوية وسلب أراضيهم الشاسعة.", linkedMilestoneId: "m2" },
    { id: "kufr-qasem", name: "كفر قاسم (Kufr Qasem)", year: 1956, fate: "Massacre", lat: 32.115, lng: 34.975, desc: "مجزرة ارتكبها حرس الحدود الإسرائيلي ضد العمال الفلاحين العائدين لقريتهم أثناء حظر التجوال المفاجئ.", linkedMilestoneId: "m4" },
    { id: "sabra-shatila", name: "صبرا وشاتيلا (Sabra & Shatila)", year: 1982, fate: "Massacre", lat: 33.865, lng: 35.485, desc: "مجزرة دموية وحشية استمرت ثلاثة أيام بحق اللاجئين الفلسطينيين في مخيمات صبرا وشاتيلا بلبنان بتسهيل من جيش الاحتلال.", linkedMilestoneId: "m11" },
    { id: "jenin-camp", name: "مخيم جنين (Jenin Camp)", year: 2002, fate: "Massacre", lat: 32.462, lng: 35.286, desc: "اجتياح ومجزرة مخيم جنين الشهيرة التي قادها جيش الاحتلال الإسرائيلي مسفراً عن تدمير المخيم بالكامل واستشهاد العشرات.", linkedMilestoneId: "m12" },
    { id: "shuja-iyya", name: "حي الشجاعية غزة (Shuja'iyya)", year: 2014, fate: "Massacre", lat: 31.503, lng: 34.482, desc: "قصف مدفعي مروع وجوي أباد أحياء بأكملها في غزة واستشهد فيه المئات في ليلة واحدة.", linkedMilestoneId: "m15" },
    { id: "rafah-tents", name: "خيام النازحين رفح (Rafah)", year: 2024, fate: "Massacre", lat: 31.296, lng: 34.242, desc: "مجزرة خيام النازحين المروعة في تل السلطان برفح بالقنابل الحارقة التي هزت الضمير الإنساني.", linkedMilestoneId: "m30" }
];

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
                    lng: f.geometry.coordinates[0],
                    desc: f.properties.desc || ''
                }));
                // Combine with our enriched data to maximize depth
                enrichedMapData.forEach(item => {
                    if (!nakbaVillages.find(v => v.id === item.id)) {
                        nakbaVillages.push(item);
                    }
                });
            } else {
                nakbaVillages = enrichedMapData;
            }
            renderMapAndList();
        })
        .fail(err => {
            console.log("Failed to load Nakba villages GeoJSON, using robust fallback:", err);
            nakbaVillages = enrichedMapData;
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
        const desc = (v.desc || '').toLowerCase();
        return name.includes(query) || fate.includes(query) || desc.includes(query);
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
                radius: 8,
                fillColor: '#ef4444',
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
            });

            const fateAr = v.fate === 'Massacre' ? 'مجزرة وحشية' : 'قرية مهجرة بالكامل';
            const linkButton = v.linkedMilestoneId ? `
                <button onclick="window.openLinkedMilestone('${v.linkedMilestoneId}')" class="mt-2.5 w-full py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded-lg transition-all flex items-center justify-center gap-1 shadow-md">
                    📖 اقرأ تفاصيل هذا الحدث التاريخي
                </button>
            ` : '';
            const popupContent = `
                <div class="p-3.5 text-right font-['Cairo'] text-xs text-white bg-neutral-950 border border-red-500/30 rounded-xl max-w-[250px] shadow-2xl">
                    <h4 class="font-bold text-red-500 text-sm mb-1.5">🇵🇸 ${v.name}</h4>
                    <p class="text-gray-300 mb-1"><strong>سنة الحدث:</strong> ${v.year}</p>
                    <p class="text-gray-300 mb-2"><strong>المصير والوضع:</strong> ${fateAr}</p>
                    ${v.desc ? `<p class="text-[10px] text-gray-400 leading-relaxed border-t border-white/5 pt-1.5 mt-1.5">${v.desc}</p>` : ''}
                    ${linkButton}
                </div>
            `;
            marker.bindPopup(popupContent);
            marker.addTo(markersLayer);

            mapMarkers.push({ name: v.name.toLowerCase(), marker: marker, lat: v.lat, lng: v.lng });
        }

        const fateLabel = v.fate === 'Massacre' ? 'مجزرة' : 'تهجير';
        html += `
            <div class="map-item bg-black/40 border border-white/5 hover:border-red-500/30 p-2.5 rounded-xl cursor-pointer transition-all hover:bg-black/60 text-right" onclick="focusMapMarker(${v.lat}, ${v.lng}, '${v.name}')">
                <div class="font-bold text-xs text-white">${v.name}</div>
                <div class="text-[10px] text-gray-400 font-mono mt-1">الوضع: <span class="text-red-400">${fateLabel} (${v.year})</span></div>
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

window.openLinkedMilestone = function(milestoneId) {
    if (!window.location.pathname.includes('milestones.html')) {
        window.location.href = 'milestones.html?milestone=' + encodeURIComponent(milestoneId);
        return;
    }

    // Find the milestone object inside milestoneCinematicData
    const foundMilestone = milestoneCinematicData.find(m => m.id === milestoneId);
    if (foundMilestone) {
        setTimeout(() => {
            // Scroll to the milestone element
            const element = document.getElementById(milestoneId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            // Open the detailed modal
            openMilestoneModal(foundMilestone);
        }, 300);
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

        const title = item.name;
        const subtitle = item.name_en || '';
        const notes = item.notes || '';
        const city = item.city || '';

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

let ageChart = null;
let regionChart = null;

function initRealStatsCharts() {
    // 1. Chart for Age Distribution (Doughnut Chart)
    const ctxAge = document.getElementById('chart-age-distribution');
    if (ctxAge) {
        if (ageChart) ageChart.destroy();
        ageChart = new Chart(ctxAge, {
            type: 'doughnut',
            data: {
                labels: ['أطفال ورضع (Children)', 'شباب ويافعون (Youth/Teens)', 'بالغون (Adults)', 'كبار السن (Elderly)'],
                datasets: [{
                    data: [44.2, 27.8, 20.4, 7.6],
                    backgroundColor: [
                        '#ef4444', // Red
                        '#f87171', // Light Red
                        '#ffffff', // White
                        '#4b5563'  // Dark grey
                    ],
                    borderColor: '#121212',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            font: { family: 'Cairo', size: 9 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.label}: %${context.parsed}`;
                            }
                        }
                    }
                }
            }
        });
    }

    // 2. Chart for Regional Targeting (Bar Chart)
    const ctxRegion = document.getElementById('chart-regional-targeting');
    if (ctxRegion) {
        if (regionChart) regionChart.destroy();
        regionChart = new Chart(ctxRegion, {
            type: 'bar',
            data: {
                labels: ['غزة (Gaza)', 'شمال غزة (North)', 'خان يونس (Khan Younis)', 'الوسطى (Central)', 'رفح (Rafah)'],
                datasets: [{
                    label: 'نسبة الاستهداف الميداني للمناطق السكنية %',
                    data: [35.6, 25.2, 19.8, 11.4, 8.0],
                    backgroundColor: 'rgba(239, 68, 68, 0.85)',
                    borderColor: '#ef4444',
                    borderWidth: 1.5,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#d1d5db', font: { family: 'Cairo', size: 9 } }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#d1d5db', font: { family: 'Cairo', size: 9 } },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff',
                            font: { family: 'Cairo', size: 10 }
                        }
                    }
                }
            }
        });
    }
}

const visualArchiveData = [
    {
        id: "v1",
        type: "video",
        category: "testimonies",
        title_ar: "فيلم وثائقي: ليلة لا تنتهي - العدوان على غزة",
        title_en: "Documentary: The Night Won't End - Biden's War on Gaza",
        desc_ar: "وثائقي استقصائي شامل يوثق الهجمات والجرائم المروعة في قطاع غزة وشهادات حية من الناجين وعائلات الضحايا.",
        desc_en: "An in-depth investigative documentary chronicling the devastating attacks on Gaza and featuring raw, firsthand testimonies from survivors and victims' families.",
        duration: "1:18:25",
        url: "_bI9b9O-bM0",
        thumbnail: "https://img.youtube.com/vi/_bI9b9O-bM0/0.jpg"
    },
    {
        id: "v2",
        type: "video",
        category: "reports",
        title_ar: "أيام الإبادة: كيف غيرت الحرب ملامح الحياة في غزة؟",
        title_en: "Gaza: How the Genocide Changed Every Aspect of Life",
        desc_ar: "تقرير استقصائي يوثق تدمير البنية التحتية والمستشفيات والأحياء السكنية بالكامل، مستعرضاً حجم الجريمة بلغة الأرقام والصور.",
        desc_en: "An analytical report documenting the complete destruction of infrastructure, hospitals, and residential neighborhoods, highlighting the scale of the crime in figures.",
        duration: "15:40",
        url: "69r5XW_pX98",
        thumbnail: "https://img.youtube.com/vi/69r5XW_pX98/0.jpg"
    },
    {
        id: "v3",
        type: "image",
        category: "reports",
        title_ar: "صمود وسط الركام: حياة النازحين في الخيام",
        title_en: "Resilience amidst the Ruins: Displacement and Tents in Gaza",
        desc_ar: "صورة وثائقية تعكس صمود العائلات الفلسطينية التي نصبت خيامها فوق ركام منازلها المدمرة متمسكة بالأرض والوجود.",
        desc_en: "A documentary photograph capturing the resilience of Palestinian families setting up their tents over the debris of their homes, holding on to their land and existence.",
        duration: "صورة وثائقية",
        url: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Gaza_Strip_devastation_Oct_2023.jpg",
        thumbnail: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Gaza_Strip_devastation_Oct_2023.jpg"
    },
    {
        id: "v4",
        type: "video",
        category: "testimonies",
        title_ar: "شهادات أطباء مستشفى الشفاء والكوادر الطبية",
        title_en: "Gaza Doctors: Testimonies of Survival and War at Al-Shifa Hospital",
        desc_ar: "شهادات حية ومؤثرة تروي التفاصيل الدقيقة لمحاصرة واقتحام مستشفى الشفاء والجرائم التي ارتكبت داخل أسواره بحق المرضى والطواقم الطبية.",
        desc_en: "Moving testimonies from doctors and paramedics recounting the brutal siege of Al-Shifa Hospital, detailing the hardships and courage of medical staff under fire.",
        duration: "12:15",
        url: "6R7t-8X1g7E",
        thumbnail: "https://img.youtube.com/vi/6R7t-8X1g7E/0.jpg"
    },
    {
        id: "v5",
        type: "image",
        category: "testimonies",
        title_ar: "أطفال فلسطين: أمل يتحدى الإبادة والتجويع",
        title_en: "Children of Palestine: Hope Defying Starvation and Death",
        desc_ar: "صورة حية لأطفال غزة وهم يصنعون الابتسامة والأمل من داخل مراكز الإيواء بالرغم من وطأة العدوان والحصار المستمر.",
        desc_en: "A documentary photo representing the enduring spirit of Gaza's children, seeking joy and education in displacement shelters despite the ongoing embargo and destruction.",
        duration: "صورة وثائقية",
        url: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Wounded_boy_Al_Shifa_hospital_Gaza_Strip.jpg",
        thumbnail: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Wounded_boy_Al_Shifa_hospital_Gaza_Strip.jpg"
    },
    {
        id: "v6",
        type: "video",
        category: "reports",
        title_ar: "توثيق استهداف عائلات بأكملها ومسحها من السجل المدني",
        title_en: "Documenting the Erasure of Whole Families from the Civil Registry",
        desc_ar: "تقرير وثائقي يرصد مئات العائلات الغزية التي أبيدت بالكامل ومُسحت من السجلات الرسمية نتيجة القصف المباشر للمنازل الآمنة.",
        desc_en: "A heartbreaking visual report detailing the wiping out of entire multi-generational families from official registries due to direct airstrikes on civilian housing.",
        duration: "08:50",
        url: "v3u9VvH-yE4",
        thumbnail: "https://img.youtube.com/vi/v3u9VvH-yE4/0.jpg"
    }
];

function renderVisualArchive(category = 'all') {
    const container = document.getElementById('gallery');
    if (!container) return;

    const buttons = {
        all: document.getElementById('btn-all'),
        reports: document.getElementById('btn-reports'),
        testimonies: document.getElementById('btn-testimonies')
    };

    Object.keys(buttons).forEach(key => {
        const btn = buttons[key];
        if (btn) {
            if (key === category) {
                btn.className = "px-3 py-1 rounded-lg text-xs bg-red-600 font-bold text-white transition-all";
            } else {
                btn.className = "px-3 py-1 rounded-lg text-xs text-gray-300 hover:text-white transition-all bg-black/40 border border-white/5";
            }
        }
    });

    const filtered = category === 'all'
        ? visualArchiveData
        : visualArchiveData.filter(item => item.category === category);

    let html = '';
    filtered.forEach(item => {
        const title = currentLang === 'ar' ? item.title_ar : item.title_en;
        const desc = currentLang === 'ar' ? item.desc_ar : item.desc_en;
        const playIcon = item.type === 'video' ? '▶' : '🖼️';
        const typeBadge = item.type === 'video' ? (currentLang === 'ar' ? 'فيديو توثيقي' : 'Video') : (currentLang === 'ar' ? 'صورة ميدانية' : 'Photograph');
        const durationText = item.duration;

        html += `
            <div class="glass-panel rounded-2xl overflow-hidden border border-white/10 group hover:border-red-500/50 transition-all cursor-pointer flex flex-col justify-between" onclick="openLightbox('${item.id}')">
                <div class="h-44 bg-neutral-900 relative overflow-hidden flex items-center justify-center">
                    <img src="${item.thumbnail}" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div class="w-12 h-12 rounded-full bg-red-600/80 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform z-10 font-bold">
                        ${playIcon}
                    </div>
                    <span class="absolute bottom-2 right-2 bg-black/70 text-[10px] px-2 py-0.5 rounded text-gray-300 font-mono z-10">${durationText}</span>
                </div>
                <div class="p-4 space-y-2 text-right">
                    <span class="text-[9px] text-red-400 font-bold uppercase tracking-wider bg-red-500/10 px-2 py-0.5 rounded-full">${typeBadge}</span>
                    <h3 class="font-bold text-sm text-white line-clamp-1 mt-1 font-['Cairo']">${title}</h3>
                    <p class="text-xs text-gray-400 line-clamp-2 leading-relaxed font-['Cairo']">${desc}</p>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function openLightbox(id) {
    const item = visualArchiveData.find(i => i.id === id);
    if (!item) return;

    const modal = document.getElementById('lightbox-modal');
    const content = document.getElementById('lightbox-content');
    const title = document.getElementById('lightbox-title');
    const desc = document.getElementById('lightbox-desc');

    if (!modal || !content || !title || !desc) return;

    title.innerText = currentLang === 'ar' ? item.title_ar : item.title_en;
    desc.innerText = currentLang === 'ar' ? item.desc_ar : item.desc_en;

    if (item.type === 'video') {
        content.innerHTML = `<iframe class="w-full h-full" src="https://www.youtube.com/embed/${item.url}?autoplay=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    } else {
        content.innerHTML = `<img src="${item.url}" class="max-w-full max-h-full object-contain rounded-lg" />`;
    }

    modal.style.display = 'flex';
}

function closeLightbox() {
    const modal = document.getElementById('lightbox-modal');
    const content = document.getElementById('lightbox-content');
    if (modal) modal.style.display = 'none';
    if (content) content.innerHTML = ''; // Stop video playback
}

window.switchMainMode = function(mode) {
    currentMainMode = mode;
    document.querySelectorAll('.btn-main').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`tab-${mode === 'martyrs48' ? '48' : mode}`);
    if (activeBtn) activeBtn.classList.add('active');

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
        document.getElementById('westbank-view').style.display = 'block';
        renderTributeCards('wb-cards-container', westBankMartyrsData);
        document.getElementById('number').innerText = westBankMartyrsData.length.toLocaleString();
        initCanvasPoints(westBankMartyrsData);
        isDirty = true;
    } else if(mode === 'martyrs48') {
        document.getElementById('martyrs48-view').style.display = 'block';
        renderTributeCards('m48-cards-container', martyrs48Data);
        document.getElementById('number').innerText = martyrs48Data.length.toLocaleString();
        initCanvasPoints(martyrs48Data);
        isDirty = true;
    } else if(mode === 'milestones') {
        document.getElementById('milestones-view').style.display = 'block';
        renderCinematicTimeline();
    } else if(mode === 'stats') {
        document.getElementById('stats-view').style.display = 'block';
        setTimeout(() => {
            initRealStatsCharts();
        }, 50);
    } else if(mode === 'videos') {
        document.getElementById('videos-view').style.display = 'block';
        renderVisualArchive('all');
    } else if(mode === 'map') {
        document.getElementById('map-view').style.display = 'block';
        if (nakbaVillages.length === 0) {
            loadMapData();
        } else {
            renderMapAndList();
        }
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
                loadGazaBorders();
            }
        }, 200);
    }
};

function fetchAndRenderData(url) {
    $.getJSON(url)
        .done(data => {
            gazaSouls = data || [];
            document.getElementById('number').innerText = gazaSouls.length.toLocaleString();
            initCanvasPoints(gazaSouls);
            isDirty = true;
        })
        .fail(() => {
            // بيانات تجريبية في حال تعذر جلب الملف لضمان استمرار عمل الـ Canvas
            gazaSouls = Array.from({length: 1500}, (_, i) => ({
                id: i + 1,
                name: `شهيد رقم ${i + 1}`,
                age: Math.floor(Math.random() * 70) + 1,
                x: Math.random(),
                y: Math.random()
            }));
            document.getElementById('number').innerText = gazaSouls.length.toLocaleString();
            initCanvasPoints(gazaSouls);
            isDirty = true;
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

    // البحث في البيانات النشطة
    const matches = gazaSouls.filter(person => {
        const nameAr = (person.name_ar || person.name || "").toLowerCase();
        const nameEn = (person.name_en || person.english_name || "").toLowerCase();
        const id = (person.id || "").toString();
        return nameAr.includes(currentSearchQuery) || nameEn.includes(currentSearchQuery) || id.includes(currentSearchQuery);
    }).slice(0, 15);

    if (matches.length === 0) {
        dropdown.innerHTML = `<div class="p-3 text-center text-gray-500">لا توجد نتائج مطابقة</div>`;
    } else {
        let html = '';
        matches.forEach(person => {
            const displayName = person.name_ar || person.name || person.name_en || 'شهيد مجهول';
            const displayAge = person.age || 'غير معروف';
            html += `
                <div class="search-result-item p-2.5 hover:bg-red-950/40 border-b border-white/5 cursor-pointer flex justify-between items-center transition-all" onclick="selectSearchMartyr(${JSON.stringify(person).replace(/"/g, '&quot;')})">
                    <div class="text-right flex-1">
                        <div class="font-bold text-white">${displayName}</div>
                        ${person.name_en || person.english_name ? `<div class="text-[10px] text-gray-400 font-mono">${person.name_en || person.english_name}</div>` : ''}
                    </div>
                    <span class="bg-red-600/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full mr-2 whitespace-nowrap">العمر: ${displayAge}</span>
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

function initCanvasPoints(dataList) {
    width = window.innerWidth;
    height = window.innerHeight;

    // تحديد حد أقصى لعدد النقاط المرسومة على الكانفاس لتجنب تجميد المتصفح وضمان تجربة أسلس وسريعة للغاية
    const displayList = dataList.slice(0, 15000);

    // إنشاء العناصر وتوليد الإحداثيات الأساسية
    points = displayList.map((item, index) => ({
        id: item.id || index,
        name: item.name_ar || item.name || `شهيد ${index+1}`,
        name_en: item.name_en || item.english_name || '',
        age: item.age || 'غير معروف',
        x: item.x !== undefined ? item.x * width : Math.random() * width,
        y: item.y !== undefined ? item.y * height : Math.random() * height,
        radius: Math.random() * 1.5 + 1,
        color: Math.random() > 0.3 ? '#ef4444' : '#ffffff'
    }));

    // 2. التخزين المؤقت للإحداثيات (Pre-calculation & Caching)
    recalculateCache();
}

function recalculateCache() {
    width = window.innerWidth;
    height = window.innerHeight;

    // تجميع الإحداثيات والخصائص في مصفوفة جاهزة لتقليل الحسابات المتكررة داخل حلقة الرسم
    cachedItems = points.map(p => ({
        ...p,
        screenX: p.x,
        screenY: p.y
    }));
    isDirty = true;
}

// تهيئة عناصر الـ Canvas وتطبيق التحسينات
const canvas = document.getElementById('stars-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

function resizeCanvas() {
    if (!canvas) return;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
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

    ctx.clearRect(0, 0, width, height);

    const queryActive = currentSearchQuery.length >= 2;

    if (queryActive) {
        isDirty = true; // لتفعيل حركة نبض الكوكبة باستمرار
    }

    // 4. تجميع خصائص السياق (State Batching) لشهداء اللون الأحمر (العاديين أو الباهتين)
    ctx.fillStyle = queryActive ? 'rgba(239, 68, 68, 0.15)' : '#ef4444';
    ctx.beginPath();
    for (let i = 0; i < cachedItems.length; i++) {
        const item = cachedItems[i];

        // 3. استبعاد العناصر خارج إطار الرؤية (Viewport Culling)
        if (item.screenX < -10 || item.screenX > width + 10 || item.screenY < -10 || item.screenY > height + 10) {
            continue;
        }

        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            if (item.screenY < 155 || item.screenY > height - 110) {
                continue;
            }
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
                if (!(queryActive && hideNonMatching)) {
                    ctx.moveTo(item.screenX + item.radius, item.screenY);
                    ctx.arc(item.screenX, item.screenY, item.radius, 0, Math.PI * 2);
                }
            }
        }
    }
    ctx.fill();

    // 4. تجميع خصائص السياق (State Batching) لشهداء اللون الأبيض (العاديين أو الباهتين)
    ctx.fillStyle = queryActive ? 'rgba(255, 255, 255, 0.15)' : '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < cachedItems.length; i++) {
        const item = cachedItems[i];

        if (item.screenX < -10 || item.screenX > width + 10 || item.screenY < -10 || item.screenY > height + 10) {
            continue;
        }

        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            if (item.screenY < 155 || item.screenY > height - 110) {
                continue;
            }
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
                if (!(queryActive && hideNonMatching)) {
                    ctx.moveTo(item.screenX + item.radius, item.screenY);
                    ctx.arc(item.screenX, item.screenY, item.radius, 0, Math.PI * 2);
                }
            }
        }
    }
    ctx.fill();

    // رسم النجوم المطابقة للبحث ككوكبة مضيئة بارزة ومتحركة
    if (queryActive) {
        for (let i = 0; i < cachedItems.length; i++) {
            const item = cachedItems[i];

            if (item.screenX < -10 || item.screenX > width + 10 || item.screenY < -10 || item.screenY > height + 10) {
                continue;
            }

            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                if (item.screenY < 155 || item.screenY > height - 110) {
                    continue;
                }
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

    // فحص التلميح وتحديد ما إذا كان هناك تفاعل مع الماوس
    let hoveredMartyr = null;
    for (let i = 0; i < cachedItems.length; i++) {
        const item = cachedItems[i];
        const dx = mouseX - item.screenX;
        const dy = mouseY - item.screenY;
        if (dx * dx + dy * dy < 100) { // مسافة تقريبية للتفاعل (10 بكسل)
            hoveredMartyr = item;
            break;
        }
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

    // إعادة تعليق العلم لأن الشاشة أصبحت ثابتة الآن لحين حدوث تفاعل جديد
    if (!queryActive) {
        isDirty = false;
    }
    requestAnimationFrame(drawCanvas);
}

// بدء حلقة الرسم المشروط
requestAnimationFrame(drawCanvas);

// ----------------------------------------------------
// Category 1 JS: Crowdsourcing & Submissions
// ----------------------------------------------------
let captchaNum1 = 0;
let captchaNum2 = 0;

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
    document.getElementById('cs-photo').value = '';

    document.getElementById('crowdsource-modal-overlay').style.display = 'flex';
}

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
    const image = document.getElementById('cs-photo').value.trim();

    const submission = {
        id: 'cs_' + Date.now(),
        submitter,
        name,
        city,
        notes,
        image,
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

    alert(currentLang === 'ar' ? 'تم إرسال مساهمتك بنجاح وهي قيد المراجعة الآن.' : 'Your submission has been sent successfully and is under review.');
    document.getElementById('crowdsource-modal-overlay').style.display = 'none';
}

function openAdminReviewPanel() {
    const password = prompt(currentLang === 'ar' ? 'الرجاء إدخال كلمة مرور الإدارة لتسجيل الدخول:' : 'Please enter the admin password to log in:', '');
    if (password !== 'admin123') {
        alert(currentLang === 'ar' ? 'كلمة المرور غير صحيحة!' : 'Incorrect password!');
        return;
    }
    document.getElementById('crowdsource-modal-overlay').style.display = 'none';
    document.getElementById('admin-review-overlay').style.display = 'flex';
    renderAdminSubmissions();
}

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
    updateTributeUI();
    if (typeof translateMartyrModal === 'function') {
        translateMartyrModal(currentLang);
    }

    document.getElementById('martyr-modal-name').innerText = person.name || 'شهيد مجهول';
    const nameEnEl = document.getElementById('martyr-modal-name-en');
    if (person.name_en) {
        nameEnEl.innerText = person.name_en;
        nameEnEl.style.display = 'block';
    } else {
        nameEnEl.style.display = 'none';
    }
    document.getElementById('martyr-modal-age').innerText = person.age || 'غير معروف';
    document.getElementById('martyr-modal-id').innerText = person.id || '-';

    const photoEl = document.getElementById('martyr-modal-photo');
    if (person.image) {
        photoEl.innerHTML = `<img src="${person.image}" style="width:100%; height:100%; object-fit:cover;" crossorigin="anonymous">`;
    } else {
        photoEl.innerHTML = `<span id="modal-photo-text">${translations[currentLang].modalPhotoText}</span>`;
    }

    document.getElementById('martyr-modal-overlay').style.display = 'flex';
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
document.getElementById('milestone-modal-close').addEventListener('click', () => {
    window.speechSynthesis.cancel();
    isMilestoneSpeaking = false;
    document.getElementById('milestone-modal-overlay').style.display = 'none';
});
document.getElementById('milestone-modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('milestone-modal-overlay')) {
        window.speechSynthesis.cancel();
        isMilestoneSpeaking = false;
        document.getElementById('milestone-modal-overlay').style.display = 'none';
    }
});

document.getElementById('martyr-modal-close').addEventListener('click', () => {
    window.speechSynthesis.cancel();
    isMartyrSpeaking = false;
    document.getElementById('martyr-modal-overlay').style.display = 'none';
});
document.getElementById('martyr-modal-overlay').addEventListener('click', (e) => {
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
    let transDetailed = currentMilestoneObj.detailedExplanation || '';

    if (lang !== 'ar') {
        transTitle = currentMilestoneObj.title_en || currentMilestoneObj.title;
        transExcerpt = "A prominent historical milestone documenting the struggles, resilience, and events in the history of the Palestinian cause.";
        transStat = "Thousands of Martyrs";
        transStatExp = "Detailed archival statistics showing targeting records and historical timelines.";
        transDetailed = currentMilestoneObj.detailedExplanation ? "Historical milestone describing the events, sacrifice, and key moments. Please refer to Arabic text for full official documentation and deep records of this event." : "";
    }

    container.innerHTML = `
        <div class="tlc-modal-content text-right text-xs">
            <div class="flex items-center gap-2 mb-2 ${lang !== 'ar' ? 'flex-row-reverse' : ''}">
                <span style="background: #ef4444; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; font-family: 'Cairo';">${currentMilestoneObj.year}</span>
                <span style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: bold; font-family: 'Cairo';">${lang === 'ar' ? 'محطة تاريخية بارزة' : 'Historical Milestone'}</span>
            </div>
            <h2 class="tlc-modal-title" style="font-size: 1.4rem; font-weight: 900; color: #ef4444; line-height: 1.4; margin-bottom: 8px; text-align: ${lang === 'ar' ? 'right' : 'left'};">${transTitle} ${currentMilestoneObj.alt ? `<span class="tlc-mdl-alt text-gray-400 text-sm font-medium">(${currentMilestoneObj.alt})</span>` : ''}</h2>

            <img class="tlc-modal-img rounded-xl max-h-56 w-full object-cover border border-red-500/30 shadow-lg" src="${currentMilestoneObj.image}" alt="" onerror="this.style.display='none'">

            <div class="tlc-modal-desc mt-4 leading-relaxed text-gray-100" style="font-size: 0.9rem; border-right: ${lang === 'ar' ? '3px' : '0'} solid #ef4444; border-left: ${lang !== 'ar' ? '3px' : '0'} solid #ef4444; padding-right: ${lang === 'ar' ? '12px' : '0'}; padding-left: ${lang !== 'ar' ? '12px' : '0'}; margin-bottom: 12px; text-align: ${lang === 'ar' ? 'right' : 'left'};">
                <strong>${lang === 'ar' ? 'لمحة عامة:' : 'Overview:'}</strong><br>
                ${transExcerpt}
            </div>

            ${transDetailed ? `
            <div class="tlc-modal-detailed-explanation mt-4 p-4 bg-black/40 rounded-xl border border-white/5 leading-relaxed text-gray-300" style="font-size: 0.85rem; text-align: ${lang === 'ar' ? 'justify' : 'left'};">
                <h4 class="font-bold text-red-400 mb-2 flex items-center gap-1.5 ${lang !== 'ar' ? 'flex-row-reverse' : ''}" style="font-size: 0.95rem;">📖 ${lang === 'ar' ? 'تفاصيل الحدث وشرحه التاريخي الموثق:' : 'Event details & documented historical explanation:'}</h4>
                <p style="text-indent: 15px;">${transDetailed}</p>
            </div>
            ` : ''}

            <div class="tlc-modal-stat mt-4 bg-red-950/20 border border-red-500/20 p-4 rounded-xl flex flex-col gap-1 text-right">
                <span class="tlc-mdl-stat-label text-gray-400 block font-bold text-[10px] tracking-wider uppercase text-right">${lang === 'ar' ? '📊 الإحصائيات والأثر البشري الموثق:' : '📊 Statistics & Documented Human Impact:'}</span>
                <span class="tlc-mdl-stat-num text-red-400 font-black text-lg text-right">${transStat}</span>
                <p class="tlc-mdl-stat-exp text-gray-300 mt-1 text-right" style="font-size: 0.8rem; line-height: 1.4;">${transStatExp}</p>
            </div>

            <div class="tlc-modal-source mt-4 border-t border-white/10 pt-3 text-[11px] text-gray-500 flex justify-between items-center ${lang !== 'ar' ? 'flex-row-reverse' : ''}">
                <span>📚 <strong>${lang === 'ar' ? 'المصدر التوثيقي:' : 'Source:'}</strong> <a href="${currentMilestoneObj.sourceUrl || 'https://www.palquest.org/'}" target="_blank" class="text-red-400 hover:underline inline-flex items-center gap-0.5">${currentMilestoneObj.sourceName || 'Interactive Encyclopedia of Palestine'} 🔗</a></span>
            </div>
        </div>
    `;
}

// تحميل البيانات الافتراضية عند البدء
window.initOnThisDayWidget = window.initOnThisDayWidget || function() {
    console.log("initOnThisDayWidget placeholder called");
};

window.loadGazaBorders = window.loadGazaBorders || function() {
    console.log("loadGazaBorders placeholder called");
};

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
    else if (path.includes('videos.html')) activeMode = 'videos';
    else if (path.includes('map.html')) activeMode = 'map';
    else if (path.includes('solidarity.html')) activeMode = 'solidarity';

    switchMainMode(activeMode);
    initOnThisDayWidget();

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
