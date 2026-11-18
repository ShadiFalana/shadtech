export type Copy = { en: string; ar: string };

export type Faq = { q: Copy; a: Copy };

export type ServiceEntry = {
  slug: string;
  icon: string;
  category: Copy;
  name: Copy;
  short: Copy;
  description: Copy;
  problems: Copy[];
  benefits: Copy[];
  process: Copy[];
  faqs: Faq[];
};

const faq = (qEn: string, qAr: string, aEn: string, aAr: string): Faq => ({
  q: { en: qEn, ar: qAr },
  a: { en: aEn, ar: aAr },
});

export const servicesCatalog: ServiceEntry[] = [
  {
    slug: "managed-it",
    icon: "Server",
    category: { en: "Managed Services", ar: "الخدمات المُدارة" },
    name: { en: "Managed IT Services", ar: "إدارة خدمات تقنية المعلومات" },
    short: {
      en: "Ongoing care for your systems, users, and day-to-day technology.",
      ar: "رعاية مستمرة لأنظمتك ومستخدميك وتقنيتك اليومية.",
    },
    description: {
      en: "ShadTech looks after the technology you rely on: monitoring, maintenance, user support, and practical improvements agreed with you.",
      ar: "تتولى شادتك العناية بالتقنية التي تعتمد عليها: المتابعة، والصيانة، ودعم المستخدمين، والتحسينات العملية المتفق عليها.",
    },
    problems: [
      { en: "Recurring outages with no owner", ar: "أعطال متكررة دون مسؤول واضح" },
      { en: "No regular maintenance plan", ar: "غياب خطة صيانة منتظمة" },
    ],
    benefits: [
      { en: "A single point of contact", ar: "جهة تواصل واحدة" },
      { en: "Predictable support routines", ar: "روتين دعم واضح" },
    ],
    process: [
      { en: "Review your current environment", ar: "مراجعة بيئتك الحالية" },
      { en: "Agree the scope of care", ar: "الاتفاق على نطاق الرعاية" },
      { en: "Support, maintain, and report", ar: "الدعم والصيانة والتقارير" },
    ],
    faqs: [
      faq(
        "Is this only for large companies?",
        "هل هذه الخدمة للشركات الكبيرة فقط؟",
        "No. It is designed for individuals, students, and small or mid-sized teams.",
        "لا. الخدمة مناسبة للأفراد والطلاب والفرق الصغيرة والمتوسطة."
      ),
    ],
  },
  {
    slug: "professional-it-support",
    icon: "Headphones",
    category: { en: "Support", ar: "الدعم" },
    name: { en: "Professional IT Support", ar: "الدعم الفني الاحترافي" },
    short: {
      en: "Clear, practical help when something stops working.",
      ar: "مساعدة عملية وواضحة عندما يتوقف شيء عن العمل.",
    },
    description: {
      en: "Submit a request, describe the issue, and work with ShadTech until it is resolved or a next step is agreed.",
      ar: "أرسل طلباً، واشرح المشكلة، وتعاون مع شادتك حتى الحل أو الاتفاق على الخطوة التالية.",
    },
    problems: [
      { en: "Unresolved technical issues", ar: "مشكلات تقنية غير محلولة" },
      { en: "Unclear who to ask", ar: "عدم وضوح جهة الدعم" },
    ],
    benefits: [
      { en: "Tracked requests", ar: "طلبات قابلة للمتابعة" },
      { en: "Written updates", ar: "تحديثات مكتوبة" },
    ],
    process: [
      { en: "Open a support request", ar: "افتح طلب دعم" },
      { en: "We diagnose the issue", ar: "نشخّص المشكلة" },
      { en: "We resolve or recommend next steps", ar: "نحل المشكلة أو نوضح الخطوة التالية" },
    ],
    faqs: [
      faq(
        "Can I track my request?",
        "هل يمكنني متابعة طلبي؟",
        "Yes. Signed-in customers can follow ticket status in the portal.",
        "نعم. يمكن للعملاء المسجّلين متابعة حالة التذكرة من البوابة."
      ),
    ],
  },
  {
    slug: "computer-troubleshooting",
    icon: "Monitor",
    category: { en: "Support", ar: "الدعم" },
    name: { en: "Computer Troubleshooting", ar: "تشخيص وإصلاح مشاكل الحاسوب" },
    short: {
      en: "Diagnosis for slow, unstable, or failing computers.",
      ar: "تشخيص الحواسيب البطيئة أو غير المستقرة أو المتعثرة.",
    },
    description: {
      en: "We help identify whether a problem is software, hardware, configuration, or connectivity, then recommend a practical fix.",
      ar: "نساعد في تحديد ما إذا كانت المشكلة برمجية أو عتادية أو في الإعداد أو الاتصال، ثم نقترح إصلاحاً عملياً.",
    },
    problems: [
      { en: "Computers that crash or run slowly", ar: "حواسيب تتعطل أو تعمل ببطء" },
      { en: "Errors after updates", ar: "أخطاء بعد التحديثات" },
    ],
    benefits: [
      { en: "Clear diagnosis", ar: "تشخيص واضح" },
      { en: "A defined next step", ar: "خطوة تالية محددة" },
    ],
    process: [
      { en: "Describe the symptoms", ar: "صف الأعراض" },
      { en: "We isolate the cause", ar: "نعزل السبب" },
      { en: "We repair or advise", ar: "نصلح أو ننصح" },
    ],
    faqs: [
      faq(
        "Do you access my device automatically?",
        "هل تصلون إلى جهازي تلقائياً؟",
        "No. Remote help happens only with your permission during a support session.",
        "لا. المساعدة عن بُعد تتم فقط بإذنك أثناء جلسة الدعم."
      ),
    ],
  },
  {
    slug: "software-installation",
    icon: "AppWindow",
    category: { en: "Support", ar: "الدعم" },
    name: { en: "Software Installation & Configuration", ar: "تثبيت البرامج وإعدادها" },
    short: {
      en: "Setup of the software you are licensed to use.",
      ar: "إعداد البرامج التي تملك ترخيص استخدامها.",
    },
    description: {
      en: "We install and configure operating systems and applications you already have the right to use, and explain the setup.",
      ar: "نثبّت ونضبط أنظمة التشغيل والتطبيقات التي لديك حق استخدامها، ونوضح لك الإعداد.",
    },
    problems: [
      { en: "Software that will not install", ar: "برامج لا تكتمل عملية تثبيتها" },
      { en: "Incorrect configuration", ar: "إعداد غير صحيح" },
    ],
    benefits: [
      { en: "Working setup", ar: "إعداد يعمل" },
      { en: "Guidance you can reuse", ar: "إرشاد يمكنك إعادة استخدامه" },
    ],
    process: [
      { en: "Confirm the software and license", ar: "تأكيد البرنامج والترخيص" },
      { en: "Install and configure", ar: "التثبيت والإعداد" },
      { en: "Verify it works", ar: "التحقق من العمل" },
    ],
    faqs: [
      faq(
        "Do you provide unlicensed software?",
        "هل توفرون برامج غير مرخصة؟",
        "No. Installation covers software you are entitled to use.",
        "لا. التثبيت يقتصر على البرامج التي يحق لك استخدامها."
      ),
    ],
  },
  {
    slug: "computer-maintenance",
    icon: "Wrench",
    category: { en: "Support", ar: "الدعم" },
    name: { en: "Computer Maintenance", ar: "صيانة أجهزة الحاسوب" },
    short: {
      en: "Routine care that keeps machines usable.",
      ar: "عناية دورية تحافظ على جاهزية الأجهزة.",
    },
    description: {
      en: "Preventive checks, cleanup, updates, and basic hardware care for computers you already own.",
      ar: "فحوصات وقائية وتنظيف وتحديثات وعناية أساسية بالأجهزة التي تملكها.",
    },
    problems: [
      { en: "Dust, heat, and neglected updates", ar: "الغبار والحرارة والتحديثات المؤجلة" },
      { en: "Devices that degrade quietly", ar: "أجهزة يتراجع أداؤها تدريجياً" },
    ],
    benefits: [
      { en: "Fewer surprise failures", ar: "أعطال مفاجئة أقل" },
      { en: "A record of what was done", ar: "سجل بما تم تنفيذه" },
    ],
    process: [
      { en: "Inspect the device", ar: "فحص الجهاز" },
      { en: "Perform agreed maintenance", ar: "تنفيذ الصيانة المتفق عليها" },
      { en: "Share what changed", ar: "مشاركة ما تغيّر" },
    ],
    faqs: [
      faq(
        "Is every repair included?",
        "هل تشمل الخدمة كل إصلاح؟",
        "Scope is agreed before work starts. Parts, when needed, are quoted separately.",
        "يُتفق على النطاق قبل البدء. تُسعَّر القطع عند الحاجة بشكل منفصل."
      ),
    ],
  },
  {
    slug: "network-wifi",
    icon: "Wifi",
    category: { en: "Infrastructure", ar: "البنية التحتية" },
    name: { en: "Network & Wi-Fi Solutions", ar: "حلول الشبكات والواي فاي" },
    short: {
      en: "Home and office networks that stay connected.",
      ar: "شبكات منزلية ومكتبية تبقى متصلة.",
    },
    description: {
      en: "Planning, setup, and troubleshooting for wired networks and Wi-Fi used by homes, students, and small offices.",
      ar: "تخطيط وإعداد وتشخيص للشبكات السلكية والواي فاي للمنازل والطلاب والمكاتب الصغيرة.",
    },
    problems: [
      { en: "Weak or unstable Wi-Fi", ar: "واي فاي ضعيف أو غير مستقر" },
      { en: "Devices that cannot join the network", ar: "أجهزة لا تنضم إلى الشبكة" },
    ],
    benefits: [
      { en: "Clearer coverage", ar: "تغطية أوضح" },
      { en: "A simpler network layout", ar: "تصميم شبكة أبسط" },
    ],
    process: [
      { en: "Understand the space and devices", ar: "فهم المكان والأجهزة" },
      { en: "Configure or repair the network", ar: "إعداد الشبكة أو إصلاحها" },
      { en: "Test the result with you", ar: "اختبار النتيجة معك" },
    ],
    faqs: [
      faq(
        "Do you sell specific brands?",
        "هل تبيعون علامات تجارية محددة؟",
        "Equipment is quoted when needed. We do not claim manufacturer partnerships unless they are configured.",
        "تُقدَّم عروض أسعار للمعدات عند الحاجة. لا ندّعي شراكات مع الشركات المصنّعة ما لم تُضبط رسمياً."
      ),
    ],
  },
  {
    slug: "cybersecurity",
    icon: "Shield",
    category: { en: "Security", ar: "الأمن" },
    name: { en: "Cybersecurity & Data Protection", ar: "الأمن السيبراني وحماية البيانات" },
    short: {
      en: "Practical protection for accounts, devices, and data.",
      ar: "حماية عملية للحسابات والأجهزة والبيانات.",
    },
    description: {
      en: "We help you reduce common risks: weak access, missing backups, unsafe configurations, and unclear recovery steps.",
      ar: "نساعد في تقليل المخاطر الشائعة: صلاحيات ضعيفة، ونسخ احتياطي ناقص، وإعدادات غير آمنة، وخطوات تعافٍ غير واضحة.",
    },
    problems: [
      { en: "Shared or weak passwords", ar: "كلمات مرور ضعيفة أو مشتركة" },
      { en: "No idea what to do after an incident", ar: "عدم وضوح التصرف بعد حادثة" },
    ],
    benefits: [
      { en: "Safer everyday habits", ar: "عادات يومية أكثر أماناً" },
      { en: "A written set of recommendations", ar: "توصيات مكتوبة" },
    ],
    process: [
      { en: "Review how you work today", ar: "مراجعة طريقة عملك الحالية" },
      { en: "Prioritize the risks", ar: "ترتيب المخاطر" },
      { en: "Apply agreed protections", ar: "تطبيق الحماية المتفق عليها" },
    ],
    faqs: [
      faq(
        "Do you guarantee that attacks cannot happen?",
        "هل تضمنون منع الهجمات؟",
        "No. We reduce risk and improve readiness. No service can promise that incidents are impossible.",
        "لا. نقلل المخاطر ونحسّن الجاهزية. لا توجد خدمة تضمن استحالة وقوع الحوادث."
      ),
    ],
  },
  {
    slug: "cloud-services",
    icon: "Cloud",
    category: { en: "Cloud", ar: "السحابة" },
    name: { en: "Cloud Services", ar: "الخدمات السحابية" },
    short: {
      en: "Email, files, and productivity tools set up with care.",
      ar: "بريد وملفات وأدوات إنتاجية بإعداد مدروس.",
    },
    description: {
      en: "Help choosing and configuring cloud tools you subscribe to, including mail, storage, and collaboration for small teams.",
      ar: "مساعدة في اختيار وضبط الأدوات السحابية التي تشترك بها، بما فيها البريد والتخزين والتعاون للفرق الصغيرة.",
    },
    problems: [
      { en: "Files scattered across devices", ar: "ملفات موزعة على أجهزة متعددة" },
      { en: "Unclear cloud accounts", ar: "حسابات سحابية غير واضحة" },
    ],
    benefits: [
      { en: "A simpler working setup", ar: "إعداد عمل أبسط" },
      { en: "Access from more than one device", ar: "وصول من أكثر من جهاز" },
    ],
    process: [
      { en: "List the tools you need", ar: "تحديد الأدوات المطلوبة" },
      { en: "Configure accounts and access", ar: "ضبط الحسابات والصلاحيات" },
      { en: "Show your team how to use them", ar: "شرح الاستخدام للفريق" },
    ],
    faqs: [
      faq(
        "Are cloud subscriptions included?",
        "هل تشمل الخدمة اشتراكات السحابة؟",
        "Subscriptions stay with the provider you choose. ShadTech configures and supports the setup.",
        "تبقى الاشتراكات لدى المزود الذي تختاره. شادتك تضبط الإعداد وتدعمه."
      ),
    ],
  },
  {
    slug: "backup-disaster-recovery",
    icon: "DatabaseBackup",
    category: { en: "Resilience", ar: "الاستمرارية" },
    name: { en: "Backup & Disaster Recovery", ar: "النسخ الاحتياطي والتعافي من الكوارث" },
    short: {
      en: "Copies of important data and a way back if something fails.",
      ar: "نسخ للبيانات المهمة وطريق للعودة إذا تعطل شيء.",
    },
    description: {
      en: "We help you decide what must be copied, how often, and how a restore would work for your devices or small office.",
      ar: "نساعد في تحديد ما يجب نسخه، ووتيرة النسخ، وكيف تتم الاستعادة لأجهزتك أو مكتبك الصغير.",
    },
    problems: [
      { en: "No recent backup", ar: "لا توجد نسخة حديثة" },
      { en: "Backups that were never tested", ar: "نسخ لم تُختبر من قبل" },
    ],
    benefits: [
      { en: "A known restore path", ar: "مسار استعادة معروف" },
      { en: "Less dependence on a single device", ar: "اعتماد أقل على جهاز واحد" },
    ],
    process: [
      { en: "Identify critical data", ar: "تحديد البيانات الحساسة" },
      { en: "Set up the backup method", ar: "إعداد طريقة النسخ" },
      { en: "Test a restore", ar: "اختبار الاستعادة" },
    ],
    faqs: [
      faq(
        "Is backup the same as having one copy on the same computer?",
        "هل يكفي وجود نسخة على نفس الحاسوب؟",
        "No. A useful backup is separate from the device that might fail.",
        "لا. النسخة المفيدة تكون منفصلة عن الجهاز الذي قد يتعطل."
      ),
    ],
  },
  {
    slug: "it-consulting",
    icon: "MessagesSquare",
    category: { en: "Consulting", ar: "الاستشارات" },
    name: { en: "IT Consulting", ar: "الاستشارات التقنية" },
    short: {
      en: "Advice before you buy, change, or expand your technology.",
      ar: "رأي قبل الشراء أو التغيير أو التوسع في التقنية.",
    },
    description: {
      en: "A structured conversation about your goals, constraints, and options, ending with recommendations you can act on.",
      ar: "حوار منظم حول أهدافك وقيودك وخياراتك، وينتهي بتوصيات يمكنك تنفيذها.",
    },
    problems: [
      { en: "Unclear technology choices", ar: "خيارات تقنية غير واضحة" },
      { en: "Projects starting without a plan", ar: "مشاريع تبدأ دون خطة" },
    ],
    benefits: [
      { en: "Options explained in plain language", ar: "خيارات بلغة واضحة" },
      { en: "A recommendation you can keep", ar: "توصية يمكنك الاحتفاظ بها" },
    ],
    process: [
      { en: "Share your goal", ar: "شارك هدفك" },
      { en: "We review the options", ar: "نراجع الخيارات" },
      { en: "You receive a recommendation", ar: "تصلك التوصية" },
    ],
    faqs: [
      faq(
        "Is a consultation a commitment to a large project?",
        "هل الاستشارة التزام بمشروع كبير؟",
        "No. You can request advice without committing to further work.",
        "لا. يمكنك طلب المشورة دون التزام بأعمال لاحقة."
      ),
    ],
  },
  {
    slug: "remote-support",
    icon: "MonitorSmartphone",
    category: { en: "Support", ar: "الدعم" },
    name: { en: "Remote Technical Support", ar: "الدعم الفني عن بُعد" },
    short: {
      en: "Help on a call when a visit is not required.",
      ar: "مساعدة عبر الاتصال عندما لا تكون الزيارة ضرورية.",
    },
    description: {
      en: "Guided remote support for issues that can be solved without opening the device, always with your approval to connect.",
      ar: "دعم موجّه عن بُعد للمشكلات التي لا تحتاج فتح الجهاز، ودائماً بعد موافقتك على الاتصال.",
    },
    problems: [
      { en: "Issues that block work today", ar: "مشكلات تعيق العمل اليوم" },
      { en: "No technician nearby", ar: "لا يوجد فني قريب" },
    ],
    benefits: [
      { en: "Faster first response", ar: "استجابة أولى أسرع" },
      { en: "No unnecessary visit", ar: "دون زيارة غير ضرورية" },
    ],
    process: [
      { en: "Book or open a request", ar: "احجز أو افتح طلباً" },
      { en: "Join an agreed session", ar: "انضم إلى جلسة متفق عليها" },
      { en: "Confirm the outcome", ar: "أكّد النتيجة" },
    ],
    faqs: [
      faq(
        "Can remote support fix hardware failure?",
        "هل يصلح الدعم عن بُعد عطل العتاد؟",
        "It can diagnose many issues. Physical repairs still need a visit or a service center.",
        "يمكنه تشخيص كثير من المشكلات. الإصلاح الفيزيائي يحتاج زيارة أو مركز صيانة."
      ),
    ],
  },
  {
    slug: "hardware-technology",
    icon: "Cpu",
    category: { en: "Hardware", ar: "الأجهزة" },
    name: { en: "Hardware & Technology", ar: "الأجهزة والحلول التقنية" },
    short: {
      en: "Help choosing and setting up equipment you need.",
      ar: "مساعدة في اختيار الأجهزة التي تحتاجها وإعدادها.",
    },
    description: {
      en: "Advice and setup for computers, accessories, and small-office equipment. Availability and pricing are confirmed per quote.",
      ar: "مشورة وإعداد للحواسيب والملحقات ومعدات المكاتب الصغيرة. التوفر والسعر يُؤكدان في كل عرض.",
    },
    problems: [
      { en: "Buying the wrong device", ar: "شراء جهاز غير مناسب" },
      { en: "New hardware that is not set up", ar: "عتاد جديد غير مُعد" },
    ],
    benefits: [
      { en: "A spec that matches the job", ar: "مواصفات تناسب العمل" },
      { en: "Setup after delivery", ar: "إعداد بعد التوريد" },
    ],
    process: [
      { en: "Describe how you will use it", ar: "صف طريقة الاستخدام" },
      { en: "Request a quote", ar: "اطلب عرض سعر" },
      { en: "We set up what you approve", ar: "نعد ما توافق عليه" },
    ],
    faqs: [
      faq(
        "Are prices listed on the website?",
        "هل الأسعار معروضة في الموقع؟",
        "No. Product prices and stock are confirmed when you request a quote.",
        "لا. أسعار المنتجات والتوفر تُؤكد عند طلب عرض السعر."
      ),
    ],
  },
];

