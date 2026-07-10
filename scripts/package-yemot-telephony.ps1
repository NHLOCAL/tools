[CmdletBinding()]
param(
    [Parameter()]
    [string]$SkillPath = (Join-Path $PSScriptRoot '..\skills\yemot-telephony'),

    [Parameter()]
    [string]$OutputPath = (Join-Path $PSScriptRoot '..\dist\yemot-telephony.zip')
)

$ErrorActionPreference = 'Stop'

$resolvedSkill = (Resolve-Path -LiteralPath $SkillPath).Path
if (-not (Test-Path -LiteralPath (Join-Path $resolvedSkill 'SKILL.md') -PathType Leaf)) {
    throw "SKILL.md was not found in $resolvedSkill"
}

$outputFullPath = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = [System.IO.Path]::GetDirectoryName($outputFullPath)
[System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$excludedDirectories = @('__pycache__', '.pytest_cache')
$files = Get-ChildItem -LiteralPath $resolvedSkill -Recurse -File |
    Where-Object {
        $relative = [System.IO.Path]::GetRelativePath($resolvedSkill, $_.FullName)
        $segments = $relative -split '[\\/]'
        $_.FullName -ne $outputFullPath -and
            $_.Name -ne '.DS_Store' -and
            -not ($segments | Where-Object { $_ -in $excludedDirectories })
    } |
    Sort-Object { [System.IO.Path]::GetRelativePath($resolvedSkill, $_.FullName) }

$skillName = [System.IO.Path]::GetFileName($resolvedSkill.TrimEnd('\', '/'))
$fixedTimestamp = [System.DateTimeOffset]::Parse('2000-01-01T00:00:00Z')
$stream = [System.IO.File]::Open($outputFullPath, [System.IO.FileMode]::Create)
try {
    $archive = [System.IO.Compression.ZipArchive]::new(
        $stream,
        [System.IO.Compression.ZipArchiveMode]::Create,
        $false,
        [System.Text.Encoding]::UTF8
    )
    try {
        foreach ($file in $files) {
            $relative = [System.IO.Path]::GetRelativePath($resolvedSkill, $file.FullName)
            $entryName = ($skillName + '/' + $relative.Replace('\', '/'))
            $entry = $archive.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Optimal)
            $entry.LastWriteTime = $fixedTimestamp
            $input = [System.IO.File]::OpenRead($file.FullName)
            try {
                $entryStream = $entry.Open()
                try {
                    $input.CopyTo($entryStream)
                }
                finally {
                    $entryStream.Dispose()
                }
            }
            finally {
                $input.Dispose()
            }
        }
    }
    finally {
        $archive.Dispose()
    }
}
finally {
    $stream.Dispose()
}

Write-Output "Created $outputFullPath with $($files.Count) files."
