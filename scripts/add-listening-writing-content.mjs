// 一次性内容注入脚本：英语听力考点 + 语文写作考点 + 文言文翻译短答题。
// 用法：node scripts/add-listening-writing-content.mjs
import { readFile, writeFile } from "node:fs/promises";

const essayRubric = [
  {
    id: "content",
    label: "内容与情感",
    maxScore: 20,
    levels: [
      { label: "切题，有真情实感，中心突出", score: 18 },
      { label: "基本切题，中心明确", score: 14 },
      { label: "内容单薄或部分偏题", score: 8 },
    ],
    hints: [
      "是否始终围绕题目写同一件事/同一个观点？",
      "有没有具体细节让读者被打动，而不是空喊口号？",
      "删掉与中心无关的句子后文章是否更紧凑？",
    ],
  },
  {
    id: "structure",
    label: "结构与条理",
    maxScore: 15,
    levels: [
      { label: "层次清晰，详略得当，过渡自然", score: 13 },
      { label: "结构完整，分段合理", score: 10 },
      { label: "条理不清或一段到底", score: 5 },
    ],
    hints: [
      "开头是否快速入题（三行以内）？",
      "主体是否分 2～3 段，每段一个层次？",
      "结尾是否回扣标题或升华，而不是突然断掉？",
    ],
  },
  {
    id: "language",
    label: "语言与表达",
    maxScore: 10,
    levels: [
      { label: "流畅生动，句式有变化，用词准确", score: 9 },
      { label: "通顺明白，偶有语病", score: 7 },
      { label: "病句较多，表达含糊", score: 4 },
    ],
    hints: [
      "朗读一遍，拗口的地方就是需要修改的句子。",
      "连续三句以上字数接近时，试着合并或拆分。",
      "把「很」「非常」换成具体的描写。",
    ],
  },
  {
    id: "convention",
    label: "书写与规范",
    maxScore: 5,
    levels: [
      { label: "卷面整洁，标点正确，无错别字", score: 5 },
      { label: "卷面基本整洁，少量错别字", score: 3 },
      { label: "书写潦草，错别字较多", score: 1 },
    ],
    hints: [
      "数字、标点是否占格正确？",
      "有没有把「的/地/得」用混？",
      "誊写前用一分钟专门找错别字。",
    ],
  },
];

