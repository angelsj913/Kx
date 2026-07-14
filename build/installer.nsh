; ZEFF AI — custom NSIS branding hooks (electron-builder)
; License accept is enforced via "license": "build/license.txt" in package.json

!macro customHeader
  !system "echo ZEFF AI Windows Installer"
!macroend

; Shown on the license page footer area context (MUI strings)
!macro customWelcomePage
  ; Default welcome + our product name emphasis
!macroend

!macro customInstallMode
!macroend

; After install files — optional finish branding handled by electron-builder
!macro customFinishPage
!macroend
