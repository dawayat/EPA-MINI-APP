param([string]$Source = 'EPA_Articles_of_Association_Clean.docx')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Source))
function Read-Part($name) {
  $reader = [IO.StreamReader]::new($archive.GetEntry($name).Open())
  try { return [xml]$reader.ReadToEnd() } finally { $reader.Dispose() }
}
function Val($node, $path) {
  if (!$node) { return $null }
  $found = $node.SelectSingleNode($path, $ns)
  if ($found) { return $found.GetAttribute('val', $ns.LookupNamespace('w')) }
  return $null
}
function Format-Number([int]$value, [string]$format) {
  if ($format -eq 'upperRoman' -or $format -eq 'lowerRoman') {
    $roman = ''; $remaining = $value
    foreach ($pair in @(@(1000,'M'),@(900,'CM'),@(500,'D'),@(400,'CD'),@(100,'C'),@(90,'XC'),@(50,'L'),@(40,'XL'),@(10,'X'),@(9,'IX'),@(5,'V'),@(4,'IV'),@(1,'I'))) {
      while ($remaining -ge $pair[0]) { $roman += $pair[1]; $remaining -= $pair[0] }
    }
    if ($format -eq 'lowerRoman') { return $roman.ToLower() }; return $roman
  }
  if ($format -eq 'lowerLetter') { return [string][char](96 + $value) }
  if ($format -eq 'upperLetter') { return [string][char](64 + $value) }
  return [string]$value
}
try {
  $doc = Read-Part 'word/document.xml'; $styles = Read-Part 'word/styles.xml'; $numbering = Read-Part 'word/numbering.xml'
  $ns = [Xml.XmlNamespaceManager]::new($doc.NameTable)
  $ns.AddNamespace('w','http://schemas.openxmlformats.org/wordprocessingml/2006/main')
  $counts = @{}
  $paragraphs = @($doc.SelectNodes('//w:body/w:p | //w:body/w:tbl//w:p', $ns) | ForEach-Object {
    $p = $_
    $text = ($p.SelectNodes('.//w:t | .//w:tab | .//w:br', $ns) | ForEach-Object { if ($_.LocalName -eq 'tab') { "`t" } elseif ($_.LocalName -eq 'br') { "`n" } else { $_.'#text' } }) -join ''
    $style = Val $p './w:pPr/w:pStyle'
    $styleNode = $styles.SelectSingleNode("//w:style[@w:styleId='$style']", $ns)
    $numId = Val $p './w:pPr/w:numPr/w:numId'
    if ($null -eq $numId) { $numId = Val $styleNode './w:pPr/w:numPr/w:numId' }
    $level = Val $p './w:pPr/w:numPr/w:ilvl'
    if ($null -eq $level) { $level = Val $styleNode './w:pPr/w:numPr/w:ilvl' }
    if ($null -eq $level) { $level = 0 }; $level = [int]$level
    $label = ''
    if ($text.Trim() -and $numId -and $numId -ne '0') {
      $num = $numbering.SelectSingleNode("//w:num[@w:numId='$numId']", $ns)
      $abstractId = Val $num './w:abstractNumId'
      $definition = $numbering.SelectSingleNode("//w:abstractNum[@w:abstractNumId='$abstractId']", $ns)
      if (!$counts.ContainsKey($numId)) { $counts[$numId] = @{} }
      $counter = $counts[$numId]
      for ($l = 0; $l -le $level; $l++) {
        $start = Val $num "./w:lvlOverride[@w:ilvl='$l']/w:startOverride"
        if ($null -eq $start) { $start = Val $definition "./w:lvl[@w:ilvl='$l']/w:start" }
        if ($null -eq $start) { $start = 1 }
        if (!$counter.ContainsKey($l)) { $counter[$l] = [int]$start } elseif ($l -eq $level) { $counter[$l]++ }
      }
      foreach ($key in @($counter.Keys)) { if ($key -gt $level) { $counter.Remove($key) } }
      $lvl = $definition.SelectSingleNode("./w:lvl[@w:ilvl='$level']", $ns)
      $label = Val $lvl './w:lvlText'
      for ($l = 0; $l -le $level; $l++) {
        $format = Val $definition "./w:lvl[@w:ilvl='$l']/w:numFmt"
        if ($lvl.SelectSingleNode('./w:isLgl', $ns)) { $format = 'decimal' }
        $label = $label.Replace('%' + ($l + 1), (Format-Number $counter[$l] $format))
      }
    }
    if ($text.Trim()) { @{ text = $text; style = $style; label = $label; level = $level } }
  })
  New-Item -ItemType Directory -Force server-data | Out-Null
  @{title='Articles of Association'; source=$Source; paragraphs=$paragraphs} | ConvertTo-Json -Depth 6 | Set-Content -Encoding utf8 server-data/bylaws.json
  Write-Output "Imported $($paragraphs.Count) paragraphs."
} finally { $archive.Dispose() }
