$ErrorActionPreference = "SilentlyContinue"

docker rm -f prelegal | Out-Null
if ($?) {
    Write-Host "Prelegal stopped."
} else {
    Write-Host "Prelegal is not running."
}