export const quickServiceSlugs = [
  "managed-it",
  "cybersecurity",
  "professional-it-support",
  "it-consulting",
  "cloud-services",
  "network-wifi",
];

export const solutionsCatalog: {
  slug: string;
  title: Copy;
  description: Copy;
  content: Copy;
}[] = [
  {
    slug: "home-it",
    title: { en: "Home IT Solutions", ar: "حلول تقنية للمنازل" },
    description: {
      en: "Wi-Fi, computers, backups, and everyday support for households.",
      ar: "واي فاي وحواسيب ونسخ احتياطي ودعم يومي للمنازل.",
    },
    content: {
      en: "A practical setup for home connectivity, device care, and safer everyday use.",
      ar: "إعداد عملي لاتصال المنزل والعناية بالأجهزة والاستخدام اليومي الأكثر أماناً.",
    },
  },
  {
    slug: "student-it",
    title: { en: "Student IT Support", ar: "دعم تقني للطلاب" },
    description: {
      en: "Help with laptops, software, accounts, and study connectivity.",
      ar: "مساعدة في الحواسيب المحمولة والبرامج والحسابات واتصال الدراسة.",
    },
    content: {
      en: "Support aimed at students who need a working device and clear technical guidance.",
      ar: "دعم موجّه للطلاب الذين يحتاجون جهازاً يعمل وإرشاداً تقنياً واضحاً.",
    },
  },
  {
    slug: "small-business-it",
    title: { en: "Small Business IT Solutions", ar: "حلول تقنية للشركات الصغيرة" },
    description: {
      en: "Support, cloud tools, and maintenance sized for small teams.",
      ar: "دعم وأدوات سحابية وصيانة بمقاس الفرق الصغيرة.",
    },
    content: {
      en: "A manageable technology setup for offices that do not have an internal IT department.",
      ar: "إعداد تقني يمكن إدارته للمكاتب التي لا تملك قسماً داخلياً لتقنية المعلومات.",
    },
  },
  {
    slug: "business-network",
    title: { en: "Business Network Solutions", ar: "حلول شبكات الأعمال" },
    description: {
      en: "Office networks, Wi-Fi, and connectivity for daily operations.",
      ar: "شبكات المكاتب والواي فاي والاتصال للعمل اليومي.",
    },
    content: {
      en: "Design and troubleshooting for the network a small office actually uses.",
      ar: "تصميم وتشخيص للشبكة التي يستخدمها المكتب الصغير فعلياً.",
    },
  },
  {
    slug: "cybersecurity-solutions",
    title: { en: "Cybersecurity Solutions", ar: "حلول الأمن السيبراني" },
    description: {
      en: "Access, devices, and data protection without exaggerated claims.",
      ar: "حماية الوصول والأجهزة والبيانات دون ادعاءات مبالغ فيها.",
    },
    content: {
      en: "Recommendations and implementation for the controls a small organization can sustain.",
      ar: "توصيات وتطبيق لضوابط تستطيع المؤسسة الصغيرة الاستمرار عليها.",
    },
  },
  {
    slug: "cloud-productivity",
    title: { en: "Cloud and Productivity Solutions", ar: "حلول السحابة والإنتاجية" },
    description: {
      en: "Mail, files, and collaboration configured for your team.",
      ar: "بريد وملفات وتعاون مضبوط لفريقك.",
    },
    content: {
      en: "We help you use the cloud services you subscribe to with clearer access and less confusion.",
      ar: "نساعد في استخدام الخدمات السحابية التي تشترك بها بصلاحيات أوضح وارتباك أقل.",
    },
  },
  {
    slug: "remote-support-solutions",
    title: { en: "Remote Support Solutions", ar: "حلول الدعم عن بُعد" },
    description: {
      en: "A repeatable way to get help without waiting for a site visit.",
      ar: "طريقة متكررة للحصول على المساعدة دون انتظار زيارة ميدانية.",
    },
    content: {
      en: "Request, session, and follow-up so remote help stays organized.",
      ar: "طلب وجلسة ومتابعة ليبقى الدعم عن بُعد منظماً.",
    },
  },
];

