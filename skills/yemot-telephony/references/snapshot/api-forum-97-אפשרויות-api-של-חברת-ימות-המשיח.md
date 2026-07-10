# אפשרויות API של חברת ימות המשיח

Source kind: `api-forum`
Topic ID: `97`
Topic source: https://apiforum.yemot.tel/topic/97

## Post 0 — נועם חיון — topic author

Post ID: `447`
Published: `2025-08-25T15:14:30.508Z`
Updated: `2025-08-25T20:14:00.640Z`
Source: https://apiforum.yemot.tel/post/447

## [](https://apiforum.yemot.tel)מדריך למפתחים: תחילת עבודה עם ה-API

ברוכים הבאים למדריך ה-API של “ימות המשיח”!

|ה-API (ממשק תכנות יישומים) הוא הדרך שלכם, המפתחים, לתקשר עם מערכות הטלפוניה שלנו ולנהל אותן באופן אוטומטי, ישירות מהקוד שלכם, ללא צורך בכניסה לאתר הניהול. דמיינו שאתם מקבלים שלט רחוק משוכלל שמאפשר לכם להפעיל קמפיינים, לנהל שלוחות, לעדכן קבצים ועוד – הכל באמצעות פקודות פשוטות.

## [](https://apiforum.yemot.tel)איך זה עובד? בקשה ותשובה

התקשורת עם המערכת היא פשוטה מאוד ומבוססת על מודל של “שאלה-תשובה”. כל פעולה שתבצעו מורכבת משני שלבים:

שליחת בקשה:
אתם “מבקשים” מהשרת לבצע פעולה מסוימת (למשל, “תביא לי את רשימת השיחות הנכנסות”).

קבלת תשובה:
השרת עונה לכם עם התוצאה של הבקשה (הצלחה, כישלון, או המידע שביקשתם).

בואו נפרט על כל שלב.

## [](https://apiforum.yemot.tel)שלב 1: שליחת בקשה לשרת

כל הבקשות נשלחות לכתובת בסיסית אחת. בהמשך המדריך, נשתמש בכינוי `${url}` כדי לייצג את הכתובת הזו.
כתובת ה-URL הראשית למשלוח בקשות היא:

```
https://www.call2all.co.il/ym/api

```

מבנה הבקשה
כל בקשה מורכבת משני חלקים עיקריים:

פקודה (Command): מה הפעולה שאתם רוצים לבצע?
פרמטרים (Parameters): איזה מידע אתם צריכים לספק כדי שהפעולה תצליח?

לדוגמה, כדי להוריד קובץ מהשרת, נשתמש בפקודה DownloadFile. הפקודה הזו דורשת שני פרמטרים:

token: מפתח הזיהוי הייחודי שלכם (מורכב ממספר המערכת והסיסמה). לדוגמה: 0773137770:123456
path: הנתיב המדויק של הקובץ שאתם רוצים להוריד. לדוגמה: /1/1/000.wav

הבקשה המלאה תיראה כך (בשיטת GET):

```
${url}DownloadFile?token=${token}&path=${path}

```

והנה דוגמה עם נתונים אמיתיים:

```
https://www.call2all.co.il/ym/api/DownloadFile?token=<REDACTED>&path=ivr2:/1/1/000.wav

```

שיטות שליחה (GET / POST)
ניתן לשלוח את כל הבקשות (פרט להעלאת קבצים) בשיטת GET (כמו בדוגמה למעלה) או בשיטת POST.

בבקשות POST, אפשר לשלוח את הפרמטרים בפורמט JSON בתוך ה-body של הבקשה. אם אתם עושים זאת, חשוב להוסיף את הפרמטר Content-Type=application/json לבקשה

## [](https://apiforum.yemot.tel)שלב 2: קבלת תשובה מהשרת

לאחר ששלחתם בקשה, השרת יחזיר לכם תשובה בפורמט JSON (פרט לבקשות להורדת קבצים). התשובה תמיד תכלול את המידע הבא, כדי שתדעו מה קרה:

yemotAPIVersion: גרסת ה-API הנוכחית.

responseStatus: הסטטוס של הבקשה שלכם. זהו השדה החשוב ביותר, והוא יכול להכיל אחד מהערכים הבאים:

-

OK: הבקשה הושלמה בהצלחה!

-

ERROR: אירעה שגיאה בביצוע הפעולה (למשל, סיסמה שגויה).

-

FORBIDDEN: אין לכם הרשאה לבצע את הפעולה הזו.

-

EXCEPTION: אירעה שגיאה חריגה ולא צפויה בשרת.

message: הסבר מילולי על מה שקרה (למשל, “הפעולה בוצעה בהצלחה” או “הסיסמה שגויה”).

messageCode: קוד מספרי ייחודי לכל סוג של הודעה או שגיאה.

דוגמה לתשובת שגיאה מהשרת:

JSON

```
{
"yemotAPIVersion": "1",
"responseStatus": "ERROR",
"message": "Username or password is incorrect",
"messageCode": 1
}

```

בדוגמה זו, אנחנו רואים שהפעולה נכשלה ERROR עם הסבר שהסיסמה שגויה, וקוד השגיאה הוא 1.

## [](https://apiforum.yemot.tel)מה האפשרויות? סקירת הפונקציות

באמצעות ה-API ניתן לבצע כמעט כל פעולה שקיימת באתר הניהול. כדי להקל על ההתמצאות, חילקנו את כל הפונקציות לשלושה נושאים עיקריים:

במדריך זה נחלק את האפשרויות ל3 חלקים.
חלק 1 התחברות למערכת והגדרות כלליות - שינוי סיסמה העברת יחידות עדכון פרטי משתמש ועוד
חלק 2 ניהול קמפיינים - הגדרת קמפיינים, הפעלת קמפיין עדכון מספרים ועוד.
חלק 3 מערכת תוכן - ניהול הקבצים והשלוחות במערכת.

חלק 1 התחברות למערכת והגדרות כלליות

