const topicSelect = document.querySelector("#topic");
const difficultySelect = document.querySelector("#difficulty");
const newQuestionButton = document.querySelector("#new-question");
const nextQuestionButton = document.querySelector("#next-question");
const questionText = document.querySelector("#question-text");
const questionTopic = document.querySelector("#question-topic");
const questionDifficulty = document.querySelector("#question-difficulty");
const options = document.querySelector("#options");
const feedback = document.querySelector("#feedback");
const mode = document.querySelector("#mode");
const correctCount = document.querySelector("#correct-count");
const totalCount = document.querySelector("#total-count");
const chatForm = document.querySelector("#chat-form");
const chatMessages = document.querySelector("#chat-messages");
const chatShortcuts = document.querySelector("#chat-shortcuts");

let currentQuestion = null;
let questionAnswered = false;
let lastKnowledgeEntry = null;
const usedQuestionIds = new Map();
let score = 0;
let total = 0;

const questionBank = [
  {
    id: "pituitary-gh",
    topic: "التنسيق الهرموني",
    difficulty: "سهل",
    question: "أي هرمون تفرزه الغدة النخامية الأمامية وينظم نمو العظام والعضلات?",
    options: ["هرمون النمو", "الأدرينالين", "الإينسولين", "هرمون الغدة الدرقية"],
    correctIndex: 0,
    explanation: "هرمون النمو يحفز النمو وبناء الأنسجة، ويُفرز من الفص الأمامي للنخامية.",
  },
  {
    id: "thyroid-thyroxine",
    topic: "التنسيق الهرموني",
    difficulty: "سهل",
    question: "ما الهرمون الذي يزيد معدل الأيض ويحكمه هرمون الغدة الدرقية?",
    options: ["الغلوكاجون", "الثيروكسين", "البروجستيرون", "الأكسيتوسين"],
    correctIndex: 1,
    explanation: "الثيروكسين هرمون يفرز من الغدة الدرقية ويؤثر في معدل الأيض.",
  },
  {
    id: "pancreas-insulin",
    topic: "التنسيق الهرموني",
    difficulty: "متوسط",
    question: "كيف ينظم الإنسولين مستوى الجلوكوز في الدم بعد وجبة غنية بالكربوهيدرات?",
    options: ["يرفع مستوى الجلوكوز", "يمنع دخول الجلوكوز للخلايا", "يخفض مستوى الجلوكوز بنقل الجلوكوز للخلايا", "يحطم الخلايا"],
    correctIndex: 2,
    explanation: "الإنسولين يخفض تركيز الجلوكوز في الدم بتسهيل دخوله إلى الخلايا وتحفيز تخزينه.",
  },
  {
    id: "adrenal-adrenaline",
    topic: "التنسيق الهرموني",
    difficulty: "متوسط",
    question: "أي هرمون يسرع نبضات القلب ويجهز الجسم للاستجابة في حالات الخطر?",
    options: ["الأدرينالين", "الإينسولين", "الميلاتونين", "الإريثروبويتين"],
    correctIndex: 0,
    explanation: "الأدرينالين هرمون قتال أو هروب تفرزه لب الغدة الكظرية.",
  },
  {
    id: "gonads-testosterone",
    topic: "التنسيق الهرموني",
    difficulty: "سهل",
    question: "أي هرمون مسؤول أساسا عن ظهور الصفات الجنسية الذكرية الثانوية?",
    options: ["التستوستيرون", "الأستروجين", "البرولاكتين", "الألدسترون"],
    correctIndex: 0,
    explanation: "تفرز الخصيتان التستوستيرون، الذي ينظم الصفات الجنسية الذكرية.",
  },
  {
    id: "water-adh",
    topic: "التنسيق الهرموني",
    difficulty: "متوسط",
    question: "كيف يؤثر هرمون مضاد الإدرار في الكلى عند نقص الماء في الجسم?",
    options: ["يزيد فقدان الماء في البول", "يقلل إعادة امتصاص الماء", "يزيد إعادة امتصاص الماء", "يمنع تكوين اليوريا"],
    correctIndex: 2,
    explanation: "هرمون مضاد الإدرار يزيد نفاذية أنابيب الكلى للماء فيقل البول ويعاد امتصاص الماء.",
  },
  {
    id: "thyroid-feedback",
    topic: "التنسيق الهرموني",
    difficulty: "متقدم",
    question: "إذا ارتفع تركيز الثيروكسين في الدم، فما التأثير المتوقع على إفراز TSH بالتغذية الراجعة السالبة?",
    options: ["يزداد TSH", "ينخفض TSH", "لا يتغير TSH", "يوقف الكبد افراز TSH"],
    correctIndex: 1,
    explanation: "ارتفاع الثيروكسين يخمد إفراز TSH من النخامية بالتغذية الراجعة السالبة.",
  },
  {
    id: "pancreas-glucagon",
    topic: "التنسيق الهرموني",
    difficulty: "متقدم",
    question: "ما الآلية التي يرفع بها الجلوكاجون مستوى الجلوكوز في الدم?",
    options: ["تحفيز تكوين الجليكوجين في العضلات", "تحفيز تحلل الجليكوجين في الكبد", "منع تحلل الدهون", "زيادة امتصاص الجلوكوز في الأمعاء"],
    correctIndex: 1,
    explanation: "الجلوكاجون يحفز الكبد على تحلل الجليكوجين وإطلاق الجلوكوز في الدم.",
  },
  {
    id: "plant-turgor",
    topic: "الدعامة والحركة",
    difficulty: "سهل",
    question: "ما الذي يساعد النبات العشبي على البقاء منتصبًا عند توفر الماء داخل خلاياه?",
    options: ["ضغط الامتلاء في الخلايا", "انقباض العضلات", "الأربطة", "الغضاريف"],
    correctIndex: 0,
    explanation: "دخول الماء إلى الخلايا يزيد ضغط الامتلاء على جدرانها فيدعم الأجزاء الغضة.",
  },
  {
    id: "muscle-contraction",
    topic: "الدعامة والحركة",
    difficulty: "متوسط",
    question: "ما البروتينان اللذان يتفاعلان مباشرة أثناء انقباض العضلة الهيكلية?",
    options: ["الأكتين والميوسين", "الكيراتين والكولاجين", "الأنسولين والجلوكاجون", "الهيموجلوبين والفبرين"],
    correctIndex: 0,
    explanation: "تتفاعل خيوط الأكتين والميوسين باستخدام الطاقة لتقريب أجزاء اللييفة العضلية وحدوث الانقباض.",
  },
  {
    id: "joint-ligament",
    topic: "الدعامة والحركة",
    difficulty: "متقدم",
    question: "ما وظيفة الأربطة في الجهاز الهيكلي للإنسان?",
    options: ["ربط العظم بالعظم عند المفاصل", "ربط العضلة بالعظم", "إنتاج خلايا الدم", "إفراز السائل الزلالي"],
    correctIndex: 0,
    explanation: "الأربطة نسيج ضام قوي يربط العظام ببعضها ويساعد على تثبيت المفاصل.",
  },
  {
    id: "asexual-reproduction",
    topic: "التكاثر",
    difficulty: "سهل",
    question: "أي طريقة تكاثر لا تتطلب اتحاد أمشاج?",
    options: ["التكاثر اللاجنسي", "الإخصاب الداخلي", "الإخصاب الخارجي", "التلقيح"],
    correctIndex: 0,
    explanation: "ينشأ الفرد في التكاثر اللاجنسي من أب واحد دون اتحاد أمشاج.",
  },
  {
    id: "pollination",
    topic: "التكاثر",
    difficulty: "متوسط",
    question: "ماذا يُقصد بالتلقيح في النباتات الزهرية?",
    options: ["انتقال حبوب اللقاح إلى الميسم", "اتحاد النواة الذكرية بالبويضة", "تحول البويضة إلى بذرة", "إنبات الجنين"],
    correctIndex: 0,
    explanation: "التلقيح هو انتقال حبوب اللقاح من المتك إلى الميسم، ويسبق الإخصاب.",
  },
  {
    id: "double-fertilization",
    topic: "التكاثر",
    difficulty: "متقدم",
    question: "ما الناتجان الرئيسيان للإخصاب المزدوج في النباتات الزهرية?",
    options: ["جنين ونسيج إندوسبيرمي", "جذر وساق", "حبة لقاح وميسم", "ثمرة ومتك"],
    correctIndex: 0,
    explanation: "تتحد نواة ذكرية مع البويضة لتكوين الزيجوت، وتتحد الأخرى مع النواتين القطبيتين لتكوين الإندوسبيرم.",
  },
  {
    id: "innate-immunity",
    topic: "المناعة",
    difficulty: "سهل",
    question: "أي مما يلي يمثل خط دفاع أول غير متخصص في جسم الإنسان?",
    options: ["الجلد والأغشية المخاطية", "الأجسام المضادة النوعية", "خلايا الذاكرة", "الخلايا البائية"],
    correctIndex: 0,
    explanation: "يشكل الجلد والأغشية المخاطية حواجز تمنع دخول كثير من مسببات المرض.",
  },
  {
    id: "antibodies",
    topic: "المناعة",
    difficulty: "متوسط",
    question: "ما وظيفة الأجسام المضادة التي تنتجها الخلايا البلازمية?",
    options: ["التعرف على مستضدات محددة والارتباط بها", "نقل الأكسجين", "هضم الطعام", "تكوين الصفائح الدموية"],
    correctIndex: 0,
    explanation: "ترتبط الأجسام المضادة بمستضدات محددة، فتساعد على تحييدها أو تسهيل التخلص منها.",
  },
  {
    id: "plant-immunity",
    topic: "المناعة",
    difficulty: "متقدم",
    question: "أي وسيلة تسهم في الدفاع الأولي للنبات ضد دخول الممرضات?",
    options: ["الجدار الخلوي والطبقة الشمعية", "الأجسام المضادة", "الخلايا التائية", "العقد الليمفاوية"],
    correctIndex: 0,
    explanation: "الجدار الخلوي والطبقة الشمعية حواجز تركيبية، كما قد ينتج النبات مواد كيميائية دفاعية.",
  },
  {
    id: "dna-nucleotide",
    topic: "DNA والمعلومات الوراثية",
    difficulty: "سهل",
    question: "مم يتكون النيوكليوتيد الواحد في DNA?",
    options: ["سكر خماسي وفوسفات وقاعدة نيتروجينية", "حمض أميني وسكر", "جليسرول وثلاثة أحماض دهنية", "قاعدة نيتروجينية فقط"],
    correctIndex: 0,
    explanation: "يتكون نيوكليوتيد DNA من سكر منقوص الأكسجين ومجموعة فوسفات وقاعدة نيتروجينية.",
  },
  {
    id: "dna-base-pairs",
    topic: "DNA والمعلومات الوراثية",
    difficulty: "متوسط",
    question: "أي قاعدة نيتروجينية ترتبط بالأدينين في جزيء DNA?",
    options: ["الثايمين", "اليوراسيل", "الجوانين", "السيتوسين"],
    correctIndex: 0,
    explanation: "في DNA يرتبط الأدينين بالثايمين، بينما يرتبط الجوانين بالسيتوسين.",
  },
  {
    id: "dna-replication",
    topic: "DNA والمعلومات الوراثية",
    difficulty: "متقدم",
    question: "لماذا توصف عملية تضاعف DNA بأنها شبه محافظة?",
    options: ["لأن كل جزيء جديد يحتوي شريطًا قديمًا وآخر جديدًا", "لأن الجزيء الجديد يتكون من RNA فقط", "لأن نصف الجينات لا يتضاعف", "لأن القواعد تتغير عشوائيًا"],
    correctIndex: 0,
    explanation: "يعمل كل شريط أصلي قالبًا لبناء شريط مكمل جديد، فيحتوي كل جزيء ناتج على شريط قديم وآخر حديث.",
  },
  {
    id: "transcription",
    topic: "RNA وتخليق البروتين",
    difficulty: "سهل",
    question: "ما اسم تكوين جزيء RNA اعتمادًا على قالب من DNA?",
    options: ["النسخ", "الترجمة", "التضاعف", "الطفرة"],
    correctIndex: 0,
    explanation: "النسخ هو استخدام أحد شريطي DNA قالبًا لتكوين RNA مكمل.",
  },
  {
    id: "translation",
    topic: "RNA وتخليق البروتين",
    difficulty: "متوسط",
    question: "أين تحدث ترجمة الشفرة الوراثية إلى سلسلة من الأحماض الأمينية?",
    options: ["على الريبوسومات", "داخل جهاز جولجي", "في الغشاء النووي", "داخل الجدار الخلوي"],
    correctIndex: 0,
    explanation: "تقرأ الريبوسومات كودونات mRNA، وتساعد جزيئات tRNA على إحضار الأحماض الأمينية.",
  },
  {
    id: "pcr",
    topic: "RNA وتخليق البروتين",
    difficulty: "متقدم",
    question: "ما الهدف الأساسي من تقنية تفاعل البوليميراز المتسلسل PCR?",
    options: ["إكثار مقطع محدد من DNA", "ترجمة البروتين مباشرة", "تكوين غشاء خلوي", "تكسير جميع الكروموسومات"],
    correctIndex: 0,
    explanation: "تُستخدم PCR لإنتاج عدد كبير من النسخ من مقطع DNA محدد عبر دورات متكررة.",
  },
  {
    id: "igneous-rocks",
    topic: "الأحياء وعلوم الأرض",
    difficulty: "سهل",
    question: "كيف تتكون الصخور النارية?",
    options: ["من تبرد وتصلب الصهارة أو اللابة", "من تراكم بقايا الكائنات فقط", "من تحول الصخور بالضغط دون حرارة", "من تبخر مياه البحار"],
    correctIndex: 0,
    explanation: "تتكون الصخور النارية عندما تبرد الصهارة داخل الأرض أو اللابة على سطحها وتتبلور.",
  },
  {
    id: "sedimentary-rocks",
    topic: "الأحياء وعلوم الأرض",
    difficulty: "متوسط",
    question: "أي عملية تسهم في تكوين الصخور الرسوبية الفتاتية?",
    options: ["تراكم الرواسب ثم تماسكها وتلاحمها", "تبريد اللابة", "انصهار الصخور كليًا", "تجمد الماء داخل الخلايا"],
    correctIndex: 0,
    explanation: "تترسب الفتاتيات ثم تتعرض للضغط والتلاحم فتتحول إلى صخر رسوبي.",
  },
  {
    id: "metamorphic-rocks",
    topic: "الأحياء وعلوم الأرض",
    difficulty: "متقدم",
    question: "ما العاملان الرئيسيان اللذان يغيران الصخور إلى صخور متحولة?",
    options: ["الحرارة والضغط", "التبخر والرياح", "الضوء والأكسجين", "التجمد والذوبان فقط"],
    correctIndex: 0,
    explanation: "تتحول الصخور بفعل الحرارة والضغط والسوائل النشطة دون انصهارها الكامل.",
  },
];

