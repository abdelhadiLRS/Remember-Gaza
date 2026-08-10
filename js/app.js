
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

        // Crowdsourcing Form Modal
        csTitle: "ركن المساهمات وتصحيح البيانات",
        csAdminLink: "لوحة الإدارة 🔑",
        csSubmitterLabel: "اسم مقدم المساهمة:",
        csSubmitterPlaceholder: "مثلاً: يوسف أحمد",
        csNameLabel: "اسم الشهيد الكامل:",
        csNamePlaceholder: "أدخل اسم الشهيد رباعياً",
        csCityLabel: "المدينة / المحافظة:",
        csCityPlaceholder: "مثلاً: غزة، جنين، القدس",
        csNotesLabel: "التصحيح أو السيرة التفصيلية / وثيقة:",
        csNotesPlaceholder: "اكتب السيرة، تاريخ الاستشهاد، أو أي تفاصيل/تصحيحات ترغب في إضافتها...",
        csPhotoLabel: "رابط صورة الشهيد أو مستند إثبات (ملف أو رابط):",
        csCaptchaLabel: "سؤال الأمان (لمنع البرامج التلقائية):",
        csCaptchaPlaceholder: "الناتج?",
        csSubmitButton: "إرسال للمراجعة والاعتماد",

        // Martyr Modal additional elements
        tributeCandleText: "إضاءة شمعة",
        tributeEditText: "تعديل البيانات",
        tributeLeaveMark: "اترك أثراً تضامنياً (رسالة تعليق)",
        tributeNamePlaceholder: "اسمك (أو زائر من حول العالم)",
        tributeMsgPlaceholder: "اكتب كلمة تضامن مع عائلة الشهيد...",
        tributeSubmitBtn: "إرسال التضامن",
        tributeLatestLabel: "أحدث رسائل التضامن:",
        tributeNoMessages: "لا توجد رسائل تضامن حالياً. كن أول من يترك أثراً.",

        // Extra milestone labels
        tlcStatLabel: "عدد الشهداء والضحايا:",
        tlcReadMore: "اقرأ المزيد",
        tlcMapBtn: "🗺️ الخريطة",

        // Admin control panel inside app.js
        adminPasswordPrompt: "الرجاء إدخال كلمة مرور الإدارة لتسجيل الدخول:",
        adminIncorrectPassword: "كلمة المرور غير صحيحة!",
        adminNoPendingSubmissions: "لا توجد مساهمات معلقة للمراجعة حالياً.",
        adminPanelTitle: "لوحة مراجعة واعتماد المساهمات (Admin Control Panel)",
        adminSubmitter: "المساهم:",
        adminMartyrName: "اسم الشهيد:",
        adminCity: "المدينة / المحافظة:",
        adminDetails: "التفاصيل:",
        adminViewPhoto: "عرض الصورة المرفقة",
        adminApproveBtn: "اعتماد وقبول",
        adminRejectBtn: "رفض",
        adminStatusPending: "معلق",
        adminStatusApproved: "معتمد",
        adminStatusRejected: "مرفوض",
        adminSuccessApproved: "تم قبول واعتماد المساهمة، وتمت إضافتها بنجاح إلى أرشيف الشهداء!",
        adminSuccessRejected: "تم رفض المساهمة.",

        // Copy link success alert
        copyLinkSuccess: "تم نسخ رابط المنصة بنجاح!",
        imagePreparing: "جاري تحضير الصورة...",
        imageCaptureError: "حدث خطأ أثناء التقاط الصورة. يرجى المحاولة مرة أخرى."
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

        // Crowdsourcing Form Modal
        csTitle: "Contributions & Data Correction Corner",
        csAdminLink: "Admin Panel 🔑",
        csSubmitterLabel: "Submitter Name:",
        csSubmitterPlaceholder: "e.g., Youssef Ahmad",
        csNameLabel: "Martyr Full Name:",
        csNamePlaceholder: "Enter full name of the martyr",
        csCityLabel: "City / Governorate:",
        csCityPlaceholder: "e.g., Gaza, Jenin, Jerusalem",
        csNotesLabel: "Correction, Biography, or Document:",
        csNotesPlaceholder: "Write biography, martyrdom date, details, or corrections to add...",
        csPhotoLabel: "Martyr Photo or Proof Document (File or URL):",
        csCaptchaLabel: "Security Question (to prevent bots):",
        csCaptchaPlaceholder: "Result?",
        csSubmitButton: "Send for Review & Approval",

        // Martyr Modal additional elements
        tributeCandleText: "Light a Candle",
        tributeEditText: "Edit Data",
        tributeLeaveMark: "Leave a Solidarity Message",
        tributeNamePlaceholder: "Your name (or visitor from around the world)",
        tributeMsgPlaceholder: "Write a word of solidarity to the martyr's family...",
        tributeSubmitBtn: "Send Solidarity",
        tributeLatestLabel: "Latest Solidarity Messages:",
        tributeNoMessages: "No solidarity messages currently. Be the first to leave one.",

        // Extra milestone labels
        tlcStatLabel: "Number of Martyrs & Victims:",
        tlcReadMore: "Read More",
        tlcMapBtn: "🗺️ Map",

        // Admin control panel inside app.js
        adminPasswordPrompt: "Please enter the admin password to log in:",
        adminIncorrectPassword: "Incorrect password!",
        adminNoPendingSubmissions: "No pending contributions for review currently.",
        adminPanelTitle: "Contributions Review Panel (Admin Control Panel)",
        adminSubmitter: "Submitter:",
        adminMartyrName: "Martyr Full Name:",
        adminCity: "City / Governorate:",
        adminDetails: "Details:",
        adminViewPhoto: "View Attached Photo",
        adminApproveBtn: "Approve & Accept",
        adminRejectBtn: "Reject",
        adminStatusPending: "Pending",
        adminStatusApproved: "Approved",
        adminStatusRejected: "Rejected",
        adminSuccessApproved: "Submission approved and successfully added to the archive!",
        adminSuccessRejected: "Submission rejected.",

        // Copy link success alert
        copyLinkSuccess: "Platform link copied successfully!",
        imagePreparing: "Preparing image...",
        imageCaptureError: "An error occurred while capturing. Please try again."
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

        // Crowdsourcing Form Modal
        csTitle: "Espace de contribution et correction de données",
        csAdminLink: "Panneau d'administration 🔑",
        csSubmitterLabel: "Nom du contributeur :",
        csSubmitterPlaceholder: "ex: Youssef Ahmad",
        csNameLabel: "Nom complet du martyr :",
        csNamePlaceholder: "Saisir le nom complet du martyr",
        csCityLabel: "Ville / Gouvernorat :",
        csCityPlaceholder: "ex: Gaza, Jénine, Jérusalem",
        csNotesLabel: "Correction, biographie ou document :",
        csNotesPlaceholder: "Écrire la biographie, date du martyre, détails, ou corrections à apporter...",
        csPhotoLabel: "Photo du martyr ou document de preuve (fichier ou URL) :",
        csCaptchaLabel: "Question de sécurité (pour empêcher les robots) :",
        csCaptchaPlaceholder: "Résultat?",
        csSubmitButton: "Envoyer pour examen et approbation",

        // Martyr Modal additional elements
        tributeCandleText: "Allumer une bougie",
        tributeEditText: "Modifier les données",
        tributeLeaveMark: "Laisser un message de solidarité",
        tributeNamePlaceholder: "Votre nom (ou visiteur du monde)",
        tributeMsgPlaceholder: "Écrire un mot de solidarité à la famille du martyr...",
        tributeSubmitBtn: "Envoyer la solidarité",
        tributeLatestLabel: "Derniers messages de solidarité :",
        tributeNoMessages: "Aucun message de solidarité actuellement. Soyez le premier à en laisser un.",

        // Extra milestone labels
        tlcStatLabel: "Nombre de martyrs et de victimes :",
        tlcReadMore: "Lire la suite",
        tlcMapBtn: "🗺️ Carte",

        // Admin control panel inside app.js
        adminPasswordPrompt: "Veuillez entrer le mot de passe administrateur pour vous connecter :",
        adminIncorrectPassword: "Mot de passe incorrect!",
        adminNoPendingSubmissions: "Aucune contribution en attente d'examen pour le moment.",
        adminPanelTitle: "Panneau de révision des contributions (Panneau de configuration Admin)",
        adminSubmitter: "Contributeur :",
        adminMartyrName: "Nom complet du martyr :",
        adminCity: "Ville / Gouvernorat :",
        adminDetails: "Détails :",
        adminViewPhoto: "Voir la photo jointe",
        adminApproveBtn: "Approuver et accepter",
        adminRejectBtn: "Rejeter",
        adminStatusPending: "En attente",
        adminStatusApproved: "Approuvé",
        adminStatusRejected: "Rejeté",
        adminSuccessApproved: "Contribution approuvée et ajoutée avec succès aux archives!",
        adminSuccessRejected: "Contribution rejetée.",

        // Copy link success alert
        copyLinkSuccess: "Lien de la plateforme copié avec succès!",
        imagePreparing: "Préparation de l'image...",
        imageCaptureError: "Une erreur s'est produite lors de la capture. Veuillez réessayer."
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

        // Crowdsourcing Form Modal
        csTitle: "Rincón de aportaciones y corrección de datos",
        csAdminLink: "Panel de administración 🔑",
        csSubmitterLabel: "Nombre del colaborador:",
        csSubmitterPlaceholder: "ej: Youssef Ahmad",
        csNameLabel: "Nombre completo del mártir:",
        csNamePlaceholder: "Ingrese el nombre completo del mártir",
        csCityLabel: "Ciudad / Gobernación:",
        csCityPlaceholder: "ej: Gaza, Yenín, Jerusalén",
        csNotesLabel: "Corrección, biografía o documento:",
        csNotesPlaceholder: "Escriba la biografía, fecha del martirio, detalles o correcciones a realizar...",
        csPhotoLabel: "Foto del mártir o documento de prueba (archivo o URL):",
        csCaptchaLabel: "Pregunta de seguridad (para evitar bots):",
        csCaptchaPlaceholder: "Resultado?",
        csSubmitButton: "Enviar para revisión y aprobación",

        // Martyr Modal additional elements
        tributeCandleText: "Encender vela",
        tributeEditText: "Editar datos",
        tributeLeaveMark: "Dejar un mensaje de solidaridad",
        tributeNamePlaceholder: "Su nombre (o visitante del mundo)",
        tributeMsgPlaceholder: "Escriba unas palabras de solidaridad para la familia...",
        tributeSubmitBtn: "Enviar solidaridad",
        tributeLatestLabel: "Últimos mensajes de solidaridad:",
        tributeNoMessages: "No hay mensajes de solidaridad actualmente. Sé el primero en dejar uno.",

        // Extra milestone labels
        tlcStatLabel: "Número de mártires y víctimas:",
        tlcReadMore: "Leer más",
        tlcMapBtn: "🗺️ Mapa",

        // Admin control panel inside app.js
        adminPasswordPrompt: "Por favor, introduzca la contraseña de administrador para iniciar sesión:",
        adminIncorrectPassword: "Contraseña incorrecta!",
        adminNoPendingSubmissions: "No hay contribuciones pendientes para revisar en este momento.",
        adminPanelTitle: "Panel de revisión de contribuciones (Panel de control del administrador)",
        adminSubmitter: "Colaborador:",
        adminMartyrName: "Nombre completo del mártir:",
        adminCity: "Ciudad / Gobernación:",
        adminDetails: "Detalles:",
        adminViewPhoto: "Ver foto adjunta",
        adminApproveBtn: "Aprobar y aceptar",
        adminRejectBtn: "Rechazar",
        adminStatusPending: "Pendiente",
        adminStatusApproved: "Aprobado",
        adminStatusRejected: "Rechazado",
        adminSuccessApproved: "¡Aportación aprobada y agregada con éxito al archivo!",
        adminSuccessRejected: "Aportación rechazada.",

        // Copy link success alert
        copyLinkSuccess: "¡Enlace de la plataforma copiado con éxito!",
        imagePreparing: "Preparando imagen...",
        imageCaptureError: "Ocurrió un error al capturar. Por favor, inténtelo de nuevo."
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
        id: "m18", type: "scene", year: "1929",
        title: { ar: "هبّة البراق", en: "Buraq Uprising", fr: "Soulèvement du Bouraq", es: "Levantamiento del Buraq" },
        alt: { ar: "ثورة البراق", en: "Buraq Revolution", fr: "Révolution du Bouraq", es: "Revolución del Buraq" },
        image: "images/timeline/18.jpg",
        excerpt: {
            ar: "في آب/أغسطس 1929 انتفض الفلسطينيون احتجاجاً على محاولات السيطرة على حائط البراق المحاذي للمسجد الأقصى. اندلعت اشتباكات في القدس والخليل والصفد، وردّ الانتداب البريطاني بالقوة المفرطة، واستشهد أكثر من 116 فلسطينياً، وأُعدم ثلاثة من قادة الثورة لاحقاً (محمد جمجوم، فؤاد حجازي، عطا الزير) فخلّدتهم الذاكرة الوطنية.",
            en: "In August 1929, Palestinians rose up protesting attempts to control the Buraq Wall adjacent to Al-Aqsa Mosque. Clashes erupted in Jerusalem, Hebron, and Safed. The British Mandate responded with excessive force, martyring over 116 Palestinians, and later executing three revolution leaders.",
            fr: "En août 1929, les Palestiniens se sont soulevés pour protester contre les tentatives de contrôle du mur du Bouraq. Des affrontements ont éclaté à Jérusalem, Hébron et Safed. Le mandat britannique a répondu par une force excessive, martyrisant plus de 116 Palestiniens et exécutant plus tard trois dirigeants.",
            es: "En agosto de 1929, los palestinos se levantaron en protesta por los intentos de controlar el Muro de Buraq. Estallaron enfrentamientos en Jerusalén, Hebrón y Safed. El Mandato Británico respondió con fuerza excesiva, martirizando a más de 116 palestinos y ejecutando posteriormente a tres líderes."
        },
        stat: { ar: "حوالي 116 شهيد", en: "Around 116 Martyrs", fr: "Environ 116 Martyrs", es: "Cerca de 116 Mártires" },
        statExp: {
            ar: "116 شهيداً فلسطينياً سقطوا خلال الأحداث، إضافة إلى تنفيذ حكم الإعدام بثلاثة من قادة الثورة",
            en: "116 Palestinian martyrs fell during the events, in addition to the execution of three revolution leaders",
            fr: "116 martyrs palestiniens sont tombés, en plus de l'exécution de trois dirigeants",
            es: "116 mártires palestinos cayeron durante los hechos, además de la ejecución de tres líderes de la revolución"
        },
        sourceName: { ar: "ويكيبيديا - ثورة البراق 1929", en: "Wikipedia - Buraq Uprising 1929", fr: "Wikipédia - Soulèvement du Bouraq", es: "Wikipedia - Levantamiento del Buraq" },
        sourceUrl: "https://ar.wikipedia.org/wiki/%D8%AB%D9%88%D8%B1%D8%A9_%D8%A7%D9%84%D8%A8%D8%B1%D8%A7%D9%82"
    },
    { id: "d1930", type: "decade", decade: "1930" },
    {
        id: "m19", type: "scene", year: "1936 - 1939",
        title: { ar: "الثورة الفلسطينية الكبرى", en: "The Great Palestinian Revolt", fr: "La Grande Révolte palestinienne", es: "La Gran Revuelta Palestina" },
        alt: { ar: "ثورة الست أشهر", en: "The Six-Month Strike", fr: "La grève de six mois", es: "La huelga de seis meses" },
        image: "images/timeline/19.jpg",
        excerpt: {
            ar: "انطلقت الثورة الفلسطينية الكبرى في نيسان/أبريل 1936 بإضراب عام شامل امتد ستة أشهر، ثم تحولت إلى مقاومة مسلحة استمرت حتى 1939. استهدفت الانتداب البريطاني والمشروع الصهيوني، وقمعتها بريطانيا بعنف عبر قانون الطوارئ ونسف القرى والإعدامات.",
            en: "The Great Palestinian Revolt began in April 1936 with a comprehensive six-month strike, transforming into armed resistance until 1939, targeting the British mandate and Zionist project.",
            fr: "La Grande Révolte palestinienne a commencé en avril 1936 par une grève générale de six mois, se transformant en résistance armée jusqu'en 1939 contre le mandat britannique et le projet sioniste.",
            es: "La Gran Revuelta Palestina comenzó en abril de 1936 con una huelga general de seis meses, transformándose en resistencia armada hasta 1939 contra el mandato británico y el proyecto sionista."
        },
        stat: { ar: "5,000 شهيد", en: "5,000 Martyrs", fr: "5 000 Martyrs", es: "5.000 Mártires" },
        statExp: {
            ar: "آلاف الشهداء والجرحى نتيجة العمليات العسكرية وقمع الاحتلال البريطاني للثورة",
            en: "Thousands of martyrs and wounded due to military operations and British suppression of the revolution",
            fr: "Des milliers de martyrs et de blessés suite aux opérations militaires et à la répression britannique de la révolution",
            es: "Miles de mártires y heridos debido a las operaciones militares y la represión británica de la revolución"
        },
        sourceName: { ar: "الموسوعة التفاعلية للقضية الفلسطينية", en: "Interactive Encyclopedia of the Palestine Question", fr: "Encyclopédie interactive de la question palestinienne", es: "Enciclopedia Interactiva de la Cuestión Palestina" },
        sourceUrl: "https://www.palquest.org/"
    },
    {
        id: "m1", type: "scene", year: "1936 - 1948",
        title: { ar: "مرحلة التطهير العرقي في فلسطين", en: "Ethnic Cleansing in Palestine", fr: "Nettoyage ethnique en Palestine", es: "Limpieza étnica en Palestina" },
        alt: { ar: "النكبة", en: "The Nakba", fr: "La Nakba", es: "La Nakba" },
        image: "images/timeline/1.jpg",
        excerpt: {
            ar: "بدأت المجازر الاسرائيلية بحق الفلسطينيين قبل الاعلان عن قيام دولة اسرائيل بنحو 11 عاما منذ كانت فلسطين تحت وصاية الانتداب البريطاني الذي كان يتحمل مسؤولية حماية حياة المواطنين الفلسطينيين.",
            en: "Zionist massacres against Palestinians started 11 years before the declaration of Israel, during the British Mandate which was responsible for protecting Palestinian civilian lives.",
            fr: "Les massacres sionistes contre les Palestiniens ont commencé 11 ans avant la déclaration d'Israël, sous le mandat britannique qui était responsable de la protection des civils palestiniens.",
            es: "Las masacres sionistas contra los palestinos comenzaron 11 años antes de la declaración de Israel, bajo el mandato británico que era responsable de la protección de los civiles palestinos."
        },
        stat: { ar: "حوالي 5000 شهيد", en: "Around 5,000 Martyrs", fr: "Environ 5 000 Martyrs", es: "Cerca de 5.000 Mártires" },
        statExp: {
            ar: "ضحايا المجازر وعمليات التطهير العرقي المبكرة قبل عام 1948",
            en: "Victims of early massacres and ethnic cleansing operations before 1948",
            fr: "Victimes des premiers massacres et opérations de nettoyage ethnique avant 1948",
            es: "Víctimas de las primeras masacres y operaciones de limpieza étnica antes de 1948"
        },
        sourceName: { ar: "مؤسسة الدراسات الفلسطينية", en: "Institute for Palestine Studies", fr: "Institut des études palestiniennes", es: "Instituto de Estudios Palestinos" },
        sourceUrl: "https://www.palquest.org/"
    },
    { id: "d1940", type: "decade", decade: "1940" },
    {
        id: "m20", type: "scene", year: "1948",
        title: { ar: "مجزرة دير ياسين", en: "Deir Yassin Massacre", fr: "Massacre de Deir Yassin", es: "Masacre de Deir Yassin" },
        alt: { ar: "", en: "", fr: "", es: "" },
        image: "images/timeline/20.jpg",
        excerpt: {
            ar: "في فجر التاسع من نيسان 1948، اقتحمت عصابتا الإرغون وشتيرن قرية دير ياسين غرب القدس وارتكبتا مجزرة وحشية بحق سكانها، شملت إعدامات ميدانية وتمثيلاً بالجثث وتهجيراً.",
            en: "At dawn on April 9, 1948, Irgun and Stern gangs stormed Deir Yassin village west of Jerusalem, committing a brutal massacre including field executions and displacement.",
            fr: "À l'aube du 9 avril 1948, les gangs de l'Irgoun et de Stern ont pris d'assaut le village de Deir Yassin à l'ouest de Jérusalem, commettant un massacre brutal.",
            es: "Al amanecer del 9 de abril de 1948, las bandas de Irgún y Stern asaltaron la aldea de Deir Yassin, al oeste de Jerusalén, cometiendo una brutal masacre."
        },
        stat: { ar: "254 - 300 شهيد", en: "254 - 300 Martyrs", fr: "254 - 300 Martyrs", es: "254 - 300 Mártires" },
        statExp: {
            ar: "أكثر من 250 شهيداً من الأطفال والنساء والرجال عزل الأسلحة",
            en: "More than 250 unarmed martyrs of children, women, and men",
            fr: "Plus de 250 martyrs non armés d'enfants, de femmes et d'hommes",
            es: "Más de 250 mártires desarmados de niños, mujeres y hombres"
        },
        sourceName: { ar: "ويكيبيديا - مجزرة دير ياسين", en: "Wikipedia - Deir Yassin Massacre", fr: "Wikipédia - Massacre de Deir Yassin", es: "Wikipedia - Masacre de Deir Yassin" },
        sourceUrl: "https://ar.wikipedia.org"
    },
    {
        id: "m2", type: "scene", year: "1948",
        title: { ar: "الحرب العربية الإسرائيلية 1948", en: "1948 Arab-Israeli War", fr: "Guerre israélo-arabe de 1948", es: "Guerra árabe-israelí de 1948" },
        alt: { ar: "حرب النكبة", en: "The Nakba War", fr: "Guerre de la Nakba", es: "Guerra de la Nakba" },
        image: "images/timeline/2.jpg",
        excerpt: {
            ar: "أول حروب العرب مع إسرائيل، دارت عقب إنهاء الانتداب البريطاني على فلسطين وإعلان قيام إسرائيل، منتصف مايو/أيار 1948، وارتقى خلالها آلاف الشهداء.",
            en: "The first Arab-Israeli war took place after the end of the British Mandate and the declaration of Israel in mid-May 1948, during which thousands were martyred.",
            fr: "La première guerre israélo-arabe s'est déroulée après la fin du mandat britannique et la déclaration d'Israël à mi-mai 1948, coûtant la vie à des milliers de martyrs.",
            es: "La primera guerra árabe-israelí tuvo lugar tras el fin del mandato británico y la declaración de Israel a mediados de mayo de 1948, en la que miles fueron martirizados."
        },
        stat: { ar: "20 - 22 ألف شهيد", en: "20,000 - 22,000 Martyrs", fr: "20 000 - 22 000 Martyrs", es: "20.000 - 22.000 Mártires" },
        statExp: {
            ar: "شهداء المعارك والدفاع عن المدن والقرى الفلسطينية أثناء النكبة",
            en: "Martyrs of battles and defense of Palestinian cities and villages during the Nakba",
            fr: "Martyrs des batailles et de la défense des villes et villages palestiniens pendant la Nakba",
            es: "Mártires de batallas y defensa de ciudades y pueblos palestinos durante la Nakba"
        },
        sourceName: { ar: "الموسوعة التفاعلية للقضية الفلسطينية", en: "Interactive Encyclopedia of the Palestine Question", fr: "Encyclopédie de la question palestinienne", es: "Enciclopedia de la Cuestión Palestina" },
        sourceUrl: "https://www.palquest.org/"
    },
    { id: "d1950", type: "decade", decade: "1950" },
    {
        id: "m4", type: "scene", year: "1956",
        title: { ar: "احتلال غزة 1956", en: "Occupation of Gaza 1956", fr: "Occupation de Gaza 1956", es: "Ocupación de Gaza 1956" },
        alt: { ar: "العدوان الثلاثي", en: "Suez Crisis", fr: "Crise de Suez", es: "Guerra de Suez" },
        image: "images/timeline/4.jpg",
        excerpt: {
            ar: "خلال العدوان الثلاثيّ على مصر بعد تأميم قناة السويس، احتلّ جيش الاحتلال قطاع غزّة قادماً من رفح، حيث ارتقى مئات الشهداء في مجازر بشعة.",
            en: "During the tripartite aggression on Egypt, the occupation army occupied Gaza coming from Rafah, committing terrible massacres where hundreds of martyrs fell.",
            fr: "Lors de l'agression tripartite contre l'Égypte, l'armée d'occupation a occupé Gaza en venant de Rafah, commettant de terribles massacres.",
            es: "Durante la agresión tripartita contra Egipto, el ejército de ocupación ocupó Gaza viniendo desde Rafah, cometiendo terribles masacres."
        },
        stat: { ar: "حوالي 1500 شهيد", en: "Around 1,500 Martyrs", fr: "Environ 1 500 Martyrs", es: "Cerca de 1.500 Mártires" },
        statExp: {
            ar: "شهداء المجازر في خان يونس ورفح وغزة خلال العدوان",
            en: "Martyrs of massacres in Khan Younis, Rafah, and Gaza during the Suez Crisis",
            fr: "Martyrs des massacres à Khan Younès, Rafah et Gaza pendant la crise",
            es: "Mártires de las masacres en Jan Yunis, Rafah y Gaza durante la crisis"
        },
        sourceName: { ar: "أرشيف تاريخ فلسطين - العدوان الثلاثي", en: "Palestine History Archive - Suez Crisis", fr: "Archives de Palestine - Crise de Suez", es: "Archivo Histórico de Palestina" },
        sourceUrl: "https://ar.wikipedia.org"
    },
    { id: "d1960", type: "decade", decade: "1960" },
    {
        id: "m5", type: "scene", year: "1967",
        title: { ar: "حرب حزيران 1967", en: "June War 1967", fr: "Guerre de Juin 1967", es: "Guerra de Junio 1967" },
        alt: { ar: "النكسة", en: "The Naksa", fr: "La Naksa", es: "La Naksa" },
        image: "images/timeline/5.jpg",
        excerpt: {
            ar: "يطلق مصطلح النكسة على الهزيمة التي منيت بها الجيوش العربية أمام إسرائيل وااحتلال كامل فلسطين وأراضٍ سورية ومصرية.",
            en: "The term Naksa refers to the defeat of Arab armies by Israel and the occupation of the rest of Palestine, Syrian Golan, and Egyptian Sinai.",
            fr: "Le terme Naksa fait référence à la défaite des armées arabes par Israël et à l'occupation du reste de la Palestine, du Golan et du Sinaï.",
            es: "El término Naksa se refiere a la derrota de los ejércitos árabes ante Israel y la ocupación de toda Palestina, el Golán y el Sinaí."
        },
        stat: { ar: "15,000 - 25,000 شهيد", en: "15,000 - 25,000 Martyrs", fr: "15 000 - 25 000 Martyrs", es: "15.000 - 25.000 Mártires" },
        statExp: {
            ar: "شهداء العمليات العسكرية والدفاع عن الأراضي العربية والفلسطينية",
            en: "Martyrs of military operations and defense of Arab and Palestinian lands",
            fr: "Martyrs des opérations militaires et de la défense des terres arabes et palestiniennes",
            es: "Mártires de operaciones militares y defensa de tierras árabes y palestinas"
        },
        sourceName: { ar: "الموسوعة التفاعلية للقضية الفلسطينية", en: "Interactive Encyclopedia of the Palestine Question", fr: "Encyclopédie de la question palestinienne", es: "Enciclopedia de la Cuestión Palestina" },
        sourceUrl: "https://www.palquest.org/"
    },
    { id: "d1970", type: "decade", decade: "1970" },
    {
        id: "m22", type: "scene", year: "1976",
        title: { ar: "يوم الأرض", en: "Land Day", fr: "Journée de la Terre", es: "Día de la Tierra" },
        alt: { ar: "", en: "", fr: "", es: "" },
        image: "images/timeline/22.jpg",
        excerpt: {
            ar: "هبة جماهيرية فلسطينية شاملة رداً على مصادرة سلطات الاحتلال لآلاف الدونمات من أراضي الجليل والمثلث.",
            en: "A comprehensive Palestinian popular uprising in response to the occupation's confiscation of thousands of dunams in Galilee.",
            fr: "Un soulèvement populaire palestinien complet en réponse à la confiscation de milliers de dunams en Galilée par l'occupation.",
            es: "Un levantamiento popular palestino completo en respuesta a la confiscación de miles de dunams en Galilea por parte de la ocupación."
        },
        stat: { ar: "6 شهداء", en: "6 Martyrs", fr: "6 Martyrs", es: "6 Mártires" },
        statExp: {
            ar: "ستة شهداء سقطوا دفاعاً عن الأرض في أراضي الداخل المحتل عام 1948",
            en: "Six martyrs fell defending their land in the occupied territories of 1948",
            fr: "Six martyrs sont tombés en défendant leur terre dans les territoires occupés de 1948",
            es: "Seis mártires cayeron defendiendo su tierra en los territorios ocupados de 1948"
        },
        sourceName: { ar: "تقارير توثيقية فلسطينية", en: "Palestinian Documentary Reports", fr: "Rapports documentaires palestiniens", es: "Informes Documentales Palestinos" },
        sourceUrl: "https://ar.wikipedia.org"
    },
    { id: "d1980", type: "decade", decade: "1980" },
    {
        id: "m11", type: "scene", year: "1987",
        title: { ar: "الانتفاضة الفلسطينية الأولى", en: "First Palestinian Intifada", fr: "Première Intifada palestinienne", es: "Primera Intifada Palestina" },
        alt: { ar: "انتفاضة الحجارة", en: "Stone Intifada", fr: "Intifada des pierres", es: "Intifada de las Piedras" },
        image: "images/timeline/11.jpg",
        excerpt: {
            ar: "هبة شعبية كبرى انطلقت من مخيم جباليا في قطاع غزة وامتدت لكافة المدن والقرى الفلسطينية.",
            en: "A major popular uprising that began in Jabalia refugee camp in Gaza and spread to all Palestinian cities and villages.",
            fr: "Un soulèvement populaire majeur qui a commencé au camp de Jabalia à Gaza et s'est étendu à toutes les villes palestiniennes.",
            es: "Un gran levantamiento popular que comenzó en el campamento de Jabalia en Gaza y se extendió a todas las ciudades palestinas."
        },
        stat: { ar: "أكثر من 1300 شهيد", en: "Over 1,300 Martyrs", fr: "Plus de 1 300 Martyrs", es: "Más de 1.300 Mártires" },
        statExp: {
            ar: "شهداء رصاص الاحتلال والمواجهات الشعبية والحجارة خلال الانتفاضة الأولى",
            en: "Martyrs of occupation bullets, popular clashes, and stones during the First Intifada",
            fr: "Martyrs des balles d'occupation, affrontements populaires et pierres pendant la première Intifada",
            es: "Mártires de balas de ocupación, enfrentamientos populares y piedras durante la Primera Intifada"
        },
        sourceName: { ar: "مركز المعلومات الوطني الفلسطيني (وفا)", en: "Palestinian National Information Center (Wafa)", fr: "Centre d'information national palestinien (Wafa)", es: "Centro de Información Nacional Palestino (Wafa)" },
        sourceUrl: "https://www.wafa.ps/"
    },
    { id: "d1990", type: "decade", decade: "1990" },
    {
        id: "m25", type: "scene", year: "1994",
        title: { ar: "مجزرة الحرم الإبراهيمي", en: "Ibrahimi Mosque Massacre", fr: "Massacre de la mosquée d'Ibrahim", es: "Masacre de la Mezquita Ibrahimi" },
        alt: { ar: "", en: "", fr: "", es: "" },
        image: "images/timeline/25.jpg",
        excerpt: {
            ar: "إطلاق نار متطرف داخل الحرم الإبراهيمي الشريف في مدينة الخليل أثناء صلاة الفجر.",
            en: "An extremist mass shooting inside the Ibrahimi Mosque in Hebron during dawn prayers.",
            fr: "Une fusillade de masse extrémiste à l'intérieur de la mosquée d'Ibrahim à Hébron pendant les prières de l'aube.",
            es: "Un tiroteo masivo extremista dentro de la Mezquita Ibrahimi en Hebrón durante las oraciones del amanecer."
        },
        stat: { ar: "29 شهيداً", en: "29 Martyrs", fr: "29 Martyrs", es: "29 Mártires" },
        statExp: {
            ar: "29 شهيداً ارتقوا داخل المسجد أثناء صلاة الفجر",
            en: "29 martyrs fell inside the mosque during dawn prayers",
            fr: "29 martyrs sont tombés à l'intérieur de la mosquée pendant les prières de l'aube",
            es: "29 mártires cayeron dentro de la mezquita durante las oraciones del amanecer"
        },
        sourceName: { ar: "ويكيبيديا والموسوعة التفاعلية", en: "Wikipedia & Interactive Encyclopedia", fr: "Wikipédia & Encyclopédie interactive", es: "Wikipedia y Enciclopedia Interactiva" },
        sourceUrl: "https://ar.wikipedia.org"
    },
    { id: "d2000", type: "decade", decade: "2000" },
    {
        id: "m12", type: "scene", year: "2000",
        title: { ar: "الانتفاضة الفلسطينية الثانية", en: "Second Palestinian Intifada", fr: "Seconde Intifada palestinienne", es: "Segunda Intifada Palestina" },
        alt: { ar: "انتفاضة الأقصى", en: "Al-Aqsa Intifada", fr: "Intifada d'Al-Aqsa", es: "Intifada de Al-Aqsa" },
        image: "images/timeline/12.jpg",
        excerpt: {
            ar: "اندلعت عقب اقتحام أرييل شارون للمسجد الأقصى، وشهدت مواجهات مسلحة واجتياحات واسعة لمدن الضفة وغزة.",
            en: "Erupted after Ariel Sharon's storming of Al-Aqsa Mosque, featuring armed clashes and widespread invasions of West Bank and Gaza cities.",
            fr: "A éclaté après l'assaut d'Ariel Sharon sur la mosquée Al-Aqsa, avec des affrontements armés et de larges invasions de la Cisjordanie et de Gaza.",
            es: "Estalló tras la incursión de Ariel Sharon en la Mezquita de Al-Aqsa, caracterizándose por enfrentamientos armados y amplias invasiones."
        },
        stat: { ar: "آلاف الشهداء", en: "Thousands of Martyrs", fr: "Des milliers de Martyrs", es: "Miles de Mártires" },
        statExp: {
            ar: "أكثر من 4000 شهيد وثقتهم السجلات الرسمية خلال انتفاضة الأقصى",
            en: "Over 4,000 martyrs documented in official records during Al-Aqsa Intifada",
            fr: "Plus de 4 000 martyrs documentés dans les registres officiels pendant l'Intifada d'Al-Aqsa",
            es: "Más de 4.000 mártires documentados en registros oficiales durante la Intifada de Al-Aqsa"
        },
        sourceName: { ar: "مركز المعلومات الوطني الفلسطيني (وفا)", en: "Palestinian National Information Center (Wafa)", fr: "Wafa - Centre d'information", es: "Wafa - Centro de Información" },
        sourceUrl: "https://www.wafa.ps/"
    },
    { id: "d2010", type: "decade", decade: "2010" },
    {
        id: "m15", type: "scene", year: "2014",
        title: { ar: "الجرف الصامد", en: "Battle of Protective Edge", fr: "Bataille de la Bordure protectrice", es: "Guerra de Gaza de 2014" },
        alt: { ar: "حرب غزة 2014", en: "2014 Gaza War", fr: "Guerre de Gaza 2014", es: "Guerra de Gaza 2014" },
        image: "images/timeline/15.jpg",
        excerpt: {
            ar: "حرب مدمرة استمرت 51 يوماً ضد قطاع غزة، وشهدت مجازر مروعة بحق العائلات وتدميراً واسعاً.",
            en: "A devastating 51-day war against the Gaza Strip, featuring horrific massacres against families and widespread destruction.",
            fr: "Une guerre dévastatrice de 51 jours contre la bande de Gaza, marquée par d'horribles massacres de familles et une destruction généralisée.",
            es: "Una devastadora guerra de 51 días contra la Franja de Gaza, con horribles masacres contra familias y destrucción generalizada."
        },
        stat: { ar: "2,200+ شهيد", en: "2,200+ Martyrs", fr: "2 200+ Martyrs", es: "2.200+ Mártires" },
        statExp: {
            ar: "أكثر من 2200 شهيد بينهم مئات الأطفال والنساء وعائلات بأكملها مسحت من السجل المدني",
            en: "Over 2,200 martyrs, including hundreds of children and women, and entire families wiped from civil registry",
            fr: "Plus de 2 200 martyrs, dont des centaines d'enfants et de femmes, et des familles entières effacées de l'état civil",
            es: "Más de 2.200 mártires, incluidos cientos de niños y mujeres, y familias enteras borradas del registro civil"
        },
        sourceName: { ar: "الجهاز المركزي للإحصاء الفلسطيني", en: "Palestinian Central Bureau of Statistics", fr: "Bureau central palestinien des statistiques", es: "Oficina Central de Estadísticas de Palestina" },
        sourceUrl: "https://www.pcbs.gov.ps/"
    },
    { id: "d2020", type: "decade", decade: "2020" },
    {
        id: "m30", type: "scene", year: "2023 - 2026",
        title: { ar: "طوفان الأقصى والعدوان الشامل", en: "Al-Aqsa Flood & Ongoing Genocide", fr: "Déluge d'Al-Aqsa & Génocide en cours", es: "Diluvio de Al-Aqsa y Genocidio en curso" },
        alt: { ar: "حرب الإبادة", en: "The Genocide War", fr: "La guerre de génocide", es: "La guerra de genocidio" },
        image: "images/timeline/30.jpg",
        excerpt: {
            ar: "الملحمة التاريخية الكبرى وطوفان الأقصى وما تلاه من حرب إبادة جماعية وعدوان غير مسبوق على قطاع غزة والضفة والمنطقة.",
            en: "The historic epic and Al-Aqsa Flood, followed by the unprecedented genocidal war and aggression on Gaza, West Bank, and the region.",
            fr: "L'épopée historique du déluge d'Al-Aqsa, suivie d'une guerre de génocide et d'une agression sans précédent sur Gaza, la Cisjordanie et la région.",
            es: "La epopeya histórica del Diluvio de Al-Aqsa, seguida de una guerra genocida y agresión sin precedentes contra Gaza, Cisjordania y la región."
        },
        stat: { ar: "عشرات الآلاف من الشهداء", en: "Tens of Thousands of Martyrs", fr: "Des dizaines de milliers de Martyrs", es: "Decenas de miles de Mártires" },
        statExp: {
            ar: "أكثر من 158,000 إلى 291,000 شهيد ومفقود وجريح ومستشهد تحت الأنقاض وفي حرب الإبادة الجماعية المستمرة",
            en: "Over 158,000 to 291,000 martyrs, missing, wounded, and victims under rubble in the ongoing genocidal war",
            fr: "De 158 000 à 291 000 martyrs, disparus, blessés et victimes sous les décombres dans la guerre de génocide en cours",
            es: "Más de 158.000 a 291.000 mártires, desaparecidos, heridos y víctimas bajo los escombros en la guerra de genocidio en curso"
        },
        sourceName: { ar: "الجهاز المركزي للإحصاء الفلسطيني وتقارير الأمم المتحدة", en: "Palestinian Bureau of Statistics & UN Reports", fr: "Bureau des statistiques palestinien & rapports de l'ONU", es: "Oficina de Estadísticas de Palestina e informes de la ONU" },
        sourceUrl: "https://www.pcbs.gov.ps/"
    }
];

