# Fix ALL duplicate first-line imports in JSX files across the project
$srcPath = "C:\Users\HP\Desktop\SmartQueue\smartqueue\src"
$files = Get-ChildItem -Path $srcPath -Recurse -Filter "*.jsx"
$fixed = 0

foreach ($f in $files) {
  $lines = [System.IO.File]::ReadAllLines($f.FullName)
  if ($lines.Length -lt 2) { continue }

  $changed = $true
  while ($changed -and $lines.Length -ge 2) {
    $changed = $false
    if ($lines[0].Trim() -ne "" -and $lines[0].Trim() -eq $lines[1].Trim()) {
      $lines = @($lines[0]) + $lines[2..($lines.Length - 1)]
      $changed = $true
    }
  }

  $original = [System.IO.File]::ReadAllLines($f.FullName)
  if ($lines.Length -ne $original.Length) {
    [System.IO.File]::WriteAllLines($f.FullName, $lines, [System.Text.Encoding]::UTF8)
    Write-Host "Fixed: $($f.Name)"
    $fixed++
  }
}

# Also fix QueueContext.jsx which has a broken double import {
$qcFile = "C:\Users\HP\Desktop\SmartQueue\smartqueue\src\context\QueueContext.jsx"
$content = [System.IO.File]::ReadAllText($qcFile, [System.Text.Encoding]::UTF8)
# Remove the duplicate 'import {' at start if present
if ($content -match "^import \{\nimport \{") {
  $content = $content -replace "^import \{\nimport \{", "import {"
  [System.IO.File]::WriteAllText($qcFile, $content, [System.Text.Encoding]::UTF8)
  Write-Host "Fixed QueueContext double import {"
}

Write-Host ""
Write-Host "Total files fixed: $fixed"