const knowledgeBase = [
  {
    keywords: ["هرمون", "رسول كيميائي", "الغدد الصماء"],
    answer: "الهرمون رسول كيميائي تفرزه غدة صماء إلى الدم، ثم يؤثر في خلايا هدف تحمل مستقبلات مناسبة له. يساعد ذلك على تنظيم النمو والأيض والتكاثر والاتزان الداخلي.",
  },
  {
    keywords: ["غده صماء", "غده قنويه", "الفرق بين الصماء والقنويه"],
    answer: "الغدة الصماء تفرز هرموناتها مباشرة إلى الدم دون قنوات، مثل الدرقية. أما الغدة القنوية فتنقل إفرازها عبر قناة إلى سطح الجسم أو تجويف، مثل الغدد العرقية. والبنكرياس يجمع الوظيفتين.",
  },
  {
    keywords: ["الغده النخاميه", "سيده الغدد", "هرمونات النخاميه"],
    answer: "الغدة النخامية تقع أسفل الدماغ وتتصل بتحت المهاد، وتفرز هرمونات تنظّم غددًا أخرى. يفرز فصها الأمامي هرمون النمو وTSH وACTH وFSH وLH والبرولاكتين. أما الفص الخلفي فيخزن ويطلق ADH والأوكسيتوسين اللذين يُصنعان في تحت المهاد.",
  },
  {
    keywords: ["هرمون النمو", "النمو", "gigantism", "القزامة"],
    answer: "هرمون النمو يُفرز من الفص الأمامي للغدة النخامية، ويساعد على نمو العظام والأنسجة. نقصه في الطفولة قد يسبب قصر القامة، وزيادته قبل اكتمال نمو العظام قد تسبب العملقة.",
  },
  {
    keywords: ["الغده الدرقيه", "الثيروكسين", "thyroxine", "معدل الايض"],
    answer: "تفرز الغدة الدرقية هرموني T3 وT4، وأشهرهما الثيروكسين، ويسهمان في تنظيم معدل الأيض والنمو. يحتاج تصنيع الثيروكسين إلى اليود، وينظم TSH إفرازه.",
  },
  {
    keywords: ["الكالسيتونين", "الكالسيوم", "الغده جار الدرقيه", "الباراثورمون"],
    answer: "الكالسيتونين الذي تفرزه الدرقية يساعد على خفض تركيز الكالسيوم في الدم. أما هرمون جار الدرقية (PTH) فيرفع تركيزه؛ ويعمل الهرمونان باتجاهين متعاكسين للمحافظة على الاتزان.",
  },
  {
    keywords: ["البنكرياس", "سكر الدم", "الجلوكوز"],
    answer: "للبنكرياس وظيفة هرمونية وأخرى هضمية. تفرز خلايا بيتا الإنسولين فيخفض سكر الدم بمساعدة الخلايا على أخذ الجلوكوز وتحفيز تخزينه كجليكوجين، بينما تفرز خلايا ألفا الجلوكاجون لرفع سكر الدم.",
  },
  {
    keywords: ["الانسولين", "خلايا بيتا", "انخفاض سكر الدم"],
    answer: "الإنسولين تفرزه خلايا بيتا في جزر البنكرياس عندما يرتفع الجلوكوز بعد الطعام. يزيد دخوله إلى خلايا عديدة ويحفز تخزينه، فينخفض تركيزه في الدم.",
  },
  {
    keywords: ["الجلوكاجون", "الغلوكاجون", "خلايا الفا", "ارتفاع سكر الدم"],
    answer: "الجلوكاجون تفرزه خلايا ألفا في البنكرياس عند انخفاض سكر الدم. يحفز الكبد على تكسير الجليكوجين وإطلاق الجلوكوز إلى الدم، فيرتفع تركيزه.",
  },
  {
    keywords: ["الغده الكظريه", "الادرينالين", "الخوف", "الطوارئ"],
    answer: "تقع الغدتان الكظريتان فوق الكليتين. يفرز لب الكظر الأدرينالين، الذي يهيئ الجسم للاستجابة السريعة بزيادة نبض القلب وتوفير الطاقة. وتفرز قشرة الكظر هرمونات منها الكورتيزول والألدوستيرون.",
  },
  {
    keywords: ["الكورتيزول", "قشره الكظر", "الاجهاد"],
    answer: "الكورتيزول هرمون من قشرة الغدة الكظرية، ويساعد الجسم على التعامل مع الإجهاد وينظم عمليات الأيض. لا ينبغي الخلط بينه وبين الأدرينالين الذي يفرز من لب الكظر للاستجابة السريعة.",
  },
  {
    keywords: ["الالدستيرون", "الملح", "الصوديوم", "قشره الكظر"],
    answer: "الألدوستيرون هرمون تفرزه قشرة الكظر، ويساعد الكليتين على تنظيم إعادة امتصاص الصوديوم والماء والتخلص من البوتاسيوم، وبذلك يساهم في تنظيم حجم الدم وضغطه.",
  },
  {
    keywords: ["المناسل", "الخصيه", "التستوستيرون", "صفات ذكريه"],
    answer: "الخصيتان من المناسل وتنتجان الحيوانات المنوية، كما تفرزان التستوستيرون الذي يساهم في ظهور الصفات الجنسية الذكرية وتنظيم الوظيفة التناسلية.",
  },
  {
    keywords: ["المبيض", "الاستروجين", "البروجستيرون", "الدوره الشهريه"],
    answer: "يفرز المبيضان الإستروجين والبروجستيرون. يساهم الإستروجين في نمو الصفات الجنسية الأنثوية وتنظيم الدورة، ويساعد البروجستيرون على تهيئة بطانة الرحم والمحافظة عليها.",
  },
  {
    keywords: ["هرمون مضاد الادرار", "adh", "اتزان الماء", "الكلى", "البول"],
    answer: "هرمون ADH (مضاد الإدرار) يُصنع في تحت المهاد ويُخزن ويُطلق من الفص الخلفي للنخامية. عند نقص الماء يزيد إعادة امتصاصه في الكليتين، فيقل حجم البول ويصبح أكثر تركيزًا.",
  },
  {
    keywords: ["الاوكسي توسين", "الاوكسيتوسين", "الرضاعه", "الولاده"],
    answer: "الأوكسيتوسين يُصنع في تحت المهاد ويُطلق من الفص الخلفي للنخامية. يحفز انقباضات الرحم أثناء الولادة ويساعد على قذف الحليب خلال الرضاعة.",
  },
  {
    keywords: ["تغذيه راجعه سالبه", "التغذيه الراجعه", "tsh", "الاتزان الداخلي"],
    answer: "في التغذية الراجعة السالبة تؤدي زيادة ناتج أو هرمون إلى تثبيط الإشارات التي تزيده، فتساعد على ثبات المستوى. مثال: ارتفاع الثيروكسين يقلل إفراز TSH من النخامية، فيقل تحفيز الدرقية.",
  },
  {
    keywords: ["البرولاكتين", "الحليب", "الغده النخاميه"],
    answer: "البرولاكتين يفرز من الفص الأمامي للغدة النخامية، ووظيفته الأساسية تحفيز إنتاج الحليب بعد الولادة. أما الأوكسيتوسين فيساعد على قذف الحليب.",
  },
  {
    unit: "الدعامة والحركة",
    keywords: ["الدعامه", "دعامة النبات", "ضغط الامتلاء", "الدعامه في النبات"],
    answer: "تساعد الدعامة الكائن الحي على حفظ شكله ومقاومة الجاذبية. في النبات تسهم جدر الخلايا والأنسجة الدعامية وضغط الامتلاء الناتج عن الماء في دعم الأجزاء، بينما يعتمد دعم الحيوان على الهياكل الداخلية أو الخارجية والأنسجة الضامة.",
  },
  {
    unit: "الدعامة والحركة",
    keywords: ["الهيكل العظمي", "العظام", "المفاصل", "الاربطة", "الاوتار"],
    answer: "يوفر الهيكل العظمي الدعامة ويحمي أعضاء الجسم ويساعد الحركة. الأربطة تصل العظام بالعظام عند المفاصل، أما الأوتار فتصل العضلات بالعظام. وتقلل الغضاريف والسائل الزلالي الاحتكاك في بعض المفاصل.",
  },
  {
    unit: "الدعامة والحركة",
    keywords: ["انقباض العضله", "الاكتين", "الميوسين", "الحركه في الانسان"],
    answer: "يعتمد انقباض العضلة الهيكلية على تفاعل خيوط الأكتين والميوسين. يؤدي وصول الإشارة العصبية إلى تغيرات تسمح بتكوين الجسور العرضية، ويحتاج الانقباض إلى أيونات الكالسيوم وطاقة ATP. تعمل العضلات غالبًا في أزواج متضادة لتحريك العظام حول المفاصل.",
  },
  {
    unit: "التكاثر",
    keywords: ["التكاثر اللاجنسي", "التكاثر الجنسي", "التبرعم", "الانشطار", "التكاثر في الكائنات"],
    answer: "التكاثر اللاجنسي يتم من فرد واحد دون اتحاد أمشاج، ومن أمثلته الانشطار والتبرعم والتكاثر الخضري، وينتج غالبًا أفرادًا متشابهة وراثيًا. أما التكاثر الجنسي فيتضمن اتحاد أمشاج ويزيد التنوع الوراثي.",
  },
  {
    unit: "التكاثر",
    keywords: ["التكاثر في النباتات الزهريه", "التلقيح", "الاخصاب المزدوج", "الميسم", "حبوب اللقاح"],
    answer: "تنتج الأسدية حبوب اللقاح، ويحوي المتاع الميسم والقلم والمبيض. ينتقل لقاح ناضج إلى الميسم في عملية التلقيح، ثم تنمو أنبوبة اللقاح. في الإخصاب المزدوج تتحد نواة ذكرية بالبويضة لتكوين الزيجوت، وتتحد الأخرى بالنواتين القطبيتين لتكوين نسيج الإندوسبيرم؛ وتتطور البويضة إلى بذرة والمبيض غالبًا إلى ثمرة.",
  },
  {
    unit: "التكاثر",
    keywords: ["التكاثر في الانسان", "الجهاز التناسلي", "الحيوان المنوي", "البويضه", "الدوره الشهريه"],
    answer: "ينتج الجهاز التناسلي الذكري الحيوانات المنوية، وينتج المبيض البويضات. يحدث الإخصاب عادة في قناة البيض، وينشأ الزيجوت ثم ينقسم أثناء انتقاله إلى الرحم. تتغير بطانة الرحم خلال الدورة الشهرية تحت تأثير هرمونات المبيض والنخامية.",
  },
  {
    unit: "المناعة",
    keywords: ["مناعه النبات", "دفاع النبات", "الجدار الخلوي", "الممرضات النباتيه"],
    answer: "يدافع النبات عن نفسه بحواجز تركيبية مثل الجدار الخلوي والطبقة الشمعية، وباستجابات كيميائية مثل إنتاج مواد مضادة لبعض الممرضات. كما قد يعزل موضع الإصابة أو يفعّل استجابات دفاعية موضعية.",
  },
  {
    unit: "المناعة",
    keywords: ["المناعه الفطريه", "المناعه المكتسبه", "خطوط الدفاع", "مناعه الانسان"],
    answer: "المناعة الفطرية سريعة وغير متخصصة، وتشمل الجلد والأغشية المخاطية وبعض الخلايا والالتهاب. المناعة المكتسبة أكثر تخصصًا؛ تتعرف الخلايا الليمفاوية على مستضدات محددة، وتكوّن خلايا ذاكرة تساعد على استجابة أسرع عند التعرض اللاحق.",
  },
  {
    unit: "المناعة",
    keywords: ["اليه عمل الجهاز المناعي", "الخلايا البائيه", "الخلايا التائيه", "الاجسام المضاده", "المستضد"],
    answer: "يبدأ الاستجابة المناعية بالتعرف على المستضد. تساعد الخلايا التائية المساعدة على تنشيط خلايا مناعية أخرى؛ وتتحول بعض الخلايا البائية إلى خلايا بلازمية تفرز أجسامًا مضادة، بينما تتكون خلايا ذاكرة. وتهاجم بعض الخلايا التائية خلايا مصابة مباشرة.",
  },
  {
    unit: "DNA والمعلومات الوراثية",
    keywords: ["اكتشاف الماده الوراثيه", "جريفيث", "افري", "هيرشي وتشيس", "فرانكلين", "واتسون وكريك"],
    answer: "أسهمت تجارب علمية متتابعة في تحديد DNA مادةً وراثية. أظهرت تجارب جريفيث التحول البكتيري، ودعمت تجارب أفري وزملائه دور DNA، وقدمت تجربة هيرشي وتشيس دليلًا إضافيًا. ساعدت بيانات حيود الأشعة السينية التي جمعتها روزاليند فرانكلين في بناء نموذج اللولب المزدوج.",
  },
  {
    unit: "DNA والمعلومات الوراثية",
    keywords: ["تركيب dna", "الحمض النووي", "اللولب المزدوج", "القواعد النيتروجينيه", "النيوكليوتيد"],
    answer: "يتكون DNA من سلسلتين من نيوكليوتيدات ملتفتين في صورة لولب مزدوج. يضم كل نيوكليوتيد سكر منقوص الأكسجين وفوسفات وقاعدة نيتروجينية. تتزاوج القواعد تكامليًا: الأدينين مع الثايمين، والجوانين مع السيتوسين.",
  },
  {
    unit: "DNA والمعلومات الوراثية",
    keywords: ["dna في بدائيات النواه", "dna في حقيقيات النواه", "الكروموسوم", "الكروماتين"],
    answer: "يوجد DNA بدائيات النواة غالبًا في منطقة نووية على هيئة كروموسوم دائري، وقد توجد بلازميدات. في حقيقيات النواة يوجد معظم DNA داخل النواة في كروموسومات خطية ملتفة حول بروتينات، كما يوجد DNA في الميتوكوندريا، وفي البلاستيدات لدى النبات.",
  },
  {
    unit: "DNA والمعلومات الوراثية",
    keywords: ["المحتوى الجيني", "الجينوم", "الجينات", "الانترونات", "الاكسونات"],
    answer: "الجينوم هو مجموع المادة الوراثية في الكائن. الجين مقطع من DNA يحمل معلومات لإنتاج RNA أو بروتين. لا يشفر كل DNA مباشرةً بروتينًا؛ ففي جينات حقيقيات النواة قد توجد إكسونات تُحتفظ بها في RNA الناضج وإنترونات تُزال، إلى جانب مناطق تنظيمية ومناطق أخرى.",
  },
  {
    unit: "DNA والمعلومات الوراثية",
    keywords: ["الطفرات", "طفرة جينيه", "تغير dna", "الطفره"],
    answer: "الطفرة تغير دائم في تسلسل المادة الوراثية. قد تنتج عن خطأ في تضاعف DNA أو عن عوامل مطفّرة، وقد يكون أثرها ضارًا أو محايدًا أو نافعًا بحسب موقعها وتأثيرها. بعض الطفرات تغير قاعدة واحدة، وأخرى تشمل إدخال أو حذف مقاطع.",
  },
  {
    unit: "RNA وتخليق البروتين",
    keywords: ["انواع rna", "الحمض النووي rna", "الرنا الرسول", "الرنا الناقل", "الرنا الريبوسومي"],
    answer: "RNA غالبًا أحادي السلسلة ويحتوي سكر الريبوز وقاعدة اليوراسيل بدل الثايمين. ينقل mRNA الشفرة من DNA، ويحمل tRNA الأحماض الأمينية إلى الريبوسوم، ويسهم rRNA في بناء الريبوسوم ووظيفته.",
  },
  {
    unit: "RNA وتخليق البروتين",
    keywords: ["تخليق البروتين", "النسخ", "الترجمه", "الكودون", "الشفرة الوراثيه"],
    answer: "يمر تخليق البروتين بمرحلتين أساسيتين: النسخ، حيث يُصنع RNA اعتمادًا على قالب DNA؛ والترجمة على الريبوسوم، حيث تُقرأ كودونات mRNA وتُرتب الأحماض الأمينية بمساعدة tRNA لتكوين سلسلة بروتينية.",
  },
  {
    unit: "RNA وتخليق البروتين",
    keywords: ["التكنولوجيا الجزيئيه", "pcr", "تفاعل البوليميراز", "انزيمات القطع", "الترحيل الكهربائي"],
    answer: "تتيح تقنيات الأحياء الجزيئية التعامل مع DNA وتحليله. يضاعف PCR مقطعًا محددًا، وتقص إنزيمات التقييد تسلسلات معينة، ويفصل الترحيل الكهربائي قطع DNA بحسب حركتها في الهلام. تستخدم هذه الأدوات في البحث والتشخيص والتطبيقات الحيوية.",
  },
  {
    unit: "RNA وتخليق البروتين",
    keywords: ["الهندسه الوراثيه", "dna معاد الاتحاد", "البلازميد", "كائن معدل وراثيا"],
    answer: "تتضمن الهندسة الوراثية تعديل المادة الوراثية أو نقل مقطع جيني. يمكن قص جين وناقل مثل البلازميد بإنزيمات مناسبة ثم ربطهما لتكوين DNA معاد الاتحاد، وإدخاله إلى خلية مضيفة للتعبير عنه أو دراسته. يلزم تقييم السلامة والأثر البيئي.",
  },
  {
    unit: "الأحياء وعلوم الأرض",
    keywords: ["الجيولوجيا", "ماده الارض", "علم الارض"],
    answer: "الجيولوجيا علم يدرس الأرض وموادها وبنيتها وتاريخها والعمليات التي تغيرها. تشمل مادة الأرض معادن وصخورًا ومواد منصهرة وغازات، وتساعد دراسة الصخور والطبقات على فهم تاريخ الكوكب.",
  },
  {
    unit: "الأحياء وعلوم الأرض",
    keywords: ["مكونات كوكب الارض", "القشره", "الوشاح", "اللب"],
    answer: "يتكون باطن الأرض بصورة رئيسية من القشرة والوشاح واللب. القشرة طبقة خارجية صلبة، والوشاح يقع أسفلها وتتباين خواصه مع العمق، وينقسم اللب إلى خارجي سائل وداخلي صلب أساسًا. وتتحرك الصفائح الصخرية ضمن الغلاف الصخري.",
  },
  {
    unit: "الأحياء وعلوم الأرض",
    keywords: ["البراكين", "اللابة", "الصهاره", "العمليات الجيولوجيه"],
    answer: "البركان موضع تصعد منه الصهارة والغازات والمواد الصلبة إلى السطح؛ وتسمى الصهارة بعد خروجها لابة. تسهم البراكين في تكوين صخور وأشكال سطحية جديدة، وترتبط كثير من البراكين بحدود الصفائح، لكنها قد تسبب أخطارًا كالتدفقات والرماد والغازات.",
  },
  {
    unit: "الأحياء وعلوم الأرض",
    keywords: ["الزمن الجيولوجي", "السجل الاحفوري", "الاحافير", "العصور الجيولوجيه"],
    answer: "يقسم الزمن الجيولوجي تاريخ الأرض إلى وحدات مرتبة من الأكبر إلى الأصغر، اعتمادًا على أحداث جيولوجية وتغيرات في الحياة وسجل الصخور والأحافير. تساعد الطبقات والأحافير على تحديد التتابع النسبي للأحداث، وتُستخدم النظائر المشعة في تقدير أعمار مطلقة لبعض الصخور.",
  },
  {
    unit: "الأحياء وعلوم الأرض",
    keywords: ["الصخور الناريه", "الصهاره", "الصخور الجوفيه", "الصخور السطحيه"],
    answer: "تتكون الصخور النارية من تبرد الصهارة أو اللابة. التبريد البطيء في الأعماق يسمح عادة بنمو بلورات أكبر، أما التبريد السريع على السطح فينتج بلورات أصغر أو نسيجًا زجاجيًا. يختلف تركيبها بحسب مكونات الصهارة وظروف التبريد.",
  },
  {
    unit: "الأحياء وعلوم الأرض",
    keywords: ["الصخور الرسوبيه", "الصخور المتحوله", "التجويه", "التلاحم"],
    answer: "تتكون الصخور الرسوبية من ترسيب مواد فتاتية أو كيميائية أو عضوية ثم تراصها وتلاحمها، وقد تحفظ أحافير. أما الصخور المتحولة فتنتج من تغير صخور سابقة بفعل الحرارة والضغط والسوائل النشطة دون انصهار كامل.",
  },
  {
    unit: "الأحياء وعلوم الأرض",
    keywords: ["دوره الصخور", "دورة الصخور", "تحول الصخور"],
    answer: "دورة الصخور تصف التحولات المستمرة بين الصخور النارية والرسوبية والمتحولة. فالتجوية والتعرية تنتجان رواسب، والدفن والحرارة والضغط قد يغيران الصخور، والانصهار ثم التبريد ينتج صخورًا نارية. لا تسير الدورة في مسار واحد ثابت.",
  },
];