export const industriesCatalog: {
  slug: string;
  name: Copy;
  description: Copy;
  challenges: Copy[];
  solutions: Copy[];
}[] = [
  {
    slug: "education",
    name: { en: "Education", ar: "التعليم" },
    description: {
      en: "Support for students, labs, and small educational offices.",
      ar: "دعم للطلاب والمختبرات والمكاتب التعليمية الصغيرة.",
    },
    challenges: [
      { en: "Shared devices", ar: "أجهزة مشتركة" },
      { en: "Unreliable classroom connectivity", ar: "اتصال غير مستقر في القاعات" },
    ],
    solutions: [
      { en: "Device care and software setup", ar: "العناية بالأجهزة وإعداد البرامج" },
      { en: "Network troubleshooting", ar: "تشخيص الشبكات" },
    ],
  },
  {
    slug: "small-business",
    name: { en: "Small Businesses", ar: "الشركات الصغيرة" },
    description: {
      en: "Day-to-day IT for teams without a dedicated department.",
      ar: "تقنية يومية للفرق التي لا تملك قسماً متخصصاً.",
    },
    challenges: [
      { en: "Limited internal IT time", ar: "وقت داخلي محدود لتقنية المعلومات" },
      { en: "Mixed devices and accounts", ar: "أجهزة وحسابات متنوعة" },
    ],
    solutions: [
      { en: "Managed support", ar: "دعم مُدار" },
      { en: "Cloud and backup setup", ar: "إعداد السحابة والنسخ الاحتياطي" },
    ],
  },
  {
    slug: "professional-offices",
    name: { en: "Professional Offices", ar: "المكاتب المهنية" },
    description: {
      en: "Reliable computers, files, and connectivity for client-facing work.",
      ar: "حواسيب وملفات واتصال يعتمد عليها العمل مع العملاء.",
    },
    challenges: [
      { en: "Downtime during client work", ar: "التوقف أثناء العمل مع العملاء" },
      { en: "Sensitive documents", ar: "مستندات حساسة" },
    ],
    solutions: [
      { en: "Support tickets with follow-up", ar: "تذاكر دعم مع متابعة" },
      { en: "Backup and access hygiene", ar: "النسخ الاحتياطي وانضباط الصلاحيات" },
    ],
  },
  {
    slug: "retail",
    name: { en: "Retail", ar: "التجزئة" },
    description: {
      en: "Connectivity and devices for small shops and counters.",
      ar: "اتصال وأجهزة للمتاجر الصغيرة ونقاط البيع.",
    },
    challenges: [
      { en: "Point-of-sale interruptions", ar: "انقطاع نقاط البيع" },
      { en: "Weak in-store Wi-Fi", ar: "واي فاي ضعيف داخل المتجر" },
    ],
    solutions: [
      { en: "Network support", ar: "دعم الشبكات" },
      { en: "Device troubleshooting", ar: "تشخيص الأجهزة" },
    ],
  },
  {
    slug: "healthcare",
    name: { en: "Healthcare", ar: "الرعاية الصحية" },
    description: {
      en: "Careful IT support for clinics that need reliable systems and privacy awareness.",
      ar: "دعم تقني دقيق للعيادات التي تحتاج أنظمة موثوقة ووعياً بالخصوصية.",
    },
    challenges: [
      { en: "Systems that must stay available", ar: "أنظمة يجب أن تبقى متاحة" },
      { en: "Sensitive patient information", ar: "معلومات مرضى حساسة" },
    ],
    solutions: [
      { en: "Maintenance and backup planning", ar: "تخطيط الصيانة والنسخ الاحتياطي" },
      { en: "Access and device guidance", ar: "إرشاد الصلاحيات والأجهزة" },
    ],
  },
  {
    slug: "nonprofit",
    name: { en: "Nonprofit Organizations", ar: "المنظمات غير الربحية" },
    description: {
      en: "Practical technology help sized to limited budgets.",
      ar: "مساعدة تقنية عملية تناسب الميزانيات المحدودة.",
    },
    challenges: [
      { en: "Small budgets", ar: "ميزانيات صغيرة" },
      { en: "Volunteer-managed devices", ar: "أجهزة يديرها متطوعون" },
    ],
    solutions: [
      { en: "Consulting before purchases", ar: "استشارة قبل الشراء" },
      { en: "Remote support", ar: "دعم عن بُعد" },
    ],
  },
];

