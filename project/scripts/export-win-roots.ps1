# Exports the Windows trusted-root CA store (including any corporate TLS-inspection CA)
# to certs/win-roots.pem so Node can verify HTTPS without disabling cert checks.
# Run once on a network that intercepts TLS:  npm run setup:certs
$out = Join-Path $PSScriptRoot "..\certs\win-roots.pem"
New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null
$certs = Get-ChildItem Cert:\LocalMachine\Root, Cert:\CurrentUser\Root -ErrorAction SilentlyContinue
$lines = foreach ($c in $certs) {
  "-----BEGIN CERTIFICATE-----"
  [Convert]::ToBase64String($c.RawData, 'InsertLineBreaks')
  "-----END CERTIFICATE-----"
}
$lines | Out-File -FilePath $out -Encoding ascii
"Exported $($certs.Count) root certs to $out"
