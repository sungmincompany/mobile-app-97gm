@echo off
echo 서버 상태 모니터링 중입니다... (서버는 이미 서비스로 돌고 있음)
echo ---------------------------------------------------
powershell -NoExit -Command "Get-Content 'D:\WEB\my-mobile-app (97_GM)\service.log' -Wait"