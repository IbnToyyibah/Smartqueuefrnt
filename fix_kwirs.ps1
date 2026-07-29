$file = 'C:\Users\HP\Desktop\SmartQueue\server\src\seed.js'
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$content = $content -replace 'KWIRS\s+[^\w\s]+\s+Kwara', 'KWIRS - Kwara'
[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Host "Fixed KWIRS name in seed.js"