function changeLanguage(langCode) {
    if (!translations[langCode]) langCode = 'ar';
    currentLang = langCode;
    localStorage.setItem('site_lang', langCode);
    const t = translations[currentLang];

    const htmlRoot = document.getElementById('html-root');
    if (htmlRoot) {
        htmlRoot.lang = currentLang;
        htmlRoot.dir = (currentLang === 'ar') ? 'rtl' : 'ltr';
    }
    const langSelect = document.getElementById('language-select');
    if (langSelect) langSelect.value = currentLang;

    const flagImg = document.getElementById('selected-flag-img');
    if (flagImg) {
        if (currentLang === 'ar') flagImg.src = 'images/icons/arab.png';
        else if (currentLang === 'en') flagImg.src = 'images/icons/royaume-uni.png';
        else if (currentLang === 'fr') flagImg.src = 'images/icons/france.png';
        else if (currentLang === 'es') flagImg.src = 'images/icons/espagne.png';
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
    setInnerText('verse-text', t.verse);
    setInnerText('dev-text', t.devText);
    setInnerText('share-btn-text', t.shareBtn);
    setInnerText('martyrs-label', t.martyrsLabel);

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

    // Localize Crowdsource form elements
    const csTitle = document.querySelector('#crowdsource-modal-overlay h2');
    if (csTitle) csTitle.innerText = t.csTitle;

    const csAdminLink = document.querySelector('#crowdsource-modal-overlay button[onclick="openAdminReviewPanel()"]');
    if (csAdminLink) {
        csAdminLink.innerHTML = `<img src="images/icons/administration-du-systeme.png" class="w-3.5 h-3.5 object-contain inline-block mr-1 align-middle" alt="admin"> ${t.csAdminLink}`;
    }

    const labels = document.querySelectorAll('#crowdsource-modal-overlay label');
    if (labels.length >= 5) {
        labels[0].innerText = t.csSubmitterLabel;
        labels[1].innerText = t.csNameLabel;
        labels[2].innerText = t.csCityLabel;
        labels[3].innerText = t.csNotesLabel;
        labels[4].innerText = t.csPhotoLabel;
    }
    const captchaLabel = document.querySelector('#crowdsource-modal-overlay .bg-red-950\\/20 label');
    if (captchaLabel) captchaLabel.innerText = t.csCaptchaLabel;

    setPlaceholder('cs-submitter', t.csSubmitterPlaceholder);
    setPlaceholder('cs-martyr-name', t.csNamePlaceholder);
    setPlaceholder('cs-martyr-city', t.csCityPlaceholder);
    setPlaceholder('cs-notes', t.csNotesPlaceholder);
    setPlaceholder('cs-photo', t.csPhotoLabel);
    setPlaceholder('cs-captcha-answer', t.csCaptchaPlaceholder);

    const csSubmitBtn = document.querySelector('#crowdsource-modal-overlay button[type="submit"]');
    if (csSubmitBtn) csSubmitBtn.innerText = t.csSubmitButton;

    // Localize Martyr Modal additional elements
    const tributeCandleText = document.getElementById('tribute-candle-text');
    if (tributeCandleText) tributeCandleText.innerText = t.tributeCandleText;
    const tributeEditText = document.getElementById('tribute-edit-text');
    if (tributeEditText) tributeEditText.innerText = t.tributeEditText;

    const tributeLeaveMark = document.querySelector('#martyr-modal-overlay h4');
    if (tributeLeaveMark) tributeLeaveMark.innerText = t.tributeLeaveMark;

    setPlaceholder('tribute-name-input', t.tributeNamePlaceholder);
    setPlaceholder('tribute-msg-input', t.tributeMsgPlaceholder);

    const tributeSubmitBtn = document.querySelector('#martyr-modal-overlay button[onclick="submitVirtualTribute()"]');
    if (tributeSubmitBtn) tributeSubmitBtn.innerText = t.tributeSubmitBtn;

    const tributeLatestLabel = document.querySelector('#martyr-modal-overlay h5');
    if (tributeLatestLabel) tributeLatestLabel.innerText = t.tributeLatestLabel;

    // Localize bottom-bar Crowdsource buttons
    const crowdsourceBtns = document.querySelectorAll('button[onclick="openCrowdsourceModal()"]');
    crowdsourceBtns.forEach(btn => {
        btn.innerHTML = `<img src="images/icons/editing info.png" class="w-3.5 h-3.5 object-contain inline-block mr-1 align-middle" alt="edit"> ${t.csTitle}`;
    });

    // Populate stats and charts if on stats view
    if (currentMainMode === 'stats') {
        renderStatisticsGrid();
        renderStatsPageCharts(currentLang);
    }

    // Refresh active tab views if applicable
    if (currentMainMode === 'westbank') {
        renderTributeCards('wb-cards-container', applyApprovedSubmissions(westBankMartyrsData));
    } else if (currentMainMode === 'martyrs48') {
        renderTributeCards('m48-cards-container', applyApprovedSubmissions(martyrs48Data));
    } else if (currentMainMode === 'milestones') {
        renderCinematicTimeline();
    }

    updateMusicButton();
    isDirty = true;
}

window.shareSite = function(){
    const t = translations[currentLang] || translations.ar;
    navigator.clipboard.writeText(window.location.href).then(() => alert(t.copyLinkSuccess));
};

window.shareMartyrCard = function(){
    if(!currentMartyrObj) return;
    const btn = document.getElementById('share-btn-modal');
    const originalText = btn.innerText;
    const t = translations[currentLang] || translations.ar;
    btn.innerText = t.imagePreparing;
    btn.disabled = true;

    const person = currentMartyrObj;
    const dispName = typeof person.name === 'object' ? (person.name[currentLang] || person.name.ar) : (person.name_ar || person.name || 'شهيد مجهول');
    const dispNameEn = typeof person.name === 'object' ? (person.name.en || '') : (person.name_en || person.english_name || person.en_name || '');

    document.getElementById('capture-name').innerText = dispName;
    document.getElementById('capture-name-en').innerText = dispNameEn;
    document.getElementById('capture-age').innerText = person.age || 'غير معروف';
    document.getElementById('capture-id').innerText = person.id || '-';

    const imgContainer = document.getElementById('capture-img-container');
    if (person.image) {
        imgContainer.innerHTML = `<img src="${person.image}" style="width:100%; height:100%; object-fit:cover;" crossorigin="anonymous">`;
    } else {
        imgContainer.innerHTML = `<span style="color:#666; font-size: 1.2rem;">${t.modalPhotoText}</span>`;
    }

    const cardElement = document.getElementById('shareable-card');

    html2canvas(cardElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0a0a0a'
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `توثيق_الشهيد_${(dispName || 'مجهول').replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        btn.innerText = originalText;
        btn.disabled = false;
    }).catch(err => {
        console.error("Error generating card image:", err);
        alert(t.imageCaptureError);
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

    const transTitle = typeof item.title === 'object' ? (item.title[currentLang] || item.title.ar) : item.title;
    const transAlt = typeof item.alt === 'object' ? (item.alt[currentLang] || item.alt.ar) : item.alt;
    const transExcerpt = typeof item.excerpt === 'object' ? (item.excerpt[currentLang] || item.excerpt.ar) : item.excerpt;
    const transStat = typeof item.stat === 'object' ? (item.stat[currentLang] || item.stat.ar) : item.stat;
    const transStatExp = typeof item.statExp === 'object' ? (item.statExp[currentLang] || item.statExp.ar) : (item.statExp || transExcerpt);
    const transSourceName = typeof item.sourceName === 'object' ? (item.sourceName[currentLang] || item.sourceName.ar) : (item.sourceName || 'الموسوعة التفاعلية للقضية الفلسطينية');

    container.innerHTML = `
        <div class="tlc-modal-content">
            <h2 class="tlc-modal-title">${transTitle} ${transAlt ? `<span class="tlc-mdl-alt">(${transAlt})</span>` : ''}</h2>
            <div class="tlc-modal-meta"><time>${item.year}</time></div>
            <img class="tlc-modal-img" src="${item.image}" alt="" onerror="this.style.display='none'">
            <div class="tlc-modal-desc">${transExcerpt}</div>
            <div class="tlc-modal-stat">
                <span class="tlc-mdl-stat-label">${t.tlcStatLabel || 'عدد الشهداء:'}</span>
                <span class="tlc-mdl-stat-num">${transStat}</span>
                <p class="tlc-mdl-stat-exp">${transStatExp}</p>
            </div>
            <div class="tlc-modal-source">
                <span>${t.source}</span>
                <a href="${item.sourceUrl || 'https://www.palquest.org/'}" target="_blank" rel="noopener">${transSourceName}</a>
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
    {
        id: "wb1",
        name: { ar: "شيرين أبو عاقلة", en: "Shireen Abu Akleh", fr: "Shireen Abu Akleh", es: "Shireen Abu Akleh" },
        age: 51,
        date: "2022-05-11",
        city: { ar: "القدس / جنين", en: "Jerusalem / Jenin", fr: "Jérusalem / Jénine", es: "Jerusalén / Yenín" },
        notes: {
            ar: "صحفية فلسطينية مخضرمة عملت مع شبكة الجزيرة الإعلامية لأكثر من ربع قرن. استشهدت برصاص جيش الاحتلال الإسرائيلي أثناء تغطيتها لاجتياح مخيم جنين بالرغم من ارتدائها خوذة وسترة الصحافة المميّزة.",
            en: "A veteran Palestinian journalist with Al Jazeera who was martyred by Israeli bullets while covering the Jenin camp raid despite wearing her press vest and helmet.",
            fr: "Une journaliste palestinienne chevronnée d'Al Jazeera martyrisée par des balles israéliennes lors du raid de Jénine.",
            es: "Periodista palestina veterana de Al Jazeera martirizada por balas israelíes en Jenín."
        }
    },
    {
        id: "wb2",
        name: { ar: "إبراهيم النابلسي", en: "Ibrahim al-Nabulsi", fr: "Ibrahim al-Nabulsi", es: "Ibrahim al-Nabulsi" },
        age: 18,
        date: "2022-08-09",
        city: { ar: "نابلس", en: "Nablus", fr: "Naplouse", es: "Nablus" },
        notes: {
            ar: "أحد أبرز قادة المقاومة الشبابية في البلدة القديمة بنابلس. ارتقى شهيداً بعد محاصرة منزله وخوضه اشتباكاً بطولياً، تاركاً وصية وطنية خالدة تدعو للاستمرار وعدم ترك السلاح.",
            en: "One of the prominent resistance commanders in Nablus, martyred after a heroic standoff during a raid on his home.",
            fr: "L'un des commandants de la résistance à Naplouse, martyrisé lors d'un affrontement héroïque.",
            es: "Destacado comandante de la resistencia en Nablus, martirizado en un heroico enfrentamiento."
        }
    },
    {
        id: "wb3",
        name: { ar: "باسل الأعرج", en: "Basil al-Araj", fr: "Basil al-Araj", es: "Basil al-Araj" },
        age: 31,
        date: "2017-03-06",
        city: { ar: "بيت لحم / البيرة", en: "Bethlehem / Al-Bireh", fr: "Bethléem / Al-Bireh", es: "Belén / Al-Bireh" },
        notes: {
            ar: "مثقف مشتبك، وباحث ومؤرخ فلسطيني وصيدلي رائد. أسس لمفهوم الثقافة المقاومة ونال الشهادة بعد خوضه اشتباكاً مسلحاً مع قوات الاحتلال الخاصة بعد مطاردة دامت عدة أشهر.",
            en: "An intellectual, researcher, and pharmacist who championed cultural resistance and was martyred in an armed clash.",
            fr: "Intellectuel, chercheur et pharmacien qui a défendu la résistance culturelle, martyrisé lors d'un affrontement.",
            es: "Intelectual, investigador y farmacéutico que defendió la resistencia cultural, martirizado en un enfrentamiento."
        }
    },
    {
        id: "wb4",
        name: { ar: "جميل العموري", en: "Jamil al-Amouri", fr: "Jamil al-Amouri", es: "Jamil al-Amouri" },
        age: 25,
        date: "2021-06-10",
        city: { ar: "جنين", en: "Jenin", fr: "Jénine", es: "Yenín" },
        notes: {
            ar: "أحد مؤسسي كتيبة جنين، ارتقى شهيداً بعد استهدافه من قِبل قوة خاصة لجيش الاحتلال، ليتحول اسمه إلى أيقونة وملهم للحراك الشبابي المقاوم في مخيم جنين.",
            en: "One of the founders of the Jenin Brigade, martyred after being targeted by a special Israeli force.",
            fr: "L'un des fondateurs de la brigade de Jénine, martyrisé par les forces d'occupation.",
            es: "Uno de los fundadores de la Brigada de Yenín, martirizado por fuerzas especiales de ocupación."
        }
    },
    {
        id: "wb5",
        name: { ar: "محمد الدرة", en: "Muhammad al-Durrah", fr: "Muhammad al-Durrah", es: "Muhammad al-Durrah" },
        age: 12,
        date: "2000-09-30",
        city: { ar: "القدس / غزة", en: "Jerusalem / Gaza", fr: "Jérusalem / Gaza", es: "Jerusalén / Gaza" },
        notes: {
            ar: "أيقونة الانتفاضة الثانية، ارتقى شهيداً برصاص الاحتلال وهو يحتمي خلف والده في شارع صلاح الدين، في مشهد وثقته عدسات الكاميرات وهز الضمير العالمي.",
            en: "The icon of the Second Intifada, martyred by occupation bullets while shielding behind his father.",
            fr: "Icône de la seconde Intifada, martyrisé par des balles alors qu'il s'abritait derrière son père.",
            es: "Icono de la Segunda Intifada, martirizado por balas de ocupación mientras se protegía con su padre."
        }
    },
    {
        id: "wb6",
        name: { ar: "أمير أبو خديجة", en: "Amir Abu Khadijah", fr: "Amir Abu Khadijah", es: "Amir Abu Khadijah" },
        age: 25,
        date: "2023-03-23",
        city: { ar: "طولكرم", en: "Tulkarm", fr: "Tulkarem", es: "Tulkarem" },
        notes: {
            ar: "مؤسس كتيبة الرد السريع في طولكرم، ارتقى شهيداً في أول أيام شهر رمضان المبارك بعد خوضه اشتباكاً مسلحاً بطولياً دفاعاً عن مدينته ومخيمها.",
            en: "Founder of the Tulkarm Rapid Response Brigade, martyred on the first day of Ramadan in a heroic clash.",
            fr: "Fondateur de la brigade d'intervention rapide de Tulkarem, martyrisé lors d'un affrontement.",
            es: "Fundador de la Brigada de Tulkarem, martirizado el primer día de Ramadán en un heroico enfrentamiento."
        }
    }
];

const martyrs48Data = [
    {
        id: "m48_1",
        name: { ar: "خديجة شواهنة", en: "Khadija Shawahneh", fr: "Khadija Shawahneh", es: "Khadija Shawahneh" },
        age: 23,
        date: "1976-03-30",
        city: { ar: "سخنين", en: "Sakhnin", fr: "Sakhnin", es: "Sajnin" },
        notes: {
            ar: "إحدى شهداء هبة يوم الأرض الخالدة عام 1976، ارتدت ثوب الشهادة دفاعاً عن الأراضي والقرى الفلسطينية المهددة بالمصادرة والتهويد في الجليل.",
            en: "One of the martyrs of the eternal Land Day uprising in 1976, defending Palestinian lands in Galilee against confiscation.",
            fr: "L'une des martyres du soulèvement de la Journée de la Terre en 1976, défendant les terres de Galilée.",
            es: "Una de las mártires del levantamiento del Día de la Tierra en 1976, defendiendo las tierras de Galilea."
        }
    },
    {
        id: "m48_2",
        name: { ar: "رجاء أبو الهيجا", en: "Raja Abu al-Heja", fr: "Raja Abu al-Heja", es: "Raja Abu al-Heja" },
        age: 21,
        date: "1976-03-30",
        city: { ar: "طمرة", en: "Tamra", fr: "Tamra", es: "Tamra" },
        notes: {
            ar: "شاب فلسطيني بطل ارتقى خلال مواجهات يوم الأرض البطولية في الجليل، مدافعاً عن الهوية العربية والوجود الفلسطيني بوجه سياسات التهجير والمصادرة.",
            en: "A heroic young Palestinian martyred during Land Day confrontations in Galilee, defending Arab identity.",
            fr: "Un jeune Palestinien héroïque martyrisé lors des affrontements de la Journée de la Terre en Galilée.",
            es: "Un heroico joven palestino martirizado durante los enfrentamientos del Día de la Tierra en Galilea."
        }
    },
    {
        id: "m48_3",
        name: { ar: "خير الدين حمدان", en: "Khair al-Din Hamdan", fr: "Khair al-Din Hamdan", es: "Khair al-Din Hamdan" },
        age: 22,
        date: "2014-11-08",
        city: { ar: "كفر كنا", en: "Kafr Kanna", fr: "Kafr Kanna", es: "Kafr Kanna" },
        notes: {
            ar: "شاب فلسطيني ارتقى شهيداً برصاص شرطة الاحتلال الإسرائيلي بدم بارد، لتعم الاحتجاجات والتظاهرات أراضي الداخل المحتل تنديداً بالاعتداءات المستمرة.",
            en: "A young Palestinian martyred by Israeli police bullets in cold blood, sparking widespread protests across the occupied territories.",
            fr: "Un jeune Palestinien martyrisé de sang-froid par la police israélienne, provoquant de grandes manifestations.",
            es: "Un joven palestino martirizado a sangre fría por la policía israelí, provocando grandes manifestaciones."
        }
    },
    {
        id: "m48_4",
        name: { ar: "رامز بشناق", en: "Ramez Bushnaq", fr: "Ramez Bushnaq", es: "Ramez Bushnaq" },
        age: 24,
        date: "2000-10-03",
        city: { ar: "كفر مندا", en: "Kafr Manda", fr: "Kafr Manda", es: "Kafr Manda" },
        notes: {
            ar: "استشهد برصاص شرطة الاحتلال الإسرائيلي خلال هبة أكتوبر 2000، التي اندلعت تضامناً مع أبناء شعبنا في غزة والضفة مع بداية الانتفاضة الثانية.",
            en: "Martyred by Israeli police during the October 2000 protests, which erupted in solidarity with Palestinians in Gaza and West Bank.",
            fr: "Martyrisé par la police lors des manifestations d'octobre 2000 en solidarité avec Gaza et la Cisjordanie.",
            es: "Martirizado por la policía durante las protestas de octubre de 2000 en solidaridad con Gaza y Cisjordania."
        }
    },
    {
        id: "m48_5",
        name: { ar: "إياد لوابنة", en: "Eyad Lawabny", fr: "Eyad Lawabny", es: "Eyad Lawabny" },
        age: 26,
        date: "2000-10-02",
        city: { ar: "الناصرة", en: "Nazareth", fr: "Nazareth", es: "Nazaret" },
        notes: {
            ar: "طبيب ومسعف فلسطيني ارتقى شهيداً في الناصرة أثناء تقديمه الإسعافات الأولية للجرحى خلال هبة أكتوبر 2000 البطولية بالداخل المحتل.",
            en: "A Palestinian paramedic and doctor martyred in Nazareth while providing first aid to the wounded during the October 2000 protests.",
            fr: "Un ambulancier et médecin palestinien martyrisé à Nazareth alors qu'il soignait des blessés en octobre 2000.",
            es: "Un paramédico y médico palestino martirizado en Nazaret mientras atendía a los heridos en octubre de 2000."
        }
    },
    {
        id: "m48_6",
        name: { ar: "أحمد جبارين", en: "Ahmed Jabarin", fr: "Ahmed Jabarin", es: "Ahmed Jabarin" },
        age: 18,
        date: "2000-10-01",
        city: { ar: "أم الفحم", en: "Umm al-Fahm", fr: "Umm al-Fahm", es: "Umm al-Fahm" },
        notes: {
            ar: "شاب في مقتبل العمر ارتقى شهيداً برصاص القناصة خلال التظاهرات السلمية في أم الفحم دفاعاً عن المسجد الأقصى المبارك والهوية الوطنية.",
            en: "A young Palestinian martyred by sniper bullets during peaceful protests in Umm al-Fahm defending Al-Aqsa Mosque.",
            fr: "Un jeune Palestinien martyrisé par un tireur d'élite lors de manifestations pacifiques à Umm al-Fahm pour Al-Aqsa.",
            es: "Un joven palestino martirizado por un francotirador durante manifestaciones pacíficas en Umm al-Fahm por Al-Aqsa."
        }
    }
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

        let title = typeof item.name === 'object' ? (item.name[currentLang] || item.name.ar) : item.name;
        let subtitle = item.name_en || item.english_name || item.en_name || '';
        if (currentLang !== 'ar') {
            if (typeof item.name === 'object') {
                title = item.name[currentLang] || item.name.en;
                subtitle = item.name.en;
            } else {
                title = transliterateName(item.name, currentLang);
                subtitle = item.name_en || item.english_name || item.en_name || transliterateName(item.name, 'en');
            }
        }

        const notes = typeof item.notes === 'object' ? (item.notes[currentLang] || item.notes.ar) : (currentLang === 'ar' ? (item.notes || '') : translateContentInstantly(item.notes || '', item.name, currentLang));
        const city = typeof item.city === 'object' ? (item.city[currentLang] || item.city.ar) : (currentLang === 'ar' ? (item.city || '') : translateCity(item.city || '', currentLang));

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
        renderStatisticsGrid();
        renderStatsPageCharts(currentLang);
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
        const nameEn = (person.name_en || person.english_name || person.en_name || "").toLowerCase();
        const id = (person.id || "").toString();
        return nameAr.includes(currentSearchQuery) || nameEn.includes(currentSearchQuery) || id.includes(currentSearchQuery);
    }).slice(0, 15);

    if (matches.length === 0) {
        const noResultsText = currentLang === 'ar' ? 'لا توجد نتائج مطابقة' :
                              currentLang === 'en' ? 'No matching results found' :
                              currentLang === 'fr' ? 'Aucun résultat' : 'No hay resultados';
        dropdown.innerHTML = `<div class="p-3 text-center text-gray-500">${noResultsText}</div>`;
    } else {
        let html = '';
        matches.forEach(person => {
            let displayName = person.name_ar || person.name || person.name_en || 'شهيد مجهول';
            let subtitle = person.name_en || person.english_name || person.en_name || '';
            if (currentLang !== 'ar') {
                displayName = transliterateName(person.name || '', currentLang);
                subtitle = person.name_en || person.english_name || person.en_name || transliterateName(person.name || '', 'en');
            }
            const ageText = currentLang === 'ar' ? 'العمر' :
                            currentLang === 'en' ? 'Age' :
                            currentLang === 'fr' ? 'Âge' : 'Edad';
            const displayAge = person.age || (currentLang === 'ar' ? 'غير معروف' : 'Unknown');

            html += `
                <div class="search-result-item p-2.5 hover:bg-red-950/40 border-b border-white/5 cursor-pointer flex justify-between items-center transition-all" onclick="selectSearchMartyr(${JSON.stringify(person).replace(/"/g, '&quot;')})">
                    <div class="text-right flex-1">
                        <div class="font-bold text-white">${displayName}</div>
                        ${subtitle ? `<div class="text-[10px] text-gray-400 font-mono">${subtitle}</div>` : ''}
                    </div>
                    <span class="bg-red-600/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full mr-2 whitespace-nowrap">${ageText}: ${displayAge}</span>
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
        name_en: item.name_en || item.english_name || item.en_name || '',
        age: item.age || 'غير معروف',
        image: item.image ? (item.image.startsWith('/') ? item.image.slice(1) : item.image) : '',
        notes: item.notes || '',
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

// تهيئة كانفاس الشهب المتساقطة
const shootingCanvas = document.getElementById('shooting-stars-canvas');
const shootingCtx = shootingCanvas ? shootingCanvas.getContext('2d') : null;
let shootingStars = [];

function createShootingStar() {
    return {
        x: Math.random() * width * 1.5,
        y: Math.random() * height * 0.3,
        length: Math.random() * 80 + 50,
        speed: Math.random() * 0.4 + 0.3, // تساقط ببطء شديد للغاية
        opacity: 0,
        fadeState: 'in'
    };
}

function updateAndDrawShootingStars() {
    if (!shootingCtx) return;
    shootingCtx.clearRect(0, 0, width, height);

    // توليد شهاب جديد عشوائياً بمعدل منخفض جداً ليظهر ببطء وتباعد
    if (shootingStars.length < 2 && Math.random() < 0.003) {
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

    // 4. تجميع خصائص السياق (State Batching) لشهداء اللون الأبيض (العاديين أو الباهتين)
    ctx.fillStyle = queryActive ? 'rgba(255, 255, 255, 0.15)' : '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < cachedItems.length; i++) {
        const item = cachedItems[i];

        if (item.screenX < -10 || item.screenX > width + 10 || item.screenY < -10 || item.screenY > height + 10) {
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

    // رسم النجوم المطابقة للبحث ككوكبة مضيئة بارزة ومتحركة
    if (queryActive) {
        for (let i = 0; i < cachedItems.length; i++) {
            const item = cachedItems[i];

            if (item.screenX < -10 || item.screenX > width + 10 || item.screenY < -10 || item.screenY > height + 10) {
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

    // تحديث الإحداثيات لحركة النجوم البطيئة للغاية في الخلفية السماوية
    const driftSpeed = 0.04;
    for (let i = 0; i < cachedItems.length; i++) {
        const item = cachedItems[i];
        item.screenX -= driftSpeed * (i % 2 === 0 ? 0.8 : 1.2);
        item.screenY += driftSpeed * 0.4;

        if (item.screenX < -20) item.screenX = width + 20;
        if (item.screenX > width + 20) item.screenX = -20;
        if (item.screenY < -20) item.screenY = height + 20;
        if (item.screenY > height + 20) item.screenY = -20;
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
    const t = translations[currentLang] || translations.ar;
    if (ansVal !== (captchaNum1 + captchaNum2)) {
        alert(t.csCaptchaLabel);
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

        alert(currentLang === 'ar' ? 'تم إرسال مساهمتك بنجاح وهي قيد المراجعة والاعتماد الآن.' :
              currentLang === 'fr' ? 'Votre contribution a été envoyée avec succès et est en cours d\'examen.' :
              currentLang === 'es' ? 'Su contribución ha sido enviada con éxito y está bajo revisión.' :
              'Your submission has been sent successfully and is under review.');
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
window.applyApprovedSubmissions = applyApprovedSubmissions;

function openAdminReviewPanel() {
    const t = translations[currentLang] || translations.ar;
    const password = prompt(t.adminPasswordPrompt, '');
    if (password !== 'admin123') {
        alert(t.adminIncorrectPassword);
        return;
    }
    document.getElementById('crowdsource-modal-overlay').style.display = 'none';
    const adminOverlay = document.getElementById('admin-review-overlay');
    if (adminOverlay) {
        adminOverlay.style.display = 'flex';
        const h2 = adminOverlay.querySelector('h2');
        if (h2) h2.innerText = t.adminPanelTitle;
    }
    renderAdminSubmissions();
}

function renderAdminSubmissions() {
    const container = document.getElementById('admin-submissions-list');
    if (!container) return;

    const t = translations[currentLang] || translations.ar;

    let list = [];
    try {
        const stored = localStorage.getItem('crowdsourced_submissions');
        if (stored) list = JSON.parse(stored);
    } catch (err) {
        console.error(err);
    }

    if (list.length === 0) {
        container.innerHTML = `<div class="text-gray-500 text-center py-6">${t.adminNoPendingSubmissions}</div>`;
        return;
    }

    container.innerHTML = list.map(item => `
        <div class="bg-white/5 border border-white/10 p-3 rounded-xl space-y-2 relative text-right">
            <span class="absolute top-3 left-3 px-2 py-0.5 rounded text-[9px] font-bold ${
                item.status === 'approved' ? 'bg-green-600/20 border border-green-500 text-green-400' :
                item.status === 'rejected' ? 'bg-red-600/20 border border-red-500 text-red-400' :
                'bg-amber-600/20 border border-amber-500 text-amber-400'
            }">${item.status === 'approved' ? t.adminStatusApproved : item.status === 'rejected' ? t.adminStatusRejected : t.adminStatusPending}</span>

            <div class="text-red-400 font-bold mb-1">${t.adminSubmitter} ${item.submitter} (${item.date})</div>
            <div><strong>${t.adminMartyrName}</strong> ${item.name}</div>
            <div><strong>${t.adminCity}</strong> ${item.city}</div>
            <div><strong>${t.adminDetails}</strong> ${item.notes}</div>
            ${item.image ? `<div class="mt-1"><a href="${item.image}" target="_blank" class="text-blue-400 underline">${t.adminViewPhoto}</a></div>` : ''}

            ${item.status === 'pending' ? `
                <div class="flex gap-2 mt-2 pt-2 border-t border-white/10">
                    <button onclick="approveSubmission('${item.id}')" class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-[10px]">${t.adminApproveBtn}</button>
                    <button onclick="rejectSubmission('${item.id}')" class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-[10px]">${t.adminRejectBtn}</button>
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

        const t = translations[currentLang] || translations.ar;
        alert(t.adminSuccessApproved);
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
        const t = translations[currentLang] || translations.ar;
        alert(t.adminSuccessRejected);
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

    const dispName = typeof person.name === 'object' ? (person.name[currentLang] || person.name.ar) : (person.name || 'شهيد مجهول');
    document.getElementById('martyr-modal-name').innerText = dispName;
    const nameEnEl = document.getElementById('martyr-modal-name-en');
    const dispNameEn = typeof person.name === 'object' ? (person.name.en || '') : (person.name_en || person.english_name || person.en_name || '');
    if (dispNameEn) {
        nameEnEl.innerText = dispNameEn;
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

    // Dynamic injection of the premium "Edit Martyr" button in the modal
    const candleBtn = document.getElementById('tribute-candle-btn');
    if (candleBtn && candleBtn.parentElement) {
        const parent = candleBtn.parentElement;
        let editBtn = document.getElementById('tribute-edit-btn-dynamic');
        if (!editBtn) {
            editBtn = document.createElement('button');
            editBtn.id = 'tribute-edit-btn-dynamic';
            editBtn.className = 'btn-main text-[10px] px-2.5 py-1 bg-red-600/20 border border-red-500/40 text-red-400 rounded-full flex items-center gap-1';
            editBtn.innerHTML = '<img src="images/icons/editing info.png" class="w-3.5 h-3.5 object-contain inline-block align-middle" alt="edit"> <span id="tribute-edit-text">تعديل البيانات</span>';
            editBtn.onclick = function() { triggerMartyrEdit(); };
            parent.appendChild(editBtn);
        }
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
        const notesObj = currentMartyrObj.notes;
        const translatedNotes = typeof notesObj === 'object' ? (notesObj[lang] || notesObj.ar) : translateContentInstantly(notesObj, currentMartyrObj.name, lang);

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

    const transTitle = typeof currentMilestoneObj.title === 'object' ? (currentMilestoneObj.title[lang] || currentMilestoneObj.title.ar) : currentMilestoneObj.title;
    const transExcerpt = typeof currentMilestoneObj.excerpt === 'object' ? (currentMilestoneObj.excerpt[lang] || currentMilestoneObj.excerpt.ar) : currentMilestoneObj.excerpt;
    const transStat = typeof currentMilestoneObj.stat === 'object' ? (currentMilestoneObj.stat[lang] || currentMilestoneObj.stat.ar) : currentMilestoneObj.stat;
    const transStatExp = typeof currentMilestoneObj.statExp === 'object' ? (currentMilestoneObj.statExp[lang] || currentMilestoneObj.statExp.ar) : (currentMilestoneObj.statExp || transExcerpt);
    const transSourceName = typeof currentMilestoneObj.sourceName === 'object' ? (currentMilestoneObj.sourceName[lang] || currentMilestoneObj.sourceName.ar) : (currentMilestoneObj.sourceName || 'الموسوعة التفاعلية بالقضية الفلسطينية');

    container.innerHTML = `
        <div class="tlc-modal-content text-right text-xs">
            <h2 class="tlc-modal-title" style="font-size: 1.1rem; font-weight: bold; color: #ef4444;">${transTitle}</h2>
            <div class="tlc-modal-meta" style="color: #9ca3af; font-size: 0.75rem; margin-top: 4px;"><time>${currentMilestoneObj.year}</time></div>
            <img class="tlc-modal-img mt-3 rounded-xl max-h-48 w-full object-cover" src="${currentMilestoneObj.image}" alt="" onerror="this.style.display='none'">
            <div class="tlc-modal-desc mt-3 leading-relaxed text-gray-200" style="font-size: 0.8rem;">${transExcerpt}</div>
            <div class="tlc-modal-stat mt-4 bg-red-950/20 border border-red-500/20 p-3 rounded-xl">
                <span class="tlc-mdl-stat-label text-gray-400 block font-bold text-[10px]">${t.tlcStatLabel || 'عدد الشهداء:'}</span>
                <span class="tlc-mdl-stat-num text-red-400 font-black text-sm">${transStat}</span>
                <p class="tlc-mdl-stat-exp text-gray-300 mt-1" style="font-size: 0.75rem;">${transStatExp}</p>
            </div>
            <div class="tlc-modal-source mt-4 border-t border-white/10 pt-2 text-[10px] text-gray-500">
                <span>${t.source || 'المصدر:'}</span>
                <a href="${currentMilestoneObj.sourceUrl || 'https://www.palquest.org/'}" target="_blank" class="text-red-400 underline">${transSourceName}</a>
            </div>
        </div>
    `;
}

const statsHumanData = [
    {
        label: {
            ar: "نسبة الدمار الشامل بالقطاع",
            en: "Total Destruction Rate",
            fr: "Taux de destruction totale",
            es: "Tasa de destrucción total"
        },
        value: {
            ar: "أكثر من 90%",
            en: "Over 90%",
            fr: "Plus de 90%",
            es: "Más de 90%"
        },
        border: "border-red-600/20"
    },
    {
        label: {
            ar: "مجموع الشهداء بالمستشفيات",
            en: "Total Martyrs in Hospitals",
            fr: "Total des martyrs dans les hôpitaux",
            es: "Total de mártires en hospitales"
        },
        value: {
            ar: "73,066",
            en: "73,066",
            fr: "73 066",
            es: "73.066"
        },
        border: "border-red-600/20"
    },
    {
        label: {
            ar: "شهيدة من النساء",
            en: "Martyred Women",
            fr: "Femmes martyrisées",
            es: "Mujeres martirizadas"
        },
        value: {
            ar: "+12,500",
            en: "+12,500",
            fr: "+12 500",
            es: "+12.500"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "حالة فقدان بصر",
            en: "Cases of Vision Loss",
            fr: "Cas de perte de vision",
            es: "Casos de pérdida de visión"
        },
        value: {
            ar: "1,200",
            en: "1,200",
            fr: "1 200",
            es: "1.200"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "من مساحة القطاع تحت سيطرة الاحتلال",
            en: "Gaza Area Under Occupation Control",
            fr: "Zone de Gaza sous contrôle d'occupation",
            es: "Área de Gaza bajo control de ocupación"
        },
        value: {
            ar: "أكثر من 80%",
            en: "Over 80%",
            fr: "Plus de 80%",
            es: "Más de 80%"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "قصف منطقة المواصي المزعوم أنها آمنة",
            en: "Bombing of Allegedly Safe Mawasi Area",
            fr: "Bombardement de la zone d'Al-Mawasi prétendument sûre",
            es: "Bombardeo de la zona de Al-Mawasi supuestamente segura"
        },
        value: {
            ar: "241 مرة",
            en: "241 times",
            fr: "241 fois",
            es: "241 veces"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "شهيد من الأطفال",
            en: "Martyred Children",
            fr: "Enfants martyrisés",
            es: "Niños martirizados"
        },
        value: {
            ar: "+21,500",
            en: "+21,500",
            fr: "+21 500",
            es: "+21.500"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "حالة بتر (18% أطفال)",
            en: "Amputations (18% Children)",
            fr: "Amputations (18% d'enfants)",
            es: "Amputaciones (18% niños)"
        },
        value: {
            ar: "+5,400",
            en: "+5,400",
            fr: "+5 400",
            es: "+5.400"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "من متفجرات ألقيت على القطاع",
            en: "Explosives Dropped on the Strip",
            fr: "Explosifs largués sur la bande",
            es: "Explosivos lanzados sobre la Franja"
        },
        value: {
            ar: "+223 ألف طن",
            en: "+223k Tons",
            fr: "+223k Tonnes",
            es: "+223k Toneladas"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "مفقود",
            en: "Missing People",
            fr: "Personnes disparues",
            es: "Personas desaparecidas"
        },
        value: {
            ar: "9,500",
            en: "9,500",
            fr: "9 500",
            es: "9.500"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "رضيع ولد واستشهد خلال الحرب",
            en: "Infants Born and Martyred in War",
            fr: "Nourrissons nés et martyrisés pendant la guerre",
            es: "Bebés nacidos y martirizados en la guerra"
        },
        value: {
            ar: "+520",
            en: "+520",
            fr: "+520",
            es: "+520"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "حالة شلل",
            en: "Cases of Paralysis",
            fr: "Cas de paralysie",
            es: "Casos de parálisis"
        },
        value: {
            ar: "1,500",
            en: "1,500",
            fr: "1 500",
            es: "1.500"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "حالة إجهاض بسبب نقص الرعاية والغذاء",
            en: "Miscarriages Due to Malnutrition & Lack of Care",
            fr: "Fausses couches dues à la malnutrition et au manque de soins",
            es: "Abortos espontáneos por desnutrición y falta de atención"
        },
        value: {
            ar: "+12,000",
            en: "+12,000",
            fr: "+12 000",
            es: "+12.000"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "يتيم فقد أحد والديه أو كلاهما",
            en: "Orphans Who Lost One or Both Parents",
            fr: "Orphelins ayant perdu un ou deux parents",
            es: "Huérfanos que perdieron uno o ambos padres"
        },
        value: {
            ar: "58,800",
            en: "58,800",
            fr: "58 800",
            es: "58.800"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "جثمان سرقه الاحتلال من المقابر",
            en: "Bodies Stolen by Occupation from Cemeteries",
            fr: "Corps volés par l'occupation dans les cimetières",
            es: "Cuerpos robados por la ocupación de los cementerios"
        },
        value: {
            ar: "+2,450",
            en: "+2,450",
            fr: "+2 450",
            es: "+2.450"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "عائلة مسحت من السجل المدني",
            en: "Families Wiped from the Civil Registry",
            fr: "Familles effacées du registre civil",
            es: "Familias borradas del registro civil"
        },
        value: {
            ar: "+2,700",
            en: "+2,700",
            fr: "+2 700",
            es: "+2.700"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "من مرضى الكلى فقدوا حياتهم",
            en: "Kidney Patients Who Lost Their Lives",
            fr: "Patients rénaux ayant perdu la vie",
            es: "Pacientes renales que perdieron la vida"
        },
        value: {
            ar: "43%",
            en: "43%",
            fr: "43%",
            es: "43%"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "الجرحى والمصابون",
            en: "Wounded and Injured",
            fr: "Blessés et blessures",
            es: "Heridos y lesionados"
        },
        value: {
            ar: "+173 ألف",
            en: "+173k",
            fr: "+173k",
            es: "+173k"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "شهيد من الطواقم الطبية",
            en: "Medical Personnel Martyred",
            fr: "Membres du personnel médical martyrisés",
            es: "Personal médico martirizado"
        },
        value: {
            ar: "1,700",
            en: "1,700",
            fr: "1 700",
            es: "1.700"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "نازح",
            en: "Displaced Persons",
            fr: "Personnes déplacées",
            es: "Personas déplacées"
        },
        value: {
            ar: "2 مليون",
            en: "2 Million",
            fr: "2 Millions",
            es: "2 Millones"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "جريح بحاجة للتأهيل",
            en: "Wounded in Need of Rehabilitation",
            fr: "Blessés ayant besoin de réadaptation",
            es: "Heridos que necesitan rehabilitación"
        },
        value: {
            ar: "+19,000",
            en: "+19,000",
            fr: "+19 000",
            es: "+19.000"
        },
        border: "border-white/10"
    }
];

const statsUrbanData = [
    {
        label: {
            ar: "الخسائر الأولية المباشرة",
            en: "Direct Preliminary Financial Losses",
            fr: "Pertes financières préliminaires directes",
            es: "Pérdidas financieras preliminares directas"
        },
        value: {
            ar: "80 مليار دولار",
            en: "$80 Billion",
            fr: "80 Milliards $",
            es: "80 Mil Millones $"
        },
        border: "border-red-600/20"
    },
    {
        label: {
            ar: "موقع أثري وتراثي استهدف",
            en: "Archaeological and Heritage Sites Targeted",
            fr: "Sites archéologiques et patrimoniaux ciblés",
            es: "Sitios arqueológicos y patrimoniales atacados"
        },
        value: {
            ar: "208",
            en: "208",
            fr: "208",
            es: "208"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "مقر حكومي دمّر",
            en: "Government Buildings Destroyed",
            fr: "Bâtiments gouvernementaux détruits",
            es: "Edificios gubernamentales destruidos"
        },
        value: {
            ar: "253",
            en: "253",
            fr: "253",
            es: "253"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "مبنى ووحدة سكنية دمَرت جزئياً",
            en: "Housing Units Partially Destroyed",
            fr: "Logements partiellement détruits",
            es: "Viviendas parcialmente destruidas"
        },
        value: {
            ar: "75,000",
            en: "75,000",
            fr: "75 000",
            es: "75.000"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "مركز إيواء ونزوح استهدفوا بالقصف",
            en: "Shelter Centers Bombed",
            fr: "Centres d'hébergement bombardés",
            es: "Centros de refugio bombardeados"
        },
        value: {
            ar: "346",
            en: "346",
            fr: "346",
            es: "346"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "مقبرة دمّرت من مجموع 60",
            en: "Cemeteries Destroyed (out of 60)",
            fr: "Cimetières détruits (sur 60)",
            es: "Cementerios destruidos (de 60)"
        },
        value: {
            ar: "40",
            en: "40",
            fr: "40",
            es: "40"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "من الأراضي الزراعية دمّرت",
            en: "Agricultural Lands Destroyed",
            fr: "Terres agricoles détruites",
            es: "Tierras agrícolas destruidas"
        },
        value: {
            ar: "+87%",
            en: "+87%",
            fr: "+87%",
            es: "+87%"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "من مدارس القطاع لحقت بها أضرار",
            en: "Schools Damaged/Destroyed",
            fr: "Écoles endommagées/détruites",
            es: "Escuelas dañadas/destruidas"
        },
        value: {
            ar: "100%",
            en: "100%",
            fr: "100%",
            es: "100%"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "طالب مدرسي محروم من التعليم",
            en: "School Students Deprived of Education",
            fr: "Élèves privés d'éducation",
            es: "Estudiantes privados de educación"
        },
        value: {
            ar: "+620 ألف",
            en: "+620k",
            fr: "+620k",
            es: "+620k"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "مسجداً دمّر كلياً من إجمالي 1,275",
            en: "Mosques Completely Destroyed (out of 1,275)",
            fr: "Mosquées complètement détruites (sur 1 275)",
            es: "Mezquitas completamente destruidas (de 1.275)"
        },
        value: {
            ar: "1,047",
            en: "1,047",
            fr: "1 047",
            es: "1.047"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "سيارة إسعاف استهدفها الإحتلال",
            en: "Ambulances Targeted and Destroyed",
            fr: "Ambulances ciblées et détruites",
            es: "Ambulancias atacadas y destruidas"
        },
        value: {
            ar: "197",
            en: "197",
            fr: "197",
            es: "197"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "شبكات طرق وشوارع دمرها الاحتلال",
            en: "Road Networks Destroyed",
            fr: "Réseaux routiers détruits",
            es: "Redes de carreteras destruidas"
        },
        value: {
            ar: "+3 مليون متر",
            en: "+3 Million Meters",
            fr: "+3 Millions de Mètres",
            es: "+3 Millones de Metros"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "بئر مياه مركزي دمّر",
            en: "Central Water Wells Destroyed",
            fr: "Puits d'eau centraux détruits",
            es: "Pozos de agua centrales destruidos"
        },
        value: {
            ar: "725",
            en: "725",
            fr: "725",
            es: "725"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "مبنى ووحدة سكنية دمّرت كلياً",
            en: "Housing Units Completely Destroyed",
            fr: "Logements complètement détruits",
            es: "Viviendas completamente destruidas"
        },
        value: {
            ar: "335,000",
            en: "335,000",
            fr: "335 000",
            es: "335.000"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "طالب جامعي محروم من التعليم",
            en: "University Students Deprived of Education",
            fr: "Étudiants universitaires privés d'éducation",
            es: "Estudiantes universitarios privados de educación"
        },
        value: {
            ar: "+90 ألف",
            en: "+90k",
            fr: "+90k",
            es: "+90k"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "مستشفى قصف أو دمّر أو خرج عن الخدمة",
            en: "Hospitals Destroyed or Out of Service",
            fr: "Hôpitaux détruits ou hors service",
            es: "Hospitales destruidos o fuera de servicio"
        },
        value: {
            ar: "38",
            en: "38",
            fr: "38",
            es: "38"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "شبكات صرف صحي دمرها الاحتلال",
            en: "Sewage Networks Destroyed",
            fr: "Réseaux d'assainissement détruits",
            es: "Redes de alcantarillado destruidas"
        },
        value: {
            ar: "+700 ألف متر",
            en: "+700k Meters",
            fr: "+700k Mètres",
            es: "+700k Metros"
        },
        border: "border-white/10"
    },
    {
        label: {
            ar: "شبكات مياه دمرها الاحتلال",
            en: "Water Pipes Destroyed",
            fr: "Canalisations d'eau détruites",
            es: "Tuberías de agua destruidas"
        },
        value: {
            ar: "+700 ألف متر",
            en: "+700k Meters",
            fr: "+700k Mètres",
            es: "+700k Metros"
        },
        border: "border-white/10"
    }
];

function renderStatisticsGrid() {
    const humanGrid = document.getElementById('human-stats-grid');
    const urbanGrid = document.getElementById('urban-stats-grid');
    if (!humanGrid || !urbanGrid) return;

    const t = translations[currentLang];

    // Populate Human stats
    let humanHtml = '';
    statsHumanData.forEach(item => {
        const label = item.label[currentLang] || item.label.ar;
        const val = item.value[currentLang] || item.value.ar;
        humanHtml += `
            <div class="glass-panel p-5 rounded-2xl text-center border ${item.border}">
                <span class="text-xs text-gray-400 block mb-1">${label}</span>
                <p class="text-2xl font-black text-white">${val}</p>
            </div>
        `;
    });
    humanGrid.innerHTML = humanHtml;

    // Populate Urban stats
    let urbanHtml = '';
    statsUrbanData.forEach(item => {
        const label = item.label[currentLang] || item.label.ar;
        const val = item.value[currentLang] || item.value.ar;
        urbanHtml += `
            <div class="glass-panel p-5 rounded-2xl text-center border ${item.border}">
                <span class="text-xs text-gray-400 block mb-1">${label}</span>
                <p class="text-2xl font-black text-white">${val}</p>
            </div>
        `;
    });
    urbanGrid.innerHTML = urbanHtml;

    // Headings
    const chartsMainTitle = document.getElementById('charts-main-title');
    if (chartsMainTitle) chartsMainTitle.innerText = t.chartsMainTitle;
    const chartsMainDesc = document.getElementById('charts-main-desc');
    if (chartsMainDesc) chartsMainDesc.innerText = t.chartsMainDesc;
    const chartAgeTitle = document.getElementById('chart-age-title');
    if (chartAgeTitle) chartAgeTitle.innerText = t.chartAgeTitle;
    const chartRegionalTitle = document.getElementById('chart-regional-title');
    if (chartRegionalTitle) chartRegionalTitle.innerText = t.chartRegionalTitle;
}

let chartAgeInstance = null;
let chartRegionalInstance = null;

function renderStatsPageCharts(lang) {
    const ctxAge = document.getElementById('chart-age-distribution');
    const ctxRegion = document.getElementById('chart-regional-targeting');
    if (!ctxAge || !ctxRegion) return;

    const t = translations[lang] || translations.ar;

    // Destroy previous instances if they exist
    if (chartAgeInstance) chartAgeInstance.destroy();
    if (chartRegionalInstance) chartRegionalInstance.destroy();

    // 1. Age Distribution Chart
    chartAgeInstance = new Chart(ctxAge, {
        type: 'doughnut',
        data: {
            labels: t.chartAgeLabels,
            datasets: [{
                data: [42.5, 30.1, 19.8, 7.6],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.85)',
                    'rgba(248, 113, 113, 0.85)',
                    'rgba(153, 27, 27, 0.85)',
                    'rgba(252, 165, 165, 0.85)'
                ],
                borderColor: 'rgba(10, 10, 10, 0.8)',
                borderWidth: 2,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e5e7eb',
                        font: {
                            family: 'Cairo',
                            size: 11,
                            weight: 'bold'
                        },
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(15, 15, 15, 0.95)',
                    titleColor: '#ef4444',
                    titleFont: { family: 'Cairo', weight: 'bold', size: 12 },
                    bodyColor: '#ffffff',
                    bodyFont: { family: 'Cairo', size: 11 },
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return ` ${t.chartAgeTooltipLabel}${context.raw}%`;
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 1200,
                easing: 'easeOutQuart'
            }
        }
    });

    // 2. Regional Targeting Chart
    chartRegionalInstance = new Chart(ctxRegion, {
        type: 'bar',
        data: {
            labels: t.chartRegionalLabels,
            datasets: [{
                label: t.chartRegionalDatasetLabel,
                data: [34.2, 22.8, 18.5, 13.1, 10.4, 1.0],
                backgroundColor: 'rgba(220, 38, 38, 0.75)',
                hoverBackgroundColor: 'rgba(239, 68, 68, 0.95)',
                borderColor: '#ef4444',
                borderWidth: 1.5,
                borderRadius: 8,
                borderSkipped: false,
                barPercentage: 0.6,
                categoryPercentage: 0.8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(15, 15, 15, 0.95)',
                    titleColor: '#ef4444',
                    titleFont: { family: 'Cairo', weight: 'bold', size: 12 },
                    bodyColor: '#ffffff',
                    bodyFont: { family: 'Cairo', size: 11 },
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            return ` ${t.chartRegionalTooltipLabel}${context.raw}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: { family: 'Cairo', size: 10 },
                        callback: function(value) { return value + '%'; }
                    },
                    max: 40
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#e5e7eb',
                        font: { family: 'Cairo', size: 11, weight: 'bold' }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutElastic'
            }
        }
    });
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
