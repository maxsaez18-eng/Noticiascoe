Set WshShell = CreateObject("WScript.Shell")
cmd = "cmd /c set EXPO_TOKEN=3fOcjr4GhMgCdWlXyhz6irQ0QobysO4VwBDKgfeL && cd /d C:\Users\Tokyotech\OneDrive\Desktop\app noticias\app && npx.cmd expo start --localhost"
WshShell.Run cmd, 0, False