export const productCategories: { slug: string; name: Copy; description: Copy }[] = [
  { slug: "laptops-computers", name: { en: "Laptops and Computers", ar: "الحواسيب المحمولة والمكتبية" }, description: { en: "Machines for study and office work.", ar: "أجهزة للدراسة والعمل المكتبي." } },
  { slug: "computer-accessories", name: { en: "Computer Accessories", ar: "ملحقات الحاسوب" }, description: { en: "Peripherals that complete a workstation.", ar: "ملحقات تكمل محطة العمل." } },
  { slug: "networking-equipment", name: { en: "Networking Equipment", ar: "معدات الشبكات" }, description: { en: "Gear for home and office connectivity.", ar: "معدات لاتصال المنزل والمكتب." } },
  { slug: "storage-devices", name: { en: "Storage Devices", ar: "أجهزة التخزين" }, description: { en: "Local storage options. Capacity is confirmed per quote.", ar: "خيارات تخزين محلية. السعة تُؤكد في العرض." } },
  { slug: "printers-peripherals", name: { en: "Printers and Peripherals", ar: "الطابعات والملحقات" }, description: { en: "Printing and related desk equipment.", ar: "الطباعة ومعدات المكتب المرتبطة بها." } },
  { slug: "security-equipment", name: { en: "Security Equipment", ar: "معدات الأمن" }, description: { en: "Devices used to protect a small network.", ar: "أجهزة لحماية شبكة صغيرة." } },
  { slug: "software-licenses", name: { en: "Software and Licenses", ar: "البرمجيات والتراخيص" }, description: { en: "Licensing guidance. We do not invent stock or prices.", ar: "إرشاد للتراخيص. لا نخترع المخزون أو الأسعار." } },
];