knowledgeBase.forEach((entry) => {
  if (!entry.unit) entry.unit = "التنسيق الهرموني";
});

function setLoading(isLoading) {
  newQuestionButton.disabled = isLoading;
  newQuestionButton.textContent = isLoading ? "جار اختيار السؤال..." : "أنشئ سؤالا";
}

function updateScore() {
  correctCount.textContent = String(score);
  totalCount.textContent = String(total);
}

function showQuestion(question) {
  currentQuestion = question;
  questionAnswered = false;
  questionTopic.textContent = question.topic;
  questionDifficulty.textContent = question.difficulty;
  questionText.textContent = question.question;
  options.replaceChildren();
  feedback.hidden = true;
  feedback.className = "feedback";
  nextQuestionButton.hidden = true;

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "option";
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", () => answerQuestion(index));
    options.append(button);
  });
}

function answerQuestion(selectedIndex) {
  if (!currentQuestion || questionAnswered) return false;
  questionAnswered = true;
  const buttons = [...options.querySelectorAll("button")];
  const isCorrect = selectedIndex === currentQuestion.correctIndex;
  total += 1;
  if (isCorrect) score += 1;
  updateScore();

  buttons.forEach((button, index) => {
    button.disabled = true;
    if (index === currentQuestion.correctIndex) button.classList.add("is-correct");
    if (index === selectedIndex && !isCorrect) button.classList.add("is-wrong");
  });

  feedback.hidden = false;
  feedback.classList.add(isCorrect ? "correct" : "wrong");
  feedback.textContent = `${isCorrect ? "إجابة صحيحة." : "ليست الإجابة الصحيحة."} ${currentQuestion.explanation}`;
  nextQuestionButton.hidden = false;
  return isCorrect;
}