const essayPrompts = [
  {
    id: "cn-write-001",
    title: "《那一次，我真感动》",
    genre: "记叙文",
    minWords: 600,
    hints: ["选一件真正打动过你的小事，细节比大事更动人", "把'感动'落在具体动作、语言或场景上", "结尾回扣'那一次'，写出这件事对你的影响"],
    stem: "生活中总有一些瞬间让我们心头一热。请以《那一次，我真感动》为题，写一篇记叙文。不少于 600 字。",
    explanation: "审题关键在'那一次'（一件事、一个瞬间）和'真'（真实情感）。高分作文往往选择小切口：一碗面、一把伞、一句迟到的道歉。",
  },
  {
    id: "cn-write-002",
    title: "《这也是成长》",
    genre: "记叙文",
    minWords: 600,
    hints: ["'也'字暗示：这件事看起来不像成长，其实是的", "可写一次失败、一次道歉、一次坚持", "结尾点明'成长'体现在哪里"],
    stem: "成长不只是长高、获奖，有些成长藏在失败和告别里。请以《这也是成长》为题，写一篇记叙文。不少于 600 字。",
    explanation: "题眼是'也'：要写出认知反转——起初以为只是挫败/尴尬，后来才明白那也是成长。",
  },
  {
    id: "cn-write-003",
    title: "《留在我心底的声音》",
    genre: "记叙文",
    minWords: 600,
    hints: ["声音要具体：一句方言、一段旋律、一声叮咛", "写清楚这个声音为什么留在心底", "可以用'现在想起'的口吻收尾"],
    stem: "总有一种声音，多年以后还在心里回响。请以《留在我心底的声音》为题，写一篇记叙文。不少于 600 字。",
    explanation: "声音是线索，情感是主体。避免只描写声音本身，要写声音背后的人和事。",
  },
  {
    id: "cn-write-004",
    title: "《我们是一家人》",
    genre: "记叙文",
    minWords: 600,
    hints: ["通过一件家庭小事写出'一家人'的含义", "可以写矛盾后的和解，立意更深", "抓住家庭成员各自的细节反应"],
    stem: "家人之间难免有摩擦，但总会彼此牵挂。请以《我们是一家人》为题，写一篇记叙文。不少于 600 字。",
    explanation: "高分思路：先写冲突（误解、争吵），再写转折（谁先让步），最后落在'一家人'的温暖上。",
  },
  {
    id: "cn-write-005",
    title: "《那个影响了我的人》",
    genre: "记叙文",
    minWords: 600,
    hints: ["人物要具体到一句话、一个习惯", "写清'影响'：我之前怎样，之后怎样", "避免流水账式介绍人物"],
    stem: "有些人出现在我们的生命里，悄悄改变了我们。请以《那个影响了我的人》为题，写一篇记叙文。不少于 600 字。",
    explanation: "结构建议：一个场景切入 → 两三个具体事例（详一略二）→ 现在的我与从前的我对比。",
  },
  {
    id: "cn-write-006",
    title: "《雨天里的温暖》",
    genre: "记叙文",
    minWords: 600,
    hints: ["环境描写开头，渲染雨天氛围", "温暖来自谁？陌生人也很好", "雨'凉'与心'暖'形成对比"],
    stem: "请以《雨天里的温暖》为题，写一篇记叙文。不少于 600 字。",
    explanation: "借景抒情是基本盘：用雨的冷衬托暖，结尾雨停/伞收束画面。",
  },
  {
    id: "cn-write-007",
    title: "《坚持，让我了不起》",
    genre: "记叙文",
    minWords: 600,
    hints: ["选一件坚持了较长时间的事（练琴、跑步、改错本）", "写清最想放弃的时刻和撑下去的瞬间", "结尾点题：了不起的不是结果而是坚持"],
    stem: "请以《坚持，让我了不起》为题，写一篇记叙文。不少于 600 字。",
    explanation: "详写'至暗时刻'最见功力：身体的不适、他人的质疑、自我的动摇，再写如何挺过来。",
  },
  {
    id: "cn-write-008",
    title: "《家乡的味道》",
    genre: "记叙文",
    minWords: 600,
    hints: ["味道要具体到一道菜、一间小店", "由味道写到人和记忆", "结尾可用'无论走多远'升华"],
    stem: "请以《家乡的味道》为题，写一篇记叙文。不少于 600 字。",
    explanation: "味觉开头最抓人：先写气味与画面，再引出做这道菜的人，最后落在乡情。",
  },
  {
    id: "cn-write-009",
    title: "《说'顿悟'》/ 论'开卷有益'",
    genre: "议论文",
    minWords: 600,
    hints: ["观点鲜明：开头亮出中心论点", "至少两个论据：一个事例 + 一句名言", "结尾回扣论点，可加呼吁"],
    stem: "有人认为读书要精读一两本，有人认为应广泛涉猎。请围绕'开卷有益'写一篇议论文，题目自拟。不少于 600 字。",
    explanation: "议论文评分看三件事：观点是否明确、论据是否典型、论证是否有层次（是什么/为什么/怎么做）。",
  },
  {
    id: "cn-write-010",
    title: "《谈坚持》",
    genre: "议论文",
    minWords: 600,
    hints: ["开头用比喻或名言引出论点", "正反对比论证：坚持成事 vs 半途而废", "结尾联系中学生实际"],
    stem: "请以《谈坚持》为题，写一篇议论文。不少于 600 字。",
    explanation: "论据避免陈旧堆砌：可组合一个古代（愚公/司马迁）+ 一个当代（科研攻关/运动员）+ 一句名言。",
  },
  {
    id: "cn-write-011",
    title: "材料作文：'弯道'与'直道'",
    genre: "材料作文",
    minWords: 600,
    hints: ["先概括材料，再提炼观点", "立意参考：有时绕行是为了更好地抵达 / 人生没有白走的路", "材料作文必须点材料"],
    stem: "材料：导航软件常提示'前方拥堵，为您切换更快路线'；也有人说'最美的风景在路上，何必赶时间'。请自选角度、自拟题目，写一篇不少于 600 字的文章（文体不限，诗歌除外）。",
    explanation: "材料作文两步走：① 找关键词（快与慢、直与弯、目的与过程）；② 选一边立意，全文围绕它。",
  },
  {
    id: "cn-write-012",
    title: "材料作文：'补丁'",
    genre: "材料作文",
    minWords: 600,
    hints: ["'补丁'可实可虚：衣物补丁 / 心灵修补 / 不完美之美", "观点要能自圆其说", "结合自身或社会实例"],
    stem: "材料：旧衣服上的补丁，有人觉得难看，有人却绣上花纹让它变成独特的风景。请以'补丁'为话题，自拟题目，写一篇不少于 600 字的文章（文体不限）。",
    explanation: "话题作文空间大，但更要先'化大为小'：把补丁落到一次挫折、一个缺憾、一段修复的关系上。",
  },
];

const essayQuestions = essayPrompts.map((prompt, index) => ({
  id: prompt.id,
  subject: "chinese",
  knowledgePointIds: ["chinese-writing"],
  displayType: "作文题",
  type: "essay",
  difficulty: index >= 8 ? 3 : 2,
  estimatedSeconds: 2400,
  stem: prompt.stem,
  source: "中考写作训练",
  explanation: prompt.explanation,
  genre: prompt.genre,
  minWords: prompt.minWords,
  outlineHints: prompt.hints,
  rubric: essayRubric,
}));

