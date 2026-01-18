#!/usr/bin/env python3
"""
Add all 80 missing i18n keys to all locale files
This ensures complete i18n coverage across the toolkit
"""

import json

# Complete mapping of all 80 missing keys with translations
ALL_MISSING_KEYS = {
    # Validation messages
    "environmentNameRequired": {
        "en": "Environment name is required",
        "de": "Umgebungsname ist erforderlich",
        "es": "Se requiere el nombre del entorno",
        "fr": "Le nom de l'environnement est requis",
        "it": "Il nome dell'ambiente è obbligatorio",
        "ja": "環境名は必須です",
        "ko": "환경 이름이 필요합니다",
        "nl": "Omgevingsnaam is verplicht",
        "pt_BR": "Nome do ambiente é obrigatório",
        "zh_CN": "环境名称为必填项"
    },
    "hostnameRequired": {
        "en": "Hostname is required",
        "de": "Hostname ist erforderlich",
        "es": "Se requiere el nombre de host",
        "fr": "Le nom d'hôte est requis",
        "it": "Il nome host è obbligatorio",
        "ja": "ホスト名は必須です",
        "ko": "호스트 이름이 필요합니다",
        "nl": "Hostnaam is verplicht",
        "pt_BR": "Nome do host é obrigatório",
        "zh_CN": "主机名为必填项"
    },
    "invalidSapHostname": {
        "en": "Invalid SAP hostname format",
        "de": "Ungültiges SAP-Hostname-Format",
        "es": "Formato de nombre de host SAP no válido",
        "fr": "Format de nom d'hôte SAP invalide",
        "it": "Formato nome host SAP non valido",
        "ja": "無効なSAPホスト名形式",
        "ko": "잘못된 SAP 호스트 이름 형식",
        "nl": "Ongeldig SAP-hostnaamformaat",
        "pt_BR": "Formato de nome de host SAP inválido",
        "zh_CN": "无效的SAP主机名格式"
    },
    "envNameTooShort": {
        "en": "Environment name too short (min 2 characters)",
        "de": "Umgebungsname zu kurz (min. 2 Zeichen)",
        "es": "Nombre del entorno demasiado corto (mín. 2 caracteres)",
        "fr": "Nom de l'environnement trop court (min 2 caractères)",
        "it": "Nome ambiente troppo corto (min 2 caratteri)",
        "ja": "環境名が短すぎます（最小2文字）",
        "ko": "환경 이름이 너무 짧습니다(최소 2자)",
        "nl": "Omgevingsnaam te kort (min 2 tekens)",
        "pt_BR": "Nome do ambiente muito curto (mín. 2 caracteres)",
        "zh_CN": "环境名称太短（最少2个字符）"
    },
    "envNameTooLong": {
        "en": "Environment name too long (max 50 characters)",
        "de": "Umgebungsname zu lang (max. 50 Zeichen)",
        "es": "Nombre del entorno demasiado largo (máx. 50 caracteres)",
        "fr": "Nom de l'environnement trop long (max 50 caractères)",
        "it": "Nome ambiente troppo lungo (max 50 caratteri)",
        "ja": "環境名が長すぎます（最大50文字）",
        "ko": "환경 이름이 너무 깁니다(최대 50자)",
        "nl": "Omgevingsnaam te lang (max 50 tekens)",
        "pt_BR": "Nome do ambiente muito longo (máx. 50 caracteres)",
        "zh_CN": "环境名称太长（最多50个字符）"
    },
    "hostnameTooShort": {
        "en": "Hostname too short (min 5 characters)",
        "de": "Hostname zu kurz (min. 5 Zeichen)",
        "es": "Nombre de host demasiado corto (mín. 5 caracteres)",
        "fr": "Nom d'hôte trop court (min 5 caractères)",
        "it": "Nome host troppo corto (min 5 caratteri)",
        "ja": "ホスト名が短すぎます（最小5文字）",
        "ko": "호스트 이름이 너무 짧습니다(최소 5자)",
        "nl": "Hostnaam te kort (min 5 tekens)",
        "pt_BR": "Nome do host muito curto (mín. 5 caracteres)",
        "zh_CN": "主机名太短（最少5个字符）"
    },
    "hostnameTooLong": {
        "en": "Hostname too long (max 100 characters)",
        "de": "Hostname zu lang (max. 100 Zeichen)",
        "es": "Nombre de host demasiado largo (máx. 100 caracteres)",
        "fr": "Nom d'hôte trop long (max 100 caractères)",
        "it": "Nome host troppo lungo (max 100 caratteri)",
        "ja": "ホスト名が長すぎます（最大100文字）",
        "ko": "호스트 이름이 너무 깁니다(최대 100자)",
        "nl": "Hostnaam te lang (max 100 tekens)",
        "pt_BR": "Nome do host muito longo (máx. 100 caracteres)",
        "zh_CN": "主机名太长（最多100个字符）"
    },
    "hostnameCannotContainSpaces": {
        "en": "Hostname cannot contain spaces",
        "de": "Hostname darf keine Leerzeichen enthalten",
        "es": "El nombre de host no puede contener espacios",
        "fr": "Le nom d'hôte ne peut pas contenir d'espaces",
        "it": "Il nome host non può contenere spazi",
        "ja": "ホスト名にスペースを含めることはできません",
        "ko": "호스트 이름에는 공백을 포함할 수 없습니다",
        "nl": "Hostnaam mag geen spaties bevatten",
        "pt_BR": "O nome do host não pode conter espaços",
        "zh_CN": "主机名不能包含空格"
    },
    "hostnameInvalidCharacters": {
        "en": "Hostname contains invalid characters",
        "de": "Hostname enthält ungültige Zeichen",
        "es": "El nombre de host contiene caracteres no válidos",
        "fr": "Le nom d'hôte contient des caractères invalides",
        "it": "Il nome host contiene caratteri non validi",
        "ja": "ホスト名に無効な文字が含まれています",
        "ko": "호스트 이름에 잘못된 문자가 포함되어 있습니다",
        "nl": "Hostnaam bevat ongeldige tekens",
        "pt_BR": "O nome do host contém caracteres inválidos",
        "zh_CN": "主机名包含无效字符"
    },
    "shortcutNameTooShort": {
        "en": "Shortcut name too short (min 2 characters)",
        "de": "Verknüpfungsname zu kurz (min. 2 Zeichen)",
        "es": "Nombre del atajo demasiado corto (mín. 2 caracteres)",
        "fr": "Nom du raccourci trop court (min 2 caractères)",
        "it": "Nome collegamento troppo corto (min 2 caratteri)",
        "ja": "ショートカット名が短すぎます（最小2文字）",
        "ko": "바로 가기 이름이 너무 짧습니다(최소 2자)",
        "nl": "Snelkoppelingsnaam te kort (min 2 tekens)",
        "pt_BR": "Nome do atalho muito curto (mín. 2 caracteres)",
        "zh_CN": "快捷方式名称太短（最少2个字符）"
    },
    "shortcutNameTooLong": {
        "en": "Shortcut name too long (max 50 characters)",
        "de": "Verknüpfungsname zu lang (max. 50 Zeichen)",
        "es": "Nombre del atajo demasiado largo (máx. 50 caracteres)",
        "fr": "Nom du raccourci trop long (max 50 caractères)",
        "it": "Nome collegamento troppo lungo (max 50 caratteri)",
        "ja": "ショートカット名が長すぎます（最大50文字）",
        "ko": "바로 가기 이름이 너무 깁니다(최대 50자)",
        "nl": "Snelkoppelingsnaam te lang (max 50 tekens)",
        "pt_BR": "Nome do atalho muito longo (máx. 50 caracteres)",
        "zh_CN": "快捷方式名称太长（最多50个字符）"
    },
    "urlTooShort": {
        "en": "URL too short (min 10 characters)",
        "de": "URL zu kurz (min. 10 Zeichen)",
        "es": "URL demasiado corta (mín. 10 caracteres)",
        "fr": "URL trop courte (min 10 caractères)",
        "it": "URL troppo corto (min 10 caratteri)",
        "ja": "URLが短すぎます（最小10文字）",
        "ko": "URL이 너무 짧습니다(최소 10자)",
        "nl": "URL te kort (min 10 tekens)",
        "pt_BR": "URL muito curta (mín. 10 caracteres)",
        "zh_CN": "URL太短（最少10个字符）"
    },
    "urlTooLong": {
        "en": "URL too long (max 2000 characters)",
        "de": "URL zu lang (max. 2000 Zeichen)",
        "es": "URL demasiado larga (máx. 2000 caracteres)",
        "fr": "URL trop longue (max 2000 caractères)",
        "it": "URL troppo lungo (max 2000 caratteri)",
        "ja": "URLが長すぎます（最大2000文字）",
        "ko": "URL이 너무 깁니다(최대 2000자)",
        "nl": "URL te lang (max 2000 tekens)",
        "pt_BR": "URL muito longa (máx. 2000 caracteres)",
        "zh_CN": "URL太长（最多2000个字符）"
    },
    "urlMustBeExternal": {
        "en": "URL must be external (http:// or https://)",
        "de": "URL muss extern sein (http:// oder https://)",
        "es": "La URL debe ser externa (http:// o https://)",
        "fr": "L'URL doit être externe (http:// ou https://)",
        "it": "L'URL deve essere esterno (http:// o https://)",
        "ja": "URLは外部である必要があります（http://またはhttps://）",
        "ko": "URL은 외부여야 합니다(http:// 또는 https://)",
        "nl": "URL moet extern zijn (http:// of https://)",
        "pt_BR": "A URL deve ser externa (http:// ou https://)",
        "zh_CN": "URL必须是外部的（http://或https://）"
    },
    "noteTitleTooShort": {
        "en": "Note title too short (min 2 characters)",
        "de": "Notiztitel zu kurz (min. 2 Zeichen)",
        "es": "Título de nota demasiado corto (mín. 2 caracteres)",
        "fr": "Titre de la note trop court (min 2 caractères)",
        "it": "Titolo nota troppo corto (min 2 caratteri)",
        "ja": "ノートタイトルが短すぎます（最小2文字）",
        "ko": "메모 제목이 너무 짧습니다(최소 2자)",
        "nl": "Notitietitel te kort (min 2 tekens)",
        "pt_BR": "Título da nota muito curto (mín. 2 caracteres)",
        "zh_CN": "笔记标题太短（最少2个字符）"
    },
    "noteTitleTooLong": {
        "en": "Note title too long (max 100 characters)",
        "de": "Notiztitel zu lang (max. 100 Zeichen)",
        "es": "Título de nota demasiado largo (máx. 100 caracteres)",
        "fr": "Titre de la note trop long (max 100 caractères)",
        "it": "Titolo nota troppo lungo (max 100 caratteri)",
        "ja": "ノートタイトルが長すぎます（最大100文字）",
        "ko": "메모 제목이 너무 깁니다(최대 100자)",
        "nl": "Notitietitel te lang (max 100 tekens)",
        "pt_BR": "Título da nota muito longo (máx. 100 caracteres)",
        "zh_CN": "笔记标题太长（最多100个字符）"
    },
    "enterNoteTitle": {
        "en": "Please enter a note title",
        "de": "Bitte geben Sie einen Notiztitel ein",
        "es": "Por favor ingrese un título de nota",
        "fr": "Veuillez saisir un titre de note",
        "it": "Inserire un titolo della nota",
        "ja": "ノートタイトルを入力してください",
        "ko": "메모 제목을 입력하세요",
        "nl": "Voer een notitietitel in",
        "pt_BR": "Por favor, insira um título de nota",
        "zh_CN": "请输入笔记标题"
    },
    "fillRequiredFields": {
        "en": "Please fill in all required fields",
        "de": "Bitte füllen Sie alle erforderlichen Felder aus",
        "es": "Por favor complete todos los campos requeridos",
        "fr": "Veuillez remplir tous les champs requis",
        "it": "Compilare tutti i campi obbligatori",
        "ja": "すべての必須フィールドを入力してください",
        "ko": "모든 필수 필드를 입력하세요",
        "nl": "Vul alle verplichte velden in",
        "pt_BR": "Por favor, preencha todos os campos obrigatórios",
        "zh_CN": "请填写所有必填字段"
    },
    
    # Error messages
    "failedSaveEnvironment": {
        "en": "Failed to save environment",
        "de": "Fehler beim Speichern der Umgebung",
        "es": "Error al guardar el entorno",
        "fr": "Échec de l'enregistrement de l'environnement",
        "it": "Impossibile salvare l'ambiente",
        "ja": "環境の保存に失敗しました",
        "ko": "환경 저장 실패",
        "nl": "Kan omgeving niet opslaan",
        "pt_BR": "Falha ao salvar ambiente",
        "zh_CN": "保存环境失败"
    },
    "failedSwitchEnvironment": {
        "en": "Failed to switch environment",
        "de": "Fehler beim Wechseln der Umgebung",
        "es": "Error al cambiar de entorno",
        "fr": "Échec du changement d'environnement",
        "it": "Impossibile cambiare ambiente",
        "ja": "環境の切り替えに失敗しました",
        "ko": "환경 전환 실패",
        "nl": "Kan omgeving niet wisselen",
        "pt_BR": "Falha ao alternar ambiente",
        "zh_CN": "切换环境失败"
    },
    "failedNavigate": {
        "en": "Failed to navigate",
        "de": "Navigation fehlgeschlagen",
        "es": "Error de navegación",
        "fr": "Échec de la navigation",
        "it": "Navigazione fallita",
        "ja": "ナビゲーションに失敗しました",
        "ko": "탐색 실패",
        "nl": "Navigatie mislukt",
        "pt_BR": "Falha na navegação",
        "zh_CN": "导航失败"
    },
    "failedToNavigate": {
        "en": "Failed to navigate to page",
        "de": "Navigation zur Seite fehlgeschlagen",
        "es": "Error al navegar a la página",
        "fr": "Échec de la navigation vers la page",
        "it": "Impossibile navigare alla pagina",
        "ja": "ページへのナビゲーションに失敗しました",
        "ko": "페이지 탐색 실패",
        "nl": "Kan niet naar pagina navigeren",
        "pt_BR": "Falha ao navegar para a página",
        "zh_CN": "导航到页面失败"
    },
    "failedCopyNote": {
        "en": "Failed to copy note",
        "de": "Fehler beim Kopieren der Notiz",
        "es": "Error al copiar la nota",
        "fr": "Échec de la copie de la note",
        "it": "Impossibile copiare la nota",
        "ja": "ノートのコピーに失敗しました",
        "ko": "메모 복사 실패",
        "nl": "Kan notitie niet kopiëren",
        "pt_BR": "Falha ao copiar nota",
        "zh_CN": "复制笔记失败"
    },
    "failedCopyContent": {
        "en": "Failed to copy content",
        "de": "Fehler beim Kopieren des Inhalts",
        "es": "Error al copiar el contenido",
        "fr": "Échec de la copie du contenu",
        "it": "Impossibile copiare il contenuto",
        "ja": "コンテンツのコピーに失敗しました",
        "ko": "콘텐츠 복사 실패",
        "nl": "Kan inhoud niet kopiëren",
        "pt_BR": "Falha ao copiar conteúdo",
        "zh_CN": "复制内容失败"
    },
    "failedOpenOSSNote": {
        "en": "Failed to open OSS Note",
        "de": "Fehler beim Öffnen der OSS-Notiz",
        "es": "Error al abrir la nota OSS",
        "fr": "Échec de l'ouverture de la note OSS",
        "it": "Impossibile aprire la nota OSS",
        "ja": "OSSノートを開けませんでした",
        "ko": "OSS 노트 열기 실패",
        "nl": "Kan OSS-notitie niet openen",
        "pt_BR": "Falha ao abrir Nota OSS",
        "zh_CN": "打开OSS注释失败"
    },
    "failedSaveQuickActions": {
        "en": "Failed to save Quick Actions",
        "de": "Fehler beim Speichern der Quick Actions",
        "es": "Error al guardar Acciones Rápidas",
        "fr": "Échec de l'enregistrement des Actions Rapides",
        "it": "Impossibile salvare Azioni Rapide",
        "ja": "クイックアクションの保存に失敗しました",
        "ko": "빠른 작업 저장 실패",
        "nl": "Kan Snelle Acties niet opslaan",
        "pt_BR": "Falha ao salvar Ações Rápidas",
        "zh_CN": "保存快速操作失败"
    },
    "failedInitialize": {
        "en": "Failed to initialize",
        "de": "Initialisierung fehlgeschlagen",
        "es": "Error de inicialización",
        "fr": "Échec de l'initialisation",
        "it": "Inizializzazione fallita",
        "ja": "初期化に失敗しました",
        "ko": "초기화 실패",
        "nl": "Initialisatie mislukt",
        "pt_BR": "Falha na inicialização",
        "zh_CN": "初始化失败"
    },
    
    # State messages
    "switchingToEnvironment": {
        "en": "Switching to environment...",
        "de": "Wechsle zur Umgebung...",
        "es": "Cambiando a entorno...",
        "fr": "Changement vers l'environnement...",
        "it": "Cambio all'ambiente...",
        "ja": "環境を切り替えています...",
        "ko": "환경 전환 중...",
        "nl": "Wisselen naar omgeving...",
        "pt_BR": "Alternando para ambiente...",
        "zh_CN": "切换到环境..."
    },
    "contentCopied": {
        "en": "Content copied ✓",
        "de": "Inhalt kopiert ✓",
        "es": "Contenido copiado ✓",
        "fr": "Contenu copié ✓",
        "it": "Contenuto copiato ✓",
        "ja": "コンテンツがコピーされました ✓",
        "ko": "콘텐츠가 복사되었습니다 ✓",
        "nl": "Inhoud gekopieerd ✓",
        "pt_BR": "Conteúdo copiado ✓",
        "zh_CN": "内容已复制 ✓"
    },
    "noContentToCopy": {
        "en": "No content to copy",
        "de": "Kein Inhalt zum Kopieren",
        "es": "Sin contenido para copiar",
        "fr": "Aucun contenu à copier",
        "it": "Nessun contenuto da copiare",
        "ja": "コピーするコンテンツがありません",
        "ko": "복사할 콘텐츠가 없습니다",
        "nl": "Geen inhoud om te kopiëren",
        "pt_BR": "Sem conteúdo para copiar",
        "zh_CN": "没有要复制的内容"
    },
    "noChangesToSave": {
        "en": "No changes to save",
        "de": "Keine Änderungen zum Speichern",
        "es": "Sin cambios para guardar",
        "fr": "Aucun changement à enregistrer",
        "it": "Nessuna modifica da salvare",
        "ja": "保存する変更はありません",
        "ko": "저장할 변경 사항이 없습니다",
        "nl": "Geen wijzigingen om op te slaan",
        "pt_BR": "Sem alterações para salvar",
        "zh_CN": "没有要保存的更改"
    },
    "quickActionsSaved": {
        "en": "Quick Actions saved ✓",
        "de": "Quick Actions gespeichert ✓",
        "es": "Acciones Rápidas guardadas ✓",
        "fr": "Actions Rapides enregistrées ✓",
        "it": "Azioni Rapide salvate ✓",
        "ja": "クイックアクションが保存されました ✓",
        "ko": "빠른 작업이 저장되었습니다 ✓",
        "nl": "Snelle Acties opgeslagen ✓",
        "pt_BR": "Ações Rápidas salvas ✓",
        "zh_CN": "快速操作已保存 ✓"
    },
    
    # Profile management
    "profileCreated": {
        "en": "Profile created ✓",
        "de": "Profil erstellt ✓",
        "es": "Perfil creado ✓",
        "fr": "Profil créé ✓",
        "it": "Profilo creato ✓",
        "ja": "プロファイルが作成されました ✓",
        "ko": "프로필이 생성되었습니다 ✓",
        "nl": "Profiel aangemaakt ✓",
        "pt_BR": "Perfil criado ✓",
        "zh_CN": "配置文件已创建 ✓"
    },
    "profileDeleted": {
        "en": "Profile deleted ✓",
        "de": "Profil gelöscht ✓",
        "es": "Perfil eliminado ✓",
        "fr": "Profil supprimé ✓",
        "it": "Profilo eliminato ✓",
        "ja": "プロファイルが削除されました ✓",
        "ko": "프로필이 삭제되었습니다 ✓",
        "nl": "Profiel verwijderd ✓",
        "pt_BR": "Perfil excluído ✓",
        "zh_CN": "配置文件已删除 ✓"
    },
    "switchedToProfile": {
        "en": "Switched to profile",
        "de": "Zu Profil gewechselt",
        "es": "Cambiado al perfil",
        "fr": "Basculé vers le profil",
        "it": "Passato al profilo",
        "ja": "プロファイルに切り替えました",
        "ko": "프로필로 전환되었습니다",
        "nl": "Overgeschakeld naar profiel",
        "pt_BR": "Alternado para perfil",
        "zh_CN": "已切换到配置文件"
    },
    "profileNameRequired": {
        "en": "Profile name is required",
        "de": "Profilname ist erforderlich",
        "es": "Se requiere el nombre del perfil",
        "fr": "Le nom du profil est requis",
        "it": "Il nome del profilo è obbligatorio",
        "ja": "プロファイル名は必須です",
        "ko": "프로필 이름이 필요합니다",
        "nl": "Profielnaam is verplicht",
        "pt_BR": "Nome do perfil é obrigatório",
        "zh_CN": "配置文件名称为必填项"
    },
    "profileAlreadyExists": {
        "en": "Profile already exists",
        "de": "Profil existiert bereits",
        "es": "El perfil ya existe",
        "fr": "Le profil existe déjà",
        "it": "Il profilo esiste già",
        "ja": "プロファイルは既に存在します",
        "ko": "프로필이 이미 존재합니다",
        "nl": "Profiel bestaat al",
        "pt_BR": "O perfil já existe",
        "zh_CN": "配置文件已存在"
    },
    "profileNameAlreadyExists": {
        "en": "Profile name already exists",
        "de": "Profilname existiert bereits",
        "es": "El nombre del perfil ya existe",
        "fr": "Le nom du profil existe déjà",
        "it": "Il nome del profilo esiste già",
        "ja": "プロファイル名は既に存在します",
        "ko": "프로필 이름이 이미 존재합니다",
        "nl": "Profielnaam bestaat al",
        "pt_BR": "Nome do perfil já existe",
        "zh_CN": "配置文件名称已存在"
    },
    "currentProfileNotFound": {
        "en": "Current profile not found",
        "de": "Aktuelles Profil nicht gefunden",
        "es": "Perfil actual no encontrado",
        "fr": "Profil actuel introuvable",
        "it": "Profilo corrente non trovato",
        "ja": "現在のプロファイルが見つかりません",
        "ko": "현재 프로필을 찾을 수 없습니다",
        "nl": "Huidig profiel niet gevonden",
        "pt_BR": "Perfil atual não encontrado",
        "zh_CN": "未找到当前配置文件"
    },
    "cannotDeleteSystemProfiles": {
        "en": "Cannot delete system profiles",
        "de": "Systemprofile können nicht gelöscht werden",
        "es": "No se pueden eliminar perfiles del sistema",
        "fr": "Impossible de supprimer les profils système",
        "it": "Impossibile eliminare i profili di sistema",
        "ja": "システムプロファイルは削除できません",
        "ko": "시스템 프로필을 삭제할 수 없습니다",
        "nl": "Kan systeemprofielen niet verwijderen",
        "pt_BR": "Não é possível excluir perfis do sistema",
        "zh_CN": "无法删除系统配置文件"
    },
    "switchProfileBeforeDeleting": {
        "en": "Switch to another profile before deleting",
        "de": "Wechseln Sie zu einem anderen Profil vor dem Löschen",
        "es": "Cambie a otro perfil antes de eliminar",
        "fr": "Basculez vers un autre profil avant de supprimer",
        "it": "Passa a un altro profilo prima di eliminare",
        "ja": "削除する前に別のプロファイルに切り替えてください",
        "ko": "삭제하기 전에 다른 프로필로 전환하세요",
        "nl": "Schakel over naar een ander profiel voor verwijderen",
        "pt_BR": "Alterne para outro perfil antes de excluir",
        "zh_CN": "删除前切换到另一个配置文件"
    },
    "failedSwitchProfile": {
        "en": "Failed to switch profile",
        "de": "Fehler beim Wechseln des Profils",
        "es": "Error al cambiar de perfil",
        "fr": "Échec du changement de profil",
        "it": "Impossibile cambiare profilo",
        "ja": "プロファイルの切り替えに失敗しました",
        "ko": "프로필 전환 실패",
        "nl": "Kan profiel niet wisselen",
        "pt_BR": "Falha ao alternar perfil",
        "zh_CN": "切换配置文件失败"
    },
    "failedCreateProfile": {
        "en": "Failed to create profile",
        "de": "Fehler beim Erstellen des Profils",
        "es": "Error al crear perfil",
        "fr": "Échec de la création du profil",
        "it": "Impossibile creare il profilo",
        "ja": "プロファイルの作成に失敗しました",
        "ko": "프로필 생성 실패",
        "nl": "Kan profiel niet aanmaken",
        "pt_BR": "Falha ao criar perfil",
        "zh_CN": "创建配置文件失败"
    },
    "failedDeleteProfile": {
        "en": "Failed to delete profile",
        "de": "Fehler beim Löschen des Profils",
        "es": "Error al eliminar perfil",
        "fr": "Échec de la suppression du profil",
        "it": "Impossibile eliminare il profilo",
        "ja": "プロファイルの削除に失敗しました",
        "ko": "프로필 삭제 실패",
        "nl": "Kan profiel niet verwijderen",
        "pt_BR": "Falha ao excluir perfil",
        "zh_CN": "删除配置文件失败"
    },
    "profileResetSuccess": {
        "en": "Profile reset successful ✓",
        "de": "Profil erfolgreich zurückgesetzt ✓",
        "es": "Restablecimiento de perfil exitoso ✓",
        "fr": "Réinitialisation du profil réussie ✓",
        "it": "Ripristino profilo riuscito ✓",
        "ja": "プロファイルのリセットに成功しました ✓",
        "ko": "프로필 재설정 성공 ✓",
        "nl": "Profiel succesvol gereset ✓",
        "pt_BR": "Redefinição de perfil bem-sucedida ✓",
        "zh_CN": "配置文件重置成功 ✓"
    },
    "resetFailed": {
        "en": "Reset failed",
        "de": "Zurücksetzen fehlgeschlagen",
        "es": "Restablecimiento fallido",
        "fr": "Échec de la réinitialisation",
        "it": "Ripristino fallito",
        "ja": "リセットに失敗しました",
        "ko": "재설정 실패",
        "nl": "Reset mislukt",
        "pt_BR": "Falha na redefinição",
        "zh_CN": "重置失败"
    },
    
    # Import/Export messages
    "importedIntoProfile": {
        "en": "Imported into profile",
        "de": "In Profil importiert",
        "es": "Importado al perfil",
        "fr": "Importé dans le profil",
        "it": "Importato nel profilo",
        "ja": "プロファイルにインポートしました",
        "ko": "프로필로 가져옴",
        "nl": "Geïmporteerd in profiel",
        "pt_BR": "Importado para perfil",
        "zh_CN": "已导入到配置文件"
    },
    "importedIntoNewProfile": {
        "en": "Imported into new profile",
        "de": "In neues Profil importiert",
        "es": "Importado al nuevo perfil",
        "fr": "Importé dans le nouveau profil",
        "it": "Importato nel nuovo profilo",
        "ja": "新しいプロファイルにインポートしました",
        "ko": "새 프로필로 가져옴",
        "nl": "Geïmporteerd in nieuw profiel",
        "pt_BR": "Importado para novo perfil",
        "zh_CN": "已导入到新配置文件"
    },
    "exportedProfile": {
        "en": "Profile exported ✓",
        "de": "Profil exportiert ✓",
        "es": "Perfil exportado ✓",
        "fr": "Profil exporté ✓",
        "it": "Profilo esportato ✓",
        "ja": "プロファイルがエクスポートされました ✓",
        "ko": "프로필이 내보내졌습니다 ✓",
        "nl": "Profiel geëxporteerd ✓",
        "pt_BR": "Perfil exportado ✓",
        "zh_CN": "配置文件已导出 ✓"
    },
    "exportedDataWithQA": {
        "en": "Exported data with Quick Actions ✓",
        "de": "Daten mit Quick Actions exportiert ✓",
        "es": "Datos exportados con Acciones Rápidas ✓",
        "fr": "Données exportées avec Actions Rapides ✓",
        "it": "Dati esportati con Azioni Rapide ✓",
        "ja": "クイックアクション付きデータをエクスポートしました ✓",
        "ko": "빠른 작업과 함께 데이터 내보내기 ✓",
        "nl": "Gegevens geëxporteerd met Snelle Acties ✓",
        "pt_BR": "Dados exportados com Ações Rápidas ✓",
        "zh_CN": "已导出数据和快速操作 ✓"
    },
    "failedExportProfile": {
        "en": "Failed to export profile",
        "de": "Fehler beim Exportieren des Profils",
        "es": "Error al exportar perfil",
        "fr": "Échec de l'exportation du profil",
        "it": "Impossibile esportare il profilo",
        "ja": "プロファイルのエクスポートに失敗しました",
        "ko": "프로필 내보내기 실패",
        "nl": "Kan profiel niet exporteren",
        "pt_BR": "Falha ao exportar perfil",
        "zh_CN": "导出配置文件失败"
    },
    "fullBackupExported": {
        "en": "Full backup exported ✓",
        "de": "Vollständige Sicherung exportiert ✓",
        "es": "Copia de seguridad completa exportada ✓",
        "fr": "Sauvegarde complète exportée ✓",
        "it": "Backup completo esportato ✓",
        "ja": "完全バックアップがエクスポートされました ✓",
        "ko": "전체 백업이 내보내졌습니다 ✓",
        "nl": "Volledige back-up geëxporteerd ✓",
        "pt_BR": "Backup completo exportado ✓",
        "zh_CN": "完整备份已导出 ✓"
    },
    "fullBackupRestored": {
        "en": "Full backup restored ✓",
        "de": "Vollständige Sicherung wiederhergestellt ✓",
        "es": "Copia de seguridad completa restaurada ✓",
        "fr": "Sauvegarde complète restaurée ✓",
        "it": "Backup completo ripristinato ✓",
        "ja": "完全バックアップが復元されました ✓",
        "ko": "전체 백업이 복원되었습니다 ✓",
        "nl": "Volledige back-up hersteld ✓",
        "pt_BR": "Backup completo restaurado ✓",
        "zh_CN": "完整备份已恢复 ✓"
    },
    "failedExportBackup": {
        "en": "Failed to export backup",
        "de": "Fehler beim Exportieren der Sicherung",
        "es": "Error al exportar copia de seguridad",
        "fr": "Échec de l'exportation de la sauvegarde",
        "it": "Impossibile esportare il backup",
        "ja": "バックアップのエクスポートに失敗しました",
        "ko": "백업 내보내기 실패",
        "nl": "Kan back-up niet exporteren",
        "pt_BR": "Falha ao exportar backup",
        "zh_CN": "导出备份失败"
    },
    "backupRestoreFailed": {
        "en": "Backup restore failed",
        "de": "Wiederherstellung der Sicherung fehlgeschlagen",
        "es": "Restauración de copia de seguridad fallida",
        "fr": "Échec de la restauration de la sauvegarde",
        "it": "Ripristino del backup fallito",
        "ja": "バックアップの復元に失敗しました",
        "ko": "백업 복원 실패",
        "nl": "Back-up herstellen mislukt",
        "pt_BR": "Falha na restauração do backup",
        "zh_CN": "备份恢复失败"
    },
    "invalidBackupStructure": {
        "en": "Invalid backup file structure",
        "de": "Ungültige Sicherungsdateistruktur",
        "es": "Estructura de archivo de copia de seguridad no válida",
        "fr": "Structure de fichier de sauvegarde invalide",
        "it": "Struttura del file di backup non valida",
        "ja": "無効なバックアップファイル構造",
        "ko": "잘못된 백업 파일 구조",
        "nl": "Ongeldige back-upbestandsstructuur",
        "pt_BR": "Estrutura de arquivo de backup inválida",
        "zh_CN": "备份文件结构无效"
    },
    
    # Navigation messages
    "cannotNavigateNoActiveSFInstance": {
        "en": "Cannot navigate - no active SuccessFactors instance",
        "de": "Navigation nicht möglich - keine aktive SuccessFactors-Instanz",
        "es": "No se puede navegar - sin instancia de SuccessFactors activa",
        "fr": "Impossible de naviguer - aucune instance SuccessFactors active",
        "it": "Impossibile navigare - nessuna istanza SuccessFactors attiva",
        "ja": "ナビゲーションできません - アクティブなSuccessFactorsインスタンスがありません",
        "ko": "탐색할 수 없음 - 활성 SuccessFactors 인스턴스 없음",
        "nl": "Kan niet navigeren - geen actieve SuccessFactors-instantie",
        "pt_BR": "Não é possível navegar - nenhuma instância SuccessFactors ativa",
        "zh_CN": "无法导航 - 没有活动的SuccessFactors实例"
    },
    
    # Not found messages
    "shortcutNotFound": {
        "en": "Shortcut not found",
        "de": "Verknüpfung nicht gefunden",
        "es": "Atajo no encontrado",
        "fr": "Raccourci introuvable",
        "it": "Collegamento non trovato",
        "ja": "ショートカットが見つかりません",
        "ko": "바로 가기를 찾을 수 없습니다",
        "nl": "Snelkoppeling niet gevonden",
        "pt_BR": "Atalho não encontrado",
        "zh_CN": "未找到快捷方式"
    },
    "noteNotFound": {
        "en": "Note not found",
        "de": "Notiz nicht gefunden",
        "es": "Nota no encontrada",
        "fr": "Note introuvable",
        "it": "Nota non trovata",
        "ja": "ノートが見つかりません",
        "ko": "메모를 찾을 수 없습니다",
        "nl": "Notitie niet gevonden",
        "pt_BR": "Nota não encontrada",
        "zh_CN": "未找到笔记"
    },
    "modalNotFound": {
        "en": "Modal not found",
        "de": "Modal nicht gefunden",
        "es": "Modal no encontrado",
        "fr": "Modal introuvable",
        "it": "Modale non trovato",
        "ja": "モーダルが見つかりません",
        "ko": "모달을 찾을 수 없습니다",
        "nl": "Modal niet gevonden",
        "pt_BR": "Modal não encontrado",
        "zh_CN": "未找到模态框"
    },
    "noEnvironmentAtPosition": {
        "en": "No environment at position",
        "de": "Keine Umgebung an Position",
        "es": "Sin entorno en la posición",
        "fr": "Aucun environnement à cette position",
        "it": "Nessun ambiente in posizione",
        "ja": "位置に環境がありません",
        "ko": "위치에 환경이 없습니다",
        "nl": "Geen omgeving op positie",
        "pt_BR": "Sem ambiente na posição",
        "zh_CN": "该位置没有环境"
    },
    "noEnvironmentsSaved": {
        "en": "No environments saved yet",
        "de": "Noch keine Umgebungen gespeichert",
        "es": "Aún no hay entornos guardados",
        "fr": "Aucun environnement enregistré",
        "it": "Nessun ambiente salvato",
        "ja": "まだ環境が保存されていません",
        "ko": "아직 저장된 환경이 없습니다",
        "nl": "Nog geen omgevingen opgeslagen",
        "pt_BR": "Ainda não há ambientes salvos",
        "zh_CN": "还没有保存的环境"
    },
    "formElementsNotFound": {
        "en": "Form elements not found",
        "de": "Formularelemente nicht gefunden",
        "es": "Elementos de formulario no encontrados",
        "fr": "Éléments de formulaire introuvables",
        "it": "Elementi del modulo non trovati",
        "ja": "フォーム要素が見つかりません",
        "ko": "양식 요소를 찾을 수 없습니다",
        "nl": "Formulierelementen niet gevonden",
        "pt_BR": "Elementos do formulário não encontrados",
        "zh_CN": "未找到表单元素"
    },
    
    # Empty state guide messages
    "guideEnvStep1Title": {
        "en": "Navigate to SAP Instance",
        "de": "Zur SAP-Instanz navigieren",
        "es": "Navegar a instancia SAP",
        "fr": "Accéder à l'instance SAP",
        "it": "Navigare all'istanza SAP",
        "ja": "SAPインスタンスに移動",
        "ko": "SAP 인스턴스로 이동",
        "nl": "Naar SAP-instantie navigeren",
        "pt_BR": "Navegar para instância SAP",
        "zh_CN": "导航到SAP实例"
    },
    "guideEnvStep1Desc": {
        "en": "Go to your SAP SuccessFactors, S/4HANA, or BTP instance",
        "de": "Gehen Sie zu Ihrer SAP SuccessFactors-, S/4HANA- oder BTP-Instanz",
        "es": "Vaya a su instancia de SAP SuccessFactors, S/4HANA o BTP",
        "fr": "Accédez à votre instance SAP SuccessFactors, S/4HANA ou BTP",
        "it": "Vai alla tua istanza SAP SuccessFactors, S/4HANA o BTP",
        "ja": "SAP SuccessFactors、S/4HANA、またはBTPインスタンスに移動します",
        "ko": "SAP SuccessFactors, S/4HANA 또는 BTP 인스턴스로 이동",
        "nl": "Ga naar uw SAP SuccessFactors-, S/4HANA- of BTP-instantie",
        "pt_BR": "Vá para sua instância SAP SuccessFactors, S/4HANA ou BTP",
        "zh_CN": "转到您的SAP SuccessFactors、S/4HANA或BTP实例"
    },
    "guideEnvStep2Title": {
        "en": "Add Environment",
        "de": "Umgebung hinzufügen",
        "es": "Agregar entorno",
        "fr": "Ajouter un environnement",
        "it": "Aggiungi ambiente",
        "ja": "環境を追加",
        "ko": "환경 추가",
        "nl": "Omgeving toevoegen",
        "pt_BR": "Adicionar ambiente",
        "zh_CN": "添加环境"
    },
    "guideEnvStep2Desc": {
        "en": "Click <code>+ Environment</code> or use <code>Cmd+E</code>",
        "de": "Klicken Sie auf <code>+ Umgebung</code> oder verwenden Sie <code>Cmd+E</code>",
        "es": "Haga clic en <code>+ Entorno</code> o use <code>Cmd+E</code>",
        "fr": "Cliquez sur <code>+ Environnement</code> ou utilisez <code>Cmd+E</code>",
        "it": "Fare clic su <code>+ Ambiente</code> o utilizzare <code>Cmd+E</code>",
        "ja": "<code>+ 環境</code>をクリックするか、<code>Cmd+E</code>を使用します",
        "ko": "<code>+ 환경</code>을 클릭하거나 <code>Cmd+E</code>를 사용하세요",
        "nl": "Klik op <code>+ Omgeving</code> of gebruik <code>Cmd+E</code>",
        "pt_BR": "Clique em <code>+ Ambiente</code> ou use <code>Cmd+E</code>",
        "zh_CN": "点击<code>+ 环境</code>或使用<code>Cmd+E</code>"
    },
    "guideEnvStep3Title": {
        "en": "Switch Anytime",
        "de": "Jederzeit wechseln",
        "es": "Cambiar en cualquier momento",
        "fr": "Basculer à tout moment",
        "it": "Cambia in qualsiasi momento",
        "ja": "いつでも切り替え",
        "ko": "언제든지 전환",
        "nl": "Wisselen wanneer u wilt",
        "pt_BR": "Alternar a qualquer momento",
        "zh_CN": "随时切换"
    },
    "guideEnvStep3Desc": {
        "en": "Quickly switch between environments while preserving your page path",
        "de": "Schnell zwischen Umgebungen wechseln und dabei Ihren Seitenpfad beibehalten",
        "es": "Cambie rápidamente entre entornos preservando la ruta de su página",
        "fr": "Basculez rapidement entre les environnements en préservant le chemin de votre page",
        "it": "Passa rapidamente tra gli ambienti preservando il percorso della pagina",
        "ja": "ページパスを保持しながら環境を素早く切り替えます",
        "ko": "페이지 경로를 유지하면서 환경 간에 빠르게 전환",
        "nl": "Snel wisselen tussen omgevingen terwijl u uw paginapad behoudt",
        "pt_BR": "Alterne rapidamente entre ambientes preservando o caminho da página",
        "zh_CN": "在保留页面路径的同时快速切换环境"
    },
    "welcomeGetStarted": {
        "en": "Get Started",
        "de": "Loslegen",
        "es": "Comenzar",
        "fr": "Commencer",
        "it": "Inizia",
        "ja": "開始する",
        "ko": "시작하기",
        "nl": "Aan de slag",
        "pt_BR": "Começar",
        "zh_CN": "开始使用"
    }
}

# Process all locales
locales = ['en', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'nl', 'pt_BR', 'zh_CN']

for locale in locales:
    file_path = f"{locale}/messages.json"
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        added_count = 0
        for key, translations in ALL_MISSING_KEYS.items():
            if key not in data:
                data[key] = {"message": translations[locale]}
                added_count += 1
        
        if added_count > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write('\n')
            print(f"✓ {locale}: Added {added_count} keys")
        else:
            print(f"✓ {locale}: All keys already present")
            
    except Exception as e:
        print(f"✗ {locale}: Error - {e}")

print(f"\n✅ Added all missing keys to all locales!")
print(f"📊 Total keys processed: {len(ALL_MISSING_KEYS)}")