function requestQuestion() {
  setLoading(true);
  const selectedTopic = topicSelect.value;
  const selectedDifficulty = difficultySelect.value;
  const filterKey = `${selectedTopic}|${selectedDifficulty}`;
  let candidates = questionBank.filter(
    (question) =>
      (selectedTopic === "كل المنهج" || question.topic === selectedTopic) &&
      question.difficulty === selectedDifficulty,
  );

  if (candidates.length === 0) {
    currentQuestion = null;
    questionAnswered = false;
    questionText.textContent = "لا يتوفر سؤال لهذا الاختيار.";
    questionTopic.textContent = selectedTopic;
    questionDifficulty.textContent = selectedDifficulty;
    options.replaceChildren();
    feedback.hidden = true;
    nextQuestionButton.hidden = true;
    mode.textContent = "لا توجد أسئلة مطابقة للموضوع والصعوبة المختارين.";
  } else {
    let usedIds = usedQuestionIds.get(filterKey) || new Set();
    let available = candidates.filter((question) => !usedIds.has(question.id));
    const restartedCycle = available.length === 0;
    if (restartedCycle) {
      usedIds = new Set();
      available = candidates;
    }

    const question = available[Math.floor(Math.random() * available.length)];
    usedIds.add(question.id);
    usedQuestionIds.set(filterKey, usedIds);
    showQuestion(question);
    mode.textContent = restartedCycle
      ? "اكتملت أسئلة هذا الاختيار؛ بدأت دورة جديدة."
      : "سؤال مطابق من بنك الأحياء المحلي.";
  }
  setLoading(false);
  return currentQuestion;
}

function appendChatMessage(text, role, options = {}) {
  const message = document.createElement("div");
  message.className = `chat-message ${role}`;
  message.textContent = text;
  if (options.loading) message.classList.add("loading");
  if (options.source === "local") {
    const source = document.createElement("small");
    source.className = "message-source";
    source.textContent = "رد محلي من قاعدة المعرفة، وليس من Gemini";
    message.append(source);
  }
  if (role === "assistant" && text) {
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "copy-answer";
    copyButton.textContent = "نسخ الإجابة";
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(text);
        copyButton.textContent = "تم النسخ";
      } catch {
        copyButton.textContent = "تعذر النسخ";
      }
    });
    message.append(copyButton);
  }
  chatMessages.append(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return message;
}

const stopWords = new Set([
  "ما", "ماذا", "من", "هو", "هي", "هل", "كيف", "لماذا", "متى", "اين", "اي",
  "في", "على", "عن", "الى", "منه", "هذا", "هذه", "ذلك", "تلك", "مع", "او",
  "و", "ثم", "لي", "لل", "الذي", "التي", "وظيفه", "وظيفته", "يعمل", "يحدث",
]);

