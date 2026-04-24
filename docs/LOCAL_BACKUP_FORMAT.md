# MentaCut · Local backup format

## Objetivo
Respaldar proyectos locales del editor en JSON para poder exportarlos, guardarlos fuera del navegador e importarlos después.

## Formato
```json
{
  "app": "MentaCut",
  "version": 1,
  "exportedAt": "2026-04-24T12:00:00.000Z",
  "projects": []
}
```

## Notas
- `projects` usa la estructura real de `LocalProject`.
- Este backup guarda el estado del proyecto local y sus clips.
- La media binaria en IndexedDB sigue siendo una capa separada.
- La importación debe validar `app === "MentaCut"` y `version === 1`.

## Estado actual
La base de export/import del backup local ya está preparada en `lib/local-store.ts`.
