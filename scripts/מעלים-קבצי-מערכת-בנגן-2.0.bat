@echo off
chcp 1255>nul
title מעלים קבצים מיותרים בנגן
color 74
MODE CON: COLS=70 lines=25

:welcome
cls
echo.
echo.
echo                           2.0 םיצבקה םילעמ
echo                          =================
echo.
echo                          !ןנוכ תוא ןאכ סנכה
echo                רטנא שקה ןנוכ לש םייטמוטוא הריחבו שופיחל
set/p p=">>>"
if exist %p%:\ (goto :start) else (
if "%p%" == "" (goto :auto) else ( goto :welcome)
)

:auto
set auto=on
for %%d in (D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z) do (
set p=%%d
if exist %%d:\ (%%n: & goto :start) else (echo.>nul)
)


:start
cd /d %p%:
set x=
if exist MUSIC.LIB attrib +s +h MUSIC.LIB & set x=x
if exist AUDIBLE.LIB attrib +s +h AUDIBLE.LIB & set x=x
if exist  M3U.LIB attrib +s +h M3U.LIB & set x=x
if exist PODCAST.LIB attrib +s +h PODCAST.LIB & set x=x
if exist AUDBOOK.LIB attrib +s +h AUDBOOK.LIB & set x=x
if exist USERPL1.PL attrib +s +h USERPL1.PL & set x=x
if exist USERPL2.PL attrib +s +h USERPL2.PL & set x=x
if exist USERPL3.PL attrib +s +h USERPL3.PL & set x=x
if exist PICTURE.LIB attrib +s +h PICTURE.LIB & set x=x
if exist VIDEO.LIB attrib +s +h VIDEO.LIB & set x=x
if exist EBOOK.LIB attrib +s +h EBOOK.LIB & set x=x
if exist version.sdk attrib +s +h version.sdk & set x=x
if exist ALBOK.PIC attrib +s +h ALBOK.PIC & set x=x
if exist ALBUM.PIC attrib +s +h ALBUM.PIC & set x=x
if exist MUSIC2.LIB attrib +s +h MUSIC2.LIB & set x=x
if exist MUSICBMK.BMK attrib +s +h MUSICBMK.BMK & set x=x
cls
echo.
echo                           2.0 םיצבקה םילעמ
echo                          =================
echo.
if "%x%"=="x" (
echo                               !ונמייס
) else (
echo                          !החילצה אל הלועפה)
echo.
echo               ...תינכותה תא רוגסל ידכ והשלכ שקמ לע ץחל & pause>nul & exit /b 0
::קרדיט: nh.local11@gmail.com