function normalizeArabic(text) {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\u0621-\u064A0-9\u0660-\u0669a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function rankKnowledge(entries, normalizedQuery, queryTerms) {
  return entries
    .map((entry) => {
      const keywords = entry.keywords.map(normalizeArabic);
      let score = 0;
      for (const keyword of keywords) {
        if (normalizedQuery.includes(keyword)) score += 4 + keyword.split(" ").length;
      }

      const searchableTerms = new Set(
        normalizeArabic(`${entry.keywords.join(" ")} ${entry.answer}`)
          .split(" ")
          .filter((term) => term.length > 1 && !stopWords.has(term)),
      );
      for (const term of queryTerms) {
        if (searchableTerms.has(term)) score += 1;
      }
      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((first, second) => second.score - first.score);
}

function findKnowledge(query, limit) {
  const normalizedQuery = normalizeArabic(query);
  const queryTerms = normalizedQuery
    .split(" ")
    .filter((term) => term.length > 1 && !stopWords.has(term));

  const entries =
    topicSelect.value === "كل المنهج"
      ? knowledgeBase
      : knowledgeBase.filter((entry) => entry.unit === topicSelect.value);
  let ranked = rankKnowledge(entries, normalizedQuery, queryTerms);
  if (ranked.length === 0 && entries.length !== knowledgeBase.length) {
    ranked = rankKnowledge(knowledgeBase, normalizedQuery, queryTerms);
  }

  return ranked.slice(0, limit || 1).map((item) => item.entry);
}

function parseChatAnswer(query, question) {
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const normalized = normalizeArabic(query)
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
    .trim();
  const numberMatch = normalized.match(/(?:^|\s)([1-4])(?:\s|$)/);
  if (numberMatch) return Number(numberMatch[1]) - 1;

  const lastWord = normalized.split(" ").pop();
  const letterIndexes = { ا: 0, ب: 1, ج: 2, د: 3 };
  if (Object.prototype.hasOwnProperty.call(letterIndexes, lastWord)) {
    return letterIndexes[lastWord];
  }

  const choiceWords = { الاول: 0, الاولى: 0, الثاني: 1, الثانيه: 1, الثالث: 2, الثالثه: 2, الرابع: 3, الرابعه: 3 };
  if (Object.prototype.hasOwnProperty.call(choiceWords, lastWord)) {
    return choiceWords[lastWord];
  }

  return question.options.findIndex((option) => normalized === normalizeArabic(option));
}

function getQuestionHint(question) {
  const hints = {
    "الدعامة والحركة": "حدّد هل السؤال عن دعم النبات، مكونات المفصل، أم آلية حركة العضلة.",
    "التنسيق الهرموني": "اربط الهرمون أو الغدة بالوظيفة المطلوبة، وفكّر في تأثيره على العضو المستهدف.",
    التكاثر: "ميّز بين انتقال حبوب اللقاح والإخصاب، أو بين التكاثر الجنسي واللاجنسي.",
    المناعة: "اسأل نفسك: هل المطلوب حاجز عام، أم استجابة نوعية ضد مستضد محدد?",
    "DNA والمعلومات الوراثية": "راجع تكامل القواعد أو مكونات النيوكليوتيد، ثم طابقها مع صيغة السؤال.",
    "RNA وتخليق البروتين": "حدّد هل السؤال عن النسخ أم الترجمة، وأين تحدث كل عملية.",
    "الأحياء وعلوم الأرض": "تذكر طريقة تكوّن كل نوع: تبريد الصهارة، تراكم الرواسب، أو التحول بالحرارة والضغط.",
  };
  return `تلميح: ${hints[question.topic] || "اقرأ المطلوب وحدد المفهوم العلمي الأساسي، ثم استبعد الخيارات غير المرتبطة به."} أرسل رقم اختيارك (1–4) وسأتحقق منه معك.`;
}

function formatChatQuestion(question) {
  const choices = question.options.map((option, index) => `${index + 1}. ${option}`).join("\n");
  return `سؤال ${question.topic}:\n${question.question}\n${choices}\n\nاكتب رقم الإجابة، أو اطلب تلميحًا.`;
}

function getBotReply(query) {
  const normalizedQuery = normalizeArabic(query);
  if (/^(مرحبا|اهلا|السلام عليكم|صباح الخير|مساء الخير)/.test(normalizedQuery)) {
    return "أهلًا بك! أخبرني بما تريد فهمه، أو اختر «اختبرني». يمكننا أخذ الموضوع خطوة خطوة.";
  }

  if (questionAnswered && /(لماذا|ليه|اشرح الاجابه|وضح الاجابه|ما السبب)/.test(normalizedQuery)) {
    return currentQuestion ? currentQuestion.explanation : "أرسل السؤال الذي تريد توضيحه.";
  }

  if (/(تلميح|ساعدني|hint)/.test(normalizedQuery) && currentQuestion && !questionAnswered) {
    return getQuestionHint(currentQuestion);
  }

  if (/(تخطي|سؤال اخر|السؤال التالي)/.test(normalizedQuery)) {
    const nextQuestion = requestQuestion();
    return nextQuestion ? formatChatQuestion(nextQuestion) : "لم أجد سؤالًا آخر لهذا الموضوع.";
  }

  const followUpPattern = /(اشرح اكثر|وضح اكثر|بسط|ببساطه|لخص|اختصر|لم افهم|ما فهمت|بالتفصيل|خطوه بخطوه)/;
  if (followUpPattern.test(normalizedQuery)) {
    if (questionAnswered && currentQuestion) {
      const relatedKnowledge = findKnowledge(
        `${currentQuestion.question} ${currentQuestion.explanation}`,
        1,
      );
      if (relatedKnowledge.length) {
        return `تفصيل إضافي: ${relatedKnowledge[0].answer}`;
      }
      return `دعنا نراجع إجابة السؤال: ${currentQuestion.explanation}`;
    }
    if (lastKnowledgeEntry) {
      if (/(خطوه بخطوه|خطوات|بالتفصيل)/.test(normalizedQuery)) {
        const steps = lastKnowledgeEntry.answer
          .split(/[.!؟؛]\s*/)
          .filter(Boolean)
          .map((step, index) => `${index + 1}. ${step.trim()}.`);
        return `لنقسمها إلى خطوات:\n${steps.join("\n")}\n\nأي خطوة تريد أن أوضحها أكثر?`;
      }
      return `ببساطة: ${lastKnowledgeEntry.answer}\n\nهل تريد مثالًا أو سؤالًا قصيرًا للتأكد من الفهم?`;
    }
  }

  if (/(اختبرني|اختبر نفسي|اختبار|سؤال جديد|اسالني)/.test(normalizedQuery)) {
    const question = requestQuestion();
    return question ? formatChatQuestion(question) : "لا يتوفر سؤال لهذا الموضوع حاليًا.";
  }

  if (currentQuestion && !questionAnswered) {
    const answerIndex = parseChatAnswer(query, currentQuestion);
    if (answerIndex >= 0) {
      const isCorrect = answerQuestion(answerIndex);
      return isCorrect
        ? `أحسنت، إجابتك صحيحة. ${currentQuestion.explanation}`
        : `ليست الإجابة الصحيحة. الإجابة هي: ${currentQuestion.options[currentQuestion.correctIndex]}. ${currentQuestion.explanation}`;
    }
  }

  const isComparison = /(قارن|الفرق بين|ما الفرق)/.test(normalizedQuery);
  const matches = findKnowledge(query, isComparison ? 2 : 1);
  if (matches.length) {
    lastKnowledgeEntry = matches[0];
    if (isComparison && matches.length > 1) {
      return matches.map((entry) => `${entry.keywords[0]}:\n${entry.answer}`).join("\n\n");
    }
    return `${matches[0].answer}\n\nيمكنك أن تطلب مثالًا، تبسيطًا، أو سؤالًا عن هذا الموضوع.`;
  }

  return "لم أجد إجابة موثوقة في قاعدة المعرفة لهذا السؤال. أخبرني باسم الفصل أو أعد صياغة السؤال، وسأحاول مساعدتك. ويمكننا أيضًا حل سؤال معًا.";
}

const connectionStatus = document.querySelector("#connection-status");
const chatImage = document.querySelector("#chat-image");
const chatCameraImage = document.querySelector("#chat-camera-image");
const imageName = document.querySelector("#image-name");
const chatImagePreview = document.querySelector("#chat-image-preview");
const chatImagePreviewImage = document.querySelector("#chat-image-preview-img");
const removeChatImageButton = document.querySelector("#remove-chat-image");
const chatInput = document.querySelector("#chat-input");
const subjectSelect = document.querySelector("#subject-select");
const examSubjectSelect = document.querySelector("#exam-subject-select");
const newChatButton = document.querySelector("#new-chat");
const chatList = document.querySelector("#chat-list");
const themeToggle = document.querySelector("#theme-toggle");
const sidebar = document.querySelector(".sidebar");
const sidebarToggle = document.querySelector("#sidebar-toggle");
const sidebarBackdrop = document.querySelector("#sidebar-backdrop");
const examSettingsForm = document.querySelector("#exam-settings-form");
const examSourceImageInput = document.querySelector("#exam-source-image");
const examSourcePreview = document.querySelector("#exam-source-preview");
const examSourcePreviewImage = document.querySelector("#exam-source-preview-img");
const removeExamSourceImageButton = document.querySelector("#remove-exam-source-image");
const examStatus = document.querySelector("#exam-status");
const examWorkspace = document.querySelector("#exam-workspace");
const examWorkspaceTitle = document.querySelector("#exam-workspace-title");
const examProgress = document.querySelector("#exam-progress");
const examTimer = document.querySelector("#exam-timer");
const examQuestionView = document.querySelector("#exam-question-view");
const examAnswerAttachment = document.querySelector("#exam-answer-attachment");
const examAnswerImage = document.querySelector("#exam-answer-image");
const examImagePreview = document.querySelector("#exam-image-preview");
const removeExamImageButton = document.querySelector("#remove-exam-image");
const examImageName = document.querySelector("#exam-image-name");
const examPreviousButton = document.querySelector("#exam-previous");
const examNextButton = document.querySelector("#exam-next");
const submitExamButton = document.querySelector("#submit-exam");
const examResult = document.querySelector("#exam-result");
const retryExamButton = document.querySelector("#retry-exam");

const WORKER_URL = "https://frosty-hall-b193.hmoobaha8.workers.dev";
const accountScope = window.accountUserId || "guest";
const isAccountSession = accountScope !== "guest";
const EXAM_STORAGE_KEY = isAccountSession ? null : "activeAiExam";
const FALLBACK_SUBJECTS = [
  { id: "biology", label: "Biology — الأحياء" },
  { id: "chemistry", label: "Chemistry — الكيمياء" },
  { id: "physics", label: "Physics — الفيزياء" },
  { id: "mathematics", label: "Mathematics — الرياضيات" },
  { id: "arabic", label: "Arabic — اللغة العربية" },
  { id: "english", label: "English — اللغة الإنجليزية" },
  { id: "general", label: "مساعد عام" },
];
const QUESTION_TYPE_NAMES = {
  mcq: "اختيار من متعدد",
  true_false: "صح أو خطأ مع التصحيح",
  complete: "أكمل",
  explain: "علل",
  define: "المصطلحات",
  compare: "قارن",
  importance: "الوظيفة أو الأهمية",
  essay: "مقالي",
  application: "مسائل وتطبيقات",
};
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_EXAM_QUESTIONS = 20;

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

let aiMode = "biology";
let availableSubjects = FALLBACK_SUBJECTS;
let chatSessions = isAccountSession
  ? [...(window.accountChatSessions || [])]
  : JSON.parse(localStorage.getItem("aiChatSessions") || "[]");
const requestedChatId = new URLSearchParams(window.location.search).get("chat");
let activeChatId = requestedChatId && chatSessions.some((session) => session.id === requestedChatId)
  ? requestedChatId
  : isAccountSession
    ? chatSessions[0]?.id || createSessionId()
    : localStorage.getItem("activeChatId") || createSessionId();
let pendingImage = null;
let examAttempt = null;
let examTimerInterval = null;
let examSourceImage = null;

function getActiveSession() {
  let session = chatSessions.find((item) => item.id === activeChatId);
  if (!session) {
    session = { id: activeChatId, title: "محادثة جديدة", messages: [], mode: aiMode };
    chatSessions.unshift(session);
  }
  return session;
}

function saveSessions() {
  if (!isAccountSession) {
    localStorage.setItem("aiChatSessions", JSON.stringify(chatSessions));
    localStorage.setItem("activeChatId", activeChatId);
  }
  renderChatList();
  const activeSession = chatSessions.find((session) => session.id === activeChatId);
  if (activeSession && isAccountSession && window.studentAccount?.persistConversation) {
    window.studentAccount.persistConversation(activeSession).catch((error) => {
      console.error("تعذر حفظ المحادثة في الحساب:", error);
    });
  }
}

function getSubjectLabel(mode) {
  return availableSubjects.find((subject) => subject.id === mode)?.label || mode;
}

function getChatWelcome(isNewChat) {
  if (aiMode === "biology") {
    return isNewChat
      ? "ابدأ بسؤال في منهج الأحياء."
      : "مرحبًا! اسأل عن منهج الأحياء أو أرفق صورة سؤال لتحليلها.";
  }
  if (aiMode === "general") {
    return isNewChat ? "ابدأ بطرح سؤالك." : "مرحبًا! كيف يمكنني مساعدتك؟";
  }
  return isNewChat
    ? `ابدأ بطرح سؤالك على مدرس ${getSubjectLabel(aiMode)}.`
    : `مرحبًا! أنا مدرس ${getSubjectLabel(aiMode)}.`;
}

async function loadAvailableSubjects() {
  try {
    const response = await fetch(`${WORKER_URL}/api/subjects`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`تعذر تحميل المواد (${response.status}).`);
    const data = await response.json();
    if (!Array.isArray(data.subjects)) throw new Error("استجابة Worker لا تحتوي على قائمة مواد صالحة.");

    const seen = new Set();
    const subjects = data.subjects.filter((subject) => {
      if (!subject || typeof subject.id !== "string" ||
          !/^[a-z][a-z0-9_-]{0,39}$/.test(subject.id) ||
          typeof subject.label !== "string" || !subject.label.trim() ||
          subject.label.length > 80 || seen.has(subject.id)) {
        return false;
      }
      seen.add(subject.id);
      return true;
    });
    if (!subjects.some((subject) => subject.id === "biology")) {
      throw new Error("قائمة المواد لا تتضمن مادة الأحياء الافتراضية.");
    }

    const selectedMode = subjectSelect.value || aiMode;
    const selectedExamSubject = examSubjectSelect.value || "biology";
    availableSubjects = subjects;
    const createSubjectOption = (subject) => {
      const option = document.createElement("option");
      option.value = subject.id;
      option.textContent = subject.label;
      return option;
    };
    subjectSelect.replaceChildren(...subjects.map(createSubjectOption));
    examSubjectSelect.replaceChildren(...subjects
      .filter((subject) => subject.id !== "general")
      .map(createSubjectOption));
    aiMode = subjects.some((subject) => subject.id === selectedMode) ? selectedMode : "biology";
    subjectSelect.value = aiMode;
    examSubjectSelect.value = subjects.some((subject) => subject.id === selectedExamSubject) &&
      selectedExamSubject !== "general" ? selectedExamSubject : "biology";

    const activeSession = chatSessions.find((session) => session.id === activeChatId);
    if (activeSession && activeSession.mode !== aiMode) {
      activeSession.mode = aiMode;
      saveSessions();
    }
    connectionStatus.textContent = "متصل بخادم الذكاء الاصطناعي";
    connectionStatus.className = "connection-status online";
  } catch (error) {
    connectionStatus.textContent = "تعذر الاتصال بالخادم؛ أعد المحاولة لاحقًا";
    connectionStatus.className = "connection-status offline";
    console.error("تعذر تحميل مواد Worker:", error);
  }
}

function renderChatList() {
  chatList.replaceChildren();
  for (const session of chatSessions) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = session.title;
    if (session.id === activeChatId) button.classList.add("active");
    button.addEventListener("click", () => {
      openChat(session.id);
      closeMobileSidebar(true);
    });
    chatList.append(button);
  }
}

function setMobileSidebarOpen(isOpen) {
  sidebar.classList.toggle("open", isOpen);
  document.body.classList.toggle("sidebar-open", isOpen);
  sidebarBackdrop.hidden = !isOpen;
  sidebarToggle.setAttribute("aria-expanded", String(isOpen));
  sidebarToggle.setAttribute("aria-label", isOpen ? "إغلاق قائمة المحادثات" : "فتح قائمة المحادثات");
}

function closeMobileSidebar(restoreFocus) {
  if (!window.matchMedia("(max-width: 620px)").matches) return;
  setMobileSidebarOpen(false);
  if (restoreFocus) sidebarToggle.focus();
}

sidebarToggle.addEventListener("click", () => {
  setMobileSidebarOpen(!sidebar.classList.contains("open"));
});
sidebarBackdrop.addEventListener("click", () => closeMobileSidebar(true));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sidebar.classList.contains("open")) {
    closeMobileSidebar(true);
  }
});
window.addEventListener("resize", () => {
  if (!window.matchMedia("(max-width: 620px)").matches) setMobileSidebarOpen(false);
});

