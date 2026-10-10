; =============================================================================
; ECHO PROTOCOL — Script de Inno Setup 7
; -----------------------------------------------------------------------------
; Genera un ÚNICO instalador .exe (EchoProtocol-Setup-<versión>.exe) que
; instala el binario de Tauri (que ya lleva dentro el juego web embebido).
;
; Uso:
;   npm run installer        # tauri build + ISCC (este script)
;   "C:\Program Files\Inno Setup 7\ISCC.exe" installer\EchoProtocol.iss
; =============================================================================

#define MyAppName "Echo Protocol"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Alberto Ortiz"
#define MyAppExeName "echo-protocol.exe"

; Ruta del binario que produce `tauri build` (target/release en Windows nativo)
#define TauriExe "..\src-tauri\target\release\echo-protocol.exe"

[Setup]
; AppId debe ser estable entre versiones: así el desinstalador antiguo se
; reemplaza en lugar de instalar dos copias.
AppId={{B7E1C4A2-5D3F-4E8B-9C21-7A64E0F1D3C5}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
VersionInfoVersion={#MyAppVersion}
VersionInfoProductTextVersion={#MyAppVersion}

DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes

; --- Salida: un solo .exe ---
OutputDir=output
OutputBaseFilename=EchoProtocol-Setup-{#MyAppVersion}

; --- Icono (mismo icono del juego, convertido por `tauri icon`) ---
SetupIconFile=..\src-tauri\icons\icon.ico
UninstallDisplayIcon={app}\{#MyAppExeName}

; --- Compresión: máximo (el binario es ~10 MB, comprime muy bien) ---
Compression=lzma2/max
SolidCompression=yes
LZMANumBlockThreads=4

; --- Sólo 64 bits ---
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

; --- Privilegios y apariencia ---
PrivilegesRequired=admin
WizardStyle=modern
DisableWelcomePage=no
DisableReadyPage=no
ShowLanguageDialog=no

; --- Cierre de aplicaciones en uso ---
CloseApplications=yes

UninstallDisplayName={#MyAppName}

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "startmenuicon"; Description: "{cm:CreateStartMenuIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
; El binario de Tauri ya lleva dentro el juego web (dist/) embebido: no hace
; falta instalar ningún archivo suelto.
Source: "{#TauriExe}"; DestDir: "{app}"; Flags: ignoreversion
; Bootstrapper de WebView2: sólo se ejecuta si el PC no tiene el runtime.
Source: "MicrosoftEdgeWebview2Setup.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\Desinstalar {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
Name: "{userstartmenu}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: startmenuicon

[Run]
; Si falta el WebView2 Runtime, se instala con el bootstrapper oficial.
Filename: "{tmp}\MicrosoftEdgeWebview2Setup.exe"; \
  Parameters: "/silent /install"; \
  StatusMsg: "Instalando Microsoft Edge WebView2 Runtime..."; \
  Check: not IsWebView2Installed

Filename: "{app}\{#MyAppExeName}"; \
  Description: "{cm:LaunchProgram,{#MyAppName}}"; \
  Flags: nowait postinstall skipifsilent

[UninstallDelete]
; Por si el juego crea datos junto al ejecutable.
Type: filesandordirs; Name: "{app}\logs"

[Code]
// -----------------------------------------------------------------------------
// ¿Está instalado el WebView2 Runtime (Evergreen)?
// Detecta la clave que usa Microsoft Edge Update en Windows de 64 bits.
// -----------------------------------------------------------------------------
const
  WV2_CLIENT_ID = '{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}';

function IsWebView2Installed(): Boolean;
var
  Version: String;
begin
  Result := RegQueryStringValue(
              HKLM64,
              'SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\' + WV2_CLIENT_ID,
              'pv', Version)
            and (Version <> '') and (Version <> '0.0.0.0');
  if not Result then
    Result := RegQueryStringValue(
                HKLM32,
                'SOFTWARE\Microsoft\EdgeUpdate\Clients\' + WV2_CLIENT_ID,
                'pv', Version)
              and (Version <> '') and (Version <> '0.0.0.0');
end;

// -----------------------------------------------------------------------------
// Aviso si el equipo no cumple los requisitos mínimos del juego (WebGL).
// -----------------------------------------------------------------------------
function InitializeSetup(): Boolean;
begin
  Result := True;
  if not IsWebView2Installed then
    MsgBox('Este equipo no tiene Microsoft Edge WebView2 Runtime. El instalador'
           + ' lo instalará automáticamente (requiere conexión a internet).',
           mbInformation, MB_OK);
end;