const writingShortAnswers = [
  {
    id: "cn-write-013",
    stem: "仿写：请以'母爱是清晨厨房里的一碗热粥'为示例，另写一个比喻句，主题为'父爱'。",
    keyPoints: [
      { label: "句式一致：……是……的……（比喻句）", patterns: ["是"], score: 2 },
      { label: "有具体画面（地点/物品/动作）", patterns: ["手", "肩", "灯", "伞", "车", "书房", "厨房", "门口", "雨", "夜"], score: 2 },
      { label: "本体是父爱且比喻贴切", patterns: ["父爱"], score: 1 },
    ],
    referenceAnswer: "示例：父爱是深夜书桌旁默默续上的一杯温水。（句式与示例一致，画面具体，比喻贴切即可）",
    explanation: "仿写三看：句式是否一致、画面是否具体、情感是否贴合。'温水/台灯/自行车后座'都比'大山'更有画面感。",
    difficulty: 1,
  },
  {
    id: "cn-write-014",
    stem: "扩写：把'教室里很安静'扩写成 30～50 字的描写句（不得直接使用'安静'一词）。",
    keyPoints: [
      { label: "未直接使用'安静'", patterns: [], score: 2 },
      { label: "运用细节描写（动作/声音/光影）", patterns: ["笔", "风扇", "翻书", "呼吸", "粉笔", "窗", "光", "坐姿", "低头"], score: 2 },
    ],
    referenceAnswer: "示例：教室里只听见笔尖划过纸面的沙沙声，吊扇慢悠悠地转着，连平时最爱说话的同桌也把头埋进了臂弯。",
    explanation: "以声衬静是经典手法：写'听得见的细小声音'，比直接说'安静'高明得多。",
    difficulty: 2,
  },
  {
    id: "cn-write-015",
    stem: "下面这段话思路混乱，请用一句话写出它的中心句：'他每天五点半起床背单词，课间总是追着老师问题目，错题本已经记满了三本，晚自习结束后还要再留半小时复盘。'",
    keyPoints: [
      { label: "中心句概括'勤奋/努力/刻苦'的学习态度", patterns: ["勤奋", "努力", "刻苦", "用功", "认真", "自律", "拼"], score: 3 },
    ],
    referenceAnswer: "示例：他是一个学习极其勤奋（刻苦）的人。",
    explanation: "中心句要能统率后面所有细节：四个细节都在写'勤奋'，中心句就落在勤奋上。",
    difficulty: 1,
  },
  {
    id: "cn-write-016",
    stem: "请给下面这件事写一个 30 字左右的开头段，要求设置悬念：事件是'我最终把捡到的钱包还给了失主，还拒绝了两百元酬谢'。",
    keyPoints: [
      { label: "没有直接交代结果（悬念）", patterns: [], score: 2 },
      { label: "出现关键物件'钱包'", patterns: ["钱包"], score: 2 },
    ],
    referenceAnswer: "示例：那个鼓鼓的钱包在我书包里躺了一整晚，第二天早上，我攥着它在校门口站了很久。",
    explanation: "悬念开头常用手法：先给结果前的'临界画面'（攥着、站了很久），把'还不还'留到后文。",
    difficulty: 2,
  },
  {
    id: "cn-write-017",
    stem: "给作文《难忘的一节课》写一个 30～50 字的结尾段，要求点题并升华。",
    keyPoints: [
      { label: "点题（出现'这节课/难忘'等呼应语）", patterns: ["这节课", "这一课", "难忘", "这堂课"], score: 2 },
      { label: "有升华（收获/影响/道理）", patterns: ["明白", "懂得", "学会", "从此", "让我", "影响", "记住"], score: 2 },
    ],
    referenceAnswer: "示例：下课铃响了，但这堂课教给我的道理没有下课——原来最难忘的知识，常常藏在一次亲手尝试里。",
    explanation: "结尾三件事：回扣标题、提炼收获、留有余味。'没有下课'这类化用比空喊'我永远难忘'更高级。",
    difficulty: 2,
  },
  {
    id: "cn-write-018",
    stem: "修改病句并写出正确句子：'通过这次社会实践活动，使我开阔了眼界，增长了知识。'",
    keyPoints: [
      { label: "删去'通过'或'使'（缺主语问题）", patterns: ["这次社会实践活动使我", "通过这次社会实践活动，我"], score: 3 },
    ],
    referenceAnswer: "这次社会实践活动使我开阔了眼界，增长了知识。（或：通过这次社会实践活动，我开阔了眼界，增长了知识。）",
    explanation: "'通过……使……'连用导致句子没有主语，删掉其一即可。",
    difficulty: 1,
  },
  {
    id: "cn-write-019",
    stem: "把'夕阳落下去了，鸟儿回家了，我也该回家了'扩写成一个 40 字左右的景物描写句（至少用一种修辞）。",
    keyPoints: [
      { label: "使用了修辞（比喻/拟人/排比任一）", patterns:["像", "仿佛", "披上", "染红", "挥挥手", "道别", "赶路", "回家"], score: 2 },
      { label: "围绕'日落/归鸟/归家'的画面展开", patterns: ["夕阳", "晚霞", "太阳", "落日", "鸟", "家"], score: 2 },
    ],
    referenceAnswer: "示例：夕阳像喝醉了似的，摇摇晃晃地跌进山那头；晚归的鸟儿们叽叽喳喳，像是急着回家分享一天的见闻。",
    explanation: "扩写不是加形容词，而是加'动作'和'联想'：让太阳'跌'、让鸟儿'分享'，画面立刻活起来。",
    difficulty: 2,
  },
  {
    id: "cn-write-020",
    stem: "请为议论文《谈坚持》拟一个提纲：写出中心论点和两个分论点（每个不超过 20 字）。",
    keyPoints: [
      { label: "中心论点明确谈'坚持'的价值", patterns: ["坚持"], score: 2 },
      { label: "分论点角度不重复（如：为什么/怎么做/意义）", patterns: [], score: 2 },
    ],
    referenceAnswer: "示例——中心论点：坚持是普通人成事的唯一捷径。分论点一：坚持能积累微小优势，聚沙成塔；分论点二：坚持的本质是热爱与方法，而非硬扛。",
    explanation: "好的提纲让分论点呈递进或并列关系，角度错开（是什么/为什么/怎么办），写作时才不会车轱辘话来回说。",
    difficulty: 3,
  },
];