function openChat(id) {
  activeChatId = id;
  const session = getActiveSession();
  aiMode = session.mode || "biology";
  subjectSelect.value = aiMode;
  chatMessages.replaceChildren();
  appendChatMessage(getChatWelcome(false), "assistant");
  for (const message of session.messages) {
    const element = appendChatMessage(message.content, message.role, { source: message.source });
    if (message.imagePath && window.studentAccount?.signedImageUrl) {
      window.studentAccount.signedImageUrl(message.imagePath).then((imageUrl) => {
        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = "الصورة المرفقة في المحادثة";
        element.append(image);
      }).catch((error) => {
        console.error("تعذر عرض الصورة المحفوظة:", error);
      });
    }
  }
  saveSessions();
}

subjectSelect.addEventListener("change", () => {
  aiMode = subjectSelect.value;
  getActiveSession().mode = aiMode;
  saveSessions();
});

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("تعذرت قراءة الصورة."));
    reader.readAsDataURL(file);
  });
}

function clearChatImage() {
  pendingImage = null;
  chatImage.value = "";
  chatCameraImage.value = "";
  imageName.textContent = "";
  chatImagePreview.hidden = true;
  chatImagePreviewImage.removeAttribute("src");
}

async function handleChatImageChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > MAX_IMAGE_SIZE) {
    const errorMessage = file.size > MAX_IMAGE_SIZE
      ? "حجم الصورة يجب ألا يتجاوز 5 ميجابايت."
      : "يدعم رفع JPG أو PNG أو WEBP فقط.";
    clearChatImage();
    imageName.textContent = errorMessage;
    return;
  }
  try {
    const previewUrl = await readImageFile(file);
    pendingImage = {
      mimeType: file.type,
      data: previewUrl.split(",")[1],
      previewUrl,
      name: file.name,
    };
    chatImagePreviewImage.src = previewUrl;
    chatImagePreview.hidden = false;
    imageName.textContent = `الصورة جاهزة للإرسال: ${file.name}`;
  } catch (error) {
    clearChatImage();
    imageName.textContent = error.message;
  }
}

chatImage.addEventListener("change", handleChatImageChange);
chatCameraImage.addEventListener("change", handleChatImageChange);
removeChatImageButton.addEventListener("click", clearChatImage);

async function sendChatMessage(rawMessage) {
  const message = rawMessage.trim();
  if (!message && !pendingImage) return;
  const text = message || "حلل الصورة المرفقة واشرح ما تحتويه بالتفصيل.";
  appendChatMessage(text + (pendingImage ? "\n[تم إرفاق صورة]" : ""), "user");

  const session = getActiveSession();
  const targetSessionId = session.id;
  if (session.title === "محادثة جديدة") session.title = text.slice(0, 38);
  const userMessageEntry = { role: "user", content: text };
  session.messages.push(userMessageEntry);
  session.mode = aiMode;
  saveSessions();

  const loading = appendChatMessage("جار التفكير...", "assistant", { loading: true });
  const submitButton = chatForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  try {
    const requestBody = {
      message: text,
      mode: aiMode,
      history: session.messages.slice(-20, -1),
    };
    if (pendingImage) {
      requestBody.image = { mimeType: pendingImage.mimeType, data: pendingImage.data };
    }
    if (aiMode === "biology") requestBody.topic = topicSelect.value;
    const authHeaders = await window.studentAccount?.getAuthHeaders?.() || {};

    const response = await fetch(`${WORKER_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(requestBody),
    });
    const responseBody = await response.text();
    let data;
    try {
      data = JSON.parse(responseBody);
    } catch {
      data = null;
    }
    if (!response.ok) {
      throw new Error(data?.error || responseBody || `فشل الاتصال (${response.status})`);
    }
    if (!data) {
      throw new Error("استجابة Worker ليست JSON. تحقق من نشر واجهة Gemini على الرابط.");
    }
    const answer = typeof data === "string"
      ? data
      : data.reply || data.response || data.text || data.answer ||
        data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").filter(Boolean).join("\n");
    if (typeof answer !== "string" || !answer.trim()) {
      throw new Error(data.error || "لم يُرجع Worker إجابة نصية.");
    }
    if (answer.trim().toLowerCase() === "hello world!") {
      throw new Error("الرابط ما زال يعرض صفحة Worker التجريبية وليس Gemini.");
    }
    loading.remove();
    connectionStatus.textContent = "متصل؛ آخر إجابة وصلت بنجاح";
    connectionStatus.className = "connection-status online";
    if (activeChatId === targetSessionId) appendChatMessage(answer, "assistant");
    session.messages.push({ role: "assistant", content: answer });
  } catch (error) {
    loading.remove();
    connectionStatus.textContent = "تعذر الاتصال بمساعد الذكاء الاصطناعي";
    connectionStatus.className = "connection-status offline";
    if (activeChatId === targetSessionId) {
      appendChatMessage(`تعذر الوصول إلى النموذج: ${error.message}`, "error");
    }
  } finally {
    submitButton.disabled = false;
    if (pendingImage && window.studentAccount?.storeImage) {
      try {
        const storedImage = await window.studentAccount.storeImage(
          pendingImage.data,
          pendingImage.mimeType,
          pendingImage.name,
        );
        if (storedImage?.path) userMessageEntry.imagePath = storedImage.path;
      } catch (error) {
        if (activeChatId === targetSessionId) {
          appendChatMessage(`تنبيه: لم تُحفظ الصورة في سجل الحساب: ${error.message}`, "error");
        }
      }
    }
    clearChatImage();
    saveSessions();
  }
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = chatInput.value;
  chatInput.value = "";
  chatInput.style.height = "auto";
  sendChatMessage(message);
});

chatInput.addEventListener("input", () => {
  chatInput.style.height = "auto";
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, 140)}px`;
});

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

chatShortcuts.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-prompt]");
  if (button) sendChatMessage(button.dataset.prompt);
});

function setExamStatus(message, state = "") {
  examStatus.textContent = message;
  examStatus.className = `exam-status ${state}`;
}

function isValidExam(exam) {
  const grades = ["first_secondary", "second_secondary", "third_secondary"];
  const systems = ["general_secondary", "azhar", "training_comprehensive"];
  if (!exam || typeof exam.title !== "string" || !exam.title.trim() || exam.title.length > 160 ||
      !grades.includes(exam.grade) || !systems.includes(exam.examSystem) ||
      !Array.isArray(exam.questions) || !exam.questions.length ||
      exam.questions.length > MAX_EXAM_QUESTIONS) return false;

  const ids = new Set();
  return exam.questions.every((question) => {
    if (!question || typeof question.id !== "string" || ids.has(question.id) ||
        typeof QUESTION_TYPE_NAMES[question.type] !== "string" ||
        typeof question.prompt !== "string" || !question.prompt.trim() || question.prompt.length > 1600 ||
        !Array.isArray(question.options) || question.options.length > 6 ||
        !Number.isInteger(question.points) || question.points < 1 || question.points > 10 ||
        (question.correctAnswer !== undefined &&
          (typeof question.correctAnswer !== "string" || !question.correctAnswer.trim())) ||
        (question.explanation !== undefined &&
          (typeof question.explanation !== "string" || !question.explanation.trim())) ||
        (question.rubric !== undefined &&
          (!Array.isArray(question.rubric) || question.rubric.length < 1 || question.rubric.length > 8 ||
            !question.rubric.every((item) => typeof item === "string" && item.trim() && item.length <= 300)))) {
      return false;
    }
    if (question.type === "mcq" || question.type === "true_false") {
      if (question.options.length < 2 || !question.options.every((option) => typeof option === "string") ||
          (question.correctAnswer !== undefined && !question.options.includes(question.correctAnswer))) return false;
    } else if (question.options.length) {
      return false;
    }
    ids.add(question.id);
    return true;
  });
}

