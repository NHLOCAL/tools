# README פנימי: מחולל פודקאסטים ומודל ה-TTS החדש

מסמך זה מתאר את שילוב מודל יצירת השמע בכלי `tools/podcast_generator.html`.
המידע מבוסס על התיעוד הרשמי של Google AI Studio/Gemini API, כפי שהיה זמין ב-15 באפריל 2026.

## מקורות רשמיים

- תיעוד Speech Generation: https://ai.google.dev/gemini-api/docs/speech-generation
- דף המודל: https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-tts-preview
- Release notes: https://ai.google.dev/gemini-api/docs/changelog
- דף תמחור Gemini API: https://ai.google.dev/gemini-api/docs/pricing

## המודל המשולב בכלי

שם המודל לשלב יצירת השמע:

```text
gemini-3.1-flash-tts-preview
```

הכלי עדיין יכול להשתמש במודלים אחרים לשלב יצירת התסריט, אבל שלב יצירת קובץ השמע משתמש במודל ה-TTS החדש. לכן חשוב להפריד בין:

- מודל תסריט: אחראי לכתיבת הדיאלוג.
- מודל TTS: אחראי להפיכת הדיאלוג לקובץ שמע.

מודלי התסריט שמופיעים בממשק:

- `gemini-3-flash-preview`
- `gemini-3.1-pro-preview`

אין להשתמש במודל TTS ליצירת התסריט, ואין להשתמש במודל תסריט ליצירת שמע.

## יכולות מרכזיות

המודל הוא מודל Text-to-Speech מבוסס Gemini. בניגוד למנועי TTS פשוטים שמקבלים טקסט וקול בלבד, כאן אפשר לתת הנחיות טבעיות לגבי אופן הביצוע.

יכולות רלוונטיות לכלי:

- יצירת שמע ישירות מתוכן טקסטואלי דרך `generateContent`.
- תמיכה בעברית ובשפות נוספות. התיעוד מציין תמיכה ב-24 שפות.
- שליטה בסגנון הדיבור דרך פרומפט: קצב, רגש, טון, אופי הדמות ודינמיקה בין דוברים.
- שימוש בתגיות קול באנגלית בתוך סוגריים מרובעים, למשל `[laughs]`, `[sighs]`, `[whispers]`, `[curious]`.
- יצירת שמע לדובר יחיד או דיאלוג דו-דוברי באמצעות `multiSpeakerVoiceConfig`.
- בחירת קולות מוכנים מראש מתוך רשימת קולות של Gemini TTS.
- החזרת אודיו כ-PCM גולמי 16-bit בקצב דגימה של 24kHz, שאותו הכלי אורז מקומית לקובץ WAV.

## מגבלות שחשוב לזכור

- המודל מוגדר כ-Preview, ולכן התנהגות, מחיר, זמינות ושם מודל עשויים להשתנות.
- לפי ה-Release notes, המודל הושק ב-15 באפריל 2026, ודף המודל עודכן באותו יום.
- המודל מקבל טקסט בלבד ומחזיר אודיו בלבד.
- אין תמיכה ב-streaming דרך מודל ה-TTS הזה.
- מדריך ה-TTS מציין חלון הקשר של 32k tokens לסשן TTS, ובדף המודל הספציפי מצוינים גבולות של 8,192 טוקני קלט ו-16,384 טוקני פלט.
- תיעוד Google מציין שייתכנו מדי פעם שגיאות 500 כאשר מייצרים אודיו, ולכן הכלי כולל כיום retry קצר.
- המודל מחזיר PCM ולא WAV מלא. הכלי מוסיף כותרת WAV בצד הלקוח, עם `sampleRate` של 24000 ו-`bitsPerSample` של 16.
- תצורת הדוברים תלויה בהתאמה מדויקת בין שמות הדוברים בתסריט לבין שמות הדוברים ב-`speechConfig`.
- אין להחליף את מזהי הדוברים בתסריט לשמות חופשיים כמו "דני" או "רונית", אלא אם מעדכנים גם את `speechConfig`.
- תגיות קול צריכות להיות באנגלית ובסוגריים מרובעים. יש להשתמש בהן במשורה, אחרת הן עלולות לפגוע בטבעיות הקריינות.
- תיתכן חוסר עקביות בין הוראות הפרומפט לבין הקול שנבחר, בעיקר כשהפרומפט אינו מתאים טבעית לפרופיל הקול.
- לצורך דיאלוג רב-דוברי, עדיף לספק למודל preamble ברור שמבדיל בין הוראות בימוי לבין התמלול עצמו, כדי שלא יקריא בטעות את הוראות הבימוי.

