; ZEFF AI — custom NSIS branding + UX hooks (electron-builder / MUI2)
; License accept is enforced via "license": "build/license.txt" in package.json.

!macro customHeader
  !system "echo ZEFF AI Windows Installer"

  ; ── 약관 페이지에 "동의합니다" 체크박스 표시 ──
  ; 체크해야만 [다음]이 활성화된다(동의를 명시적으로 강조).
  !define MUI_LICENSEPAGE_CHECKBOX

  ; ── 완료 화면: "바탕 화면에 바로 가기 만들기" 체크박스(기본 체크) ──
  ; MUI 완료 페이지의 readme 체크박스를 바로가기 생성 토글로 재사용한다.
  ; 체크하면 CreateZeffDesktopShortcut가 실행되고, 해제하면 아무 것도 안 만든다.
  ; (package.json에서 electron-builder 자동 바탕화면 바로가기는 꺼 둔다.)
  ; customFinishPage 매크로를 정의하지 않아야 electron-builder 기본 완료 페이지가
  ; 이 SHOWREADME 정의를 그대로 사용한다.
  !define MUI_FINISHPAGE_SHOWREADME ""
  !define MUI_FINISHPAGE_SHOWREADME_CHECKED
  !define MUI_FINISHPAGE_SHOWREADME_TEXT "바탕 화면에 바로 가기 만들기"
  !define MUI_FINISHPAGE_SHOWREADME_FUNCTION CreateZeffDesktopShortcut
!macroend

; 완료 화면 체크박스가 켜진 채 [마침]을 누르면 호출된다.
Function CreateZeffDesktopShortcut
  CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
FunctionEnd

!macro customWelcomePage
!macroend

!macro customInstallMode
!macroend

; 제거 시 우리가 직접 만든 바탕화면 바로가기도 정리한다.
!macro customUnInstall
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
!macroend
