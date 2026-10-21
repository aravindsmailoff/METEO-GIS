$ninjaPath = "d:\GIS Dashboard\rainmap\node_modules\.pnpm\react-native-worklets@0.10._869b8fd34130ad92c3e97ddf523e0f0d\node_modules\react-native-worklets\android\.cxx\RelWithDebInfo\6k1m93s4\arm64-v8a\build.ninja"
$ninja = Get-Item $ninjaPath
$dir = $ninja.DirectoryName
$line = (Get-Content $ninja.FullName | Select-String -Pattern '^build build\.ninja: RERUN_CMAKE \| (.*)').Matches.Groups[1].Value

# split considering space escaping
$files = $line -split ' (?=[^ ])'
foreach ($item in $files) {
    $clean = $item.Replace('$', '').Trim()
    if (-not [System.IO.Path]::IsPathRooted($clean)) {
        $clean = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($dir, $clean))
    }
    if (Test-Path $clean) {
        $fi = Get-Item $clean
        if ($fi.LastWriteTimeUtc -ge $ninja.LastWriteTimeUtc) {
            Write-Host "NEWER OR EQUAL: $($fi.FullName) ($($fi.LastWriteTimeUtc)) vs ninja ($($ninja.LastWriteTimeUtc))"
        }
    } else {
        Write-Host "NOT FOUND: $clean"
    }
}