const classicalTranslations = [
  {
    id: "cn-classical-translate-001",
    stem: "翻译《论语》句子：'学而不思则罔，思而不学则殆。'",
    keyPoints: [
      { label: "'罔'译为迷惑/迷茫（而无所得）", patterns: ["迷惑", "迷茫", "困惑", "无所得"], score: 2 },
      { label: "'殆'译为疑惑/精神疲倦（有危险×）", patterns: ["疑惑", "疲倦", "疲乏", "有害", "危险"], score: 2 },
      { label: "句式通顺，'而'表转折译出", patterns: ["却", "但是", "但", "然而"], score: 1 },
    ],
    referenceAnswer: "只读书学习却不思考，就会感到迷惑而无所得；只空想却不读书学习，就会疑惑（精神疲倦）而有害。",
    explanation: "关键词：罔=迷惑而无所得；殆=疑惑/精神疲倦而无所得。两个'而'都是转折。",
    difficulty: 2,
  },
  {
    id: "cn-classical-translate-002",
    stem: "翻译《桃花源记》句子：'阡陌交通，鸡犬相闻。'",
    keyPoints: [
      { label: "'交通'译为交错相通（古今异义）", patterns: ["交错", "相通", "纵横"], score: 2 },
      { label: "'相闻'译为互相听得见", patterns: ["听到", "听见", "听到彼此", "互相听"], score: 2 },
    ],
    referenceAnswer: "田间小路交错相通，（村落间）鸡鸣狗叫的声音可以互相听到。",
    explanation: "'交通'是古今异义：古=交错相通，今=运输事业。直译为主，'阡陌'补出'田间小路'。",
    difficulty: 1,
  },
  {
    id: "cn-classical-translate-003",
    stem: "翻译《出师表》句子：'不宜妄自菲薄，引喻失义，以塞忠谏之路也。'",
    keyPoints: [
      { label: "'妄自菲薄'译为过分看轻自己", patterns: ["看轻自己", "轻视自己", "小看自己", "贬低自己"], score: 2 },
      { label: "'塞忠谏之路'译为堵塞忠臣进谏之路", patterns: ["堵塞", "阻塞", "阻断", "忠臣进谏", "进谏之路", "劝谏"], score: 2 },
    ],
    referenceAnswer: "（陛下）不应当随便看轻自己，说话不恰当，以致堵塞了忠臣进谏劝告的道路。",
    explanation: "本句是诸葛亮的规劝：'妄自菲薄'沿用至今；'引喻失义'=说话引喻不恰当。注意补出主语'陛下'。",
    difficulty: 2,
  },
  {
    id: "cn-classical-translate-004",
    stem: "翻译《小石潭记》句子：'潭中鱼可百许头，皆若空游无所依。'",
    keyPoints: [
      { label: "'可'译为大约（约有一百来条）", patterns: ["大约", "约", "左右", "来条", "来头"], score: 2 },
      { label: "'空游'译为在空中/如同在空中游动", patterns: ["空中", "空中游", "如同在空中", "像在空中"], score: 2 },
    ],
    referenceAnswer: "潭中的鱼大约有一百来条，都好像在空中游动，没有任何依靠。",
    explanation: "'可'=大约，表约数；'空游'侧面写潭水之清——水清到鱼像悬在空中。翻译时要保留这层画面。",
    difficulty: 2,
  },
  {
    id: "cn-classical-translate-005",
    stem: "翻译《岳阳楼记》句子：'不以物喜，不以己悲。'",
    keyPoints: [
      { label: "'以'=因为；译出'不因外物/自己（处境）'", patterns: [], score: 2 },
      { label: "互文理解：不因外界和自己而或喜或悲", patterns: ["外物", "外界", "环境", "自己", "个人", "得失"], score: 3 },
    ],
    referenceAnswer: "不因外界环境（的好坏）和自己（的得失）而或喜或悲。",
    explanation: "这是互文见义的典型：物与己、喜与悲互相交错，不能拆成'不因物喜、不因己悲'孤立理解。",
    difficulty: 3,
  },
  {
    id: "cn-classical-translate-006",
    stem: "翻译《醉翁亭记》句子：'醉翁之意不在酒，在乎山水之间也。'",
    keyPoints: [
      { label: "'意'译为情趣/意趣", patterns: ["情趣", "意趣", "兴致", "心思"], score: 2 },
      { label: "'在乎'译为在/在于", patterns: ["在于", "在"], score: 1 },
      { label: "整体句意通顺", patterns: ["山水"], score: 1 },
    ],
    referenceAnswer: "醉翁的情趣不在于喝酒，而在于（欣赏）山水的景色啊。",
    explanation: "'意'=情趣而非'意思'；'也'表判断语气，可译为'啊'或省略。此句已成成语'醉翁之意不在酒'。",
    difficulty: 1,
  },
];

