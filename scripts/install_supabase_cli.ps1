# Install Supabase CLI via Scoop
# Run this script in PowerShell: .\install_supabase_cli.ps1

Write-Host "Installing Supabase CLI..." -ForegroundColor Cyan

# Refresh environment variables to get Scoop in PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Add Supabase bucket
Write-Host "Adding Supabase bucket to Scoop..." -ForegroundColor Yellow
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git

# Install Supabase CLI
Write-Host "Installing Supabase CLI..." -ForegroundColor Yellow
scoop install supabase

# Verify installation
Write-Host "`nVerifying installation..." -ForegroundColor Yellow
supabase --version

Write-Host "`nSupabase CLI installed successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Run: supabase login" -ForegroundColor White
Write-Host "2. Run: supabase link --project-ref YOUR_PROJECT_ID" -ForegroundColor White
Write-Host "3. Run: supabase functions deploy avatar-chat" -ForegroundColor White
Write-Host "4. Run: supabase functions deploy avatar-config" -ForegroundColor White
