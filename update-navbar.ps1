# Script pour mettre à jour la barre de navigation sur toutes les pages HTML
$files = Get-ChildItem -Path "public" -Filter "*.html"

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $modified = $false
    
    # Ajouter le lien vers navbar.css s'il n'existe pas déjà
    if (-not ($content -match '<link[^>]*href="css/navbar\.css"[^>]*>')) {
        Write-Host "Ajout de navbar.css à $($file.Name)"
        $content = $content -replace '(<link[^>]*rel="stylesheet"[^>]*>)(?!.*?<link[^>]*navbar\.css)',
                            '$1' + "`n  <link rel=`"stylesheet`" href=`"css/navbar.css`">"
        $modified = $true
    }
    
    # Remplacer le script de menu mobile par une référence à navbar.js
    if ($content -match '<script>.*?mobile-menu-toggle.*?</script>' -and -not ($content -match '<script[^>]*src="js/navbar\.js"[^>]*></script>')) {
        Write-Host "Ajout de navbar.js à $($file.Name)"
        $content = $content -replace '(?s)<script>.*?mobile-menu-toggle.*?</script>',
                            '<script src="js/navbar.js"></script>'
        $modified = $true
    }
    
    # Ajouter navbar.js si aucun script ne gère le menu mobile et s'il n'est pas déjà inclus
    if (-not ($content -match 'mobile-menu-toggle') -and -not ($content -match '<script[^>]*src="js/navbar\.js"[^>]*></script>')) {
        Write-Host "Ajout de navbar.js à $($file.Name) (pas de menu mobile trouvé)"
        $content = $content -replace '</body>',
                            '  <script src="js/navbar.js"></script>' + "`n</body>"
        $modified = $true
    }
    
    # Sauvegarder les modifications si nécessaire
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "Mise à jour de $($file.Name) terminée."
    } else {
        Write-Host "Aucune modification requise pour $($file.Name)"
    }
}

Write-Host "Traitement terminé pour toutes les pages HTML." 