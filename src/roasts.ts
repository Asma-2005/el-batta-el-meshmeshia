export type TriggerReason = 'ai_junk_found' | 'huge_paste' | 'medium_paste';

export interface Roast {
  readonly message: string;
  readonly shareText: string;
}

const LTR_ISOLATE = '\u2066';
const POP_DIRECTIONAL_ISOLATE = '\u2069';

function ltr(value: string): string {
  return `${LTR_ISOLATE}${value}${POP_DIRECTIONAL_ISOLATE}`;
}

const ROASTS: Readonly<Record<TriggerReason, readonly Roast[]>> = {
  medium_paste: [
    {
      message: 'إيه يا بشمهندس؟ كده بقت مطوّر بصمجيات!',
      shareText: 'البطة مسكتني بلزق كود من غير ما أقراه. مطوّر بصمجيات رسمي.'
    },
    {
      message: 'صلّي على النبي كده… إنت قريت السطور دي ولا داخل على عماك؟',
      shareText: `البطة طلبت مني أقرا الكود قبل ما أعمل نفسي ${ltr('Senior')}.`
    },
    {
      message: `هو ${ltr('Ctrl+V')} عندك شغّال بالكهربا؟ براحة شوية يا فنان.`,
      shareText: `واضح إن زرار ${ltr('Ctrl+V')} عندي محتاج عدّاد كهربا.`
    },
    {
      message: `البطة بتقولك: خمس ثواني مراجعة أو خمس ساعات ${ltr('Debugging')}. اختار.`,
      shareText: `خمس ثواني مراجعة أو خمس ساعات ${ltr('Debugging')} — حكمة بطة ${ltr('Senior')}.`
    },
    {
      message: 'الكود نزل مرة واحدة كده ليه؟ هو جاي أوبر؟',
      shareText: `لزقت كود كامل مرة واحدة والبطة سألته: حضرتك جاي ${ltr('Uber')}؟`
    }
  ],
  huge_paste: [
    {
      message: `ده كود ده ولا رواية لنجيب محفوظ؟ مين هيعمله ${ltr('Review')}؟`,
      shareText: 'لزقت رواية برمجية كاملة والبطة طلبت فهرس ومراجع.'
    },
    {
      message: `هو إنت مأجّر الـ ${ltr('Editor')} بالمتر؟ فكك من القص واللزق وركّز دقيقة.`,
      shareText: `البطة اكتشفت إني مأجّر الـ ${ltr('Editor')} بالمتر.`
    },
    {
      message: `سامع صوت الـ ${ltr('Server')} بيستغيث؟ شيل الهبد وافهم سطر سطر.`,
      shareText: `الـ ${ltr('Server')} لسه ما اشتغلش ومع ذلك البطة سمعته بيستغيث.`
    },
    {
      message: `يا هندسة، ده ${ltr('Paste')} ولا نقل عفش؟ ادّي كل ${ltr('function')} حقها.`,
      shareText: `عملت ${ltr('Paste')} بحجم نقل عفش. البطة طلبت ونش.`
    },
    {
      message: `الـ ${ltr('Pull Request')} شاف البلوك ده وقدّم استقالته.`,
      shareText: `الـ ${ltr('Pull Request')} بتاعي قدّم استقالته بعد ${ltr('Paste')} تاريخي.`
    }
  ],
  ai_junk_found: [
    {
      message: `يا مثبت العقل والدين… سايبلي ${ltr('“Here is the code”')} جوه الـ ${ltr('function')}؟`,
      shareText: `البطة لقت تعليق ${ltr('“Here is the code”')} في الكود ومسكتني متلبّس.`
    },
    {
      message: `الـ ${ltr('API placeholder')} والـ ${ltr('Markdown')} باينين زي عين الشمس. راجع يا نجم.`,
      shareText: `البطة لقت الـ ${ltr('AI leftovers')} قبل الـ ${ltr('code review')}.`
    },
    {
      message: `حتى الـ ${ltr('AI')} قالك امسح الـ ${ltr('code fence')}… إنت سيبته تذكار؟`,
      shareText: `سيبت الـ ${ltr('code fence')} في الملف والبطة اعتبرته قطعة أثرية.`
    },
    {
      message: `${ltr('“Replace with your implementation”')}؟ طب ما تستبدلها فعلًا يا ${ltr('Senior')}!`,
      shareText: `البطة اكتشفت إن الـ ${ltr('implementation')} عندي لسه ${ltr('“your implementation”')}.`
    },
    {
      message: `ريحة ${ltr('Prompt')} طالعة من الكومنتات. نضّف قبل ما الـ ${ltr('Reviewer')} يشمّها.`,
      shareText: `البطة شمّت ريحة الـ ${ltr('prompt')} في الكومنتات.`
    }
  ]
};

export function getRandomRoast(
  reason: TriggerReason,
  random: () => number = Math.random
): Roast {
  const options = ROASTS[reason];
  const rawIndex = Math.floor(random() * options.length);
  const index = Math.max(0, Math.min(options.length - 1, rawIndex));
  return options[index] ?? options[0]!;
}
