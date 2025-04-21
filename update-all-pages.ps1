# Script pour ajouter les liens navbar.css et navbar.js à toutes les pages
$htmlFiles = Get-ChildItem -Path "./public" -Filter "*.html"

foreach ($file in $htmlFiles) {
    $content = Get-Content -Path $file.FullName -Encoding UTF8
    $modified = $false
    $contentNew = @()

    # Ajouter navbar.css
    $cssAdded = $false
    for ($i = 0; $i -lt $content.Count; $i++) {
        $contentNew += $content[$i]
        
        # Après un lien stylesheet, ajouter navbar.css s'il n'est pas déjà là
        if (-not $cssAdded -and 
            $content[$i] -match 'rel="stylesheet"' -and 
            -not ($content -join "`n" -match 'href="css/navbar.css"')) {
            $contentNew += '<link href="css/navbar.css" rel="stylesheet">'
            $cssAdded = $true
            $modified = $true
            Write-Host "Ajout de navbar.css à $($file.Name)"
        }
    }

    # S'il y a un script à la fin pour le menu mobile, le remplacer par navbar.js
    $finalContent = $contentNew -join "`n"
    if ($finalContent -match '(?s)<script>.*?mobile-menu-toggle.*?</script>') {
        $finalContent = $finalContent -replace '(?s)<script>.*?mobile-menu-toggle.*?</script>', '<script src="js/navbar.js"></script>'
        $modified = $true
        Write-Host "Remplacement du script mobile par navbar.js dans $($file.Name)"
    }
    # Sinon, ajouter navbar.js avant </body> s'il n'est pas déjà là
    elseif (-not ($finalContent -match 'src="js/navbar.js"')) {
        $finalContent = $finalContent -replace '</body>', '<script src="js/navbar.js"></script>`n</body>'
        $modified = $true
        Write-Host "Ajout de navbar.js à $($file.Name)"
    }

    # Sauvegarder les modifications
    if ($modified) {
        [System.IO.File]::WriteAllText($file.FullName, $finalContent, [System.Text.Encoding]::UTF8)
        Write-Host "Mise à jour de $($file.Name) terminée."
    } else {
        Write-Host "Aucune modification nécessaire pour $($file.Name)"
    }
}

Write-Host "Traitement terminé pour toutes les pages HTML." 