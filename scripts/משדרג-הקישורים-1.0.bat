@echo oFF
chcp 1255
mode CON: COLS=70 lines=21
color 3f
title ����� �������� 1.0
:start
cls
set a=
set b=
echo.
echo.
echo.
echo                   ����� ������ ������ ����� �� ������
echo.
echo                   1 ��� ���� ������ ���� ����� ������
echo              2 ��� ������ ������ ����� ����� ����� ������
echo.
echo          ������� ������ �� ������ ����� �� - ���� �� ������ ��
echo       ����� ��������� "����� ���"�� ������ �� ������ �� - ��������
choice /c 12
if errorlevel 2 goto :url-present
if errorlevel 1 goto :url-download

:url-present
cls
echo.
echo.
echo.
echo                  ����� ������ ������ ���� �� ������
echo               �������� ��� ���� ������ ���� ������� ��
echo.
echo                   ���� �� �����-���� ����� ��� ����
echo                    ������� ����� ���� ������ ����
echo.
set/p a=">>>"
set a=%a:/view?usp=%
set a=%a:sharing=%
set a=%a:/edit=%
for /F "tokens=1* delims==" %%A in ("%a%") do set b=%%A
set b=%b%/preview
echo %b%|clip
echo                      !���� ����� ������ ������
echo.
echo                    1 ��� ������ ��� ��� ��� ������
echo                     2 ��� ���� ����� ������ �����
choice /c 12
if errorlevel 2 goto start
if errorlevel 1 start %b%
goto start


:url-download
cls
echo.
echo.
echo.
echo                   ���� �� �����-���� ����� ��� ����
echo                     ���� ��� ��� ����� ������ ����
set/p a=">>>"

set a=%a:https://drive.google.com/file/d/=%
set a=%a:https://docs.google.com/document/d/=%
set a=%a:/view?usp=%
set a=%a:sharing=%
set a=%a:/edit=%
for /F "tokens=1* delims==" %%A in ("%a%") do set b=%%A
set "b=https://drive.google.com/uc?export=download&id=%b%"
echo.
echo ������� ��� ��� ������ �� ����
echo.
echo "%b%"
echo.
echo                  ����� ������ ����� ����� ��� �� ���
pause>nul
goto :start


::�����: nh.local11@gmail.com