## תמחור

לפי דף התמחור הרשמי, מודל ה-TTS המשולב בכלי מתומחר לפי טוקנים:

- קלט טקסט: 0.50 דולר למיליון טוקנים.
- פלט אודיו: 10 דולר למיליון טוקנים.

המשמעות המעשית לכלי היא שעלות יצירת התסריט ועלות יצירת השמע הן שני שלבים נפרדים. שינוי אורך הפודקאסט משפיע במיוחד על עלות פלט האודיו.

## מבנה הקריאה ל-API

נקודת הקצה:

```text
https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent
```

מבנה גוף בסיסי:

```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "Synthesize natural Hebrew podcast audio..."
        }
      ]
    }
  ],
  "generationConfig": {
    "responseModalities": ["AUDIO"],
    "speechConfig": {
      "multiSpeakerVoiceConfig": {
        "speakerVoiceConfigs": [
          {
            "speaker": "man",
            "voiceConfig": {
              "prebuiltVoiceConfig": {
                "voiceName": "Sadaltager"
              }
            }
          },
          {
            "speaker": "girl",
            "voiceConfig": {
              "prebuiltVoiceConfig": {
                "voiceName": "Kore"
              }
            }
          }
        ]
      }
    }
  }
}
```

## מבנה הפרומפט שהכלי שולח ל-TTS

המדריך הרשמי לא מגדיר "פורמט חובה" של API עבור הטקסט. הוא מציע תבנית פרומפט סגנונית: לכתוב למודל כמו לבמאי שמכוון שחקני קול. לכן הכלי מבקש ממודל יצירת התסריט להפיק בלוק בימוי מסודר, ואז שולח אותו למודל השמע עם preamble שמבהיר שרק חלק ה-`TRANSCRIPT` אמור להיקרא בקול.

מבנה התסריט שהכלי מבקש כעת:

```text
### AUDIO PROFILE
- man: analytical, provocative, warm but sharp.
- girl: quick, incisive, amused, pragmatic.

### SCENE
A quiet podcast studio after midnight; the energy is focused, intimate, and slightly mischievous.

### DIRECTOR'S NOTES
- Style: conversational, witty, intelligent.
- Accent: natural modern Hebrew.
- Pacing: lively but clear, with short pauses after sharp points.
- Audio tags: use English bracket tags sparingly, only for audible delivery.

### SAMPLE CONTEXT
The speakers are unpacking a deceptively simple idea and enjoying the argument.

### TRANSCRIPT
man: ברוכים הבאים. היום נדבר על רעיון שנשמע פשוט מדי.
girl: [laughs] זה בדרך כלל הסימן הראשון שהוא לא פשוט בכלל.
```

המשמעות של כל חלק:

- `AUDIO PROFILE`: מי הדוברים, מה הזהות הקולית שלהם, ומה הניגוד ביניהם.
- `SCENE`: איפה השיחה מתרחשת ומה האווירה.
- `DIRECTOR'S NOTES`: איך לבצע: style, accent, pacing, articulation, breath, intensity, vocal smile ודינמיקה.
- `SAMPLE CONTEXT`: הקשר רגשי/אינטלקטואלי קצר שעוזר למודל להיכנס לסצנה.
- `TRANSCRIPT`: הטקסט המדויק להקראה.
- `Audio Tags`: תגיות בתוך הטקסט שמשנות את אופן האמירה של משפט או מילה.

לפני השליחה ל-API, הכלי עוטף תסריט מובנה בפרומפט ברור יותר:

```text
Synthesize natural Hebrew podcast audio from this structured performance prompt.
Use AUDIO PROFILE, SCENE, DIRECTOR'S NOTES, SAMPLE CONTEXT, and AUDIO TAGS only as acting guidance.
Only vocalize the dialogue lines under ### TRANSCRIPT.
Use the configured speaker voices exactly as mapped by speaker labels.
The speaker labels are routing markers, not spoken words.
Do not summarize, translate, or add content.

### AUDIO PROFILE
...
```

הסיבה לעטיפה הזו: המודל צריך להבין מהו תמלול להקראה ומהן הוראות ביצוע. הפרדה מפורשת מפחיתה סיכוי שהוראות יוקראו בקול או שתוויות הדוברים יישמעו כחלק מהאודיו.

## תצורות דוברים בכלי

הכלי כולל שלוש תצורות:

- גבר ואישה:
  - `man` בקול `Sadaltager`
  - `girl` בקול `Kore`
