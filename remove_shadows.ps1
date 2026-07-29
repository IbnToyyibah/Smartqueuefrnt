$srcPath = "C:\Users\HP\Desktop\SmartQueue\smartqueue\src"
$files = Get-ChildItem -Path $srcPath -Recurse -Include "*.jsx","*.css" | Where-Object { $_.FullName -notlike "*node_modules*" }

$patterns = @(
  ' shadow-2xl', ' shadow-xl', ' shadow-lg', ' shadow-md', ' shadow-sm',
  ' shadow-slate-200/60', ' shadow-violet-200', ' shadow-blue-500/20',
  ' shadow-indigo-200', ' shadow-emerald-200', ' shadow-red-200',
  ' shadow-amber-200', ' hover:shadow-md', ' hover:shadow-sm',
  ' transition-shadow', ' shadow-inner'
)

$changed = 0
foreach ($f in $files) {
  $content = [System.IO.File]::ReadAllText($f.FullName)
  $original = $content
  foreach ($p in $patterns) {
    $content = $content.Replace($p, '')
  }
  if ($content -ne $original) {
    [System.IO.File]::WriteAllText($f.FullName, $content, [System.Text.Encoding]::UTF8)
    Write-Host "Cleaned: $($f.Name)"
    $changed++
  }
}
Write-Host ""
Write-Host "Done. $changed file(s) updated."