export const productCatalog: {
  slug: string;
  categorySlug: string;
  name: Copy;
  description: Copy;
}[] = [
  { slug: "study-laptop", categorySlug: "laptops-computers", name: { en: "Study Laptop", ar: "حاسوب محمول للدراسة" }, description: { en: "A general laptop profile for study and office tasks. Specifications are confirmed in the quote.", ar: "ملف عام لحاسوب محمول للدراسة والمهام المكتبية. المواصفات تُؤكد في عرض السعر." } },
  { slug: "office-desktop", categorySlug: "laptops-computers", name: { en: "Office Desktop", ar: "حاسوب مكتبي" }, description: { en: "A desktop profile for a fixed workstation. Specifications are confirmed in the quote.", ar: "ملف لحاسوب مكتبي ثابت. المواصفات تُؤكد في عرض السعر." } },
  { slug: "keyboard-mouse-set", categorySlug: "computer-accessories", name: { en: "Keyboard and Mouse Set", ar: "طقم لوحة مفاتيح وفأرة" }, description: { en: "Basic input accessories. Brand and model are confirmed when quoted.", ar: "ملحقات إدخال أساسية. العلامة والطراز يُؤكدان عند التسعير." } },
  { slug: "wifi-access-point", categorySlug: "networking-equipment", name: { en: "Wi-Fi Access Point", ar: "نقطة وصول واي فاي" }, description: { en: "Used to extend wireless coverage. Exact model depends on the site.", ar: "تُستخدم لتوسيع التغطية اللاسلكية. الطراز يعتمد على الموقع." } },
  { slug: "external-storage", categorySlug: "storage-devices", name: { en: "External Storage", ar: "وحدة تخزين خارجية" }, description: { en: "Portable storage. Capacity and price are not listed until quoted.", ar: "تخزين محمول. السعة والسعر لا يُعرضان قبل عرض السعر." } },
  { slug: "office-printer", categorySlug: "printers-peripherals", name: { en: "Office Printer", ar: "طابعة مكتبية" }, description: { en: "A printer profile for a small office. Model and supplies are quoted.", ar: "ملف طابعة لمكتب صغير. الطراز والمواد تُسعَّر." } },
  { slug: "network-firewall", categorySlug: "security-equipment", name: { en: "Network Firewall", ar: "جدار حماية شبكي" }, description: { en: "A firewall appliance profile. Sizing is part of the consultation.", ar: "ملف جهاز جدار حماية. تحديد الحجم جزء من الاستشارة." } },
  { slug: "software-license-request", categorySlug: "software-licenses", name: { en: "Software License Request", ar: "طلب ترخيص برمجيات" }, description: { en: "Tell us the product you need. We confirm eligibility and pricing with the vendor path you choose.", ar: "أخبرنا بالمنتج المطلوب. نؤكد الأهلية والسعر عبر مسار المورّد الذي تختاره." } },
];

export function text(copy: Copy, locale: "en" | "ar") {
  return locale === "ar" ? copy.ar : copy.en;
}