function isValidExamResult(result, exam) {
  if (!result || !Number.isFinite(result.score) || !Number.isFinite(result.maxScore) ||
      !Number.isFinite(result.percentage) || !Array.isArray(result.feedback) ||
      result.feedback.length !== exam.questions.length) return false;
  const maxScore = exam.questions.reduce((total, question) => total + question.points, 0);
  const score = result.feedback.reduce((total, item) => total + (Number.isFinite(item?.score) ? item.score : 0), 0);
  return result.maxScore === maxScore && result.score === score &&
    result.maxScore > 0 && result.score >= 0 && result.score <= result.maxScore &&
    Number.isFinite(result.percentage) && result.percentage >= 0 && result.percentage <= 100 &&
    result.percentage === Math.round((score / maxScore) * 100) &&
    result.feedback.every((item, index) => {
      const question = exam.questions[index];
      return item && item.id === question.id && Number.isFinite(item.score) &&
        item.score >= 0 && item.score <= question.points && item.maxScore === question.points &&
        typeof item.correctAnswer === "string" &&
        (typeof item.explanation === "string" || typeof question.explanation === "string") &&
        typeof item.feedback === "string" &&
        Array.isArray(item.missingPoints) && item.missingPoints.every((point) => typeof point === "string");
    }) &&
    Array.isArray(result.strengths) && result.strengths.every((item) => typeof item === "string") &&
    Array.isArray(result.weaknesses) && result.weaknesses.every((item) => typeof item === "string");
}

function persistExamAttempt() {
  if (!examAttempt) return;
  const savedAttempt = {
    ...examAttempt,
    imageQuestionIds: [...new Set([
      ...Object.keys(examAttempt.images || {}),
      ...(examAttempt.missingImageIds || []),
    ])],
    images: {},
  };
  if (EXAM_STORAGE_KEY) {
    try {
      localStorage.setItem(EXAM_STORAGE_KEY, JSON.stringify(savedAttempt));
    } catch (error) {
      setExamStatus("تعذر حفظ تقدم الامتحان على هذا الجهاز.", "error");
      console.error("تعذر حفظ محاولة الامتحان:", error);
    }
  } else if (window.studentAccount?.persistExam && examAttempt.status !== "completed") {
    window.studentAccount.persistExam(examAttempt).catch((error) => {
      setExamStatus(`تعذر حفظ إجابات الامتحان في حسابك: ${error.message}`, "error");
    });
  }
}

function renderExamResults() {
  const result = examAttempt.result;
  examResult.replaceChildren();
  const summary = document.createElement("h3");
  summary.textContent = `النتيجة: ${result.score} من ${result.maxScore} (${result.percentage}٪)`;
  examResult.append(summary);

  for (const [title, items] of [["نقاط القوة", result.strengths], ["نقاط تحتاج إلى مراجعة", result.weaknesses]]) {
    const heading = document.createElement("h4");
    heading.textContent = title;
    examResult.append(heading);
    const list = document.createElement("ul");
    for (const item of items) {
      const entry = document.createElement("li");
      entry.textContent = item;
      list.append(entry);
    }
    if (!items.length) {
      const entry = document.createElement("li");
      entry.textContent = "لا توجد ملاحظات.";
      list.append(entry);
    }
    examResult.append(list);
  }

  for (const item of result.feedback) {
    const question = examAttempt.exam.questions.find((entry) => entry.id === item.id);
    const section = document.createElement("section");
    section.className = "exam-result-item";
    const heading = document.createElement("h4");
    heading.textContent = `${QUESTION_TYPE_NAMES[question.type]} — ${item.score} من ${item.maxScore}`;
    const prompt = document.createElement("p");
    prompt.textContent = question.prompt;
    const feedback = document.createElement("p");
    feedback.textContent = item.feedback;
    const answer = document.createElement("p");
    answer.textContent = `الإجابة النموذجية: ${item.correctAnswer}`;
    const explanation = document.createElement("p");
    explanation.textContent = `التصحيح أو التفسير: ${item.explanation || question.explanation}`;
    section.append(heading, prompt, feedback, answer, explanation);
    if (item.missingPoints.length) {
      const missing = document.createElement("p");
      missing.textContent = `نقاط ناقصة: ${item.missingPoints.join("، ")}`;
      section.append(missing);
    }
    examResult.append(section);
  }
  examResult.hidden = false;
}

function renderExamQuestion() {
  if (!examAttempt) return;
  examWorkspace.hidden = false;
  examWorkspaceTitle.textContent = examAttempt.exam.title;
  const question = examAttempt.exam.questions[examAttempt.currentIndex];
  const isComplete = examAttempt.status === "completed";
  const isGrading = examAttempt.status === "grading";
  examProgress.textContent = `السؤال ${examAttempt.currentIndex + 1} من ${examAttempt.exam.questions.length} — الدرجة: ${question.points}`;
  examQuestionView.replaceChildren();

  const metadata = document.createElement("div");
  metadata.className = "exam-question-meta";
  const typeLabel = document.createElement("span");
  typeLabel.textContent = QUESTION_TYPE_NAMES[question.type];
  const pointsLabel = document.createElement("span");
  pointsLabel.textContent = `${question.points} درجة`;
  metadata.append(typeLabel, pointsLabel);
  const prompt = document.createElement("h4");
  prompt.textContent = question.prompt;
  examQuestionView.append(metadata, prompt);

  const currentAnswer = examAttempt.answers[question.id] || "";
  if (question.type === "mcq" || question.type === "true_false") {
    const options = document.createElement("div");
    options.setAttribute("role", "group");
    options.setAttribute("aria-label", "اختيارات الإجابة");
    for (const option of question.options) {
      const label = document.createElement("label");
      label.className = "exam-question-option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `exam-answer-${question.id}`;
      input.value = option;
      input.checked = currentAnswer === option;
      input.disabled = isComplete || isGrading;
      input.addEventListener("change", () => {
        examAttempt.answers[question.id] = input.value;
        persistExamAttempt();
      });
      const text = document.createElement("span");
      text.textContent = option;
      label.append(input, text);
      options.append(label);
    }
    examQuestionView.append(options);
  } else {
    const answer = document.createElement("textarea");
    answer.className = "exam-answer-text";
    answer.maxLength = 2400;
    answer.value = currentAnswer;
    answer.disabled = isComplete || isGrading;
    answer.placeholder = "اكتب إجابتك هنا...";
    answer.setAttribute("aria-label", "إجابتك عن السؤال");
    answer.addEventListener("input", () => {
      examAttempt.answers[question.id] = answer.value;
      persistExamAttempt();
    });
    examQuestionView.append(answer);
  }

  const attachedImage = examAttempt.images?.[question.id];
  examAnswerAttachment.hidden = isComplete;
  examAnswerImage.value = "";
  examImagePreview.hidden = !attachedImage;
  removeExamImageButton.hidden = !attachedImage;
  examImagePreview.src = attachedImage?.previewUrl || "";
  examImageName.textContent = attachedImage ? `صورة مرفقة: ${attachedImage.name}` : "";
  examAnswerImage.disabled = isComplete || isGrading;
  examPreviousButton.disabled = examAttempt.currentIndex === 0 || isGrading || isComplete;
  examNextButton.disabled = examAttempt.currentIndex === examAttempt.exam.questions.length - 1 || isGrading || isComplete;
  submitExamButton.disabled = isGrading || isComplete;
  submitExamButton.textContent = examAttempt.status === "expired" ? "إعادة محاولة التصحيح" : "تسليم الامتحان";
  examPreviousButton.hidden = isComplete;
  examNextButton.hidden = isComplete;
  submitExamButton.hidden = isComplete;
  retryExamButton.hidden = !isComplete;
  if (isComplete) renderExamResults();
  else examResult.hidden = true;
}

function updateExamTimer() {
  if (!examAttempt || examAttempt.status === "completed") return;
  const remaining = Math.max(0, examAttempt.expiresAt - Date.now());
  const totalSeconds = Math.ceil(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  examTimer.textContent = hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  if (remaining === 0 && examAttempt.status === "in_progress") {
    examAttempt.status = "expired";
    persistExamAttempt();
    void submitExam(true);
  }
}

function startExamTimer() {
  clearInterval(examTimerInterval);
  updateExamTimer();
  if (examAttempt?.status === "in_progress") {
    examTimerInterval = setInterval(updateExamTimer, 1000);
  }
}

async function submitExam(isAutomatic = false) {
  if (!examAttempt || ["completed", "grading"].includes(examAttempt.status)) return;
  clearInterval(examTimerInterval);
  examAttempt.status = "grading";
  persistExamAttempt();
  renderExamQuestion();
  const missingImages = examAttempt.missingImageIds?.length || 0;
  const imageNote = missingImages
    ? ` تنبيه: أعد رفع ${missingImages} صورة إجابة فُقدت بعد إعادة تحميل الصفحة.`
    : "";
  setExamStatus(`${isAutomatic ? "انتهى الوقت؛ جارٍ تسليم الامتحان وتصحيحه..." : "جارٍ تصحيح إجاباتك..."}${imageNote}`);
  submitExamButton.disabled = true;

  const answers = examAttempt.exam.questions.map((question) => {
    const answer = { id: question.id, text: examAttempt.answers[question.id] || "" };
    const image = examAttempt.images?.[question.id];
    if (image) answer.image = { mimeType: image.mimeType, data: image.data };
    return answer;
  });
  try {
    const authHeaders = await window.studentAccount?.getAuthHeaders?.() || {};
    const response = await fetch(`${WORKER_URL}/api/exams/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        mode: examAttempt.mode,
        attemptId: examAttempt.attemptId,
        exam: examAttempt.exam,
        answers,
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || `فشل التصحيح (${response.status}).`);
    if (!isValidExamResult(data, examAttempt.exam)) throw new Error("استجابة التصحيح غير مكتملة أو غير صالحة.");

    examAttempt.result = data;
    examAttempt.status = "completed";
    examAttempt.images = {};
    examAttempt.missingImageIds = [];
    persistExamAttempt();
    renderExamQuestion();
    setExamStatus("اكتمل التصحيح؛ راجع الدرجة والتفسير.", "success");
    connectionStatus.textContent = "متصل؛ اكتمل تصحيح الامتحان";
    connectionStatus.className = "connection-status online";
  } catch (error) {
    examAttempt.status = examAttempt.expiresAt > Date.now() ? "in_progress" : "expired";
    persistExamAttempt();
    renderExamQuestion();
    const missingImageNote = missingImages
      ? " أعد رفع صور الإجابات المفقودة عند الحاجة."
      : "";
    setExamStatus(`تعذر تصحيح الامتحان: ${error.message} يمكنك إعادة المحاولة دون فقد إجاباتك.${missingImageNote}`, "error");
    connectionStatus.textContent = "تعذر الاتصال بخدمة التصحيح";
    connectionStatus.className = "connection-status offline";
    if (examAttempt.status === "in_progress") startExamTimer();
  }
}

async function generateNewExam(excludeQuestions = []) {
  const selectedTypes = [...examSettingsForm.querySelectorAll('input[name="exam-question-type"]:checked')]
    .map((input) => input.value);
  const scope = document.querySelector("#exam-scope").value;
  const scopeTopic = document.querySelector("#exam-scope-topic").value.trim();
  const settings = {
    mode: examSubjectSelect.value,
    grade: document.querySelector("#exam-grade").value,
    examSystem: document.querySelector("#exam-system").value,
    scope,
    scopeTopic,
    questionCount: Number(document.querySelector("#exam-question-count").value),
    difficulty: document.querySelector("#exam-difficulty").value,
    durationMinutes: Number(document.querySelector("#exam-duration").value),
    questionTypes: selectedTypes,
    excludeQuestions,
  };
  if (!selectedTypes.length) {
    setExamStatus("اختر نوعًا واحدًا على الأقل من الأسئلة.", "error");
    return;
  }
  if (scope !== "full" && !scopeTopic) {
    setExamStatus("اكتب اسم الوحدة أو الدرس لإنشاء الامتحان.", "error");
    document.querySelector("#exam-scope-topic").focus();
    return;
  }
  if (!Number.isInteger(settings.questionCount) || settings.questionCount < 1 ||
      settings.questionCount > MAX_EXAM_QUESTIONS || !Number.isInteger(settings.durationMinutes) ||
      settings.durationMinutes < 5 || settings.durationMinutes > 180) {
    setExamStatus("تحقق من عدد الأسئلة ومدة الامتحان.", "error");
    return;
  }

  const generateButton = document.querySelector("#generate-exam");
  generateButton.disabled = true;
  generateButton.textContent = "جارٍ إنشاء امتحان جديد...";
  setExamStatus("يُنشئ Gemini امتحانًا جديدًا وفق اختياراتك...");
  try {
    const requestSettings = { ...settings };
    if (examSourceImage) {
      requestSettings.image = { mimeType: examSourceImage.mimeType, data: examSourceImage.data };
    }
    const response = await fetch(`${WORKER_URL}/api/exams/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await window.studentAccount?.getAuthHeaders?.() || {}),
      },
      body: JSON.stringify(requestSettings),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || `فشل إنشاء الامتحان (${response.status}).`);
    const generatedExam = data?.exam
      ? { ...data.exam, grade: settings.grade, examSystem: settings.examSystem }
      : null;
    if (!isValidExam(generatedExam)) throw new Error("لم يُرجع النموذج امتحانًا منظمًا صالحًا.");
    if (generatedExam.questions.some((question) => !selectedTypes.includes(question.type))) {
      throw new Error("الامتحان المعاد لا يطابق أنواع الأسئلة التي اخترتها.");
    }

    clearInterval(examTimerInterval);
    examAttempt = {
      mode: settings.mode,
      attemptId: typeof data.attemptId === "string" ? data.attemptId : null,
      exam: generatedExam,
      answers: {},
      images: {},
      currentIndex: 0,
      expiresAt: Date.now() + settings.durationMinutes * 60 * 1000,
      settings,
      status: "in_progress",
      result: null,
    };
    examResult.hidden = true;
    persistExamAttempt();
    renderExamQuestion();
    startExamTimer();
    setExamStatus("بدأ الامتحان؛ تُحفظ إجاباتك تلقائيًا على هذا الجهاز.", "success");
    connectionStatus.textContent = "متصل؛ أُنشئ امتحان جديد";
    connectionStatus.className = "connection-status online";
    examWorkspace.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    setExamStatus(`تعذر إنشاء الامتحان: ${error.message}`, "error");
    connectionStatus.textContent = "تعذر إنشاء امتحان من Gemini";
    connectionStatus.className = "connection-status offline";
  } finally {
    generateButton.disabled = false;
    generateButton.textContent = "إنشاء امتحان جديد";
  }
}