- שני גברים:
  - `speaker1` בקול `Sadaltager`
  - `speaker2` בקול `Pulcherrima`
- שתי נשים:
  - `speaker1` בקול `Kore`
  - `speaker2` בקול `Aoede`

אם מוסיפים תצורות חדשות, יש לעדכן יחד:

- את `getSpeakersInfo`.
- את הטקסטים בדוגמאות.
- את `speechConfig` בתוך `generateAudio`.
- את הנחיות העזרה למשתמש, אם שמות הדוברים משתנים.

## קולות זמינים לפי התיעוד

התיעוד הרשמי מציג רשימת קולות מוכנים מראש. שמות שנמצאים בשימוש בכלי: `Sadaltager`, `Pulcherrima`, `Kore`, `Aoede`.

רשימת הקולות המלאה שמופיעה בתיעוד: `Zephyr`, `Puck`, `Charon`, `Kore`, `Fenrir`, `Leda`, `Orus`, `Aoede`, `Callirrhoe`, `Autonoe`, `Enceladus`, `Iapetus`, `Umbriel`, `Algieba`, `Despina`, `Erinome`, `Algenib`, `Rasalgethi`, `Laomedeia`, `Achernar`, `Alnilam`, `Schedar`, `Gacrux`, `Pulcherrima`, `Achird`, `Zubenelgenubi`, `Vindemiatrix`, `Sadachbia`, `Sadaltager`, `Sulafat`.

לפני החלפת קול בכלי, מומלץ לבדוק ידנית שהקול מתאים לעברית ולסגנון הפודקאסט. שמות הקולות אינם מבטיחים מגדר או אופי מסוים, ולכן עדיף לבחון בפועל.

## כללי כתיבת תסריט מומלצים

- להשתמש במבנה `AUDIO PROFILE`, `SCENE`, `DIRECTOR'S NOTES`, `SAMPLE CONTEXT`, `TRANSCRIPT`.
- לזכור שזה פורמט פרומפט מומלץ, לא פורמט API מחייב.
- ב-`DIRECTOR'S NOTES` להתמקד במה שמשפיע באמת על הביצוע: סגנון, מבטא, קצב, נשימה, ארטיקולציה, עוצמה ודינמיקה.
- לא להעמיס יותר מדי חוקים נוקשים. יותר מדי הוראות עלולות לפגוע בטבעיות.
- גוף התסריט ב-`TRANSCRIPT` צריך להיות בעברית ללא ניקוד.
- כל שורת דיאלוג מתחילה בשם הדובר המדויק באנגלית ואחריו נקודתיים.
- תגיות קול באנגלית בלבד, בסוגריים מרובעים, ובשימוש נקודתי.
- אין רשימה סגורה של תגיות שעובדות. כדאי להתנסות, אבל להתחיל מתגיות נפוצות כמו `[excited]`, `[whispers]`, `[laughs]`, `[sarcastic]`, `[serious]`, `[shouting]`, `[sighs]`, `[curious]`.
- לא להשתמש בתגיות המתארות מחוות חזותיות, כמו `[smiles]` או `[raises eyebrow]`, כי הן אינן פעולה קולית.
- להעדיף משפטים טבעיים וקצרים יחסית. פסקאות ארוכות מדי נשמעות פחות דיאלוגיות.

## בדיקות ידניות אחרי שינוי במודל או בקולות

1. ליצור תסריט קצר של דקה אחת.
2. לבדוק שיצירת התסריט מחזירה את מקטעי `AUDIO PROFILE`, `SCENE`, `DIRECTOR'S NOTES`, `SAMPLE CONTEXT`, `TRANSCRIPT`.
3. לבדוק שיצירת השמע מצליחה עם כל אחת משלוש תצורות הדוברים.
4. להאזין שהקולות מתחלפים לפי הדובר הנכון.
5. לבדוק שתגית כמו `[laughs]` אינה מוקראת כמילה.
6. לבדוק שהכותרות והוראות הבימוי אינן מוקראות בקול.
7. לבדוק הורדה של קובץ WAV.

## נקודות תחזוקה עתידיות

- אם Google מחליפה את שם המודל מ-Preview לשם יציב, לעדכן את `TTS_MODEL`.
- אם מתפרסם מחיר חדש, לעדכן את סעיף התמחור במסמך זה.
- אם התיעוד מוסיף תמיכה ביותר משני דוברים, אפשר לשקול הרחבת UI ותצורת `speechConfig`.
- אם ה-API מתחיל להחזיר WAV מלא במקום PCM, להסיר או להתאים את `createWavBlob`.
