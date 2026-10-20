# =====================================================================
# build.ps1 - Generador del script unificado js/pages/editor-textos.js
# EduConta SV
# =====================================================================
# Concatena y transforma los modulos de js/pages/editor-textos/ en un unico
# script clasico autoejecutable (IIFE) para garantizar compatibilidad
# tanto en entornos web HTTP como en apertura local offline (file:///).
# =====================================================================

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = (Get-Item $scriptDir).Parent.Parent.Parent.FullName
$outputFile = Join-Path $rootDir "js\pages\editor-textos.js"

$modules = @(
    "constants.js",
    "spellcheck-dictionary.js",
    "color-picker.js",
    "audit.js",
    "stats.js",
    "export.js",
    "image-resizer.js",
    "images.js",
    "image-crop.js",
    "image-editor.js",
    "table-manager.js",
    "templates.js",
    "find-replace.js",
    "toc.js",
    "spellcheck.js",
    "layout.js",
    "engine.js",
    "text-engine.js",
    "collab.js",
    "state.js",
    "index.js"
)

$sb = New-Object System.Text.StringBuilder
$null = $sb.AppendLine("/**")
$null = $sb.AppendLine(" * =====================================================================")
$null = $sb.AppendLine(" * EduConta SV -- Motor Completo del Editor de Textos Documentales")
$null = $sb.AppendLine(" * Consolidado para compatibilidad offline universal (file:// y http://)")
$null = $sb.AppendLine(" * Generado desde los submodulos de js/pages/editor-textos/")
$null = $sb.AppendLine(" * Codificacion: UTF-8 sin BOM estricto")
$null = $sb.AppendLine(" * =====================================================================")
$null = $sb.AppendLine(" */")
$null = $sb.AppendLine("")
$null = $sb.AppendLine("(() => {")
$null = $sb.AppendLine("    'use strict';")
$null = $sb.AppendLine("")

foreach ($mod in $modules) {
    $filePath = Join-Path $scriptDir $mod
    if (-not (Test-Path $filePath)) {
        Write-Error "Modulo no encontrado: $filePath"
        exit 1
    }
    $content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
    
    # 1. Remover imports
    $content = [regex]::Replace($content, '(?m)^\s*import\s+[\s\S]*?from\s+[''"][^''"]+[''"];?\s*$', '')
    
    # 2. Remover export { ... };
    $content = [regex]::Replace($content, '(?m)^\s*export\s*\{[\s\S]*?\};?\s*$', '')
    
    # 3. Reemplazar export const/let/var/function/class
    $content = [regex]::Replace($content, '(?m)^\s*export\s+const\s+', 'const ')
    $content = [regex]::Replace($content, '(?m)^\s*export\s+let\s+', 'let ')
    $content = [regex]::Replace($content, '(?m)^\s*export\s+var\s+', 'var ')
    $content = [regex]::Replace($content, '(?m)^\s*export\s+function\s+', 'function ')
    $content = [regex]::Replace($content, '(?m)^\s*export\s+class\s+', 'class ')
    
    $null = $sb.AppendLine("    /* ===================================================================")
    $null = $sb.AppendLine("     * MODULO: $mod")
    $null = $sb.AppendLine("     * =================================================================== */")
    $null = $sb.AppendLine($content)
    $null = $sb.AppendLine("")
}

# Exposicion de utilidades adicionales a window
$null = $sb.AppendLine("    // --- Exposicion de utilidades adicionales a window ------------------")
$null = $sb.AppendLine("    window.PAGE_DIMENSIONS = PAGE_DIMENSIONS;")
$null = $sb.AppendLine("    window.MARGIN_PRESETS = MARGIN_PRESETS;")
$null = $sb.AppendLine("    window.SPECIAL_SYMBOLS = SPECIAL_SYMBOLS;")
$null = $sb.AppendLine("    window.EDUCONTA_COLOR_PRESETS = EDUCONTA_COLOR_PRESETS;")
$null = $sb.AppendLine("    window.mmToPx = mmToPx;")
$null = $sb.AppendLine("    window.SPANISH_ACCENT_MAP = SPANISH_ACCENT_MAP;")
$null = $sb.AppendLine("    window.isSpanishWord = isSpanishWord;")
$null = $sb.AppendLine("    window.isEnglishWord = isEnglishWord;")
$null = $sb.AppendLine("    window.damerauLevenshtein = damerauLevenshtein;")
$null = $sb.AppendLine("    window.getSmartSuggestions = getSmartSuggestions;")
$null = $sb.AppendLine("")
$null = $sb.AppendLine("})();")

$utf8NoBom = New-Object System.Text.UTF8Encoding($false, $false)
[System.IO.File]::WriteAllText($outputFile, $sb.ToString(), $utf8NoBom)
Write-Host "Script generado exitosamente en: $outputFile ($([System.IO.FileInfo]::new($outputFile).Length) bytes)"