function restoreExamAttempt() {
  const saved = isAccountSession
    ? window.accountActiveExam ? JSON.stringify(window.accountActiveExam) : null
    : localStorage.getItem(EXAM_STORAGE_KEY);
  if (!saved) return;
  try {
    const stored = JSON.parse(saved);
    if (!isValidExam(stored.exam) || !stored.answers || typeof stored.answers !== "object" ||
        !Number.isFinite(stored.expiresAt) ||
        typeof stored.mode !== "string" || !/^[a-z][a-z0-9_-]{0,39}$/.test(stored.mode) ||
        !["in_progress", "expired", "grading", "completed"].includes(stored.status) ||
        (stored.status === "completed" && !isValidExamResult(stored.result, stored.exam))) {
      throw new Error("بيانات محاولة الامتحان المحفوظة غير مكتملة.");
    }
    examAttempt = { ...stored, images: {}, missingImageIds: stored.imageQuestionIds || [] };
    renderExamQuestion();
    if (examAttempt.status === "completed") {
      setExamStatus("تم استعادة نتيجة الامتحان السابق.", "success");
    } else if (examAttempt.status === "expired" || examAttempt.expiresAt <= Date.now()) {
      examAttempt.status = "expired";
      persistExamAttempt();
      renderExamQuestion();
      setExamStatus(examAttempt.missingImageIds.length
        ? "انتهى الوقت؛ جارٍ تسليم الإجابات المحفوظة تلقائيًا. لم تُستعد صور الإجابات السابقة."
        : "انتهى الوقت؛ جارٍ تسليم الإجابات المحفوظة تلقائيًا.");
      void submitExam(true);
    } else {
      examAttempt.status = "in_progress";
      setExamStatus(examAttempt.missingImageIds.length
        ? "تم استعادة إجاباتك؛ أعد رفع صور الإجابات السابقة قبل التسليم."
        : "تم استعادة محاولتك وإجاباتك المحفوظة.");
      startExamTimer();
    }
  } catch (error) {
    if (EXAM_STORAGE_KEY) localStorage.removeItem(EXAM_STORAGE_KEY);
    setExamStatus("تعذر استعادة الامتحان المحفوظ؛ أنشئ امتحانًا جديدًا.", "error");
    console.error("تعذر استعادة محاولة الامتحان:", error);
  }
}

examSourceImageInput.addEventListener("change", async () => {
  const file = examSourceImageInput.files[0];
  if (!file) return;
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > MAX_IMAGE_SIZE) {
    setExamStatus(file.size > MAX_IMAGE_SIZE
      ? "حجم الصورة المرجعية يجب ألا يتجاوز 5 ميجابايت."
      : "يدعم رفع JPG أو PNG أو WEBP فقط.", "error");
    examSourceImageInput.value = "";
    return;
  }
  try {
    const previewUrl = await readImageFile(file);
    examSourceImage = {
      mimeType: file.type,
      data: previewUrl.split(",")[1],
      previewUrl,
      name: file.name,
    };
    examSourcePreviewImage.src = previewUrl;
    examSourcePreview.hidden = false;
  } catch (error) {
    examSourceImage = null;
    examSourceImageInput.value = "";
    setExamStatus(error.message, "error");
  }
});
removeExamSourceImageButton.addEventListener("click", () => {
  examSourceImage = null;
  examSourceImageInput.value = "";
  examSourcePreviewImage.removeAttribute("src");
  examSourcePreview.hidden = true;
});

examSettingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (examAttempt && examAttempt.status !== "completed" &&
      !window.confirm("سيؤدي إنشاء امتحان جديد إلى استبدال المحاولة الحالية. هل تريد المتابعة؟")) return;
  const previousQuestions = examAttempt?.exam.questions.map((question) => question.prompt) || [];
  void generateNewExam(previousQuestions);
});

document.querySelector("#exam-scope").addEventListener("change", (event) => {
  const topicWrap = document.querySelector("#exam-scope-topic-wrap");
  const topicInput = document.querySelector("#exam-scope-topic");
  const needsTopic = event.target.value !== "full";
  topicWrap.hidden = !needsTopic;
  topicInput.required = needsTopic;
});

examPreviousButton.addEventListener("click", () => {
  if (!examAttempt || examAttempt.currentIndex === 0) return;
  examAttempt.currentIndex -= 1;
  persistExamAttempt();
  renderExamQuestion();
});
examNextButton.addEventListener("click", () => {
  if (!examAttempt || examAttempt.currentIndex >= examAttempt.exam.questions.length - 1) return;
  examAttempt.currentIndex += 1;
  persistExamAttempt();
  renderExamQuestion();
});
submitExamButton.addEventListener("click", () => {
  if (window.confirm("بعد التسليم لن تتمكن من تعديل الإجابات. هل تريد تسليم الامتحان؟")) {
    void submitExam(false);
  }
});
retryExamButton.addEventListener("click", () => {
  const previousQuestions = examAttempt?.exam.questions.map((question) => question.prompt) || [];
  void generateNewExam(previousQuestions);
});

examAnswerImage.addEventListener("change", async () => {
  const file = examAnswerImage.files[0];
  if (!file || !examAttempt) return;
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > MAX_IMAGE_SIZE) {
    setExamStatus(file.size > MAX_IMAGE_SIZE
      ? "حجم صورة الإجابة يجب ألا يتجاوز 5 ميجابايت."
      : "يدعم رفع JPG أو PNG أو WEBP فقط.", "error");
    examAnswerImage.value = "";
    return;
  }
  const question = examAttempt.exam.questions[examAttempt.currentIndex];
  const savedImages = Object.keys(examAttempt.images || {});
  if (!examAttempt.images?.[question.id] && savedImages.length >= 3) {
    setExamStatus("يمكن إرفاق صور إجابة لثلاثة أسئلة كحد أقصى.", "error");
    examAnswerImage.value = "";
    return;
  }
  try {
    const previewUrl = await readImageFile(file);
    examAttempt.images = examAttempt.images || {};
    examAttempt.images[question.id] = {
      mimeType: file.type,
      data: previewUrl.split(",")[1],
      previewUrl,
      name: file.name,
    };
    examAttempt.missingImageIds = (examAttempt.missingImageIds || []).filter((id) => id !== question.id);
    examImagePreview.src = previewUrl;
    examImagePreview.hidden = false;
    removeExamImageButton.hidden = false;
    examImageName.textContent = `صورة مرفقة: ${file.name}`;
    persistExamAttempt();
  } catch (error) {
    setExamStatus(error.message, "error");
  }
});
removeExamImageButton.addEventListener("click", () => {
  if (!examAttempt) return;
  const question = examAttempt.exam.questions[examAttempt.currentIndex];
  delete examAttempt.images?.[question.id];
  examAttempt.missingImageIds = (examAttempt.missingImageIds || []).filter((id) => id !== question.id);
  examAnswerImage.value = "";
  examImagePreview.removeAttribute("src");
  examImagePreview.hidden = true;
  removeExamImageButton.hidden = true;
  examImageName.textContent = "";
  persistExamAttempt();
});

newChatButton.addEventListener("click", () => {
  activeChatId = createSessionId();
  chatSessions.unshift({ id: activeChatId, title: "محادثة جديدة", messages: [], mode: aiMode });
  chatMessages.replaceChildren();
  appendChatMessage(getChatWelcome(true), "assistant");
  saveSessions();
  closeMobileSidebar();
  chatInput.focus();
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});
if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");

newQuestionButton.addEventListener("click", requestQuestion);
nextQuestionButton.addEventListener("click", requestQuestion);
renderChatList();
if (!chatSessions.length) getActiveSession();
openChat(activeChatId);
requestQuestion();
restoreExamAttempt();
void loadAvailableSubjects();
if (isAccountSession && window.accountSyncError) {
  connectionStatus.textContent = "تعذر تحميل سجل الحساب؛ قد لا تظهر بعض المحادثات أو الامتحانات.";
  connectionStatus.className = "connection-status offline";
}
