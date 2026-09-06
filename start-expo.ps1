$log = "$env:TEMP\expo-start.log"
Set-Location "$PSScriptRoot\app"
npx.cmd expo start --tunnel *> $log