|   | פעולה (API)  | הסבר
| 1  | [Login](https://apiforum.yemot.tel/)  | התחברות למערכת
| 2  | [Logout](https://apiforum.yemot.tel/)  | התנתקות מהמערכת
| 3  | [GetSession](https://apiforum.yemot.tel/)  | פרטי המערכת
| 4  | [SetPassword](https://apiforum.yemot.tel/)  | שינוי סיסמת ניהול
| 5  | [SetCustomerDetails](https://apiforum.yemot.tel/)  | עדכון פרטי משתמש
| 6  | [GetTransactions](https://apiforum.yemot.tel/)  | קבלת רשימת חיובי יחידות
| 7  | [TransferUnits](https://apiforum.yemot.tel/)  | העברת יחידות
| 8  | [GetIncomingCalls](https://apiforum.yemot.tel/)  | קבלת רשימת שיחות נכנסות
| 9  | [UploadFile](https://apiforum.yemot.tel/)  | העלאת קובץ
| 10  | [DownloadFile](https://apiforum.yemot.tel/)  | הורדת קובץ

חלק 2 ניהול קמפיינים

|   | פעולה (API)  | הסבר
| 1  | [GetTemplates](https://apiforum.yemot.tel/)  | קבלת מצב כל תבניות הקמפיינים
| 2  | [UpdateTemplate](https://apiforum.yemot.tel/)  | עדכון תבנית קמפיין
| 3  |   | העלאת והורדת קבצי שמע לקמפיין
| 4  |   | ניהול קבצי שמע בקמפיין (העתקה, העברה או מחיקה)
| 5  | [CreateTemplate](https://apiforum.yemot.tel/)  | יצירת תבנית קמפיין חדשה
| 6  | [DeleteTemplate](https://apiforum.yemot.tel/)  | מחיקת תבנית קמפיין
| 7  | [GetTemplateEntries](https://apiforum.yemot.tel/)  | הצגת המספרים שברשימת התפוצה
| 8  | [UpdateTemplateEntry](https://apiforum.yemot.tel/)  | עדכון מספר בודד ברשימת תפוצה
| 9  | [UpdateTemplateEntries](https://apiforum.yemot.tel/)  | עדכון סטטוס/מחיקה של מספרים ברשימת התפוצה
| 10  | [ClearTemplateEntries](https://apiforum.yemot.tel/)  | מחיקת כל המספרים מרשימת התפוצה
| 11  | [UploadPhoneList](https://apiforum.yemot.tel/)  | העלאת קובץ טקסט והפיכתו לרשימת טלפונים לתבנית קמפיין
| 12  | [RunCampaign](https://apiforum.yemot.tel/)  | הפעלת קמפיין
| 13  | [GetCampaignStatus](https://apiforum.yemot.tel/)  | מצב הקמפיין
| 14  | [DownloadCampaignReport](https://apiforum.yemot.tel/)  | הורדת דו"ח קמפיין
| 15  | [GetActiveCampaigns](https://apiforum.yemot.tel/)  | קבלת קמפיינים פעילים
| 16  | [CampaignAction](https://apiforum.yemot.tel/)  | ביצוע פעולות בקמפיינים פעילים
| 17  | [ScheduleCampaign](https://apiforum.yemot.tel/)  | יצירת קמפיין מתוזמן
| 18  | [GetScheduledCampaigns](https://apiforum.yemot.tel/)  | קבלת קמפיינים מתוזמנים
| 19  | [DeleteScheduledCampaign](https://apiforum.yemot.tel/)  | מחיקת קמפיין מתוזמן

חלק 3 מערכת תוכן

|   | פעולה (API)  | הסבר
| 1  | [GetIVR2Dir](https://apiforum.yemot.tel/)  | קבלת מידע מלא על השלוחה
| 2  | [GetIVR2DirStats](https://apiforum.yemot.tel/)  | קבלת מידע כללי על שלוחה
| 3  | [GetFile](https://apiforum.yemot.tel/)  | קבלת מידע על קובץ בודד
| 4  | [FileAction](https://apiforum.yemot.tel/)  | ניהול קבצים (שינוי שם, העתקה, העברה ומחיקה)
| 5  | [UploadFile](https://apiforum.yemot.tel/)  | העלאת קבצים (ראה UploadFile)
| 6  | [DownloadFile](https://apiforum.yemot.tel/)  | הורדת קבצים (ראה DownloadFile)
| 7  | [GetTextFile](https://apiforum.yemot.tel/)  | קבלת תוכן קובץ טקסט
| 8  | [UploadTextFile](https://apiforum.yemot.tel/)  | העלאת טקסט לקובץ
| 9  | [UpdateExtension](https://apiforum.yemot.tel/)  | עדכון סוג שלוחה
| 10  | [CallAction](https://apiforum.yemot.tel/)  | הכוונת שיחה — העברת מאזין/ניתוק
| 11  | [CallAction](https://apiforum.yemot.tel/)  | ניהול חדרי ועידה
| 12  |   | שינוי השפה בערוץ
| 13  | [GetIncomingSum](https://apiforum.yemot.tel/)  | קבלת סיכום דקות נכנסות לפי טווח תאריכים
| 14  | [GetSmsOutLog](https://apiforum.yemot.tel/)  | קבלת לוג סמסים יוצאים
| 15  |   | פעולות אבטחה במערכת: צפייה בלוג התחברויות, ניתוק סשנים
| 16  | [ValidationToken](https://apiforum.yemot.tel/)  | אבטחה — אימות טוקן
| 17  | [DoubleAuth](https://apiforum.yemot.tel/)  | אבטחה — אימות דו־שלבי
| 18  | [GetLoginLog](https://apiforum.yemot.tel/)  | אבטחה — צפייה בלוג התחברויות
| 19  | [GetAllSessions](https://apiforum.yemot.tel/)  | אבטחה — קבלת כל הסשנים
| 20  | [KillSession](https://apiforum.yemot.tel/)  | אבטחה — ניתוק סשן מסוים
| 21  | [KillAllSessions](https://apiforum.yemot.tel/)  | אבטחה — ניתוק כל הסשנים
| 22  | [RunTzintuk](https://apiforum.yemot.tel/)  | הפעלת צינתוק
| 23  | [CheckIfFileExists](https://apiforum.yemot.tel/)  | בדיקה האם קובץ קיים
| 24  | [SendSms](https://apiforum.yemot.tel/)  | שליחת SMS מהמערכת
| 25  | [CreateBridgeCall](https://apiforum.yemot.tel/)  | הקמת שיחת גישור
| 26  | [GetQueueRealTime](https://apiforum.yemot.tel/)  | מידע בזמן אמת על שלוחת תור
| 27  | [GetCustomerData](https://apiforum.yemot.tel/)  | קבלת מידע על המערכת
| 28  | [SendFax](https://apiforum.yemot.tel/)  | שליחת פקס
| 29  | [ViewCampaignReports](https://apiforum.yemot.tel/)  | קבלת דוח קמפיין
| 30  |   | מערכת תזמון משימות
| 31  | [GetTasks](https://apiforum.yemot.tel/)  | מערכת תזמון משימות — קבלת משימות
| 32  | [GetTasksData](https://apiforum.yemot.tel/)  | מערכת תזמון משימות — נתוני משימות
| 33  | [CreateTask](https://apiforum.yemot.tel/)  | מערכת תזמון משימות — יצירת משימה
| 34  | [UpdateTask](https://apiforum.yemot.tel/)  | מערכת תזמון משימות — עדכון משימה
| 35  | [DeleteTask](https://apiforum.yemot.tel/)  | מערכת תזמון משימות — מחיקת משימה
| 36  | [ValidationCallerId](https://apiforum.yemot.tel/)  | הוספה ואימות של זיהוי ספיישל
| 37  |   | שליחת קמפיין הודעת TTS
| 38  | [RenderYMGRFile](https://apiforum.yemot.tel/)  | הפקת דוח מקובץ ymgr (דו"חות)
| 39  |   | פירוט תנועות ביחידות סמסים
| 40  |   | שינוי שימוש (usage) של מספר משנה
| 41  |   | בדיקה האם תיקייה קיימת
| 42  |   | חשבונות ומערכת SIP
| 43  |   | ניהול תור אונליין
| 44  | [TzintukimListManagement](https://apiforum.yemot.tel/)  | ניהול רשימות צינתוקים (מודול צינתוקים חינמיים)
| 45  |   | ניהול פרסומפון
| 46  |   | הפעלת קמפיין הנכנס לשלוחה במערכת
| 47  |   | קבלת רישומים לחשבון SIP
| 48  |   | קבלת כל חשבונות ה־SIP במערכת והאם רשומים בשרת
| 49  |   | קבלת זיהויים מאושרים במערכת להוצאת שיחות/סמסים
| 50  |   | בדיקת זיהוי האם מאושר לשימוש בשיחה/סמס
| 51  |   | קבלת SMS שהתקבלו במערכת

## Post 1 — נועם חיון — topic author

Post ID: `484`
Published: `2025-09-14T08:31:26.864Z`
Updated: `2025-09-14T08:31:26.864Z`
Source: https://apiforum.yemot.tel/post/484

### [](https://apiforum.yemot.tel)קבלת מצב קמפיין

מאפשר לבדוק את הסטטוס הנוכחי של קמפיין כפי שהתקבל בקריאת RunCampaign

הפקודה היא: GetCampaignStatus

### [](https://apiforum.yemot.tel)פרמטרים בבקשה

| פרמטר  | חובה/אופציונלי  | תיאור
| token  | חובה  | טוקן
| campaignId  | חובה  | מזהה הקמפיין, כפי שהתקבל בקריאת RunCampaign
| entries  | אופציונלי  | הצגת רשומות בקמפיין (מספרי טלפון). ראו להלן “הצגת רשומות בקמפיין”. ברירת מחדל – לא מציג רשומות אלא רק מצב כללי.
| range  | אופציונלי  | טווח ערכים להצגה (מינימום/מקסימום). ראו להלן “הגדרת טווח להצגה”.

### [](https://apiforum.yemot.tel)הצגת רשומות בקמפיין

סוגי הערכים האפשריים בפרמטר `entries`:

| ערך  | הסבר
| all  | הכל
| pending  | בהמתנה לחיוג
| blocked  | חסומים
| done  | בוצע
| accepted  | אישרו מסירה
| failed  | נכשלו
| no_answer  | אין מענה
| busy  | תפוס
| amd  | מענה תא קולי
| ringing  | בחיוג
| up  | בשיחה
| bridged  | מנותבים
| remove_request  | בקשה להסרה
| redial  | ממתינים לחיוג חוזר
| canceled  | בוטל
| error  | שגיאה כללית

### [](https://apiforum.yemot.tel)הגדרת טווח להצגה

בפרמטר `range` יש להגדיר את טווח הרשומות להצגה.
הפורמט הוא:

פרמטרים בתשובה במצב הצלחה
מבנה התגובה:

```
{
"responseStatus": "OK",
"campaign": {
"campaignId": "0772222770-1117319-2025-01-22-10-07-54-414-API",
"campaignStatus": "RUNNING",
"templateId": 1117319,
"who": "0.0.0.0",
"callerId": "0772222770",
"blockedEntries": 0,
"pendingEntries": 0,
"activeEntries": 1,
"bridgedEntries": 0,
"redialEntries": 0,
"doneEntries": 0,
"failedEntries": 0,
"totalEntries": 1,
"totalDialed": 3,
"totalSuccessful": 1,
"totalBridged": 0,
"totalFailed": 2,
"totalIncoming": 0,
"totalIncomingBridged": 0,
"maxActiveChannels": 100,
"maxBridgedChannels": 0,
"maxDialAttempts": 3,
"redialWait": 10.0,
"redialPolicy": "FAILED",
"vmDetect": false,
"filterEnabled": false,
"playPrivateMsg": false,
"runTime": 150.306,
"currentPrice": 1.0,
"paused": false,
"entries": [
{
"phone": "0773137770",
"name": null,
"moreinfo": "זוהי הודעת בדיקה",
"entryStatus": "up",
"duration": 3680,
"bridgedDuration": null,
"bridged": false,
"startTime": "2025-01-22 10:10:14",
"currentPrice": 1.0,
"redials": [
{
"entryStatus": "no_answer",
"duration": null,
"bridgedDuration": null,
"bridged": false,
"startTime": "2025-01-22 10:07:54"
},
{
"entryStatus": "no_answer",
"duration": null,
"bridgedDuration": null,
"bridged": false,
"startTime": "2025-01-22 10:09:04"
}
]
}
]
},
"yemotAPIVersion": 6
}

```

## Post 2 — נועם חיון — topic author

Post ID: `483`
Published: `2025-08-25T20:46:43.279Z`
Updated: `2025-08-25T20:46:43.279Z`
Source: https://apiforum.yemot.tel/post/483

המשך יבוא…

## Post 3 — נועם חיון — topic author

Post ID: `482`
Published: `2025-08-25T20:45:37.911Z`
Updated: `2025-08-25T20:45:37.911Z`
Source: https://apiforum.yemot.tel/post/482

## [](https://apiforum.yemot.tel)📞 GetCampaignStatus – קבלת מצב קמפיין

מאפשר לבדוק את הסטטוס הנוכחי של קמפיין כפי שהתקבל בקריאת `RunCampaign`.

### [](https://apiforum.yemot.tel)🔹 הפקודה

`GetCampaignStatus`

### [](https://apiforum.yemot.tel)🔹 פרמטרים נדרשים

| פרמטר  | חובה/אופציונלי  | תיאור
| `token`  | חובה  | טוקן
| `campaignId`  | חובה  | מזהה הקמפיין, כפי שהתקבל בקריאת RunCampaign
| `entries`  | אופציונלי  | הצגת רשומות בקמפיין (מספרי טלפון). אם לא צוין – מוחזר מצב כללי בלבד.
| `range`  | אופציונלי  | טווח ערכים להצגה `[min]:[max]`. לדוגמה: `1:100` יציג את 100 הרשומות הראשונות, או `:` עבור כולן. ברירת מחדל: 10,000 רשומות ראשונות.

### [](https://apiforum.yemot.tel)🔹 ערכי פרמטר `entries`

| ערך  | הסבר
| `all`  | הכל
| `pending`  | בהמתנה לחיוג
| `blocked`  | חסומים
| `done`  | בוצע
| `accepted`  | אישרו מסירה
| `failed`  | נכשלו
| `no_answer`  | אין מענה
| `busy`  | תפוס
| `amd`  | מענה תא קולי
| `ringing`  | בחיוג
| `up`  | בשיחה
| `bridged`  | מנותבים
| `remove_request`  | בקשה להסרה
| `redial`  | ממתינים לחיוג חוזר
| `canceled`  | בוטל
| `error`  | שגיאה כללית

### [](https://apiforum.yemot.tel)🔹 תגובה במצב הצלחה (דוגמה)

```
{
"responseStatus": "OK",
"campaign": {
"campaignId": "0772222770-1117319-2025-01-22-10-07-54-414-API",
"campaignStatus": "RUNNING",
"templateId": 1117319,
"callerId": "0772222770",
"blockedEntries": 0,
"pendingEntries": 0,
"activeEntries": 1,
"doneEntries": 0,
"failedEntries": 0,
"totalEntries": 1,
"totalDialed": 3,
"totalSuccessful": 1,
"totalFailed": 2,
"paused": false,
"entries": [
{
"phone": "0773137770",
"name": null,
"moreinfo": "זוהי הודעת בדיקה",
"entryStatus": "up",
"duration": 3680,
"startTime": "2025-01-22 10:10:14",
"currentPrice": 1.0,
"redials": [
{
"entryStatus": "no_answer",
"startTime": "2025-01-22 10:07:54"
},
{
"entryStatus": "no_answer",
"startTime": "2025-01-22 10:09:04"
}
]
}
]
},
"yemotAPIVersion": 6
}
```

## Post 4 — נועם חיון — topic author

Post ID: `481`
Published: `2025-08-25T20:41:09.533Z`
Updated: `2025-08-25T20:41:09.533Z`
Source: https://apiforum.yemot.tel/post/481

## [](https://apiforum.yemot.tel)הפעלת קמפיין

מאפשר להפעיל קמפיין על בסיס תבנית קיימת במערכת.

### [](https://apiforum.yemot.tel)הפקודה

`RunCampaign`

### [](https://apiforum.yemot.tel)פרמטרים נדרשים

| פרמטר  | תיאור  | הערות
| `token`  | טוקן  | חובה
| `templateId`  | מזהה תבנית כפי שהתקבל בקריאות `GetTemplates` / `CreateTemplate`  | רשות; אם לא צוין → תבנית ברירת מחדל
| `callerId`  | זיהוי יוצא, מתקבל בקריאת `GetApprovedCallerIDs`  | רשות; אם לא צוין → המערכת תשתמש בזיהוי המוגדר בתבנית
| `phones`  | רשימת טלפונים לחיוג  | רשות; פורמט מפורט בהמשך
| `ttsMode`  | הפעלת הודעות אישיות בהקראה ממוחשבת (TTS)  | ראה הסבר להלן
| `withSMS`  | הפעלת קמפיין משולב SMS  | ראה הסבר להלן

### [](https://apiforum.yemot.tel)פורמט מספרים לשליחה

אפשרות 1 – רשימה פשוטה:
המפריד בין מספר למספר הוא נקודתיים `:`

```
phones=0772222770:0773137770

```

המערכת תחייג למספרים 0772222770 ו־0773137770.

אפשרות 2 – פורמט JSON עם מידע נוסף:

```
{
"0773137770": {
"name": "שם",
"moreinfo": "מידע נוסף",
"blocked": true
},
"0772222770": {
"name": "ימות המשיח",
"text": "עתיד התקשורת כבר כאן"
}
}

```

- `name` → שם
- `moreinfo` → מידע נוסף
- `text` → טקסט להודעה אישית (SMS או TTS)
- `blocked` → `true` = חסום, `false` = פעיל (ברירת מחדל פעיל)

### [](https://apiforum.yemot.tel)השמעת הודעות אישיות (TTS)

- `ttsMode=1` → המערכת תשמיע הודעה כללית של הקמפיין ואחריה טקסט אישי.
- אם לא סופק `phones` → הטקסט נלקח מהשדה `moreinfo`.
- אם סופק `phones` → הטקסט נלקח מהשדה `text`.

### [](https://apiforum.yemot.tel)קמפיין משולב SMS

- `withSMS=1` → למספר נייד רגיל נשלחת הודעת SMS,
ולמספר נייד כשר נשלחת הודעה קולית.

### [](https://apiforum.yemot.tel)מאפייני תגובת השרת

| מאפיין  | משמעות  | סוג  | דוגמה
| `templateId`  | מזהה תבנית עליה מתבסס הקמפיין  | int  | 1117319
| `campaignId`  | מזהה הקמפיין  | string  | 0772222770-1117319-2025-01-21-15-11-18-347-API
| `entriesCount`  | סה״כ ערכים (מספרים) ברשימה  | int  | 333
| `pending`  | סה״כ מספרים לחיוג  | int  | 300
| `blocked`  | סה״כ מספרים חסומים  | int  | 33
| `estimatedPrice`  | עלות משוערת ביחידות  | double  | 333.0
| `customerUnits`  | יתרת יחידות במערכת  | double  | 10000.12121212
| `smsCount`  | כמות SMS  | double  | 0.0
| `smsPrice`  | עלות SMS  | double  | 0.0

### [](https://apiforum.yemot.tel)שגיאות אפשריות

| קוד הודעה  | הודעה  | הסבר
| 100  | תבנית לא חוקית  | ערך `templateId` אינו קיים
| 101  | הקמפיין לא מוגדר כראוי  | רשימת טלפונים ריקה / אין הודעה תקינה
| 102  | אין טלפונים תקינים  | כל המספרים שסופקו בפרמטר `phones` אינם תקינים
| 103  | יחידות לא מספיקות  | יתרת היחידות אינה מספיקה
| 104  | isKodesh is true  | ניסיון הפעלה בשבת או יום טוב
| 105  | שגיאה כללית  | שגיאת מערכת – הקמפיין לא יכול להתחיל
| 120  | CallerId אינו מורשה  | המספר שצוין ב־`callerId` אינו מורשה

## Post 5 — נועם חיון — topic author

Post ID: `480`
Published: `2025-08-25T20:39:59.814Z`
Updated: `2025-08-25T20:39:59.814Z`
Source: https://apiforum.yemot.tel/post/480

## [](https://apiforum.yemot.tel)העלאת קובץ טקסט והפיכתו לרשימת טלפונים לתבנית קמפיין

### [](https://apiforum.yemot.tel)הפקודה

`UploadPhoneList`

### [](https://apiforum.yemot.tel)פרמטרים נדרשים

| פרמטר  | תיאור  | הערות
| `token`  | טוקן  | חובה
| `templateId`  | מזהה תבנית  | חובה
| `data`  | קובץ רשימת הטלפונים כמחרוזת  | חובה
| `nameColumns`  | מספר העמודות של ‘שם’. כל עמודות הטקסט האחרות עוברות ל’מידע נוסף’  | ברירת מחדל `1`
| `defaultPrefix`  | קידומת מספר ברירת מחדל למספרים בני 7 ספרות. ערכים מותרים: 02,03,04,08,09,077,072,073  | רשות
| `delimiter`  | תו המפריד בין עמודות. עבור טאב יש לכתוב `"TAB"`  | ברירת מחדל `,`
| `updateType`  | סוג העדכון: `UPDATE` = עדכון רשומות קיימות והוספת חדשות, `NEW` = הסרה והוספת חדשות, `REMOVE` = הסרה בלבד  | ברירת מחדל `UPDATE`
| `blocked`  | `1` = הרשומות שהועלו חסומות  | ברירת מחדל `0` = לא חסומות

### [](https://apiforum.yemot.tel)תגובות שגיאה

אם ניתוח הקובץ נכשל בגלל פורמט לא מזוהה → `message = "bad_format"`

### [](https://apiforum.yemot.tel)מאפייני תגובת השרת

| מאפיין  | סוג  | הסבר
| `message`  | string  | `"ok"` = ההעלאה עברה בהצלחה
| `templateId`  | int  | מזהה התבנית שעודכן
| `totalParsed`  | int  | מספר כולל של מספרים שהתקבלו
| `rejectedRecords`  | array  | מערך עם רשומות שנדחו (ראה תבנית להלן)
| `totalInserted`  | int  | מספר הרשומות שהוכנסו בהצלחה
| `totalUpdated`  | int  | מספר הרשומות שעודכנו
| `totalRemoved`  | int  | מספר הרשומות שהוסרו

### [](https://apiforum.yemot.tel)תבנית אובייקט rejectedRecords

| מאפיין  | סוג  | הסבר
| `phone`  | string  | מספר הטלפון
| `name`  | string  | עמודת שם
| `moreinfo`  | string  | עמודת מידע נוסף
| `blocked`  | bool  | סטטוס חסום
| `errorState`  | enum  | `DUPLICATE` = מספר כפול, `INVALID` = מספר לא חוקי (אסור בקמפיינים)
| `originalRowNumber`  | int  | מספר השורה בקובץ בו זוהתה השגיאה

## Post 6 — נועם חיון — topic author

Post ID: `479`
Published: `2025-08-25T20:39:23.264Z`
Updated: `2025-08-25T20:39:23.264Z`
Source: https://apiforum.yemot.tel/post/479

## [](https://apiforum.yemot.tel)מחיקת כל המספרים מרשימת התפוצה

### [](https://apiforum.yemot.tel)הפקודה

`ClearTemplateEntries`

### [](https://apiforum.yemot.tel)פרמטרים נדרשים

| פרמטר  | תיאור
| `token`  | טוקן
| `templateId`  | מזהה תבנית

### [](https://apiforum.yemot.tel)מאפייני תגובת השרת

אין מאפיינים מיוחדים.

## Post 7 — נועם חיון — topic author

Post ID: `478`
Published: `2025-08-25T20:39:04.768Z`
Updated: `2025-08-25T20:39:04.768Z`
Source: https://apiforum.yemot.tel/post/478

## [](https://apiforum.yemot.tel)עדכון סטטוס או מחיקה של מספרים מרשימת התפוצה

### [](https://apiforum.yemot.tel)הפקודה

`UpdateTemplateEntries`

### [](https://apiforum.yemot.tel)פרמטרים נדרשים

| פרמטר  | תיאור  | הערות
| `token`  | טוקן  | פרמטר חובה
| `templateId`  | מזהה תבנית  | פרמטר חובה
| `rowids`  | מזהים ייחודיים של המספרים ברשימת התפוצה  | יש להפריד בין המספרים עם מקף `-`
| `action`  | איזה פעולה לבצע  | ישנן 3 אפשרויות: <br>• `block` - חסימה <br>• `unblock` - ביטול חסימה <br>• `delete` - מחיקה

### [](https://apiforum.yemot.tel)מאפייני תגובת השרת

אין מאפיינים מיוחדים.

## Post 8 — נועם חיון — topic author

Post ID: `477`
Published: `2025-08-25T20:38:29.044Z`
Updated: `2025-08-25T20:38:29.044Z`
Source: https://apiforum.yemot.tel/post/477

## [](https://apiforum.yemot.tel)עדכון מספר בודד ברשימת תפוצה

### [](https://apiforum.yemot.tel)הפקודה

`UpdateTemplateEntry`

### [](https://apiforum.yemot.tel)פרמטרים נדרשים

| פרמטר  | תיאור  | הערות
| `token`  | טוקן  | פרמטר חובה
| `templateId`  | מזהה תבנית  | פרמטר חובה
| `rowid`  | מזהה ייחודי של המספר ברשימת התפוצה  | אם הפרמטר מושמט והמספר לא קיים, תיווצר שורה חדשה
| `phone`  | מספר טלפון  | אם המספר קיים ברשימת התפוצה והפרמטר `rowid` הושמט, המספר יעודכן מחדש והערכים `name` ו־`moreinfo` שהיו קיימים יימחקו
| `name`  | שם  |
| `moreinfo`  | מידע נוסף  |
| `blocked`  | האם לעדכן כחסום  | במידה וכן, יש להגדיר `1`. במידה ולא, יש להגדיר `0`

## Post 9 — נועם חיון — topic author

Post ID: `476`
Published: `2025-08-25T20:38:04.407Z`
Updated: `2025-08-25T20:38:04.407Z`
Source: https://apiforum.yemot.tel/post/476

## [](https://apiforum.yemot.tel)הצגת המספרים שברשימת התפוצה

### [](https://apiforum.yemot.tel)הפקודה

`GetTemplateEntries`

### [](https://apiforum.yemot.tel)פרמטרים נדרשים

| פרמטר  | תיאור
| `token`  | טוקן
| `templateId`  | מזהה תבנית

### [](https://apiforum.yemot.tel)מאפייני תגובת השרת

| מאפיין  | סוג  | הסבר
| `templateId`  | int  | מזהה תבנית
| `entries`  | array  | מערך אובייקטים (ראה “תבנית אובייקט מספר” להלן)

### [](https://apiforum.yemot.tel)תבנית אובייקט מספר

| מאפיין  | סוג  | ערך  | הערות
| `rowid`  | int  | מזהה ייחודי של המספר ברשימת התפוצה  |
| `index`  |   | מיקום המספר ברשימת התפוצה  |
| `phone`  | string  | מספר טלפון  |
| `blocked`  | boolean  | האם המספר מוגדר כחסום  | במידה וכן, יופיע הערך `true`. במידה ולא, יופיע הערך `false`
| `name`  | string  | שם משוייך  | במידה ולא מוגדר, יתקבל הערך `null`
| `moreinfo`  | string  | מידע נוסף  | במידה ולא מוגדר, יתקבל הערך `null`

## Post 10 — נועם חיון — topic author

Post ID: `475`
Published: `2025-08-25T20:37:31.754Z`
Updated: `2025-08-25T20:37:31.754Z`
Source: https://apiforum.yemot.tel/post/475

## [](https://apiforum.yemot.tel)מחיקת תבנית קמפיין

### [](https://apiforum.yemot.tel)הפקודה

`DeleteTemplate`

### [](https://apiforum.yemot.tel)פרמטרים נדרשים

| פרמטר  | תיאור
| `token`  | טוקן
| `templateId`  | מזהה תבנית

### [](https://apiforum.yemot.tel)מאפייני תגובת השרת

אין מאפיינים מיוחדים בתגובת השרת.

## Post 11 — נועם חיון — topic author

Post ID: `474`
Published: `2025-08-25T20:36:53.316Z`
Updated: `2025-08-25T20:36:53.316Z`
Source: https://apiforum.yemot.tel/post/474

## [](https://apiforum.yemot.tel)יצירת תבנית קמפיין חדשה

>

הערה: ההגדרות של הקמפיין החדש יועתקו מקמפיין ברירת המחדל.

### [](https://apiforum.yemot.tel)הפקודה

`CreateTemplate`

### [](https://apiforum.yemot.tel)פרמטרים נדרשים

| פרמטר  | תיאור
| `token`  | טוקן
| `description`  | שם הקמפיין

### [](https://apiforum.yemot.tel)מאפייני תגובת השרת

| מאפיין  | סוג  | ערך
| `templateId`  | int  | מזהה התבנית החדשה שנוצרה

## Post 12 — נועם חיון — topic author

Post ID: `473`
Published: `2025-08-25T20:36:00.533Z`
Updated: `2025-08-25T20:36:00.533Z`
Source: https://apiforum.yemot.tel/post/473

## [](https://apiforum.yemot.tel)ניהול קבצי קמפיין

ראה גם:

- [ניהול קבצים]
- [הצגת תוכן קובץ טקסט]
- [העלאת טקסט לקובץ]

### [](https://apiforum.yemot.tel)נתיבי קבצים לניהול (בשדות `what` ו־`target`)

| סוג הודעה  | נתיב קובץ
| הודעת קמפיין קולי  | `tpl:${templateId}`
| הודעת קמפיין SMS  | `tpl:${templateId}:tts`
| הודעה לפני ניתוב  | `tpl:${templateId}:MoreInfo`

## Post 13 — נועם חיון — topic author

Post ID: `472`
Published: `2025-08-25T20:35:27.194Z`
Updated: `2025-08-25T20:35:27.194Z`
Source: https://apiforum.yemot.tel/post/472

## [](https://apiforum.yemot.tel)העלאת והורדת קבצי שמע לקמפיין

ראה גם:

- [העלאת קובץ] – כיצד להעלות קבצים
- [הורדת קובץ] – כיצד להוריד קבצים

### [](https://apiforum.yemot.tel)נתיבי קבצים

#### [](https://apiforum.yemot.tel)הודעות קמפיין

| סוג הודעה  | נתיב קובץ
| הודעת קמפיין קולי  | `${templateId}.wav`
| הודעת קמפיין SMS  | `${templateId}.tts`
| הודעה לפני ניתוב  | `${templateId}-MoreInfo.wav`

#### [](https://apiforum.yemot.tel)הודעות במצב הודעה פרטית (אם מופעל)

| סוג הודעה  | נתיב קובץ
| הודעה שמושמעת לכולם לפני ההודעה הפרטית  | `${templateId}-First.wav`
| הודעה פרטית שמושמעת לטלפון ספציפי  | `PrivateMsg/${phone}.wav`
| הודעה ברירת מחדל אם אין הודעה ספציפית לטלפון  | `PrivateMsg/Default.wav`

## Post 14 — נועם חיון — topic author

Post ID: `471`
Published: `2025-08-25T20:34:45.664Z`
Updated: `2025-08-25T20:34:45.664Z`
Source: https://apiforum.yemot.tel/post/471

## [](https://apiforum.yemot.tel)עדכון תבנית קמפיין

פקודה: `UpdateTemplate`

### [](https://apiforum.yemot.tel)פרמטרים נדרשים

| פרמטר  | סוג  | תיאור  | הערות
| token  | string  | טוקן  | חובה
| templateId  | int  | מזהה תבנית  | חובה
| description  | string  | תיאור התבנית  |
| callerId  | string  | זיהוי שיחה יוצאת  |
| incomingPolicy  | enum (string)  | מדיניות שיחות נכנסות  | OPEN / BLACKLIST / WHITELIST / BLOCKED
| customerDefault  | boolean (1/0)  | האם ברירת מחדל  | 1 = כן, אחרת להגדיר אחר
| maxActiveChannels  | int  | הגבלת קווים מחייגים  | מספר מקסימלי של שיחות פעילות
| maxBridgedChannels  | int  | הגבלת קווים מנותבים  | 0 = ללא הגבלה
| originateTimeout  | double  | זמן חיוג מקסימלי (שניות)  |
| vmDetect  | boolean (1/0)  | זיהוי תא קולי  |
| filterEnabled  | boolean (1/0)  | קמפיין ממספרים אישיים  |
| maxDialAttempts  | int  | ניסיונות חיוג  |
| redialWait  | double  | המתנה בין ניסיונות (שניות)  |
| redialPolicy  | enum (string)  | מדיניות חיוגים חוזרים  | NONE / CONGESTIONS / FAILED
| yemotContext  | enum (string)  | סוג הקמפיין  | SIMPLE / REPEAT / MESSAGE / VOICEMAIL / BRIDGE
| bridgeTo  | string  | מספר לניתוב  | חובה אם BRIDGE
| playPrivateMsg  | boolean (1/0)  | מצב הודעה פרטית  |
| removeRequest  | enum (string)  | אפשרויות הסרה  | SILENT / WITH_MESSAGE

### [](https://apiforum.yemot.tel)מאפייני תגובת השרת

| מאפיין  | סוג  | הסבר
| templates  | array  | נתוני התבנית המעודכנים (זהה ל־GetTemplates)

## Post 15 — נועם חיון — topic author

Post ID: `470`
Published: `2025-08-25T20:29:44.349Z`
Updated: `2025-08-25T20:29:44.349Z`
Source: https://apiforum.yemot.tel/post/470

### [](https://apiforum.yemot.tel)קבלת מצב כל תבניות הקמפיינים

הפקודה היא: GetTemplates

### [](https://apiforum.yemot.tel)פרמטרים נדרשים

| פרמטר  | תיאור  | הערות
| token  | טוקן  | חובה

### [](https://apiforum.yemot.tel)מאפייני תגובת השרת

| מאפיין  | סוג  | הסבר
| templates  | array  | מערך של אובייקטים (אובייקט מזהה תבנית)

### [](https://apiforum.yemot.tel)אובייקט מזהה תבנית

| מאפיין  | סוג  | ערך / הסבר
| templateId  | int  | מזהה התבנית (לא המספר הסידורי באתר)
| description  | string  | תיאור התבנית (null אם לא הוגדר)
| callerId  | string  | זיהוי שיחה יוצאת
| entriesCount  | int  | כמות המספרים ברשימת התפוצה (פעילים וחסומים)
| blockedEntriesCount  | int  | כמות המספרים החסומים
| incomingPolicy  | enum  | מדיניות שיחות נכנסות: `OPEN` / `BLACKLIST` / `WHITELIST` / `BLOCKED` (רלוונטי רק לקמפיין ברירת מחדל)
| customerDefault  | boolean  | האם מדובר בקמפיין ברירת מחדל (true/false)
| maxActiveChannels  | int  | הגבלת שיחות פעילות בו זמנית בקמפיין
| maxBridgedChannels  | int  | הגבלת שיחות מנותבות (0 = ללא הגבלה)
| originateTimeout  | double  | זמן חיוג מקסימלי לשיחה (שניות)
| vmDetect  | boolean  | האם מופעל זיהוי תא קולי
| filterEnabled  | boolean  | האם מופעלת אפשרות קמפיין ממספרים אישיים
| maxDialAttempts  | int  | מספר מקסימלי של ניסיונות חיוג לאותו מספר
| redialWait  | int  | זמן המתנה מינימלי בין ניסיונות חיוג (שניות)
| redialPolicy  | enum  | מדיניות חיוגים חוזרים: `NONE` / `CONGESTIONS` / `FAILED`
| yemotContext  | enum  | סוג קמפיין: `SIMPLE` / `REPEAT` / `MESSAGE` / `VOICEMAIL` / `BRIDGE` / `OTHER`
| bridgeTo  | string  | מספר טלפון לניתוב (אם סוג הקמפיין הוא BRIDGE)
| playPrivateMsg  | boolean  | האם מצב הודעה פרטית מופעל
| messageExists  | boolean  | האם קיימת הודעת קמפיין
| messageDuration  | double  | אורך הודעת הקמפיין (שניות)
| unitsPerMessage  | double  | עלות משוערת ביחידות עבור כל הודעה
| moreinfoExists  | boolean  | האם קיימת הודעה לפני ניתוב
| moreinfoDuration  | double  | אורך הודעת הניתוב (שניות)
| removeRequest  | enum  | אפשרות הסרה: `SILENT` / `WITH_MESSAGE`

## Post 16 — נועם חיון — topic author

Post ID: `469`
Published: `2025-08-25T20:28:47.711Z`
Updated: `2025-08-25T20:28:47.711Z`
Source: https://apiforum.yemot.tel/post/469

### [](https://apiforum.yemot.tel)הורדת קובץ

הפקודה היא: DownloadFile

### [](https://apiforum.yemot.tel)פרמטרים נדרשים

| פרמטר  | תיאור  | הערות
| token  | טוקן  | חובה
| path  | שם הקובץ להורדה  | יפורט בהמשך איך לציין נתיב לכל קובץ

### [](https://apiforum.yemot.tel)מאפייני תגובת השרת

- אם הקובץ קיים → התגובה תכיל את תוכן הקובץ עצמו (binary).
- אם הקובץ לא קיים או התרחשה שגיאה → תוחזר תשובת HTTP 404 Not Found.

>

שים לב: תגובה זו אינה JSON בשונה מרוב הקריאות האחרות בממשק.

## Post 17 — נועם חיון — topic author

Post ID: `468`
Published: `2025-08-25T20:26:45.650Z`
Updated: `2025-08-25T20:26:45.650Z`
Source: https://apiforum.yemot.tel/post/468

### [](https://apiforum.yemot.tel)העלאת קובץ

הפקודה היא: UploadFile

### [](https://apiforum.yemot.tel)מתודת פניה

יש לפנות ב־HTTP POST בפורמט `multipart/form-data`.

>

שים לב: ניתן להעלות קובץ בודד בכל פנייה.
מגבלת גודל קובץ: 50MB (נכון ל־28/09/2022). בקבצים גדולים יותר יש לבצע פיצול (ראו להלן).

### [](https://apiforum.yemot.tel)פרמטרים נדרשים

| פרמטר  | תיאור  | הערות
| token  | טוקן  | חובה
| path  | נתיב להעלאה  | חובה. לדוגמה: `ivr2:5/000.wav`
| convertAudio  | המרת הקובץ  | בוליאני (1/0). אם =1 הקובץ יומר ל־WAV לטלפוניה
| autoNumbering  | מספור אוטומטי לקבצי שמע  | true/false. במקרה זה `path` יצביע על תיקייה בלבד
| tts  | קובץ TTS  | 1/0. חובה לציין במספור אוטומטי עבור קובצי TTS

### [](https://apiforum.yemot.tel)פיצול קובץ לחלקים

#### [](https://apiforum.yemot.tel)שלב א’ – העלאת חלקים

| פרמטר  | תיאור  | דוגמה
| qquuid  | מזהה פעולה ייחודי (UUID)  | 2017390a-60cf-44ea-822f-27017c13de69
| qqpartindex  | אינדקס חלק  | 1
| qqpartbyteoffset  | כמה בייטים הועלו עד כה  | 4000000
| qqchunksize  | גודל החלק הנוכחי בבייטים  | 4000000
| qqtotalparts  | סה"כ חלקים (כולל אינדקס 0 האחרון)  | 8
| qqtotalfilesize  | גודל כולל של הקובץ בבייטים  | 29863882
| qqfilename  | שם הקובץ המקורי  | בוקר טוב.mp3
| qqfile  | מקטע הקובץ הנוכחי  | (קובץ)
| uploader  | מחלקת העלאה  | yemot-admin

#### [](https://apiforum.yemot.tel)שלב ב’ – סיום העלאה

פנייה אל: UploadFile?done

פרמטרים שיש לשלוח:

| פרמטר  | תיאור  | דוגמה
| token  | טוקן  | כנ"ל
| path  | נתיב  | כנ"ל
| convertAudio  | המרת אודיו  | כנ"ל
| autoNumbering  | מספור אוטומטי  | כנ"ל
| tts  | קובץ TTS  | כנ"ל
| qquuid  | מזהה פעולה UUID  | 2017390a-60cf-44ea-822f-27017c13de69
| qqfilename  | שם קובץ מקורי  | בוקר טוב.mp3
| qqtotalfilesize  | גודל כולל  | 29863882
| qqtotalparts  | סה"כ חלקים  | 8

### [](https://apiforum.yemot.tel)תגובת השרת

| מאפיין  | סוג  | הסבר
| path  | string  | נתיב הקובץ שהועלה
| size  | long  | גודל הקובץ בבייטים

אם `convertAudio=1`, יוחזרו גם:

| מאפיין  | סוג  | הסבר
| convertedSize  | long  | גודל קובץ WAV לאחר ההמרה
| duration  | double  | משך האודיו בשניות

### [](https://apiforum.yemot.tel)הודעות שגיאה אפשריות

| messageCode  | message  | הסבר
| 105  | System error  | שגיאה כללית
| 107  | File upload expected  | לא נמצא קובץ להעלאה
| 108  | Only single upload per request  | הועלה יותר מקובץ אחד
| 109  | path is required  | דרוש נתיב
| 110  | path is invalid  | הנתיב אינו חוקי

### [](https://apiforum.yemot.tel)כלי בדיקה

לטופס בדיקת העלאות HTTP:
[https://www.call2all.co.il/ym/api_upload_test.php](https://www.call2all.co.il/ym/api_upload_test.php)

## Post 18 — נועם חיון — topic author

Post ID: `467`
Published: `2025-08-25T20:25:21.688Z`
Updated: `2025-08-25T20:25:21.688Z`
Source: https://apiforum.yemot.tel/post/467

### [](https://apiforum.yemot.tel)קבלת רשימת שיחות הפעילות במערכת

הפקודה היא: GetIncomingCalls

### [](https://apiforum.yemot.tel)הפרמטרים הנדרשים:

| פרמטר  | תיאור / הערות
| token  | טוקן

### [](https://apiforum.yemot.tel)מאפייני תגובת השרת:

| מאפיין  | סוג  | הסבר
| calls  | array  | מערך אובייקטים (ראה “תבנית אובייקט שיחה” להלן)
| callsCount  | int  | מספר כולל של שיחות במערכת

### [](https://apiforum.yemot.tel)תבנית אובייקט שיחה

| מאפיין  | ערך
| did  | מספר מחוייג
| callerIdNum  | מספר מחייג (כולל ערכים של ID `val_name` במידה וקיים במערכת)
| duration  | משך זמן שיחה – בשניות
| transferFrom  | האם השיחה הועברה ממערכת אחרת. אם כן יופיע הערך “מועבר”, אם לא – יופיע הערך `null`
| id  | מזהה ייחודי לאורך השיחה
| path  | מספר שלוחה (כולל תיאור שלוחה ומספר קובץ במידה וקיים)

## Post 19 — נועם חיון — topic author

Post ID: `466`
Published: `2025-08-25T20:24:44.349Z`
Updated: `2025-08-25T20:24:44.349Z`
Source: https://apiforum.yemot.tel/post/466

### [](https://apiforum.yemot.tel)העברת יחידות

העברת יחידות למערכת אחרת

הפקודה היא: TransferUnits

### [](https://apiforum.yemot.tel)הפרמטרים הנדרשים:

| פרמטר  | תיאור / הערות
| token  | טוקן
| destination  | מספר מערכת להעברה
| amount  | כמות יחידות להעברה

### [](https://apiforum.yemot.tel)מאפייני תגובת השרת במקרה שהעברה בוצעה בהצלחה:

| מאפיין  | סוג  | ערך
| destination  | string  | מערכת היעד אליה בוצעה ההעברה
| amount  | double  | הסכום שהועבר
| newBalance  | double  | יתרת היחידות במערכת המקור לאחר ביצוע ההעברה

### [](https://apiforum.yemot.tel)במקרה של שגיאה בביצוע ההעברה:

| messageCode  | message  | הסבר
| 111  | Bad destination  | יעד להעברה לא חוקי: המערכת אינה קיימת או שאינה מורשית לקבל יחידות ממערכת זו
| 112  | Bad amount  | סכום היחידות להעברה אינו חוקי
| 113  | Not enough balance  | יתרת היחידות שבמערכת אינה מאפשרת את ביצוע ההעברה

## Post 20 — נועם חיון — topic author

Post ID: `465`
Published: `2025-08-25T20:23:56.458Z`
Updated: `2025-08-25T20:23:56.458Z`
Source: https://apiforum.yemot.tel/post/465

### [](https://apiforum.yemot.tel)קבלת רשימת חיובי יחידות

היסטוריה של תנועת יחידות במערכת (כולל דוחות קמפיינים שהסתיימו)

הפקודה היא: GetTransactions

### [](https://apiforum.yemot.tel)הפרמטרים הנדרשים:

| פרמטר  | תיאור  | הערות
| token  | טוקן  | חובה
| from  | מאיזה תנועה להציג  | רשות
| limit  | מספר מרבי של תנועות שיש לכלול  | רשות
| filter  | סינון תוצאות לפי סוג פעולה  | `campaigns` עבור חיובי קמפיינים

### [](https://apiforum.yemot.tel)מאפייני תגובת השרת:

| מאפיין  | סוג  | ערך
| transactions  | array  | מערך אובייקטים (ראה “תבנית אובייקט תנועה” להלן)
| totalCount  | int  | מספר כולל של תנועת יחידות

### [](https://apiforum.yemot.tel)תבנית אובייקט תנועה

| מאפיין  | סוג  | ערך
| id  | int  | מזהה תנועה ייחודי
| transactionTime  | string  | תאריך ושעה (פורמט: `yyyy-MM-dd HH:mm:ss`)
| amount  | double  | סכום היחידות
| description  | string  | תיאור העסקה (ראה מילות מפתח מיוחדות להלן)
| who  | string  | בוצע על ידי: <br>1) כתובת IP אם דרך אתר האינטרנט. <br>2) מספר טלפון אם דרך הטלפון. <br>3) `ADMIN` אם ע״י שירות הלקוחות. <br>4) `TRANSFER` בהעברת יחידות. <br>5) `expire` במקרה של פג תוקף.
| newBalance  | double  | כמות יחידות מחודשת לאחר התנועה
| expireDate  | string  | תאריך תפוגה חדש (אם קיים) בפורמט `yyyy-MM-dd`, אחרת `null`
| campaignId  | string  | מזהה קמפיין אם התנועה היא הפעלת קמפיין (משמש להורדת דוח), אחרת `null`

### [](https://apiforum.yemot.tel)מילות מפתח מיוחדות למאפיין `description`

ניתן להשתמש בהן כדי לזהות סוגי פעולות:

| תיאור המתחיל ב  | פירושו
| Start-  | חיוב עבור הפעלת קמפיין
| transfer to  | חיוב עבור העברת יחידות למערכת אחרת
| transfer from  | יחידות שנוספו בהעברה ממערכת אחרת
| Units expired  | פג תוקף היחידות

## Post 21 — נועם חיון — topic author

Post ID: `464`
Published: `2025-08-25T20:23:18.002Z`
Updated: `2025-08-25T20:23:18.002Z`
Source: https://apiforum.yemot.tel/post/464

### [](https://apiforum.yemot.tel)עדכון פרטי משתמש

הערה: הפקודה מוחקת את פרטי המשתמש המעודכנים במערכת.

הפקודה היא: SetCustomerDetails

### [](https://apiforum.yemot.tel)הפרמטרים הנדרשים:

| פרמטר  | תיאור
| token  | טוקן (פרמטר חובה)
| name  | שם לקוח
| email  | כתובת דוא"ל
| organization  | שם ארגון
| contactName  | שם איש קשר
| phones  | טלפון
| invoiceName  | חשבונית על שם
| invoiceAddress  | כתובת למשלוח חשבונית
| fax  | פקס
| accessPassword  | סיסמת גישה
| recordPassword  | סיסמת הקלטות

אין מאפיינים מיוחדים בתגובת השרת

## Post 22 — נועם חיון — topic author

Post ID: `463`
Published: `2025-08-25T20:22:46.451Z`
Updated: `2025-08-25T20:22:46.451Z`
Source: https://apiforum.yemot.tel/post/463

### [](https://apiforum.yemot.tel)שינוי סיסמת ניהול

הפקודה היא: SetPassword

### [](https://apiforum.yemot.tel)הפרמטרים הנדרשים:

| פרמטר  | תיאור / הערות
| token  | טוקן
| password  | סיסמת הניהול הנוכחית
| newPassword  | סיסמה חדשה

אין מאפיינים מיוחדים בתגובת השרת

## Post 23 — נועם חיון — topic author

Post ID: `462`
Published: `2025-08-25T20:22:18.133Z`
Updated: `2025-08-25T20:22:18.133Z`
Source: https://apiforum.yemot.tel/post/462

### [](https://apiforum.yemot.tel)קבלת פרטי המערכת

הפקודה היא: GetSession

### [](https://apiforum.yemot.tel)הפרמטרים הנדרשים:

| פרמטר  | תיאור / הערות
| token  | טוקן

### [](https://apiforum.yemot.tel)מאפייני תגובת השרת:

| מאפיין  | סוג  | ערך
| name  |   | שם לקוח
| unitsExpireDate  | string  | תאריך תפוגה של היחידות
| email  |   | כתובת אימייל
| organization  |   | שם ארגון
| contactName  |   | שם איש קשר
| phones  |   | טלפון
| invoiceName  |   | חשבונית על שם
| invoiceAddress  |   | כתובת למשלוח חשבונית
| fax  |   | פקס
| accessPassword  |   | סיסמת גישה למערכת
| units  | double  | כמות היחידות שבמערכת
| recordPassword  |   | סיסמת הקלטות
| creditFile  |   | שם משווק
| username  | string  | מספר המערכת

## Post 24 — נועם חיון — topic author

Post ID: `461`
Published: `2025-08-25T20:19:21.143Z`
Updated: `2025-08-25T20:19:21.143Z`
Source: https://apiforum.yemot.tel/post/461

### [](https://apiforum.yemot.tel)התנתקות

מחיקת הטוקן שהתקבל בהתחברות

הפקודה היא: Logout

### [](https://apiforum.yemot.tel)הפרמטרים הנדרשים:

| פרמטר  | תיאור / הערות
| token  | טוקן

אין מאפיינים מיוחדים בתגובת השרת

## Post 25 — נועם חיון — topic author

Post ID: `460`
Published: `2025-08-25T20:18:01.835Z`
Updated: `2025-08-25T20:18:01.835Z`
Source: https://apiforum.yemot.tel/post/460

### [](https://apiforum.yemot.tel)התחברות

הסבר: בכל הבקשות שנשלחות לשרת יש צורך בפרמטר `token` שמשמש כנקודת התחברות למערכת.
כאשר שולחים פקודת Login תקינה, תקבלו בחזרה פרמטר `token` שאת הערך שלו עליכם לציין כשאתם שולחים כל פקודת API.
ראה להלן דרך נוספת.

הפקודה היא: Login

### [](https://apiforum.yemot.tel)הפרמטרים הנדרשים:

| פרמטר  | תיאור / הערות
| username  | מספר מערכת
| password  | סיסמת ניהול של המערכת

### [](https://apiforum.yemot.tel)מאפייני תגובת השרת:

| מאפיין  | ערך  | הערה
| token  | טוקן  | הטוקן שיחזור יופיע לאחר 30 דקות אם לא תבוצע שיחת API עם הטוקן. כלומר כל עוד הטוקן תקף יש להשתמש בו ולהימנע מבקשת התחברות נוספת.

### [](https://apiforum.yemot.tel)שימו לב:

אין צורך נוספת ליצירת טוקן ללא בקשת Login.
כאשר שולחים כל פקודת API, לרבות פקודת `token`, יש לכתוב בצורה הבאה (פורמט `username:password`):

```
${url}<WebServiceName>?token=${username}:${password}

```

## Post 26 — נועם חיון — topic author

Post ID: `459`
Published: `2025-08-25T20:03:41.394Z`
Updated: `2025-08-25T20:08:08.569Z`
Source: https://apiforum.yemot.tel/post/459

הסיסמה היא (copy:123456)

## Post 27 — נועם חיון — topic author

Post ID: `448`
Published: `2025-08-25T15:51:49.151Z`
Updated: `2025-08-25T15:51:49.151Z`
Source: https://apiforum.yemot.tel/post/448

התחברות

הסבר: בכל הבקשות הנשלחות לשרת יש צורך בפרמטר token שמשמש כקוד התחברות למערכת
כאשר תשלחו פקודת Login תקינה, תקבלו בחזרה פרמטר token שאת הערך שלו עליכם לציין כשאתם שולחים כל פקודת API.
ראה להלן דרך נוספת

הפקודה היא -Login

הפרמטרים הנדרשים:

פרמטר תיאור / הערות
username מספר מערכת
password סיסמת הניהול של המערכת
מאפייני תגובת השרת:

מאפיין ערך הערה
token טוקן הטוקן שנוצר יפוג לאחר 30 דקות אם לא תתבצע שיחת API עם הטוקן. כמו כן, כל עוד הטוקן תקף יש להשתמש בו ולהימנע מבקשת התחברות נוספת
שימו לב!
ישנה דרך נוספת ליצירת טוקן ללא צורך בבקשת Login
כאשר שולחים כל פקודת API, לרשום בפרמטר token מספר מערכת : סיסמא (username:password)

לדוגמה:
