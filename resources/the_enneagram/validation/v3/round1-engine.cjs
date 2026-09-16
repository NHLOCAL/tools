/* Original Hebrew reflection questionnaire. No third-party test items are reproduced. */
(function (root) {
  'use strict';
  const VERSION = '3.0.0';
  const CORE_MIN = 62.5;
  const MOTIVE_CONFLICT_GAP = 12.5;
  const WING_MIN = 62.5;
  const WING_RATIO = 0.75;
  const TYPE_GAP = 8;
  const WING_GAP = 8;
  const INSTINCT_GAP = 8;
  const typeItems = {
    1: [
      'גם כשאיש לא ידע, חשוב לי לפעול לפי מה שבעיניי נכון וראוי.',
      'כשמשהו נעשה באופן לקוי, קשה לי להניח לו בלי לנסות לתקן.',
      'אחרי טעות קטנה, הביקורת הפנימית שלי ממשיכה לעבוד גם כשהסביבה כבר המשיכה הלאה.',
      'במשימה משותפת, חשוב לי שהדרך תהיה ראויה ויסודית, גם אם קיצור דרך ייתן תוצאה מרשימה.',
      'כשמישהו מתנער מאחריות, מתעורר בי מתח שקשה לי לשחרר.',
      'קל לי לקבל עבודה לא מושלמת בלי להרגיש צורך לתקן אותה.'
    ],
    2: [
      'כשאני עוזר למישהו, התחושה שצריכים אותי מחזקת את תחושת הערך שלי.',
      'אני מבחין בצרכים של אחרים מהר יותר מכפי שאני נותן מקום לצרכים שלי.',
      'קשה לי לסרב לבקשת עזרה כשאני חושש שהסירוב ירחיק ממני אדם חשוב.',
      'אם נתתי מעצמי ולא שמו לב לכך, אני נפגע יותר ממה שאני מראה.',
      'במערכת יחסים חדשה, אני מנסה להתקרב דרך תמיכה, מחוות ועשייה למען הצד השני.',
      'אני מרגיש אהוב גם כשאיני מועיל לאף אחד, ולא צריך להרוויח קרבה באמצעות נתינה.'
    ],
    3: [
      'כשאני לא עומד ביעד, קשה לי להפריד בין התוצאה לבין הערך שלי כאדם.',
      'אני מתאים את האופן שבו אני מציג את עצמי למה שהסביבה מחשיבה להצלחה.',
      'חשוב לי שאנשים יראו בי אדם מצליח, גם כשאני לא אומר זאת בקול.',
      'בפרויקט חדש, אני מחפש במהירות מה יביא לתוצאה שאפשר להציג.',
      'גם בזמן פנוי, אני מתקשה לנוח אם אין לי תחושה שהתקדמתי או השגתי משהו.',
      'גם בתקופה ללא הישגים, תחושת הערך שלי נשארת יציבה למדי.'
    ],
    4: [
      'חשוב לי שהבחירות שלי יבטאו מי אני, גם אם הן שונות ממה שמקובל סביבי.',
      'כשחוויה מרגישה שטחית או לא אותנטית, קשה לי להתחבר אליה גם אם היא נעימה.',
      'אני חוזר לרגשות שלי כדי להבין מה הם מגלים על הזהות שלי.',
      'כשאני משווה את חיי לחיי אחרים, אני שם לב במיוחד לדבר המשמעותי שחסר לי.',
      'כשלא מבינים את העולם הפנימי שלי, מתעוררת בי תחושה עמוקה שאני שונה.',
      'לא מפריע לי במיוחד להיות דומה לאחרים; אין לי צורך שהבחירות שלי יבטאו זהות ייחודית.'
    ],
    5: [
      'לפני שאני נרתם לדבר חדש, אני בודק כמה זמן ואנרגיה יישארו לי לעצמי.',
      'אני דוחה לפעמים השתתפות עד שארגיש שיש לי מספיק ידע כדי להתמודד בכוחות עצמי.',
      'כשדורשים ממני הרבה זמינות, אני מצמצם קשר כדי לשמור על המשאבים שלי.',
      'מול מצב טעון, התגובה הראשונה שלי היא להתרחק מעט ולנסות להבין אותו.',
      'אני מעדיף להבין נושא לעומק בעצמי לפני שאחשוף לאחרים את מה שאני חושב עליו.',
      'קל לי להיכנס לעשייה בלי להבין הרבה מראש, גם אם אצטרך להיעזר באחרים לאורך הדרך.'
    ],
    6: [
      'לפני החלטה חשובה, אני מחפש מה עלול להשתבש ולמי אפשר לפנות אם זה יקרה.',
      'חשוב לי לבדוק אם אפשר לסמוך על אדם, גם כשהוא משדר ביטחון וסמכות.',
      'גם אחרי שקיבלתי עצה טובה, אני עשוי להמשיך לבדוק אם היא באמת אמינה.',
      'אני מכין חלופות מראש כי קשה לי להישען על ההנחה שהכול יסתדר.',
      'כשאני חושש ממשהו, אני מרגיש צורך לבדוק אותו היטב או להתעמת איתו כדי לדעת היכן אני עומד.',
      'לאחר החלטה בתנאי אי ודאות, בדרך כלל קל לי להפסיק לבדוק אם פספסתי סכנה.'
    ],
    7: [
      'הידיעה שיש עוד אפשרויות וחוויות בהמשך נותנת לי אנרגיה גם ביום קשה.',
      'כשעולה בי תחושה לא נעימה, אני מחפש מהר עיסוק או רעיון שיחזיר לי מצב רוח טוב.',
      'כשהמציאות מכבידה, המחשבות שלי נודדות לתוכניות מרגשות יותר.',
      'אחרי אכזבה, אני ממהר למצוא את ההזדמנות החדשה שבה כדי לא להישאר עם הכאב.',
      'קשה לי לוותר על אפשרויות מעניינות, ולכן אני מתחייב לפעמים ליותר ממה שאוכל להספיק.',
      'קל לי להישאר עם אכזבה או שעמום בלי לחפש במהירות משהו נעים יותר להתמקד בו.'
    ],
    8: [
      'כשמנסים להכתיב לי איך לפעול, אני מרגיש צורך ברור להחזיר לעצמי שליטה.',
      'אני מעדיף לומר אמת לא נוחה ישירות מאשר להרגיש שמנסים לנהל אותי בעקיפין.',
      'כשמישהו מנצל אדם קרוב אליי, אני נכנס לעימות כדי להגן עליו גם במחיר אישי.',
      'קשה לי להראות תלות או פגיעות, כי אני חושש שהדבר ייתן לאחרים כוח עליי.',
      'במצב של חוסר צדק, אני נוטה לתפוס עמדה ולהפעיל כוח כדי לשנות את המצב.',
      'נוח לי שאחרים מחזיקים בשליטה גם בהחלטות שנוגעות לי, בלי צורך לבסס את העצמאות שלי.'
    ],
    9: [
      'אני מוותר לפעמים על דבר שחשוב לי כדי לא להפר את השקט ביני לבין אחרים.',
      'קל לי להבין מה כולם רוצים, אבל קשה לי לזהות מה אני רוצה בעצמי.',
      'אני דוחה שיחה לא נעימה גם כשהדחייה משאירה בעיה לא פתורה.',
      'אני עשוי להסכים כלפי חוץ כדי למנוע מתח, אף שבתוכי יש התנגדות.',
      'כשיש מתח, אני נשאב לפעילות מוכרת ומרגיעה כדי לא לחשוב על מה שמטריד אותי.',
      'אני מבטא רצון שונה משל אחרים בקלות יחסית, גם אם הדבר יוצר מתח בינינו.'
    ]
  };
  const instinctItems = {
    sp: [
      'ביום עמוס, תשומת הלב שלי חוזרת באופן טבעי לשאלה אם אכלתי, נחתי ודאגתי לגוף שלי.',
      'כשאני בוחר מקום לשהות בו, תנאי המחיה והנוחות המעשית תופסים אצלי מקום מרכזי.',
      'אני מקדיש מחשבה קבועה לתקציב, למלאי ולמשאבים שיאפשרו לי להסתדר לאורך זמן.',
      'גם כשהכול רגוע, אני שם לב אם השגרה שלי תומכת בבריאות ובאנרגיה שלי.',
      'בזמן פנוי, אני נמשך לסידור הדברים שיתנו לי בסיס נוח ויציב לימים הבאים.',
      'כשאני נכנס למקום חדש, אני מבחין מהר בתנאים הפיזיים: טמפרטורה, אוכל ומקום לנוח.',
      'ענייני תחזוקה יומיומיים, כמו ארוחות, מנוחה ותקציב, נוטים להישאר מחוץ לתשומת הלב שלי.'
    ],
    so: [
      'בקבוצה חדשה, אני קולט מהר מי קשור למי ומה התפקיד של כל אחד.',
      'חשוב לי להבין כיצד אני משתלב במעגל הרחב יותר, גם כשאיני רוצה להיות במרכז.',
      'אני שם לב לכללים הלא כתובים שקובעים מה מקובל בקבוצה.',
      'התחושה שאני תורם למשהו משותף נותנת לי כיוון ומשמעות.',
      'אני משקיע בשמירה על קשר עם קהילה או מעגל חברתי, גם כשאין צורך מעשי מיידי.',
      'במפגש, תשומת הלב שלי נמשכת לשאלה מי שייך ומי נשאר מחוץ למעגל.',
      'המקום שלי בקבוצות והקשרים ביניהן כמעט שאינם מעסיקים אותי ביומיום.'
    ],
    sx: [
      'אני שם לב במהירות למפגש או לרעיון שמדליקים בי תחושת חיות חזקה.',
      'אני נמשך לחוויות שיש בהן ניצוץ ועוצמה, גם כשאינן מועילות או נוחות במיוחד.',
      'כשנוצר חיבור מסקרן, אני רוצה להעמיק בו ולהקדיש לו תשומת לב מרוכזת.',
      'קשר נעים אך חסר חיות משאיר אותי עם תחושה שחסר בו משהו מרכזי.',
      'אני מזהה במהירות אם יש ביני לבין אדם אחר כימיה שמושכת אותי להיכרות עמוקה יותר.',
      'אני מחפש מפגשים ועיסוקים שיכולים לסחוף אותי ולשנות משהו בי.',
      'תחושת ניצוץ או משיכה עזה כמעט שאינה משפיעה על הבחירה שלי בקשרים ובעיסוקים.'
    ]
  };
  const types = {
    1: {name:'הפרפקציוניסט', aliases:['המחוקק','מתקן העולם'], theme:'לעשות את הדבר הנכון', color:'#a95829', description:'הדפוס הזה מחפש יושרה, דיוק ואחריות. הצורך לפעול כראוי עשוי לעזור לשפר דברים, ולפעמים להפוך לביקורת פנימית שקשה להשקיט.', strength:'יכולת להבחין במה שדורש תיקון ולהשקיע בו בהתמדה.', cost:'המתח בין המצוי לרצוי עלול להשאיר מעט מקום למנוחה ולחמלה.', practice:'לבחור היום משימה אחת ולהחליט מראש מה ייחשב בה טוב מספיק.', reflection:'אם לא הייתי צריך להצדיק את עצמי, מה הייתי מרשה לעצמי עכשיו?'},
    2: {name:'המסייע', aliases:['הנותן','התומך'], theme:'להרגיש אהוב וחשוב', color:'#a34356', description:'הדפוס הזה מחפש קרבה דרך נתינה ותשומת לב לאחרים. לפעמים הצורך להיות נחוץ מקשה לזהות צורך אישי או לבקש משהו במפורש.', strength:'יכולת לזהות מצוקה, להציע עזרה וליצור חום בקשר.', cost:'נתינה ללא בקשה ברורה עלולה להתחלף באכזבה כשלא מקבלים הכרה.', practice:'לבקש היום דבר קטן ישירות, בלי להקדים לו שירות או טובה.', reflection:'מה אני צריך גם אם אף אחד לא צריך ממני דבר?'},
    3: {name:'ההישגי', aliases:['הביצועיסט','המצליחן'], theme:'להרגיש בעל ערך דרך עשייה', color:'#946021', description:'הדפוס הזה מכוון לתוצאות, להתקדמות ולהכרה. הוא יודע להתאים את עצמו למשימה, אך עשוי לקשור את תחושת הערך לאופן שבו ההישגים נראים מבחוץ.', strength:'יכולת להפוך מטרה לעשייה ולהניע תהליך קדימה.', cost:'המרדף אחר התוצאה עלול לדחוק הצידה עייפות, רגשות ורצונות אישיים.', practice:'להקדיש זמן קצר לדבר בעל ערך עבורך שאין לו תוצאה שאפשר להציג.', reflection:'מה הייתי בוחר אילו איש לא היה יודע שהצלחתי?'},
    4: {name:'האינדיבידואליסט', aliases:['הרומנטיקן','הדרמטי'], theme:'לחיות מתוך זהות ומשמעות', color:'#7b4b9c', description:'הדפוס הזה מקשיב לעולם הפנימי ומחפש ביטוי אישי אותנטי. לעיתים תשומת הלב נמשכת למה שחסר, עד שקשה לחוש את מה שכבר נוכח.', strength:'רגישות לגוונים רגשיים ויכולת לתת לחוויה משמעות אישית.', cost:'השוואה לאידיאל או לאחרים עלולה להעמיק תחושת חוסר ושונות.', practice:'לתת שם לרגש הנוכחי, ואז לעשות פעולה קטנה גם בלי לחכות למצב הרוח המתאים.', reflection:'מה בחיים שלי ראוי לתשומת לב גם כשהוא רגיל ופשוט?'},
    5: {name:'החוקר', aliases:['הצופה','המדען'], theme:'להבין ולהיות מסוגל', color:'#3c6195', description:'הדפוס הזה מחפש הבנה, עצמאות ומרחב לעיבוד. כשהדרישות נחוות כמציפות, הוא עשוי להגן על הזמן והאנרגיה באמצעות התרחקות.', strength:'יכולת להעמיק, לזהות מבנים ולחשוב באופן עצמאי.', cost:'ההמתנה למספיק ידע או אנרגיה עלולה לדחות השתתפות והתנסות.', practice:'לשתף רעיון שעדיין אינו מושלם, או להשתתף בצעד קטן לפני שהכול ברור.', reflection:'מה אפשר ללמוד דווקא מתוך מעורבות ולא רק מתוך התבוננות?'},
    6: {name:'הנאמן', aliases:['הספקן'], theme:'למצוא על מה אפשר לסמוך', color:'#287a7c', description:'הדפוס הזה בוחן אמינות, אחריות והיערכות. החיפוש אחר ביטחון עשוי להתבטא בבדיקות ובבקשת תמיכה, ולעיתים דווקא בעימות ישיר עם החשש.', strength:'יכולת לצפות קשיים, לשאול שאלות טובות ולעמוד לצד אחרים.', cost:'בדיקה נוספת ועוד אחת עלולות להרחיק מתחושת הכרעה.', practice:'בהחלטה קטנה, להגדיר מראש כמה מידע מספיק ואז לבחור.', reflection:'איזה חלק מהמצב דורש עוד מידע, ואיזה חלק דורש אמון ביכולת שלי להתמודד?'},
    7: {name:'הנלהב', aliases:['הנהנתן'], theme:'להשאיר מקום לאפשרויות', color:'#907022', description:'הדפוס הזה מחפש חופש, חיות ואפשרויות. הוא עשוי להתרחק מכאב או מתחושת הגבלה באמצעות תוכניות, רעיונות וחוויות חדשות.', strength:'יכולת לראות אפשרויות, לאלתר ולהביא התלהבות.', cost:'המעבר לדבר הבא עלול לבוא על חשבון עומק, השלמה ומפגש עם קושי.', practice:'להישאר עוד כמה דקות במשימה אחת או ברגש לא נעים, בלי לפתוח חלופה חדשה.', reflection:'מה אמצא כאן אם לא אמהר לעבור הלאה?'},
    8: {name:'המאתגר', aliases:['המנהיג','הבוס'], theme:'לשמור על עצמאות והשפעה', color:'#a14739', description:'הדפוס הזה רגיש לשליטה מבחוץ ומחפש יכולת לפעול ולהגן. הוא נוטה לפגוש קושי ישירות, אך עשוי להתקשות לחשוף צורך או פגיעות.', strength:'יכולת לתפוס עמדה, להציב גבול ולהגן על מה שחשוב.', cost:'עוצמה וישירות עלולות להשאיר פחות מקום להקשבה ולסיוע מאחרים.', practice:'לבטא צורך אחד בלי להסתיר אותו מאחורי דרישה, ולהקשיב לפני תגובה.', reflection:'איפה אפשר להישען על מישהו בלי לוותר על העצמאות שלי?'},
    9: {name:'משכין השלום', aliases:['המגשר'], theme:'לשמור על שקט וחיבור', color:'#4c7955', description:'הדפוס הזה מחפש הרמוניה ורואה כמה נקודות מבט. לפעמים הוא שומר על השקט באמצעות דחיית רצונותיו או הימנעות ממתח שדורש פעולה.', strength:'יכולת להקשיב, להכיל מורכבות וליצור מרחב נעים.', cost:'ההסתגלות לסביבה עלולה לטשטש סדרי עדיפויות ורצון אישי.', practice:'לבחור היום העדפה קטנה ולומר אותה בקול לפני שמבררים מה כולם רוצים.', reflection:'מה חשוב לי כאן, גם אם מישהו אחר יעדיף אחרת?'}
  };
  const instincts = {
    sp: {name:'שימור עצמי', code:'SP', description:'תשומת לב לגוף, לאנרגיה, למשאבים ולבסיס המעשי של החיים. זהו תחום קשב, ולא מדד לאנוכיות או לרמת החרדה.', practice:'לשים לב גם לקשר ולמשמעות, לצד הטיפול בבסיס המעשי.'},
    so: {name:'חברתי', code:'SO', description:'תשומת לב לשייכות, לתפקיד בקבוצה ולקשרים בין אנשים. אפשר להיות שקטים ומופנמים ועדיין להיות קשובים מאוד לממד הזה.', practice:'לבדוק מה נכון לך אישית, גם כשברור מה מצופה בקבוצה.'},
    sx: {name:'משיכה ועוצמה', code:'SX', description:'תשומת לב לכימיה, לניצוץ ולחוויות שיוצרות מעורבות עמוקה. זה אינו מדד לחברותיות או ליכולת לקיים קשר זוגי, וקרבה חשובה בכל שלושת האינסטינקטים.', practice:'לתת מקום גם לשגרה ולקשרים שאינם דורשים עוצמה מתמדת.'}
  };
  const wingNotes = {
    '1w9':'השאיפה לתקן עשויה לקבל גוון מתון, סבלני ומגשר, עם רצון לשפר בלי ליצור חיכוך מיותר.',
    '1w2':'השאיפה לתקן עשויה להתבטא במעורבות אישית, בליווי ובעזרה לאנשים מסוימים.',
    '2w1':'הנתינה עשויה לקבל גוון מצפוני ומאופק, עם דגש על אחריות ועל הדרך הראויה לעזור.',
    '2w3':'הנתינה עשויה להשתלב ביוזמה, בהצגת יכולות ובקידום אנשים ומטרות.',
    '3w2':'החתירה להישגים עשויה להיעזר ביצירת קשר, בעידוד אחרים וברצון להיות גם אהוב.',
    '3w4':'החתירה להישגים עשויה לקבל ביטוי אישי ומקורי, עם רצון שהתוצאה תשקף זהות ייחודית.',
    '4w3':'חיפוש הזהות עשוי להשתלב ברצון להוציא את הביטוי האישי לעולם ולקבל עליו הכרה.',
    '4w5':'חיפוש הזהות עשוי לקבל אופי פרטי וחקרני יותר, עם העמקה ברעיונות ובחוויה הפנימית.',
    '5w4':'הצורך להבין עשוי להשתלב בדמיון, ברגישות ובחיפוש אחר משמעות אישית.',
    '5w6':'הצורך להבין עשוי להתמקד בבדיקה שיטתית, באמינות ובפתרון בעיות מעשיות.',
    '6w5':'חיפוש הביטחון עשוי להישען על מחקר עצמאי, על ניתוח ועל שמירת מרחק לצורך בדיקה.',
    '6w7':'חיפוש הביטחון עשוי להשתלב בקלילות, באפשרויות חדשות ובקשר עם אנשים.',
    '7w6':'חיפוש האפשרויות עשוי להשתלב בשיתוף, במחויבות ובתשומת לב למה שיספק תמיכה.',
    '7w8':'חיפוש האפשרויות עשוי לקבל ביטוי ישיר ונחוש יותר, עם דגש על חופש פעולה.',
    '8w7':'העצמאות והישירות עשויות להשתלב בקצב מהיר, ביוזמה ובתיאבון לחוויות חדשות.',
    '8w9':'העצמאות והישירות עשויות לקבל גוון שקט ויציב יותר, עם סבלנות לפני פעולה.',
    '9w8':'השאיפה להרמוניה עשויה להשתלב בעמידה על גבולות ובהגנה על אנשים ועל מרחב אישי.',
    '9w1':'השאיפה להרמוניה עשויה להשתלב במצפוניות, באחריות וברצון לעשות את הדבר הראוי.'
  };
  // Interleave constructs to avoid consecutive blocks that reveal the scoring key.
  const questions = [];
  for (let round = 0; round < 6; round++) {
    for (let step = 0; step < 9; step++) {
      const type = ((step * 4 + round * 2) % 9) + 1;
      questions.push({id:`t${type}-${round+1}`, scale:String(type), reverse:round===5, text:typeItems[type][round]});
      if ([2,5,8].includes(step)) {
        const instinct = ['sp','so','sx'][(Math.floor(step/3)+round)%3];
        questions.push({id:`${instinct}-${round+1}`,scale:instinct,reverse:false,text:instinctItems[instinct][round]});
      }
    }
  }
  ['so','sp','sx'].forEach(key => questions.push({id:`${key}-7`,scale:key,reverse:true,text:instinctItems[key][6]}));
  // Two original motive checks per type, equal weight, appended to preserve old answers.
  const motiveItems = {
    1: [
      'גם כשכולם מרוצים ממני, קשה לי להירגע אם פעלתי בניגוד לעיקרון שלי.',
      'כשאני מתלבט אם להעיר על טעות, תחושת החובה לתקן גוברת אצלי על הרצון להימנע מחיכוך.'
    ],
    2: [
      'כשאדם קרוב מסתדר בלי העזרה שלי, אני חושש לפעמים שהמקום שלי בחייו יקטן.',
      'אני נוטה להיענות לבקשה גם כשאין לי כוח, כדי לשמור על תחושת הקרבה לאדם שמבקש.'
    ],
    3: [
      'כשלא מבחינים בהישגים שלי, אני מרגיש דחף להוכיח מחדש את הערך שלי.',
      'כדי להצליח בסביבה חדשה, אני עשוי להציג גרסה של עצמי שמתאימה לציפיות שלה.'
    ],
    4: [
      'כשלא מבינים רגש שאני משתף, מה שמכאיב לי הוא התחושה שלא רואים מי אני באמת.',
      'קשה לי לבחור בדרך שכולם בוחרים בה אם היא גורמת לי להרגיש שאני מאבד את הייחוד שלי.'
    ],
    5: [
      'כשמצפים ממני למעורבות רבה, אני מצמצם את הנוכחות שלי מחשש שלא יישארו לי כוחות להתמודד.',
      'מול משימה לא מוכרת, אני מחפש קודם הבנה שתאפשר לי להסתדר בלי להיות תלוי באחרים.'
    ],
    6: [
      'גם כשאני מבין את העובדות, קשה לי להתקדם בלי לברר על מי או על מה אפשר לסמוך.',
      'כשמבטיחים לי שהכול יסתדר, אני עדיין מרגיש צורך לבדוק אם יש סיבה להיזהר.'
    ],
    7: [
      'כשאני מרגיש תקוע, עצם התכנון של אפשרות חדשה עוזר לי להתרחק מהתחושה הקשה.',
      'אני מתקשה לבחור מסלול אחד כשהבחירה סוגרת בפניי חוויות אחרות שמושכות אותי.'
    ],
    8: [
      'אני מוכן לשאת אי נעימות ממושכת כדי שלא יכפו עליי החלטה שנוגעת לחיי.',
      'כשאני זקוק לעזרה, קשה לי לחשוף את הצורך כי אני לא רוצה לתת למישהו כוח עליי.'
    ],
    9: [
      'אני נוטה להניח בצד העדפה אישית כדי לשמור על האווירה הטובה עם אנשים שחשובים לי.',
      'כשבעיה עלולה להוביל לעימות, אני מוצא את עצמי דוחה אותה כדי לשמור בינתיים על השקט.'
    ]
  };
  for(let round=0;round<2;round++) for(let step=0;step<9;step++) {
    const type=((step*4+round*2)%9)+1;
    questions.push({id:`t${type}-${round+7}`,scale:String(type),reverse:false,facet:'motive',text:motiveItems[type][round]});
  }
  const scaleKeys = [...Object.keys(types),...Object.keys(instincts)];
  function rank(scores, keys) { return keys.map(key=>({key,score:scores[key]})).sort((a,b)=>b.score-a.score); }
  function getWing(type, scores, primaryClear=true) {
    if (!types[type]) throw new Error('Unknown type');
    const adjacent = [type===1?9:type-1, type===9?1:type+1];
    const ranked = rank(scores, adjacent.map(String));
    const gap = ranked[0].score-ranked[1].score;
    const threshold = Math.max(WING_MIN,(scores[type]||0)*WING_RATIO);
    const eligible = ranked.filter(t=>t.score>=threshold).map(t=>Number(t.key));
    const status = !primaryClear ? 'conditional' : !eligible.length ? 'weak' : gap < WING_GAP ? 'close' : 'suggested';
    return {adjacent,ranked,gap,threshold,eligible,status,dominant:status==='suggested'?Number(ranked[0].key):null};
  }

  function score(answers) {
    if (!Array.isArray(answers) || answers.length!==questions.length || Array.from(answers).some(v=>!Number.isInteger(v)||v<1||v>5)) {
      throw new Error(`Expected ${questions.length} integer answers between 1 and 5`);
    }
    const totals=Object.fromEntries(scaleKeys.map(k=>[k,0]));
    const counts={...totals},motiveTotals=Object.fromEntries(Object.keys(types).map(k=>[k,0]));
    questions.forEach((q,i)=>{const value=q.reverse?6-answers[i]:answers[i];totals[q.scale]+=value;counts[q.scale]++;if(q.facet==='motive')motiveTotals[q.scale]+=value;});
    const scores=Object.fromEntries(scaleKeys.map(k=>[k,(totals[k]/counts[k]-1)*25]));
    const typeRanking=rank(scores,Object.keys(types));
    const instinctRanking=rank(scores,Object.keys(instincts));
    const gap=typeRanking[0].score-typeRanking[1].score;
    const uniform=answers.every(v=>v===answers[0]);
    const motiveScores=Object.fromEntries(Object.keys(types).map(k=>[k,(motiveTotals[k]/2-1)*25]));
    const leader=typeRanking[0].key;
    const conflicting=Object.keys(types).filter(k=>k!==leader&&motiveScores[k]>=CORE_MIN&&motiveScores[k]-motiveScores[leader]>=MOTIVE_CONFLICT_GAP);
    // Sensitivity check, not a confidence interval: omit each type item in turn.
    const unstableCandidates=new Set();
    for(const [i,q] of questions.entries()) {
      if(!types[q.scale])continue;
      const value=q.reverse?6-answers[i]:answers[i];
      const omittedScore=((totals[q.scale]-value)/(counts[q.scale]-1)-1)*25;
      const changed={...scores,[q.scale]:omittedScore};
      for(const key of Object.keys(types)) if(key!==leader&&changed[key]>=changed[leader]-1e-9)unstableCandidates.add(Number(key));
    }
    const stable=unstableCandidates.size===0;
    const primaryStatus=uniform?'undifferentiated':typeRanking[0].score<50?'weak':
      gap<TYPE_GAP?'close':motiveScores[leader]<CORE_MIN||conflicting.length?'mixed':!stable?'unstable':'suggested';
    const primary=primaryStatus==='suggested'?Number(leader):null;
    const candidates=[...new Set([...typeRanking.filter(t=>typeRanking[0].score-t.score<TYPE_GAP).map(t=>Number(t.key)),
      ...(!primary?conflicting.map(Number):[]),...(!primary?[...unstableCandidates]:[])])];
    const instinctGap=instinctRanking[0].score-instinctRanking[1].score;
    const instinctStatus=uniform?'undifferentiated':instinctRanking[0].score<50?'weak':instinctGap<INSTINCT_GAP?'close':'suggested';
    const dominantInstinct=instinctStatus==='suggested'?instinctRanking[0].key:null;
    const stackClear=!!dominantInstinct && instinctRanking[1].score-instinctRanking[2].score>=INSTINCT_GAP;
    return {version:VERSION,scores,motiveScores,stable,typeRanking,instinctRanking,gap,primaryStatus,primary,candidates,
      wing:primary?getWing(primary,scores):null,instinctStatus,dominantInstinct,stackClear,uniform};
  }
  function validState(value) {
    if (!value || value.version!==VERSION || !Array.isArray(value.answers) || value.answers.length!==questions.length) return false;
    if (Array.from(value.answers).some(v=>v!==null&&(!Number.isInteger(v)||v<1||v>5))) return false;
    if (!Number.isInteger(value.index)||value.index<0||value.index>=questions.length) return false;
    if (!['quiz','results'].includes(value.screen)||typeof value.updatedAt!=='string'||!Number.isFinite(Date.parse(value.updatedAt))) return false;
    return value.screen!=='results'||value.answers.every(v=>v!==null);
  }
  function migrateState(value) {
    if(validState(value))return value;
    if(!value||value.version!=='2.0.0'||!Array.isArray(value.answers)||value.answers.length!==75)return null;
    const migrated={...value,version:VERSION,answers:[...value.answers,...Array(18).fill(null)],screen:'quiz'};
    if(!['quiz','results'].includes(value.screen)||!Number.isInteger(value.index)||value.index<0||value.index>=75)return null;
    if(value.screen==='results'&&value.answers.some(v=>v===null))return null;
    migrated.index=value.screen==='results'?75:value.index;
    return validState(migrated)?migrated:null;
  }
  const api={VERSION,CORE_MIN,MOTIVE_CONFLICT_GAP,WING_MIN,WING_RATIO,TYPE_GAP,WING_GAP,INSTINCT_GAP,questions,types,instincts,wingNotes,score,getWing,validState,migrateState};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  else root.Enneagram=api;
})(typeof globalThis!=='undefined'?globalThis:this);
