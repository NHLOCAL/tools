@echo off
chcp 65001

mode CON: COLS=70 lines=21
color 3f
title משדרג הקישורים 1.0

:start
cls
set a=
set b=
echo.
echo.
echo.
echo                   ביירד ירושיק גורדשל דעוימ הז טפירקס
echo.
echo                   1 שקה ץבוק תדרוהל רישי רושיק תריציל
echo              2 שקה המידקמ הגוצתב ץבוקה תגצהל רושיק תריציל
echo.
echo          ןפדפדבש תבותכה תא קיתעהל תוסנל שי - ןיקת אל רושיקה םא
echo       ץבוקה תויורשפאב "רושיק גצה"בש תבותכה תא קיתעהל שי - ןיפוליחל
choice /c 12
if errorlevel 2 goto :url-present
if errorlevel 1 goto :url-download

:url-present
cls
echo.
echo.
echo.
echo                  ביירד ירושיק גורדשל דעונ הז טפירקס
echo               תויורשפא אלל ץבוק תגוצתל הנפי רושיקהש ךכ
echo.
echo                   ץבוק לש ביירד-לגוג רושיק ןאכ סנכה
echo                    םיכמסמו הנומת יצבק סינכהל ןתינ
echo.
set/p a=">>>"
set a=%a:/view?usp=%
set a=%a:sharing=%
set a=%a:/edit=%
for /F "tokens=1* delims==" %%A in ("%a%") do set b=%%A
set b=%b%/preview
echo %b%|clip
echo                      !חולל קתעוה ןקותמה רושיקה
echo.
echo                    1 שקה ןפדפדה ךרד תעכ ולש החיתפל
echo                     2 שקה ףסונ רושיק תסנכהו םויסל
choice /c 12
if errorlevel 2 goto start
if errorlevel 1 start %b%
goto start

:url-download
cls
echo.
echo.
echo.
echo                   ץבוק לש ביירד-לגוג רושיק ןאכ סנכה
echo                     אוהש גוס לכמ םיצבק סינכהל ןתינ
set/p a=">>>"

set a=%a:https://drive.google.com/file/d/=%
set a=%a:https://docs.google.com/document/d/=%
set a=%a:/view?usp=%
set a=%a:sharing=%
set a=%a:/edit=%
for /F "tokens=1* delims==" %%A in ("%a%") do set b=%%A
set "b=https://drive.google.com/uc?export=download&id=%b%"
echo.
echo םיישרגה אלל ןאכ רושיקה תא קתעה
echo.
echo "%b%"
echo.
echo                  ישארה טירפתל הרזחל והשלכ שקמ לע שקה
pause>nul
goto :start


::קרדיט: nh.local11@gmail.com