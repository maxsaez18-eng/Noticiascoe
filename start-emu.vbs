Set WshShell = CreateObject("WScript.Shell")
cmd = "C:\Users\Tokyotech\AppData\Local\Android\Sdk\emulator\emulator.exe -avd Medium_Phone"
WshShell.Run cmd, 0, False