const listeningDialogues = [
  {
    id: "en-listen-001",
    script: "M: What's the weather like today? W: It's sunny now, but the radio says it will rain this afternoon.",
    stem: "What will the weather be like this afternoon?",
    options: ["Sunny.", "Rainy.", "Cloudy.", "Windy."],
    answer: "B",
    explanation: "女士说 the radio says it will rain this afternoon，所以下午有雨。听力要点：转折词 but 后是重点。",
    difficulty: 1,
  },
  {
    id: "en-listen-002",
    script: "W: Excuse me, how can I get to the city library? M: Go straight and turn left at the second crossing. It's next to the post office.",
    stem: "Where is the city library?",
    options: ["At the first crossing.", "Next to the post office.", "Behind the bank.", "Near the school."],
    answer: "B",
    explanation: "男士说 It's next to the post office。听方位词时最好在心里画一张简易地图。",
    difficulty: 1,
  },
  {
    id: "en-listen-003",
    script: "M: Hi, Lucy. You look happy today. W: Yes, I got an A in my English exam. M: Congratulations!",
    stem: "Why is Lucy happy?",
    options: ["She passed the math exam.", "She got an A in English.", "She won a game.", "She got a new bike."],
    answer: "B",
    explanation: "Lucy 说 I got an A in my English exam。注意区分学科的干扰信息。",
    difficulty: 1,
  },
  {
    id: "en-listen-004",
    script: "W: What time does the train leave? M: At half past nine. And we should arrive at the station twenty minutes earlier.",
    stem: "When does the train leave?",
    options: ["At 9:00.", "At 9:13.", "At 9:30.", "At 8:40."],
    answer: "C",
    explanation: "half past nine = 9:30；提前 20 分钟是到达时间（9:10），是干扰项。数字题要做简单换算。",
    difficulty: 2,
  },
  {
    id: "en-listen-005",
    script: "M: Would you like some coffee or tea? W: Coffee, please. Oh, wait — the doctor says I'd better not drink coffee at night. Just a glass of water, thanks.",
    stem: "What will the woman drink at last?",
    options: ["Coffee.", "Tea.", "Water.", "Milk."],
    answer: "C",
    explanation: "女士先要咖啡又改主意：Just a glass of water。听力要跟到最后一刻，改主意的题非常常见。",
    difficulty: 2,
  },
  {
    id: "en-listen-006",
    script: "W: Tom, it's time for dinner! M: Coming, Mom. Let me save my game first.",
    stem: "What is Tom doing?",
    options: ["Having dinner.", "Playing a game.", "Doing homework.", "Watching TV."],
    answer: "B",
    explanation: "Tom 说 Let me save my game first，说明他正在打游戏。推断题要抓动作细节。",
    difficulty: 1,
  },
  {
    id: "en-listen-007",
    script: "M: How much is this T-shirt? W: It's 50 yuan, but there's a sale today — 20% off. M: Great, I'll take two.",
    stem: "How much will the man pay for two T-shirts?",
    options: ["50 yuan.", "80 yuan.", "90 yuan.", "100 yuan."],
    answer: "B",
    explanation: "50 元打 8 折 = 40 元/件，两件 = 80 元。价格题要边听边算。",
    difficulty: 3,
  },
  {
    id: "en-listen-008",
    script: "W: Did you watch the basketball match last night? M: No, I was busy preparing my speech. How was it? W: Amazing! Our team won by two points.",
    stem: "What did the man do last night?",
    options: ["He watched the match.", "He prepared a speech.", "He played basketball.", "He went to a party."],
    answer: "B",
    explanation: "男士说 I was busy preparing my speech。问'男的做了什么'时要盯紧男声内容。",
    difficulty: 1,
  },
  {
    id: "en-listen-009",
    script: "M: I'm not feeling well. I have a headache and a sore throat. W: You'd better see a doctor and drink more water. Don't worry — it's not serious.",
    stem: "What's the matter with the man?",
    options: ["He has a stomachache.", "He has a headache and a sore throat.", "His leg hurts.", "He has a fever."],
    answer: "B",
    explanation: "a headache and a sore throat 是关键词。身体不适类对话要记准部位。",
    difficulty: 1,
  },
  {
    id: "en-listen-010",
    script: "W: Shall we go to the museum by bus or by bike? M: The museum is not far. Let's ride bikes — it's good for the environment.",
    stem: "How will they go to the museum?",
    options: ["By bus.", "By bike.", "On foot.", "By car."],
    answer: "B",
    explanation: "Let's ride bikes 直接给出答案。出行方式题注意 but/let's 后的最终决定。",
    difficulty: 1,
  },
  {
    id: "en-listen-011",
    script: "M: Mom, can I go to Jim's birthday party this Saturday? W: Sure, but you must finish your homework first. And remember to come back before 9 p.m.",
    stem: "What must the boy do before the party?",
    options: ["Clean his room.", "Finish his homework.", "Buy a gift.", "Cook dinner."],
    answer: "B",
    explanation: "you must finish your homework first。条件句里 first 前的内容常是考点。",
    difficulty: 2,
  },
  {
    id: "en-listen-012",
    script: "W: Hello, this is Mary speaking. May I speak to John? M: Sorry, he's out playing football. Can I take a message? W: Yes, please tell him to call me back when he returns.",
    stem: "What will John do after he returns?",
    options: ["Play football.", "Call Mary back.", "Go shopping.", "Do homework."],
    answer: "B",
    explanation: "tell him to call me back。电话场景记两件事：留言内容 + 回复动作。",
    difficulty: 2,
  },
  {
    id: "en-listen-013",
    script: "M: What's your favorite subject, Kate? W: I used to like art, but now I enjoy science best because it's full of fun experiments.",
    stem: "What's Kate's favorite subject now?",
    options: ["Art.", "Science.", "Math.", "Music."],
    answer: "B",
    explanation: "used to like art 是过去，now I enjoy science best 是现在。时间对比题以'现在'为答案。",
    difficulty: 2,
  },
  {
    id: "en-listen-014",
    script: "W: The school sports meeting is coming. Will you take part in the long jump? M: No, I'll run the 800-meter race. What about you? W: I'll cheer for you!",
    stem: "What will the man do in the sports meeting?",
    options: ["The long jump.", "The 800-meter race.", "The 100-meter race.", "He will just watch."],
    answer: "B",
    explanation: "男士明确说 I'll run the 800-meter race。跳远是他不做的事，属干扰项。",
    difficulty: 1,
  },
  {
    id: "en-listen-015",
    script: "M: Winter vacation is coming. Any plans? W: I'm going to visit my grandparents in the countryside and help on the farm. M: Sounds interesting! I'll just stay at home and read.",
    stem: "What is the woman going to do during the vacation?",
    options: ["Read at home.", "Visit her grandparents.", "Travel abroad.", "Study English."],
    answer: "B",
    explanation: "女士说 visit my grandparents in the countryside。计划类对话注意 be going to / will 后的动作。",
    difficulty: 1,
  },
];

const listeningFillIns = [
  {
    id: "en-listen-016",
    script: "Please turn off the lights when you leave the classroom.",
    stem: "听句子，写出句中你听到的动词短语（两个词）。",
    acceptedAnswers: ["turn off"],
    explanation: "turn off 关闭（灯/电器）。turn on 是打开，注意区分 on 和 off。",
    difficulty: 1,
  },
  {
    id: "en-listen-017",
    script: "My father is good at cooking, and he often makes delicious noodles for us.",
    stem: "听句子，写出句中你听到的动词短语（be 动词 + 介词）。",
    acceptedAnswers: ["good at"],
    explanation: "be good at = 擅长。注意 at 不要漏写。",
    difficulty: 1,
  },
  {
    id: "en-listen-018",
    script: "It took me half an hour to walk to school because the bus was late.",
    stem: "听句子，写出句中你听到的时间短语（三个词）。",
    acceptedAnswers: ["half an hour"],
    explanation: "half an hour 半小时。注意 an 不要写成 a。",
    difficulty: 2,
  },
  {
    id: "en-listen-019",
    script: "Remember to put on your coat, it's getting colder and colder outside.",
    stem: "听句子，写出句中你听到的动词短语（两个词）。",
    acceptedAnswers: ["put on"],
    explanation: "put on 穿上。wear 是状态，put on 是动作。",
    difficulty: 1,
  },
  {
    id: "en-listen-020",
    script: "We should look after the old and help each other in our daily life.",
    stem: "听句子，写出句中你听到的动词短语（两个词，'照顾'）。",
    acceptedAnswers: ["look after"],
    explanation: "look after = take care of 照顾。each other 互相。",
    difficulty: 2,
  },
];

const englishListeningTopic = {
  id: "english-listening",
  name: "听力理解",
  subject: "english",
  summary: "短对话听力与听句填词：预读题目抓关键词，听转折与最后决定，练数字、时间、地点的速记。",
  examWeight: "high",
  status: "learning",
  lesson: {
    objectives: [
      "掌握听前预读、预测题点的准备方法",
      "学会抓关键词：数字、时间、地点、转折词后的信息",
      "能听懂初中常见话题短对话并正确作答",
    ],
    keyIdea: "听力不是逐字听懂，而是带着问题去'抓'关键信息：先读题预测，再听重点词，最后跟上'改主意'和'最后决定'。",
    concepts: [
      { title: "听前预读与预测", content: ["利用放音前的时间读题干和选项", "圈出选项里的差异词（学科、时间、地点）", "预测可能出现的词汇家族，如 weather → sunny / rainy / cloudy"] },
      { title: "抓关键词与速记", content: ["数字与时间：边听边换算（half past nine = 9:30；20% off = 打 8 折）", "地点与人物：who / where / what 速记首字母", "转折词 but / however 之后往往是真正答案"] },
      { title: "同义转换与语气", content: ["选项常把听力原文换一种说法：enjoy best = favorite", "语调上扬的疑问、迟疑的 well/er 常暗示否定或改主意", "最后一句 frequently 是结论句"] },
    ],
    formulas: [
      { name: "听力三步法", expression: "预读预测 → 抓关键词 → 听最后决定", note: "拿到题先看选项差异，听时盯关键词，答案常在转折和结尾处。" },
      { name: "速记符号", expression: "数字记阿拉伯数字，↑=increase，↓=decrease，?=疑问" },
    ],
    workedExamples: [
      {
        title: "例题：改主意型对话",
        problem: "W: Would you like coffee or tea? M: Coffee, please. Oh, wait — I'd better not drink coffee at night. Just water, thanks. 男士最后喝什么？",
        steps: ["预读选项：coffee / tea / water / milk", "听到 Coffee, please 时先标记 A", "听到 Oh, wait — Just water 时改成 C", "结论：改主意题跟到最后一刻"],
        answer: "Water.",
        takeaway: "Oh wait / but / well 出现时，前面的话要重新审视。",
      },
    ],
    pitfalls: [
      { mistake: "听到什么选什么，被先出现的干扰项带跑", correction: "先出现的名词常是铺垫，but / wait / however 后才是定论。" },
      { mistake: "数字题听完就算完，不做换算", correction: "价格打折、时间提前都要当场算完再选。" },
    ],
    strategy: "每段对话只读两遍：第一遍抓大意和关键词，第二遍核对细节。听完立刻作答，不要留到下一题还在回想上一题。",
  },
};

const chineseWritingTopic = {
  id: "chinese-writing",
  name: "写作与表达",
  subject: "chinese",
  summary: "记叙文与议论文写作训练：审题立意、结构布局、细节描写，配套作文量表自评与片段写作（仿写/扩写/开头结尾）。",
  examWeight: "high",
  status: "learning",
  lesson: {
    objectives: [
      "掌握全命题、半命题与材料作文的审题方法",
      "学会'开头入题—主体分层—结尾升华'的结构布局",
      "能通过细节描写代替空泛抒情",
      "会用作文量表对照自评并修改",
    ],
    keyIdea: "作文得高分的本质是'切题 + 具体'：审题抓住题眼，选材小切口，写作用细节说话，结构上让阅卷老师 30 秒看清你的思路。",
    concepts: [
      { title: "审题与立意", content: ["全命题抓题眼：如《那一次，我真感动》的'那一次'限一件事、'真'限真实情感", "半命题先补题：补出的词要具体可写，避免大而空", "材料作文两步走：先概括材料找关键词，再选角度立意，行文必须点材料"] },
      { title: "结构与布局", content: ["记叙文：场景开头 → 事件发展（详写高潮）→ 感悟收束", "议论文：亮观点 → 分论点递进（为什么/怎么办）→ 联系实际收尾", "分段纪律：不少于 5 段，单段不超过 200 字"] },
      { title: "细节与语言", content: ["把'很感动'换成动作、语言、神态的特写", "连续短句制造紧张，长句舒缓抒情，句式要有变化", "首尾呼应：结尾回扣标题中的关键词"] },
    ],
    formulas: [
      { name: "记叙文高分公式", expression: "小切口 + 一波三折 + 细节特写 + 卒章显志", note: "选一件具体的小事，设置一个小波折，用细节写活它，结尾点明意义。" },
      { name: "议论文结构公式", expression: "引论亮观点 → 本论三层递进 → 结论联实际" },
      { name: "结尾升华句式", expression: "'这堂课教给我的道理没有下课——……'式化用或回扣" },
    ],
    workedExamples: [
      {
        title: "例题：把'感动'写具体",
        problem: "把'妈妈送伞让我很感动'写出画面感。",
        steps: ["删掉'很感动'三个字", "写动作：她把伞塞给我，自己半个肩膀露在雨里", "写声音：'快进去，别感冒了'，声音比平时哑", "写我的反应：我站在教学楼门口，看她把外套顶在头上跑进雨里"],
        answer: "示例：她把伞往我怀里一塞：'快进去，别感冒了。'声音比平时哑。我抱着还带她体温的伞站在屋檐下，看她把外套顶在头上，一路小跑着消失在雨幕里。",
        takeaway: "感动藏在动作和声音里，不在形容词里。",
      },
    ],
    pitfalls: [
      { mistake: "开头绕圈子，三四行还没进正题", correction: "开头三行内出现人/事/物，环境描写不超过两句。" },
      { mistake: "记叙文流水账，每件事都写一样的篇幅", correction: "详写一件事的高潮部分，其余用一两句带过。" },
      { mistake: "议论文观点骑墙，两边都说", correction: "开头就亮明一个观点，全文为它服务。" },
    ],
    strategy: "写前 5 分钟列提纲：中心句 + 三段段意 + 结尾关键词。写完用评分量表逐项自评，专改'空话段'和'流水账段'。",
  },
};

async function main() {
  // ── 英语：新增听力理解考点 ──
  const englishPath = "src/data/english.json";
  const english = JSON.parse(await readFile(englishPath, "utf8"));
  english.version = "english-v1.1";
  if (!english.knowledgePoints.some((p) => p.id === "english-listening")) {
    english.knowledgePoints.push(englishListeningTopic);
  }
  const enIds = new Set(english.questions.map((q) => q.id));
  listeningDialogues.forEach((item) => {
    if (enIds.has(item.id)) return;
    english.questions.push({
      id: item.id,
      subject: "english",
      knowledgePointIds: ["english-listening"],
      displayType: "听力理解",
      type: "single-choice",
      difficulty: item.difficulty,
      estimatedSeconds: 60,
      stem: item.stem,
      listeningScript: item.script.replace(/^M: /, "M: ").replace(/ M: /g, " M: ").replace(/ W: /g, " W: "),
      source: "中考听力训练",
      options: item.options.map((label, i) => ({ key: "ABCD"[i], label })),
      answer: item.answer,
      explanation: item.explanation,
    });
  });
  listeningFillIns.forEach((item) => {
    if (enIds.has(item.id)) return;
    english.questions.push({
      id: item.id,
      subject: "english",
      knowledgePointIds: ["english-listening"],
      displayType: "听句填空",
      type: "expression",
      answerKind: "text",
      difficulty: item.difficulty,
      estimatedSeconds: 45,
      stem: item.stem,
      listeningScript: item.script,
      source: "中考听力训练",
      acceptedAnswers: item.acceptedAnswers,
      explanation: item.explanation,
    });
  });
  await writeFile(englishPath, JSON.stringify(english, null, 2) + "\n");
  console.log("english.json 更新：", english.knowledgePoints.length, "考点 /", english.questions.length, "题");

  // ── 语文：新增写作与表达考点 + 文言文翻译短答题 ──
  const chinesePath = "src/data/chinese.json";
  const chinese = JSON.parse(await readFile(chinesePath, "utf8"));
  chinese.version = "chinese-v1.1";
  if (!chinese.knowledgePoints.some((p) => p.id === "chinese-writing")) {
    chinese.knowledgePoints.push(chineseWritingTopic);
  }
  const cnIds = new Set(chinese.questions.map((q) => q.id));
  essayQuestions.forEach((q) => {
    if (!cnIds.has(q.id)) chinese.questions.push(q);
  });
  writingShortAnswers.forEach((item) => {
    if (cnIds.has(item.id)) return;
    chinese.questions.push({
      id: item.id,
      subject: "chinese",
      knowledgePointIds: ["chinese-writing"],
      displayType: "片段写作",
      type: "short-answer",
      difficulty: item.difficulty,
      estimatedSeconds: 300,
      stem: item.stem,
      source: "中考写作训练",
      explanation: item.explanation,
      keyPoints: item.keyPoints,
      referenceAnswer: item.referenceAnswer,
    });
  });
  classicalTranslations.forEach((item) => {
    if (cnIds.has(item.id)) return;
    chinese.questions.push({
      id: item.id,
      subject: "chinese",
      knowledgePointIds: ["chinese-classical-chinese"],
      displayType: "翻译题",
      type: "short-answer",
      difficulty: item.difficulty,
      estimatedSeconds: 180,
      stem: item.stem,
      source: "中考文言文训练",
      explanation: item.explanation,
      keyPoints: item.keyPoints,
      referenceAnswer: item.referenceAnswer,
    });
  });
  await writeFile(chinesePath, JSON.stringify(chinese, null, 2) + "\n");
  console.log("chinese.json 更新：", chinese.knowledgePoints.length, "考点 /", chinese.questions.length, "题");
}

await main();
